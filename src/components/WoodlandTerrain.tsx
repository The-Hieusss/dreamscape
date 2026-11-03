import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  woodlandHeight,
  woodlandPathCenter,
  woodlandPathWidth,
} from "../lib/woodlandTerrain";

export default function WoodlandTerrain() {
  const geometry = useMemo(() => {
    const mesh = new THREE.PlaneGeometry(160, 160, 240, 240);
    mesh.rotateX(-Math.PI / 2);
    const positions = mesh.attributes.position;
    const colors = [];
    const grass = new THREE.Color("#748d26"),
      dirt = new THREE.Color("#b6a16a");
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        z = positions.getZ(i);
      positions.setY(i, woodlandHeight(x, z));
      const distance = Math.abs(x - woodlandPathCenter(z));
      const edge = THREE.MathUtils.smoothstep(
        distance,
        woodlandPathWidth(z) - 0.25,
        woodlandPathWidth(z) + 0.8,
      );
      const noise = Math.sin(x * 2.3 + z * 0.9) * Math.cos(z * 1.7 - x * 0.6);
      const color = dirt
        .clone()
        .lerp(grass, edge)
        .multiplyScalar(0.92 + noise * 0.08);
      colors.push(color.r, color.g, color.b);
    }
    mesh.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    mesh.computeVertexNormals();
    return mesh;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh name="terrain" geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  );
}
