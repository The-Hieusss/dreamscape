import {
  ArrowUpRight,
  FolderOpen,
  Globe2,
  Layers3,
  LogOut,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import supabase from "../lib/supabase/client";
import { useSession } from "../lib/useSession";
import type { SavedWorld } from "../lib/worldStorage";

type WorldSummary = Pick<SavedWorld, "id" | "name" | "updated_at" | "revision">;

export default function MyWorlds() {
  const session = useSession();
  const navigate = useNavigate();
  const userId = session?.user.id;
  const [worlds, setWorlds] = useState<WorldSummary[] | null>(null);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function deleteWorld(id: string) {
    if (!userId || deleting || confirmId !== id) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const { data, error } = await supabase
        .from("worlds")
        .delete()
        .eq("id", id)
        .eq("owner_id", userId)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data)
        throw new Error(
          "This world could not be deleted. Refresh your world list and try again.",
        );
      setWorlds(
        (previous) => previous?.filter((world) => world.id !== id) ?? [],
      );
      setConfirmId(null);
      try {
        localStorage.removeItem(`dreamscape:draft:${id}`);
      } catch {
        setDeleteError(
          "World deleted. This browser prevented removing its local recovery draft.",
        );
      }
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Could not delete the world. Try again.",
      );
    } finally {
      setDeleting(false);
    }
  }
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void supabase
      .from("worlds")
      .select("id,name,revision,updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        setError(error?.message ?? "");
        setWorlds(data ?? []);
      });
    return () => {
      active = false;
    };
  }, [userId]);
  const createWorld = () =>
    navigate(`/world-builder?draft=${crypto.randomUUID()}`);
  if (session === null) return <Navigate to="/login" replace />;
  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-[#0a0818] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_14%_12%,#392079_0%,transparent_52%),radial-gradient(ellipse_at_86%_22%,#541c59_0%,transparent_49%),radial-gradient(ellipse_at_75%_100%,#073644_0%,transparent_45%)]"
      />
      <header className="border-b border-white/10 bg-black/15 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-indigo-300"
          >
            <img src="/dreamscape.logo.png" alt="" className="size-9" />
            <span className="bg-gradient-to-r from-pink-200 to-blue-200 bg-clip-text font-display text-sm font-bold text-transparent sm:text-lg">
              DreamScape
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/15"
            onClick={async () => {
              const { error } = await supabase.auth.signOut();
              if (error) setError(error.message);
            }}
          >
            <LogOut aria-hidden="true" size={15} /> Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-14 pt-12 sm:px-8 sm:pt-16">
        <div className="mb-9 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-200/20 bg-purple-200/10 px-3 py-1 text-xs font-semibold tracking-wide text-purple-100">
              <Sparkles aria-hidden="true" size={14} /> Your workspace
            </p>
            <h1 className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text font-display text-4xl font-bold leading-tight text-transparent sm:text-6xl">
              My worlds
            </h1>
            <p className="mt-3 text-base text-slate-200/85">
              Pick up a world you saved or start building a new one.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20"
              to="/world-builder"
            >
              <FolderOpen aria-hidden="true" size={17} /> Open local draft
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-950/50 hover:bg-indigo-500"
              onClick={createWorld}
            >
              <Plus aria-hidden="true" size={18} /> New world
            </button>
          </div>
        </div>
        <div className="mb-4 flex items-center gap-3 border-b border-white/15 pb-3">
          <Layers3 aria-hidden="true" size={19} className="text-purple-200" />
          <h2 className="font-heading text-lg font-semibold">Saved worlds</h2>
          {worlds && !error && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-purple-100">
              {worlds.length}
            </span>
          )}
        </div>
        {deleteError && (
          <p role="alert" className="text-red-300">
            {deleteError}
          </p>
        )}
        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-300/30 bg-red-950/40 p-5 text-red-100"
          >
            {error}
          </p>
        ) : worlds === null ? (
          <p
            role="status"
            className="rounded-2xl border border-white/15 bg-white/5 p-6 text-slate-200"
          >
            Loading worlds…
          </p>
        ) : worlds.length === 0 ? (
          <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-[radial-gradient(ellipse_at_50%_0%,#a78bfa24,transparent_70%)] bg-white/5 px-6 py-12 text-center shadow-2xl shadow-black/25 sm:py-10">
            <div
              aria-hidden="true"
              className="relative mx-auto mb-6 grid size-24 place-items-center rounded-3xl border border-purple-200/25 bg-gradient-to-br from-indigo-400/25 to-pink-400/15 text-purple-100 shadow-lg shadow-indigo-900/40"
            >
              <Globe2 size={46} strokeWidth={1.2} />
              <Sparkles
                size={20}
                className="absolute -right-2 -top-2 text-pink-200"
              />
            </div>
            <h3 className="font-display text-xl font-semibold sm:text-2xl">
              Build your first world
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-200/85">
              Choose a terrain, place a few models, and save your scene to find
              it here next time.
            </p>
            <button
              type="button"
              onClick={createWorld}
              className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold hover:bg-indigo-500"
            >
              Start building <ArrowUpRight aria-hidden="true" size={17} />
            </button>
          </section>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {worlds.map((world) => (
              <li
                key={world.id}
                className="rounded-2xl border border-white/15 bg-white/[0.07] p-5 shadow-lg shadow-black/15 backdrop-blur"
              >
                <Link
                  className="group block rounded-lg hover:text-indigo-200"
                  to={`/world-builder/${world.id}`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl border border-purple-200/20 bg-indigo-400/15 text-purple-100">
                      <Globe2 aria-hidden="true" size={21} />
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      size={18}
                      className="text-slate-300 group-hover:text-white"
                    />
                  </div>
                  <h3 className="break-words font-heading text-lg font-semibold">
                    {world.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Edited {new Date(world.updated_at).toLocaleDateString()}
                  </p>
                </Link>
                {confirmId === world.id ? (
                  <div className="mt-4 space-y-2 border-t border-white/15 pt-3">
                    <p className="text-sm text-slate-300">
                      Permanently delete {world.name}, its saved versions, and
                      all of its invite rooms?
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="rounded bg-red-700 px-3 py-1 disabled:opacity-50"
                        disabled={deleting}
                        onClick={() => void deleteWorld(world.id)}
                      >
                        {deleting ? "Deleting…" : "Delete permanently"}
                      </button>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => setConfirmId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={deleting}
                    aria-label={`Delete ${world.name}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-red-200 hover:bg-red-400/10 disabled:opacity-50"
                    onClick={() => {
                      setDeleteError("");
                      setConfirmId(world.id);
                    }}
                  >
                    <Trash2 aria-hidden="true" size={14} /> Delete world
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
