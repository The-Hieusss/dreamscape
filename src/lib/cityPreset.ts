import type { SceneObject } from "./types";
import { CITY_PAVEMENT_TOP, CITY_ROAD_TOP } from "./cityLayout.ts";
const kit = "/models/City/City Kit-glb/";
const bits = "/models/City/City Builder Bits/";
const roads = "/models/City/Road Bits/";
const objects: SceneObject[] = [];
function add(
  path: string,
  type: string,
  x: number,
  z: number,
  size: number,
  yaw = 0,
  elevation = CITY_PAVEMENT_TOP,
) {
  objects.push({
    type,
    modelPath: path,
    position: [x, elevation, z],
    rotation: [0, yaw, 0],
    size,
    quantity: 1,
  });
}
// An eight-metre tile grid makes a complete ring road with two crossing avenues.
for (let xi = -3; xi <= 3; xi++)
  for (let zi = -3; zi <= 3; zi++) {
    const vertical = xi === -3 || xi === 0 || xi === 3;
    const horizontal = zi === -3 || zi === 0 || zi === 3;
    if (!vertical && !horizontal) continue;
    const x = xi * 8,
      z = zi * 8;
    let tile = "road straight.glb",
      yaw = 0;
    if (vertical && horizontal) {
      if (xi === 0 && zi === 0) tile = "road junction.glb";
      else if (xi !== 0 && zi !== 0) {
        tile = "road corner.glb";
        yaw =
          xi < 0 ? (zi < 0 ? 0 : Math.PI / 2) : zi < 0 ? -Math.PI / 2 : Math.PI;
      } else {
        tile = "road tsplit.glb";
        yaw =
          zi === -3
            ? -Math.PI / 2
            : zi === 3
              ? Math.PI / 2
              : xi === -3
                ? 0
                : Math.PI;
      }
    } else {
      yaw = vertical ? 0 : Math.PI / 2;
      if ((xi === 0 && Math.abs(zi) === 1) || (zi === 0 && Math.abs(xi) === 1))
        tile = "road straight crossing.glb";
    }
    add(roads + tile, "road", x, z, 4, yaw, 0);
  }
// Downtown blocks: setback towers, offices and local shops, all fronting a street.
const buildings: [string, number, number, number, number?][] = [
  [kit + "Skyscraper-BwEXdOoUSO.glb", -16, -16, 2.7],
  [kit + "Skyscraper.glb", -8, -16, 2.8],
  [kit + "Large Building-JgGLJH2iXj.glb", -16, -8, 4],
  [kit + "Large Building-3IhrYZp6tP.glb", -8, -8, 3.5],
  [bits + "Building-bbH2Bg73qM.glb", 8, -16, 2.7],
  [bits + "Building-otRsYa6pan.glb", 16, -16, 2.7],
  [bits + "Building-qOhhGLftam.glb", 8, -8, 2.7, Math.PI],
  [bits + "Building-T3oyvK6VEU.glb", 16, -8, 2.7, Math.PI],
  [bits + "Building.glb", -16, 8, 2.7],
  [bits + "Building B.glb", -8, 8, 2.7],
  [bits + "Building-7lMEpT2ICD.glb", -16, 16, 2.7, Math.PI / 2],
  [bits + "Building-g15lpKh4li.glb", -8, 16, 2.7, Math.PI / 2],
  [kit + "Small Building.glb", 16, 8, 3.3, Math.PI / 2],
  [kit + "Small Building-yLvnMqC9ZG.glb", 16, 16, 3.3, Math.PI / 2],
];
for (const [path, x, z, size, yaw] of buildings)
  add(path, "building", x, z, size, yaw ?? 0);
// Street furniture lives on the sidewalk, clear of the traffic lanes.
for (const x of [-19.3, -4.7, 4.7, 19.3])
  for (const z of [-18, -7, 7, 18]) {
    add(
      bits + "Streetlight.glb",
      "streetlight",
      x,
      z,
      3.8,
      Math.abs(x) > 10 ? (x > 0 ? Math.PI : 0) : x < 0 ? Math.PI : 0,
    );
  }
for (const [x, z, yaw] of [
  [-4.5, -4.5, 0],
  [4.5, -4.5, Math.PI / 2],
  [4.5, 4.5, Math.PI],
  [-4.5, 4.5, -Math.PI / 2],
]) {
  add(bits + "Traffic light.glb", "traffic signal", x, z, 3, yaw);
}
for (const [x, z, yaw] of [
  [7, 7, 0],
  [7, 17, Math.PI],
  [12, 19, Math.PI / 2],
  [-19, 4.7, Math.PI / 2],
]) {
  add(bits + "Bench.glb", "bench", x, z, 3, yaw);
}
for (const [x, z] of [
  [-20, 6],
  [4, 20],
  [20, -5],
  [-5, -20],
])
  add(bits + "Fire Hydrant.glb", "hydrant", x, z, 3);
add(bits + "Dumpster.glb", "dumpster", -12, 19, 2.8, Math.PI);
// Lane-aligned traffic and parked vehicles; no vehicles occupy junction centers.
const cars: [string, number, number, number][] = [
  ["Taxi.glb", -1.9, 13, 0],
  ["Car Hatchback.glb", 1.9, -13, Math.PI],
  ["Stationwagon.glb", -13, 1.9, Math.PI / 2],
  ["Police Car.glb", 13, -1.9, -Math.PI / 2],
  ["Taxi.glb", -22.1, -13, 0],
  ["Car Hatchback.glb", 22.1, 11, Math.PI],
  ["Stationwagon.glb", -12, 22.1, Math.PI / 2],
  ["Car Hatchback.glb", 12, -22.1, -Math.PI / 2],
  ["Taxi.glb", -25.8, 9, 0],
  ["Stationwagon.glb", 25.8, -10, Math.PI],
];
for (const [file, x, z, yaw] of cars)
  add(bits + file, "car", x, z, 2.8, yaw, CITY_ROAD_TOP);
// A small neighborhood park breaks up the built blocks with trees and seating.
for (const [x, z] of [
  [6.7, 10],
  [11.5, 7],
  [11.5, 17.5],
  [-19, 20],
  [19, -19],
]) {
  add("/models/Trees/Tree.glb", "tree", x, z, 0.65);
}
for (const [x, z] of [
  [6.7, 6.7],
  [6.7, 18.5],
  [11.5, 18.5],
  [11.5, 10],
  [-4.8, -20],
  [19.5, 4.8],
])
  add(bits + "Bush.glb", "bush", x, z, 3);
export const cityObjects = objects;
