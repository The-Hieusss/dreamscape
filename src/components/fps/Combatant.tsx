import { KNIGHT_MODEL, PlayerView } from "../roaming/playerView";
import type { EnemyPose, Slot } from "../../lib/coopCombat";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useContext, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { CollisionContext } from "../../lib/collisionContext";
import type { CollisionMap, Point } from "../../lib/collisions";
import { getTerrainHeight } from "../../lib/terrain";
import type { WorldTheme } from "../../lib/types";
import { worldBounds } from "../../lib/wandering";

export type Fighter = "soldier" | "swat" | "knight";
const fighters = {
  knight: {
    model: KNIGHT_MODEL,
    weapon: "/models/Weapons/Sword.glb",
    scale: 0.36,
    range: 0,
    damage: 18,
    interval: 1.5,
  },
  soldier: {
    model: "/models/Characters/Soldier.glb",
    weapon: "/models/Weapons/Pistol.glb",
    scale: 0.16,
    range: 22,
    damage: 9,
    interval: 1.6,
  },
  swat: {
    model: "/models/Characters/SWAT.glb",
    weapon: "/models/Weapons/AssaultRifle.glb",
    scale: 0.18,
    range: 32,
    damage: 13,
    interval: 1.2,
  },
};

export function shotBlockers(
  scene: THREE.Scene,
  collisions: CollisionMap | null,
) {
  const blockers = [...(collisions?.obstacles.keys() ?? [])].filter(
    (object): object is THREE.Object3D => object instanceof THREE.Object3D,
  );
  scene.traverse((object) => {
    if (object.name === "terrain") blockers.push(object);
  });
  return blockers;
}

const MELEE_REACH = 1.85;
const FORWARD = new THREE.Vector3(0, 1, 0);
type Attack = {
  kind: "gun" | "melee";
  remaining: number;
  windup: number;
  landed: boolean;
};

export default function Combatant({
  id,
  fighter,
  position,
  dead,
  theme,
  active,
  damagePlayer,
  choosePlayer,
  reportPose,
  replica,
  readAvatar,
}: {
  id: number;
  fighter: Fighter;
  position: [number, number, number];
  dead: boolean;
  theme?: WorldTheme;
  active: () => boolean;
  damagePlayer: (damage: number, slot?: Slot) => void;
  choosePlayer?: (
    from: THREE.Vector3,
  ) => { slot: Slot; eye: THREE.Vector3 } | undefined;
  reportPose?: (pose: EnemyPose) => void;
  replica?: EnemyPose;
  readAvatar?: () => EnemyPose | undefined;
}) {
  const config = fighters[fighter];
  const knight = fighter === "knight";
  const playerView = useContext(PlayerView);
  const { camera, scene } = useThree();
  const collisions = useContext(CollisionContext);
  const character = useGLTF(config.model);
  const weapon = useGLTF(config.weapon);
  const body = useRef<THREE.Group>(null);
  const spawn = useRef(position);
  const tracer = useRef<THREE.Mesh>(null);
  const currentClip = useRef("");
  const attack = useRef<Attack | null>(null);
  const cooldown = useRef(0.9 + id * 0.37);
  const replan = useRef(0);
  const route = useRef<Point[]>([]);
  const flash = useRef(0);

  const { model, gun, muzzle } = useMemo(() => {
    const model = clone(character.scene);
    model.traverse((node) => {
      if (node instanceof THREE.SkinnedMesh) node.frustumCulled = false;
    });
    const gun = weapon.scene.clone(true);
    const muzzle = new THREE.Object3D();
    muzzle.position.x = new THREE.Box3().setFromObject(gun).max.x;
    gun.add(muzzle);
    const hand = model.getObjectByName("WristR");
    if (hand) {
      const sample = new THREE.AnimationMixer(model);
      const aim = character.animations.find((clip) =>
        clip.name.endsWith(knight ? "|Idle_Sword" : "|Idle_Gun_Pointing"),
      );
      if (aim) {
        sample.clipAction(aim).play();
        sample.update(0);
      }
      model.updateMatrixWorld(true);
      hand.getWorldPosition(gun.position);
      gun.position.add(new THREE.Vector3(0, 0.04, knight ? 0.09 : 0.11));
      if (knight) gun.rotation.x = Math.PI / 3;
      else gun.rotation.y = -Math.PI / 2;
      gun.scale.setScalar(config.scale);
      hand.attach(gun);
      sample.stopAllAction();
    }
    return { model, gun, muzzle };
  }, [character, weapon, config.scale, knight]);

  const { actions, mixer } = useAnimations(character.animations, model);
  const vectors = useMemo(
    () => ({
      eye: new THREE.Vector3(),
      aim: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      ray: new THREE.Raycaster(),
      muzzle: new THREE.Vector3(),
    }),
    [],
  );

  function play(name: string, once = false) {
    if (currentClip.current === name) return;
    const clip = actions[`CharacterArmature|${name}`];
    if (!clip) return;
    mixer.stopAllAction();
    currentClip.current = name;
    clip
      .reset()
      .setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    clip.clampWhenFinished = once;
    clip.play();
  }

  useEffect(() => {
    if (!dead) return;
    attack.current = null;
    gun.visible = false;
    if (tracer.current) tracer.current.visible = false;
    const death = actions["CharacterArmature|Death"];
    mixer.stopAllAction();
    currentClip.current = "Death";
    mixer.timeScale = 1;
    if (death) {
      death.reset().setLoop(THREE.LoopOnce, 1);
      death.clampWhenFinished = true;
      death.play();
    }
  }, [dead, actions, mixer, gun]);

  function canSee(eye: THREE.Vector3, aim: THREE.Vector3) {
    vectors.direction.subVectors(aim, eye);
    vectors.ray.far = Math.max(0, vectors.direction.length() - 0.12);
    vectors.ray.set(eye, vectors.direction.normalize());
    return (
      vectors.ray.intersectObjects(shotBlockers(scene, collisions), true)
        .length === 0
    );
  }

  useFrame((_, delta) => {
    if (!body.current) return;
    const mirrored = replica ?? readAvatar?.();
    if (mirrored) {
      const weight = readAvatar ? 1 : 1 - Math.exp(-18 * delta);
      const { position, rotation } = body.current;
      position.x = THREE.MathUtils.lerp(position.x, mirrored.x, weight);
      position.y = THREE.MathUtils.lerp(position.y, mirrored.y, weight);
      position.z = THREE.MathUtils.lerp(position.z, mirrored.z, weight);
      const difference = mirrored.yaw - rotation.y;
      rotation.y +=
        Math.atan2(Math.sin(difference), Math.cos(difference)) * weight;
      if (!dead) {
        gun.visible = mirrored.armed;
        mixer.timeScale = active() ? 1 : 0;
        play(
          mirrored.clip || "Idle",
          /Shoot|Kick|Punch|Slash/.test(mirrored.clip),
        );
      }
      return;
    }
    if (readAvatar) return;
    const { x, y, z } = body.current.position;
    reportPose?.({
      x,
      y,
      z,
      yaw: body.current.rotation.y,
      clip: currentClip.current,
      armed: gun.visible,
    });
    if (dead) return;
    if (!active()) {
      mixer.timeScale = 0;
      if (tracer.current) tracer.current.visible = false;
      return;
    }
    mixer.timeScale = 1;
    const dt = Math.min(delta, 0.05);
    const from = body.current.position;
    const selected = choosePlayer?.(from);
    if (choosePlayer && !selected) return;
    const pose = knight ? playerView?.pose : null;
    const player =
      selected?.eye ??
      (pose
        ? new THREE.Vector3(pose.x, pose.y + 1.75, pose.z)
        : camera.position);
    const dx = player.x - from.x,
      dz = player.z - from.z;
    const distance = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz) - body.current.rotation.y;
    body.current.rotation.y +=
      Math.atan2(Math.sin(yaw), Math.cos(yaw)) * Math.min(1, 12 * dt);
    const eye = vectors.eye.set(from.x, from.y + 1.36, from.z);
    const aim = vectors.aim.copy(player).addScaledVector(FORWARD, -0.36);
    cooldown.current -= dt;
    replan.current -= dt;
    flash.current -= dt;
    if (tracer.current && flash.current <= 0) tracer.current.visible = false;
    const pending = attack.current;
    if (pending) {
      pending.remaining -= dt;
      pending.windup -= dt;
      if (!pending.landed && pending.windup <= 0) {
        pending.landed = true;
        const reach =
          pending.kind === "melee" ? MELEE_REACH + 0.3 : config.range;
        if (distance <= reach && canSee(eye, aim)) {
          damagePlayer(
            pending.kind === "melee" ? 18 : config.damage,
            selected?.slot,
          );
          if (pending.kind === "gun" && tracer.current) {
            muzzle.getWorldPosition(vectors.muzzle);
            const beam = vectors.direction.subVectors(aim, vectors.muzzle);
            tracer.current.position.copy(vectors.muzzle).lerp(aim, 0.5);
            tracer.current.scale.y = beam.length();
            tracer.current.quaternion.setFromUnitVectors(
              FORWARD,
              beam.normalize(),
            );
            tracer.current.visible = true;
            flash.current = 0.085;
          }
        }
      }
      if (pending.remaining <= 0) {
        attack.current = null;
        currentClip.current = "";
      }
      return;
    }

    const melee =
      distance <= (knight ? 2 : MELEE_REACH) &&
      Math.abs(player.y - from.y - 1.75) < 1.1;
    // Stagger line-of-sight queries and route searches across opponents.
    if (replan.current > 0 && !melee) {
      walk(dt);
      return;
    }
    replan.current = 0.32;
    if ((melee || distance <= config.range) && canSee(eye, aim)) {
      route.current = [];
      gun.visible = knight || !melee;
      if (cooldown.current <= 0) {
        const name = knight
          ? "Sword_Slash"
          : melee
            ? id % 2
              ? "Kick_Right"
              : "Punch_Right"
            : "Idle_Gun_Shoot";
        play(name, true);
        const duration =
          actions[`CharacterArmature|${name}`]?.getClip().duration ?? 0.6;
        const windup = Math.min(duration * 0.75, melee ? 0.38 : 0.24);
        attack.current = {
          kind: melee ? "melee" : "gun",
          remaining: duration,
          windup,
          landed: false,
        };
        cooldown.current = Math.max(config.interval, duration);
      } else {
        play(knight ? "Idle_Sword" : melee ? "Idle" : "Idle_Gun_Pointing");
      }
    } else {
      const bounds = worldBounds(theme);
      const goal = {
        x: THREE.MathUtils.clamp(player.x, bounds.minX, bounds.maxX),
        z: THREE.MathUtils.clamp(player.z, bounds.minZ, bounds.maxZ),
      };
      route.current =
        collisions?.route(
          { x: from.x, z: from.z },
          goal,
          bounds,
          from.y,
          0.34,
        ) ?? (collisions ? [] : [goal]);
      walk(dt);
    }

    function walk(dt: number) {
      const next = route.current[0];
      if (!next) return;
      const dx = next.x - from.x,
        dz = next.z - from.z;
      const length = Math.hypot(dx, dz);
      if (length < 0.12) {
        route.current.shift();
        return;
      }
      const step = Math.min(length, dt * 2.3);
      const desired = {
        x: from.x + (dx / length) * step,
        z: from.z + (dz / length) * step,
      };
      const position = collisions?.move(from, desired, from.y, 0.34) ?? desired;
      from.set(
        position.x,
        getTerrainHeight(position.x, position.z, theme),
        position.z,
      );
      gun.visible = true;
      play("Run");
    }
  });

  return (
    <>
      <group ref={body} position={spawn.current}>
        <primitive object={model} />
        {!dead && !readAvatar && (
          <mesh
            position={[0, 0.9, 0]}
            visible={false}
            userData={{ rangeTarget: id }}
          >
            <boxGeometry args={[0.65, 1.8, 0.52]} />
            <meshBasicMaterial />
          </mesh>
        )}
      </group>
      <mesh ref={tracer} visible={false}>
        <cylinderGeometry args={[0.011, 0.011, 1, 5]} />
        <meshBasicMaterial color="#ffc677" />
      </mesh>
    </>
  );
}
