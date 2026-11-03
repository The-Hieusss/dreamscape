import { rotationDegrees, setRotationAxis } from "../lib/objectRotation";
import type { RotationTool } from "../lib/objectRotation";
import { useState } from "react";
import type { MoveDirection } from "../lib/objectMovement";
import {
  animationLabel,
  animationSpeed,
  modelAnimations,
  resolveAnimation,
} from "../lib/modelAnimations";
import { getTargetSize } from "../lib/getTargetSize";
import type { SceneObject } from "../lib/types";

export default function SceneObjectControls({
  objects,
  selectedId,
  onSelect,
  onUpdate,
  onMove,
  rotationTool,
  onRotationToolChange,
  onRemove,
  onUndo,
  canUndo,
}: {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (
    changes: Partial<
      Pick<SceneObject, "animation" | "speed" | "size" | "rotation">
    >,
  ) => void;
  onMove: (direction: MoveDirection, distance: number) => void;
  rotationTool: RotationTool;
  onRotationToolChange: (tool: RotationTool) => void;
  onRemove: () => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const [moveStep, setMoveStep] = useState(1);
  const visible = objects.filter((object) => object.modelPath);
  const selected = visible.find((object) => object.editorId === selectedId);
  const clips = modelAnimations(selected?.modelPath);
  const label = (object: SceneObject, index: number) =>
    `${
      object.modelPath
        ?.split("/")
        .pop()
        ?.replace(/\.(glb|gltf)$/i, "")
        .replace(/-[A-Za-z0-9]{10}$/, "") ?? object.type
    } #${index + 1}${object.presetTheme ? " · scenery" : ""}`;

  return (
    <section
      aria-label="Scene objects"
      className="absolute right-3 top-3 z-20 w-64 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-7rem)] overflow-y-auto space-y-3 rounded-2xl border border-white/15 bg-slate-950/90 p-4 text-white shadow-lg backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Scene objects</h2>
        <span className="text-xs text-white/50">
          {visible.length} {visible.length === 1 ? "object" : "objects"}
        </span>
      </div>
      <label className="block space-y-1 text-xs">
        Select an object
        <select
          value={selected?.editorId ?? ""}
          onChange={(event) => onSelect(event.target.value || null)}
          className="w-full rounded-lg border border-white/20 bg-slate-900 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">
            {visible.length ? "Choose an object…" : "No objects yet"}
          </option>
          {visible.map((object, index) => (
            <option key={object.editorId} value={object.editorId}>
              {label(object, index)}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-white/60">
        Or click a model in the scene to select it.
      </p>
      {selected && (
        <fieldset className="space-y-3 border-t border-white/15 pt-3">
          <legend className="text-sm font-medium">Object properties</legend>
          {!clips.length && (
            <div
              className="space-y-2"
              role="group"
              aria-label="Move selected object"
            >
              <h3 className="text-xs font-medium">Move object</h3>
              <label className="block space-y-1 text-xs">
                Move step
                <select
                  value={moveStep}
                  onChange={(event) => setMoveStep(Number(event.target.value))}
                  className="w-full rounded-lg border border-white/20 bg-slate-900 px-2 py-2 text-sm text-white"
                >
                  <option value={0.25}>Fine · 0.25 units</option>
                  <option value={1}>Normal · 1 unit</option>
                  <option value={5}>Large · 5 units</option>
                </select>
              </label>
              <div className="grid grid-cols-3 gap-1">
                <span />
                <button
                  type="button"
                  onClick={() => onMove("forward", moveStep)}
                  className="rounded-lg border border-white/20 bg-white/5 px-1 py-2 text-xs hover:bg-indigo-500/40"
                >
                  ↑ Forward
                </button>
                <span />
                <button
                  type="button"
                  onClick={() => onMove("left", moveStep)}
                  className="rounded-lg border border-white/20 bg-white/5 px-1 py-2 text-xs hover:bg-indigo-500/40"
                >
                  ← Left
                </button>
                <button
                  type="button"
                  onClick={() => onMove("backward", moveStep)}
                  className="rounded-lg border border-white/20 bg-white/5 px-1 py-2 text-xs hover:bg-indigo-500/40"
                >
                  ↓ Back
                </button>
                <button
                  type="button"
                  onClick={() => onMove("right", moveStep)}
                  className="rounded-lg border border-white/20 bg-white/5 px-1 py-2 text-xs hover:bg-indigo-500/40"
                >
                  Right →
                </button>
              </div>
              <p className="text-xs text-white/50">
                Moves relative to your view and follows the ground.
              </p>
              {Array.isArray(selected.position) && (
                <p role="status" className="text-xs text-indigo-200">
                  Position: {selected.position[0].toFixed(2)},{" "}
                  {selected.position[2].toFixed(2)}
                </p>
              )}
            </div>
          )}
          {!clips.length && (
            <div
              className="space-y-3 border-t border-white/10 pt-3"
              role="group"
              aria-label="Rotate selected object"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium">Rotation · 360°</h3>
                <button
                  type="button"
                  onClick={() => onUpdate({ rotation: [0, 0, 0] })}
                  className="text-xs text-indigo-200 hover:text-white"
                >
                  Reset rotation
                </button>
              </div>
              <button
                type="button"
                aria-pressed={rotationTool.enabled}
                onClick={() =>
                  onRotationToolChange({
                    ...rotationTool,
                    enabled: !rotationTool.enabled,
                  })
                }
                className={`w-full rounded-lg border px-2 py-2 text-xs ${rotationTool.enabled ? "border-indigo-300 bg-indigo-500/40" : "border-white/20 bg-white/5"}`}
              >
                {rotationTool.enabled
                  ? "Hide rotation rings"
                  : "Rotate in scene"}
              </button>
              {rotationTool.enabled && (
                <>
                  <p className="text-xs text-white/50">
                    Drag a colored ring to rotate that axis. Camera orbit pauses
                    while dragging.
                  </p>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={rotationTool.snap}
                      onChange={(event) =>
                        onRotationToolChange({
                          ...rotationTool,
                          snap: event.target.checked,
                        })
                      }
                    />
                    Snap to 15°
                  </label>
                </>
              )}
              {["X · Tilt", "Y · Turn", "Z · Roll"].map((label, axis) => {
                const degrees =
                  Math.round(rotationDegrees(selected.rotation)[axis] * 10) /
                  10;
                const update = (value: number) => {
                  if (Number.isFinite(value) && value >= 0 && value <= 360)
                    onUpdate({
                      rotation: setRotationAxis(selected.rotation, axis, value),
                    });
                };
                return (
                  <div key={axis} className="space-y-1">
                    <label className="flex items-center justify-between text-xs">
                      {label}
                      <span>
                        <input
                          aria-label={`${label} degrees`}
                          type="number"
                          min={0}
                          max={360}
                          step={1}
                          value={degrees}
                          onChange={(event) =>
                            update(event.target.valueAsNumber)
                          }
                          className="w-16 rounded border border-white/20 bg-slate-900 px-1 py-1 text-white"
                        />
                        °
                      </span>
                    </label>
                    <input
                      aria-label={`${label} rotation`}
                      type="range"
                      min={0}
                      max={360}
                      step={1}
                      value={degrees}
                      onChange={(event) => update(Number(event.target.value))}
                      className="w-full accent-indigo-400"
                    />
                  </div>
                );
              })}
            </div>
          )}
          {!!clips.length && (
            <label className="block space-y-1 text-xs">
              Selected animation
              <select
                value={resolveAnimation(selected.modelPath, selected.animation)}
                disabled={!clips.length}
                onChange={(event) =>
                  onUpdate({
                    animation: event.target.value,
                    speed: animationSpeed(event.target.value),
                  })
                }
                className="w-full rounded-lg border border-white/20 bg-slate-900 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
          )}
          <label className="block space-y-1 text-xs">
            Scale
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={getTargetSize(selected.size)}
              onChange={(event) => {
                const size = event.target.valueAsNumber;
                if (Number.isFinite(size) && size >= 0.1 && size <= 10)
                  onUpdate({ size });
              }}
              className="w-full rounded-lg border border-white/20 bg-slate-900 px-2 py-2 text-sm text-white"
            />
          </label>
          {!!animationSpeed(selected.animation ?? "") && (
            <label className="block space-y-1 text-xs">
              Movement speed
              <input
                type="range"
                min="0"
                max="12"
                step="0.3"
                value={
                  (selected.speed ?? animationSpeed(selected.animation ?? "")) *
                  60
                }
                onChange={(event) =>
                  onUpdate({ speed: Number(event.target.value) / 60 })
                }
                className="w-full accent-indigo-400"
              />
              <span className="text-white/60">
                {(
                  (selected.speed ?? animationSpeed(selected.animation ?? "")) *
                  60
                ).toFixed(1)}{" "}
                units / second
              </span>
            </label>
          )}
          <p className="text-xs text-white/50">
            Changes apply immediately to this object.
          </p>
        </fieldset>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!selected}
          onClick={onRemove}
          className="flex-1 rounded-lg bg-red-500/90 px-3 py-2 text-sm font-medium hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Remove selected
        </button>
        {canUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
          >
            Undo
          </button>
        )}
      </div>
      {selected && (
        <p className="text-xs text-indigo-200">
          Highlighted in amber. Delete to remove; Esc to deselect.
        </p>
      )}
    </section>
  );
}
