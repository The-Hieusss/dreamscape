import test from "node:test";
import assert from "node:assert/strict";
import { EYE_HEIGHT, roamStart, walkingStep } from "../src/lib/roaming.ts";
import { woodlandPathCenter } from "../src/lib/woodlandTerrain.ts";

test("walking uses WASD and all arrow keys with normalized diagonal speed", () => {
  const forward = walkingStep(0, new Set(["KeyW"]), 1 / 60);
  assert.ok(forward[1] < 0);
  assert.equal(forward[0], 0);
  assert.deepEqual(walkingStep(0, new Set(["ArrowUp"]), 1 / 60), forward);
  const right = walkingStep(0, new Set(["ArrowRight"]), 1 / 60);
  assert.ok(right[0] > 0);
  const diagonal = walkingStep(0, new Set(["KeyW", "KeyD"]), 1 / 60);
  assert.ok(Math.abs(Math.hypot(...diagonal) - Math.hypot(...forward)) < 1e-10);
  assert.deepEqual(
    walkingStep(0, new Set(["KeyW", "KeyS", "KeyA", "KeyD"]), 1 / 60),
    [0, 0],
  );
});
test("walking turns with the view, supports faster roaming, and clamps resume gaps", () => {
  const normal = walkingStep(Math.PI / 2, new Set(["KeyW"]), 1 / 60);
  assert.ok(normal[0] < 0 && Math.abs(normal[1]) < 1e-10);
  const faster = walkingStep(0, new Set(["KeyW", "ShiftLeft"]), 1 / 60);
  assert.ok(Math.hypot(...faster) > Math.hypot(...normal));
  assert.deepEqual(
    walkingStep(0, new Set(["KeyW"]), 10),
    walkingStep(0, new Set(["KeyW"]), 0.05),
  );
  assert.deepEqual(walkingStep(0, new Set(), 1), [0, 0]);
});
test("exploration starts on the woodland path and on a city lane", () => {
  const forest = roamStart("woodland");
  assert.equal(forest.x, woodlandPathCenter(forest.z));
  assert.ok(forest.yaw > 0 && forest.yaw < Math.PI / 2);
  assert.deepEqual(roamStart("city"), { x: -1.9, z: 20, yaw: 0 });
  assert.equal(EYE_HEIGHT, 1.75);
});
