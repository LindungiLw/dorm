"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeModule } from "@/components/nav";

// MOBILE-ONLY floating side capsule showing the CURRENT module's sub-menu (e.g. inside
// Cafetaria → Check-in / Pengajuan). Hidden when not inside a module.
export function SubMenuCapsule() {
  const pathname = usePathname();
  const mod = activeModule(pathname);
  if (!mod) return null;

  return (
    <aside className="fixed left-2 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-full border border-navy-100 bg-white/95 p-1.5 shadow-lg backdrop-blur md:hidden">
      {mod.sub.map((s) => {
        const on = pathname === s.href;
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-label={s.label}
            title={s.label}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
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
