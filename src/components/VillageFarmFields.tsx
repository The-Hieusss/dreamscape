import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { FARM_PLOTS } from "../lib/villageTerrain";

function Crops({ wheat }: { wheat: boolean }) {
  const stalks = useRef<THREE.InstancedMesh>(null);
  const tops = useRef<THREE.InstancedMesh>(null);
  const matrices = useMemo(() => {
    const stems: THREE.Matrix4[] = [],
      heads: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();
    for (const plot of FARM_PLOTS.filter(
      (p) => (p.crop === "wheat") === wheat,
    )) {
      for (let row = 0; row < 9; row++)
        for (let col = 0; col < 13; col++) {
          const variation =
            (Math.sin(row * 12.7 + col * 7.31 + plot.x) + 1) / 2;
          const height = wheat ? 0.7 + variation * 0.3 : 0.3 + variation * 0.15;
          const x = plot.x - 3.7 + row * 0.92;
          const z = plot.z - 3.5 + col * 0.58;
          dummy.position.set(x, 0.06 + height / 2, z);
          dummy.rotation.set(0, variation * Math.PI, 0.06 * Math.sin(col));
          dummy.scale.set(1, height, 1);
          dummy.updateMatrix();
          stems.push(dummy.matrix.clone());
          dummy.position.y = 0.06 + height;
          dummy.scale.set(wheat ? 1 : 1.6, wheat ? 1 : 0.8, wheat ? 1 : 1.6);
          dummy.updateMatrix();
          heads.push(dummy.matrix.clone());
        }
    }
    return { stems, heads };
  }, [wheat]);
  useLayoutEffect(() => {
    for (const [mesh, transforms] of [
      [stalks.current, matrices.stems],
      [tops.current, matrices.heads],
    ] as const) {
      if (!mesh) continue;
      transforms.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [matrices]);
  return (
    <>
      <instancedMesh
        ref={stalks}
        args={[undefined, undefined, matrices.stems.length]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.025, 0.035, 1, 4]} />
        <meshStandardMaterial
          color={wheat ? "#b1a24a" : "#567b31"}
          roughness={1}
        />
      </instancedMesh>
      <instancedMesh
        ref={tops}
        args={[undefined, undefined, matrices.heads.length]}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[0.14, 0.4, 5]} />
        <meshStandardMaterial
          color={wheat ? "#d7b956" : "#82a543"}
          roughness={1}
        />
      </instancedMesh>
    </>
  );
}
export default function VillageFarmFields() {
  return (
    <group>
      {FARM_PLOTS.map((plot) => (
        <group key={`${plot.x}:${plot.z}`}>
          <mesh position={[plot.x, 0.02, plot.z]} receiveShadow>
            <boxGeometry args={[plot.width, 0.04, plot.depth]} />
            <meshStandardMaterial color="#65503a" roughness={1} />
          </mesh>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh
              key={i}
              position={[plot.x - 3.7 + i * 0.92, 0.05, plot.z]}
              receiveShadow
            >
              <boxGeometry args={[0.32, 0.06, 7.7]} />
              <meshStandardMaterial color="#806047" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
      <Crops wheat />
      <Crops wheat={false} />
    </group>
  );
}
