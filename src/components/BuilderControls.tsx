import { useState } from "react";
import { models } from "../lib/ModelRegistry";
import type { SceneObject, WorldTheme } from "../lib/types";
import {
  animationLabel,
  animationSpeed,
  modelAnimations,
} from "../lib/modelAnimations";

const presets: { theme: WorldTheme; label: string; detail: string }[] = [
  {
    theme: "woodland",
    label: "Woodland trail",
    detail:
      "A sunlit MegaKit forest with a winding path, ferns and wildflowers",
  },
  {
    theme: "forest",
    label: "Forest",
    detail: "Trees, flowers and rolling hills",
  },
  {
    theme: "ocean",
    label: "Ocean",
    detail: "Water, fish and a sandy sea floor",
  },
  {
    theme: "city",
    label: "City skyline",
    detail: "A planned city-kit skyline with towers and storefronts",
  },
  {
    theme: "desert",
    label: "Desert",
    detail: "Sand dunes and scattered rocks",
  },
  { theme: "universe", label: "Space", detail: "Stars, sun and moon" },
];
const sortedModels = [...models].sort((a, b) => a.name.localeCompare(b.name));
const field =
  "w-full rounded-lg border border-white/20 bg-slate-900 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400";

function defaultClip(path: string) {
  return (
    modelAnimations(path).find((clip) => /(^|[|_])idle$/i.test(clip)) ??
    modelAnimations(path)[0] ??
    ""
  );
}

export default function BuilderControls({
  theme,
  onThemeChange,
  onAddObject,
  addedCount,
}: {
  addedCount: number;
  theme?: WorldTheme;
  onThemeChange: (theme: WorldTheme) => void;
  onAddObject: (object: SceneObject) => void;
}) {
  const [path, setPath] = useState("/models/Animals/T-Rex.glb");
  const [animation, setAnimation] = useState(defaultClip(path));
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<SceneObject["size"]>("normal");
  const [notice, setNotice] = useState("");
  const selected = models.find((model) => model.path === path)!;
  const clips = modelAnimations(path);

  return (
    <section
      className="space-y-4 py-4 text-white"
      aria-label="Build your world"
    >
      <div>
        <h2 className="text-base font-semibold">Build your world</h2>
        <p className="mt-1 text-xs text-white/60">
          Choose a scene and add models. No AI needed.
        </p>
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Terrain presets</legend>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.theme}
              type="button"
              aria-pressed={theme === preset.theme}
              title={preset.detail}
              onClick={() => {
                onThemeChange(preset.theme);
                setNotice(`${preset.label} selected`);
              }}
              className={`rounded-lg border px-2 py-2 text-xs transition ${theme === preset.theme ? "border-indigo-300 bg-indigo-500/40" : "border-white/15 bg-white/5 hover:bg-white/15"}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/50">
          Changes preset scenery. Keeps models you add.
        </p>
      </fieldset>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onAddObject({
            type: selected.name.toLowerCase(),
            modelPath: path,
            category: selected.category,
            quantity,
            size,
            animation: animation || undefined,
            speed: animationSpeed(animation),
          });
          setNotice(
            `Added ${quantity} ${selected.name}${quantity > 1 ? " models" : ""}`,
          );
        }}
      >
        <label className="block space-y-1 text-xs">
          Model
          <select
            className={field}
            value={path}
            onChange={(event) => {
              setPath(event.target.value);
              setAnimation(defaultClip(event.target.value));
            }}
          >
            {sortedModels.map((model) => (
              <option key={model.path} value={model.path}>
                {model.name} · {model.category}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs">
          Animation
          <select
            className={field}
            value={animation}
            disabled={!clips.length}
            onChange={(event) => setAnimation(event.target.value)}
          >
            <option value="">
              {clips.length ? "None (static)" : "No animations available"}
            </option>
            {clips.map((clip) => (
              <option key={clip} value={clip}>
                {animationLabel(clip)}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-xs">
            Quantity
            <input
              className={field}
              type="number"
              min={1}
              max={50}
              required
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>
          <label className="space-y-1 text-xs">
            Size
            <select
              className={field}
              value={size}
              onChange={(event) =>
                setSize(event.target.value as SceneObject["size"])
              }
            >
              {["tiny", "small", "normal", "large", "huge"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold hover:bg-indigo-400"
        >
          Add to world
        </button>
        <p className="text-xs text-white/50">
          Models are placed around the center. Drag library models for precise
          placement.
        </p>
      </form>
      <p className="text-xs text-white/60">
        {addedCount} added {addedCount === 1 ? "model" : "models"} in your world
      </p>
      <p role="status" className="text-xs text-indigo-200">
        {notice}
      </p>
      <h2 className="border-t border-white/10 pt-4 text-sm font-semibold">
        Model library
      </h2>
    </section>
  );
}
