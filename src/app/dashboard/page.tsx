import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { isSecurityKiosk, canUsePermission } from "@/lib/authz/policy";
import { getLandingNotifications, type Notif } from "@/lib/domain/notifications";

// Icon-only module launcher. Each icon jumps to the module's primary page; the second
// feature is reachable via the in-module subnav tabs.
const MODULES = [
  {
    title: "Cafeteria",
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

const TONE_BG: Record<Notif["tone"], string> = {
  action: "bg-gold/20",
  warn: "bg-amber-100",
  success: "bg-emerald-100",
  info: "bg-navy-50",
};

export default async function DashboardLanding() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  // A satpam account has no module picker — send it straight to its one page.
  if (isSecurityKiosk(actor)) redirect("/dashboard/security");

  // Staff / lecturers don't get the Permission module.
  const modules = MODULES.filter(
    (m) => m.title !== "Permission" || canUsePermission(actor),
  );

  const notifs = await getLandingNotifications(actor);

  return (
    <div className="mx-auto max-w-xl py-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-navy-800">
          Hi, {actor.fullName.split(" ")[0]} 👋
        </h1>
        <p className="mt-2 text-navy-500">Choose a module to get started.</p>
      </div>

      <div className="flex justify-center">
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

      <div className="mt-12">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-400">
          Notifications
        </h2>
        {notifs.length === 0 ? (
          <p className="rounded-2xl border border-navy-100 bg-white px-4 py-6 text-center text-sm text-navy-400">
            You&rsquo;re all caught up 🎉
          </p>
        ) : (
          <ul className="space-y-2">
            {notifs.map((n) => (
              <NotifRow key={n.id} n={n} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NotifRow({ n }: { n: Notif }) {
  const body = (
    <div className="flex items-center gap-3 rounded-2xl border border-navy-100 bg-white px-4 py-3 shadow-sm transition hover:shadow-md">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl ${TONE_BG[n.tone]}`}
      >
        {n.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy-800">{n.title}</p>
        {n.detail && <p className="truncate text-xs text-navy-500">{n.detail}</p>}
      </div>
      {n.href && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-navy-300"
          aria-hidden
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      )}
    </div>
  );

  return n.href ? (
    <li>
      <Link href={n.href}>{body}</Link>
    </li>
  ) : (
    <li>{body}</li>
  );
}
