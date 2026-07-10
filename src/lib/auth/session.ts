import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import type { Actor, Role } from "@/lib/authz/policy";

// Resolves the current actor from the Auth.js session, then re-loads the member fresh
// from the (directory-authoritative) DB on EVERY request. This keeps the instant-
// revocation property: suspend a member or change a role and it takes effect immediately,
// because roles/status are never trusted from a long-lived token.
//
// Wrapped in React `cache` so the layout and the page (and any server action) that each
// call it within the SAME request share one member query instead of hitting Neon twice.
export const getCurrentActor = cache(async (): Promise<Actor | null> => {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  const m = await prisma.member.findUnique({
    where: { email: email.toLowerCase() },
    include: { roleAssignments: true },
  });
  if (!m || m.status !== "ACTIVE") return null;

  return {
    id: m.id,
    fullName: m.fullName,
    email: m.email,
    memberType: m.memberType,
    status: m.status,
    dormId: m.dormId,
    photoUrl: m.photoUrl,
    idConfirmed: m.idConfirmed,
    roles: m.roleAssignments.map((r) => ({
      role: r.role as Role,
      scopeType: r.scopeType,
      scopeId: r.scopeId,
    })),
  };
});
