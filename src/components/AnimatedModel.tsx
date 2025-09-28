import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { getTerrainHeight } from "../lib/terrain";
import type { JSX } from "react";


type AnimatedModelProps = {
  path: string;
  scale?: [number, number, number];
  animation?: string;
  loop?: boolean;
  speed?: number;
  stickToTerrain?: boolean;
  wanderBounds?: number; // half-size of square area
};

export default function AnimatedModel({
  path,
  scale = [1, 1, 1],
  animation,
  loop = true,
  speed = 0.02,
  stickToTerrain = true,
  wanderBounds = 150,
  ...props
}: AnimatedModelProps & JSX.IntrinsicElements["group"]) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(path);
  const cloned = useMemo(() => cloneSkeleton(scene), [scene]);
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (!actions) return;
    let targetName = animation;

    if (targetName && !actions[targetName]) {
      const lower = targetName.toLowerCase();
      const partial = names.find((n) => n.toLowerCase().includes(lower));
      if (partial) targetName = partial;
    }
    if (!targetName || !actions[targetName]) {
      targetName = names[0];
    }
    if (!targetName) {
      console.warn("No animation clips in:", path);
      return;
    }

    names.forEach((n) => {
      if (n !== targetName && actions[n]) actions[n]!.stop();
    });

    const act = actions[targetName];
    if (act) {
      act.reset().fadeIn(0.2).play();
      act.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    }
  }, [actions, animation, names, loop, path]);

  useFrame(() => {
    if (!group.current) return;

    const wantsMove =
      !!animation &&
      /walk|run|gallop|wander/i.test(animation) &&
      speed > 0;

    if (wantsMove) {
      // Move forward
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(
        group.current.quaternion
      );
      group.current.position.addScaledVector(forward, speed);

      // Occasional random turn
      if (Math.random() < 0.01) {
        group.current.rotation.y += (Math.random() - 0.5) * Math.PI * 0.5;
      }

      // Boundary steer
      const { x, z } = group.current.position;
      if (Math.abs(x) > wanderBounds || Math.abs(z) > wanderBounds) {
        // Turn back toward center
        const angleToCenter = Math.atan2(-z, -x);
        group.current.rotation.y = angleToCenter + Math.PI / 2;
      }
    }

    if (stickToTerrain) {
      const { x, z } = group.current.position;
      group.current.position.y = getTerrainHeight(x, z);
    }
  });

  return (
    <group ref={group} {...props}>
      <primitive object={cloned} scale={scale} />
    </group>
  );
}

useGLTF.preload("/models/Animals/Cow.glb");
useGLTF.preload("/models/Animals/Horse.glb");
useGLTF.preload("/models/Animals/Sheep.glb");
useGLTF.preload("/models/Animals/Dog.glb");
useGLTF.preload("/models/Animals/T-Rex.glb");
useGLTF.preload("/models/Animals/Fish.glb");
useGLTF.preload("/models/Animals/Shark.glb");
useGLTF.preload("/models/Characters/Farmer.glb");
useGLTF.preload("/models/Characters/Adventurer.glb");

