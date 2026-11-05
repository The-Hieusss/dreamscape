import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { MathUtils } from "three";
import type { Group } from "three";
import type { RealtimeChannel } from "@supabase/supabase-js";
import SceneManager from "../components/SceneManager";
import AnimatedModel from "../components/AnimatedModel";
import type { PlayerPose } from "../components/roaming/FirstPersonController";
import supabase from "../lib/supabase/client";
import { loginUrl, useSession } from "../lib/useSession";
import { readSnapshot } from "../lib/worldStorage";
import type { SceneSnapshot } from "../lib/worldStorage";
import type { MoveDirection } from "../lib/objectMovement";
import { modelAnimations } from "../lib/modelAnimations";

interface Room {
  id: string;
  slot: number;
  name: string;
  scene: SceneSnapshot;
  expiresAt: string;
}

const noop = () => {};
const rotationTool = { enabled: false, snap: false };
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function validPose(pose: unknown): pose is PlayerPose {
  if (!pose || typeof pose !== "object") return false;
  const p = pose as PlayerPose;
  return (
    [p.x, p.y, p.z, p.yaw].every(
      (n) => Number.isFinite(n) && Math.abs(n) < 10000,
    ) && ["Idle", "Walk", "Run"].includes(p.motion)
  );
}

function RemoteAvatar({
  pose,
  motion,
  slot,
}: {
  pose: RefObject<PlayerPose | null>;
  motion: PlayerPose["motion"];
  slot: number;
}) {
  const group = useRef<Group>(null);
  const initialized = useRef(false);
  useFrame((_, dt) => {
    if (!pose.current || !group.current) return;
    const { x, y, z, yaw } = pose.current;
    const weight = initialized.current ? 1 - Math.exp(-14 * dt) : 1;
    initialized.current = true;
    group.current.position.set(
      MathUtils.lerp(group.current.position.x, x, weight),
      MathUtils.lerp(group.current.position.y, y, weight),
      MathUtils.lerp(group.current.position.z, z, weight),
    );
    const delta = yaw + Math.PI - group.current.rotation.y;
    group.current.rotation.y +=
      Math.atan2(Math.sin(delta), Math.cos(delta)) * weight;
  });
  return (
    <group ref={group}>
      <AnimatedModel
        path={
          slot === 0
            ? "/models/Characters/Knight.glb"
            : "/models/Characters/Farmer.glb"
        }
        animation={`CharacterArmature|${motion}`}
        speed={0}
        stickToTerrain={false}
      />
      <Html position={[0, 2.2, 0]} center style={{ pointerEvents: "none" }}>
        <span className="whitespace-nowrap rounded bg-slate-950/85 px-2 py-1 text-xs text-white">
          {slot === 0 ? "Host" : "Guest"}
        </span>
      </Html>
    </group>
  );
}

function RoomScene({ room }: { room: Room }) {
  const [status, setStatus] = useState("Connecting…");
  const [peerOnline, setPeerOnline] = useState(false);
  const [hasPose, setHasPose] = useState(false);
  const [motion, setMotion] = useState<PlayerPose["motion"]>("Idle");
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);
  const localPose = useRef<PlayerPose | null>(null);
  const remotePose = useRef<PlayerPose | null>(null);
  const movementRef = useRef<
    ((direction: MoveDirection, distance: number) => void) | null
  >(null);
  const objects = useMemo(
    () =>
      room.scene.objects.map((object, index) => ({
        ...object,
        editorId: object.editorId ?? `shared-${index}`,
        speed: 0,
        animation: /walk|run|gallop|wander|swim/i.test(object.animation ?? "")
          ? (modelAnimations(object.modelPath).find((clip) =>
              /(^|[|_])idle$/i.test(clip),
            ) ?? "")
          : object.animation,
      })),
    [room.scene.objects],
  );
  const world = useMemo(
    () => (room.scene.settings ? { ...room.scene.settings, objects } : null),
    [room.scene.settings, objects],
  );

  useEffect(() => {
    let live = true;
    let connected = false;
    let channel: RealtimeChannel | undefined;
    const expiresIn = Math.max(0, Date.parse(room.expiresAt) - Date.now());
    const expiry = window.setTimeout(() => {
      setExpired(true);
      connected = false;
      if (channel) void supabase.removeChannel(channel);
    }, expiresIn);
    const presenceKey = crypto.randomUUID();
    const begin = async () => {
      await supabase.realtime.setAuth();
      if (!live || Date.now() >= Date.parse(room.expiresAt)) return;
      channel = supabase.channel(`explore:${room.id}`, {
        config: { private: true, presence: { key: presenceKey } },
      });
      const current = channel;
      current
        .on("presence", { event: "sync" }, () => {
          if (!live) return;
          const online = Object.values(
            current.presenceState<{ slot: number }>(),
          )
            .flat()
            .some((p) => p.slot === 1 - room.slot);
          setPeerOnline(online);
          if (!online) {
            remotePose.current = null;
            setHasPose(false);
          }
        })
        .on("broadcast", { event: "pose" }, ({ payload }) => {
          if (
            !live ||
            payload?.slot !== 1 - room.slot ||
            !validPose(payload.pose)
          )
            return;
          remotePose.current = payload.pose;
          setMotion(payload.pose.motion);
          setHasPose(true);
        })
        .subscribe(async (state) => {
          if (!live) return;
          connected = state === "SUBSCRIBED";
          setStatus(connected ? "Connected" : "Reconnecting…");
          if (connected) await current.track({ slot: room.slot });
          else {
            remotePose.current = null;
            setHasPose(false);
            setPeerOnline(false);
          }
        });
    };
    void begin().catch(() => {
      if (live) setStatus("Connection unavailable. Reload to retry.");
    });
    const sender = window.setInterval(() => {
      if (connected && localPose.current)
        void channel?.send({
          type: "broadcast",
          event: "pose",
          payload: { slot: room.slot, pose: localPose.current },
        });
    }, 100);
    return () => {
      live = false;
      clearInterval(sender);
      clearTimeout(expiry);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [room]);

  if (expired)
    return (
      <main className="p-8">
        <p>This room has expired.</p>
        <Link to="/my-worlds">My worlds</Link>
      </main>
    );
  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      <SceneManager
        roaming
        sharedSlot={room.slot}
        onPose={(pose) => {
          localPose.current = pose;
        }}
        world={world}
        objects={objects}
        selectedId={null}
        onSelect={noop}
        onAddObject={noop}
        movementRef={movementRef}
        onMove={noop}
        rotationTool={rotationTool}
        onRotate={noop}
      >
        {peerOnline && hasPose && (
          <RemoteAvatar
            pose={remotePose}
            motion={motion}
            slot={1 - room.slot}
          />
        )}
      </SceneManager>
      <section className="absolute left-3 top-3 max-w-xs space-y-2 rounded-xl bg-slate-950/90 p-4 text-sm text-white">
        <h1 className="font-semibold">{room.name}</h1>
        <p role="status">
          {status} · {peerOnline ? "2 exploring" : "1 exploring"}
        </p>
        <p>
          Click the scene and use WASD or arrows to walk. Press Esc to release
          the mouse.
        </p>
        {room.slot === 0 && (
          <label className="block">
            Invite link
            <input
              className="mt-1 w-full rounded bg-slate-800 p-2"
              value={window.location.href}
              readOnly
              onFocus={(e) => e.target.select()}
            />
            <button
              className="mt-2 rounded bg-indigo-600 px-3 py-1"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Copied" : "Copy invite"}
            </button>
          </label>
        )}
        <Link className="inline-block underline" to="/my-worlds">
          Leave room
        </Link>
      </section>
    </main>
  );
}

export default function ExploreRoom() {
  const { roomId } = useParams();
  const session = useSession();
  const userId = session?.user.id;
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!userId || !roomId || !uuid.test(roomId)) return;
    let active = true;
    const load = async () => {
      const joined = await supabase.rpc("join_exploration_room", {
        room_code: roomId,
      });
      if (joined.error) throw new Error(joined.error.message);
      const result = await supabase
        .from("exploration_rooms")
        .select("world_id,revision,expires_at")
        .eq("id", roomId)
        .single();
      if (result.error) throw new Error(result.error.message);
      const { world_id, revision, expires_at } = result.data;
      const version = await supabase
        .from("world_versions")
        .select("name,scene")
        .eq("world_id", world_id)
        .eq("revision", revision)
        .single();
      if (version.error) throw new Error(version.error.message);
      if (active)
        setRoom({
          id: roomId,
          slot: joined.data,
          name: version.data.name,
          scene: readSnapshot(version.data.scene),
          expiresAt: expires_at,
        });
    };
    void load().catch((err: Error) => {
      if (active) setError(err.message);
    });
    return () => {
      active = false;
    };
  }, [roomId, userId]);
  if (session === null)
    return <Navigate to={loginUrl(window.location.pathname)} replace />;
  if (room && room.id === roomId) return <RoomScene room={room} />;
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <p role="status">
        {!roomId || !uuid.test(roomId)
          ? "Invalid invitation."
          : error || "Joining exploration…"}
      </p>
      <Link to="/my-worlds">My worlds</Link>
    </main>
  );
}
