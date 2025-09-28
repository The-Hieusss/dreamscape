const modelFiles = import.meta.glob("/public/models/**/*.{glb,gltf}", { eager: true });

export type ModelEntry = {
  path: string;
  category: string;
  name: string;
};

// Build array of models
export const models: ModelEntry[] = Object.keys(modelFiles).map((path) => {
  // Path like /public/models/Trees/Oak.glb
  const parts = path.split("/");
  const category = parts[parts.length - 2]; // folder name
  const filename = parts[parts.length - 1];
  const name = filename.replace(/\.(glb|gltf)$/i, "");

  return {
    path: path.replace("/public", ""), // serve relative to /models
    category,
    name,
  };
});
