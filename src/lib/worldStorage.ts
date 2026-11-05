import type { SceneObject, World } from "./types";
import { models } from "./ModelRegistry";
import supabase from "./supabase/client";

export interface SceneSnapshot {
  schemaVersion: 1;
  settings: Omit<World, "objects"> | null;
  objects: SceneObject[];
}

export interface SavedWorld {
  id: string;
  name: string;
  scene: SceneSnapshot;
  revision: number;
  updated_at: string;
}

const fields = "id,name,scene,revision,updated_at";
const paths = new Set(models.map(({ path }) => path));
const themes = new Set([
  "universe",
  "forest",
  "city",
  "ocean",
  "desert",
  "woodland",
  "village",
]);

export function readSnapshot(value: unknown): SceneSnapshot {
  const snapshot = value as SceneSnapshot | null;
  if (
    !snapshot ||
    snapshot.schemaVersion !== 1 ||
    !Array.isArray(snapshot.objects) ||
    (snapshot.settings !== null && !themes.has(snapshot.settings?.theme))
  ) {
    throw new Error("This scene format is unsupported.");
  }
  return {
    ...snapshot,
    objects: snapshot.objects.filter(
      (object) =>
        object &&
        typeof object.type === "string" &&
        (!object.modelPath || paths.has(object.modelPath)),
    ),
  };
}

export async function loadWorld(id: string): Promise<SavedWorld> {
  const { data, error } = await supabase
    .from("worlds")
    .select(fields)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return { ...data, scene: readSnapshot(data.scene) };
}

export async function saveWorld(
  name: string,
  scene: SceneSnapshot,
  current: SavedWorld | null,
): Promise<SavedWorld> {
  const table = supabase.from("worlds");
  const query = current
    ? table
        .update({ name, scene })
        .eq("id", current.id)
        .eq("revision", current.revision)
    : table.insert({ name, scene });
  const { data, error } = await query.select(fields).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data)
    throw new Error(
      "This world changed in another session. Your draft is still on this device. Open the latest version before saving again.",
    );
  return data;
}

export function restoreDraft(
  key: string,
): { name: string; scene: SceneSnapshot; revision: number } | null {
  try {
    const draft = JSON.parse(localStorage.getItem(key) ?? "null");
    return draft ? { ...draft, scene: readSnapshot(draft.scene) } : null;
  } catch {
    return null;
  }
}
