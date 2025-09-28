// MAKE COW (and any animated object with animation property) actually move:
// 1. If obj.animation or obj.type is an animated animal -> use <AnimatedModel/> even if modelPath exists.
// 2. Pass animation + speed from the object.
// 3. Give each animated object a stable random facing rotation (already implemented).

import { useMemo, useRef } from "react";
import type { SceneObject } from "../lib/types";
import { Model } from "./Models";
import AnimatedModel from "./AnimatedModel";
import { getTargetSize } from "../lib/getTargetSize";
import { getTerrainHeight } from "../lib/terrain";

const ALTITUDE: Record<string, number> = { star: 15, sun: 30, cloud: 20 };

// Animal / animated types (extend as needed)
const ANIMATED_TYPES = new Set(["cow", "horse", "sheep", "fish", "shark"]);

export function ObjectFactory({ obj }: { obj: SceneObject }) {
  // Always recompute Y so objects stay glued to terrain
  const pos: [number, number, number] = useMemo(() => {
    const altitude = ALTITUDE[obj.type] ?? 0;
    let x: number, z: number;
    if (Array.isArray(obj.position)) {
      [x, , z] = obj.position;
    } else {
      x = Math.random() * 40 - 20;
      z = Math.random() * 40 - 20;
    }
    const baseY = getTerrainHeight(x, z);
    return [x, baseY + altitude, z];
  }, [obj]);

  // Stable random rotation
  const rotRef = useRef<[number, number, number]>(
    Array.isArray(obj.rotation)
      ? (obj.rotation as [number, number, number])
      : [0, Math.random() * Math.PI * 2, 0]
  );
  const rot = rotRef.current;

  const size = getTargetSize(typeof obj.size === "string" ? obj.size : obj.size);

  // Decide if we should treat this as animated
  const wantsAnimation = !!obj.animation || ANIMATED_TYPES.has(obj.type);

  if (wantsAnimation) {
    // Derive model path if not explicitly set
    const path =
      obj.modelPath ||
      (obj.type === "cow" && "/models/Animals/Cow.glb") ||
      (obj.type === "horse" && "/models/Animals/Horse.glb") ||
      (obj.type === "fish" && "/models/Animals/Fish.glb") ||
      (obj.type === "shark" && "/models/Animals/Shark.glb") ||
      "";

    if (!path) return null;

    return (
      <AnimatedModel
        path={path}
        position={pos}
        rotation={rot}
        scale={[size, size, size]}
        animation={obj.animation || "eating"}   
        speed={obj.speed ?? (obj.animation?.toLowerCase().includes("walk") ? 0.02 : 0)}
        stickToTerrain
      />
    );
  }

  // Static model
  if (obj.modelPath) {
    return (
      <Model
        path={obj.modelPath}
        position={pos}
        rotation={rot}
        scale={[size, size, size]}
        centerOnGround
      />
    );
  }

  return null;
}
