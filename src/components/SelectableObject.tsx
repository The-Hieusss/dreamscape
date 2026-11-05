import { CollisionContext } from "../lib/collisionContext";
import { TransformControls } from "@react-three/drei";
import { modelAnimations } from "../lib/modelAnimations";
import type { Rotation, RotationTool } from "../lib/objectRotation";
import { useContext, useEffect, useLayoutEffect, useMemo, useRef } from "react";
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
  const collisions = useContext(CollisionContext);
  useLayoutEffect(() => {
    const root = target.current;
    if (
      !collisions ||
      !root ||
      !object.modelPath ||
      modelAnimations(object.modelPath).length
    )
      return;
    const label = `${object.type} ${object.modelPath.split("/").pop()}`;
    if (
      /\b(path|road|pavement|sidewalk|crosswalk|grass|flower|hay|decal|cloud|star)\b/i.test(
        label,
      )
    )
      return;
    if (
      !/building|house|barn|silo|coop|windmill|mill|tower|fence|wall|rock|boulder|tree|bench|well|stall|car|cart|dumpster|inn|stable|barracks|blacksmith|gazebo|skyscraper/i.test(
        label,
      )
    )
      return;
    root.updateWorldMatrix(true, true);
    const yaw = root.rotation.y;
    const inverseYaw = new THREE.Matrix4().makeRotationY(-yaw);
    const matrix = new THREE.Matrix4();
    const box = new THREE.Box3();
    const meshBox = new THREE.Box3();
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
      if (!child.geometry.boundingBox) return;
      matrix.multiplyMatrices(inverseYaw, child.matrixWorld);
      box.union(meshBox.copy(child.geometry.boundingBox).applyMatrix4(matrix));
    });
    if (box.isEmpty() || box.max.y - box.min.y <= 0.2) return;
    collisions.set(root, {
      yaw,
      minX: box.min.x,
      maxX: box.max.x,
      minZ: box.min.z,
      maxZ: box.max.z,
      minY: box.min.y,
      maxY: box.max.y,
    });
    return () => {
      collisions.remove(root);
    };
  }, [collisions, object, theme]);

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
