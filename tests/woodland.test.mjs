import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { woodlandObjects } from "../src/lib/woodlandPreset.ts";
import {
  woodlandHeight,
  woodlandPathCenter,
  woodlandPathWidth,
} from "../src/lib/woodlandTerrain.ts";

test("woodland uses existing MegaKit models positioned on its terrain", () => {
  assert.ok(woodlandObjects.length > 250);
  for (const object of woodlandObjects) {
    assert.ok(
      object.modelPath.startsWith("/models/Nature/Stylized Nature MegaKit/"),
    );
    assert.ok(
      existsSync(new URL(`../public${object.modelPath}`, import.meta.url)),
      object.modelPath,
    );
    const [x, y, z] = object.position;
    assert.equal(y, woodlandHeight(x, z));
    assert.equal(object.quantity, 1);
    assert.ok(Array.isArray(object.rotation));
  }
});
test("generated grass, flowers, and plants leave a clear winding trail", () => {
  for (const object of woodlandObjects.filter((object) =>
    ["grass", "plant", "flower"].includes(object.type),
  )) {
    const [x, , z] = object.position;
    assert.ok(Math.abs(x - woodlandPathCenter(z)) > woodlandPathWidth(z));
  }
  assert.notEqual(woodlandPathCenter(-20), woodlandPathCenter(10));
});
