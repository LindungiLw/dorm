"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { writeAudit } from "@/lib/audit";
import {
  MEAL_TYPES,
  MEAL_WINDOWS,
  mealLabel,
  todayStr,
  currentMealType,
  nowCampusMinutes,
  isWithinMealWindow,
} from "@/lib/time";

export type CheckinState = { error?: string; ok?: string; at?: string };

const MEALS = new Set<string>(MEAL_TYPES);

const schema = z.object({
  campusId: z.string().trim().min(1, "Enter or scan a student ID."),
  mealType: z.string().refine((m) => MEALS.has(m), "Pick a valid meal window."),
});

// Cafeteria counter check-in: staff scan/type a student's ID (NIM) and the system checks
// them in for the given meal — an atomic ISSUED/ACTIVE -> REDEEMED transition plus a unique
// redemption-ledger row (exactly-once, so a double scan can't double-count).
export async function checkInStudentAction(
  _prev: CheckinState,
  formData: FormData,
): Promise<CheckinState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  // Role gate: the check-in station is a cafeteria-staff tool.
  if (!can(actor, "cafeteria:checkin")) {
    return { error: "Only cafeteria staff can check students in." };
  }

  const parsed = schema.safeParse({
    campusId: formData.get("campusId"),
    mealType: formData.get("mealType"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { campusId, mealType } = parsed.data;

  const student = await prisma.member.findUnique({ where: { campusId } });
  if (!student) {
    return { error: `No member found with ID "${campusId}".` };
  }
  if (student.status !== "ACTIVE") {
    return {
      error: `${student.fullName} is ${student.status.toLowerCase()} — cannot check in.`,
    };
  }

  const mealDate = todayStr();

  // Ensure the entitlement exists (idempotent), then redeem it atomically.
  const coupon = await prisma.mealCoupon.upsert({
    where: {
      memberId_mealDate_mealType: { memberId: student.id, mealDate, mealType },
    },
    create: { memberId: student.id, mealDate, mealType, status: "ISSUED" },
    update: {},
  });

  const counter = await prisma.counter.findFirst();

  try {
    await prisma.$transaction(async (tx) => {
      const upd = await tx.mealCoupon.updateMany({
        where: { id: coupon.id, status: { in: ["ISSUED", "ACTIVE"] } },
        data: { status: "REDEEMED", redeemedAt: new Date() },
      });
      if (upd.count !== 1) throw new Error("NOT_REDEEMABLE");
      await tx.redemption.create({
        data: {
          couponId: coupon.id,
          memberId: student.id,
          counterId: counter?.id ?? "COUNTER",
          counterName: counter?.name ?? "Main Counter",
        },
      });
    });
  } catch {
    const fresh = await prisma.mealCoupon.findUnique({ where: { id: coupon.id } });
    if (fresh?.status === "REDEEMED") {
      return {
        error: `${student.fullName} is already checked in for ${mealLabel(mealType)} today.`,
      };
    }
    return { error: `This meal can't be checked in for ${student.fullName}.` };
  }

  await writeAudit(actor, "cafeteria.checkin", "MealCoupon", coupon.id, {
    student: student.fullName,
    campusId,
    mealType,
  });
  revalidatePath("/dashboard/cafeteria/checkin");
  return {
    ok: `✅ ${student.fullName} (${campusId}) checked in for ${mealLabel(mealType)}.`,
  };
}

// Self check-in: the signed-in member checks THEMSELVES in for the meal happening now.
// The window is enforced server-side in campus time (never trusting the client clock),
// and redemption is the same atomic ISSUED/ACTIVE -> REDEEMED + unique-ledger guard.
export async function selfCheckInAction(
  _prev: CheckinState,
): Promise<CheckinState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  // Owner + meal-entitlement check.
  if (!can(actor, "coupon:redeem", { ownerId: actor.id })) {
    return { error: "You are not allowed to check in." };
  }

  const mealType = currentMealType();
  if (!isWithinMealWindow(mealType, nowCampusMinutes())) {
    const w = MEAL_WINDOWS[mealType];
    return {
      error: `Check-in for ${mealLabel(mealType)} is only open ${w.start}–${w.end}.`,
    };
  }

  const mealDate = todayStr();
  const coupon = await prisma.mealCoupon.upsert({
    where: {
      memberId_mealDate_mealType: { memberId: actor.id, mealDate, mealType },
    },
    create: { memberId: actor.id, mealDate, mealType, status: "ISSUED" },
    update: {},
  });

  const counter = await prisma.counter.findFirst();
  const redeemedAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const upd = await tx.mealCoupon.updateMany({
        where: { id: coupon.id, status: { in: ["ISSUED", "ACTIVE"] } },
        data: { status: "REDEEMED", redeemedAt },
      });
      if (upd.count !== 1) throw new Error("NOT_REDEEMABLE");
      await tx.redemption.create({
        data: {
          couponId: coupon.id,
          memberId: actor.id,
          counterId: counter?.id ?? "COUNTER",
          counterName: counter?.name ?? "Main Counter",
        },
      });
    });
  } catch {
    const fresh = await prisma.mealCoupon.findUnique({ where: { id: coupon.id } });
    if (fresh?.status === "REDEEMED") {
      return { error: `You're already checked in for ${mealLabel(mealType)} today.` };
    }
    return { error: "Check-in failed — please try again." };
  }

  await writeAudit(actor, "cafeteria.checkin.self", "MealCoupon", coupon.id, {
    mealType,
  });
  revalidatePath("/dashboard/cafeteria/checkin");
  return {
    ok: `✅ Checked in for ${mealLabel(mealType)}. Enjoy your meal!`,
    at: redeemedAt.toISOString(),
  };
}
