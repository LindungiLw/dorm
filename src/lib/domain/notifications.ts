import { prisma } from "@/lib/db";
import {
  todayStr,
  currentMealType,
  nowCampusMinutes,
  mealLabel,
} from "@/lib/time";
import { getMealWindows } from "@/lib/domain/meal-window";
import { canUsePermission, type Actor } from "@/lib/authz/policy";

// A single actionable item shown under the module picker on the dashboard landing page.
export type Notif = {
  id: string;
  icon: string; // emoji
  title: string;
  detail?: string;
  href?: string;
  tone: "action" | "warn" | "success" | "info";
};

// Everything that currently needs the member's attention, derived live from existing data
// (no separate notifications store). All independent lookups run in one batch to keep the
// landing page fast.
export async function getLandingNotifications(actor: Actor): Promise<Notif[]> {
  const today = todayStr();
  const meal = currentMealType();
  const isDormStudent = canUsePermission(actor) && actor.dormId != null;

  const [windows, todaysCoupon, activeExit, seller] = await Promise.all([
    getMealWindows(),
    prisma.mealCoupon.findFirst({
      where: { memberId: actor.id, mealDate: today, mealType: meal },
      select: { status: true },
    }),
    isDormStudent
      ? prisma.exitRequest.findFirst({
          where: { memberId: actor.id, status: "OUT" },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.sellerProfile.findUnique({
      where: { memberId: actor.id },
      select: { status: true },
    }),
  ]);

  const out: Notif[] = [];

  // 1. Meal check-in window is open and the member hasn't checked in yet.
  const w = windows[meal];
  const nowMin = nowCampusMinutes();
  const isOpen = nowMin >= w.startMin && nowMin < w.endMin;
  const checkedIn = todaysCoupon?.status === "REDEEMED";
  if (isOpen && !checkedIn) {
    out.push({
      id: "meal-checkin",
      icon: "🍽️",
      title: `${mealLabel(meal)} check-in is open`,
      detail: `Check in before ${w.end} to get your meal.`,
      href: "/dashboard/cafeteria/checkin",
      tone: "action",
    });
  }

  // 2. Still out on a leave pass (dorm students only).
  if (activeExit) {
    out.push({
      id: "still-out",
      icon: "🚪",
      title: "You are marked out",
      detail: "Return to the satpam to close your leave pass.",
      href: "/dashboard/permission/exit",
      tone: "warn",
    });
  }

  // 3. Marketplace seller status.
  if (seller?.status === "PENDING") {
    out.push({
      id: "seller-pending",
      icon: "🛒",
      title: "Seller request pending",
      detail: "Waiting for a market admin to approve it.",
      href: "/dashboard/market/sell",
      tone: "info",
    });
  } else if (seller?.status === "REJECTED") {
    out.push({
      id: "seller-rejected",
      icon: "🛒",
      title: "Seller request declined",
      detail: "You can update your details and apply again.",
      href: "/dashboard/market/sell",
      tone: "info",
    });
  } else if (seller?.status === "APPROVED") {
    // Only nudge if they haven't listed anything yet.
    const products = await prisma.product.count({ where: { sellerId: actor.id } });
    if (products === 0) {
      out.push({
        id: "seller-approved",
        icon: "🛒",
        title: "You are an approved seller",
        detail: "Add your first product to the catalog.",
        href: "/dashboard/market/sell",
        tone: "success",
      });
    }
  }

  return out;
}
