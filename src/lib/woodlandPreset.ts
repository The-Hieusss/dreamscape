import type { SceneObject } from "./types";
import {
  woodlandHeight,
  woodlandPathCenter,
  woodlandPathWidth,
} from "./woodlandTerrain.ts";

const kit = "/models/Nature/Stylized Nature MegaKit/";
function createWoodland(): SceneObject[] {
  let seed = 62471;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const objects: SceneObject[] = [];
  function add(
    file: string,
    type: string,
    x: number,
    z: number,
    size: number,
    yaw = random() * Math.PI * 2,
  ) {
    objects.push({
      type,
      modelPath: kit + file,
      category: "Nature · MegaKit",
      position: [x, woodlandHeight(x, z), z],
      rotation: [0, yaw, 0],
      size,
      quantity: 1,
    });
  }
  const treeFiles = [
    "Tree.glb",
    "Tree-QVOop92WmG.glb",
    "Tree-aVOxaHRPWe.glb",
    "Pine.glb",
    "Pine-79gmlLnweB.glb",
    "Pine-rfnxJv0Rqa.glb",
  ];
  // Deliberate framing trees, then staggered canopy along both sides of the trail.
  add("Tree-QVOop92WmG.glb", "tree", -5.4, 12, 1.65, 0.5);
  add("Pine.glb", "tree", 8.8, 10, 1.45, 2.1);
  for (let row = 0; row < 11; row++) {
    const z = 6 - row * 4.8;
    for (const side of [-1, 1]) {
      const x = woodlandPathCenter(z) + side * (5.4 + random() * 4.5);
      add(
        treeFiles[Math.floor(random() * treeFiles.length)],
        "tree",
        x,
        z + random() * 2,
        0.85 + random() * 0.55,
      );
    }
  }
  add(
    "Twisted Tree.glb",
    "tree",
    woodlandPathCenter(-34) + 4.7,
    -34,
    0.75,
    0.8,
  );
  add("Dead Tree.glb", "tree", -11, -25, 0.7);

  // Ground cover stays outside the walking corridor, with denser foreground banks.
  for (let i = 0; i < 1050; i++) {
    const z = 16 - random() * 57;
    const side = random() < 0.5 ? -1 : 1;
    const x =
      woodlandPathCenter(z) +
      side * (woodlandPathWidth(z) + 0.65 + random() * 5.5);
    add(
      i % 5 === 0 ? "Grass Wispy.glb" : "Grass.glb",
      "grass",
      x,
      z,
      0.45 + random() * 0.45,
    );
  }
  for (let i = 0; i < 160; i++) {
    const z = 16 - random() * 53;
    const x =
      woodlandPathCenter(z) +
      (i % 2 ? -1 : 1) * (woodlandPathWidth(z) + 0.8 + random() * 5.5);
    add("Clover.glb", "plant", x, z, 0.55 + random() * 0.45);
  }
  for (let row = 0; row < 9; row++) {
    for (const side of [-1, 1]) {
      const z = 8 - row * 6;
      add(
        treeFiles[row % 3],
        "tree",
        side * (15 + random() * 5),
        z,
        1.2 + random() * 0.4,
      );
    }
  }
  for (let i = 0; i < 30; i++) {
    const z = 14 - random() * 48;
    const side = i % 2 === 0 ? -1 : 1;
    const x =
      woodlandPathCenter(z) +
      side * (woodlandPathWidth(z) + 1.1 + random() * 3.7);
    const file =
      i % 3 === 0
        ? "Fern.glb"
        : i % 3 === 1
          ? "Clover.glb"
          : "Bush with Flowers.glb";
    add(
      file,
      "plant",
      x,
      z,
      file === "Fern.glb" ? 0.23 + random() * 0.12 : 0.5 + random() * 0.35,
    );
  }
  for (let i = 0; i < 26; i++) {
    const z = 13 - random() * 45;
    const x =
      woodlandPathCenter(z) +
      (i % 2 ? -1 : 1) * (woodlandPathWidth(z) + 0.7 + random() * 1.6);
    add(
      i % 2 ? "Flower Group.glb" : "Flower Group-LqTljN6Wg2.glb",
      "flower",
      x,
      z,
      0.25 + random() * 0.2,
    );
  }
  for (const [x, z, scale] of [
    [-5.8, 14, 1.1],
    [7.5, 4, 1.3],
    [-6, -6, 1.25],
    [3, -19, 1.5],
    [-3, -34, 1.8],
    [11, -12, 1.2],
  ]) {
    add("Rock Medium.glb", "rock", x, z, scale);
  }
  for (let i = 0; i < 18; i++) {
    const z = 15 - random() * 48;
    const x =
      woodlandPathCenter(z) +
      (i % 2 ? -1 : 1) * (woodlandPathWidth(z) + 0.1 + random() * 0.6);
    add("Pebble Round.glb", "rock", x, z, 0.7 + random() * 1.4);
  }
  add("Mushroom.glb", "mushroom", -4.6, 8, 1.2);
  add("Mushroom.glb", "mushroom", 6.4, 5, 0.8);
  add("Mushroom Laetiporus.glb", "mushroom", -5.0, 11.8, 0.9);
  return objects;
}
export const woodlandObjects = createWoodland();
