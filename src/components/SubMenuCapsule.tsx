"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { activeModule } from "@/components/nav";

// MOBILE-ONLY sub-menu for the current module: a compact ICON-ONLY capsule on the left
// edge, like a mini sidebar. It auto-hides while you scroll DOWN (so it doesn't sit over
// what you're reading) and slides back in when you scroll UP or reach the top.
export function SubMenuCapsule() {
  const pathname = usePathname();
  const mod = activeModule(pathname);

  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        // Ignore tiny jitters; hide going down (past a small threshold), reveal going up.
        if (Math.abs(delta) > 6) {
          setHidden(delta > 0 && y > 48);
          lastY.current = y;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Always reveal again when the route/module changes.
  useEffect(() => {
    setHidden(false);
    lastY.current = typeof window !== "undefined" ? window.scrollY : 0;
  }, [pathname]);

  if (!mod) return null;

  return (
    <aside
      aria-label={`${mod.label} menu`}
      className={`fixed left-2 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-full border border-navy-100 bg-white/95 p-1.5 shadow-lg backdrop-blur transition-all duration-300 ease-out md:hidden ${
        hidden
          ? "pointer-events-none -translate-x-[140%] opacity-0"
          : "translate-x-0 opacity-100"
      }`}
    >
      {mod.sub.map((s) => {
        const on = pathname === s.href;
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-label={s.label}
            title={s.label}
            aria-current={on ? "page" : undefined}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 ${
              on ? "bg-navy-700 text-white" : "text-navy-500 hover:bg-navy-50"
            }`}
          >
            {s.icon}
          </Link>
        );
      })}
    </aside>
  );
}
