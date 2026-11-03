import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));
const entries = [];
const animations = {};
async function visit(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name, "en"),
  )) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await visit(path);
    else if (/\.(glb|gltf)$/i.test(entry.name)) {
      const bytes = await readFile(path);
      const url = `/${relative(publicRoot, path).split("\\").join("/")}`;
      const gltf = entry.name.endsWith(".glb")
        ? JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString())
        : JSON.parse(bytes.toString());
      const clips = (gltf.animations ?? []).map(
        (clip, index) => clip.name ?? String(index),
      );
      if (clips.length) animations[url] = clips;
      const parts = url.split("/");
      entries.push({
        path: url,
        category: parts.includes("Nature")
          ? parts.includes("Stylized Nature MegaKit")
            ? "Nature · MegaKit"
            : "Nature · Ultimate"
          : parts.includes("City Kit-glb")
            ? "City"
            : parts.at(-2),
        name: entry.name
          .replace(/\.(glb|gltf)$/i, "")
          .replace(/-[A-Za-z0-9]{10}$/, ""),
        thumbnail: `/model-thumbnails/${createHash("sha256").update(bytes).digest("hex").slice(0, 20)}.webp`,
      });
    }
  }
}
await visit(join(publicRoot, "models"));
const catalog = entries.map((entry, index) => {
  const matches = (other) =>
    other.name === entry.name && other.category === entry.category;
  return entries.filter(matches).length > 1
    ? {
        ...entry,
        name: `${entry.name} ${entries.slice(0, index).filter(matches).length + 1}`,
      }
    : entry;
});
for (const [filename, data] of [
  ["modelCatalog.json", catalog],
  ["modelAnimations.json", animations],
]) {
  const destination = new URL(`../src/config/${filename}`, import.meta.url);
  const contents = `${JSON.stringify(data, null, 2)}\n`;
  // Avoid unnecessary dev-server reloads when the catalog is unchanged.
  if ((await readFile(destination, "utf8").catch(() => "")) !== contents)
    await writeFile(destination, contents);
}
console.log(
  `Catalog: ${catalog.length} models; ${Object.keys(animations).length} animated models.`,
);
