"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { writeAudit } from "@/lib/audit";
import { parseCampusLocal } from "@/lib/time";

export type ExitState = { error?: string; ok?: string };

function parseCoord(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && Math.abs(n) <= 180 ? n : null;
}

// ---- Leave Pass: student self-notifies they are leaving the dorm --------------------
// Required: destination, expected return time ("jam balik"), and a GPS location point.
// Departure is "now" (submit time). The student CANNOT close their own pass — only dorm
// staff / security mark the return (see markReturnedAction).
const leaveSchema = z.object({
  destination: z.string().trim().min(2, "Where are you going?").max(200),
  returnAt: z.string().min(1, "Enter your expected return time."),
});

export async function submitLeavePassAction(
  _prev: ExitState,
  formData: FormData,
): Promise<ExitState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };
  if (!can(actor, "exit:create", { ownerId: actor.id })) {
    return { error: "Only dorm-resident students can log a leave pass." };
  }

  const parsed = leaveSchema.safeParse({
    destination: formData.get("destination"),
    returnAt: formData.get("returnAt"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const departureAt = new Date(); // leaving now
  const returnAt = parseCampusLocal(parsed.data.returnAt);
  if (!returnAt) {
    return { error: "Please provide a valid expected-return time." };
  }
  if (returnAt <= departureAt) {
    return { error: "Your expected return must be in the future." };
  }

  // One active pass at a time — the dorm must mark you back before you leave again.
  const active = await prisma.exitRequest.findFirst({
    where: { memberId: actor.id, status: "OUT" },
    select: { id: true },
  });
  if (active) {
    return {
      error:
        "You still have an active leave pass — the dorm must mark you returned first.",
    };
  }

  const created = await prisma.exitRequest.create({
    data: {
      memberId: actor.id,
      dormId: actor.dormId as string,
      destination: parsed.data.destination,
      departureAt,
      returnAt,
      departureLat: parseCoord(formData.get("lat")),
      departureLng: parseCoord(formData.get("lng")),
      status: "OUT",
    },
  });

  await writeAudit(actor, "exit.leave", "ExitRequest", created.id, {
    dormId: actor.dormId,
  });
  revalidatePath("/dashboard/permission/exit");
  return { ok: "Leave pass logged. Have a safe trip!" };
}

// ---- Return: ONLY dorm staff / security may mark a student back at the dorm ----------
export async function markReturnedAction(
  _prev: ExitState,
  formData: FormData,
): Promise<ExitState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing pass id." };

  const req = await prisma.exitRequest.findUnique({
    where: { id },
    select: { id: true, dormId: true, status: true },
  });
  if (!req) return { error: "Pass not found." };

  // Role + scope check: dorm staff for that dorm, OR campus security (satpam).
  if (!can(actor, "exit:decide", { dormId: req.dormId })) {
    return { error: "Only dorm staff or security can mark a student returned." };
  }

  // Guarded transition: close only while still OUT.
  const upd = await prisma.exitRequest.updateMany({
    where: { id: req.id, status: "OUT" },
    data: {
      status: "RETURNED",
      actualReturnAt: new Date(),
      decidedById: actor.id,
      decidedAt: new Date(),
    },
  });
  if (upd.count !== 1) return { error: "This student is already marked returned." };

  await writeAudit(actor, "exit.return.admin", "ExitRequest", req.id, {
    dormId: req.dormId,
  });
  revalidatePath("/dashboard/dorm");
  revalidatePath("/dashboard/security");
  revalidatePath("/dashboard/permission/exit");
  return { ok: "Marked returned." };
}
