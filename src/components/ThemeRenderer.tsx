import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";


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
  const noise = (x: number, z: number) =>
    Math.sin(x * 0.05) * 2 + Math.cos(z * 0.05) * 2; // rolling dunes
  return <ProceduralTerrain color="#d2b48c" noiseFn={noise} size={300} segments={80} />;
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
      <mesh position={[0, -20, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[400, 400, 50, 50]} />
        <meshStandardMaterial color="#e6d5b8" />
      </mesh>
    </>
  );
}


export function CityTerrain() {
  return <ProceduralTerrain color="#666666" noiseFn={undefined} size={400} segments={1} />;
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
          <ambientLight intensity={0.6} />
          <spotLight position={[0, 50, 50]} angle={0.3} intensity={2} color="orange" />
          <CityTerrain />
        </>
      );
    case "universe":
      return (
        <>
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
          <ProceduralTerrain color="#1e3a2a" noiseFn={(x, z) =>
            (Math.sin(x * 0.1) + Math.cos(z * 0.1)) * 2
          } />
        </>
      );
  }
}