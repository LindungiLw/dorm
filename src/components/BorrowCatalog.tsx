"use client";

import { useEffect, useMemo, useState } from "react";
import { type BorrowItemRow, type BorrowStatus } from "@/lib/domain/borrow-types";

/* ---------------------------------------------------------------------------
   Student-facing borrow catalog. Items are maintained by the permission admin
   (see BorrowManager) and read from the database. The Request button is still a
   client-side micro-interaction — the borrowing workflow itself is not persisted.
--------------------------------------------------------------------------- */

const STATUS: Record<BorrowStatus, { label: string; cls: string; dot: string }> = {
  AVAILABLE: { label: "Available", cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  LIMITED: { label: "Limited", cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  BORROWED: { label: "Unavailable", cls: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

export function BorrowCatalog({ items }: { items: BorrowItemRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [favs, setFavs] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<BorrowItemRow | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("jiunity-borrow-favs");
      if (s) setFavs(JSON.parse(s));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem("jiunity-borrow-favs", JSON.stringify(favs));
      } catch {
        /* ignore */
      }
    }
  }, [favs, loaded]);

  const toggleFav = (id: string) =>
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  // Categories come from what admins actually typed (no fixed list).
  const cats = useMemo(
    () => [...new Set(items.map((it) => it.category).filter(Boolean))].sort(),
    [items],
  );

  const filters = useMemo(
    () => [
      { key: "ALL", label: "All" },
      ...cats.map((c) => ({ key: c, label: c })),
      { key: "FAV", label: "Favorites" },
    ],
    [cats],
  );

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((it) => {
      if (filter === "FAV" && !favs.includes(it.id)) return false;
      if (filter !== "ALL" && filter !== "FAV" && it.category !== filter) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.location.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q)
      );
    });
    return cats
      .map((c) => ({ name: c, items: filtered.filter((it) => it.category === c) }))
      .filter((g) => g.items.length > 0);
  }, [items, cats, query, filter, favs]);

  const empty = groups.length === 0;

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search rooms & items…"
          aria-label="Search borrowable items"
          className="w-full rounded-full border border-navy-200 bg-white py-2.5 pl-10 pr-4 text-base text-navy-900 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200 sm:text-sm"
        />
      </div>

      {/* Filter chips */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filter === f.key
                ? "bg-navy-700 text-white shadow-sm"
                : "border border-navy-100 bg-white text-navy-600 hover:bg-navy-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grouped sections */}
      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-navy-400">
          No items yet. Please check back soon.
        </p>
      ) : empty ? (
        <p className="py-12 text-center text-sm text-navy-400">
          No items found{query ? ` for “${query}”` : ""}.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.name} className="mb-6">
            <div className="mb-2.5 flex items-baseline justify-between">
              <h2 className="text-base font-bold text-navy-800">{g.name}</h2>
              <span className="text-xs text-navy-400">{g.items.length} items</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {g.items.map((it) => (
                <ItemCard
                  key={it.id}
                  it={it}
                  fav={favs.includes(it.id)}
                  onFav={() => toggleFav(it.id)}
                  onOpen={() => setSelected(it)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {selected && (
        <DetailSheet
          it={selected}
          fav={favs.includes(selected.id)}
          onFav={() => toggleFav(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Thumb({ it, className }: { it: BorrowItemRow; className: string }) {
  if (it.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={it.imageUrl} alt="" className={`object-cover ${className}`} />
    );
  }
  return (
    <span className={`flex items-center justify-center bg-navy-50 ${className}`}>
      {it.emoji ?? "📦"}
    </span>
  );
}

function ItemCard({
  it,
  fav,
  onFav,
  onOpen,
}: {
  it: BorrowItemRow;
  fav: boolean;
  onFav: () => void;
  onOpen: () => void;
}) {
  const s = STATUS[it.status];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[22px] border border-navy-100 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3]">
        <Thumb it={it} className="h-full w-full text-5xl transition duration-200 group-hover:scale-105" />
        <span
          className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
        <button
          type="button"
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
          className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-navy-500 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <HeartIcon filled={fav} />
        </button>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-navy-800">{it.name}</h3>
        <p className="text-[11px] text-navy-400">{it.category}</p>
        <div className="mt-2 space-y-1 text-[11px] text-navy-500">
          {it.location && (
            <span className="flex items-center gap-1.5">
              <PinIcon /> <span className="line-clamp-1">{it.location}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <BoxIcon />{" "}
            {it.status === "BORROWED"
              ? "Currently unavailable"
              : `${it.quantity} available`}
          </span>
        </div>
      </div>
    </div>
  );
}

function DetailSheet({
  it,
  fav,
  onFav,
  onClose,
}: {
  it: BorrowItemRow;
  fav: boolean;
  onFav: () => void;
  onClose: () => void;
}) {
  const s = STATUS[it.status];
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");

  const request = () => {
    if (it.status === "BORROWED" || phase !== "idle") return;
    setPhase("loading");
    setTimeout(() => setPhase("done"), 700);
  };

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-navy-100 sm:hidden" />

        <div className="flex items-start gap-4">
          <Thumb it={it} className="h-20 w-20 shrink-0 rounded-2xl text-4xl" />
          <div className="min-w-0 flex-1">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            <h2 className="mt-1 text-lg font-bold text-navy-800">{it.name}</h2>
            <p className="text-xs text-navy-400">{it.category}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={fav ? "Remove from favorites" : "Add to favorites"}
              onClick={onFav}
              className="flex h-8 w-8 items-center justify-center rounded-full text-navy-400 hover:bg-navy-50"
            >
              <HeartIcon filled={fav} />
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-navy-400 hover:bg-navy-50"
            >
              ✕
            </button>
          </div>
        </div>

        {it.description && (
          <p className="mt-3 text-sm leading-relaxed text-navy-500">{it.description}</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          {it.location && (
            <InfoTile icon={<PinIcon />} label="Location" value={it.location} />
          )}
          {it.schedule && (
            <InfoTile icon={<ClockIcon />} label="Schedule" value={it.schedule} />
          )}
          <InfoTile
            icon={<BoxIcon />}
            label="Available"
            value={`${it.quantity}`}
          />
          <InfoTile icon={<TagIcon />} label="Status" value={s.label} />
        </div>

        {it.parts.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-navy-800">What&rsquo;s inside</p>
            <ul className="flex flex-wrap gap-2">
              {it.parts.map((p, i) => (
                <li
                  key={i}
                  className="rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-700"
                >
                  {p.name} · {p.qty}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={request}
          disabled={it.status === "BORROWED" || phase === "loading" || phase === "done"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-4 text-base font-bold text-navy-900 shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-navy-100 disabled:text-navy-400"
        >
          {it.status === "BORROWED" ? (
            "Currently unavailable"
          ) : phase === "loading" ? (
            <>
              <Spinner /> Requesting…
            </>
          ) : phase === "done" ? (
            "✓ Request submitted"
          ) : (
            "Request to borrow"
          )}
        </button>
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-navy-50 bg-navy-50/40 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-navy-400">
        {icon} {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-navy-800">{value}</p>
    </div>
  );
}

/* ---- icons (inline SVG, currentColor) ---- */
const ic = {
  width: 13,
  height: 13,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};
function SearchIcon() {
  return (
    <svg {...ic} width={18} height={18}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg {...ic}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg {...ic}>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg {...ic}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg {...ic}>
      <path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </svg>
  );
}
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill={filled ? "#e11d48" : "none"}
      stroke={filled ? "#e11d48" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/30 border-t-navy-900" />
  );
}
