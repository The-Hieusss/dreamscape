import { woodlandObjects } from "./woodlandPreset";
import { cityObjects } from "./cityPreset";
import type { World } from "./types";

export const themePresets: Record<string, Partial<World>> = {
  universe: {
    sky_color: "#000011",
    terrain: "flat plains",
    objects: [
      { type: "star", position: "random", quantity: 50 },
      { type: "sun", modelPath: "/models/Space/Sun.glb", position: "random", quantity: 1, rotation: "random", size: "huge" },
      { type: "cloud", position: "random", quantity: 50 },
    ],
  },
  woodland: { sky_color: "#c6dfd4", terrain: "mountainous", objects: woodlandObjects },
  forest: {
    sky_color: "#88ccff",
    terrain: "mountainous",
    objects: [
      { type: "tree", modelPath: "/models/Trees/Tree.glb", quantity: 30, position: "random" , size:"large"},
      { type: "rock", modelPath: "/models/Rock Large.glb", quantity: 10, position: "random" , size:"small" },
      { type: "tree", modelPath: "/models/Plants/Flower Group.glb", quantity: 30, position: "random", size:"small" },
      { type: "tree", modelPath: "/models/Plants/Grass Patch.glb", quantity: 50, position: "random" , size:"large" },
    ],
  },
  city: {
    sky_color: "#1e2c36",
    terrain: "flat plains",
    objects: cityObjects,
  },
  ocean: {
  sky_color: "#003366",
  terrain: "flat plains",
  objects: [
    { type: "fish", modelPath: "/models/Animals/Fish.glb", quantity: 10, position: "random", animation: "Swim", speed: 0.02, size: "small" },
    { type: "coral", modelPath: "/models/Plants/Coral.glb", quantity: 8, position: "random", size: 0.8 },
    { type: "seaweed", modelPath: "/models/Plants/Seaweed.glb", quantity: 15, position: "random", size: 1.0 },
    { type: "rock", modelPath: "/models/Rock Large.glb", quantity: 5, position: "random", size: 1.2 }
  ],
},
  desert: {
    sky_color: "#ffcc88",
    terrain: "flat plains",
    objects: [
      { type: "rock", modelPath: "/models/Rock Large.glb", quantity: 20, position: "random", size:"small" },
    ],
  },
};

