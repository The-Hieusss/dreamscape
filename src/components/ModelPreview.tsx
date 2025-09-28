import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

function ModelContent({ path }: { path: string }) {
  const { scene } = useGLTF(path);
  return <primitive object={scene} scale={[0.6, 0.6, 0.6]} />;
}

export default function ModelPreview({ path }: { path: string }) {
  return (
    <div className="h-24 w-24 bg-slate-700 rounded">
      <Canvas camera={{ position: [2, 2, 2], fov: 35 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} />
        <Suspense fallback={null}>
          <ModelContent path={path} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
      </Canvas>
    </div>
  );
}
