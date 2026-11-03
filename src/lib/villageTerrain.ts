export const FARM_PLOTS = [
  { x: 46, z: 9, width: 9, depth: 8, crop: "wheat" },
  { x: 58, z: 9, width: 9, depth: 8, crop: "greens" },
  { x: 46, z: 21, width: 9, depth: 8, crop: "greens" },
  { x: 58, z: 21, width: 9, depth: 8, crop: "wheat" },
] as const;
export const VILLAGE_PATH_HEIGHT = 0.14;
export function villageBaseHeight(x: number, z: number) {
  const edge = Math.max(
    0,
    Math.min(
      1,
      Math.hypot(Math.max(-36 - x, 0, x - 73), Math.max(Math.abs(z) - 35, 0)) /
        60,
    ),
  );
  return (
    edge *
    edge *
    (3 - 2 * edge) *
    (2.4 + Math.sin(x * 0.055) * 1.3 + Math.cos(z * 0.06) * 0.9)
  );
}
export function isVillagePath(x: number, z: number) {
  const square = Math.abs(x) <= 6.3 && Math.abs(z) <= 5.27;
  const northSouth = Math.abs(x) <= 0.9 && Math.abs(z) <= 29.8;
  const eastWest = Math.abs(z) <= 0.9 && Math.abs(x) <= 30.9;
  const lanes = Math.abs(x) <= 29 && Math.abs(Math.abs(z) - 10) <= 0.9;
  const farmRoad = x >= 29 && x <= 68.8 && Math.abs(z) <= 0.9;
  const farmLane = Math.abs(x - 38.5) <= 0.9 && z >= -25 && z <= 25;
  const fieldLane = x >= 38.5 && x <= 66.5 && Math.abs(z - 15) <= 0.9;
  return (
    square ||
    northSouth ||
    eastWest ||
    lanes ||
    farmRoad ||
    farmLane ||
    fieldLane
  );
}
export function villageHeight(x: number, z: number) {
  return (
    villageBaseHeight(x, z) + (isVillagePath(x, z) ? VILLAGE_PATH_HEIGHT : 0)
  );
}
