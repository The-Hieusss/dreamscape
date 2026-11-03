import { woodlandHeight } from "./woodlandTerrain";
import { OCEAN_FLOOR } from "./ocean";
import type { WorldTheme } from "./types";

export function getTerrainHeight(
  x: number,
  z: number,
  theme?: WorldTheme,
): number {
  if (theme === "woodland") return woodlandHeight(x, z);
  if (theme === "ocean") return OCEAN_FLOOR;
  if (theme === "city") return 0;
  if (theme === "universe") return -2;
  return (Math.sin(x * 0.1) + Math.cos(z * 0.1)) * 2;
}
