import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { cityObjects } from "../src/lib/cityPreset.ts";

test("city skyline uses installed city-kit models at explicit positions", () => {
  assert.equal(cityObjects.length, 30);
  const locations = new Set();
  for (const object of cityObjects) {
    assert.ok(object.modelPath.startsWith("/models/City/City Kit-glb/"));
    assert.ok(
      existsSync(new URL(`../public${object.modelPath}`, import.meta.url)),
    );
    assert.ok(Array.isArray(object.position));
    assert.equal(object.position[1], 0);
    assert.deepEqual(object.rotation, [0, 0, 0]);
    assert.equal(object.quantity, 1);
    assert.equal(object.size, 3);
    locations.add(object.position.join(","));
  }
  assert.equal(locations.size, cityObjects.length);
  assert.equal(
    cityObjects.filter((object) => object.type === "skyscraper").length,
    6,
  );
});
