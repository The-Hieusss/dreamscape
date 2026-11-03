import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { villageObjects } from "../src/lib/villagePreset.ts";
import {
  villageBaseHeight,
  villageHeight,
  isVillagePath,
} from "../src/lib/villageTerrain.ts";
import { roamStart } from "../src/lib/roaming.ts";

test("village scenery uses installed models and rests on meadow or cobbles", () => {
  assert.ok(villageObjects.length > 200);
  for (const object of villageObjects) {
    assert.ok(
      existsSync(new URL(`../public${object.modelPath}`, import.meta.url)),
      object.modelPath,
    );
    const [x, y, z] = object.position;
    assert.equal(
      y,
      object.type === "path" ? villageBaseHeight(x, z) : villageHeight(x, z),
    );
    assert.equal(object.quantity, 1);
    assert.ok(object.size > 0);
  }
  for (const landmark of [
    "Fantasy Inn.glb",
    "Mill.glb",
    "Bell Tower.glb",
    "Well.glb",
  ])
    assert.ok(villageObjects.some((o) => o.modelPath.endsWith(landmark)));
});
test("trees leave the village lanes clear", () => {
  const trees = villageObjects.filter((o) => o.type === "tree");
  assert.ok(trees.length >= 30);
  for (const tree of trees)
    assert.equal(isVillagePath(tree.position[0], tree.position[2]), false);
});
test("walking starts on the connected entrance lane", () => {
  const start = roamStart("village");
  assert.equal(start.x, 0);
  assert.ok(isVillagePath(start.x, start.z));
  assert.equal(villageBaseHeight(start.x, start.z), 0);
  assert.equal(villageHeight(0, 0), villageHeight(start.x, start.z));
});

test("farm bundle extends the village with barns, storage and a coop", () => {
  const farm = villageObjects.filter((o) =>
    o.modelPath.includes("/Farm Buildings/"),
  );
  assert.equal(new Set(farm.map((o) => o.modelPath)).size, 10);
  assert.equal(farm.filter((o) => o.type === "farm building").length, 8);
  for (const o of farm) {
    assert.ok(o.position[0] >= 29);
    assert.equal(villageBaseHeight(o.position[0], o.position[2]), 0);
  }
});
