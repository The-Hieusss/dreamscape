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
  if (session === null) return <Navigate to="/login" replace />;
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">My worlds</h1>
          <div className="flex flex-wrap gap-4">
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2"
              onClick={() =>
                navigate(`/world-builder?draft=${crypto.randomUUID()}`)
              }
            >
              New world
            </button>
            <Link
              className="rounded-lg bg-slate-800 px-4 py-2"
              to="/world-builder"
            >
              Open local draft
            </Link>
            <button
              className="px-2"
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) setError(error.message);
              }}
            >
              Sign out
            </button>
          </div>
        </header>
        {error ? (
          <p role="alert">{error}</p>
        ) : worlds === null ? (
          <p>Loading worlds…</p>
        ) : worlds.length === 0 ? (
          <p>Save a world from the builder to find it here.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {worlds.map((world) => (
              <li key={world.id}>
                <Link
                  className="block rounded-xl border border-white/15 p-5 hover:bg-white/10"
                  to={`/world-builder/${world.id}`}
                >
                  <h2 className="text-lg font-semibold">{world.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Edited {new Date(world.updated_at).toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
