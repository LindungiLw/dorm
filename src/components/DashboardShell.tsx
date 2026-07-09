"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { SubMenuCapsule } from "@/components/SubMenuCapsule";
import { logoutAction } from "@/lib/auth/actions";
import type { AdminConsole } from "@/lib/authz/policy";

export type ShellUser = {
  fullName: string;
  roleLabel: string;
  initials: string;
  photoUrl: string | null;
  adminConsoles: AdminConsole[];
  isKiosk?: boolean;
};

export function DashboardShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // A satpam (security) account is a single-purpose kiosk: no module nav at all, and a
  // stripped header (just the logo and a sign-out) — its one page is the gate monitor.
  const isKiosk = user.isKiosk ?? false;

  // The floating sidebar appears ONLY after a module is entered. On the landing
  // (module-selection) page it is hidden entirely, and content is full-width.
  const onLanding = pathname === "/dashboard";
  const showModuleNav = !onLanding && !isKiosk;

  return (
    <div className="min-h-screen">
      {showModuleNav && (
        <>
          {/* Desktop: floating 3-module capsule (left) */}
          <Sidebar
            initials={user.initials}
            photoUrl={user.photoUrl}
            consoles={user.adminConsoles}
          />
          {/* Mobile: bottom module pill + the active module's icon sub-menu on the side */}
          <MobileNav consoles={user.adminConsoles} />
          <SubMenuCapsule />
        </>
      )}

      <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link
            href={isKiosk ? "/dashboard/security" : "/dashboard"}
            aria-label="Home"
            className="rounded-lg transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
          >
            <Logo />
          </Link>

          {isKiosk ? (
            // Kiosk: no profile menu — only who they are and a way to sign out.
            <div className="flex items-center gap-3">
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-semibold leading-tight text-navy-800">
                  {user.fullName}
                </span>
                <span className="block text-xs leading-tight text-navy-400">
                  {user.roleLabel}
                </span>
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/dashboard/profile"
              aria-label="Open profile"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-navy-50"
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-navy-600 text-xs font-bold text-white">
                {user.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user.initials
                )}
              </span>
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-semibold leading-tight text-navy-800">
                  {user.fullName}
                </span>
                <span className="block text-xs leading-tight text-navy-400">
                  {user.roleLabel}
                </span>
              </span>
            </Link>
          )}
        </div>
      </header>

      <main
        className={`mx-auto max-w-5xl px-6 py-8 ${
          showModuleNav
            ? "pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10"
            : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}
