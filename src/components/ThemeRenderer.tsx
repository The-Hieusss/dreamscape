import HuntTerrain from "./HuntTerrain";
import VillageTerrain from "./VillageTerrain";
import { Sky } from "@react-three/drei";
import DesertLandscape from "./DesertLandscape";
import { CITY_BLOCK_CENTERS, CITY_PAVEMENT_TOP } from "../lib/cityLayout";
import WoodlandTerrain from "./WoodlandTerrain";
import { OCEAN_FLOOR } from "../lib/ocean";
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
      <mesh
        name="terrain"
        position={[0, OCEAN_FLOOR, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[400, 400, 50, 50]} />
        <meshStandardMaterial color="#e6d5b8" />
      </mesh>
    </>
  );
}

export function CityTerrain() {
  return (
    <group>
      <mesh name="terrain" rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#869475" roughness={1} />
      </mesh>
      {CITY_BLOCK_CENTERS.flatMap((x) =>
        CITY_BLOCK_CENTERS.map((z) => (
          <mesh
            key={`${x}:${z}`}
            name="terrain"
            position={[x, CITY_PAVEMENT_TOP / 2, z]}
            receiveShadow
          >
            <boxGeometry args={[16, CITY_PAVEMENT_TOP, 16]} />
            <meshStandardMaterial color="#c9c5b9" roughness={0.95} />
          </mesh>
        )),
      )}
      <mesh
        name="terrain"
        position={[8.8, CITY_PAVEMENT_TOP + 0.01, 12]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[7, 12]} />
        <meshStandardMaterial color="#739650" roughness={1} />
      </mesh>
      <mesh
        name="terrain"
        position={[8.8, CITY_PAVEMENT_TOP + 0.02, 12]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1.5, 12]} />
        <meshStandardMaterial color="#ddd3bd" roughness={1} />
      </mesh>
    </group>
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
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* === Starfield === */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
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
    case "hunt":
      return (
        <>
          <fog attach="fog" args={["#a9bda4", 55, 205]} />
          <hemisphereLight args={["#f0f4d9", "#475634", 1.8]} />
          <directionalLight
            position={[-85, 135, 45]}
            color="#fff1ca"
            intensity={2.1}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-235}
            shadow-camera-right={235}
            shadow-camera-top={235}
            shadow-camera-bottom={-235}
            shadow-camera-far={550}
            shadow-normalBias={0.06}
          />
          <HuntTerrain />
        </>
      );
    case "village":
      return (
        <>
          <fog attach="fog" args={["#c8dacf", 160, 320]} />
          <ambientLight intensity={0.85} />
          <hemisphereLight args={["#e1f0ff", "#829046", 1.1]} />
          <directionalLight
            position={[-25, 40, 20]}
            intensity={2.5}
            color="#fff0cd"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-90}
            shadow-camera-right={90}
            shadow-camera-top={90}
            shadow-camera-bottom={-90}
            shadow-camera-far={200}
            shadow-normalBias={0.035}
          />
          <VillageTerrain />
        </>
      );
    case "woodland":
      return (
        <>
          <fog attach="fog" args={["#d3dfbd", 20, 85]} />
          <ambientLight intensity={0.9} />
          <directionalLight
            position={[12, 18, 16]}
            intensity={1.5}
            color="#fff5d8"
          />
          <hemisphereLight args={["#d5f2ff", "#8d9c39", 1.5]} />
          <directionalLight
            position={[-12, 28, -22]}
            intensity={3.2}
            color="#fff0b2"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-40}
            shadow-camera-right={40}
            shadow-camera-top={40}
            shadow-camera-bottom={-40}
            shadow-camera-far={100}
            shadow-normalBias={0.08}
          />
          <WoodlandTerrain />
        </>
      );
    case "desert":
      return (
        <>
          <Sky
            distance={45000}
            sunPosition={[60, 25, -100]}
            turbidity={6}
            rayleigh={0.6}
            mieCoefficient={0.005}
            mieDirectionalG={0.8}
          />
          <fog attach="fog" args={["#dbc7a4", 65, 180]} />
          <ambientLight intensity={0.6} />
          <hemisphereLight args={["#e6f0ff", "#b8844d", 1]} />
          <directionalLight
            position={[45, 30, -65]}
            intensity={3}
            color="#ffe3b0"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-70}
            shadow-camera-right={70}
            shadow-camera-top={70}
            shadow-camera-bottom={-70}
            shadow-camera-far={200}
            shadow-normalBias={0.05}
          />
          <directionalLight
            position={[-20, 15, 30]}
            intensity={0.65}
            color="#e9efff"
          />
          <DesertLandscape />
        </>
      );
    case "ocean":
      return (
        <>
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[0, 50, 0]}
            intensity={1.2}
            color="blue"
          />
          <OceanTerrain />
        </>
      );
    case "city":
      return (
        <>
          <ambientLight intensity={0.85} />
          <hemisphereLight args={["#e1efff", "#6b7782", 1.2]} />
          <directionalLight
            position={[-20, 40, 25]}
            intensity={2.5}
            color="#fff4df"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-45}
            shadow-camera-right={45}
            shadow-camera-top={45}
            shadow-camera-bottom={-45}
            shadow-normalBias={0.03}
          />
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
          <ProceduralTerrain
            color="#568203"
            noiseFn={(x, z) => (Math.sin(x * 0.1) + Math.cos(z * 0.1)) * 2}
          />
        </>
      );
  }
}
