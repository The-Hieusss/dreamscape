"""Offline GLB contact-sheet renderer. Requires Pillow and NumPy; no browser/GPU.
Run npm run assets:thumbnails after adding/replacing models. Existing thumbnails
are reused by content hash. This renderer targets our solid/palette low-poly assets.
"""
from pathlib import Path
from io import BytesIO
import json
import struct
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DTYPES = {5120: "i1", 5121: "u1", 5122: "<i2", 5123: "<u2", 5125: "<u4", 5126: "<f4"}
COUNTS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def load_glb(path):
    data = path.read_bytes()
    if data[:4] != b"glTF":
        raise ValueError(f"Thumbnail renderer requires GLB: {path}")
    json_length = struct.unpack_from("<I", data, 12)[0]
    document = json.loads(data[20:20 + json_length])
    offset = 20 + json_length
    binary_length = struct.unpack_from("<I", data, offset)[0]
    return document, data[offset + 8:offset + 8 + binary_length]


def node_matrix(node):
    if "matrix" in node:
        return np.array(node["matrix"]).reshape(4, 4, order="F")
    x, y, z, w = node.get("rotation", [0, 0, 0, 1])
    rotation = np.array([
        [1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
        [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
        [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)],
    ])
    result = np.eye(4)
    result[:3, :3] = rotation @ np.diag(node.get("scale", [1, 1, 1]))
    result[:3, 3] = node.get("translation", [0, 0, 0])
    return result


def draw_cutout_triangle(image, points, uv, texture, tint):
    """Rasterize alpha-tested foliage so leaf cards don't become solid squares."""
    left = max(0, int(np.floor(points[:, 0].min())))
    top = max(0, int(np.floor(points[:, 1].min())))
    right = min(image.width, int(np.ceil(points[:, 0].max())) + 1)
    bottom = min(image.height, int(np.ceil(points[:, 1].max())) + 1)
    if right <= left or bottom <= top:
        return
    a, b, c = points
    denominator = (b[1]-c[1])*(a[0]-c[0]) + (c[0]-b[0])*(a[1]-c[1])
    if abs(denominator) < 1e-8:
        return
    py, px = np.mgrid[top:bottom, left:right] + 0.5
    w0 = ((b[1]-c[1])*(px-c[0]) + (c[0]-b[0])*(py-c[1])) / denominator
    w1 = ((c[1]-a[1])*(px-c[0]) + (a[0]-c[0])*(py-c[1])) / denominator
    w2 = 1-w0-w1
    inside = (w0 >= -1e-5) & (w1 >= -1e-5) & (w2 >= -1e-5)
    coords = (w0[..., None]*uv[0] + w1[..., None]*uv[1] + w2[..., None]*uv[2]) % 1
    rgba = texture[(coords[..., 1]*(texture.shape[0]-1)).astype(int),
                   (coords[..., 0]*(texture.shape[1]-1)).astype(int)].copy()
    rgba[..., :3] = np.clip(rgba[..., :3] ** 2.2 * tint, 0, 1) ** (1/2.2)
    rgba[..., 3] *= inside
    patch = Image.fromarray((np.clip(rgba, 0, 1)*255).astype("uint8"))
    image.alpha_composite(patch, (left, top))


def render(path, output):
    doc, binary = load_glb(path)

    def accessor(index):
        a = doc["accessors"][index]
        view = doc["bufferViews"][a["bufferView"]]
        dtype = np.dtype(DTYPES[a["componentType"]])
        width = COUNTS[a["type"]]
        values = np.ndarray((a["count"], width), dtype=dtype, buffer=binary,
                            offset=view.get("byteOffset", 0) + a.get("byteOffset", 0),
                            strides=(view.get("byteStride", width * dtype.itemsize), dtype.itemsize)).copy()
        if a.get("normalized") and dtype.kind in "iu":
            values = np.maximum(-1, values.astype(float) / np.iinfo(dtype).max)
        return values

    images = {}

    def texture(index):
        image_index = doc["textures"][index]["source"]
        if image_index not in images:
            image = doc["images"][image_index]
            if "bufferView" in image:
                view = doc["bufferViews"][image["bufferView"]]
                start = view.get("byteOffset", 0)
                images[image_index] = np.asarray(Image.open(BytesIO(binary[start:start + view["byteLength"]])).convert("RGBA")) / 255
            else:
                images[image_index] = np.asarray(Image.open(path.parent / image["uri"]).convert("RGBA")) / 255
        return images[image_index]

    triangles, colors = [], []
    cutouts, base_colors = [], []

    def visit(index, parent):
        node = doc["nodes"][index]
        world = parent @ node_matrix(node)
        if "mesh" in node:
            for primitive in doc["meshes"][node["mesh"]]["primitives"]:
                attributes = primitive["attributes"]
                vertices = accessor(attributes["POSITION"])
                vertices = np.c_[vertices, np.ones(len(vertices))] @ world.T
                indices = accessor(primitive["indices"]).ravel() if "indices" in primitive else np.arange(len(vertices))
                mode = primitive.get("mode", 4)
                if mode != 4:
                    raise ValueError(f"Unsupported primitive mode {mode}: {path}")
                faces = indices.reshape(-1, 3)
                material = doc.get("materials", [{}])[primitive.get("material", 0)]
                pbr = material.get("pbrMetallicRoughness", {})
                factor = pbr.get("baseColorFactor", [0.65, 0.7, 0.75, 1])
                if factor[3] < 0.1:
                    continue
                color = np.tile(np.array(factor[:3], dtype=float), (len(faces), 1))
                if "COLOR_0" in attributes:
                    color *= accessor(attributes["COLOR_0"])[faces, :3].mean(axis=1)
                base_colors.append(color.copy())
                tex = pbr.get("baseColorTexture")
                cutout = None
                if tex and "TEXCOORD_0" in attributes:
                    image = texture(tex["index"])
                    uv = accessor(attributes["TEXCOORD_0"])[faces].mean(axis=1) % 1
                    pixels = image[(uv[:, 1] * (image.shape[0]-1)).astype(int),
                                   (uv[:, 0] * (image.shape[1]-1)).astype(int)]
                    color *= pixels[:, :3] ** 2.2
                    if material.get("alphaMode") in ("BLEND", "MASK") and np.any(image[..., 3] < 0.99):
                        cutout = (image, accessor(attributes["TEXCOORD_0"])[faces])
                cutouts.extend([(cutout[0], face_uv) for face_uv in cutout[1]] if cutout else [None]*len(faces))
                triangles.append(vertices[faces, :3])
                colors.append(color)
        for child in node.get("children", []):
            visit(child, world)

    for index in doc["scenes"][doc.get("scene", 0)]["nodes"]:
        visit(index, np.eye(4))
    tris = np.concatenate(triangles)
    color = np.concatenate(colors)
    base_color = np.concatenate(base_colors)
    center = (tris.min(axis=(0, 1)) + tris.max(axis=(0, 1))) / 2
    tris -= center
    forward = np.array([1.4, 0.95, 1.7]); forward /= np.linalg.norm(forward)
    right = np.cross([0, 1, 0], forward); right /= np.linalg.norm(right)
    up = np.cross(forward, right)
    points = tris @ np.stack([right, up, forward]).T
    lo, hi = points[:, :, :2].min(axis=(0, 1)), points[:, :, :2].max(axis=(0, 1))
    pixels = 576
    scale = (pixels * 0.82) / max(max(hi-lo), 0.001)
    xy = (points[:, :, :2] - (hi+lo)/2) * [scale, -scale] + pixels/2
    normals = np.cross(tris[:, 1] - tris[:, 0], tris[:, 2] - tris[:, 0])
    normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-10)
    light = np.array([-0.3, 0.85, 0.6]); light /= np.linalg.norm(light)
    shade = 0.45 + 0.55 * np.maximum(normals @ light, 0)
    rgb = (np.clip(color * shade[:, None], 0, 1) ** (1/2.2) * 255).astype("uint8")
    image = Image.new("RGBA", (pixels, pixels))
    draw = ImageDraw.Draw(image)
    for i in np.argsort(points[:, :, 2].mean(axis=1)):
        if cutouts[i] is not None:
            texture_image, uv = cutouts[i]
            draw_cutout_triangle(image, xy[i], uv, texture_image, base_color[i] * shade[i])
        else:
            draw.polygon([tuple(point) for point in xy[i]], fill=tuple(rgb[i]) + (255,))
    output.parent.mkdir(parents=True, exist_ok=True)
    image.resize((192, 192), Image.Resampling.LANCZOS).save(output, "WEBP", quality=85, method=6)


if __name__ == "__main__":
    catalog = json.loads((ROOT / "src/config/modelCatalog.json").read_text())
    generated = 0
    for model in catalog:
        output = PUBLIC / model["thumbnail"].lstrip("/")
        if output.exists():
            continue
        render(PUBLIC / model["path"].lstrip("/"), output)
        generated += 1
    print(f"Generated {generated} thumbnails; {len(set(m['thumbnail'] for m in catalog))} unique images.")
