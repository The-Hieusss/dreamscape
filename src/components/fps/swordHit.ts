import { Raycaster, Vector3 } from "three";
import type { Group, Object3D } from "three";
import type { PlayerPose } from "../roaming/FirstPersonController";

export function swordHit(
  pose: PlayerPose,
  targets: Group,
  blockers: Object3D[],
  alive: (id: number) => boolean,
) {
  targets.updateWorldMatrix(true, true);
  const origin = new Vector3(pose.x, pose.y + 0.95, pose.z);
  const ray = new Raycaster();
  let nearest = 2.4;
  let hit: number | undefined;

  targets.traverse((object) => {
    const id = object.userData.rangeTarget;
    if (typeof id !== "number" || !alive(id)) return;
    const offset = object.getWorldPosition(new Vector3()).sub(origin);
    const distance = offset.length();
    if (distance >= nearest || Math.abs(offset.y) > 1.1) return;
    const forward =
      -offset.x * Math.sin(pose.yaw) - offset.z * Math.cos(pose.yaw);
    if (forward < Math.hypot(offset.x, offset.z) * 0.45) return;
    ray.set(origin, offset.normalize());
    ray.far = Math.max(0, distance - 0.12);
    if (ray.intersectObjects(blockers, true).length) return;
    nearest = distance;
    hit = id;
  });
  return hit;
}
