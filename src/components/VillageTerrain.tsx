import VillageFarmFields from "./VillageFarmFields";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { villageBaseHeight } from "../lib/villageTerrain";
export default function VillageTerrain() {
  const geometry = useMemo(() => {
    const result = new THREE.PlaneGeometry(400, 400, 160, 160);
    result.rotateX(-Math.PI / 2);
    const positions = result.attributes.position,
      colors = [];
    const grass = new THREE.Color("#647c36"),
      meadow = new THREE.Color("#819848");
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        z = positions.getZ(i);
      positions.setY(i, villageBaseHeight(x, z));
      const noise =
        (Math.sin(x * 0.18 + z * 0.08) * Math.cos(z * 0.12 - x * 0.07) + 1) / 2;
      const color = grass.clone().lerp(meadow, noise * 0.6);
      colors.push(color.r, color.g, color.b);
    }
    result.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    result.computeVertexNormals();
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      <VillageFarmFields />
      <mesh name="terrain" geometry={geometry} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
    </>
  );
}
