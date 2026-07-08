import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { prisma } from "@/lib/db";
import { currentMealType, mealLabel, todayStr, formatDateTime } from "@/lib/time";
import { PageHeader, Card, Alert, StatusBadge } from "@/components/ui";
import { ModuleSubnav, CAFETERIA_TABS } from "@/components/ModuleSubnav";
import { CheckinStation } from "@/components/CheckinStation";

export default async function CheckinPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  const canCheckin = can(actor, "cafeteria:checkin");

  if (!canCheckin) {
    return (
      <div>
        <ModuleSubnav tabs={CAFETERIA_TABS} />
        <PageHeader
          title="Meal Check-in"
          subtitle={`Today · ${todayStr()}`}
          icon="🍽️"
        />
        <Card className="max-w-xl">
          <Alert tone="info">
            This is the cafeteria staff check-in station. Sign in with a cafeteria
            staff account to scan students in.
          </Alert>
          <p className="mt-3 text-sm text-navy-500">
            Demo staff account: <strong>rina.cafe@jiu.ac</strong> (password{" "}
            <code>password123</code>).
          </p>
        </Card>
      </div>
    );
  }

  const mealDate = todayStr();
  const recent = await prisma.mealCoupon.findMany({
    where: { mealDate, status: "REDEEMED" },
    orderBy: { redeemedAt: "desc" },
    take: 10,
    include: { member: { select: { fullName: true, campusId: true } } },
  });
  const totalToday = await prisma.mealCoupon.count({
    where: { mealDate, status: "REDEEMED" },
  });

  return (
    <div>
      <ModuleSubnav tabs={CAFETERIA_TABS} />
      <PageHeader
        title="Meal Check-in"
        subtitle={`Counter station · ${mealLabel(currentMealType())} · ${mealDate}`}
        icon="🍽️"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <h2 className="mb-3 font-semibold text-navy-800">Check a student in</h2>
            <CheckinStation defaultMeal={currentMealType()} />
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold text-navy-800">Checked in today</h2>
              <span className="text-3xl font-bold text-navy-700">{totalToday}</span>
            </div>
            <p className="text-sm text-navy-400">
              A projection over the redemption ledger — one row per meal, exactly once.
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-navy-800">Recent check-ins</h2>
            {recent.length === 0 ? (
              <p className="text-sm text-navy-400">No check-ins yet today.</p>
            ) : (
              <ul className="divide-y divide-navy-50">
                {recent.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-navy-800">
                        {c.member.fullName}
                        <span className="ml-2 text-xs font-normal text-navy-400">
                          {c.member.campusId}
                        </span>
                      </p>
                      <p className="text-xs text-navy-400">
                        {mealLabel(c.mealType)}
                        {c.redeemedAt && ` · ${formatDateTime(c.redeemedAt)}`}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
