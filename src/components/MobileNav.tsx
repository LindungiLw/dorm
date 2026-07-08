"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MODULES, activeModule } from "@/components/nav";

// MOBILE-ONLY navigation. A single region pinned to the bottom of the VIEWPORT (so it
// never scrolls with the page and never overlaps side content the way the old left-edge
// capsule did): the current module's sub-menu sits just above the 3-module pill.
//
// - `fixed inset-x-0 bottom-0` + safe-area padding keeps it stable across the mobile
//   browser's dynamic toolbar and notched devices.
// - The wrapper is `pointer-events-none` so taps fall through the empty gaps to content;
//   only the pills themselves are interactive.
// - The sub-menu pill scrolls horizontally WITHIN itself if a module has many items. The
//   active chip is auto-centred and edge fades signal there's more to scroll, so nothing
//   is ever silently cut off (the page itself still doesn't scroll sideways).
export function MobileNav() {
  const pathname = usePathname();
  const inModule = (base: string) => pathname.startsWith(base);
  const mod = activeModule(pathname);

  const scrollerRef = useRef<HTMLElement | null>(null);
  const activeChipRef = useRef<HTMLAnchorElement | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdges((p) => (p.left === left && p.right === right ? p : { left, right }));
  }, []);

  // Centre the active sub-item (so a deep-link to a rightmost item is visible) and
  // recompute the fade edges whenever the route or module changes.
  useEffect(() => {
    activeChipRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
    updateEdges();
  }, [pathname, mod, updateEdges]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [mod, updateEdges]);

  // Fade only the side that actually has more content to reveal.
  const maskImage = `linear-gradient(to right, ${
    edges.left ? "transparent" : "#000"
  }, #000 1.25rem, #000 calc(100% - 1.25rem), ${edges.right ? "transparent" : "#000"})`;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      {/* Current module's sub-menu — labelled, horizontally scrollable if it overflows */}
      {mod && (
        <nav
          ref={scrollerRef}
          aria-label={`${mod.label} menu`}
          style={{ WebkitMaskImage: maskImage, maskImage }}
          className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-navy-100 bg-white/95 p-1.5 shadow-lg backdrop-blur [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {mod.sub.map((s) => {
            const on = pathname === s.href;
            return (
              <Link
                key={s.href}
                href={s.href}
                ref={on ? activeChipRef : undefined}
                aria-label={s.label}
                aria-current={on ? "page" : undefined}
                className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full pl-3 pr-3.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-1 ${
                  on ? "bg-navy-700 text-white" : "text-navy-500 hover:bg-navy-50"
                }`}
              >
                <span className="shrink-0" aria-hidden>
                  {s.icon}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Main modules — icon pill */}
      <nav
        aria-label="Main menu"
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-navy-100 bg-white/95 p-1.5 shadow-lg backdrop-blur"
      >
        {MODULES.map((m) => {
          const on = inModule(m.base);
          return (
            <Link
              key={m.key}
              href={m.primary}
              aria-label={m.label}
              title={m.label}
              aria-current={on ? "true" : undefined}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-1 ${
                on
                  ? "bg-navy-700 text-white"
                  : "text-navy-500 hover:bg-navy-50 hover:text-navy-700"
              }`}
            >
              {m.icon}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
