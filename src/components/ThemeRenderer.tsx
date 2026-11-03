import { OCEAN_FLOOR } from "../lib/ocean";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getTerrainHeight } from "@/lib/terrain";

function ProceduralTerrain({
  color,
  noiseFn,
  size = 200,
  segments = 100,
}: {
  color: string;
  noiseFn?: (x: number, z: number) => number;
  size?: number;
  segments?: number;
}) {
  const geom = new THREE.PlaneGeometry(size, size, segments, segments);
  geom.rotateX(-Math.PI / 2);

  if (noiseFn) {
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, noiseFn(x, z));
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
  }

  return (
    <mesh name="terrain" geometry={geom} receiveShadow>
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}



export function DesertTerrain() {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, baseHeights } = useMemo(() => {
    const size = 420;
    const segs = 180;
    const geom = new THREE.PlaneGeometry(size, size, segs, segs);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position as THREE.BufferAttribute;
    const base: number[] = [];
    const cols: number[] = [];

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = getTerrainHeight(x, z);
      base.push(h);

      pos.setY(i, h);

     
      const norm = (h + 5) / 12; // rough normalize
      const clamp = Math.min(1, Math.max(0, norm));

      // Base gradient
      const c1 = new THREE.Color("#b88a42"); // low
      const c2 = new THREE.Color("#dcb879"); // mid
      const c3 = new THREE.Color("#f7e5bd"); // crest
      const mixed = c1.clone().lerp(c2, clamp).lerp(c3, clamp * clamp);



      cols.push(mixed.r, mixed.g, mixed.b);
    }

    geom.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    geom.computeVertexNormals();

    return { geometry: geom, baseHeights: base, colors: cols };
  }, []);

  // Subtle heat shimmer / dune drift
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pos = (meshRef.current.geometry as THREE.BufferGeometry)
      .attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y0 = baseHeights[i];
      // tiny animated ripple (wind)
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const ripple =
        Math.sin((x + t * 4) * 0.03) * 0.08 +
        Math.cos((z - t * 3) * 0.03) * 0.06;
      pos.setY(i, y0 + ripple);
    }
    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh name="terrain" ref={meshRef} geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.95}
        metalness={0.05}
        emissive="#2b1403"
        emissiveIntensity={0.08}
      />
    </mesh>
  );
}
export function OceanTerrain() {
  const waterRef = useRef<THREE.Mesh>(null);

  const geom = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(400, 400, 200, 200);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);

  useFrame(({ clock }) => {
    if (!waterRef.current) return;
    const time = clock.getElapsedTime();
    const position = waterRef.current.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const y =
        Math.sin(x * 0.1 + time * 0.5) * 0.3 +
        Math.cos(z * 0.1 + time * 0.4) * 0.3;
      position.setY(i, y);
    }
    position.needsUpdate = true;
    waterRef.current.geometry.computeVertexNormals();
  });

  return (
    <>
      {/* Water surface */}
      <mesh ref={waterRef} geometry={geom} receiveShadow>
        <meshPhongMaterial
          color="#004466"
          transparent
          opacity={0.7}
          shininess={120}
          specular={new THREE.Color("#88ccee")}
        />
      </mesh>

      {/* Sea floor */}
      <mesh name="terrain" position={[0, OCEAN_FLOOR, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[400, 400, 50, 50]} />
        <meshStandardMaterial color="#e6d5b8" />
      </mesh>
    </>
  );
}


export function CityTerrain() {
  return (
    <mesh name="terrain" rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color="#1e2c36" roughness={1} metalness={0} />
    </mesh>
  );
}

export function UniverseTerrain() {
  // === Starfield positions ===
  const stars = useMemo(() => {
    const positions = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000; // z
    }
    return positions;
  }, []);

  const starsRef = useRef<THREE.Points>(null);

  // Twinkling effect for stars
  useFrame(({ clock }) => {
    if (starsRef.current) {
      const t = clock.getElapsedTime();
      (starsRef.current.material as THREE.PointsMaterial).opacity =
        0.7 + 0.3 * Math.sin(t * 2.0);
    }
  });

  return (
    <>
      {/* Cosmic floor (dark reflective ground) */}
       <mesh
        name="terrain"
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2, 0]}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial
          transparent
          opacity={0}        
          depthWrite={false}  
        />
      </mesh>

      {/* === Starfield === */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[stars, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.5}
          sizeAttenuation
          color="#ffffff"
          transparent
          opacity={0.9}
        />
      </points>

      {/* === Sun === */}
      <group position={[200, 400, -300]}>
        <mesh>
          <sphereGeometry args={[25, 64, 64]} />
          <meshStandardMaterial
            color="#fff5cc"
            emissive="#ffaa33"
            emissiveIntensity={6}
          />
        </mesh>
        <pointLight intensity={4} distance={1000} color="#ffdd66" />
        {/* Glow halo */}
        <mesh>
          <sphereGeometry args={[35, 32, 32]} />
          <meshBasicMaterial
            color="#ffaa33"
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* === Moon === */}
      <group position={[-300, 200, 150]}>
        <mesh>
          <sphereGeometry args={[12, 64, 64]} />
          <meshStandardMaterial
            color="#ccccff"
            emissive="#6666ff"
            emissiveIntensity={1.5}
          />
        </mesh>
        <pointLight intensity={1.2} distance={400} color="#ccccff" />
      </group>

      {/* === Example Star (larger glowing one) === */}
      <group position={[50, 300, -200]}>
        <mesh>
          <sphereGeometry args={[5, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#88ccff"
            emissiveIntensity={2.5}
          />
        </mesh>
        <pointLight intensity={1.5} distance={300} color="#88ccff" />
      </group>

      {/* Nebula depth */}
      <fog attach="fog" args={["#000011", 100, 1500]} />
      <ambientLight intensity={0.3} />
    </>
  );
}


export default function ThemeRenderer({ theme }: { theme: string }) {
  switch (theme) {
    case "desert":
      return (
        <>
          <ambientLight intensity={0.7} />
          <directionalLight position={[100, 100, 0]} intensity={1.0} color="yellow" />
          <DesertTerrain />
        </>
      );
    case "ocean":
      return (
        <>
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 50, 0]} intensity={1.2} color="blue" />
          <OceanTerrain />
        </>
      );
    case "city":
      return (
        <>
          <ambientLight intensity={1.2} />
          <hemisphereLight args={["#e1efff", "#6b7782", 1.2]} />
          <directionalLight position={[-20, 40, 25]} intensity={2.5} color="#fff4df" />
          <CityTerrain />
        </>
      );
    case "universe":
      return (
        <>
          {/* Cosmic background */}
          <ambientLight intensity={0.2} />
          <pointLight position={[100, 100, 100]} intensity={2} color="yellow" />
          <UniverseTerrain />
        </>
      );
    default:
      return (
        <>
          <ambientLight intensity={0.6} />
          <directionalLight position={[20, 20, 10]} intensity={1.2} />
          <ProceduralTerrain color="#568203" noiseFn={(x, z) =>
            (Math.sin(x * 0.1) + Math.cos(z * 0.1)) * 2
          } />
        </>
      );
  }
}