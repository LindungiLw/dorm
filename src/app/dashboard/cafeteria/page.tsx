import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { hasRole } from "@/lib/authz/policy";
import { prisma } from "@/lib/db";
import {
  MEAL_TYPES,
  mealLabel,
  todayStr,
  formatDateTime,
  formatClock,
} from "@/lib/time";
import { getMenuForDates } from "@/lib/domain/menu";
import { getMealWindows } from "@/lib/domain/meal-window";
import {
  getCafeteriaFeedback,
  getTodaysCheckins,
  type FeedbackItem,
  type CheckinRecord,
} from "@/lib/domain/cafeteria-admin";
import { PageHeader, Card } from "@/components/ui";
import { MealWindowSettings } from "@/components/MealWindowSettings";

export default async function CafeteriaAdminPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  // Cafeteria admins only — others are bounced home silently.
  if (!hasRole(actor, "CAFETERIA_ADMIN")) redirect("/dashboard");

  const today = todayStr();

  const [redeemedToday, menuMap, allergensCount, feedback, windows, checkins] =
    await Promise.all([
      // Live attendance = a projection over the redemption ledger for today.
      prisma.redemption.count({
        where: { redeemedAt: { gte: new Date(`${today}T00:00:00`) } },
      }),
      getMenuForDates([today]),
      prisma.allergenEntry.count(),
      getCafeteriaFeedback(20),
      getMealWindows(),
      getTodaysCheckins(50),
    ]);

  const todaysMenu = menuMap[today] ?? {};
  const menuSet = MEAL_TYPES.filter((m) => todaysMenu[m]?.items?.trim()).length;
  const complaints = feedback.filter((f) => f.kind === "COMPLAINT").length;

  const tiles = [
    { label: "Meals today", value: redeemedToday },
    { label: "Menu set", value: `${menuSet}/${MEAL_TYPES.length}` },
    { label: "Feedback", value: feedback.length },
    { label: "Allergens", value: allergensCount },
  ];

  return (
    <div>
      <PageHeader
        title="Cafeteria Administration"
        subtitle="Outlet Main · manage today’s service"
        icon="📋"
      />

      {/* Overview tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="text-center">
            <p className="text-3xl font-bold text-navy-700">{t.value}</p>
            <p className="mt-1 text-xs text-navy-400">{t.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Menu */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-navy-800">Today’s menu</h2>
              <Link href="/dashboard/cafeteria/menu" className="btn-outline text-sm">
                Manage menu
              </Link>
            </div>
            <ul className="divide-y divide-navy-50">
              {MEAL_TYPES.map((m) => {
                const cell = todaysMenu[m];
                return (
                  <li key={m} className="py-2">
                    <p className="text-sm font-semibold text-navy-800">
                      {mealLabel(m)}
                    </p>
                    <p className="text-sm text-navy-500">
                      {cell?.items || (
                        <span className="text-navy-300">Not set yet</span>
                      )}
                    </p>
                    {cell?.ingredients && (
                      <p className="text-xs text-navy-400">
                        Ingredients: {cell.ingredients}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Recent check-ins */}
          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold text-navy-800">Recent check-ins</h2>
              <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
                {redeemedToday} today
              </span>
            </div>
            {checkins.length === 0 ? (
              <p className="py-2 text-sm text-navy-400">
                No check-ins today yet.
              </p>
            ) : (
              <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {checkins.map((c) => (
                  <CheckinRow key={c.id} item={c} />
                ))}
              </ul>
            )}
          </Card>

          {/* Feedback inbox */}
          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold text-navy-800">Feedback inbox</h2>
              {complaints > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {complaints} complaint{complaints === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {feedback.length === 0 ? (
              <p className="py-2 text-sm text-navy-400">
                No feedback yet. Student feedback and food complaints land here.
              </p>
            ) : (
              <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {feedback.map((f) => (
                  <FeedbackRow key={f.id} item={f} />
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Check-in window settings */}
          <Card>
            <h2 className="mb-3 font-semibold text-navy-800">Check-in window</h2>
            <MealWindowSettings windows={windows} />
          </Card>

          {/* Allergens */}
          <Card>
            <h2 className="mb-1 font-semibold text-navy-800">Allergens</h2>
            <p className="text-sm text-navy-500">
              {allergensCount > 0
                ? `${allergensCount} item${allergensCount === 1 ? "" : "s"} flagged for students.`
                : "No allergens flagged yet."}
            </p>
            <Link
              href="/dashboard/cafeteria/allergy"
              className="btn-outline mt-3 w-full"
            >
              Manage allergens
            </Link>
          </Card>

          {/* Check-in station */}
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

function FeedbackRow({ item }: { item: FeedbackItem }) {
  const isComplaint = item.kind === "COMPLAINT";
  return (
    <li className="rounded-xl border border-navy-50 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <KindBadge complaint={isComplaint} />
        <span className="text-xs text-navy-400">{formatDateTime(item.at)}</span>
      </div>
      <p className="mt-1.5 text-sm text-navy-700">{item.message}</p>
      <p className="mt-1 text-xs text-navy-400">by {item.from}</p>
    </li>
  );
}

function CheckinRow({ item }: { item: CheckinRecord }) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-xl border border-navy-50 p-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-navy-800">{item.name}</p>
        <p className="text-xs text-navy-400">{item.campusId}</p>
      </div>
      <div className="shrink-0 text-right">
        {item.meal && (
          <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold text-navy-700">
            {mealLabel(item.meal)}
          </span>
        )}
        <p className="mt-1 text-xs text-navy-400">{formatClock(item.at)} WIB</p>
      </div>
    </li>
  );
}

function KindBadge({ complaint }: { complaint: boolean }): ReactNode {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        complaint ? "bg-amber-100 text-amber-800" : "bg-navy-100 text-navy-700"
      }`}
    >
      {complaint ? "Complaint" : "Feedback"}
    </span>
  );
}
