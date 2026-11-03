import type { SceneObject } from "./types";

const kit = "/models/City/City Kit-glb/";
// Front-to-back tiers keep the storefronts visible beneath the central skyline.
const layout: [string, number, number][] = [
  ["Small Building.glb", -13, 12],
  ["Small Building-QjL4Fo9dU9.glb", -8, 12],
  ["Small Building-Rq572hdKEz.glb", -3, 12],
  ["Small Building-t9j9Lof5ul.glb", 2, 12],
  ["Small Building-yLvnMqC9ZG.glb", 7, 12],
  ["Small Building-gyjF60t7CG.glb", 13, 12],
  ["Large Building.glb", -15, 5],
  ["Large Building-JgGLJH2iXj.glb", -10, 5],
  ["Large Building-1bt4yYKmuK.glb", -4, 5],
  ["Large Building-3IhrYZp6tP.glb", 2, 5],
  ["Large Building-h7Jaq7bqMq.glb", 10, 5],
  ["Large Building-ppwtREejXg.glb", -16, -2],
  ["Large Building-sxXonOmtct.glb", -15, -8],
  ["Low Wide.glb", -10, 18],
  ["Low Wide-DKgknsHjmr.glb", 8, 18],
  ["Skyscraper-jIRx0AhYOR.glb", -9, -3],
  ["Skyscraper-obYD8hWLTZ.glb", -4, -3],
  ["Skyscraper-PsPe0MzK0E.glb", 1, -3],
  ["Skyscraper-XST1j6kYsL.glb", 6, -3],
  ["Skyscraper.glb", -5, -10],
  ["Skyscraper-BwEXdOoUSO.glb", 1, -10],
  ["Low Building.glb", 12, -10],
  ["Low Building-4RoPd9BkSx.glb", 15, -10],
  ["Low Building-9fEKMpTsAi.glb", 18, -10],
  ["Low Building-AXFdNPAEc9.glb", 12, -6],
  ["Low Building-XsFOzw8E5N.glb", 15, -6],
  ["Low Building-dYEbYdPfJr.glb", 18, -6],
  ["Low Building-sObKC8Mio2.glb", 12, -2],
  ["Low Building-tuieC1Pj0a.glb", 15, -2],
  ["Low Building-zfjlejAxB7.glb", 18, -2],
];

export const cityObjects: SceneObject[] = layout.map(([filename, x, z]) => ({
  type: filename.startsWith("Skyscraper") ? "skyscraper" : "building",
  modelPath: kit + filename,
  position: [x, 0, z],
  rotation: [0, 0, 0],
  quantity: 1,
  size: 3,
}));
