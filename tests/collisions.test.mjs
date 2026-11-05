import test from "node:test";
import assert from "node:assert/strict";
import { CollisionMap } from "../src/lib/collisions.ts";
import { createVillageWalk, stepVillageWalk } from "../src/lib/wandering.ts";

test("walking sweeps through thin fences and slides along walls", () => {
  const map = new CollisionMap();
  map.set({}, { minX: 0, maxX: 0.05, minZ: -2, maxZ: 2, minY: 0, maxY: 1 });
  assert.deepEqual(map.move({ x: -1, z: 0 }, { x: 1, z: 1 }, 0, 0.28), {
    x: -1,
    z: 1,
  });
  assert.equal(map.clear({ x: -1, z: 0 }, { x: 1, z: 0 }, 2, 0.28), true);
});

test("a diagonal fence blocks crossings but leaves space alongside it", () => {
  const map = new CollisionMap();
  map.set(
    {},
    {
      minX: -3,
      maxX: 3,
      minZ: -0.05,
      maxZ: 0.05,
      minY: 0,
      maxY: 1,
      yaw: Math.PI / 4,
    },
  );
  assert.equal(map.clear({ x: -2, z: 0 }, { x: 2, z: 0 }, 0, 0.28), false);
  assert.equal(map.clear({ x: 1, z: 1 }, { x: 2, z: 1 }, 0, 0.28), true);
});

test("a resident replans when a building is placed across its lane", () => {
  const map = new CollisionMap();
  const walk = createVillageWalk(-20, 0);
  walk.target = 6; // Junction at (-12, 0).
  stepVillageWalk(walk, 2, 0.1, () => 0, map);
  const house = {};
  map.set(house, { minX: -18, maxX: -15, minZ: -2, maxZ: 2, minY: 0, maxY: 6 });
  let detoured = false;
  for (let i = 0; i < 180; i++) {
    const from = { x: walk.x, z: walk.z };
    stepVillageWalk(walk, 2, 0.05, () => 0, map);
    assert.ok(map.clear(from, walk, 0, 0.3));
    detoured ||= Math.abs(walk.z) > 2;
    if (walk.x > -13) break;
  }
  assert.ok(detoured);
  assert.ok(walk.x > -13);
  map.remove(house);
  assert.ok(map.clear({ x: -20, z: 0 }, { x: -12, z: 0 }, 0, 0.3));
});
