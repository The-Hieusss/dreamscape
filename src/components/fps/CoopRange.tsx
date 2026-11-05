import { PlayerView, SWORD_SWING_MS } from "../roaming/playerView";
import { swordHit } from "./swordHit";
import { useFrame, useThree } from "@react-three/fiber";
import { useContext, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CollisionContext } from "../../lib/collisionContext";
import { EYE_HEIGHT, roamStart } from "../../lib/roaming";
import { getTerrainHeight } from "../../lib/terrain";
import type {
  CombatCommand,
  CombatPlayer,
  CombatSnapshot,
  Slot,
} from "../../lib/coopCombat";
import type { WorldTheme } from "../../lib/types";
import type { PlayerPose } from "../roaming/FirstPersonController";
import Combatant, { shotBlockers } from "./Combatant";
import { ViewRig } from "./PracticeRange";
import type { RigClip } from "./PracticeRange";

export type CoopTransport = {
  ready: () => boolean;
  pose: (slot: Slot) => PlayerPose | null;
  send: (
    event: "combat-state" | "combat-command",
    payload: CombatSnapshot | CombatCommand,
  ) => void;
  incoming: CombatCommand | null;
  snapshot: CombatSnapshot | null;
  receivedAt: number;
};

const newPlayer = (): CombatPlayer => ({
  health: 100,
  ammo: 30,
  shots: 0,
  hits: 0,
  reloading: false,
});
const roundOver = (state: CombatSnapshot) =>
  !state.enemies.some((enemy) => enemy.hp > 0) ||
  state.players.every((player) => !player.health);

export default function CoopRange({
  round,
  slot,
  theme,
  transport,
  onState,
}: {
  round: string;
  slot: Slot;
  theme?: WorldTheme;
  transport: CoopTransport;
  onState: (state: CombatSnapshot) => void;
}) {
  const { gl, scene, camera } = useThree();
  const melee = theme === "village";
  const playerView = useContext(PlayerView);
  const collisions = useContext(CollisionContext);
  const [state, setState] = useState<CombatSnapshot | null>(null);
  const host = useRef<CombatSnapshot>({
    round,
    startsIn: 3,
    players: [newPlayer(), newPlayer()],
    enemies: [],
  });
  const [action, setAction] = useState<{ clip: RigClip; sequence: number }>({
    clip: "Idle",
    sequence: 0,
  });
  const lastRendered = useRef<CombatSnapshot | null>(null);
  const targetGroup = useRef<THREE.Group>(null);
  const localCommand = useRef<CombatCommand | null>(null);
  const held = useRef(false);
  const pressed = useRef(false);
  const reloadPressed = useRef(false);
  const nextInput = useRef(0);
  const clock = useRef(-3);
  const lastPublish = useRef(-Infinity);
  const nextShot = useRef([0, 0]);
  const reloadAt = useRef([0, 0]);
  const ray = useRef(new THREE.Raycaster());
  const direction = useRef(new THREE.Vector3());
  const origin = useRef(new THREE.Vector3());

  useEffect(() => {
    if (slot !== 0) return;
    const start = roamStart(theme);
    const enemies: CombatSnapshot["enemies"] = [];
    for (const distance of [12, 17, 24, 32]) {
      for (const side of [-4, 0, 4, -8, 8]) {
        if (enemies.length >= 4) break;
        const x =
          start.x - Math.sin(start.yaw) * distance + Math.cos(start.yaw) * side;
        const z =
          start.z - Math.cos(start.yaw) * distance - Math.sin(start.yaw) * side;
        const y = getTerrainHeight(x, z, theme);
        if (collisions && !collisions.clear({ x, z }, { x, z }, y, 0.65))
          continue;
        enemies.push({
          id: enemies.length,
          hp: 3,
          pose: { x, y, z, yaw: start.yaw, clip: "Idle", armed: true },
        });
      }
    }
    host.current.enemies = enemies;
  }, [collisions, slot, theme]);

  useEffect(() => {
    const canvas = gl.domElement;
    const focused = () =>
      document.pointerLockElement === canvas ||
      document.activeElement === canvas;
    const down = (event: MouseEvent) => {
      if (event.button === 0 && focused()) {
        held.current = true;
        pressed.current = true;
      }
    };
    const up = () => {
      held.current = false;
    };
    const cancel = () => {
      up();
      pressed.current = false;
      reloadPressed.current = false;
    };
    const key = (event: KeyboardEvent) => {
      if (!event.repeat && event.code === "KeyR" && focused())
        reloadPressed.current = true;
    };
    canvas.addEventListener("mousedown", down, true);
    canvas.addEventListener("blur", cancel);
    window.addEventListener("mouseup", up);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", key);
    document.addEventListener("pointerlockchange", cancel);
    document.addEventListener("visibilitychange", cancel);
    return () => {
      canvas.removeEventListener("mousedown", down, true);
      canvas.removeEventListener("blur", cancel);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", key);
      document.removeEventListener("pointerlockchange", cancel);
      document.removeEventListener("visibilitychange", cancel);
    };
  }, [gl]);

  const running = () =>
    transport.ready() &&
    (slot === 0
      ? !roundOver(host.current)
      : !!transport.snapshot &&
        transport.snapshot.round === round &&
        performance.now() - transport.receivedAt < 1500 &&
        !roundOver(transport.snapshot));

  const fighting = () =>
    running() &&
    (slot === 0
      ? host.current.startsIn === 0
      : transport.snapshot?.startsIn === 0);

  function display(snapshot: CombatSnapshot) {
    const previous = lastRendered.current?.players[slot];
    const player = snapshot.players[slot];
    const clip =
      player.reloading && !previous?.reloading
        ? "Reload"
        : previous && player.shots > previous.shots
          ? "Shoot"
          : null;
    if (clip && !melee)
      setAction((value) => ({ clip, sequence: value.sequence + 1 }));
    if (melee && clip === "Shoot" && playerView)
      playerView.swingUntil = performance.now() + SWORD_SWING_MS;
    lastRendered.current = snapshot;
    setState(snapshot);
    onState(snapshot);
  }

  useFrame((_, delta) => {
    const now = performance.now();
    const snapshot = slot === 0 ? host.current : transport.snapshot;
    if (!snapshot || snapshot.round !== round) return;

    if (
      fighting() &&
      snapshot.players[slot].health > 0 &&
      !document.hidden &&
      (document.pointerLockElement === gl.domElement ||
        document.activeElement === gl.domElement)
    ) {
      let command: CombatCommand | undefined;
      if (!melee && reloadPressed.current) command = { round, kind: "reload" };
      else if ((held.current || pressed.current) && now >= nextInput.current) {
        camera.getWorldDirection(direction.current);
        command = melee
          ? { round, kind: "slash" }
          : {
              round,
              kind: "fire",
              direction: direction.current.toArray(),
            };
        pressed.current = false;
        nextInput.current = now + (melee ? SWORD_SWING_MS : 145);
      }
      reloadPressed.current = false;
      if (command) {
        if (slot === 0) localCommand.current = command;
        else transport.send("combat-command", command);
      }
    } else {
      held.current = false;
      pressed.current = false;
      reloadPressed.current = false;
    }

    if (slot === 1) {
      if (snapshot !== lastRendered.current) display(snapshot);
      return;
    }

    const guestCommand = transport.incoming;
    transport.incoming = null;
    if (running()) {
      clock.current += Math.min(delta, 0.05);
      snapshot.startsIn = Math.max(0, Math.ceil(-clock.current));
    }
    if (fighting()) {
      for (const index of [0, 1] as const) {
        const player = snapshot.players[index];
        if (player.reloading && clock.current >= reloadAt.current[index]) {
          player.reloading = false;
          player.ammo = 30;
        }
        const command = index === 0 ? localCommand.current : guestCommand;
        if (
          !command ||
          command.round !== round ||
          !player.health ||
          player.reloading
        )
          continue;
        if (melee ? command.kind !== "slash" : command.kind === "slash")
          continue;
        if (command.kind === "reload") {
          if (player.ammo < 30) {
            player.reloading = true;
            reloadAt.current[index] = clock.current + 2.583;
          }
          continue;
        }
        const pose = transport.pose(index);
        if (
          !pose ||
          (!melee && !player.ammo) ||
          clock.current < nextShot.current[index] ||
          !targetGroup.current ||
          roundOver(snapshot)
        )
          continue;
        nextShot.current[index] =
          clock.current + (melee ? SWORD_SWING_MS / 1000 : 0.13);
        if (!melee) player.ammo--;
        player.shots++;
        const blockers = shotBlockers(scene, collisions);
        const alive = (id: number) =>
          snapshot.enemies.some((enemy) => enemy.id === id && enemy.hp > 0);
        let hitId: number | undefined;
        if (command.kind === "slash") {
          hitId = swordHit(pose, targetGroup.current, blockers, alive);
        } else if (command.kind === "fire") {
          ray.current.far = 80;
          ray.current.set(
            origin.current.set(pose.x, pose.y + EYE_HEIGHT, pose.z),
            direction.current.fromArray(command.direction).normalize(),
          );
          const hit = ray.current
            .intersectObject(targetGroup.current, true)
            .find((entry) => alive(entry.object.userData.rangeTarget));
          const wall = hit && ray.current.intersectObjects(blockers, true)[0];
          if (hit && (!wall || hit.distance < wall.distance))
            hitId = hit.object.userData.rangeTarget;
        }
        const enemy = snapshot.enemies.find((enemy) => enemy.id === hitId);
        if (enemy) {
          enemy.hp--;
          player.hits++;
        }
      }
    }
    localCommand.current = null;
    if (now - lastPublish.current >= 100) {
      lastPublish.current = now;
      const copy = structuredClone(snapshot);
      transport.send("combat-state", copy);
      display(copy);
    }
  });

  function choosePlayer(from: THREE.Vector3) {
    let choice: { slot: Slot; eye: THREE.Vector3 } | undefined;
    let nearest = Infinity;
    for (const index of [0, 1] as const) {
      const pose = transport.pose(index);
      if (!pose || !host.current.players[index].health) continue;
      const distance = Math.hypot(pose.x - from.x, pose.z - from.z);
      if (distance < nearest) {
        nearest = distance;
        choice = {
          slot: index,
          eye: new THREE.Vector3(pose.x, pose.y + EYE_HEIGHT, pose.z),
        };
      }
    }
    return choice;
  }

  return (
    <>
      <group ref={targetGroup}>
        {state?.enemies.map((enemy) => (
          <Combatant
            key={enemy.id}
            id={enemy.id}
            fighter={melee ? "knight" : enemy.id % 2 ? "swat" : "soldier"}
            position={[enemy.pose.x, enemy.pose.y, enemy.pose.z]}
            dead={!enemy.hp}
            theme={theme}
            active={fighting}
            choosePlayer={slot === 0 ? choosePlayer : undefined}
            reportPose={
              slot === 0
                ? (pose) => {
                    const current = host.current.enemies.find(
                      (item) => item.id === enemy.id,
                    );
                    if (current) current.pose = pose;
                  }
                : undefined
            }
            replica={slot === 1 ? enemy.pose : undefined}
            damagePlayer={(damage, playerSlot) => {
              if (playerSlot !== undefined && fighting()) {
                const player = host.current.players[playerSlot];
                player.health = Math.max(0, player.health - damage);
                if (
                  playerSlot === slot &&
                  !player.health &&
                  document.pointerLockElement === gl.domElement
                )
                  document.exitPointerLock();
              }
            }}
          />
        ))}
      </group>
      {!melee && state?.players[slot].health !== 0 && (
        <ViewRig action={action} />
      )}
    </>
  );
}
