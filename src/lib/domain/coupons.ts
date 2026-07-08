import { prisma } from "@/lib/db";
import { MEAL_TYPES, todayStr } from "@/lib/time";

// "Entitlement generation" (stub): ensure today's coupons exist for a member. Idempotent
// via the (member, date, mealType) unique constraint — safe to call on every page view.
// In production this is a scheduled worker job run in the quiet pre-window, not JIT.
export async function ensureTodayCoupons(memberId: string): Promise<void> {
  const mealDate = todayStr();
  for (const mealType of MEAL_TYPES) {
    await prisma.mealCoupon.upsert({
      where: { memberId_mealDate_mealType: { memberId, mealDate, mealType } },
      create: { memberId, mealDate, mealType },
      update: {},
    });
  }
}

export async function getTodayCoupons(memberId: string) {
  return prisma.mealCoupon.findMany({
    where: { memberId, mealDate: todayStr() },
    orderBy: { mealType: "asc" },
  });
}

export async function getPrimaryCounter() {
  return prisma.counter.findFirst();
}
