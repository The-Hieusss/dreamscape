import { CollisionContext } from "../../lib/collisionContext";
import { worldBounds } from "../../lib/wandering";
import { useContext, useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { WorldTheme } from "../../lib/types";
import { getTerrainHeight } from "../../lib/terrain";
import { EYE_HEIGHT, roamStart, walkingStep } from "../../lib/roaming";

const WALK_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight",
]);

export type PlayerPose = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  motion: "Idle" | "Walk" | "Run";
};

export default function FirstPersonController({
  theme,
  sharedSlot,
  onPose,
}: {
  theme?: WorldTheme;
  sharedSlot?: number;
  onPose?: (pose: PlayerPose) => void;
}) {
  const { camera, gl } = useThree();
  const collisions = useContext(CollisionContext);
  const keys = useRef(new Set<string>());
  const yaw = useRef(0),
    pitch = useRef(0);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (camera.name !== "roaming-camera") return;
    const start = roamStart(theme);
    const z = start.z - (sharedSlot ?? 0) * 2;
    camera.position.set(
      start.x,
      getTerrainHeight(start.x, z, theme) + EYE_HEIGHT,
      z,
    );
    yaw.current = start.yaw;
    pitch.current = 0;
    keys.current.clear();
    camera.rotation.set(0, start.yaw, 0, "YXZ");
  }, [camera, theme, sharedSlot]);

  useEffect(() => {
    const canvas = gl.domElement;
    const previousTabIndex = canvas.getAttribute("tabindex");
    canvas.tabIndex = 0;
    const reset = () => {
      keys.current.clear();
      dragging.current = false;
    };
    const active = () =>
      document.pointerLockElement === canvas ||
      document.activeElement === canvas;
    const down = (event: KeyboardEvent) => {
      if (
        !active() ||
        (event.target instanceof Element &&
          event.target.closest(
            "input,textarea,select,button,[contenteditable='true']",
          ))
      )
        return;
      if (event.key === "Escape") {
        reset();
        canvas.blur();
        if (document.pointerLockElement === canvas) document.exitPointerLock();
        return;
      }
      if (WALK_KEYS.has(event.code)) {
        event.preventDefault();
        keys.current.add(event.code);
      }
    };
    const up = (event: KeyboardEvent) => {
      keys.current.delete(event.code);
    };
    const mouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      canvas.focus({ preventScroll: true });
      dragging.current = true;
      lastMouse.current = { x: event.clientX, y: event.clientY };
      if (document.pointerLockElement !== canvas) {
        // Drag-to-look remains available when embedded browsers deny mouse lock.
        try {
          canvas.requestPointerLock?.()?.catch(() => {});
        } catch {
          /* Drag fallback. */
        }
      }
    };
    const mouseUp = () => {
      dragging.current = false;
    };
    const mouseMove = (event: MouseEvent) => {
      const locked = document.pointerLockElement === canvas;
      if (!locked && !dragging.current) return;
      const dx = locked ? event.movementX : event.clientX - lastMouse.current.x;
      const dy = locked ? event.movementY : event.clientY - lastMouse.current.y;
      lastMouse.current = { x: event.clientX, y: event.clientY };
      yaw.current -= dx * 0.0025;
      pitch.current = Math.max(
        -Math.PI / 2 + 0.02,
        Math.min(Math.PI / 2 - 0.02, pitch.current - dy * 0.0025),
      );
    };
    const lockChange = () => {
      if (document.pointerLockElement !== canvas) {
        reset();
        canvas.blur();
      }
    };
    const visibility = () => {
      if (document.hidden) reset();
    };
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("blur", reset);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", mouseUp);
    window.addEventListener("blur", reset);
    document.addEventListener("pointerlockchange", lockChange);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      reset();
      canvas.removeEventListener("mousedown", mouseDown);
      canvas.removeEventListener("blur", reset);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", mouseUp);
      window.removeEventListener("blur", reset);
      document.removeEventListener("pointerlockchange", lockChange);
      document.removeEventListener("visibilitychange", visibility);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      if (previousTabIndex === null) canvas.removeAttribute("tabindex");
      else canvas.setAttribute("tabindex", previousTabIndex);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (camera.name !== "roaming-camera") return;
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    const active =
      !document.hidden &&
      (document.pointerLockElement === gl.domElement ||
        document.activeElement === gl.domElement);
    const [x, z] = active
      ? walkingStep(yaw.current, keys.current, delta)
      : [0, 0];
    const from = camera.position;
    const desired = { x: from.x + x, z: from.z + z };
    const next =
      (x || z) && collisions
        ? collisions.move(from, desired, from.y - EYE_HEIGHT, 0.28)
        : desired;
    const moved = next.x !== from.x || next.z !== from.z;
    camera.position.x = next.x;
    camera.position.z = next.z;
    if (sharedSlot !== undefined) {
      const bounds = worldBounds(theme);
      camera.position.x = Math.max(
        bounds.minX,
        Math.min(bounds.maxX, camera.position.x),
      );
      camera.position.z = Math.max(
        bounds.minZ,
        Math.min(bounds.maxZ, camera.position.z),
      );
    }
    const ground = getTerrainHeight(
      camera.position.x,
      camera.position.z,
      theme,
    );
    camera.position.y = ground + EYE_HEIGHT;
    onPose?.({
      x: camera.position.x,
      y: ground,
      z: camera.position.z,
      yaw: yaw.current,
      motion: moved
        ? keys.current.has("ShiftLeft") || keys.current.has("ShiftRight")
          ? "Run"
          : "Walk"
        : "Idle",
    });
  });
  return null;
}
