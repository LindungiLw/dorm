"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { writeAudit } from "@/lib/audit";

export type ExitState = { error?: string; ok?: string };

function parseCoord(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && Math.abs(n) <= 180 ? n : null;
}

// ---- Leave Pass: student self-notifies they are leaving the dorm --------------------
const leaveSchema = z.object({
  destination: z.string().trim().min(2, "Where are you going?").max(200),
  departureAt: z.string().min(1),
  returnAt: z.string().min(1),
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
    departureAt: formData.get("departureAt"),
    returnAt: formData.get("returnAt"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const departureAt = new Date(parsed.data.departureAt);
  const returnAt = new Date(parsed.data.returnAt);
  if (Number.isNaN(departureAt.getTime()) || Number.isNaN(returnAt.getTime())) {
    return { error: "Please provide valid departure and expected-return times." };
  }
  if (returnAt <= departureAt) {
    return { error: "Expected return must be after departure." };
  }

  // One active pass at a time — log your return before leaving again.
  const active = await prisma.exitRequest.findFirst({
    where: { memberId: actor.id, status: "OUT" },
    select: { id: true },
  });
  if (active) {
    return {
      error: "You still have an active leave pass — submit your Return Pass first.",
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

// ---- Return Pass: student logs their actual return to the dorm ----------------------
const returnSchema = z.object({ actualReturnAt: z.string().min(1) });

export async function submitReturnPassAction(
  _prev: ExitState,
  formData: FormData,
): Promise<ExitState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  const active = await prisma.exitRequest.findFirst({
    where: { memberId: actor.id, status: "OUT" },
    orderBy: { departureAt: "desc" },
    select: { id: true },
  });
  if (!active) {
    return { error: "You have no active leave pass to close." };
  }

  const parsed = returnSchema.safeParse({
    actualReturnAt: formData.get("actualReturnAt"),
  });
  if (!parsed.success) return { error: "Enter your return date & time." };

  const actualReturnAt = new Date(parsed.data.actualReturnAt);
  if (Number.isNaN(actualReturnAt.getTime())) {
    return { error: "Please provide a valid return time." };
  }

  // Guarded transition: close only while still OUT (ownership enforced by memberId).
  const upd = await prisma.exitRequest.updateMany({
    where: { id: active.id, memberId: actor.id, status: "OUT" },
    data: {
      status: "RETURNED",
      actualReturnAt,
      returnLat: parseCoord(formData.get("lat")),
      returnLng: parseCoord(formData.get("lng")),
    },
  });
  if (upd.count !== 1) return { error: "This pass was already closed." };

  await writeAudit(actor, "exit.return", "ExitRequest", active.id, {
    dormId: actor.dormId,
  });
  revalidatePath("/dashboard/permission/exit");
  return { ok: "Welcome back! Your return has been logged." };
}
