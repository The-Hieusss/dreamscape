import { villageHeight } from "./villageTerrain";
import { desertHeight } from "./desertTerrain";
import { cityGroundHeight } from "./cityLayout";
import { woodlandHeight } from "./woodlandTerrain";
import { OCEAN_FLOOR } from "./ocean";
import type { WorldTheme } from "./types";

export function getTerrainHeight(
  x: number,
  z: number,
  theme?: WorldTheme,
): number {
  if (theme === "village") return villageHeight(x,z);
  if (theme === "desert") return desertHeight(x, z);
  if (theme === "woodland") return woodlandHeight(x, z);
  if (theme === "ocean") return OCEAN_FLOOR;
  if (theme === "city") return cityGroundHeight(x, z);
  if (theme === "universe") return -2;
  return (Math.sin(x * 0.1) + Math.cos(z * 0.1)) * 2;
}
