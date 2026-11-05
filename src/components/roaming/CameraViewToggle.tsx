export type CameraView = "first" | "third";

export default function CameraViewToggle({
  view,
  onChange,
}: {
  view: CameraView;
  onChange: (view: CameraView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Exploration camera"
      className="inline-flex gap-1 rounded-xl border border-white/15 bg-black/20 p-1 text-xs"
    >
      {(["first", "third"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={view === option}
          onClick={() => onChange(option)}
          className={`rounded-lg px-3 py-1.5 ${view === option ? "bg-indigo-600 font-semibold" : "text-slate-200 hover:bg-white/10"}`}
        >
          {option === "first" ? "First person" : "Third person"}
        </button>
      ))}
    </div>
  );
}
