import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { isSecurityKiosk, canUsePermission } from "@/lib/authz/policy";

// Icon-only module launcher. Each icon jumps to the module's primary page; the second
// feature is reachable via the in-module subnav tabs.
const MODULES = [
  {
    title: "Cafetaria",
    icon: "🍽️",
    href: "/dashboard/cafeteria/menu",
    accent: "bg-gold/20",
  },
  {
    title: "Permission",
    icon: "🚪",
    href: "/dashboard/permission/exit",
    accent: "bg-navy-100",
  },
  {
    title: "Market",
    icon: "🛒",
    href: "/dashboard/market/catalog",
    accent: "bg-brandgreen/15",
  },
];

export default async function DashboardLanding() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  // A satpam account has no module picker — send it straight to its one page.
  if (isSecurityKiosk(actor)) redirect("/dashboard/security");

  // Staff / lecturers don't get the Permission module.
  const modules = MODULES.filter(
    (m) => m.title !== "Permission" || canUsePermission(actor),
  );

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-6">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-navy-800">
          Hi, {actor.fullName.split(" ")[0]} 👋
        </h1>
        <p className="mt-2 text-navy-500">Choose a module to get started.</p>
      </div>

      <div
        className={`grid gap-6 sm:gap-12 ${
          modules.length <= 2 ? "grid-cols-2" : "grid-cols-3"
        }`}
      >
        {modules.map((m) => (
          <Link
            key={m.title}
            href={m.href}
            aria-label={m.title}
            className="group flex flex-col items-center gap-3"
          >
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-3xl ${m.accent} text-4xl shadow-card transition duration-200 group-hover:-translate-y-1.5 group-hover:shadow-lg sm:h-28 sm:w-28 sm:text-6xl`}
            >
              {m.icon}
            </div>
            <span className="text-xs font-semibold text-navy-600 sm:text-sm">
              {m.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
