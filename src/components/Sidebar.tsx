import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { models } from "../lib/ModelRegistry";
import ModelPreview from "./ModelPreview";
import {
  ArrowBigRightDash,
  ArrowBigLeftDash,
  Search,
  Star,
  StarOff,
  ChevronDown,
  Rows3,
  Grid2x2,
  SlidersHorizontal,
} from "lucide-react";

const FAVORITES_KEY = "dreamscape:favs";

type M = (typeof models)[number];

export default function Sidebar() {
  /* -------- State (persisted favorites) ---------- */
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      if (Array.isArray(saved)) setFavorites(saved);
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  /* -------- Responsive breakpoint ---------- */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* -------- Group + Derived ---------- */
  const grouped = useMemo(() => {
    return models.reduce(
      (acc, m) => {
        (acc[m.category] ||= []).push(m);
        return acc;
      },
      {} as Record<string, M[]>
    );
  }, []);

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [width, setWidth] = useState(280);
  const [resizing, setResizing] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [density, setDensity] = useState<"cozy" | "compact">("cozy");
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);
  const [sort, setSort] = useState<"az" | "za">("az");

  // Auto collapse on mobile
  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  const favModels = useMemo(
    () => models.filter((m) => favorites.includes(m.path)),
    [favorites]
  );

  const filterMatch = (m: M) =>
    m.name.toLowerCase().includes(search.toLowerCase());

  const toggleFavorite = (path: string) =>
    setFavorites((f) =>
      f.includes(path) ? f.filter((x) => x !== path) : [...f, path]
    );

  /* -------- Sorting ---------- */
  function sortList(list: M[]) {
    return [...list].sort((a, b) =>
      sort === "az"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  }

  /* -------- Resize (desktop) ---------- */
  const onMouseDown = (e: React.MouseEvent) => {
    if (collapsed || isMobile) return;
    setResizing(true);
    e.preventDefault();
  };
  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizing) return;
      setWidth(Math.min(Math.max(e.clientX, 220), 460));
    },
    [resizing]
  );
  const stopResize = useCallback(() => setResizing(false), []);
  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopResize);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [onMouseMove, stopResize]);

  /* -------- Keyboard nav (simple) ---------- */
  const itemRefs = useRef<HTMLDivElement[]>([]);
  const flatList = useMemo(() => {
    const base = showOnlyFavs ? favModels : models;
    return sortList(base.filter(filterMatch));
  }, [showOnlyFavs, favModels, sort, search]);

  function handleKey(e: React.KeyboardEvent) {
    if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const current = document.activeElement;
    const idx = itemRefs.current.findIndex((r) => r === current);
    const dir = e.key === "ArrowDown" ? 1 : -1;
    const next = itemRefs.current[idx + dir];
    next?.focus();
  }

  const open = !collapsed;

  return (
    <>
      {/* Overlay (mobile) */}
      {isMobile && open && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Toggle FAB */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className={`fixed z-50 rounded-full shadow-lg transition-colors backdrop-blur
          ${isMobile ? "bottom-4 left-4" : "top-4 left-4"}
          bg-dream-indigo/80 hover:bg-dream-indigo text-white w-12 h-12 flex items-center justify-center border border-white/10`}
        aria-label={collapsed ? "Open library" : "Close library"}
      >
        {collapsed ? (
          <ArrowBigRightDash size={22} />
        ) : (
          <ArrowBigLeftDash size={22} />
        )}
      </button>

      {/* Shell */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          backdrop-blur-xl border-r border-white/10
          transition-all duration-300 ease-out
          ${
            isMobile
              ? `w-[80vw] max-w-[380px] ${
                  open
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-full opacity-0"
                }`
              : `${open ? "opacity-100" : "opacity-0 pointer-events-none"}`
          }
        `}
        style={!isMobile ? { width: open ? width : 0 } : undefined}
        aria-label="Model library"
      >
        {open && (
          <>
            {/* Top Bar */}
            <div className="px-4 pt-4 pb-3 border-b border-white/10 space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <div className="flex items-center gap-2 flex-1 bg-white/5 rounded-lg px-2 h-10 border border-white/10 focus-within:ring-2 ring-dream-indigo/60">
                  <Search size={16} className="text-white/50 shrink-0" />
                  <input
                    placeholder="Search models..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent outline-none text-sm text-white placeholder-white/40 flex-1"
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => setShowOnlyFavs((f) => !f)}
                    className={`p-2 rounded-lg border text-xs font-medium transition
                    ${
                      showOnlyFavs
                        ? "bg-yellow-400/20 text-yellow-300 border-yellow-300/30"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                    }`}
                    aria-pressed={showOnlyFavs}
                    title="Toggle favorites filter"
                  >
                    <Star size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setView((v) => (v === "grid" ? "list" : "grid"))
                    }
                    className="p-2 rounded-lg border bg-white/5 hover:bg-dream-indigo/40 text-white/70 border-white/10 transition"
                    title="Toggle layout"
                  >
                    {view === "grid" ? (
                      <Rows3 size={16} />
                    ) : (
                      <Grid2x2 size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Secondary controls */}
              <div className="flex items-center gap-2 text-[11px] text-white/60 flex-wrap">
                <button
                  onClick={() =>
                    setDensity((d) => (d === "cozy" ? "compact" : "cozy"))
                  }
                  className="px-2 py-1 rounded-md bg-white/5 hover:bg-dream-indigo/40 border border-white/10"
                >
                  {density === "cozy" ? "Cozy" : "Compact"}
                </button>
                <button
                  onClick={() => setSort((s) => (s === "az" ? "za" : "az"))}
                  className="px-2 py-1 rounded-md bg-white/5 hover:bg-dream-indigo/40 border border-white/10 inline-flex items-center gap-1"
                >
                  <SlidersHorizontal size={12} /> {sort.toUpperCase()}
                </button>
                <span className="ml-auto text-white/40">
                  {flatList.length} items
                </span>
              </div>

              {/* Quick favorites carousel */}
              {favModels.length > 0 && !showOnlyFavs && (
                <div className="flex gap-2 overflow-x-auto hide-scroll pt-1 pb-1">
                  {favModels.slice(0, 12).map((m) => (
                    <button
                      key={m.path}
                      onClick={() => setSearch(m.name)}
                      className="relative flex-shrink-0 px-3 py-1 rounded-full text-[11px] bg-white/10 hover:bg-dream-indigo/40 border border-white/10 text-white/80"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scroll area */}
            <div
              className="flex-1 overflow-y-auto px-4 pb-6 space-y-5 custom-scroll"
              onKeyDown={handleKey}
            >
              {showOnlyFavs ? (
                <ItemGrid
                  items={sortList(favModels.filter(filterMatch))}
                  view={view}
                  density={density}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  itemRefs={itemRefs}
                />
              ) : (
                Object.entries(grouped).map(([cat, list]) => {
                  const filtered = sortList(list.filter(filterMatch));
                  if (!filtered.length) return null;
                  const open = openCategory === cat;
                  return (
                    <div
                      key={cat}
                      className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm hover:border-dream-indigo/50 transition"
                    >
                      <button
                        onClick={() =>
                          setOpenCategory((o) => (o === cat ? null : cat))
                        }
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-white/80 hover:text-white"
                      >
                        <span className="flex items-center gap-2">
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${
                              open ? "rotate-180" : ""
                            }`}
                          />
                          {cat}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">
                            {filtered.length}
                          </span>
                        </span>
                        <span className="text-[10px] text-white/40">
                          {open ? "Hide" : "Show"}
                        </span>
                      </button>
                      {open && (
                        <div className="px-3 pb-3">
                          <ItemGrid
                            items={filtered}
                            view={view}
                            density={density}
                            favorites={favorites}
                            toggleFavorite={toggleFavorite}
                            itemRefs={itemRefs}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {!flatList.length && (
                <p className="text-xs text-white/50 pt-10 text-center">
                  No matches.
                </p>
              )}
            </div>
          </>
        )}

        {/* Resize handle (desktop) */}
        {!isMobile && (
          <div
            onMouseDown={onMouseDown}
            className={`absolute top-0 right-0 h-full w-1 cursor-col-resize ${
              collapsed ? "hidden" : ""
            } ${resizing ? "bg-dream-indigo/60" : "bg-transparent"}`}
          />
        )}
      </aside>
    </>
  );
}

/* ------------ Item Grid / List ------------ */
function ItemGrid({
  items,
  view,
  density,
  favorites,
  toggleFavorite,
  itemRefs,
}: {
  items: M[];
  view: "grid" | "list";
  density: "cozy" | "compact";
  favorites: string[];
  toggleFavorite: (p: string) => void;
  itemRefs: React.MutableRefObject<HTMLDivElement[]>;
}) {
  const gap = density === "compact" ? "gap-2" : "gap-3";
  const cellPad = density === "compact" ? "p-1.5" : "p-2.5";
  const nameCls =
    "mt-1 text-center leading-tight " +
    (density === "compact" ? "text-[9px]" : "text-[10px]");

  if (view === "list") {
    return (
      <div className="flex flex-col divide-y divide-white/10 rounded-lg overflow-hidden">
        {items.map((m, i) => {
          const fav = favorites.includes(m.path);
          return (
            <div
              key={m.path}
              ref={(el) => {
                if (el) itemRefs.current[i] = el;
              }}
              tabIndex={0}
              draggable
              onDragStart={(e) => onDrag(e, m)}
              className="relative flex items-center gap-3 px-3 py-2 focus:outline-none focus:ring-2 ring-dream-indigo/60 rounded hover:bg-dream-indigo/20 cursor-grab group"
            >
              <div className="h-10 w-10 rounded-md bg-white/10 flex items-center justify-center overflow-hidden">
                <ModelPreview path={m.path} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {m.name}
                </p>
                <p className="text-[10px] text-white/50 truncate">
                  {m.category}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(m.path);
                }}
                aria-label={fav ? "Unfavorite" : "Favorite"}
                className="text-white/40 hover:text-yellow-300 transition"
              >
                {fav ? <Star size={14} /> : <StarOff size={14} />}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid
  return (
    <div
      className={`grid ${gap} ${
        density === "compact" ? "grid-cols-3" : "grid-cols-2"
      }`}
    >
      {items.map((m, i) => {
        const fav = favorites.includes(m.path);
        return (
          <div
            key={m.path}
            ref={(el) => {
              if (el) itemRefs.current[i] = el;
            }}
            tabIndex={0}
            draggable
            onDragStart={(e) => onDrag(e, m)}
            className={`group relative flex flex-col items-center rounded-xl 
              bg-white/10 hover:bg-dream-indigo/20 border border-white/10 
              hover:border-dream-indigo/50 shadow-[0_0_10px_rgba(99,102,241,0.3)] 
              transition cursor-grab focus:outline-none focus:ring-2 ring-dream-indigo/60 ${cellPad}`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(m.path);
              }}
              className="absolute top-1 right-1 text-white/40 hover:text-yellow-300"
              aria-label={fav ? "Unfavorite" : "Favorite"}
            >
              {fav ? <Star size={14} /> : <StarOff size={14} />}
            </button>
            <div className="w-full aspect-square flex items-center justify-center overflow-hidden rounded-md bg-black/20">
              <ModelPreview path={m.path} />
            </div>
            <p className={nameCls}>{m.name}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ------------ Drag helper ------------ */
function onDrag(e: React.DragEvent, m: M) {
  e.dataTransfer.setData("application/object-path", m.path);
  e.dataTransfer.setData("application/object-name", m.name);
  e.dataTransfer.setData("application/object-category", m.category);
}
