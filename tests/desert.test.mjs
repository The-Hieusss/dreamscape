import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { desertObjects } from "../src/lib/desertPreset.ts";
import {
  desertHeight,
  desertMesaMask,
  desertWashCenter,
  DESERT_MESAS,
} from "../src/lib/desertTerrain.ts";
import { roamStart } from "../src/lib/roaming.ts";

test("desert scenery uses installed assets at the same height as the dunes", () => {
  assert.ok(desertObjects.length > 120);
  assert.ok(desertObjects.some((o) => o.type === "cactus"));
  assert.ok(desertObjects.some((o) => o.type === "dead tree"));
  for (const object of desertObjects) {
    assert.ok(
      existsSync(new URL(`../public${object.modelPath}`, import.meta.url)),
      object.modelPath,
    );
    const [x, y, z] = object.position;
    assert.equal(y, desertHeight(x, z));
    assert.equal(object.quantity, 1);
    if (object.type === "cactus")
      assert.ok(Math.abs(x - desertWashCenter(z)) >= 4);
  }
});
test("desert has elevated mesas and continuous finite dune heights", () => {
  for (const mesa of DESERT_MESAS) {
    assert.equal(desertMesaMask(mesa.x, mesa.z), 1);
    assert.ok(desertHeight(mesa.x, mesa.z) > mesa.height - 2);
  }
  for (let x = -100; x <= 100; x += 7)
    for (let z = -100; z <= 100; z += 9) {
      const height = desertHeight(x, z);
      assert.ok(Number.isFinite(height));
      assert.ok(Math.abs(desertHeight(x + 0.01, z) - height) < 0.1);
      assert.ok(Math.abs(desertHeight(x, z + 0.01) - height) < 0.1);
    }
});
test("desert exploration starts inside the clear dry wash", () => {
  const start = roamStart("desert");
  assert.equal(start.x, desertWashCenter(start.z));
  assert.ok(Number.isFinite(start.yaw));
  assert.ok(desertMesaMask(start.x, start.z) < 0.1);
});
