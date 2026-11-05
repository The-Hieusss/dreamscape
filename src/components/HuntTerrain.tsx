import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { huntHeight, riverCenter } from "../lib/huntTerrain";

export default function HuntTerrain() {
  const { ground, river } = useMemo(() => {
    const ground = new THREE.PlaneGeometry(500, 500, 180, 180);
    ground.rotateX(-Math.PI / 2);
    const positions = ground.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const moss = new THREE.Color("#566e36");
    const grass = new THREE.Color("#7c8e43");
    const mud = new THREE.Color("#777053");
    const stone = new THREE.Color("#6b6d57");
    const color = new THREE.Color();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        z = positions.getZ(i);
      const height = huntHeight(x, z);
      positions.setY(i, height);
      color
        .copy(moss)
        .lerp(grass, 0.5 + 0.5 * Math.sin(x * 0.12) * Math.cos(z * 0.16));
      color.lerp(
        mud,
        1 - THREE.MathUtils.smoothstep(Math.abs(x - riverCenter(z)), 7, 17),
      );
      color.lerp(stone, THREE.MathUtils.smoothstep(height, 8, 15));
      color.toArray(colors, i * 3);
    }
    ground.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    ground.computeVertexNormals();
    const river = new THREE.PlaneGeometry(1, 500, 1, 170);
    river.rotateX(-Math.PI / 2);
    const points = river.attributes.position;
    for (let i = 0; i < points.count; i++) {
      const z = points.getZ(i);
      points.setXYZ(i, riverCenter(z) + points.getX(i) * 15, -1.05, z);
    }
    river.computeVertexNormals();
    return { ground, river };
  }, []);
  useEffect(
    () => () => {
      ground.dispose();
      river.dispose();
    },
    [ground, river],
  );
  return (
    <>
      <mesh name="terrain" geometry={ground} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
      <mesh geometry={river}>
        <meshStandardMaterial
          color="#466e61"
          roughness={0.27}
          transparent
          opacity={0.82}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
