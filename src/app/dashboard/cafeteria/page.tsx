import Link from "next/link";
import { getCurrentActor } from "@/lib/auth/session";
import { hasRole } from "@/lib/authz/policy";
import { prisma } from "@/lib/db";
import { MEAL_TYPES, mealLabel, todayStr } from "@/lib/time";
import { getMenuForDates } from "@/lib/domain/menu";
import { PageHeader, Card, Alert } from "@/components/ui";

export default async function CafeteriaAdminPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  if (!hasRole(actor, "CAFETERIA_ADMIN")) {
    return (
      <div>
        <PageHeader title="Cafeteria" icon="📋" />
        <Alert tone="info">This area is for cafeteria administrators.</Alert>
      </div>
    );
  }

  const today = todayStr();

  // Live attendance = a projection over the redemption ledger for today.
  const redeemedToday = await prisma.redemption.count({
    where: { redeemedAt: { gte: new Date(`${today}T00:00:00`) } },
  });
  const todaysMenu = (await getMenuForDates([today]))[today] ?? {};

  return (
    <div>
      <PageHeader
        title="Cafeteria Administration"
        subtitle="Outlet Main"
        icon="📋"
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-navy-800">Today&rsquo;s menu</h2>
              <Link href="/dashboard/cafeteria/menu" className="btn-outline text-sm">
                Manage menu
              </Link>
            </div>
            <ul className="divide-y divide-navy-50">
              {MEAL_TYPES.map((m) => (
                <li key={m} className="py-2">
                  <p className="text-sm font-semibold text-navy-800">
                    {mealLabel(m)}
                  </p>
                  <p className="text-sm text-navy-500">
                    {todaysMenu[m] || (
                      <span className="text-navy-300">Not set yet</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="font-semibold text-navy-800">Meal attendance (today)</h2>
            <p className="mt-2 text-4xl font-bold text-navy-700">{redeemedToday}</p>
            <p className="text-sm text-navy-400">
              meals redeemed — a projection over the redemption ledger.
            </p>
          </Card>
        </div>

        <div className="space-y-2">
          <Card>
            <h2 className="mb-1 font-semibold text-navy-800">Check-in station</h2>
            <p className="text-sm text-navy-500">
              Scan or type a student ID to check them in for the current meal.
            </p>
            <Link
              href="/dashboard/cafeteria/checkin"
              className="btn-primary mt-3 w-full"
            >
              Open check-in
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
