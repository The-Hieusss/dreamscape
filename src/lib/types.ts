export type ObjectType =
  | "tree"
  | "star"
  | "rock"
  | "house"
  | "car"
  | "cloud"
  | "mountain"
  | "skyscraper";

export type WorldTheme = "universe" | "forest" | "city" | "ocean" | "desert";


export interface SceneObject {
  type: string; // flexible now, no need for union
  position?: [number, number, number] | "random";
  color?: string;
  quantity?: number;
  size?: "tiny" | "small" | "medium" | "normal" | "large" | "huge" | "giant" | number;
  modelPath?: string; 
  category?: string;  
  rotation?: [number, number, number]; 
  animation?: string;
  speed?: number;
}


export type TerrainType = "mountainous" | "flat plains" | "heightmap";

export interface World {
id?: string;
  name: string;
  theme: WorldTheme;
  mood?: string;
  sky_color: string;
  terrain: TerrainType;
  objects: SceneObject[];
  created_at?: string;
  updated_at?: string;
}
