"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/components/nav";
import { AdminGauge } from "@/components/AdminGauge";
import type { AdminConsole } from "@/lib/authz/policy";

// DESKTOP-ONLY floating capsule (left). On mobile, navigation is handled by the
// bottom-anchored MobileNav (module pill + the active module's sub-menu).
export function Sidebar({
  initials,
  photoUrl = null,
  consoles = [],
  canUsePermission = true,
}: {
  initials: string;
  photoUrl?: string | null;
  consoles?: AdminConsole[];
  canUsePermission?: boolean;
}) {
  const pathname = usePathname();
  const active = (m: string) => pathname.startsWith(m);
  // Staff / lecturers don't get the Permission module.
  const modules = MODULES.filter((m) => m.key !== "permission" || canUsePermission);

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

      {modules.map((m) => (
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

      {consoles.length > 0 && <AdminGauge consoles={consoles} placement="right" />}
    </aside>
  );
}
