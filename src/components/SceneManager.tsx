import WoodlandGroundcover, {
  isWoodlandGroundcover,
} from "./WoodlandGroundcover";
import type { Rotation, RotationTool } from "../lib/objectRotation";
import { groundMovement } from "../lib/objectMovement";
import type { MoveDirection } from "../lib/objectMovement";
import type { RefObject } from "react";

type MovementRef = RefObject<
  ((direction: MoveDirection, distance: number) => void) | null
>;
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  ContactShadows,
} from "@react-three/drei";
import { Suspense, useEffect, useState, useCallback } from "react";
import type { SceneObject, World } from "../lib/types";
import SelectableObject from "./SelectableObject";
import * as THREE from "three";
import ThemeRenderer from "./ThemeRenderer";

// Inner scene (hooks live here)
function SceneContent({
  objects,
  world,
  onAddObject,
  selectedId,
  onSelect,
  movementRef,
  onMove,
  rotationTool,
  onRotate,
}: {
  objects: SceneObject[];
  world: World | null;
  onAddObject: (o: SceneObject) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  movementRef: MovementRef;
  onMove: (offset: [number, number, number]) => void;
  rotationTool: RotationTool;
  onRotate: (id: string, rotation: Rotation) => void;
}) {
  const { gl, camera, scene, size } = useThree();
  const [raycaster] = useState(() => new THREE.Raycaster());
  const pointer = new THREE.Vector2();

  useEffect(() => {
    movementRef.current = (direction, distance) => {
      const view = camera.getWorldDirection(new THREE.Vector3());
      onMove(groundMovement(direction, distance, view.toArray()));
    };
    return () => {
      movementRef.current = null;
    };
  }, [camera, movementRef, onMove]);

  useEffect(() => {
    if (world?.theme === "woodland" && camera.name === "woodland-camera") {
      camera.position.set(3.4, 3.3, 17);
      camera.lookAt(-2.5, 2, -12);
      camera.updateProjectionMatrix();
    }
    if (
      world?.theme === "city" &&
      camera instanceof THREE.OrthographicCamera &&
      camera.name === "city-camera"
    ) {
      camera.position.set(65, 52, 65);
      camera.zoom = Math.min(size.width / 95, size.height / 75);
      camera.lookAt(0, 5, 2);
      camera.updateProjectionMatrix();
    }
  }, [world, camera, size.width, size.height]);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const path = event.dataTransfer?.getData("application/object-path");
      const name = event.dataTransfer?.getData("application/object-name");
      const category = event.dataTransfer?.getData(
        "application/object-category",
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
        (hit) => hit.object.name === "terrain",
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
    [gl, camera, scene, onAddObject, pointer, raycaster],
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
      {world?.theme === "woodland" && (
        <PerspectiveCamera
          name="woodland-camera"
          makeDefault
          position={[3.4, 3.3, 17]}
          fov={62}
          near={0.1}
          far={200}
        />
      )}
      {world?.theme === "city" && (
        <>
          <OrthographicCamera
            name="city-camera"
            makeDefault
            position={[65, 52, 65]}
            zoom={Math.min(size.width / 95, size.height / 75)}
            near={0.1}
            far={500}
          />
          <ContactShadows
            position={[0, 0.02, 0]}
            scale={100}
            far={25}
            opacity={0.45}
            blur={2.5}
            resolution={512}
          />
        </>
      )}
      <color attach="background" args={[world?.sky_color ?? "#88ccff"]} />
      <ThemeRenderer
        key={world?.theme ?? "default"}
        theme={world?.theme ?? "default"}
      />
      {world?.theme === "ocean" && (
        <>
          <fog attach="fog" args={["#003366", 10, 100]} />
          <hemisphereLight args={["#88ccee", "#003366", 0.6]} />
        </>
      )}
      <Suspense fallback={null}>
        {world?.theme === "woodland" && (
          <WoodlandGroundcover
            objects={objects.filter(
              (object) =>
                isWoodlandGroundcover(object) && object.editorId !== selectedId,
            )}
            onSelect={onSelect}
          />
        )}
        {objects
          .filter(
            (object) =>
              world?.theme !== "woodland" ||
              !isWoodlandGroundcover(object) ||
              object.editorId === selectedId,
          )
          .map((o) => (
            <SelectableObject
              key={o.editorId}
              object={o}
              theme={world?.theme}
              selected={o.editorId === selectedId}
              onSelect={() => onSelect(o.editorId ?? null)}
              rotationTool={rotationTool}
              onRotate={(rotation) =>
                o.editorId && onRotate(o.editorId, rotation)
              }
            />
          ))}
      </Suspense>
      <OrbitControls
        makeDefault
        target={
          world?.theme === "city"
            ? [0, 5, 2]
            : world?.theme === "woodland"
              ? [-2.5, 2, -12]
              : [0, 0, 0]
        }
        enableDamping
        dampingFactor={0.12}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}

export default function SceneManager(props: {
  objects: SceneObject[];
  world: World | null;
  onAddObject: (o: SceneObject) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  movementRef: MovementRef;
  onMove: (offset: [number, number, number]) => void;
  rotationTool: RotationTool;
  onRotate: (id: string, rotation: Rotation) => void;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [10, 15, 20], fov: 60 }}
      onPointerMissed={() => {
        if (!props.rotationTool.enabled) props.onSelect(null);
      }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
