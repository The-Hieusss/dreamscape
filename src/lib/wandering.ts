export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}
export function worldBounds(theme?: string): WorldBounds {
  // Keep residents inside the village fences, with room to turn.
  return theme === "village"
    ? { minX: -28, maxX: 70, minZ: -26, maxZ: 26 }
    : { minX: -120, maxX: 120, minZ: -120, maxZ: 120 };
}
export interface WanderState {
  x: number;
  z: number;
  heading: number;
  turnIn: number;
}
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
// Pure movement logic, shared by rendered characters and simulation tests.
export function stepWander(
  state: WanderState,
  speed: number,
  dt: number,
  bounds: WorldBounds,
  random = Math.random,
) {
  dt = clamp(dt, 0, 0.1);
  state.x = clamp(state.x, bounds.minX, bounds.maxX);
  state.z = clamp(state.z, bounds.minZ, bounds.maxZ);
  state.turnIn -= dt;
  if (state.turnIn <= 0) {
    state.heading += (random() - 0.5) * Math.PI * 0.8;
    state.turnIn = 2 + random() * 4;
  }
  let dx = Math.sin(state.heading) * Math.max(0, speed) * dt;
  let dz = Math.cos(state.heading) * Math.max(0, speed) * dt;
  // Reflect only the outward component, once, instead of repeatedly flipping
  // while a smoothed orientation still points outside the boundary.
  if (state.x + dx < bounds.minX || state.x + dx > bounds.maxX) dx = -dx;
  if (state.z + dz < bounds.minZ || state.z + dz > bounds.maxZ) dz = -dz;
  if (dx || dz) state.heading = Math.atan2(dx, dz);
  state.x = clamp(state.x + dx, bounds.minX, bounds.maxX);
  state.z = clamp(state.z + dz, bounds.minZ, bounds.maxZ);
}

// Connected village lanes. The middle junction skirts the well in the square.
export const villageLanes: { x: number; z: number; neighbors: number[] }[] = [];
for (const z of [-10, 0, 10])
  for (const x of [-26, -12, 0, 12, 26]) {
    villageLanes.push({
      x: x === 0 && z === 0 ? 1.8 : x,
      z: x === 0 && z === 0 ? -1.5 : z,
      neighbors: [],
    });
  }
function connect(a: number, b: number) {
  villageLanes[a].neighbors.push(b);
  villageLanes[b].neighbors.push(a);
}
for (let row = 0; row < 3; row++)
  for (let col = 0; col < 4; col++) connect(row * 5 + col, row * 5 + col + 1);
villageLanes.push(
  { x: 0, z: -25, neighbors: [] },
  { x: 0, z: 25, neighbors: [] },
  { x: 0, z: -5.5, neighbors: [] },
  { x: 0, z: 5.5, neighbors: [] },
);
connect(15, 2);
connect(2, 17);
connect(17, 7);
connect(7, 18);
connect(18, 12);
connect(12, 16);
// Eastern gate connects the farm yard, field lane and windmill approach.
const farmStart = villageLanes.length;
villageLanes.push(
  { x: 38.5, z: 0, neighbors: [] },
  { x: 38.5, z: -24, neighbors: [] },
  { x: 38.5, z: 15, neighbors: [] },
  { x: 38.5, z: 24, neighbors: [] },
  { x: 65, z: 0, neighbors: [] },
  { x: 65, z: 15, neighbors: [] },
);
connect(9, farmStart);
connect(farmStart, farmStart + 1);
connect(farmStart, farmStart + 2);
connect(farmStart + 2, farmStart + 3);
connect(farmStart, farmStart + 4);
connect(farmStart + 2, farmStart + 5);
export interface VillageWalk extends WanderState {
  target: number;
  previous: number;
}
export function createVillageWalk(x: number, z: number): VillageWalk {
  let target = 0;
  villageLanes.forEach((n, i) => {
    if (
      Math.hypot(n.x - x, n.z - z) <
      Math.hypot(villageLanes[target].x - x, villageLanes[target].z - z)
    )
      target = i;
  });
  return { x, z, heading: 0, turnIn: 0, target, previous: -1 };
}
export function stepVillageWalk(
  state: VillageWalk,
  speed: number,
  dt: number,
  random = Math.random,
) {
  const bounds = worldBounds("village");
  state.x = clamp(state.x, bounds.minX, bounds.maxX);
  state.z = clamp(state.z, bounds.minZ, bounds.maxZ);
  let remaining = Math.max(0, speed) * clamp(dt, 0, 0.1);
  // Consume remaining distance through junctions without overshooting or jitter.
  for (let i = 0; i < 8 && remaining > 0; i++) {
    const target = villageLanes[state.target];
    const dx = target.x - state.x,
      dz = target.z - state.z,
      distance = Math.hypot(dx, dz);
    if (distance > 0.001) {
      state.heading = Math.atan2(dx, dz);
      const step = Math.min(distance, remaining);
      state.x += (dx / distance) * step;
      state.z += (dz / distance) * step;
      remaining -= step;
      if (step < distance) break;
    }
    const choices = target.neighbors.filter((n) => n !== state.previous);
    const next = choices.length
      ? choices[Math.floor(random() * choices.length)]
      : state.previous;
    state.previous = state.target;
    state.target = next;
  }
}
