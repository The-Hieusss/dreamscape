import type { SceneObject } from "./types";
import {
  desertHeight,
  desertMesaMask,
  desertWashCenter,
} from "./desertTerrain.ts";
const nature = "/models/Nature/Stylized Nature MegaKit/";
function createDesert(): SceneObject[] {
  let seed = 30823;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const objects: SceneObject[] = [];
  const add = (
    file: string,
    type: string,
    x: number,
    z: number,
    size: number,
  ) => {
    objects.push({
      type,
      modelPath: file,
      position: [x, desertHeight(x, z), z],
      rotation: [0, random() * Math.PI * 2, 0],
      size,
      quantity: 1,
    });
  };
  // Sheltered cactus colonies sit along the wash banks rather than an even scatter.
  for (const [cx, cz] of [
    [-8, 13],
    [13, 4],
    [-12, -12],
    [15, -23],
    [-15, -34],
    [9, 27],
    [29, -8],
    [-23, 0],
  ]) {
    for (let i = 0; i < 3; i++) {
      const x = cx + (random() - 0.5) * 4.5,
        z = cz + (random() - 0.5) * 4;
      if (Math.abs(x - desertWashCenter(z)) < 4 || desertMesaMask(x, z) > 0.2)
        continue;
      add("/models/Plants/Cactus.glb", "cactus", x, z, 0.75 + random() * 0.95);
    }
  }
  // Mixed-size outcrops and their smaller talus give the large forms a natural base.
  for (const [cx, cz] of [
    [-13, 7],
    [19, -10],
    [-24, -25],
    [27, -37],
    [10, 30],
    [-25, 25],
  ]) {
    for (let i = 0; i < 3; i++)
      add(
        nature + "Rock Medium.glb",
        "rock",
        cx + (random() - 0.5) * 5,
        cz + (random() - 0.5) * 4,
        0.5 + random() * 0.85,
      );
    for (let i = 0; i < 6; i++)
      add(
        nature + "Pebble Round.glb",
        "pebble",
        cx + (random() - 0.5) * 10,
        cz + (random() - 0.5) * 9,
        0.8 + random() * 2,
      );
  }
  for (let i = 0; i < 85; i++) {
    const z = 30 - random() * 85,
      x = desertWashCenter(z) + (i % 2 ? -1 : 1) * (4 + random() * 18);
    if (desertMesaMask(x, z) > 0.3) continue;
    add(nature + "Grass Wispy.glb", "dry grass", x, z, 0.2 + random() * 0.3);
  }
  for (const [x, z] of [
    [-16, 19],
    [24, 10],
    [-20, -19],
    [16, -39],
  ])
    add(nature + "Dead Tree.glb", "dead tree", x, z, 0.18 + random() * 0.1);
  // A few half-buried-looking stones mark the dry stream, keeping a clear route.
  for (let i = 0; i < 22; i++) {
    const z = 28 - random() * 82;
    add(
      nature + "Pebble Round.glb",
      "pebble",
      desertWashCenter(z) + (random() - 0.5) * 5,
      z,
      0.4 + random() * 0.8,
    );
  }
  return objects;
}
export const desertObjects = createDesert();
