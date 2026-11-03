import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { foliageMaterial } from "../src/lib/foliageMaterial.ts";

test("foliage shares cutout materials without mutating other presets or duplicating textures", () => {
  const texture = new THREE.Texture();
  const source = new THREE.MeshStandardMaterial({
    transparent: true,
    map: texture,
  });
  const result = foliageMaterial(source);
  assert.notEqual(result, source);
  assert.equal(result.transparent, false);
  assert.equal(result.alphaTest, 0.35);
  assert.equal(result.depthWrite, true);
  assert.equal(result.map, texture);
  assert.equal(foliageMaterial(source), result);
  assert.equal(source.transparent, true);
  assert.equal(source.alphaTest, 0);
  const opaque = new THREE.MeshStandardMaterial();
  assert.equal(foliageMaterial(opaque), opaque);
  result.dispose();
  source.dispose();
  opaque.dispose();
  texture.dispose();
});
