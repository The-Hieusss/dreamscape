import Combatant, { shotBlockers } from "./Combatant";
import {
  Hud,
  PerspectiveCamera,
  useAnimations,
  useGLTF,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { CollisionContext } from "../../lib/collisionContext";
import { roamStart } from "../../lib/roaming";
import { getTerrainHeight } from "../../lib/terrain";
import type { WorldTheme } from "../../lib/types";

const MAGAZINE = 30;
const FIRE_INTERVAL = 140;
const RIG_PATH = "/rigs/akm.glb";
const TARGET_COUNT = 6;

export interface RangeStats {
  health: number;
  ammo: number;
  shots: number;
  hits: number;
  targets: number;
  reloading: boolean;
}

export const initialRangeStats: RangeStats = {
  health: 100,
  ammo: MAGAZINE,
  shots: 0,
  hits: 0,
  targets: TARGET_COUNT,
  reloading: false,
};

export type RigClip = "Idle" | "Shoot" | "Reload";

export function ViewRig({
  action,
}: {
  action: { clip: RigClip; sequence: number };
}) {
  const { scene, animations } = useGLTF(RIG_PATH);
  const model = useMemo(() => {
    const rig = clone(scene);
    rig.traverse((object) => {
      object.frustumCulled = false;
    });
    return rig;
  }, [scene]);
  const { actions, mixer } = useAnimations(animations, model);

  useEffect(() => {
    const idle = actions["Armature|Idle"];
    const clip = actions[`Armature|${action.clip}`];
    if (!clip) return;
    mixer.stopAllAction();
    clip
      .reset()
      .setLoop(
        action.clip === "Idle" ? THREE.LoopRepeat : THREE.LoopOnce,
        action.clip === "Idle" ? Infinity : 1,
      )
      .play();
    const finish = (event: { action: THREE.AnimationAction }) => {
      if (event.action === clip) idle?.reset().play();
    };
    mixer.addEventListener("finished", finish);
    return () => mixer.removeEventListener("finished", finish);
  }, [action, actions, mixer]);

  return (
    <Hud renderPriority={1}>
      <PerspectiveCamera makeDefault fov={55} near={0.025} far={8} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[-1, 2, 1]} intensity={2.2} />
      <primitive
        object={model}
        position={[0.25, -0.38, -0.55]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.042}
      />
    </Hud>
  );
}

interface Target {
  id: number;
  position: [number, number, number];
  hp: number;
}

export default function PracticeRange({
  theme,
  targetMode,
  defeated,
  onStats,
  onHit,
}: {
  theme?: WorldTheme;
  targetMode: "balls" | "characters";
  defeated: boolean;
  onStats: (stats: RangeStats) => void;
  onHit: () => void;
}) {
  const { gl, camera, scene } = useThree();
  const collisions = useContext(CollisionContext);
  const [targets, setTargets] = useState<Target[]>([]);
  const [action, setAction] = useState<{ clip: RigClip; sequence: number }>({
    clip: "Idle",
    sequence: 0,
  });
  const targetGroup = useRef<THREE.Group>(null);
  const stats = useRef<RangeStats>(initialRangeStats);
  const liveTargets = useRef<Target[]>([]);
  const held = useRef(false);
  const queued = useRef(false);
  const reloadUntil = useRef(0);
  const nextShot = useRef(0);
  const raycaster = useMemo(() => {
    const ray = new THREE.Raycaster();
    ray.far = 80;
    return ray;
  }, []);
  const center = useMemo(() => new THREE.Vector2(), []);
  const reloadDuration =
    useGLTF(RIG_PATH).animations.find((clip) => clip.name === "Armature|Reload")
      ?.duration ?? 2.58;

  useEffect(() => {
    const start = roamStart(theme);
    const positions: Target[] = [];
    const count = targetMode === "characters" ? 4 : TARGET_COUNT;
    for (const distance of [9, 14, 20, 27]) {
      for (const side of [-5, 0, 5, -9, 9]) {
        if (positions.length >= count) break;
        const x =
          start.x - Math.sin(start.yaw) * distance + Math.cos(start.yaw) * side;
        const z =
          start.z - Math.cos(start.yaw) * distance - Math.sin(start.yaw) * side;
        const ground = getTerrainHeight(x, z, theme);
        if (collisions && !collisions.clear({ x, z }, { x, z }, ground, 0.65))
          continue;
        positions.push({
          id: positions.length,
          position: [x, ground + (targetMode === "balls" ? 1.45 : 0), z],
          hp: targetMode === "characters" ? 3 : 2,
        });
      }
    }
    liveTargets.current = positions;
    stats.current = { ...initialRangeStats, targets: positions.length };
    setTargets(positions);
    onStats(stats.current);
  }, [collisions, theme, targetMode, onStats]);

  const active = useCallback(() => {
    const canvas = gl.domElement;
    return (
      stats.current.health > 0 &&
      !document.hidden &&
      (document.pointerLockElement === canvas ||
        document.activeElement === canvas)
    );
  }, [gl]);
  const damagePlayer = useCallback(
    (damage: number) => {
      if (!stats.current.health) return;
      stats.current = {
        ...stats.current,
        health: Math.max(0, stats.current.health - damage),
      };
      onStats(stats.current);
      if (!stats.current.health) {
        queued.current = false;
        held.current = false;
        if (document.pointerLockElement === gl.domElement)
          document.exitPointerLock();
        gl.domElement.blur();
      }
    },
    [gl, onStats],
  );

  useEffect(() => {
    const canvas = gl.domElement;
    const down = (event: MouseEvent) => {
      if (event.button === 0 && active()) {
        held.current = true;
        queued.current = true;
      }
    };
    const stop = () => {
      held.current = false;
    };
    const cancel = () => {
      stop();
      queued.current = false;
    };
    const reload = (event: KeyboardEvent) => {
      if (
        event.code !== "KeyR" ||
        event.repeat ||
        !active() ||
        stats.current.reloading ||
        stats.current.ammo === MAGAZINE ||
        !stats.current.targets
      )
        return;
      reloadUntil.current = performance.now() + reloadDuration * 1000;
      stats.current = { ...stats.current, reloading: true };
      onStats(stats.current);
      setAction((previous) => ({
        clip: "Reload",
        sequence: previous.sequence + 1,
      }));
    };
    canvas.addEventListener("mousedown", down, true);
    canvas.addEventListener("blur", cancel);
    window.addEventListener("mouseup", stop);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", reload);
    document.addEventListener("pointerlockchange", cancel);
    document.addEventListener("visibilitychange", cancel);
    return () => {
      canvas.removeEventListener("mousedown", down, true);
      canvas.removeEventListener("blur", cancel);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", reload);
      document.removeEventListener("pointerlockchange", cancel);
      document.removeEventListener("visibilitychange", cancel);
    };
  }, [gl, active, onStats, reloadDuration]);

  useFrame(() => {
    const now = performance.now();
    const current = stats.current;
    if (current.reloading) {
      if (now >= reloadUntil.current) {
        stats.current = { ...current, ammo: MAGAZINE, reloading: false };
        onStats(stats.current);
      }
      return;
    }
    if (
      (!held.current && !queued.current) ||
      !current.targets ||
      !current.ammo ||
      now < nextShot.current ||
      !targetGroup.current
    )
      return;
    if (!active()) return;
    queued.current = false;
    nextShot.current = now + FIRE_INTERVAL;
    setAction((previous) => ({
      clip: "Shoot",
      sequence: previous.sequence + 1,
    }));
    const next = {
      ...current,
      ammo: current.ammo - 1,
      shots: current.shots + 1,
    };

    camera.updateMatrixWorld();
    raycaster.setFromCamera(center, camera);
    const targetsHit = raycaster.intersectObject(targetGroup.current, true);
    const hit = targetsHit.find(
      ({ object }) => typeof object.userData.rangeTarget === "number",
    );
    if (hit) {
      const wall = raycaster.intersectObjects(
        shotBlockers(scene, collisions),
        true,
      )[0];
      if (!wall || hit.distance < wall.distance) {
        const id = hit.object.userData.rangeTarget;
        const target = liveTargets.current.find((target) => target.id === id);
        if (target && target.hp > 0) {
          liveTargets.current = liveTargets.current.map((target) =>
            target.id === id ? { ...target, hp: target.hp - 1 } : target,
          );
          next.hits++;
          next.targets = liveTargets.current.filter(
            (target) => target.hp > 0,
          ).length;
        }
        setTargets(liveTargets.current);
        onHit();
      }
    }
    stats.current = next;
    onStats(next);
  });

  return (
    <>
      <group ref={targetGroup}>
        {targetMode === "characters"
          ? targets.map((target) => (
              <Combatant
                key={target.id}
                id={target.id}
                fighter={target.id % 2 ? "swat" : "soldier"}
                position={target.position}
                dead={target.hp <= 0}
                theme={theme}
                active={active}
                damagePlayer={damagePlayer}
              />
            ))
          : targets
              .filter((target) => target.hp > 0)
              .map((target) => (
                <group key={target.id} position={target.position}>
                  <mesh userData={{ rangeTarget: target.id }}>
                    <sphereGeometry args={[0.47, 24, 16]} />
                    <meshStandardMaterial
                      color={target.hp === 2 ? "#ff763d" : "#ffe566"}
                      emissive={target.hp === 2 ? "#8a1a00" : "#665100"}
                      emissiveIntensity={0.5}
                    />
                  </mesh>
                  <mesh position={[0, -0.88, 0]}>
                    <cylinderGeometry args={[0.06, 0.09, 1.15, 8]} />
                    <meshStandardMaterial color="#303744" />
                  </mesh>
                </group>
              ))}
      </group>
      {!defeated && <ViewRig action={action} />}
    </>
  );
}
