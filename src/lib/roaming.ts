import { desertWashCenter } from "./desertTerrain.ts";
import { woodlandPathCenter } from "./woodlandTerrain.ts";

export const EYE_HEIGHT = 1.75;
export function roamStart(theme?: string) {
  if (theme === "hunt") return { x: 14, z: 170, yaw: 0 };
  if (theme === "woodland") {
    const x = woodlandPathCenter(14),
      z = 14;
    return { x, z, yaw: Math.atan2(x - woodlandPathCenter(-12), z + 12) };
  }
  if (theme === "desert")
    return {
      x: desertWashCenter(14),
      z: 14,
      yaw: Math.atan2(desertWashCenter(14) - desertWashCenter(-20), 34),
    };
  if (theme === "village") return { x: 0, z: 26, yaw: 0 };
  if (theme === "city") return { x: -1.9, z: 20, yaw: 0 };
  return { x: 0, z: 10, yaw: 0 };
}

export function walkingStep(
  yaw: number,
  keys: ReadonlySet<string>,
  delta: number,
): [number, number] {
  const forward =
    Number(keys.has("KeyW") || keys.has("ArrowUp")) -
    Number(keys.has("KeyS") || keys.has("ArrowDown"));
  const right =
    Number(keys.has("KeyD") || keys.has("ArrowRight")) -
    Number(keys.has("KeyA") || keys.has("ArrowLeft"));
  const length = Math.hypot(forward, right);
  if (!length) return [0, 0];
  const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 6.5 : 3.5;
  const distance = (speed * Math.min(0.05, Math.max(0, delta))) / length;
  return [
    (-Math.sin(yaw) * forward + Math.cos(yaw) * right) * distance,
    (-Math.cos(yaw) * forward - Math.sin(yaw) * right) * distance,
  ];
}
