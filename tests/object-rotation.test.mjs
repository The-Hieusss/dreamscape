import test from "node:test";
import assert from "node:assert/strict";
import { rotationDegrees, setRotationAxis } from "../src/lib/objectRotation.ts";

test("degree controls cover a full revolution on each axis without changing the others", () => {
  const original = [0.2, 0.4, 0.6];
  for (let axis = 0; axis < 3; axis++) {
    for (const degrees of [0, 90, 180, 270, 360]) {
      const next = setRotationAxis(original, axis, degrees);
      assert.ok(Math.abs(rotationDegrees(next)[axis] - degrees) < 1e-10);
      original.forEach((value, index) => {
        if (index !== axis) assert.equal(next[index], value);
      });
    }
  }
  assert.deepEqual(original, [0.2, 0.4, 0.6]);
});
test("ring angles display correctly when negative or beyond a complete revolution", () => {
  const result = rotationDegrees([-Math.PI / 2, Math.PI * 3, -Math.PI * 4]);
  assert.deepEqual(result, [270, 180, 0]);
  assert.deepEqual(rotationDegrees("random"), [0, 0, 0]);
});
