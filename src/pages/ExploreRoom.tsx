import CameraViewToggle, {
  type CameraView,
} from "../components/roaming/CameraViewToggle";
import Combatant from "../components/fps/Combatant";
import { KNIGHT_MODEL, SWORD_SWING_MS } from "../components/roaming/playerView";
import CoopRange from "../components/fps/CoopRange";
import type { CoopTransport } from "../components/fps/CoopRange";
import { validCombatCommand, validCombatSnapshot } from "../lib/coopCombat";
import type { CombatSnapshot, Slot } from "../lib/coopCombat";
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
  slot: Slot;
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
  sword,
  swings,
}: {
  pose: RefObject<PlayerPose | null>;
  motion: PlayerPose["motion"] | "Death";
  slot: number;
  sword: boolean;
  swings: number;
}) {
  const group = useRef<Group>(null);
  const initialized = useRef(false);
  const swingUntil = useRef(0);
  useEffect(() => {
    swingUntil.current = swings > 0 ? performance.now() + SWORD_SWING_MS : 0;
  }, [swings]);
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
      {sword ? (
        <Combatant
          id={-1}
          fighter="knight"
          position={[0, 0, 0]}
          dead={motion === "Death"}
          active={() => true}
          damagePlayer={() => {}}
          readAvatar={() => ({
            x: 0,
            y: 0,
            z: 0,
            yaw: 0,
            armed: true,
            clip:
              performance.now() < swingUntil.current
                ? "Sword_Slash"
                : motion === "Idle"
                  ? "Idle_Sword"
                  : motion,
          })}
        />
      ) : (
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
      )}
      <Html position={[0, 2.2, 0]} center style={{ pointerEvents: "none" }}>
        <span className="whitespace-nowrap rounded bg-slate-950/85 px-2 py-1 text-xs text-white">
          {slot === 0 ? "Host" : "Guest"}
        </span>
      </Html>
    </group>
  );
}

function RoomScene({ room }: { room: Room }) {
  const [explorationView, setExplorationView] = useState<CameraView>("third");
  const [status, setStatus] = useState("Connecting…");
  const [peerOnline, setPeerOnline] = useState(false);
  const [hasPose, setHasPose] = useState(false);
  const [motion, setMotion] = useState<PlayerPose["motion"]>("Idle");
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);
  const localPose = useRef<PlayerPose | null>(null);
  const remotePose = useRef<PlayerPose | null>(null);
  const remoteAt = useRef(-Infinity);
  const connectedRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [round, setRound] = useState<string | null>(null);
  const [combat, setCombat] = useState<CombatSnapshot | null>(null);
  const [hostPaused, setHostPaused] = useState(false);
  const transport = useMemo<CoopTransport>(
    () => ({
      ready: () =>
        connectedRef.current &&
        localPose.current !== null &&
        remotePose.current !== null &&
        performance.now() - remoteAt.current < 1500,
      pose: (slot) =>
        slot === room.slot ? localPose.current : remotePose.current,
      send: (event, payload) => {
        if (connectedRef.current)
          void channelRef.current?.send({ type: "broadcast", event, payload });
      },
      incoming: null,
      snapshot: null,
      receivedAt: -Infinity,
    }),
    [room.slot],
  );

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
    const closeRoom = () => {
      setExpired(true);
      connected = false;
      connectedRef.current = false;
      if (channel) void supabase.removeChannel(channel);
    };
    const expiry = window.setTimeout(closeRoom, expiresIn);
    // A channel can retain its authorization after the room row is deleted.
    const roomCheck = window.setInterval(async () => {
      if (!live || !connected) return;
      const { data, error } = await supabase
        .from("exploration_rooms")
        .select("id")
        .eq("id", room.id)
        .maybeSingle();
      if (live && !error && !data) closeRoom();
    }, 10_000);
    const presenceKey = crypto.randomUUID();
    const begin = async () => {
      await supabase.realtime.setAuth();
      if (!live || Date.now() >= Date.parse(room.expiresAt)) return;
      channel = supabase.channel(`explore:${room.id}`, {
        config: { private: true, presence: { key: presenceKey } },
      });
      const current = channel;
      channelRef.current = current;
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
          remoteAt.current = performance.now();
          setMotion(payload.pose.motion);
          setHasPose(true);
        })
        .on("broadcast", { event: "combat-state" }, ({ payload }) => {
          if (!live || room.slot !== 1 || !validCombatSnapshot(payload)) return;
          transport.snapshot = payload;
          transport.receivedAt = performance.now();
          setRound(payload.round);
        })
        .on("broadcast", { event: "combat-command" }, ({ payload }) => {
          if (live && room.slot === 0 && validCombatCommand(payload))
            transport.incoming = payload;
        })
        .subscribe(async (state) => {
          if (!live) return;
          connected = state === "SUBSCRIBED";
          connectedRef.current = connected;
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
      setHostPaused(
        !transport.ready() ||
          (room.slot === 1 && performance.now() - transport.receivedAt >= 1500),
      );
      if (connected && localPose.current)
        void channel?.send({
          type: "broadcast",
          event: "pose",
          payload: { slot: room.slot, pose: localPose.current },
        });
    }, 100);
    return () => {
      live = false;
      connectedRef.current = false;
      channelRef.current = null;
      clearInterval(sender);
      clearInterval(roomCheck);
      clearTimeout(expiry);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [room, transport]);

  const hunt = world?.theme === "hunt";
  const villageMelee = world?.theme === "village";
  const currentCombat = combat?.round === round ? combat : null;
  const player = currentCombat?.players[room.slot];
  const teammate = currentCombat?.players[1 - room.slot];
  const remaining = currentCombat?.enemies.filter(
    (enemy) => enemy.hp > 0,
  ).length;

  if (expired)
    return (
      <main className="p-8">
        <p>This room is no longer available.</p>
        <Link to="/my-worlds">My worlds</Link>
      </main>
    );
  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      <SceneManager
        roaming
        combatMode={!!round || hunt}
        explorationView={explorationView}
        sharedSlot={room.slot}
        roundKey={round ?? undefined}
        deathAvatar={
          player?.health === 0
            ? villageMelee || room.slot === 0
              ? KNIGHT_MODEL
              : "/models/Characters/Farmer.glb"
            : undefined
        }
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
        {round && (
          <CoopRange
            key={round}
            round={round}
            slot={room.slot}
            theme={world?.theme}
            transport={transport}
            onState={setCombat}
          />
        )}
        {peerOnline && hasPose && (
          <RemoteAvatar
            pose={remotePose}
            motion={
              combat?.round === round &&
              combat?.players[1 - room.slot].health === 0
                ? "Death"
                : motion
            }
            slot={1 - room.slot}
            sword={!!round && villageMelee}
            swings={villageMelee ? (teammate?.shots ?? 0) : 0}
          />
        )}
      </SceneManager>
      {round && !villageMelee && player?.health !== 0 && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-white"
          aria-hidden="true"
        >
          +
        </div>
      )}
      <section className="absolute left-3 top-3 max-w-xs space-y-2 rounded-xl bg-slate-950/90 p-4 text-sm text-white">
        <h1 className="font-semibold">{room.name}</h1>
        <p role="status">
          {status} · {peerOnline ? "2 exploring" : "1 exploring"}
        </p>
        <p>
          Click the scene and use WASD or arrows to walk. Press Esc to release
          the mouse.
        </p>
        {!round && !hunt && (
          <CameraViewToggle
            view={explorationView}
            onChange={setExplorationView}
          />
        )}
        {round && (
          <div className="space-y-1 border-t border-white/20 pt-2">
            <h2 className="font-semibold">
              {hunt ? "Co-op T. rex hunt" : "Co-op combat"}
            </h2>
            {remaining === 0 ? (
              <p>{hunt ? "Hunt complete" : "Round cleared"}</p>
            ) : player?.health === 0 && teammate?.health === 0 ? (
              <p>Team defeated</p>
            ) : hostPaused ? (
              <p>Paused · waiting for {room.slot === 0 ? "guest" : "host"}</p>
            ) : currentCombat && currentCombat.startsIn > 0 ? (
              <p>
                {hunt ? "Hunt" : "Combat"} starts in {currentCombat.startsIn}…
              </p>
            ) : null}
            {player && teammate && (
              <p>
                Health {player.health} · Teammate {teammate.health} ·{" "}
                {hunt ? "T. rexes left" : "Enemies"} {remaining}
              </p>
            )}
            {player && (
              <p>
                {!villageMelee &&
                  (player.reloading
                    ? "Reloading… · "
                    : `Ammo ${player.ammo} / 30 · `)}
                Hits {player.hits} / {player.shots}
              </p>
            )}
            {player?.health === 0 && teammate && teammate.health > 0 ? (
              <p>
                You’re down. Your teammate can finish the{" "}
                {hunt ? "hunt" : "round"}.
              </p>
            ) : (
              <p>
                {villageMelee
                  ? "Left click to swing your sword. Get close to land a hit."
                  : "Left click to fire · R to reload"}
                {hunt && " · Wounded T. rexes charge. One bite is fatal."}
              </p>
            )}
          </div>
        )}
        {room.slot === 0 && (
          <button
            type="button"
            disabled={!peerOnline || !hasPose}
            className="block rounded bg-indigo-600 px-3 py-1 disabled:opacity-50"
            onClick={() => {
              transport.incoming = null;
              setCombat(null);
              setRound(crypto.randomUUID());
            }}
          >
            {hunt
              ? round
                ? "Restart hunt"
                : "Start co-op hunt"
              : round
                ? "Restart combat round"
                : "Start co-op combat"}
          </button>
        )}
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
