import { prisma } from "@/lib/db";
import type { Actor } from "@/lib/authz/policy";

// Append-only audit trail for privileged / value-affecting actions. In production this
// is fed by domain events via the outbox; here it's a direct append for the slice.
export async function writeAudit(
  actor: Pick<Actor, "id" | "fullName">,
  action: string,
  targetType: string,
  targetId: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      actorName: actor.fullName,
      action,
      targetType,
      targetId,
      meta: meta ? JSON.stringify(meta) : null,
    },
  });
}
