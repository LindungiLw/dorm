"use client";

import { useActionState, useEffect, useState } from "react";
import { selfCheckInAction, type CheckinState } from "@/lib/domain/checkin-actions";
import { Alert } from "@/components/ui";
import {
  mealLabel,
  formatClock,
  type MealType,
  type MealWindows,
} from "@/lib/time";

export function SelfCheckinCard({
  name,
  nim,
  statusLabel,
  photoUrl,
  initials,
  menuByMeal,
  redeemed,
  redeemedAt,
  initialSession,
  windows,
}: {
  name: string;
  nim: string;
  statusLabel: string;
  photoUrl: string | null;
  initials: string;
  menuByMeal: Record<string, string>;
  redeemed: Record<string, boolean>;
  redeemedAt: Record<string, string>;
  initialSession: MealType;
  windows: MealWindows;
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
  const w = windows[session];
  const inWindow = minutes !== null && minutes >= w.startMin && minutes < w.endMin;

  const checkedIn = redeemed[session] || !!state.ok;
  const enabled = inWindow && !checkedIn && !pending;
  // The menu the cafeteria admin set for this session, split into individual dishes.
  const menuItems = (menuByMeal[session] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // ── Success state: replace the whole card with a clean, centered confirmation.
  // The time is the server-recorded redemption moment (WIB), never the device clock.
  if (checkedIn) {
    const checkedAt = state.at ?? redeemedAt[session] ?? null;
    const clock = checkedAt ? formatClock(checkedAt) : formatClock(now ?? new Date());
    return (
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
        <div className="flex flex-col items-center px-6 py-10 text-center">
          {/* Big green check */}
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-11 w-11 text-emerald-600"
              aria-hidden
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>

          {/* Confirmation text */}
          <h2 className="mt-5 text-2xl font-bold text-navy-800">
            Check-In Successful!
          </h2>
          <p className="mt-1 text-navy-500">Enjoy Your Meal.</p>

          {/* Validation log — proof for cafeteria staff */}
          <dl className="mt-6 w-full max-w-xs space-y-1 border-t border-navy-100 pt-5 text-sm">
            <div className="flex justify-center gap-1">
              <dt className="text-navy-400">Meal:</dt>
              <dd className="font-semibold text-navy-700">{mealLabel(session)}</dd>
            </div>
            <div className="flex justify-center gap-1">
              <dt className="text-navy-400">Time:</dt>
              <dd className="font-semibold text-navy-700">{clock} WIB</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
      {/* Session header */}
      <div className="flex items-center justify-between bg-navy-700 px-5 py-3 text-white">
        <span className="text-lg font-bold">{mealLabel(session)}</span>
        <span className="text-sm font-medium text-navy-100">
          {w.start} to {w.end}
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

        {/* Today's menu — pulled straight from what the cafeteria admin set */}
        <div className="rounded-xl bg-navy-50 px-4 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">
            Today&rsquo;s {mealLabel(session)}
          </p>
          {menuItems.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              {menuItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-navy-700 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-navy-400">Not set yet.</p>
          )}
        </div>

        {/* Feedback */}
        {state.error && (
          <div className="mt-4">
            <Alert tone="error">{state.error}</Alert>
          </div>
        )}

        {/* Primary action — centered */}
        <div className="mt-5">
          <form action={action}>
            <button
              type="submit"
              disabled={!enabled}
              className="w-full rounded-xl bg-gold py-4 text-lg font-bold tracking-wide text-navy-900 shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-navy-100 disabled:text-navy-400"
            >
              {pending ? "Checking in…" : "Check in"}
            </button>
          </form>
          {!inWindow && (
            <p className="mt-2 text-center text-xs text-navy-400">
              Check-in opens {w.start} to {w.end}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
