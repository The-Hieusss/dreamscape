import * as THREE from "three";
const cache = new WeakMap<THREE.Material, THREE.Material>();
export function foliageMaterial(material: THREE.Material) {
  if (!material.transparent) return material;
  let prepared = cache.get(material);
  if (!prepared) {
    prepared = material.clone();
    prepared.alphaTest = 0.35;
    prepared.transparent = false;
    prepared.depthWrite = true;
    cache.set(material, prepared);
  }
  return prepared;
}
