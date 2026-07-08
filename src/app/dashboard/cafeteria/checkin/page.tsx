import { getCurrentActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { todayStr, currentMealType } from "@/lib/time";
import { getMenuForDates } from "@/lib/domain/menu";
import { PageHeader } from "@/components/ui";
import { ModuleSubnav, CAFETERIA_TABS } from "@/components/ModuleSubnav";
import { SelfCheckinCard } from "@/components/SelfCheckinCard";

function statusLabelFor(memberType: string): string {
  if (memberType === "LECTURER") return "Dosen Aktif";
  if (memberType === "STAFF" || memberType === "FACULTY") return "Staf Aktif";
  return "Mahasiswa Aktif";
}

function initialsOf(name: string): string {
  const words = name.replace(/[^A-Za-z ]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default async function CheckinPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  const today = todayStr();
  const [extra, coupons, menuMap] = await Promise.all([
    prisma.member.findUnique({
      where: { id: actor.id },
      select: { campusId: true, photoUrl: true },
    }),
    prisma.mealCoupon.findMany({
      where: { memberId: actor.id, mealDate: today },
      select: { mealType: true, status: true },
    }),
    getMenuForDates([today]),
  ]);

  const redeemed: Record<string, boolean> = {};
  for (const c of coupons) redeemed[c.mealType] = c.status === "REDEEMED";

  const day = menuMap[today] ?? {};
  const menuByMeal: Record<string, string> = {
    LUNCH: day.LUNCH?.items ?? "",
    DINNER: day.DINNER?.items ?? "",
  };

  return (
    <div>
      <ModuleSubnav tabs={CAFETERIA_TABS} />
      <PageHeader title="Meal Check-in" subtitle={`Today · ${today}`} icon="🍽️" />
      <SelfCheckinCard
        name={actor.fullName}
        nim={extra?.campusId ?? "—"}
        statusLabel={statusLabelFor(actor.memberType)}
        photoUrl={extra?.photoUrl ?? null}
        initials={initialsOf(actor.fullName)}
        menuByMeal={menuByMeal}
        redeemed={redeemed}
        initialSession={currentMealType()}
      />
    </div>
  );
}
