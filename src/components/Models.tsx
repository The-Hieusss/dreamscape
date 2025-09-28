import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

type ModelProps = ThreeElements["group"] & {
  path: string;
  scale?: [number, number, number];
  cloneSkinned?: boolean;
  centerOnGround?: boolean;
};

export function Model({
  path,
  scale = [1, 1, 1],
  cloneSkinned = true,
  centerOnGround = false,
  ...props
}: ModelProps) {
  const { scene } = useGLTF(path);

  const obj = useMemo(() => {
    const cloned = cloneSkinned ? cloneSkeleton(scene) : scene.clone(true);

    if (centerOnGround) {
      const box = new THREE.Box3().setFromObject(cloned);
      const yOffset = -box.min.y; 
      cloned.position.y += yOffset; 
    }

    return cloned;
  }, [scene, cloneSkinned, centerOnGround]);

  return <primitive object={obj} scale={scale} {...props} />;
}
