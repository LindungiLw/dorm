"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  formatRupiah,
  type Product,
} from "@/lib/market-shared";

const CAT_EMOJI: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.emoji]),
);
const visual = (p: Product) => p.emoji || CAT_EMOJI[p.category] || "📦";

type SellerGroup = {
  key: string;
  storeName: string;
  qrisImage: string | null;
  qrisNumber: string | null;
  items: { p: Product; q: number }[];
  subtotal: number;
};

export function ProductCatalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  // Persist the cart across navigations.
  useEffect(() => {
    try {
      const s = localStorage.getItem("jiunity-cart");
      if (s) setCart(JSON.parse(s));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem("jiunity-cart", JSON.stringify(cart));
      } catch {
        /* ignore */
      }
    }
  }, [cart, loaded]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const qty = (id: string) => cart[id] ?? 0;

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const setQtyFor = (id: string, q: number) =>
    setCart((c) => {
      const next = { ...c };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "ALL" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, query, category]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce(
    (sum, [id, q]) => sum + (byId.get(id)?.price ?? 0) * q,
    0,
  );

  // Group the cart by seller — QRIS is per-merchant, so checkout shows one code each.
  const groups: SellerGroup[] = useMemo(() => {
    const m = new Map<string, SellerGroup>();
    for (const [id, q] of Object.entries(cart)) {
      const p = byId.get(id);
      if (!p) continue;
      const key = p.sellerKey ?? "__market__";
      let g = m.get(key);
      if (!g) {
        g = {
          key,
          storeName: p.storeName ?? "JIUnity Marketplace",
          qrisImage: p.qrisImage ?? null,
          qrisNumber: p.qrisNumber ?? null,
          items: [],
          subtotal: 0,
        };
        m.set(key, g);
      }
      g.items.push({ p, q });
      g.subtotal += p.price * q;
    }
    return [...m.values()];
  }, [cart, byId]);

  const openCheckout = () => {
    setSelected(null);
    setCartOpen(false);
    setPaidAmount(null);
    setCheckoutOpen(true);
  };

  const markPaid = () => {
    setPaidAmount(cartTotal);
    setCart({});
  };

  return (
    <div>
      {/* Search + cart */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-300">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="input w-full pl-9"
            aria-label="Search products"
          />
        </div>
        <CartButton count={cartCount} onClick={() => setCartOpen(true)} />
      </div>

      {/* Category chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={category === "ALL"} onClick={() => setCategory("ALL")}>
          All
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            active={category === c.value}
            onClick={() => setCategory(c.value)}
          >
            <span aria-hidden>{c.emoji}</span> {c.label}
          </Chip>
        ))}
      </div>

      {/* Grid — two columns on phones so cards stay compact */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-navy-400">
          No products found{query ? ` for “${query}”` : ""}.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(p);
                }
              }}
              className="flex cursor-pointer flex-col rounded-2xl border border-navy-100 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex aspect-square items-center justify-center rounded-xl bg-navy-50 text-4xl">
                {visual(p)}
              </div>
              <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-navy-800">
                {p.name}
              </h3>
              <p className="mt-0.5 text-[11px] text-navy-400">
                {CATEGORY_LABEL[p.category] ?? p.category}
              </p>
              <p className="mt-1 font-bold text-navy-700">{formatRupiah(p.price)}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  add(p.id);
                }}
                className="btn-gold mt-2 w-full py-1.5 text-xs"
              >
                {qty(p.id) > 0 ? `In cart · ${qty(p.id)}` : "Add to cart"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Product detail — centered */}
      {selected && (
        <Overlay onClose={() => setSelected(null)}>
          <div className="flex justify-end">
            <CloseButton onClick={() => setSelected(null)} />
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-navy-50 text-6xl">
              {visual(selected)}
            </div>
            <span className="mt-3 inline-block rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
              {CATEGORY_LABEL[selected.category] ?? selected.category}
            </span>
            <h2 className="mt-2 text-xl font-bold text-navy-800">{selected.name}</h2>
            <p className="mt-1 text-2xl font-bold text-navy-700">
              {formatRupiah(selected.price)}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-navy-500">
              {selected.description}
            </p>
          </div>

          {/* Add to cart + separate cart button (with count) */}
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => add(selected.id)}
              className="btn-gold flex-1"
            >
              {qty(selected.id) > 0
                ? `Add to cart · ${qty(selected.id)}`
                : "Add to cart"}
            </button>
            <CartButton count={cartCount} onClick={() => setCartOpen(true)} />
          </div>

          {/* Checkout */}
          <button
            type="button"
            onClick={() => {
              if (qty(selected.id) === 0) add(selected.id);
              openCheckout();
            }}
            className="btn-primary mt-3 w-full"
          >
            Checkout
          </button>
        </Overlay>
      )}

      {/* Cart */}
      {cartOpen && (
        <Overlay onClose={() => setCartOpen(false)}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-800">Your cart</h2>
            <CloseButton onClick={() => setCartOpen(false)} />
          </div>
          {cartCount === 0 ? (
            <p className="py-6 text-center text-sm text-navy-400">
              Your cart is empty.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-navy-50">
                {Object.entries(cart).map(([id, q]) => {
                  const p = byId.get(id);
                  if (!p) return null;
                  return (
                    <li key={id} className="flex items-center gap-3 py-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-xl">
                        {visual(p)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-800">
                          {p.name}
                        </p>
                        <p className="text-xs text-navy-400">
                          {formatRupiah(p.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Stepper
                          onDec={() => setQtyFor(id, q - 1)}
                          onInc={() => setQtyFor(id, q + 1)}
                          value={q}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-navy-100 pt-3">
                <span className="text-sm text-navy-500">Total</span>
                <span className="text-lg font-bold text-navy-800">
                  {formatRupiah(cartTotal)}
                </span>
              </div>
              <button
                type="button"
                onClick={openCheckout}
                className="btn-gold mt-4 w-full"
              >
                Checkout
              </button>
            </>
          )}
        </Overlay>
      )}

      {/* Checkout — QRIS payment */}
      {checkoutOpen && (
        <Overlay onClose={() => setCheckoutOpen(false)}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-800">Checkout</h2>
            <CloseButton onClick={() => setCheckoutOpen(false)} />
          </div>

          {paidAmount !== null ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-11 w-11 text-emerald-600"
                  aria-hidden
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <h3 className="mt-5 text-xl font-bold text-navy-800">
                Payment marked as paid
              </h3>
              <p className="mt-1 text-navy-500">
                {formatRupiah(paidAmount)} · show this to the seller.
              </p>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="btn-primary mt-6 w-full"
              >
                Done
              </button>
            </div>
          ) : cartCount === 0 ? (
            <p className="py-6 text-center text-sm text-navy-400">
              Your cart is empty.
            </p>
          ) : (
            <>
              <div className="space-y-4">
                {groups.map((g) => (
                  <div
                    key={g.key}
                    className="rounded-2xl border border-navy-100 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-navy-800">{g.storeName}</p>
                      <QrisBadge />
                    </div>
                    <ul className="mt-1 text-xs text-navy-400">
                      {g.items.map(({ p, q }) => (
                        <li key={p.id}>
                          {p.name} × {q}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-col items-center">
                      {g.qrisImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={g.qrisImage}
                          alt={`QRIS ${g.storeName}`}
                          className="h-44 w-44 rounded-xl border border-navy-100 bg-white object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-44 w-44 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-navy-200 bg-navy-50 px-4 text-center text-xs text-navy-400">
                          <span className="text-2xl">🏷️</span>
                          Seller hasn&rsquo;t set up QRIS. Pay on pickup.
                        </div>
                      )}
                      {g.qrisNumber && (
                        <p className="mt-1 text-xs text-navy-400">
                          ID: {g.qrisNumber}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-navy-400">Scan to pay</p>
                      <p className="text-lg font-bold text-navy-800">
                        {formatRupiah(g.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-navy-100 pt-3">
                <span className="text-sm text-navy-500">Total</span>
                <span className="text-lg font-bold text-navy-800">
                  {formatRupiah(cartTotal)}
                </span>
              </div>
              <button
                type="button"
                onClick={markPaid}
                className="btn-gold mt-4 w-full"
              >
                I&rsquo;ve paid
              </button>
              <p className="mt-2 text-center text-xs text-navy-400">
                Scan the QRIS above with your bank / e-wallet app, then confirm.
              </p>
            </>
          )}
        </Overlay>
      )}
    </div>
  );
}

function CartButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex shrink-0 items-center justify-center rounded-xl border border-navy-100 bg-white px-3 py-2 text-navy-700 transition hover:bg-navy-50"
      aria-label={`Open cart${count > 0 ? ` (${count} items)` : ""}`}
    >
      <CartIcon />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy-900">
          {count}
        </span>
      )}
    </button>
  );
}

function QrisBadge() {
  return (
    <span className="rounded-md bg-navy-800 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">
      QRIS
    </span>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-navy-700 text-white"
          : "border border-navy-100 bg-white text-navy-600 hover:bg-navy-50"
      }`}
    >
      {children}
    </button>
  );
}

function Stepper({
  value,
  onInc,
  onDec,
}: {
  value: number;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-navy-100">
      <button
        type="button"
        onClick={onDec}
        aria-label="Decrease"
        className="flex h-7 w-7 items-center justify-center rounded-full text-navy-600 hover:bg-navy-50"
      >
        −
      </button>
      <span className="min-w-[1rem] text-center text-sm font-semibold text-navy-800">
        {value}
      </span>
      <button
        type="button"
        onClick={onInc}
        aria-label="Increase"
        className="flex h-7 w-7 items-center justify-center rounded-full text-navy-600 hover:bg-navy-50"
      >
        +
      </button>
    </div>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-navy-400 hover:bg-navy-50"
    >
      ✕
    </button>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2l2.4 12.3a1 1 0 0 0 1 .7h9.3a1 1 0 0 0 1-.78L21 7H6" />
    </svg>
  );
}
