import { useEffect, useMemo } from "react";
import { Instance, Instances, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { foliageMaterial } from "../lib/foliageMaterial";
import { getTargetSize } from "../lib/getTargetSize";
import { woodlandHeight } from "../lib/woodlandTerrain";
import type { SceneObject } from "../lib/types";

export function isWoodlandGroundcover(object: SceneObject) {
  return (
    object.modelPath?.startsWith("/models/Nature/Stylized Nature MegaKit/") &&
    /\/(Grass|Grass Wispy|Clover)\.glb$/.test(object.modelPath)
  );
}

function CoverBatch({
  path,
  objects,
  onSelect,
}: {
  path: string;
  objects: SceneObject[];
  onSelect: (id: string) => void;
}) {
  const { scene } = useGLTF(path);
  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);
    const baseY = new THREE.Box3().setFromObject(scene).min.y;
    const result: {
      geometry: THREE.BufferGeometry;
      material: THREE.Material | THREE.Material[];
    }[] = [];
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry.clone().applyMatrix4(child.matrixWorld);
        geometry.translate(0, -baseY, 0);
        const material = Array.isArray(child.material)
          ? child.material.map(foliageMaterial)
          : foliageMaterial(child.material);
        result.push({ geometry, material });
      }
    });
    return result;
  }, [scene]);
  useEffect(
    () => () => parts.forEach((part) => part.geometry.dispose()),
    [parts],
  );
  const capacity = Math.max(256, Math.ceil(objects.length / 256) * 256);
  return (
    <>
      {parts.map((part, i) => (
        <Instances
          key={`${i}:${capacity}`}
          geometry={part.geometry}
          material={part.material}
          limit={capacity}
          frustumCulled={false}
          receiveShadow
        >
          {objects.map((object) => {
            const [x, , z] = Array.isArray(object.position)
              ? object.position
              : [0, 0, 0];
            return (
              <Instance
                key={object.editorId}
                position={[x, woodlandHeight(x, z), z]}
                rotation={
                  Array.isArray(object.rotation) ? object.rotation : [0, 0, 0]
                }
                scale={getTargetSize(object.size)}
                onClick={(event) => {
                  if (event.delta > 4) return;
                  event.stopPropagation();
                  if (object.editorId) onSelect(object.editorId);
                }}
              />
            );
          })}
        </Instances>
      ))}
    </>
  );
}

export default function WoodlandGroundcover({
  objects,
  onSelect,
}: {
  objects: SceneObject[];
  onSelect: (id: string) => void;
}) {
  const groups = new Map<string, SceneObject[]>();
  for (const object of objects) {
    if (!object.modelPath) continue;
    const group = groups.get(object.modelPath) ?? [];
    group.push(object);
    groups.set(object.modelPath, group);
  }
  return (
    <>
      {[...groups].map(([path, instances]) => (
        <CoverBatch
          key={path}
          path={path}
          objects={instances}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
