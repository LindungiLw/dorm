// JIUnity authorization = ROLE CAPABILITY  ∧  OBJECT OWNERSHIP / SCOPE.
//
// This is the single, central policy authority. Every Server Action and every
// protected read funnels through `can(actor, action, resource)`. Rules are defined
// here (central), but evaluated LOCALLY with the concrete target object in hand so
// ownership/scope can be checked. Fail-closed: any unknown action denies.
//
// Neither dimension alone is safe: role-only would let student A act on student B's
// order; ownership-only would let a student approve their own exit request.

export type Role =
  | "STUDENT"
  | "FACULTY"
  | "CAFETERIA_ADMIN"
  | "DORMITORY_ADMIN"
  | "ACADEMIC_ADMIN"
  | "MARKET_ADMIN"
  | "SECURITY"
  | "ROOT";

export type RoleGrant = {
  role: Role;
  scopeType: string | null; // "DORM" | "OUTLET" | null (campus-wide)
  scopeId: string | null;
};

export type Actor = {
  id: string;
  fullName: string;
  email: string;
  memberType: string; // STUDENT | STAFF | LECTURER | FACULTY (legacy)
  status: string; // ACTIVE | SUSPENDED | INACTIVE
  dormId: string | null;
  photoUrl: string | null; // Google account photo or custom upload
  idConfirmed: boolean; // has the member confirmed their real ID at onboarding
  roles: RoleGrant[];
};

export type Action =
  | "profile:read"
  | "profile:updateAllergy"
  | "profile:updateIdentity"
  | "profile:updatePhoto"
  | "coupon:view"
  | "coupon:activate"
  | "coupon:redeem"
  | "exit:create"
  | "exit:viewOwn"
  | "exit:listDorm"
  | "exit:listAll"
  | "exit:decide"
  | "cafeteria:manageMenu"
  | "cafeteria:manageAllergens"
  | "cafeteria:checkin"
  | "borrow:manage"
  | "market:manage"
  | "admin:grantRoles"
  | "reports:view";

// The concrete target of an authorization check.
export type Resource = {
  ownerId?: string; // the member who owns the object (coupon, request, profile)
  dormId?: string; // the org-unit the object belongs to (exit request, dorm scope)
};

export function hasRole(actor: Actor, role: Role): boolean {
  return actor.roles.some((r) => r.role === role);
}

// The Permission module (exit passes + borrowing) is for dorm-resident students only.
// Staff / lecturers (the @k-eduplex.net domain) don't get it.
export function canUsePermission(actor: Actor): boolean {
  return actor.memberType === "STUDENT";
}

export function roleNames(actor: Actor): Role[] {
  return actor.roles.map((r) => r.role);
}

// The org-unit scope ids an actor holds for a given role (e.g. which dorms a
// DORMITORY_ADMIN may act on).
export function scopesFor(actor: Actor, role: Role): (string | null)[] {
  return actor.roles.filter((r) => r.role === role).map((r) => r.scopeId);
}

// Meal entitlement is tied to the persona (student or faculty), not to a role — staff
// eat too. Admin-only accounts in this seed are still FACULTY memberType.
function isMealEntitled(actor: Actor): boolean {
  // Every campus member eats — student, lecturer, staff, or (legacy) faculty.
  return ["STUDENT", "FACULTY", "LECTURER", "STAFF"].includes(actor.memberType);
}

export function can(actor: Actor, action: Action, resource: Resource = {}): boolean {
  // A suspended/inactive member can do nothing that mutates or reads protected data.
  // (Defense in depth — such a member also can't obtain a live session.)
  if (actor.status !== "ACTIVE") return false;
  // Until the member confirms their real ID at onboarding they can't perform any action,
  // so a direct action POST can't slip past the onboarding gate.
  if (!actor.idConfirmed) return false;

  const ownsResource = resource.ownerId !== undefined && resource.ownerId === actor.id;

  switch (action) {
    // --- Ownership-scoped member actions (act only on your own object) ---
    case "profile:read":
    case "profile:updateAllergy":
    case "profile:updateIdentity":
    case "profile:updatePhoto":
    case "coupon:view":
      return ownsResource;

    case "coupon:activate":
    case "coupon:redeem":
      return ownsResource && isMealEntitled(actor);

    case "exit:create":
      // Exit-dorm requests are for dorm-resident students only. A security (satpam)
      // account is staff on duty, never a dorm resident, so it can never file a pass —
      // even if it was provisioned with a student-like persona.
      return (
        ownsResource &&
        actor.memberType === "STUDENT" &&
        actor.dormId != null &&
        !hasRole(actor, "SECURITY")
      );

    case "exit:viewOwn":
      return ownsResource;

    // --- Role + scope admin actions ---
    case "exit:listDorm":
      return (
        hasRole(actor, "DORMITORY_ADMIN") &&
        resource.dormId !== undefined &&
        scopesFor(actor, "DORMITORY_ADMIN").includes(resource.dormId)
      );

    // Campus security (satpam) sees every dorm's live "who is out" board.
    case "exit:listAll":
      return hasRole(actor, "SECURITY");

    // Closing a pass = dorm staff scoped to that dorm, OR campus security (any dorm).
    case "exit:decide":
      return (
        (hasRole(actor, "DORMITORY_ADMIN") &&
          resource.dormId !== undefined &&
          scopesFor(actor, "DORMITORY_ADMIN").includes(resource.dormId)) ||
        hasRole(actor, "SECURITY")
      );

    // Cafeteria staff: manage the menu / allergen list and check students in.
    case "cafeteria:manageMenu":
    case "cafeteria:manageAllergens":
    case "cafeteria:checkin":
      return hasRole(actor, "CAFETERIA_ADMIN");

    // The permission (dorm) admin maintains the campus borrow catalog.
    case "borrow:manage":
      return hasRole(actor, "DORMITORY_ADMIN");

    case "market:manage":
      return hasRole(actor, "MARKET_ADMIN");

    // Only ROOT (super-admin) may grant/revoke the module-admin roles.
    case "admin:grantRoles":
      return hasRole(actor, "ROOT");

    case "reports:view":
      return hasRole(actor, "ACADEMIC_ADMIN");

    // Deny by default — new features are inaccessible until a policy permits them.
    default:
      return false;
  }
}

// Throwing variant for use at the top of Server Actions.
export class AuthorizationError extends Error {
  constructor(action: string) {
    super(`Not authorized: ${action}`);
    this.name = "AuthorizationError";
  }
}

export function authorize(actor: Actor, action: Action, resource: Resource = {}): void {
  if (!can(actor, action, resource)) throw new AuthorizationError(action);
}

// After login everyone lands on the module-selection page. Admins reach their admin
// dashboards from the sidebar once inside a module.
export function homePathFor(_actor: Actor): string {
  return "/dashboard";
}

export type AdminConsole = { key: string; label: string; href: string };

// Every admin console the actor can reach, in priority order. Surfaced by the nav's admin
// gauge: one console links straight to it, several open a small picker. Someone who
// administers two features gets both here.
export function adminConsolesFor(actor: Actor): AdminConsole[] {
  const out: AdminConsole[] = [];
  if (hasRole(actor, "ROOT"))
    out.push({ key: "root", label: "Super Admin", href: "/dashboard/root" });
  if (hasRole(actor, "ACADEMIC_ADMIN"))
    out.push({ key: "academic", label: "Academic", href: "/dashboard/academic" });
  if (hasRole(actor, "DORMITORY_ADMIN"))
    out.push({ key: "dorm", label: "Dorm Access", href: "/dashboard/dorm" });
  if (hasRole(actor, "CAFETERIA_ADMIN"))
    out.push({ key: "cafeteria", label: "Cafeteria", href: "/dashboard/cafeteria" });
  if (hasRole(actor, "MARKET_ADMIN"))
    out.push({ key: "market", label: "Marketplace", href: "/dashboard/market/admin" });
  if (hasRole(actor, "SECURITY"))
    out.push({ key: "security", label: "Security", href: "/dashboard/security" });
  return out;
}

// The single admin dashboard used where only one destination is needed (e.g. the kiosk
// landing redirect). It is the highest-priority console the actor holds.
export function adminHomeFor(actor: Actor): string | null {
  return adminConsolesFor(actor)[0]?.href ?? null;
}

// A security (satpam) account is a single-purpose kiosk: its only page is the gate
// monitor. The module nav and every other menu are hidden for it. ROOT is never limited.
export function isSecurityKiosk(actor: Actor): boolean {
  return hasRole(actor, "SECURITY") && !hasRole(actor, "ROOT");
}
