import assert from "node:assert/strict";
import test from "node:test";
import {
  REX_HEALTH,
  rexClips,
  validCombatSnapshot,
} from "../src/lib/coopCombat.ts";

test("co-op hunt snapshots accept every T. rex animation and full health", () => {
  const player = { health: 100, ammo: 30, shots: 0, hits: 0, reloading: false };
  const enemy = {
    id: 0,
    hp: REX_HEALTH,
    pose: { x: 90, y: 8, z: -135, yaw: 0, clip: "", armed: false },
  };
  const snapshot = {
    round: "6c56351d-6269-49f2-bf93-fe2968decc27",
    startsIn: 0,
    players: [player, player],
    enemies: [enemy],
  };
  for (const clip of rexClips) {
    enemy.pose.clip = `TRex_${clip}`;
    enemy.hp = clip === "Death" ? 0 : REX_HEALTH;
    assert.equal(validCombatSnapshot(snapshot), true, clip);
  }
  enemy.hp = REX_HEALTH + 1;
  assert.equal(validCombatSnapshot(snapshot), false);
  enemy.hp = REX_HEALTH;
  enemy.pose.clip = "TRex_Unknown";
  assert.equal(validCombatSnapshot(snapshot), false);
});
