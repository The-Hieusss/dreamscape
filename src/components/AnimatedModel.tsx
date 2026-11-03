import { getSwimmingHeight } from "../lib/ocean";
import type { WorldTheme } from "../lib/types";
// filepath: src/components/AnimatedModel.tsx
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { getTerrainHeight } from "../lib/terrain";
import { animationMap } from "../config/animationMap"; // ✅ import the mapping
import type { JSX } from "react";

// Multiplier for animation speed based on intent
const MOVE_MULT: Record<string, number> = {
  walk: 1,
  run: 1.7,
  gallop: 2.2,
  wander: 0.8,
  idle: 1,
  death: 1,
  attack: 1,
  // Add more as needed
};

type AnimatedModelProps = {
  path: string;
  terrainTheme?: WorldTheme;
  scale?: [number, number, number];
  animation?: string; // logical animation name (Walk, Run, Attack, etc.)
  loop?: boolean;
  speed?: number;
  stickToTerrain?: boolean;
  swimInWater?: boolean;
  wanderBounds?: number;
  bounceAtEdge?: boolean;
};

export default function AnimatedModel({
  path,
  terrainTheme,
  scale = [1, 1, 1],
  animation,
  loop = true,
  speed = 0.02,
  stickToTerrain = true,
  swimInWater = false,
  wanderBounds = 150,
  bounceAtEdge = false,
  ...props
}: AnimatedModelProps & JSX.IntrinsicElements["group"]) {
  const group = useRef<THREE.Group>(null);
  const targetQuat = useRef(new THREE.Quaternion());
  const heading = useRef(Math.random() * Math.PI * 2);
  const lastRandomTurn = useRef(0);

  // steering params
  const turningCooldown = 1.2; // seconds between random turns
  const turnJitter = Math.PI * 0.35;
  const steerEase = 0.12;

  const { scene, animations } = useGLTF(path);
  const cloned = useMemo(() => cloneSkeleton(scene), [scene]);
  const { actions, names } = useAnimations(animations, group);

  // Resolve species name from path, e.g. "T-Rex.glb" -> "T-Rex"
  const species = useMemo(() => {
    return path.split("/").pop()?.replace(".glb", "") ?? "";
  }, [path]);

  useEffect(() => {
    if (!actions) return;
    if (!animation) {
      names.forEach((name) => actions[name]?.stop());
      return;
    }

    // Lookup correct clip name via mapping
    let targetName = animationMap[species]?.[animation] ?? animation;

    // If exact mapping not found, try fuzzy matching
    if (!actions[targetName]) {
      const lower = targetName.toLowerCase();
      const partial = names.find((n) => n.toLowerCase().includes(lower));
      if (partial) targetName = partial;
    }

    // Fallback to Idle, then first clip
    if (!actions[targetName]) {
      if (animationMap[species]?.Idle && actions[animationMap[species].Idle]) {
        targetName = animationMap[species].Idle;
        console.warn(`[AnimatedModel] Fallback to Idle for ${species}`);
      } else {
        targetName = names[0];
        console.warn(
          `[AnimatedModel] Fallback to first clip "${targetName}" for ${species}`,
        );
      }
    }

    // Stop all other clips
    names.forEach((n) => n !== targetName && actions[n]?.stop?.());

    // Play chosen clip
    const act = actions[targetName];
    if (act) {
      act.enabled = true;
      act.reset().fadeIn(0.2).play();
      const shouldLoop = loop && !/(^|[|_])death$/i.test(animation);
      act.setLoop(shouldLoop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
      act.clampWhenFinished = !shouldLoop;

      const baseIntent =
        animation
          .split("|")
          .pop()
          ?.replace(/^TRex_/, "")
          .toLowerCase() ?? "";
      const moveMult = MOVE_MULT[baseIntent] || 1;
      act.timeScale = 1 * moveMult;
    }
  }, [actions, animation, names, loop, path, species]);

  useFrame((state, dt) => {
    if (!group.current) return;

    const moving =
      !!animation &&
      /walk|run|gallop|wander|swim/i.test(animation) &&
      speed > 0;

    if (moving) {
      const now = state.clock.getElapsedTime();

      // Random heading change
      if (now - lastRandomTurn.current > turningCooldown) {
        lastRandomTurn.current = now;
        heading.current += (Math.random() - 0.5) * turnJitter;
      }

      const { x, z } = group.current.position;
      const max = wanderBounds * 0.9;

      if (Math.abs(x) > max || Math.abs(z) > max) {
        if (bounceAtEdge) {
          // ⬅️ Bounce: instantly flip heading back inside
          heading.current += Math.PI; // turn 180 degrees
        } else {
          // ⬅️ Steer softly back toward center
          const angleToCenter = Math.atan2(-z, -x);
          heading.current = THREE.MathUtils.lerp(
            heading.current,
            angleToCenter,
            0.35,
          );
        }
      }

      // Smoothly rotate toward heading
      const currentQuat = group.current.quaternion;
      targetQuat.current.setFromEuler(new THREE.Euler(0, heading.current, 0));
      const t = 1 - Math.pow(1 - steerEase, dt * 60);
      currentQuat.slerp(targetQuat.current, t);

      // Move forward
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(
        group.current.quaternion,
      );
      group.current.position.addScaledVector(forward, speed * dt * 60);

      // ✅ Hard clamp inside bounds
      group.current.position.x = THREE.MathUtils.clamp(
        group.current.position.x,
        -wanderBounds,
        wanderBounds,
      );
      group.current.position.z = THREE.MathUtils.clamp(
        group.current.position.z,
        -wanderBounds,
        wanderBounds,
      );
    }

    if (swimInWater) {
      const { x, z } = group.current.position;
      const targetY = getSwimmingHeight(x, z, state.clock.getElapsedTime());
      group.current.position.y = THREE.MathUtils.lerp(
        group.current.position.y,
        targetY,
        1 - Math.exp(-2 * dt),
      );
    } else if (stickToTerrain) {
      const { x, z } = group.current.position;
      const terrainY = getTerrainHeight(x, z, terrainTheme);

      // Smoothly adjust Y to terrain height (prevents snapping)
      const currentY = group.current.position.y;
      const targetY = terrainY;

      // Lerp for smooth ground following
      group.current.position.y = THREE.MathUtils.lerp(currentY, targetY, 0.15);
    }
  });

  return (
    <group ref={group} {...props}>
      <primitive object={cloned} scale={scale} />
    </group>
  );
}

