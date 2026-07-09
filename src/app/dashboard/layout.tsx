import { redirect } from "next/navigation";
import { DashboardShell, type ShellUser } from "@/components/DashboardShell";
import { getCurrentActor } from "@/lib/auth/session";
import {
  hasRole,
  adminConsolesFor,
  isSecurityKiosk,
  canUsePermission,
  type Actor,
} from "@/lib/authz/policy";

function initialsOf(name: string): string {
  const words = name.replace(/[^A-Za-z ]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function roleLabel(actor: Actor): string {
  if (hasRole(actor, "ROOT")) return "Root";
  if (hasRole(actor, "ACADEMIC_ADMIN")) return "Academic Admin";
  if (hasRole(actor, "DORMITORY_ADMIN")) return "Dorm Admin";
  if (hasRole(actor, "CAFETERIA_ADMIN")) return "Cafeteria Admin";
  if (hasRole(actor, "MARKET_ADMIN")) return "Market Admin";
  if (hasRole(actor, "SECURITY")) return "Security";
  if (actor.memberType === "LECTURER") return "Lecturer";
  if (actor.memberType === "STAFF" || actor.memberType === "FACULTY") return "Staff";
  return "Student";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  // First login must confirm the real ID before anything else.
  if (!actor.idConfirmed) redirect("/onboarding");

  const user: ShellUser = {
    fullName: actor.fullName,
    roleLabel: roleLabel(actor),
    initials: initialsOf(actor.fullName),
    photoUrl: actor.photoUrl,
    adminConsoles: adminConsolesFor(actor),
    isKiosk: isSecurityKiosk(actor),
    canUsePermission: canUsePermission(actor),
  };

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
