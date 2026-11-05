import type { SceneObject, World } from "./types";

export const HUNT_LIMIT = 225;
export const huntSpawns = [
  { x: -39, z: 98 },
  { x: 72, z: -12 },
  { x: -84, z: -123 },
];

export function riverCenter(z: number) {
  return 22 * Math.sin(z * 0.021) + 9 * Math.sin(z * 0.049);
}

export function huntHeight(x: number, z: number) {
  const river = Math.abs(x - riverCenter(z));
  const bank = 1 - Math.exp(-((river / 17) ** 2));
  const hills =
    3.6 +
    2.5 * Math.sin(x * 0.034 + z * 0.016) +
    2.1 * Math.cos(z * 0.044 - x * 0.012) +
    1.2 * Math.sin(x * 0.093) * Math.cos(z * 0.071);
  const rim = Math.max(0, (Math.max(Math.abs(x), Math.abs(z)) - 175) / 65);
  return -2.3 + bank * (hills + 2.7) + rim * rim * 19;
}

const kit = "/models/Nature/Stylized Nature MegaKit/";
const objects: SceneObject[] = [];
let seed = 8972;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
for (let z = -212; z <= 212; z += 16) {
  for (let x = -212; x <= 212; x += 16) {
    const px = x + (random() - 0.5) * 11;
    const pz = z + (random() - 0.5) * 11;
    const river = Math.abs(px - riverCenter(pz));
    if (
      river < 10 ||
      Math.hypot(px - 14, pz - 170) < 12 ||
      huntSpawns.some((p) => Math.hypot(px - p.x, pz - p.z) < 9)
    )
      continue;
    const density = 0.44 + 0.23 * Math.sin(px * 0.05 + pz * 0.026);
    if (random() > density) continue;
    const pick = random();
    const type = pick < 0.57 ? "tree" : pick < 0.81 ? "rock" : "fern";
    const file =
      type === "tree"
        ? random() < 0.5
          ? "Tree.glb"
          : "Twisted Tree.glb"
        : type === "rock"
          ? "Rock Medium.glb"
          : "Fern.glb";
    objects.push({
      editorId: `hunt-${objects.length}`,
      type,
      modelPath: kit + file,
      position: [px, huntHeight(px, pz), pz],
      size:
        type === "tree"
          ? 1.4 + random() * 1.6
          : type === "rock"
            ? 1.7 + random() * 3
            : 1.1 + random(),
      rotation: [0, random() * Math.PI * 2, 0],
    });
  }
}

export const huntWorld: World = {
  name: "T. rex hunt",
  theme: "hunt",
  sky_color: "#a9bda4",
  terrain: "heightmap",
  objects,
};
