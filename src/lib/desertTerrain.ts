export const DESERT_MESAS = [
  { x: -38, z: -42, rx: 17, rz: 13, height: 17 },
  { x: 25, z: -64, rx: 20, rz: 14, height: 22 },
  { x: 57, z: -22, rx: 14, rz: 19, height: 13 },
  { x: -70, z: 12, rx: 23, rz: 16, height: 12 },
];
export function desertWashCenter(z: number) {
  return Math.sin(z * 0.045) * 6 + Math.sin(z * 0.019) * 3;
}
function mesaProfile(
  x: number,
  z: number,
  mesa: (typeof DESERT_MESAS)[number],
) {
  const dx = (x - mesa.x) / mesa.rx,
    dz = (z - mesa.z) / mesa.rz;
  const angle = Math.atan2(dz, dx);
  const radius =
    Math.hypot(dx, dz) *
      (1 +
        Math.sin(angle * 3 + mesa.x) * 0.11 +
        Math.sin(angle * 7 + mesa.z) * 0.045) +
    Math.sin(x * 0.4 + z * 0.19) * 0.025;
  const t = Math.max(0, Math.min(1, (1.12 - radius) / 0.53));
  return t * t * (3 - 2 * t);
}
export function desertMesaMask(x: number, z: number) {
  return Math.max(...DESERT_MESAS.map((mesa) => mesaProfile(x, z, mesa)));
}
export function desertHeight(x: number, z: number) {
  const wave = Math.sin((x + z * 0.28) * 0.075 + Math.sin(z * 0.027) * 0.9);
  const dunes =
    (0.5 + 0.5 * wave) ** 2 * 4.8 + Math.sin(z * 0.055 - x * 0.025) * 0.65;
  const wash = Math.exp(-Math.pow((x - desertWashCenter(z)) / 5.5, 2)) * 1.6;
  let rock = 0;
  for (const mesa of DESERT_MESAS) {
    rock += mesa.height * mesaProfile(x, z, mesa);
  }
  return dunes - wash + rock;
}
