import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import type { SceneObject, World } from "../lib/types";
import { ObjectFactory } from "./ObjectFactory";

export default function SceneManager({
  objects,
  world,
}: {
  objects: SceneObject[];
  world: World | null;
}) {
  const skyColor = (() => {
    switch (world?.sky_color) {
      case "pink":
        return "#ff5fa8";
      case "purple":
        return "#6b46ff";
      case "blue":
        return "#1e3a8a";
      default:
        return "#0F172A";
    }
  })();

  return (
    <Canvas camera={{ position: [5, 5, 10], fov: 60 }}>
      {/* Background color */}
      <color attach="background" args={[skyColor]} />

      {/* Optional simple sky dome that tints with skyColor */}
      <mesh scale={[500, 500, 500]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={skyColor} side={THREE.BackSide} />
      </mesh>

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <Suspense fallback={null}>
        {objects.map((obj, i) => (
          <ObjectFactory key={i} obj={obj} />
        ))}
      </Suspense>

      <OrbitControls />
    </Canvas>
  );
}
