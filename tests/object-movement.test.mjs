import test from "node:test";
import assert from "node:assert/strict";
import { groundMovement } from "../src/lib/objectMovement.ts";

function close(actual, expected) {
  actual.forEach((value, i) =>
    assert.ok(Math.abs(value - expected[i]) < 1e-10),
  );
}
test("direction buttons follow the camera while staying on the ground plane", () => {
  close(groundMovement("forward", 1, [0, -1, -1]), [0, 0, -1]);
  close(groundMovement("backward", 1, [0, -1, -1]), [0, 0, 1]);
  close(groundMovement("left", 1, [0, -1, -1]), [-1, 0, 0]);
  close(groundMovement("right", 1, [0, -1, -1]), [1, 0, 0]);
  close(groundMovement("forward", 5, [1, -1, 0]), [5, 0, 0]);
  close(groundMovement("right", 5, [1, -1, 0]), [0, 0, 5]);
});
test("angled cameras preserve the chosen move step and inverse directions cancel", () => {
  for (const [first, inverse] of [
    ["left", "right"],
    ["forward", "backward"],
  ]) {
    for (const step of [0.25, 1, 5]) {
      const offset = groundMovement(first, step, [-45, -35, -45]);
      assert.ok(Math.abs(Math.hypot(...offset) - step) < 1e-10);
      const back = groundMovement(inverse, step, [-45, -35, -45]);
      close(
        offset.map((value, i) => value + back[i]),
        [0, 0, 0],
      );
    }
  }
});
test("a vertical camera still produces a finite ground movement", () => {
  close(groundMovement("forward", 1, [0, -1, 0]), [0, 0, -1]);
});
