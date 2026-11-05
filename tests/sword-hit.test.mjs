import assert from "node:assert/strict";
import test from "node:test";
import { BoxGeometry, Group, Mesh } from "three";
import { swordHit } from "../src/components/fps/swordHit.ts";

test("a sword swing hits a living opponent in reach and respects cover", () => {
  const pose = { x: 0, y: 0, z: 0, yaw: 0, motion: "Idle" };
  const targets = new Group();
  const target = new Mesh(new BoxGeometry(0.6, 1.8, 0.6));
  target.userData.rangeTarget = 7;
  targets.add(target);
  const wall = new Mesh(new BoxGeometry(2, 2, 0.2));
  wall.position.set(0, 1, -0.75);
  wall.updateMatrixWorld();
  target.position.set(0, 0.9, -1.5);
  assert.equal(swordHit(pose, targets, [], () => true), 7);
  assert.equal(swordHit(pose, targets, [wall], () => true), undefined);
  assert.equal(swordHit(pose, targets, [], () => false), undefined);
  target.position.z = 1;
  assert.equal(swordHit(pose, targets, [], () => true), undefined);
  target.position.z = -3;
  assert.equal(swordHit(pose, targets, [], () => true), undefined);
});
