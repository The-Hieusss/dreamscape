import { useState } from "react";
import supabase from "../lib/supabase";
import SceneManager from "../components/SceneManager";
import type { SceneObject, World } from "../lib/types";
import { generateCommand } from "../lib/ai";

export default function WorldBuilder() {
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [world, setWorld] = useState<World | null>(null);
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);

  // === Apply AI JSON Command ===
  function applyAICommand(cmd: any) {
    if (!cmd) return;

    if (cmd.action === "add_object" && cmd.object) {
      const qty = cmd.object.quantity ?? 1;
      const newObjects: SceneObject[] = Array.from({ length: qty }).map(() => ({
        ...cmd.object,
        position:
          cmd.object.position === "random"
            ? [Math.random() * 10 - 5, 0, Math.random() * 10 - 5]
            : (cmd.object.position ?? [0, 0, 0]),
      }));
      setObjects((prev) => [...prev, ...newObjects]);
    }

    if (cmd.action === "modify_world" && cmd.changes) {
      setWorld((prev) => ({ ...(prev || {}), ...cmd.changes }));
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
    <div className="h-screen w-screen">
      <SceneManager objects={objects} world={world} />

      {/* Command Input UI */}
      <form
        onSubmit={handleCommandSubmit}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2/3 flex gap-2 bg-black/40 backdrop-blur-md p-3 rounded-xl shadow-lg"
      >
        <input
          type="text"
          placeholder="Type a command... (e.g., Add 5 trees 🌲)"
          className="flex-1 px-4 py-2 rounded-lg bg-black/50 text-dream-text placeholder-dream-text/50 font-body focus:outline-none focus:ring-2 focus:ring-dream-indigo"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-dream-indigo">
          {loading ? "Thinking..." : "Run"}
        </button>
      </form>
    </div>
  );
}
