import { prisma } from "@/lib/db";

// The three module-admin roles that ROOT manages.
export const MANAGED_ROLES = [
  "CAFETERIA_ADMIN",
  "DORMITORY_ADMIN",
  "MARKET_ADMIN",
] as const;
export type ManagedRole = (typeof MANAGED_ROLES)[number];

export const ROLE_LABEL: Record<ManagedRole, string> = {
  CAFETERIA_ADMIN: "Cafeteria admin",
  DORMITORY_ADMIN: "Dorm admin",
  MARKET_ADMIN: "Market admin",
};

export type AdminRow = {
  assignmentId: string;
  memberId: string;
  fullName: string;
  email: string;
  role: string;
  scopeId: string | null;
};

// Everyone currently holding one of the managed module-admin roles.
export async function getAdmins(): Promise<AdminRow[]> {
  const rows = await prisma.roleAssignment.findMany({
    where: { role: { in: [...MANAGED_ROLES] } },
    include: { member: { select: { fullName: true, email: true } } },
    orderBy: [{ role: "asc" }, { member: { fullName: "asc" } }],
  });
  return rows.map((r) => ({
    assignmentId: r.id,
    memberId: r.memberId,
    fullName: r.member.fullName,
    email: r.member.email,
    role: r.role,
    scopeId: r.scopeId,
  }));
}
