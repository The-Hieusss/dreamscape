import type { World } from "./types";

export const themePresets: Record<string, Partial<World>> = {
  universe: {
    sky_color: "#000011",
    terrain: "flat plains",
    objects: [
      { type: "star", position: "random", quantity: 50 },
    ],
  },
  forest: {
    sky_color: "#88ccff",
    terrain: "mountainous",
    objects: [
      { type: "tree", modelPath: "/models/Trees/Pine Trees.glb", quantity: 30, position: "random" , size:"large"},
      { type: "rock", modelPath: "/models/Rock Large.glb", quantity: 10, position: "random" },
    ],
  },
  city: {
    sky_color: "#87ceeb",
    terrain: "flat plains",
    objects: [
      { type: "skyscraper", modelPath: "/models/City/Large Building.glb", quantity: 15, position: "random" },
      { type: "car", modelPath: "/models/Car.glb", quantity: 5, position: "random" },
    ],
  },
  ocean: {
  sky_color: "#003366",
  terrain: "flat plains",
  objects: [
    { type: "fish", modelPath: "/models/Animals/Fish.glb", quantity: 10, position: "random", animation: "swim", speed: 0.02 },
    { type: "shark", modelPath: "/models/Animals/Shark.glb", quantity: 2, position: "random", animation: "swim", speed: 0.05 },
    { type: "coral", modelPath: "/models/Plants/Coral.glb", quantity: 8, position: "random", size: 0.8 },
    { type: "seaweed", modelPath: "/models/Plants/Seaweed.glb", quantity: 15, position: "random", size: 1.0 },
    { type: "rock", modelPath: "/models/Rock Large.glb", quantity: 5, position: "random", size: 1.2 }
  ],
},
  desert: {
    sky_color: "#ffcc88",
    terrain: "flat plains",
    objects: [
      { type: "cactus", modelPath: "/models/Plants/Cactus.glb", quantity: 15, position: "random" },
      { type: "rock", modelPath: "/models/Rock Large.glb", quantity: 5, position: "random" },
    ],
  },
};

