import { createContext } from "react";
import type { PlayerPose } from "./FirstPersonController";

export const KNIGHT_MODEL = "/models/Characters/Knight.glb";
export const SWORD_SWING_MS = 1292;
export const PlayerView = createContext<{
  pose: PlayerPose | null;
  swingUntil: number;
} | null>(null);
