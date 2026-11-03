import { isVillagePath } from "../src/lib/villageTerrain.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  stepWander,
  worldBounds,
  createVillageWalk,
  stepVillageWalk,
  villageLanes,
} from "../src/lib/wandering.ts";
import { villageObjects } from "../src/lib/villagePreset.ts";
function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function inside(s, b) {
  assert.ok(s.x >= b.minX && s.x <= b.maxX && s.z >= b.minZ && s.z <= b.maxZ);
}
test("walkers turn inward at each edge and corner without becoming stuck", () => {
  const b = worldBounds("village");
  for (const [x, z, heading] of [
    [b.maxX, 0, Math.PI / 2],
    [b.minX, 0, -Math.PI / 2],
    [0, b.maxZ, 0],
    [0, b.minZ, Math.PI],
    [b.maxX, b.maxZ, Math.PI / 4],
  ]) {
    const s = { x, z, heading, turnIn: 100 };
    stepWander(s, 1.2, 1 / 60, b);
    inside(s, b);
    assert.ok(Math.abs(s.x) < Math.abs(x) || Math.abs(s.z) < Math.abs(z));
    for (let i = 0; i < 120; i++) stepWander(s, 1.2, 1 / 60, b);
    inside(s, b);
    assert.ok(Math.hypot(s.x - x, s.z - z) > 1);
  }
});
test("bounded wandering survives long runs, outside spawns and suspended frames", () => {
  const b = worldBounds("village"),
    s = { x: 90, z: -50, heading: 2, turnIn: 0 },
    random = seeded(42);
  for (let i = 0; i < 40000; i++) {
    const before = { ...s };
    stepWander(s, 3, i === 1 ? 30 : 1 / 60, b, random);
    inside(s, b);
    assert.ok(Number.isFinite(s.heading));
    if (i === 1) assert.ok(Math.hypot(s.x - before.x, s.z - before.z) <= 0.301);
  }
});
test("village residents choose varied connected routes and stay inside fences", () => {
  const a = createVillageWalk(0, -25),
    b = createVillageWalk(0, -25),
    ra = seeded(12),
    rb = seeded(91);
  const visited = new Set();
  for (let i = 0; i < 80000; i++) {
    for (const [s, random] of [
      [a, ra],
      [b, rb],
    ]) {
      const before = { ...s };
      stepVillageWalk(s, 1.2, 1 / 30, random);
      inside(s, worldBounds("village"));
      assert.ok(Math.hypot(s.x - before.x, s.z - before.z) <= 0.04001);
      assert.ok(villageLanes[s.target].neighbors.includes(s.previous));
    }
    visited.add(a.target);
  }
  assert.ok(visited.size > 10);
  assert.notDeepEqual(a, b);
});
test("preset farmers and knights have walking clips, varied speeds and lane spawns", () => {
  const residents = villageObjects.filter((o) =>
    ["farmer", "knight"].includes(o.type),
  );
  assert.equal(residents.filter((o) => o.type === "farmer").length, 5);
  assert.equal(residents.filter((o) => o.type === "knight").length, 3);
  assert.ok(new Set(residents.map((o) => o.speed)).size > 1);
  for (const o of residents) {
    assert.match(o.animation, /Walk/);
    inside({ x: o.position[0], z: o.position[2] }, worldBounds("village"));
  }
});

test("farm walking routes join the village and stay on the paved lanes", () => {
  const reached = new Set([0]),
    queue = [0];
  while (queue.length)
    for (const neighbor of villageLanes[queue.shift()].neighbors) {
      if (!reached.has(neighbor)) {
        reached.add(neighbor);
        queue.push(neighbor);
      }
    }
  assert.equal(reached.size, villageLanes.length);
  assert.ok(villageLanes.some((n) => n.x > 60));
  for (const node of villageLanes) {
    inside(node, worldBounds("village"));
    assert.ok(isVillagePath(node.x, node.z));
  }
});
