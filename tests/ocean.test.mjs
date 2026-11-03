import test from "node:test";
import assert from "node:assert/strict";
import {
  isAquaticAnimal,
  getSwimmingHeight,
  SWIM_MIN_Y,
  SWIM_MAX_Y,
  OCEAN_FLOOR,
} from "../src/lib/ocean.ts";

test("aquatic models are recognized regardless of type labels", () => {
  for (const name of ["Fish", "Shark", "Whale"]) {
    assert.equal(isAquaticAnimal({ type: name.toLowerCase() }), true);
    assert.equal(
      isAquaticAnimal({
        type: "animal",
        modelPath: `/models/Animals/${name}.glb`,
      }),
      true,
    );
  }
  for (const type of ["coral", "seaweed", "rock", "t-rex", "cow"]) {
    assert.equal(isAquaticAnimal({ type }), false);
  }
});

test("swimming depths stay between the sea floor and water surface over time", () => {
  for (const x of [-150, -40, 0, 20, 150]) {
    for (const z of [-150, -10, 0, 80, 150]) {
      for (let time = 0; time < 3600; time += 13) {
        const y = getSwimmingHeight(x, z, time);
        assert.ok(y >= SWIM_MIN_Y && y <= SWIM_MAX_Y);
        assert.ok(y > OCEAN_FLOOR && y < 0);
      }
    }
  }
});

test("animals have varied depths and drift instead of sharing a flat floor", () => {
  assert.notEqual(getSwimmingHeight(0, 0), getSwimmingHeight(10, 20));
  assert.notEqual(getSwimmingHeight(10, 20, 0), getSwimmingHeight(10, 20, 5));
});
