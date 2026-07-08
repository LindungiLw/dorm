"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/components/nav";

// MOBILE-ONLY floating pill nav, anchored at the bottom. Same capsule look as the
// desktop Sidebar (rounded-full, border, shadow, backdrop-blur) but horizontal.
// Shows the 3 main modules only — profile lives in the top header avatar.
export function BottomBar() {
  const pathname = usePathname();
  const active = (m: string) => pathname.startsWith(m);

  return (
    <nav className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-navy-100 bg-white/95 p-1.5 shadow-lg backdrop-blur md:hidden">
      {MODULES.map((m) => {
        const on = active(m.base);
        return (
          <Link
            key={m.key}
            href={m.primary}
            aria-label={m.label}
            title={m.label}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
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
  );
}
