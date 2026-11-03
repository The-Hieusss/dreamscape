export function woodlandPathCenter(z: number) {
  return Math.sin(z * 0.105) * 2.6 + Math.sin(z * 0.04) * 1.2;
}
export function woodlandPathWidth(z: number) {
  return 2.1 + Math.sin(z * 0.08) * 0.25;
}
export function woodlandHeight(x: number, z: number) {
  return (
    Math.sin(x * 0.11) * 0.3 +
    Math.cos(z * 0.13) * 0.4 +
    Math.max(0, -z) * 0.025
  );
}
