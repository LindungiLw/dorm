"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES, GaugeIcon } from "@/components/nav";

// DESKTOP-ONLY floating capsule (left). On mobile, navigation is handled by the
// bottom-anchored MobileNav (module pill + the active module's sub-menu).
export function Sidebar({
  initials,
  photoUrl = null,
  isAdmin = false,
  adminHref,
}: {
  initials: string;
  photoUrl?: string | null;
  isAdmin?: boolean;
  adminHref?: string;
}) {
  const pathname = usePathname();
  const active = (m: string) => pathname.startsWith(m);

  return (
    <aside className="fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-navy-100 bg-white/95 p-2 shadow-lg backdrop-blur md:flex">
      <Link
        href="/dashboard/profile"
        aria-label="Profile"
        title="Profile"
        className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white ring-2 transition ${
          active("/dashboard/profile")
            ? "bg-navy-800 ring-navy-800"
            : "bg-navy-600 ring-transparent hover:ring-navy-200"
        }`}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </Link>

      <span className="my-0.5 h-px w-6 bg-navy-100" />

      {MODULES.map((m) => (
        <Link
          key={m.key}
          href={m.primary}
          aria-label={m.label}
          title={m.label}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
            active(m.base)
              ? "bg-navy-700 text-white"
              : "text-navy-500 hover:bg-navy-50 hover:text-navy-700"
          }`}
        >
          {m.icon}
        </Link>
      ))}

      {isAdmin && adminHref && (
        <Link
          href={adminHref}
          aria-label="Admin"
          title="Admin"
          className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
            pathname === adminHref
              ? "bg-navy-700 text-white"
              : "text-navy-500 hover:bg-navy-50"
          }`}
        >
          <GaugeIcon />
        </Link>
      )}
    </aside>
  );
}
