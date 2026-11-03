import { TransformControls } from "@react-three/drei";
import { modelAnimations } from "../lib/modelAnimations";
import type { Rotation, RotationTool } from "../lib/objectRotation";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ObjectFactory } from "./ObjectFactory";
import type { SceneObject, WorldTheme } from "../lib/types";

export default function SelectableObject({
  object,
  theme,
  selected,
  onSelect,
  rotationTool,
  onRotate,
}: {
  object: SceneObject;
  theme?: WorldTheme;
  selected: boolean;
  onSelect: () => void;
  rotationTool: RotationTool;
  onRotate: (rotation: Rotation) => void;
}) {
  const target = useRef<THREE.Group>(null!);
  const group = useRef<THREE.Group>(null);
  const outline = useMemo(() => {
    const helper = new THREE.BoxHelper(new THREE.Group(), "#fbbf24");
    helper.raycast = () => {};
    return helper;
  }, []);
  useEffect(
    () => () => {
      outline.geometry.dispose();
      (outline.material as THREE.Material).dispose();
    },
    [outline],
  );
  useFrame(() => {
    if (!group.current) return;
    group.current.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        child.computeBoundingBox();
        child.computeBoundingSphere();
      }
    });
    if (selected) outline.setFromObject(group.current);
  });

  return (
    <>
      <group
        ref={group}
        onClick={(event) => {
          if (event.delta > 4) return;
          event.stopPropagation();
          onSelect();
        }}
      >
        <ObjectFactory obj={object} theme={theme} rootRef={target} />
      </group>
      {selected && <primitive object={outline} />}
      {selected &&
        rotationTool.enabled &&
        !modelAnimations(object.modelPath).length && (
          <TransformControls
            object={target}
            mode="rotate"
            space="local"
            size={0.85}
            rotationSnap={rotationTool.snap ? Math.PI / 12 : null}
            onMouseUp={() => {
              if (target.current)
                onRotate([
                  target.current.rotation.x,
                  target.current.rotation.y,
                  target.current.rotation.z,
                ]);
            }}
          />
        )}
    </>
  );
}
