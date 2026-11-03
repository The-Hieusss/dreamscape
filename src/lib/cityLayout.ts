export const CITY_ROAD_COORDINATES = [-24, 0, 24];
export const CITY_ROAD_HALF_WIDTH = 4;
export const CITY_ROAD_TOP = 0.22;
export const CITY_PAVEMENT_TOP = 0.3;
export const CITY_BLOCK_CENTERS = [-12, 12];

export function cityGroundHeight(x: number, z: number) {
  if (
    CITY_BLOCK_CENTERS.some((cx) => Math.abs(x - cx) <= 8) &&
    CITY_BLOCK_CENTERS.some((cz) => Math.abs(z - cz) <= 8)
  )
    return CITY_PAVEMENT_TOP;
  const onRoad =
    Math.abs(x) <= 28 &&
    Math.abs(z) <= 28 &&
    (CITY_ROAD_COORDINATES.some(
      (road) => Math.abs(x - road) <= CITY_ROAD_HALF_WIDTH,
    ) ||
      CITY_ROAD_COORDINATES.some(
        (road) => Math.abs(z - road) <= CITY_ROAD_HALF_WIDTH,
      ));
  if (onRoad) return CITY_ROAD_TOP;
  return 0;
}
