import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { loadWorld, restoreDraft, saveWorld } from "../lib/worldStorage";
import type { SavedWorld, SceneSnapshot } from "../lib/worldStorage";
import { loginUrl, useSession } from "../lib/useSession";
import supabase from "../lib/supabase/client";
import type { Rotation, RotationTool } from "../lib/objectRotation";
import type { MoveDirection } from "../lib/objectMovement";
import SceneObjectControls from "../components/SceneObjectControls";
import { useState, useEffect, useCallback, useRef } from "react";
import SceneManager from "../components/SceneManager";
import type { SceneObject, World, WorldTheme } from "../lib/types";
import { getTerrainHeight } from "../lib/terrain";
import Sidebar from "../components/Sidebar";
import { themePresets } from "../lib/themes";

const ALTITUDE: Record<string, number> = {
  star: 15,
  sun: 30,
  cloud: 20,
};

function isFloating(type?: string) {
  if (!type) return false;
  return type in ALTITUDE;
}

function getAltitude(type?: string) {
  return isFloating(type) ? ALTITUDE[type!] : 0;
}

const SKY_COLOR_MAP: Record<string, string> = {
  pink: "#ffb6c1",
  blue: "#87ceeb",
  purple: "#800080",
  orange: "#ffa500",
  red: "#ff4500",
  yellow: "#ffff00",
  green: "#00ff00",
  indigo: "#4b0082",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  white: "#ffffff",
  black: "#000000",
  darkblue: "#00008b",
  lightblue: "#add8e6",
  darkred: "#8b0000",
  lightgreen: "#90ee90",
  darkgreen: "#006400",
};

function randomRotationFor(type?: string): [number, number, number] {
  // Upright objects: random Y only
  if (!type) return [0, Math.random() * Math.PI * 2, 0];
  if (/tree|rock|house|car|skyscraper|cactus|star|sun|cloud/i.test(type))
    return [0, Math.random() * Math.PI * 2, 0];
  // Generic fallback
  return [0, Math.random() * Math.PI * 2, 0];
}

function normalizeSkyColor(v?: string): string | undefined {
  if (!v) return;
  const trimmed = v.trim().toLowerCase();
  if (SKY_COLOR_MAP[trimmed]) return SKY_COLOR_MAP[trimmed];
  // If already hex (#abc or #aabbcc) keep it
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
  return undefined;
}

export default function WorldBuilder() {
  const { worldId } = useParams();
  const session = useSession();
  const [search] = useSearchParams();
  const draftId = search.get("draft");
  const localKey =
    draftId && /^[a-f0-9-]{36}$/i.test(draftId) ? draftId : "local";
  if (worldId && session === undefined) return <p>Checking your session…</p>;
  if (worldId && !session)
    return <Navigate to={loginUrl(window.location.pathname)} replace />;
  return (
    <WorldEditor
      key={worldId ?? localKey}
      worldId={worldId}
      localKey={localKey}
      signedIn={!!session}
    />
  );
}

function WorldEditor({
  worldId,
  localKey,
  signedIn,
}: {
  worldId?: string;
  localKey: string;
  signedIn: boolean;
}) {
  const navigate = useNavigate();
  const draftKey = `dreamscape:draft:${worldId ?? localKey}`;
  const [draft] = useState(() => restoreDraft(draftKey));
  const [saved, setSaved] = useState<SavedWorld | null>(null);
  const [name, setName] = useState(
    worldId ? "" : (draft?.name ?? "Untitled World"),
  );
  const [ready, setReady] = useState(!worldId);
  const [saveError, setSaveError] = useState("");
  const [draftError, setDraftError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveredCopy, setRecoveredCopy] = useState(false);
  const [staleDraft, setStaleDraft] = useState(false);
  const saveLock = useRef(false);

  const movementRef = useRef<
    ((direction: MoveDirection, distance: number) => void) | null
  >(null);
  const [rotationTool, setRotationTool] = useState<RotationTool>({
    enabled: false,
    snap: false,
  });
  const [roaming, setRoaming] = useState(false);
  const [objects, setObjects] = useState<SceneObject[]>(
    worldId ? [] : (draft?.scene.objects ?? []),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [removed, setRemoved] = useState<{
    object: SceneObject;
    index: number;
  } | null>(null);
  const [world, setWorld] = useState<World | null>(() =>
    !worldId && draft?.scene.settings
      ? { ...draft.scene.settings, objects: [] }
      : null,
  );
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!worldId) return;
    let active = true;
    void loadWorld(worldId)
      .then((record) => {
        if (!active) return;
        const canRecover = draft?.revision === record.revision;
        const scene = canRecover ? draft.scene : record.scene;
        setSaved(record);
        setName(canRecover ? draft.name : record.name);
        setWorld(scene.settings ? { ...scene.settings, objects: [] } : null);
        setObjects(scene.objects);
        setStaleDraft(
          !!draft &&
            !canRecover &&
            JSON.stringify(draft.scene) !== JSON.stringify(record.scene),
        );
        setReady(true);
      })
      .catch((error: Error) => {
        if (active) setSaveError(error.message);
      });
    return () => {
      active = false;
    };
  }, [worldId, draft]);

  const sceneSnapshot: SceneSnapshot = {
    schemaVersion: 1,
    settings: world
      ? {
          name: world.name,
          theme: world.theme,
          sky_color: world.sky_color,
          terrain: world.terrain,
          mood: world.mood,
        }
      : null,
    objects,
  };
  useEffect(() => {
    if (!ready || staleDraft || recoveredCopy) return;
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          name,
          revision: saved?.revision ?? 0,
          scene: sceneSnapshot,
        }),
      );
      setDraftError("");
    } catch {
      setDraftError("This browser could not store your local draft.");
    }
    // Only persist scene edits and revision changes, not selection or camera state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    staleDraft,
    recoveredCopy,
    draftKey,
    name,
    saved?.revision,
    world,
    objects,
  ]);

  async function persist(explore: boolean) {
    if (saveLock.current || !name.trim()) return;
    saveLock.current = true;
    setBusy(true);
    setSaveError("");
    try {
      const record = await saveWorld(
        name.trim(),
        sceneSnapshot,
        recoveredCopy ? null : saved,
      );
      setSaved(record);
      if (recoveredCopy) setRecoveredCopy(false);
      if (explore) {
        const { data, error } = await supabase
          .from("exploration_rooms")
          .insert({ world_id: record.id, revision: record.revision })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        navigate(`/explore/${data.id}`);
      } else if (record.id !== worldId) {
        navigate(`/world-builder/${record.id}`, { replace: true });
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save this world.",
      );
    } finally {
      saveLock.current = false;
      setBusy(false);
    }
  }

  function placeObjects(
    existing: SceneObject[],
    specs: SceneObject[],
    theme?: WorldTheme,
  ) {
    const working = [...existing];
    for (const spec of specs) {
      const quantity = Math.min(
        50,
        Math.max(1, Math.floor(spec.quantity ?? 1)),
      );
      for (let i = 0; i < quantity; i++) {
        let x = 0,
          z = 0;
        if (!Array.isArray(spec.position)) {
          // Bound attempts so dense scenes can never freeze the editor.
          for (let attempt = 0; attempt < 100; attempt++) {
            const spread = spec.presetTheme ? 80 : 20;
            x = (Math.random() - 0.5) * spread;
            z = (Math.random() - 0.5) * spread;
            if (
              working.every(
                (object) =>
                  !Array.isArray(object.position) ||
                  Math.hypot(object.position[0] - x, object.position[2] - z) >=
                    2,
              )
            )
              break;
          }
        }
        working.push({
          ...spec,
          editorId: crypto.randomUUID(),
          quantity: 1,
          position: Array.isArray(spec.position)
            ? spec.position
            : [x, getTerrainHeight(x, z, theme) + getAltitude(spec.type), z],
          rotation: Array.isArray(spec.rotation)
            ? spec.rotation
            : randomRotationFor(spec.type),
        });
      }
    }
    return working;
  }

  function addObject(object: SceneObject) {
    setObjects((previous) => placeObjects(previous, [object], world?.theme));
  }

  function updateSelected(
    changes: Partial<
      Pick<SceneObject, "animation" | "speed" | "size" | "rotation">
    >,
  ) {
    setObjects((previous) =>
      previous.map((object) =>
        object.editorId === selectedId ? { ...object, ...changes } : object,
      ),
    );
  }

  function rotateObject(id: string, rotation: Rotation) {
    setObjects((previous) =>
      previous.map((object) =>
        object.editorId === id ? { ...object, rotation } : object,
      ),
    );
  }

  function moveSelected(offset: [number, number, number]) {
    setObjects((previous) =>
      previous.map((object) => {
        if (object.editorId !== selectedId || !Array.isArray(object.position))
          return object;
        const [x, y, z] = object.position;
        const nextX = x + offset[0],
          nextZ = z + offset[2];
        const nextY =
          y +
          getTerrainHeight(nextX, nextZ, world?.theme) -
          getTerrainHeight(x, z, world?.theme);
        return { ...object, position: [nextX, nextY, nextZ] };
      }),
    );
  }

  const removeSelected = useCallback(() => {
    const index = objects.findIndex((object) => object.editorId === selectedId);
    if (index < 0) return;
    setRemoved({ object: objects[index], index });
    setObjects((previous) =>
      previous.filter((object) => object.editorId !== selectedId),
    );
    setSelectedId(null);
  }, [objects, selectedId]);

  function undoRemove() {
    if (!removed) return;
    setObjects((previous) => {
      const restored = [...previous];
      restored.splice(
        Math.min(removed.index, restored.length),
        0,
        removed.object,
      );
      return restored;
    });
    setSelectedId(removed.object.editorId ?? null);
    setRemoved(null);
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (roaming || saveLock.current) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          "input, textarea, select, button, [contenteditable='true']",
        )
      )
        return;
      if (event.key === "Escape") setSelectedId(null);
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        removeSelected();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [removeSelected, selectedId, roaming]);

  function applyTheme(theme: string) {
    const preset = themePresets[theme];
    if (!preset) return;
    const nextTheme = theme as WorldTheme;
    setSelectedId(null);
    setRemoved(null);
    setWorld((previous) => ({
      ...previous,
      name: previous?.name ?? "Untitled World",
      theme: nextTheme,
      sky_color: normalizeSkyColor(preset.sky_color) ?? "#88ccff",
      terrain: preset.terrain ?? "flat plains",
      objects: [],
    }));
    setObjects((previous) =>
      placeObjects(
        previous.filter((object) => !object.presetTheme),
        (preset.objects ?? []).map((object) => ({
          ...object,
          presetTheme: nextTheme,
        })),
        nextTheme,
      ),
    );
  }

  function applyAICommand(cmd: any) {
    if (!cmd) return;

    if (cmd.action === "add_object" && cmd.object) {
      addObject(cmd.object);
    }

    if (
      (cmd.action === "modify_world" || cmd.action === "set_theme") &&
      cmd.changes
    ) {
      if (cmd.changes.theme) {
        applyTheme(cmd.changes.theme);
      } else {
        const normalized = normalizeSkyColor(cmd.changes.sky_color);
        setWorld((prev) => ({
          ...(prev || {}),
          ...cmd.changes,
          ...(normalized ? { sky_color: normalized } : {}),
        }));
      }
    }

    if (cmd.action === "remove_object" && cmd.object?.type) {
      setObjects((prev) => prev.filter((o) => o.type !== cmd.object.type));
    }
  }

  // === Send text to AI + apply command ===
  async function handleCommandSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!command.trim()) return;
    setLoading(true);

    setError("");
    try {
      const { generateCommand } = await import("../lib/ai");
      const aiCmd = await generateCommand(command);
      if (!aiCmd)
        throw new Error(
          "AI is unavailable. Use the terrain and model controls in the library.",
        );
      applyAICommand(aiCmd);
      setCommand("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not apply that request.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!ready)
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p role={saveError ? "alert" : "status"}>
          {saveError || "Loading world…"}
        </p>
        <Link to="/my-worlds">Back to my worlds</Link>
      </main>
    );

  return (
    <div className="relative w-screen h-screen md:h-screen overflow-hidden">
      <SceneManager
        roaming={roaming}
        objects={objects}
        world={world}
        onAddObject={addObject}
        selectedId={selectedId}
        onSelect={setSelectedId}
        rotationTool={rotationTool}
        onRotate={rotateObject}
        movementRef={movementRef}
        onMove={moveSelected}
      />

      {!roaming && (
        <>
          <SceneObjectControls
            objects={objects}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdate={updateSelected}
            rotationTool={rotationTool}
            onRotationToolChange={setRotationTool}
            onMove={(direction, distance) =>
              movementRef.current?.(direction, distance)
            }
            onRemove={removeSelected}
            onUndo={undoRemove}
            canUndo={!!removed}
          />

          <Sidebar
            addedCount={objects.filter((object) => !object.presetTheme).length}
            theme={world?.theme}
            onThemeChange={applyTheme}
            onAddObject={addObject}
          />
        </>
      )}

      {error && (
        <p
          role="alert"
          className="absolute bottom-24 right-4 max-w-sm rounded-xl bg-slate-900/90 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      {!roaming && (
        <form
          onSubmit={handleCommandSubmit}
          className="command-bar absolute inset-x-2 bottom-2 md:bottom-6 md:left-1/2 md:-translate-x-1/2
                   w-[calc(100%-1rem)] md:w-3/4 md:max-w-3xl
                   flex items-stretch md:items-center gap-2 md:gap-3
                   px-3 md:px-5 py-2.5 md:py-3.5
                   rounded-2xl md:rounded-3xl
                   transition-all duration-300"
        >
          {/* Input */}
          <div className="flex items-center flex-1 relative">
            <span className="absolute left-3 text-white/35 hidden md:inline text-sm">
              ⌨️
            </span>
            <input
              type="text"
              placeholder="Optional: describe a change with AI…"
              className="flex-1 pl-3 md:pl-10 pr-3 py-2.5 rounded-xl
                       bg-white/10/50 focus:bg-white/10
                       text-white/90 text-sm md:text-base tracking-wide
                       placeholder-white/40 font-body
                       outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-dream-indigo/60
                       transition-all"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
            />
          </div>

          {/* Run button */}
          <button
            type="submit"
            disabled={loading}
            className="relative group overflow-hidden
                     px-5 md:px-7 py-2.5
                     rounded-xl font-semibold text-sm md:text-base
                     text-slate-900
                     bg-gradient-to-r from-dream-indigo via-fuchsia-500 to-dream-pink
                     shadow-[0_4px_18px_-4px_rgba(99,102,241,0.55),0_0_0_1px_rgba(255,255,255,0.15)]
                     hover:shadow-[0_6px_26px_-4px_rgba(236,72,153,0.65)]
                     hover:scale-[1.035] active:scale-95
                     transition disabled:opacity-50 disabled:scale-100"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white/90"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="hidden sm:inline drop-shadow">🚀</span>
                  Ask AI
                </span>
              )}
            </span>
            <span className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white/30 transition" />
          </button>
        </form>
      )}
      <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2 max-w-[calc(100vw-1.5rem)] rounded-xl border border-white/20 bg-slate-950/85 p-2 text-white shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            setRotationTool((tool) => ({ ...tool, enabled: false }));
            setRoaming((value) => !value);
          }}
          className="whitespace-nowrap rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium hover:bg-indigo-400"
        >
          {roaming ? "Back to build" : "Explore on foot"}
        </button>
        {!roaming && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer">World</summary>
            <div className="mt-2 flex max-w-64 flex-col gap-2">
              <label className="flex flex-col gap-1">
                World name
                <input
                  className="rounded bg-slate-800 p-2"
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              {signedIn ? (
                <>
                  <button
                    className="rounded bg-indigo-600 p-2"
                    disabled={busy || loading || !name.trim() || staleDraft}
                    onClick={() => void persist(false)}
                  >
                    {busy
                      ? "Saving…"
                      : recoveredCopy
                        ? "Save as a new world"
                        : "Save world"}
                  </button>
                  <button
                    className="rounded bg-slate-700 p-2"
                    disabled={busy || loading || !name.trim() || staleDraft}
                    onClick={() => void persist(true)}
                  >
                    Save and explore together
                  </button>
                </>
              ) : (
                <Link
                  to={loginUrl(
                    window.location.pathname + window.location.search,
                  )}
                >
                  Sign in to save to your account
                </Link>
              )}
              <Link to="/my-worlds">My worlds</Link>
              {staleDraft && (
                <div className="space-y-2">
                  <p>A local draft is based on an older version.</p>
                  <button
                    onClick={() => {
                      if (!draft) return;
                      setName(draft.name.slice(0, 88) + " (recovered)");
                      setWorld(
                        draft.scene.settings
                          ? { ...draft.scene.settings, objects: [] }
                          : null,
                      );
                      setObjects(draft.scene.objects);
                      setRecoveredCopy(true);
                      setStaleDraft(false);
                    }}
                  >
                    Recover as a copy
                  </button>
                  <button onClick={() => setStaleDraft(false)}>
                    Keep the cloud version
                  </button>
                </div>
              )}
              {saveError && <p role="alert">{saveError}</p>}
              <p className="text-xs text-slate-300">
                {draftError ||
                  (saved
                    ? `Cloud version ${saved.revision} · Local draft recovery`
                    : "Draft kept on this device")}
              </p>
            </div>
          </details>
        )}
        {roaming && (
          <p className="mt-2 max-w-sm text-xs text-white/75">
            Click the scene to start. WASD / arrows: walk · Shift: faster ·
            Mouse: look · Esc: pause. Drag to look if mouse lock is unavailable.
          </p>
        )}
      </div>
      {busy && (
        <div
          className="absolute inset-0 z-50 grid place-items-center bg-slate-950/40"
          role="status"
        >
          <span className="rounded-lg bg-slate-950 px-4 py-2 text-white">
            Saving world…
          </span>
        </div>
      )}
    </div>
  );
}
