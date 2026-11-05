export type Slot = 0 | 1;
export type EnemyPose = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  clip: string;
  armed: boolean;
};
export type CombatPlayer = {
  health: number;
  ammo: number;
  shots: number;
  hits: number;
  reloading: boolean;
};
export type CombatSnapshot = {
  round: string;
  startsIn: number;
  players: [CombatPlayer, CombatPlayer];
  enemies: { id: number; hp: number; pose: EnemyPose }[];
};
export type CombatCommand =
  | { round: string; kind: "reload" | "slash" }
  | { round: string; kind: "fire"; direction: [number, number, number] };

const clips = new Set([
  "",
  "Idle",
  "Idle_Gun_Pointing",
  "Idle_Gun_Shoot",
  "Run",
  "Kick_Right",
  "Punch_Right",
  "Death",
  "Idle_Sword",
  "Sword_Slash",
]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object";
const integer = (value: unknown, max: number) =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= max;
export const validRound = (round: unknown): round is string =>
  typeof round === "string" && /^[a-f\d-]{36}$/i.test(round);

export function validCombatCommand(value: unknown): value is CombatCommand {
  if (!isRecord(value) || !validRound(value.round)) return false;
  if (value.kind === "reload" || value.kind === "slash") return true;
  const d = value.direction;
  return (
    value.kind === "fire" &&
    Array.isArray(d) &&
    d.length === 3 &&
    d.every((n) => typeof n === "number" && Number.isFinite(n)) &&
    Math.abs(Math.hypot(...d) - 1) < 0.01
  );
}

export function validCombatSnapshot(value: unknown): value is CombatSnapshot {
  if (!isRecord(value) || !validRound(value.round)) return false;
  const { players, enemies } = value;
  if (!integer(value.startsIn, 3)) return false;
  return (
    Array.isArray(players) &&
    players.length === 2 &&
    players.every(
      (p) =>
        isRecord(p) &&
        integer(p.health, 100) &&
        integer(p.ammo, 30) &&
        integer(p.shots, 1_000_000) &&
        integer(p.hits, 1_000_000) &&
        typeof p.reloading === "boolean",
    ) &&
    Array.isArray(enemies) &&
    enemies.length <= 4 &&
    enemies.every(
      (e) =>
        isRecord(e) &&
        integer(e.id, 3) &&
        integer(e.hp, 3) &&
        isRecord(e.pose) &&
        [e.pose.x, e.pose.y, e.pose.z, e.pose.yaw].every(
          (n) =>
            typeof n === "number" && Number.isFinite(n) && Math.abs(n) < 10_000,
        ) &&
        typeof e.pose.clip === "string" &&
        clips.has(e.pose.clip) &&
        typeof e.pose.armed === "boolean",
    ) &&
    new Set(enemies.map((e) => e.id)).size === enemies.length
  );
}
