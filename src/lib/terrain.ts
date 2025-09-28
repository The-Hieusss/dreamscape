export function getTerrainHeight(x: number, z: number): number {
  // same formula you use in Terrain()
  return (Math.sin(x * 0.1) + Math.cos(z * 0.1)) * 2;
}

