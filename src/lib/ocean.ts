import type { SceneObject } from "./types";

export const OCEAN_FLOOR = -20;
export const SWIM_MIN_Y = -15;
export const SWIM_MAX_Y = -3;

export function isAquaticAnimal(
  object: Pick<SceneObject, "type" | "modelPath">,
) {
  const species =
    object.modelPath
      ?.split("/")
      .pop()
      ?.replace(/\.(glb|gltf)$/i, "") ?? object.type;
  return /^(fish|shark|whale)$/i.test(species);
}

// Position gives each animal a different depth; time adds a gentle vertical drift.
export function getSwimmingHeight(x: number, z: number, time = 0) {
  const base = -9 + Math.sin(x * 0.37 + z * 0.23) * 3;
  const drift = Math.sin(time * 0.45 + x * 0.13 + z * 0.19) * 0.8;
  return Math.max(SWIM_MIN_Y, Math.min(SWIM_MAX_Y, base + drift));
}
