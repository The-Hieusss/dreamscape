import type { SceneObject } from "./types";
import {
  villageBaseHeight,
  villageHeight,
  isVillagePath,
} from "./villageTerrain.ts";
const kit = "/models/Medieval/Village Pack/";
function createVillage(): SceneObject[] {
  const objects: SceneObject[] = [];
  let seed = 15831;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function add(
    file: string,
    type: string,
    x: number,
    z: number,
    size: number,
    yaw = 0,
  ) {
    objects.push({
      type,
      modelPath: file.startsWith("/") ? file : kit + file,
      position: [
        x,
        type === "path" ? villageBaseHeight(x, z) : villageHeight(x, z),
        z,
      ],
      rotation: [0, yaw, 0],
      size,
      quantity: 1,
    });
  }
  const buildings: [string, number, number, number, number, number][] = [
    ["Fantasy Inn.glb", -13, -18, 2.3, 0, 7],
    ["Mill.glb", 14, -18, 2.4, 0, 6],
    ["Blacksmith.glb", -24, -11, 1.8, Math.PI / 2, 5],
    ["Fantasy Barracks.glb", 25, -8, 2.4, -Math.PI / 2, 4],
    ["Fantasy House.glb", -24, -23, 2.3, 0, 4],
    ["Fantasy House-BH2XHWUNmF.glb", -24, 6, 2.2, Math.PI / 2, 4.5],
    ["Fantasy House-dcPho4SUA3.glb", -8, 17, 2.3, Math.PI, 4.5],
    ["Fantasy House-BH2XHWUNmF.glb", 8, 17, 2.2, Math.PI, 4.5],
    ["Fantasy Stable.glb", 21, 21, 2.1, Math.PI, 6],
    ["Fantasy Sawmill.glb", -21, 21, 2, Math.PI, 6],
    ["Bell Tower.glb", 25, 6, 2.6, -Math.PI / 2, 4],
    ["Gazebo.glb", 9, -6, 2, 0, 2],
  ];
  buildings.forEach(([file, x, z, size, yaw]) =>
    add(file, "building", x, z, size, yaw),
  );
  // Cobblestone court and connected lanes; tile pitch matches the model's length.
  for (let col = -3; col <= 3; col++)
    for (const z of [-3.5, 0, 3.5])
      add("Path Straight.glb", "path", col * 1.8, z, 3.6);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      add("Path Straight.glb", "path", 0, side * (7 + i * 3.5), 3.6);
      add(
        "Path Straight.glb",
        "path",
        side * (8.05 + i * 3.5),
        0,
        3.6,
        Math.PI / 2,
      );
    }
    for (const z of [-10, 10])
      for (let i = 0; i < 8; i++)
        add(
          "Path Straight.glb",
          "path",
          side * (2.65 + i * 3.5),
          z,
          3.6,
          Math.PI / 2,
        );
  }
  add("Well.glb", "well", 0, 1, 1.7);
  for (const [x, z, yaw] of [
    [-4, -3, 0],
    [4, -3, 0],
    [-4, 3.5, Math.PI],
    [4, 3.5, Math.PI],
  ]) {
    add(
      x < 0 ? "Market Stand.glb" : "Market Stand-DGIM5HGISb.glb",
      "market stall",
      x,
      z,
      2,
      yaw,
    );
    add("Crate.glb", "crate", x + (x < 0 ? -1 : 1), z + 0.7, 3.2);
    add("Barrel.glb", "barrel", x + (x < 0 ? -1 : 1), z - 0.5, 3);
    add("Bags.glb", "supplies", x + 0.6, z + 0.8, 2.5);
  }
  add("Cart.glb", "cart", 6, -5.5, 2, Math.PI / 2);
  add("Bench.glb", "bench", -2.5, -5, 2.5);
  add("Bench-7uSlZo3n9Y.glb", "bench", 2.5, 5, 2.5, Math.PI);
  add("Cauldron.glb", "cauldron", -20, -7, 2.4);
  add("Bonfire.glb", "firepit", -18, -7, 2.5);
  for (const [x, z] of [
    [24, 17],
    [23, 16],
    [-20, 16],
  ])
    add("Hay.glb", "hay", x, z, 4, random() * Math.PI);
  add("Cart.glb", "cart", 19, 13, 2.1, 0.4);
  // Fenced gardens leave gaps where the lanes enter and exit the village.
  for (let i = -12; i <= 12; i++) {
    const x = i * 2.35;
    if (Math.abs(x) > 2)
      for (const z of [-28, 28]) add("Fence.glb", "fence", x, z, 3);
    const z = i * 2.1;
    if (Math.abs(z) > 2 && Math.abs(Math.abs(z) - 10) > 2)
      for (const x of [-30]) add("Fence.glb", "fence", x, z, 3, Math.PI / 2);
  }
  let trees = 0;
  for (let attempt = 0; attempt < 600 && trees < 42; attempt++) {
    const x = (random() - 0.5) * 68,
      z = (random() - 0.5) * 62;
    if (
      isVillagePath(x, z) ||
      Math.abs(x) < 2.4 ||
      Math.abs(z) < 2.4 ||
      Math.abs(Math.abs(z) - 10) < 2.3 ||
      (Math.abs(x) < 8 && Math.abs(z) < 7)
    )
      continue;
    if (
      buildings.some(
        ([, bx, bz, , , radius]) => Math.hypot(x - bx, z - bz) < radius + 1.7,
      )
    )
      continue;
    if (
      objects.some(
        (o) =>
          o.type === "tree" &&
          Array.isArray(o.position) &&
          Math.hypot(x - o.position[0], z - o.position[2]) < 3,
      )
    )
      continue;
    add(
      "/models/Trees/Tree.glb",
      "tree",
      x,
      z,
      0.38 + random() * 0.14,
      random() * Math.PI * 2,
    );
    trees++;
  }
  for (const [x, z] of [
    [-19, -5],
    [-17, -6],
    [20, 9],
    [22, 11],
    [-26, 16],
    [16, -12],
    [-8, -25],
    [7, 25],
  ])
    add("Rocks.glb", "rock", x, z, 3 + random() * 1.5, random() * Math.PI * 2);
  // Farmstead beyond the east gate, with a working yard north of the fields.
  const farm = "/models/Medieval/Farm Buildings/";
  for (const [file, x, z, size, yaw] of [
    ["Big Barn.glb", 46, -18, 1, 0],
    ["Barn.glb", 59, -18, 1, 0],
    ["Open Barn.glb", 46, -7, 0.9, 0],
    ["Small Barn.glb", 59, -7, 0.9, 0],
    ["Silo House.glb", 68, -17, 0.85, 0],
    ["Silo.glb", 34, -20, 0.85, 0],
    ["Tower Windmill.glb", 68, 21, 0.85, 0],
    ["ChickenCoop.glb", 34, 19, 1, Math.PI / 2],
  ] as [string, number, number, number, number][])
    add(farm + file, "farm building", x, z, size, yaw);
  for (let i = 0; i < 11; i++)
    add("Path Straight.glb", "path", 31.7 + i * 3.5, 0, 3.6, Math.PI / 2);
  for (let i = -6; i <= 6; i++)
    add("Path Straight.glb", "path", 38.5, i * 3.5, 3.6);
  // End caps reach the north and south farm gates.
  for (const z of [-23.25, 23.25])
    add("Path Straight.glb", "path", 38.5, z, 3.6);
  for (let i = 0; i < 8; i++)
    add("Path Straight.glb", "path", 40.25 + i * 3.5, 15, 3.6, Math.PI / 2);
  // Farm fences and hedgerow trees frame the enlarged settlement.
  for (let i = 0; i < 7; i++) {
    const x = 32 + i * 5.89;
    if (Math.abs(x - 38.5) > 3.5)
      for (const z of [-28, 28]) add(farm + "Fence.glb", "farm fence", x, z, 1);
  }
  for (const z of [-24, -18.1, -12.2, -6.3, 6.3, 12.2, 18.1, 24])
    add(farm + "Fence-e02PFKKhbr.glb", "farm fence", 72, z, 1, Math.PI / 2);
  for (const [x, z] of [
    [32, -25],
    [52, -26],
    [64, -26],
    [34, 26],
    [53, 29],
    [70, 29],
  ])
    add("/models/Trees/Tree.glb", "tree", x, z, 0.43, random() * Math.PI * 2);
  for (const [x, z] of [
    [42, -12],
    [50, -13],
    [54, -22],
    [63, -12],
    [34, 14],
    [34, 16],
  ])
    add("Hay.glb", "hay", x, z, 4.5, random() * Math.PI);
  add("Cart.glb", "cart", 42, -2.5, 2.2, Math.PI / 2);
  add("Barrel.glb", "barrel", 50, -6, 3, 0);
  add("Crate.glb", "crate", 50, -8, 4, 0);
  // Residents start on separate lanes, each with a different pace and route.
  for (const [index, x, z] of [
    [0, -20, -10],
    [1, 38.5, 12],
    [2, -16, 0],
    [3, 18, 0],
    [4, 54, 15],
    [5, 17, 10],
    [6, 0, -22],
    [7, 0, 20],
  ]) {
    objects.push({
      type: index < 5 ? "farmer" : "knight",
      modelPath: `/models/Characters/${index < 5 ? "Farmer" : "Knight"}.glb`,
      position: [x, villageHeight(x, z), z],
      rotation: [0, random() * Math.PI * 2, 0],
      size: 1,
      quantity: 1,
      animation: "CharacterArmature|Walk",
      speed: 0.014 + random() * 0.009,
    });
  }
  return objects;
}
export const villageObjects = createVillage();
