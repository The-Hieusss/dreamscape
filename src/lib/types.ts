export type SceneObject = {
  type: string; // "tree", "star", "skyscraper"
  position?: [number, number, number] | "random" | "sky" | "ground";
  color?: string;
  scale?: { x: number; y: number; z: number };
  quantity?: number;
  metadata?: Record<string, any>;
};

export type World = {
  id?: string;
  theme: string;
  mood: string;
  sky_color: string;
  objects: SceneObject[];
};
