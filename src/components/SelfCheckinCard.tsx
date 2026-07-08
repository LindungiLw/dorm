"use client";

import { useActionState, useEffect, useState } from "react";
import { selfCheckInAction, type CheckinState } from "@/lib/domain/checkin-actions";
import { Alert } from "@/components/ui";
import { MEAL_WINDOWS, mealLabel, type MealType } from "@/lib/time";

export function SelfCheckinCard({
  name,
  nim,
  statusLabel,
  photoUrl,
  initials,
  menuByMeal,
  redeemed,
  initialSession,
}: {
  name: string;
  nim: string;
  statusLabel: string;
  photoUrl: string | null;
  initials: string;
  menuByMeal: Record<string, string>;
  redeemed: Record<string, boolean>;
  initialSession: MealType;
}) {
  const [state, action, pending] = useActionState<CheckinState, FormData>(
    selfCheckInAction,
    {},
  );

  // Live device-local time — the button only enables during the meal window.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  const minutes = now ? now.getHours() * 60 + now.getMinutes() : null;
  const session: MealType =
    minutes === null ? initialSession : minutes < 15 * 60 ? "LUNCH" : "DINNER";
  const w = MEAL_WINDOWS[session];
  const inWindow = minutes !== null && minutes >= w.startMin && minutes < w.endMin;

  const checkedIn = redeemed[session] || !!state.ok;
  const enabled = inWindow && !checkedIn && !pending;
  const menuLabel = menuByMeal[session]?.trim() || "Regular";

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
      {/* Session header */}
      <div className="flex items-center justify-between bg-navy-700 px-5 py-3 text-white">
        <span className="text-lg font-bold">{mealLabel(session)}</span>
        <span className="text-sm font-medium text-navy-100">
          {w.start} - {w.end}
        </span>
      </div>

      <div className="p-5">
        {/* Profile — left-aligned */}
        <div className="flex items-center gap-4">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-navy-100"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy-600 text-xl font-bold text-white">
              {initials}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-bold text-navy-800">{name}</p>
            <p className="text-sm text-navy-500">{nim}</p>
            <p className="text-xs text-navy-400">Status: {statusLabel}</p>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-5 border-t border-navy-100" />

        {/* Menu info — centered */}
        <div className="text-center">
          <p className="text-sm font-medium text-navy-400">Today&rsquo;s Menu</p>
          <p className="mt-1 text-lg font-bold text-navy-800">
            &gt; {menuLabel} &lt;
          </p>
        </div>

        {/* Feedback */}
        {state.error && (
          <div className="mt-4">
            <Alert tone="error">{state.error}</Alert>
          </div>
        )}

        {/* Primary action — centered */}
        <div className="mt-5">
          {checkedIn ? (
            <div className="rounded-xl bg-emerald-50 py-4 text-center text-lg font-bold text-emerald-700">
              ✓ Checked in for {mealLabel(session)}
            </div>
          ) : (
            <form action={action}>
              <button
                type="submit"
                disabled={!enabled}
                className="w-full rounded-xl bg-gold py-4 text-lg font-bold tracking-wide text-navy-900 shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-navy-100 disabled:text-navy-400"
              >
                {pending ? "Checking in…" : "[ CHECK-IN ]"}
              </button>
            </form>
          )}
          {!checkedIn && !inWindow && (
            <p className="mt-2 text-center text-xs text-navy-400">
              Check-in opens {w.start}–{w.end}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
