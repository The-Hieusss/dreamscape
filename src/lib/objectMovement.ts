export type MoveDirection = "left" | "right" | "forward" | "backward";

// Flatten the camera direction so moving an object never changes its elevation.
export function groundMovement(
  direction: MoveDirection,
  distance: number,
  view: readonly number[],
): [number, number, number] {
  const length = Math.hypot(view[0], view[2]);
  const fx = length > 0.0001 ? view[0] / length : 0;
  const fz = length > 0.0001 ? view[2] / length : -1;
  const vectors = {
    forward: [fx, fz],
    backward: [-fx, -fz],
    left: [fz, -fx],
    right: [-fz, fx],
  };
  const [x, z] = vectors[direction];
  return [x * distance, 0, z * distance];
}
