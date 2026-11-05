import type { WorldBounds } from "./wandering";

export type Point = { x: number; z: number };
export type Obstacle = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  yaw?: number;
};

export class CollisionMap {
  readonly obstacles = new Map<object, Obstacle>();
  revision = 0;

  set(key: object, obstacle: Obstacle) {
    this.obstacles.set(key, obstacle);
    this.revision++;
  }

  remove(key: object) {
    if (this.obstacles.delete(key)) this.revision++;
  }

  // Sweep the center of the walker through boxes expanded by its radius.
  clear(from: Point, to: Point, ground: number, radius: number) {
    for (const box of this.obstacles.values()) {
      const cos = Math.cos(box.yaw ?? 0),
        sin = Math.sin(box.yaw ?? 0);
      const a = box.yaw
        ? { x: cos * from.x - sin * from.z, z: sin * from.x + cos * from.z }
        : from;
      const b = box.yaw
        ? { x: cos * to.x - sin * to.z, z: sin * to.x + cos * to.z }
        : to;
      if (box.maxY <= ground + 0.18 || box.minY >= ground + 1.65) continue;
      const left = box.minX - radius,
        right = box.maxX + radius;
      const back = box.minZ - radius,
        front = box.maxZ + radius;
      if (
        Math.max(a.x, b.x) <= left ||
        Math.min(a.x, b.x) >= right ||
        Math.max(a.z, b.z) <= back ||
        Math.min(a.z, b.z) >= front
      )
        continue;
      if (a.x > left && a.x < right && a.z > back && a.z < front) {
        // Allow a walker spawned inside scenery to head towards the nearest exit.
        const distances = [a.x - left, right - a.x, a.z - back, front - a.z];
        const next = [b.x - left, right - b.x, b.z - back, front - b.z];
        const nearest = Math.min(...distances);
        if (
          distances.some(
            (distance, i) => distance === nearest && next[i] < distance,
          )
        )
          continue;
        return false;
      }
      let enter = 0,
        exit = 1;
      for (const [start, end, min, max] of [
        [a.x, b.x, left, right],
        [a.z, b.z, back, front],
      ]) {
        const delta = end - start;
        if (delta === 0) {
          if (start <= min || start >= max) {
            enter = 2;
            break;
          }
          continue;
        }
        const a = (min - start) / delta,
          b = (max - start) / delta;
        enter = Math.max(enter, Math.min(a, b));
        exit = Math.min(exit, Math.max(a, b));
      }
      if (enter < exit) return false;
    }
    return true;
  }

  move(from: Point, to: Point, ground: number, radius: number): Point {
    if (this.clear(from, to, ground, radius)) return to;
    const x = { x: to.x, z: from.z };
    const slide = this.clear(from, x, ground, radius) ? x : from;
    const z = { x: slide.x, z: to.z };
    return this.clear(slide, z, ground, radius) ? z : slide;
  }

  route(
    from: Point,
    to: Point,
    bounds: WorldBounds,
    ground: number,
    radius: number,
  ): Point[] | null {
    if (this.clear(from, to, ground, radius)) return [to];
    if (!this.clear(to, to, ground, radius)) return null;

    // Search a bounded grid around this lane segment, then simplify its turns.
    const margin = 12;
    const minX = Math.max(
      bounds.minX,
      Math.floor(Math.min(from.x, to.x) - margin),
    );
    const maxX = Math.min(
      bounds.maxX,
      Math.ceil(Math.max(from.x, to.x) + margin),
    );
    const minZ = Math.max(
      bounds.minZ,
      Math.floor(Math.min(from.z, to.z) - margin),
    );
    const maxZ = Math.min(
      bounds.maxZ,
      Math.ceil(Math.max(from.z, to.z) + margin),
    );
    const queue = [{ point: from, parent: -1 }];
    const seen = new Set<string>();
    for (let i = 0; i < queue.length && i < 2400; i++) {
      const { point } = queue[i];
      if (this.clear(point, to, ground, radius)) {
        const path = [to];
        for (let j = i; j > 0; j = queue[j].parent) path.push(queue[j].point);
        path.reverse();
        const simplified: Point[] = [];
        let start = from;
        for (let j = 0; j < path.length; j++) {
          while (
            j + 1 < path.length &&
            this.clear(start, path[j + 1], ground, radius)
          )
            j++;
          start = path[j];
          simplified.push(start);
        }
        return simplified;
      }
      for (let dx = -1; dx <= 1; dx++)
        for (let dz = -1; dz <= 1; dz++) {
          const x = Math.round(point.x) + dx,
            z = Math.round(point.z) + dz;
          const key = `${x},${z}`;
          if (x < minX || x > maxX || z < minZ || z > maxZ || seen.has(key))
            continue;
          const next = { x, z };
          if (
            !this.clear(point, next, ground, radius) ||
            !this.clear(next, next, ground, radius)
          )
            continue;
          seen.add(key);
          queue.push({ point: next, parent: i });
        }
    }
    return null;
  }
}
