"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeModule } from "@/components/nav";
import { AdminGauge } from "@/components/AdminGauge";
import type { AdminConsole } from "@/lib/authz/policy";

// MOBILE-ONLY nav: a floating pill pinned to the bottom-centre of the viewport. It holds a
// Home button (back to the module picker) + the CURRENT module's sub-menu, so the sub-nav
// lives in one place instead of duplicating the module picker. Admins get a gauge to their
// console(s). Module switching happens on the Home landing page.
export function MobileNav({ consoles = [] }: { consoles?: AdminConsole[] }) {
  const pathname = usePathname();
  const mod = activeModule(pathname);
  const subs = mod?.sub ?? [];

  const item = (on: boolean) =>
    `flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-1 ${
      on
        ? "bg-navy-700 text-white"
        : "text-navy-500 hover:bg-navy-50 hover:text-navy-700"
    }`;

  const divider = (
    <span className="mx-0.5 h-6 w-px shrink-0 bg-navy-100" aria-hidden />
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <nav
        aria-label="Menu"
        className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-navy-100 bg-white/95 p-1.5 shadow-lg backdrop-blur [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {/* Home — back to the module picker (where you switch modules) */}
        <Link href="/dashboard" aria-label="Home" title="Home" className={item(false)}>
          <HomeIcon />
        </Link>

        {/* The active module's sub-menu */}
        {subs.length > 0 && divider}
        {subs.map((s) => {
          const on = pathname === s.href;
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-label={s.label}
              title={s.label}
              aria-current={on ? "page" : undefined}
              className={item(on)}
            >
              {s.icon}
            </Link>
          );
        })}

        {/* Admin console(s) — only for admins granted by ROOT */}
        {consoles.length > 0 && (
          <>
            {divider}
            <AdminGauge consoles={consoles} placement="top" />
          </>
        )}
      </nav>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}
