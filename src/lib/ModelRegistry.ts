import catalog from "../config/modelCatalog.json";

export type ModelEntry = {
  path: string;
  category: string;
  name: string;
  thumbnail: string;
};

// Metadata only. GLBs are requested by the scene when a model is placed.
export const models: ModelEntry[] = catalog;
