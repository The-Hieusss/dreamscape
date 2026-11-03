import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const publicRoot = new URL("../public/", import.meta.url);
const catalog = JSON.parse(
  readFileSync(new URL("../src/config/modelCatalog.json", import.meta.url)),
);
function modelFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const url = new URL(
      `${encodeURIComponent(entry.name)}${entry.isDirectory() ? "/" : ""}`,
      directory,
    );
    return entry.isDirectory()
      ? modelFiles(url)
      : /\.(glb|gltf)$/i.test(entry.name)
        ? [url]
        : [];
  });
}

test("catalog covers each installed model once with distinct picker labels", () => {
  assert.equal(
    catalog.length,
    modelFiles(new URL("models/", publicRoot)).length,
  );
  assert.equal(
    new Set(catalog.map((model) => model.path)).size,
    catalog.length,
  );
  assert.equal(
    new Set(catalog.map((model) => `${model.category}/${model.name}`)).size,
    catalog.length,
  );
});

test("every model has an existing content-addressed WebP thumbnail", () => {
  for (const model of catalog) {
    const bytes = readFileSync(new URL(`.${model.path}`, publicRoot));
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 20);
    assert.equal(model.thumbnail, `/model-thumbnails/${hash}.webp`);
    const imageURL = new URL(`.${model.thumbnail}`, publicRoot);
    assert.ok(existsSync(imageURL), model.thumbnail);
    const image = readFileSync(imageURL);
    assert.equal(image.subarray(0, 4).toString(), "RIFF");
    assert.equal(image.subarray(8, 12).toString(), "WEBP");
  }
});
