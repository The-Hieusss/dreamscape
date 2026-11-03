"""Split the downloaded static road collections into compact, centered GLBs.
Original collections are retained under ~/Desktop/3D Assets/City Source.
Run with python scripts/prepare-city-assets.py after placing downloads there.
"""
from pathlib import Path
from copy import deepcopy
import json, struct, importlib.util, hashlib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / "Desktop/3D Assets/City Source"
spec = importlib.util.spec_from_file_location("thumbnail_tools", ROOT / "scripts/generate-model-thumbnails.py")
helpers = importlib.util.module_from_spec(spec); spec.loader.exec_module(helpers)


def extract_collection(path, destination):
    doc, binary = helpers.load_glb(path)
    destination.mkdir(parents=True, exist_ok=True)
    for node in doc["nodes"]:
        if "mesh" not in node:
            continue
        mesh = deepcopy(doc["meshes"][node["mesh"]])
        material_ids = sorted({primitive["material"] for primitive in mesh["primitives"] if "material" in primitive})
        material_map = {old: new for new, old in enumerate(material_ids)}
        for primitive in mesh["primitives"]:
            if "material" in primitive: primitive["material"] = material_map[primitive["material"]]
        accessor_ids = sorted({a for primitive in mesh["primitives"] for a in [*primitive["attributes"].values(), *([primitive["indices"]] if "indices" in primitive else [])]})
        accessors = [deepcopy(doc["accessors"][i]) for i in accessor_ids]
        accessor_map = {old: new for new, old in enumerate(accessor_ids)}
        out_binary = bytearray(); out_views = []
        # Collections may put every mesh in a shared interleaved buffer view.
        # Copy just this mesh's accessor elements, not the entire collection view.
        for accessor in accessors:
            view = doc["bufferViews"][accessor["bufferView"]]
            dtype = np.dtype(helpers.DTYPES[accessor["componentType"]])
            width = helpers.COUNTS[accessor["type"]]
            data = np.ndarray((accessor["count"], width), dtype=dtype, buffer=binary,
                offset=view.get("byteOffset", 0)+accessor.get("byteOffset", 0),
                strides=(view.get("byteStride", width*dtype.itemsize), dtype.itemsize)).copy().tobytes()
            out_binary.extend(b"\0"*((-len(out_binary))%4))
            new_view = {"buffer":0,"byteOffset":len(out_binary),"byteLength":len(data)}
            if "target" in view: new_view["target"] = view["target"]
            accessor["bufferView"] = len(out_views); accessor["byteOffset"] = 0
            out_views.append(new_view); out_binary.extend(data)
        for primitive in mesh["primitives"]:
            primitive["attributes"] = {key: accessor_map[value] for key, value in primitive["attributes"].items()}
            if "indices" in primitive: primitive["indices"] = accessor_map[primitive["indices"]]
        images = deepcopy(doc.get("images", []))
        for image in images:
            if "bufferView" in image:
                view = doc["bufferViews"][image.pop("bufferView")]
                start = view.get("byteOffset", 0)
                content = binary[start:start+view["byteLength"]]
                suffix = ".jpg" if image.get("mimeType") == "image/jpeg" else ".png"
                name = hashlib.sha256(content).hexdigest()[:20] + suffix
                texture_dir = destination / "textures"; texture_dir.mkdir(exist_ok=True)
                (texture_dir / name).write_bytes(content)
                image["uri"] = "textures/" + name
        matrix = helpers.node_matrix(node)
        bounds = [doc["accessors"][primitive["attributes"]["POSITION"]] for primitive in doc["meshes"][node["mesh"]]["primitives"]]
        minimum = np.array([min(a["min"][axis] for a in bounds) for axis in range(3)])
        maximum = np.array([max(a["max"][axis] for a in bounds) for axis in range(3)])
        corners = np.array([[x,y,z,1] for x in [minimum[0],maximum[0]] for y in [minimum[1],maximum[1]] for z in [minimum[2],maximum[2]]]) @ matrix.T
        lo, hi = corners[:, :3].min(axis=0), corners[:, :3].max(axis=0)
        matrix[:3, 3] -= [(lo[0]+hi[0])/2, lo[1], (lo[2]+hi[2])/2]
        result = {"asset": {"version":"2.0", "generator":"Dreamscape static road extraction"},
                  "scene":0, "scenes":[{"nodes":[0]}], "nodes":[{"mesh":0,"matrix":matrix.flatten(order="F").tolist()}],
                  "meshes":[mesh], "accessors":accessors,"bufferViews":out_views,
                  "buffers":[{"byteLength":len(out_binary)}]}
        if material_ids: result["materials"] = [deepcopy(doc["materials"][i]) for i in material_ids]
        for key in ["textures","samplers","extensionsUsed","extensionsRequired"]:
            if key in doc: result[key] = deepcopy(doc[key])
        if images: result["images"] = images
        encoded = json.dumps(result,separators=(",",":")).encode(); encoded += b" "*((-len(encoded))%4)
        out_binary.extend(b"\0"*((-len(out_binary))%4))
        glb = struct.pack("<4sII",b"glTF",2,12+8+len(encoded)+8+len(out_binary)) + struct.pack("<I4s",len(encoded),b"JSON") + encoded + struct.pack("<I4s",len(out_binary),b"BIN\0") + out_binary
        name = node.get("name",mesh.get("name","Road")).replace("-Mesh","").replace("_"," ")
        (destination / f"{name}.glb").write_bytes(glb)
    print(destination.name, ":", len(list(destination.glob("*.glb"))), "tiles")


if __name__ == "__main__":
    extract_collection(SOURCE / "Modular Road Kit by Kenney - YClppstaHV.glb", ROOT / "public/models/City/Modular Roads")
    extract_collection(SOURCE / "City Builder Bits/Road Bits.glb", ROOT / "public/models/City/Road Bits")
