import { useState } from "react";
import { models } from "../lib/ModelRegistry";

const byPath = new Map(models.map((model) => [model.path, model]));

export default function ModelPreview({ path }: { path: string }) {
  const model = byPath.get(path);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded bg-slate-800/40">
      {model && failedSource !== model.thumbnail ? (
        <img
          src={model.thumbnail}
          alt={model.name}
          width={192}
          height={192}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailedSource(model.thumbnail)}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="px-2 text-center text-xs text-white/50">
          {model?.name ?? "Model"}
        </span>
      )}
    </div>
  );
}
