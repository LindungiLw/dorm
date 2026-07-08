"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { isValidCounterCode } from "@/lib/counter-code";
import { writeAudit } from "@/lib/audit";

export type CouponState = { error?: string; ok?: string };

export async function activateCouponAction(
  _prev: CouponState,
  formData: FormData,
): Promise<CouponState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  const couponId = String(formData.get("couponId") ?? "");
  const coupon = await prisma.mealCoupon.findUnique({ where: { id: couponId } });
  if (!coupon) return { error: "Coupon not found." };

  // Ownership check against the REAL target row.
  if (!can(actor, "coupon:activate", { ownerId: coupon.memberId })) {
    return { error: "You are not allowed to activate this coupon." };
  }

  // Atomic guarded transition ISSUED -> ACTIVE (idempotent on retry / double-tap).
  const upd = await prisma.mealCoupon.updateMany({
    where: { id: couponId, memberId: actor.id, status: "ISSUED" },
    data: { status: "ACTIVE", activatedAt: new Date() },
  });

  revalidatePath("/dashboard/meals");

  if (upd.count !== 1) {
    const fresh = await prisma.mealCoupon.findUnique({ where: { id: couponId } });
    if (fresh?.status === "ACTIVE") return { ok: "This coupon is already active." };
    return { error: "Could not activate — it may already be redeemed or expired." };
  }
  return { ok: "Coupon activated. At the counter, enter the code shown to redeem." };
}

const redeemSchema = z.object({
  couponId: z.string().min(1),
  counterCode: z.string().min(1),
});

export async function redeemCouponAction(
  _prev: CouponState,
  formData: FormData,
): Promise<CouponState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  const parsed = redeemSchema.safeParse({
    couponId: formData.get("couponId"),
    counterCode: formData.get("counterCode"),
  });
  if (!parsed.success) return { error: "Enter the counter code to redeem." };

  const coupon = await prisma.mealCoupon.findUnique({
    where: { id: parsed.data.couponId },
  });
  if (!coupon) return { error: "Coupon not found." };
  if (!can(actor, "coupon:redeem", { ownerId: coupon.memberId })) {
    return { error: "You are not allowed to redeem this coupon." };
  }

  // Presence anchor: the code must match the counter's CURRENT rotating code, proving
  // the member is physically at the counter (a stale screenshot fails within seconds).
  const counter = await prisma.counter.findFirst();
  if (!counter || !isValidCounterCode(counter.secret, parsed.data.counterCode)) {
    return {
      error:
        "Invalid or expired counter code. Use the current code displayed at the counter.",
    };
  }

  // Exactly-once redemption: atomic ACTIVE -> REDEEMED compare-and-set + a unique
  // ledger row. Two concurrent scans can't both win — the DB serializes them.
  try {
    await prisma.$transaction(async (tx) => {
      const upd = await tx.mealCoupon.updateMany({
        where: { id: coupon.id, memberId: actor.id, status: "ACTIVE" },
        data: { status: "REDEEMED", redeemedAt: new Date() },
      });
      if (upd.count !== 1) throw new Error("NOT_ACTIVE");
      await tx.redemption.create({
        data: {
          couponId: coupon.id,
          memberId: actor.id,
          counterId: counter.id,
          counterName: counter.name,
        },
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_ACTIVE") {
      return { error: "Activate the coupon first — or it was already redeemed." };
    }
    // Unique-constraint violation on the ledger => a concurrent redemption already won.
    return { error: "This coupon was already redeemed." };
  }

  await writeAudit(actor, "coupon.redeem", "MealCoupon", coupon.id, {
    counter: counter.name,
    mealType: coupon.mealType,
  });
  revalidatePath("/dashboard/meals");
  return { ok: "Meal redeemed — enjoy! ✅" };
}
