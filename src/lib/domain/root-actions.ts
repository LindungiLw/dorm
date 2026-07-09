"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { MANAGED_ROLES, ROLE_LABEL, type ManagedRole } from "@/lib/domain/admins";

const ALLOWED_DOMAIN = "jiu.ac";

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

  // `dormId` is absent (null) for non-dorm roles; coerce to undefined so the optional
  // schema accepts it (a raw null would fail as "expected string, received null").
  const parsed = grantSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
    dormId: formData.get("dormId")?.toString() || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { email, role, dormId } = parsed.data;

  // Find the member, or PRE-PROVISION a stub for a campus email that hasn't signed in
  // yet. When that person first logs in with Google (matched by email) they already
  // hold the granted role. Only @jiu.ac accounts can ever log in, so restrict to those.
  let target = await prisma.member.findUnique({ where: { email } });
  if (!target) {
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return { error: `Use a campus @${ALLOWED_DOMAIN} email address.` };
    }
    const localPart = email.split("@")[0];
    // A satpam is campus staff, not a dorm resident: no dorm, non-student persona so it
    // never lands on any dorm roster or the leave-pass flow.
    const isSecurity = role === "SECURITY";
    try {
      target = await prisma.member.create({
        data: {
          memberType: isSecurity ? "STAFF" : "STUDENT",
          fullName: localPart,
          campusId: localPart,
          email,
          status: "ACTIVE",
          dormId: isSecurity ? null : "DORM-A",
          passwordHash: await hashPassword(randomUUID()), // unusable (SSO only)
        },
      });
    } catch {
      return {
        error: `Couldn't pre-register "${email}". It may clash with an existing ID; ask them to sign in once, then grant.`,
      };
    }
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
  const scopeLabel = scopeId ? ` (${scopeId.replace(/-/g, " ")})` : "";
  return {
    ok: `${target.email} is now ${ROLE_LABEL[role]}${scopeLabel}.`,
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
