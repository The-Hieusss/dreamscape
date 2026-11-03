import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { cityObjects } from "../src/lib/cityPreset.ts";
import {
  cityGroundHeight,
  CITY_ROAD_COORDINATES,
  CITY_ROAD_HALF_WIDTH,
  CITY_PAVEMENT_TOP,
  CITY_ROAD_TOP,
} from "../src/lib/cityLayout.ts";

test("city preset uses installed models with explicit, stable transforms", () => {
  assert.ok(cityObjects.length > 80);
  for (const object of cityObjects) {
    assert.ok(
      existsSync(new URL(`../public${object.modelPath}`, import.meta.url)),
      object.modelPath,
    );
    assert.ok(Array.isArray(object.position));
    assert.ok(Array.isArray(object.rotation));
    assert.equal(object.quantity, 1);
    assert.ok(object.size > 0);
  }
});
test("city road tiles form one connected ring and avenue network", () => {
  const roads = cityObjects.filter((object) => object.type === "road");
  assert.equal(roads.length, 33);
  const keys = new Set(
    roads.map((object) => `${object.position[0]},${object.position[2]}`),
  );
  assert.equal(keys.size, roads.length);
  const visited = new Set();
  const queue = [[-24, -24]];
  while (queue.length) {
    const [x, z] = queue.shift(),
      key = `${x},${z}`;
    if (!keys.has(key) || visited.has(key)) continue;
    visited.add(key);
    queue.push([x + 8, z], [x - 8, z], [x, z + 8], [x, z - 8]);
  }
  assert.equal(visited.size, keys.size);
  assert.equal(
    roads.filter((object) => object.modelPath.includes("crossing")).length,
    4,
  );
});
test("cars stay in lanes away from junction centers; buildings and lamps stay on pavements", () => {
  for (const object of cityObjects) {
    const [x, y, z] = object.position;
    if (object.type === "car") {
      assert.equal(y, CITY_ROAD_TOP);
      assert.equal(cityGroundHeight(x, z), CITY_ROAD_TOP);
      assert.ok(
        !CITY_ROAD_COORDINATES.some((cx) =>
          CITY_ROAD_COORDINATES.some(
            (cz) =>
              Math.abs(x - cx) < CITY_ROAD_HALF_WIDTH &&
              Math.abs(z - cz) < CITY_ROAD_HALF_WIDTH,
          ),
        ),
      );
    }
    if (
      ["building", "streetlight", "traffic signal", "bench"].includes(
        object.type,
      )
    ) {
      assert.equal(y, CITY_PAVEMENT_TOP);
      assert.equal(
        cityGroundHeight(x, z),
        CITY_PAVEMENT_TOP,
        `${object.type} at ${x},${z}`,
      );
    }
  }
});

test("corner and T-junction exits face their neighboring road tiles", () => {
  const roads = cityObjects.filter((object) => object.type === "road");
  const occupied = new Set(
    roads.map((object) => `${object.position[0]},${object.position[2]}`),
  );
  for (const object of roads) {
    const file = object.modelPath;
    const local = file.includes("junction")
      ? [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ]
      : file.includes("corner")
        ? [
            [1, 0],
            [0, 1],
          ]
        : file.includes("tsplit")
          ? [
              [0, -1],
              [0, 1],
              [1, 0],
            ]
          : [
              [0, -1],
              [0, 1],
            ];
    const angle = object.rotation[1];
    const actual = local
      .map(
        ([x, z]) =>
          `${Math.round(x * Math.cos(angle) + z * Math.sin(angle))},${Math.round(-x * Math.sin(angle) + z * Math.cos(angle))}`,
      )
      .sort();
    const [x, , z] = object.position;
    const expected = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]
      .filter(([dx, dz]) => occupied.has(`${x + dx * 8},${z + dz * 8}`))
      .map(([dx, dz]) => `${dx},${dz}`)
      .sort();
    assert.deepEqual(actual, expected, `Road exits at ${x},${z}`);
  }
});
