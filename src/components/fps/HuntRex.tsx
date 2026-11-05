import { useFrame, useThree } from "@react-three/fiber";
import { useContext, useRef, useState } from "react";
import { Group, Raycaster, Vector3 } from "three";
import AnimatedModel from "../AnimatedModel";
import { CollisionContext } from "../../lib/collisionContext";
import type { Point } from "../../lib/collisions";
import { huntHeight } from "../../lib/huntTerrain";
import { EYE_HEIGHT } from "../../lib/roaming";
import { worldBounds } from "../../lib/wandering";
import { shotBlockers } from "./Combatant";

export const REX_HEALTH = 10;
const BITE_REACH = 6.3;
type Clip = "Idle" | "Walk" | "Run" | "Attack" | "Death";

export default function HuntRex({
  id,
  spawn,
  hp,
  active,
  onBite,
}: {
  id: number;
  spawn: [number, number, number];
  hp: number;
  active: () => boolean;
  onBite: () => void;
}) {
  const { camera, scene } = useThree();
  const collisions = useContext(CollisionContext);
  const body = useRef<Group>(null);
  const [motion, setMotion] = useState<Clip>("Walk");
  const destination = useRef<Point>({ x: spawn[0] + 10, z: spawn[2] - 12 });
  const route = useRef<Point[]>([]);
  const replan = useRef(0);
  const bite = useRef(0);
  const aggro = useRef(false);
  const ray = useRef(new Raycaster());
  const bounds = worldBounds("hunt");

  useFrame((_, delta) => {
    if (!body.current || hp <= 0 || !active()) return;
    const dt = Math.min(0.05, delta);
    const position = body.current.position;
    const player = camera.position;
    const charging = hp < REX_HEALTH;
    if (charging && !aggro.current) {
      aggro.current = true;
      replan.current = 0;
    }
    const dx = player.x - position.x,
      dz = player.z - position.z;
    const distance = Math.hypot(dx, dz);
    const near =
      distance <= BITE_REACH &&
      Math.abs(player.y - EYE_HEIGHT - position.y) < 3;

    function face(x: number, z: number) {
      if (Math.hypot(x, z) < 0.01 || !body.current) return;
      const turn = Math.atan2(x, z) - body.current.rotation.y;
      body.current.rotation.y +=
        Math.atan2(Math.sin(turn), Math.cos(turn)) * Math.min(1, 6 * dt);
    }
    function clearBite() {
      const origin = new Vector3(position.x, position.y + 2.2, position.z);
      const direction = player.clone().sub(origin);
      ray.current.set(origin, direction.clone().normalize());
      ray.current.far = Math.max(0, direction.length() - 0.15);
      return (
        ray.current.intersectObjects(shotBlockers(scene, collisions), true)
          .length === 0
      );
    }

    if (bite.current > 0) {
      const previous = bite.current;
      bite.current = Math.max(0, bite.current - dt);
      // Give the player the windup to dodge or get behind cover.
      if (previous > 0.61 && bite.current <= 0.61 && near && clearBite())
        onBite();
      return;
    }
    if (charging && near && clearBite() && motion !== "Attack") {
      face(dx, dz);
      bite.current = 1.17;
      setMotion("Attack");
      return;
    }

    replan.current -= dt;
    if (
      !charging &&
      Math.hypot(
        position.x - destination.current.x,
        position.z - destination.current.z,
      ) < 2
    ) {
      const angle = Math.random() * Math.PI * 2;
      destination.current = {
        x: spawn[0] + Math.cos(angle) * 20,
        z: spawn[2] + Math.sin(angle) * 20,
      };
      replan.current = 0;
    }
    if (replan.current <= 0) {
      const goal = charging
        ? { x: player.x, z: player.z }
        : destination.current;
      route.current = collisions
        ? (collisions.route(position, goal, bounds, position.y, 1.35) ?? [])
        : [goal];
      if (charging && collisions && !route.current.length && distance > 0.1) {
        // A player can stand closer to cover than the dinosaur fits.
        // Advance toward an open point short of the player in that case.
        const advance = Math.min(15, Math.max(2, distance - 4));
        for (const side of [0, 4, -4, 8, -8]) {
          const point = {
            x: Math.max(
              bounds.minX,
              Math.min(
                bounds.maxX,
                position.x + (dx * advance - dz * side) / distance,
              ),
            ),
            z: Math.max(
              bounds.minZ,
              Math.min(
                bounds.maxZ,
                position.z + (dz * advance + dx * side) / distance,
              ),
            ),
          };
          const detour = collisions.route(
            position,
            point,
            bounds,
            position.y,
            1.35,
          );
          if (detour?.length) {
            route.current = detour;
            break;
          }
        }
      }
      if (!charging && !route.current.length) {
        destination.current = {
          x: spawn[0] + (Math.random() - 0.5) * 35,
          z: spawn[2] + (Math.random() - 0.5) * 35,
        };
      }
      replan.current = charging ? 0.65 : 2;
    }
    const next = route.current[0];
    const clip = !next ? "Idle" : charging ? "Run" : "Walk";
    if (motion !== clip) setMotion(clip);
    if (!next) return;
    const moveX = next.x - position.x,
      moveZ = next.z - position.z;
    const length = Math.hypot(moveX, moveZ);
    if (length < 0.25) {
      route.current.shift();
      return;
    }
    face(moveX, moveZ);
    const step = Math.min(length, dt * (charging ? 9.2 : 2.1));
    const desired = {
      x: position.x + (moveX / length) * step,
      z: position.z + (moveZ / length) * step,
    };
    const moved =
      collisions?.move(position, desired, position.y, 1.35) ?? desired;
    position.set(moved.x, huntHeight(moved.x, moved.z), moved.z);
  });

  const clip = hp <= 0 ? "Death" : motion;
  return (
    <group ref={body} position={spawn}>
      <AnimatedModel
        path="/models/Animals/T-Rex.glb"
        scale={[0.52, 0.52, 0.52]}
        animation={`Armature|TRex_${clip}`}
        loop={clip !== "Attack" && clip !== "Death"}
        speed={0}
        stickToTerrain={false}
      />
      {hp > 0 && (
        <>
          <mesh
            position={[0, 3.5, 0.3]}
            visible={false}
            userData={{ rangeTarget: id }}
          >
            <boxGeometry args={[3.25, 6.3, 7.2]} />
            <meshBasicMaterial />
          </mesh>
          <mesh
            position={[0, 6.15, 5.1]}
            visible={false}
            userData={{ rangeTarget: id }}
          >
            <boxGeometry args={[2.4, 2.7, 3.4]} />
            <meshBasicMaterial />
          </mesh>
        </>
      )}
    </group>
  );
}
