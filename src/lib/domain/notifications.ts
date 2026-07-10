import { prisma } from "@/lib/db";
import {
  todayStr,
  currentMealType,
  nowCampusMinutes,
  mealLabel,
  MEAL_TYPES,
} from "@/lib/time";
import { getMealWindows } from "@/lib/domain/meal-window";
import { getMenuForDates } from "@/lib/domain/menu";
import {
  canUsePermission,
  hasRole,
  scopesFor,
  type Actor,
} from "@/lib/authz/policy";

// A single actionable item shown under the module picker on the dashboard landing page.
export type Notif = {
  id: string;
  icon: string; // emoji
  title: string;
  detail?: string;
  href?: string;
  tone: "action" | "warn" | "success" | "info";
};

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

// Everything that currently needs the member's attention, derived live from existing data
// (no separate notifications store): PERSONAL items for every member, plus ROLE-SPECIFIC
// items for the admin consoles they actually hold. Each admin item is gated on the SPECIFIC
// role, not ROOT — the module admin pages check that exact role, so a ROOT-only account
// (which manages via its own console) would only hit dead links. All independent lookups
// run in one batch to keep the landing page fast.
export async function getLandingNotifications(actor: Actor): Promise<Notif[]> {
  const today = todayStr();
  const meal = currentMealType();
  const isDormStudent = canUsePermission(actor) && actor.dormId != null;

  const wantMarket = hasRole(actor, "MARKET_ADMIN");
  const wantDorm = hasRole(actor, "DORMITORY_ADMIN");
  const wantCafeteria = hasRole(actor, "CAFETERIA_ADMIN");

  // A dorm admin only counts their own dorm(s); a campus-wide (null-scope) grant counts all.
  const dormScopes = scopesFor(actor, "DORMITORY_ADMIN");
  const dormWideOut = dormScopes.includes(null);
  const scopedDormIds = dormScopes.filter((s): s is string => !!s);

  const [windows, todaysCoupon, activeExit, seller, pendingSellers, studentsOut, todayMenu] =
    await Promise.all([
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
      wantMarket
        ? prisma.sellerProfile.count({ where: { status: "PENDING" } })
        : Promise.resolve(0),
      wantDorm
        ? prisma.exitRequest.count({
            where: dormWideOut
              ? { status: "OUT" }
              : { status: "OUT", dormId: { in: scopedDormIds } },
          })
        : Promise.resolve(0),
      wantCafeteria ? getMenuForDates([today]) : Promise.resolve(null),
    ]);

  const out: Notif[] = [];

  // ── Personal: meal check-in window open and not yet done ────────────────────────────
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

  // ── Personal: still out on a leave pass (dorm students only) ────────────────────────
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

  // ── Admin: market — seller requests awaiting review ─────────────────────────────────
  if (pendingSellers > 0) {
    out.push({
      id: "admin-sellers",
      icon: "🧾",
      title: `${plural(pendingSellers, "seller request", "seller requests")} waiting`,
      detail: "Review and approve new sellers.",
      href: "/dashboard/market/admin",
      tone: "action",
    });
  }

  // ── Admin: dorm — students currently out ────────────────────────────────────────────
  if (studentsOut > 0) {
    out.push({
      id: "admin-students-out",
      icon: "🚶",
      title: `${plural(studentsOut, "student is", "students are")} currently out`,
      detail: "Mark returns from the dorm console.",
      href: "/dashboard/dorm",
      tone: "info",
    });
  }

  // ── Admin: cafeteria — today's menu isn't fully set ─────────────────────────────────
  if (todayMenu) {
    const day = todayMenu[today] ?? {};
    const setCount = MEAL_TYPES.filter((m) => day[m]?.items?.trim()).length;
    if (setCount < MEAL_TYPES.length) {
      out.push({
        id: "admin-menu",
        icon: "🍽️",
        title: "Today's menu needs attention",
        detail: `${setCount} of ${MEAL_TYPES.length} meals set. Tap to update.`,
        href: "/dashboard/cafeteria/menu",
        tone: "warn",
      });
    }
  }

  // ── Personal: marketplace seller status ─────────────────────────────────────────────
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
