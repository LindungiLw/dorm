"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/components/nav";

// MOBILE-ONLY main-module nav: a floating icon pill pinned to the bottom-centre of the
// viewport (so it never scrolls with the page). The per-module sub-menu lives in the
// side capsule (see SubMenuCapsule).
export function MobileNav() {
  const pathname = usePathname();
  const inModule = (base: string) => pathname.startsWith(base);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
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
