import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  desertHeight,
  desertMesaMask,
  desertWashCenter,
} from "../lib/desertTerrain";

export default function DesertLandscape() {
  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(420, 420, 320, 320);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position,
      colors = [],
      rockMasks: number[] = [];
    const sand = new THREE.Color("#d8b477"),
      crest = new THREE.Color("#f0d49c"),
      wash = new THREE.Color("#baa17c"),
      stone = new THREE.Color("#985231");
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        z = positions.getZ(i),
        h = desertHeight(x, z);
      positions.setY(i, h);
      const rock = desertMesaMask(x, z);
      const color = sand
        .clone()
        .lerp(crest, THREE.MathUtils.clamp(h / 7, 0, 0.7));
      color.lerp(
        wash,
        Math.exp(-Math.pow((x - desertWashCenter(z)) / 4.5, 2)) * 0.38,
      );
      rockMasks.push(rock);
      color.lerp(stone, Math.pow(rock, 0.55) * 0.9);
      const band =
        rock * (Math.sin(h * 2.8) * 0.045 + Math.sin(h * 5.3) * 0.02);
      color.multiplyScalar(1 + band);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute(
      "desertRock",
      new THREE.Float32BufferAttribute(rockMasks, 1),
    );
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      metalness: 0,
    });
    // Fine wind ripples shade the sand without moving the ground under objects.
    material.onBeforeCompile = (shader) => {
      shader.vertexShader =
        "attribute float desertRock; varying float desertRockMask; varying vec3 desertPosition;\n" +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\ndesertPosition = position; desertRockMask = desertRock;",
      );
      shader.fragmentShader =
        "varying float desertRockMask; varying vec3 desertPosition;\n" +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float ripple = sin(desertPosition.x * 9.0 + desertPosition.z * 2.8 + sin(desertPosition.z * 0.8) * 1.3);
        float strata = 0.96 + sin(desertPosition.y * 2.6 + sin(desertPosition.x * 0.3) * 0.3) * 0.04;
        diffuseColor.rgb *= mix(0.975 + ripple * 0.025, strata, smoothstep(0.05,0.65,desertRockMask));`,
      );
    };
    return { geometry, material };
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return (
    <mesh
      name="terrain"
      geometry={geometry}
      material={material}
      receiveShadow
      castShadow
    />
  );
}
