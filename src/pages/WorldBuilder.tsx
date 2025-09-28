import { useState, useRef } from "react";
import SceneManager from "../components/SceneManager";
import type { SceneObject, World } from "../lib/types";
import { getTerrainHeight } from "../lib/terrain";
import { generateCommand } from "../lib/ai";
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

function randomRotationFor(type?: string): [number, number, number] {
  // Upright objects: random Y only
  if (!type) return [0, Math.random() * Math.PI * 2, 0];
  if (/tree|rock|house|car|skyscraper|cactus|star|sun|cloud/i.test(type))
    return [0, Math.random() * Math.PI * 2, 0];
  // Generic fallback
  return [0, Math.random() * Math.PI * 2, 0];
}

export default function WorldBuilder() {
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [world, setWorld] = useState<World | null>(null);
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const lastAppliedTheme = useRef<string | null>(null);

  function getNonOverlappingPosition(
    existing: SceneObject[],
    minDistance = 2
  ): [number, number, number] {
    let pos: [number, number, number] = [0, 0, 0];
    let safe = false;

    while (!safe) {
      const x = Math.floor(Math.random() * 40 - 20);
      const z = Math.floor(Math.random() * 40 - 20);
      const y = getTerrainHeight(x, z); // ✅ snap to terrain

      pos = [x, y, z];

      safe = existing.every(
        (o) =>
          Array.isArray(o.position) &&
          typeof o.position[0] === "number" &&
          typeof o.position[2] === "number" &&
          Math.hypot(o.position[0] - pos[0], o.position[2] - pos[2]) >=
            minDistance
      );
    }

    return pos;
  }

  function applyTheme(theme: string) {
    const preset = themePresets[theme];
    if (!preset) return;
    if (lastAppliedTheme.current === theme) return; // prevent duplicates
    lastAppliedTheme.current = theme;

    // Merge world fields
    setWorld((prev) => {
      // Ensure all required fields are present
      const base: World = {
        id: prev?.id ?? "",
        name: prev?.name ?? "Untitled World",
        mood: prev?.mood ?? "",
        theme: theme as World["theme"],
        sky_color: preset.sky_color ?? prev?.sky_color ?? "",
        terrain:
          preset.terrain ?? prev?.terrain ?? ("forest" as World["terrain"]),
        objects: prev?.objects ?? [],
        created_at: prev?.created_at ?? "",
        updated_at: prev?.updated_at ?? "",
      };
      return base;
    });

    // Add preset objects
    if (preset.objects?.length) {
      setObjects((prev) => {
        const working = [...prev];
        const additions: SceneObject[] = [];
        if (preset.objects) {
          for (const spec of preset.objects) {
            const qty = spec.quantity ?? 1;
            for (let i = 0; i < qty; i++) {
              const [x, , z] = getNonOverlappingPosition(working, 2);
              const baseY = getTerrainHeight(x, z);
              const y = baseY + getAltitude(spec.type);
              const newObj: SceneObject = {
                ...spec,
                position: [x, y, z],
                quantity: 1,
                rotation: randomRotationFor(spec.type),
              };
              additions.push(newObj);
              working.push(newObj);
            }
          }
        }
        return [...prev, ...additions];
      });
    }
  }

  function applyAICommand(cmd: any) {
    if (!cmd) return;

    if (cmd.action === "add_object" && cmd.object) {
      const qty = cmd.object.quantity ?? 1;
      let working = [...objects];
      const newObjects: SceneObject[] = [];

      for (let i = 0; i < qty; i++) {
        // Pick an X/Z, ensure spacing
        const pos2D = getNonOverlappingPosition(working, 2);
        const [x, , z] = pos2D;
        const terrainY = getTerrainHeight(x, z);
        const y = terrainY + getAltitude(cmd.object.type);

        const newObj: SceneObject = {
          ...cmd.object,
          position: [x, y, z],
          rotation: randomRotationFor(cmd.object.type),
        };
        newObjects.push(newObj);
        working.push(newObj);
      }
      setObjects((prev) => [...prev, ...newObjects]);
    }

    if (
      (cmd.action === "modify_world" || cmd.action === "set_theme") &&
      cmd.changes
    ) {
      if (cmd.changes.theme) {
        applyTheme(cmd.changes.theme);
      } else {
        setWorld((prev) => ({ ...(prev || {}), ...cmd.changes }));
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

    const aiCmd = await generateCommand(command);
    console.log("AI Command:", aiCmd);

    applyAICommand(aiCmd);
    setCommand("");
    setLoading(false);
  }

  return (
    <div className="relative w-screen h-screen md:h-screen overflow-hidden">
      <SceneManager
        objects={objects}
        world={world}
        onAddObject={(o) => setObjects((prev) => [...prev, o])}
      />
      <Sidebar />

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
          <span className="absolute left-3 text-white/35 hidden md:inline text-sm">⌨️</span>
          <input
            type="text"
            placeholder="Describe a change... e.g. “add 5 pine trees near the river”"
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
                Run
              </span>
            )}
          </span>
          <span className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white/30 transition" />
        </button>
      </form>
    </div>
  );
}
