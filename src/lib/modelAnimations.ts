import manifest from "../config/modelAnimations.json";
import { animationMap } from "../config/animationMap";

const clipsByPath: Record<string, string[]> = manifest;
export function animationLabel(clip: string) {
  return clip
    .replace(/^.*\|/, "")
    .replace(/^TRex_/, "")
    .replaceAll("_", " ");
}
export function modelAnimations(path = "") {
  return (clipsByPath[path] ?? []).filter(
    (clip, index, clips) =>
      clips.findIndex(
        (other) => animationLabel(other) === animationLabel(clip),
      ) === index,
  );
}
export function resolveAnimation(path = "", animation = "") {
  if (!animation) return "";
  const species =
    path
      .split("/")
      .pop()
      ?.replace(/\.(glb|gltf)$/i, "") ?? "";
  const mapped = animationMap[species]?.[animation] ?? animation;
  const clips = modelAnimations(path);
  return (
    clips.find((clip) => clip === mapped) ??
    clips.find(
      (clip) =>
        animationLabel(clip).toLowerCase() ===
        animationLabel(mapped).toLowerCase(),
    ) ??
    clips.find((clip) => clip.toLowerCase().includes(mapped.toLowerCase())) ??
    ""
  );
}
export function animationSpeed(animation: string) {
  return /walk|wander/i.test(animation)
    ? 0.02
    : /run|gallop|swim/i.test(animation)
      ? 0.05
      : 0;
}
