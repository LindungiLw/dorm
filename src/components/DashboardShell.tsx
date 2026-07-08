"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Sidebar } from "@/components/Sidebar";
import { BottomBar } from "@/components/BottomBar";
import { SubMenuCapsule } from "@/components/SubMenuCapsule";

export type ShellUser = {
  fullName: string;
  roleLabel: string;
  initials: string;
  photoUrl: string | null;
  isAdmin: boolean;
  adminHref?: string;
};

export function DashboardShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // The floating sidebar appears ONLY after a module is entered. On the landing
  // (module-selection) page it is hidden entirely, and content is full-width.
  const onLanding = pathname === "/dashboard";
  const showSidebar = !onLanding;

  return (
    <div className="min-h-screen">
      {showSidebar && (
        <>
          {/* Desktop: floating 3-module capsule (left) */}
          <Sidebar
            initials={user.initials}
            photoUrl={user.photoUrl}
            isAdmin={user.isAdmin}
            adminHref={user.adminHref}
          />
          {/* Mobile: main modules in a bottom bar + the active module's sub-menu on the side */}
          <BottomBar />
          <SubMenuCapsule />
        </>
      )}

      <header className="border-b border-navy-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Logo />
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
        </div>
      </header>

      <main
        className={`mx-auto max-w-5xl px-6 py-8 ${
          showSidebar ? "pb-28 md:pb-10" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}
