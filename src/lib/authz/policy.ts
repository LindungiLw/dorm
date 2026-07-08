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
  | "ACADEMIC_ADMIN";

export type RoleGrant = {
  role: Role;
  scopeType: string | null; // "DORM" | "OUTLET" | null (campus-wide)
  scopeId: string | null;
};

export type Actor = {
  id: string;
  fullName: string;
  email: string;
  memberType: string; // STUDENT | FACULTY
  status: string; // ACTIVE | SUSPENDED | INACTIVE
  dormId: string | null;
  roles: RoleGrant[];
};

export type Action =
  | "profile:read"
  | "profile:updateAllergy"
  | "coupon:view"
  | "coupon:activate"
  | "coupon:redeem"
  | "exit:create"
  | "exit:viewOwn"
  | "exit:listDorm"
  | "exit:decide"
  | "cafeteria:manageMenu"
  | "cafeteria:manageAllergens"
  | "cafeteria:checkin"
  | "reports:view";

// The concrete target of an authorization check.
export type Resource = {
  ownerId?: string; // the member who owns the object (coupon, request, profile)
  dormId?: string; // the org-unit the object belongs to (exit request, dorm scope)
};

export function hasRole(actor: Actor, role: Role): boolean {
  return actor.roles.some((r) => r.role === role);
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
  return actor.memberType === "STUDENT" || actor.memberType === "FACULTY";
}

export function can(actor: Actor, action: Action, resource: Resource = {}): boolean {
  // A suspended/inactive member can do nothing that mutates or reads protected data.
  // (Defense in depth — such a member also can't obtain a live session.)
  if (actor.status !== "ACTIVE") return false;

  const ownsResource = resource.ownerId !== undefined && resource.ownerId === actor.id;

  switch (action) {
    // --- Ownership-scoped member actions (act only on your own object) ---
    case "profile:read":
    case "profile:updateAllergy":
    case "coupon:view":
      return ownsResource;

    case "coupon:activate":
    case "coupon:redeem":
      return ownsResource && isMealEntitled(actor);

    case "exit:create":
      // Exit-dorm requests are for dorm-resident students.
      return (
        ownsResource &&
        actor.memberType === "STUDENT" &&
        actor.dormId != null
      );

    case "exit:viewOwn":
      return ownsResource;

    // --- Role + scope admin actions ---
    case "exit:listDorm":
    case "exit:decide":
      return (
        hasRole(actor, "DORMITORY_ADMIN") &&
        resource.dormId !== undefined &&
        scopesFor(actor, "DORMITORY_ADMIN").includes(resource.dormId)
      );

    // Cafeteria staff: manage the menu / allergen list and check students in.
    case "cafeteria:manageMenu":
    case "cafeteria:manageAllergens":
    case "cafeteria:checkin":
      return hasRole(actor, "CAFETERIA_ADMIN");

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

// The admin dashboard a given actor can reach (surfaced as the sidebar's admin icon).
export function adminHomeFor(actor: Actor): string | null {
  if (hasRole(actor, "ACADEMIC_ADMIN")) return "/dashboard/academic";
  if (hasRole(actor, "DORMITORY_ADMIN")) return "/dashboard/dorm";
  if (hasRole(actor, "CAFETERIA_ADMIN")) return "/dashboard/cafeteria";
  return null;
}
