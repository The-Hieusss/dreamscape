

export function getTargetSize(size?: string | number): number {
  if (typeof size === "number") return size;

  switch (size) {
    case "small": return 0.5;
    case "medium": return 1.0;
    case "large": return 2.0;
    case "huge": return 3.0;
    default: return 1.0;
  }
}

