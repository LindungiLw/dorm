"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { writeAudit } from "@/lib/audit";
import { MANAGED_ROLES, ROLE_LABEL, type ManagedRole } from "@/lib/domain/admins";

export type RootState = { error?: string; ok?: string };

const grantSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  role: z.enum(MANAGED_ROLES),
  dormId: z.string().trim().optional(),
});

// Default org-unit scope per role. Dorm admins MUST be dorm-scoped (the exit-approval
// policy checks the dorm scope); cafeteria is outlet-scoped; market is campus-wide.
function scopeFor(role: ManagedRole, dormId?: string) {
  if (role === "DORMITORY_ADMIN") {
    return { scopeType: "DORM", scopeId: (dormId || "DORM-A").toUpperCase() };
  }
  if (role === "CAFETERIA_ADMIN") return { scopeType: "OUTLET", scopeId: "OUTLET-MAIN" };
  return { scopeType: null, scopeId: null };
}

// ROOT grants a module-admin role to an existing member (identified by email).
export async function grantRoleAction(
  _prev: RootState,
  formData: FormData,
): Promise<RootState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };
  if (!can(actor, "admin:grantRoles")) {
    return { error: "Only root can grant admin access." };
  }

  const parsed = grantSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    dormId: formData.get("dormId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { email, role, dormId } = parsed.data;

  const target = await prisma.member.findUnique({ where: { email } });
  if (!target) {
    return {
      error: `No member "${email}" yet — ask them to sign in once first, then grant access.`,
    };
  }

  const { scopeType, scopeId } = scopeFor(role, dormId);

  // Replace any existing assignment of this role for the member with one clean grant.
  await prisma.$transaction([
    prisma.roleAssignment.deleteMany({ where: { memberId: target.id, role } }),
    prisma.roleAssignment.create({
      data: { memberId: target.id, role, scopeType, scopeId },
    }),
  ]);

  await writeAudit(actor, "admin.grant", "Member", target.id, {
    role,
    scopeId,
    grantedBy: actor.email,
  });
  revalidatePath("/dashboard/root");
  return {
    ok: `${target.fullName} is now ${ROLE_LABEL[role]}${scopeId ? ` (${scopeId})` : ""}.`,
  };
}

const revokeSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(MANAGED_ROLES),
});

// ROOT revokes a module-admin role. ROOT itself can never be revoked here.
export async function revokeRoleAction(
  _prev: RootState,
  formData: FormData,
): Promise<RootState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };
  if (!can(actor, "admin:grantRoles")) {
    return { error: "Only root can revoke admin access." };
  }

  const parsed = revokeSchema.safeParse({
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  await prisma.roleAssignment.deleteMany({
    where: { memberId: parsed.data.memberId, role: parsed.data.role },
  });
  await writeAudit(actor, "admin.revoke", "Member", parsed.data.memberId, {
    role: parsed.data.role,
    revokedBy: actor.email,
  });
  revalidatePath("/dashboard/root");
  return { ok: "Access revoked." };
}
