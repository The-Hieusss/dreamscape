import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useState, useCallback } from "react";
import type { SceneObject, World } from "../lib/types";
import { ObjectFactory } from "./ObjectFactory";
import * as THREE from "three";
import ThemeRenderer from "./ThemeRenderer";

// Inner scene (hooks live here)
function SceneContent({
  objects,
  world,
  onAddObject,
}: {
  objects: SceneObject[];
  world: World | null;
  onAddObject: (o: SceneObject) => void;
}) {
  const { gl, camera, scene } = useThree();
  const [raycaster] = useState(() => new THREE.Raycaster());
  const pointer = new THREE.Vector2();

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const path = event.dataTransfer?.getData("application/object-path");
      const name = event.dataTransfer?.getData("application/object-name");
      const category = event.dataTransfer?.getData(
        "application/object-category"
      );
      const rotation: [number, number, number] = [
        0,
        Math.random() * Math.PI * 2,
        0,
      ];

      if (!path) return;

      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const terrainHit = intersects.find(
        (hit) => hit.object.name === "terrain"
      );
      if (terrainHit) {
        const { x, y, z } = terrainHit.point;
        onAddObject({
          type: (name ?? "object").toLowerCase(),
          modelPath: path,
          category,
          position: [x, y, z],
          quantity: 1,
          rotation,
        });
      }
    },
    [gl, camera, scene, onAddObject, pointer, raycaster]
  );

  useEffect(() => {
    const canvas = gl.domElement;
    function onDragOver(e: DragEvent) {
      e.preventDefault();
    }
    canvas.addEventListener("dragover", onDragOver);
    canvas.addEventListener("drop", handleDrop);
    return () => {
      canvas.removeEventListener("dragover", onDragOver);
      canvas.removeEventListener("drop", handleDrop);
    };
  }, [gl, handleDrop]);

  return (
    <>
      <ThemeRenderer
        key={world?.theme ?? "default"}
        theme={world?.theme ?? "default"}
      />
      {world?.theme === "ocean" && (
        <>
          <fog attach="fog" args={["#003366", 10, 100]} />
          <hemisphereLight
            args={["#88ccee", "#003366", 0.6]}
          />
        </>
      )}
      <Suspense fallback={null}>
        {objects.map((o, i) => (
          <ObjectFactory key={i} obj={o} />
        ))}
      </Suspense>
      <OrbitControls />
    </>
  );
}

export default function SceneManager(props: {
  objects: SceneObject[];
  world: World | null;
  onAddObject: (o: SceneObject) => void;
}) {
  return (
    <Canvas camera={{ position: [10, 15, 20], fov: 60 }}>
      <SceneContent {...props} />
    </Canvas>
  );
}
