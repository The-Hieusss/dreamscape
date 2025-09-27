import { useMemo } from "react";
import type { SceneObject } from "../lib/types";

export function ObjectFactory({ obj }: { obj: SceneObject }) {
  const pos: [number, number, number] = useMemo(() => {
    if (Array.isArray(obj.position)) return obj.position;
    return [Math.random() * 20 - 10, 0, Math.random() * 20 - 10];
  }, [obj]);

  switch (obj.type) {
    // 🌲 Tree
    case "tree":
      return (
        <group position={pos}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.3, 2]} />
            <meshStandardMaterial color="sienna" />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <coneGeometry args={[1, 2, 8]} />
            <meshStandardMaterial color="green" />
          </mesh>
        </group>
      );

    // ⭐ Star
    case "star":
      return (
        <mesh position={[pos[0], pos[1] + 5, pos[2]]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial emissive="yellow" color="white" />
        </mesh>
      );

    // 🏙️ Skyscraper
    case "skyscraper":
      return (
        <mesh position={pos}>
          <boxGeometry args={[1, 6, 1]} />
          <meshStandardMaterial color={obj.color || "steelblue"} />
        </mesh>
      );

    // 🪨 Rock
    case "rock":
      return (
        <mesh position={pos} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.7, 10, 10]} />
          <meshStandardMaterial color="gray" />
        </mesh>
      );

    // 🏠 House
    case "house":
      return (
        <group position={pos}>
          {/* Base */}
          <mesh>
            <boxGeometry args={[2, 1.5, 2]} />
            <meshStandardMaterial color="lightgray" />
          </mesh>
          {/* Roof */}
          <mesh position={[0, 1.25, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[1.6, 1.2, 4]} />
            <meshStandardMaterial color="maroon" />
          </mesh>
        </group>
      );

    // 🚗 Car
    case "car":
      return (
        <group position={pos}>
          {/* Body */}
          <mesh>
            <boxGeometry args={[2, 0.5, 1]} />
            <meshStandardMaterial color={obj.color || "red"} />
          </mesh>
          {/* Wheels */}
          {[[-0.8, -0.3, 0.5], [0.8, -0.3, 0.5], [-0.8, -0.3, -0.5], [0.8, -0.3, -0.5]].map(
            (wheelPos, i) => (
              <mesh key={i} position={wheelPos as [number, number, number]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
                <meshStandardMaterial color="black" />
              </mesh>
            )
          )}
        </group>
      );

    // ☁️ Cloud
    case "cloud":
      return (
        <group position={[pos[0], pos[1] + 5, pos[2]]}>
          {[0, 1, -1].map((x, i) => (
            <mesh key={i} position={[x * 0.8, 0, 0]}>
              <sphereGeometry args={[0.8, 12, 12]} />
              <meshStandardMaterial color="white" />
            </mesh>
          ))}
        </group>
      );

    // ⛰️ Mountain
    case "mountain":
      return (
        <mesh position={pos}>
          <coneGeometry args={[4, 6, 6]} />
          <meshStandardMaterial color="dimgray" />
        </mesh>
      );

    default:
      return null;
  }
}
