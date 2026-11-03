export type Rotation = [number, number, number];
export type RotationTool = { enabled: boolean; snap: boolean };

export function rotationDegrees(
  rotation: Rotation | "random" | undefined,
): Rotation {
  const values = Array.isArray(rotation) ? rotation : [0, 0, 0];
  return values.map((radians) => {
    const degrees = (radians * 180) / Math.PI;
    return degrees >= 0 && degrees <= 360
      ? degrees
      : ((degrees % 360) + 360) % 360;
  }) as Rotation;
}

export function setRotationAxis(
  rotation: Rotation | "random" | undefined,
  axis: number,
  degrees: number,
): Rotation {
  const next: Rotation = Array.isArray(rotation) ? [...rotation] : [0, 0, 0];
  next[axis] = (degrees * Math.PI) / 180;
  return next;
}
