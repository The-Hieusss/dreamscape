import { useFrame, useThree } from "@react-three/fiber";
import { useContext, useLayoutEffect, useRef } from "react";
import { Group, Raycaster, Vector3 } from "three";
import AnimatedModel from "../AnimatedModel";
import { CollisionContext } from "../../lib/collisionContext";
import { EYE_HEIGHT } from "../../lib/roaming";
import { shotBlockers } from "./Combatant";

export default function DeathView({ avatar }: { avatar: string }) {
  const { camera, scene } = useThree();
  const collisions = useContext(CollisionContext);
  const body = useRef<Group>(null);
  const view = useRef<{
    start: Vector3;
    end: Vector3;
    focus: Vector3;
    elapsed: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!body.current || camera.name !== "roaming-camera") return;
    const start = camera.position.clone();
    const forward = camera.getWorldDirection(new Vector3());
    forward.y = 0;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    forward.normalize();
    body.current.position.copy(start).y -= EYE_HEIGHT;
    body.current.rotation.y = Math.atan2(forward.x, forward.z);
    const focus = body.current.position.clone().add(new Vector3(0, 0.7, 0));
    const offset = new Vector3(-forward.z, 0, forward.x)
      .multiplyScalar(1.7)
      .addScaledVector(forward, -3.5);
    offset.y = 2.1;
    const distance = offset.length();
    const ray = new Raycaster(focus, offset.normalize(), 0, distance);
    const wall = ray.intersectObjects(shotBlockers(scene, collisions), true)[0];
    const end = focus
      .clone()
      .addScaledVector(
        offset,
        wall ? Math.max(0.3, wall.distance - 0.2) : distance,
      );
    view.current = { start, end, focus, elapsed: 0 };
  }, [camera, scene, collisions]);

  useFrame((_, delta) => {
    const transition = view.current;
    if (!transition) return;
    transition.elapsed += delta;
    const progress = Math.min(1, transition.elapsed / 0.5);
    camera.position.lerpVectors(
      transition.start,
      transition.end,
      1 - (1 - progress) ** 3,
    );
    camera.lookAt(transition.focus);
  });

  return (
    <group ref={body}>
      <AnimatedModel
        path={avatar}
        animation="CharacterArmature|Death"
        loop={false}
        speed={0}
        stickToTerrain={false}
      />
    </group>
  );
}
