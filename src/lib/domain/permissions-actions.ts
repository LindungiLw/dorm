"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { writeAudit } from "@/lib/audit";

export type ExitState = { error?: string; ok?: string };

const createSchema = z.object({
  destination: z.string().min(2, "Destination is required.").max(200),
  departureAt: z.string().min(1),
  returnAt: z.string().min(1),
});

export async function createExitRequestAction(
  _prev: ExitState,
  formData: FormData,
): Promise<ExitState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  if (!can(actor, "exit:create", { ownerId: actor.id })) {
    return { error: "Only dorm-resident students can submit exit requests." };
  }

  const parsed = createSchema.safeParse({
    destination: formData.get("destination"),
    departureAt: formData.get("departureAt"),
    returnAt: formData.get("returnAt"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const departureAt = new Date(parsed.data.departureAt);
  const returnAt = new Date(parsed.data.returnAt);
  if (Number.isNaN(departureAt.getTime()) || Number.isNaN(returnAt.getTime())) {
    return { error: "Please provide valid departure and return times." };
  }
  if (returnAt <= departureAt) {
    return { error: "Return time must be after departure time." };
  }

  const created = await prisma.exitRequest.create({
    data: {
      memberId: actor.id,
      dormId: actor.dormId as string,
      destination: parsed.data.destination.trim(),
      departureAt,
      returnAt,
      status: "PENDING",
    },
  });

  await writeAudit(actor, "exit.create", "ExitRequest", created.id, {
    dormId: actor.dormId,
  });
  revalidatePath("/dashboard/permissions");
  return { ok: "Exit request submitted. Awaiting dorm admin approval." };
}

const decideSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(300).optional(),
});

export async function decideExitRequestAction(
  _prev: ExitState,
  formData: FormData,
): Promise<ExitState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  const parsed = decideSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return { error: "Invalid decision." };

  const request = await prisma.exitRequest.findUnique({
    where: { id: parsed.data.requestId },
  });
  if (!request) return { error: "Request not found." };

  // Role + SCOPE check: a dorm admin may only decide requests in their own dorm.
  if (!can(actor, "exit:decide", { dormId: request.dormId })) {
    return { error: "You are not authorized to decide requests for this dorm." };
  }

  const newStatus = parsed.data.decision === "APPROVE" ? "APPROVED" : "REJECTED";

  // Guarded one-way transition: decide ONLY where still PENDING. If two admins act at
  // once, exactly one wins (count === 1); the other is told it was already decided.
  const upd = await prisma.exitRequest.updateMany({
    where: { id: request.id, status: "PENDING" },
    data: {
      status: newStatus,
      decidedById: actor.id,
      decidedAt: new Date(),
      decisionNote: parsed.data.note?.trim() || null,
    },
  });

  if (upd.count !== 1) {
    return { error: "This request was already decided by someone else." };
  }

  await writeAudit(actor, `exit.${newStatus.toLowerCase()}`, "ExitRequest", request.id, {
    dormId: request.dormId,
  });
  revalidatePath("/dashboard/dorm");
  return { ok: `Request ${newStatus.toLowerCase()}.` };
}
