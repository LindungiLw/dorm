"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/components/nav";

// MOBILE-ONLY bottom navigation bar — the 3 main modules + profile, ICON-ONLY.
export function BottomBar({ initials }: { initials: string }) {
  const pathname = usePathname();
  const active = (m: string) => pathname.startsWith(m);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-navy-100 bg-white/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-2px_10px_rgba(14,22,51,0.06)] backdrop-blur md:hidden">
      {MODULES.map((m) => {
        const on = active(m.base);
        return (
          <Link
            key={m.key}
            href={m.primary}
            aria-label={m.label}
            title={m.label}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
              on
                ? "bg-navy-50 text-navy-700"
                : "text-navy-400 hover:bg-navy-50 hover:text-navy-600"
            }`}
          >
            {m.icon}
          </Link>
        );
      })}

      <Link
        href="/dashboard/profile"
        aria-label="Profile"
        title="Profile"
        className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
          pathname.startsWith("/dashboard/profile")
            ? "bg-navy-50"
            : "hover:bg-navy-50"
        }`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-600 text-[10px] font-bold text-white">
          {initials}
        </span>
      </Link>
    </nav>
  );
}
