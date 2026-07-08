"use client";

import { useActionState, useEffect, useState } from "react";
import { saveMenuAction, type MenuState } from "@/lib/domain/menu-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import { MEAL_TYPES, mealLabel } from "@/lib/time";
import type { MenuMap } from "@/lib/domain/menu";

const MEAL_ICON: Record<string, string> = {
  BREAKFAST: "🥐",
  LUNCH: "🍛",
  DINNER: "🍜",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

// Does a day have at least one meal set?
function dayHasMenu(menu: MenuMap, date: string): boolean {
  const d = menu[date];
  return !!d && Object.values(d).some((v) => v && v.trim().length > 0);
}

function prettyDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MenuCalendar({
  menu,
  canEdit,
  today,
}: {
  menu: MenuMap;
  canEdit: boolean;
  today: string;
}) {
  const [ty, tm] = today.split("-").map(Number);
  const [view, setView] = useState({ year: ty, month: tm - 1 }); // month is 0-based
  const [selected, setSelected] = useState(today);
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState<MenuState, FormData>(saveMenuAction, {});

  // Close the editor once a save succeeds.
  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  const firstWeekday = (new Date(view.year, view.month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const shiftMonth = (delta: number) => {
    setEditing(false);
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  };

  const pick = (date: string) => {
    setSelected(date);
    setEditing(false);
  };

  const selDay = menu[selected] ?? {};

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* ---- Calendar ---- */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-navy-500 transition hover:bg-navy-50"
          >
            ‹
          </button>
          <h2 className="text-base font-semibold text-navy-800">
            {MONTHS[view.month]} {view.year}
          </h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-navy-500 transition hover:bg-navy-50"
          >
            ›
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-navy-300"
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`b${i}`} />;
            const date = toDateStr(view.year, view.month, day);
            const isToday = date === today;
            const isSelected = date === selected;
            const has = dayHasMenu(menu, date);
            return (
              <button
                type="button"
                key={date}
                onClick={() => pick(date)}
                aria-label={date}
                aria-pressed={isSelected}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition ${
                  isSelected
                    ? "bg-navy-700 font-semibold text-white shadow"
                    : isToday
                      ? "bg-navy-50 font-semibold text-navy-800 ring-1 ring-navy-200"
                      : "text-navy-600 hover:bg-navy-50"
                }`}
              >
                {day}
                {has && (
                  <span
                    className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white" : "bg-gold"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-navy-400">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> menu set
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-navy-50 ring-1 ring-navy-200" /> today
          </span>
        </div>
      </div>

      {/* ---- Day detail ---- */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-navy-800">{prettyDate(selected)}</p>
            {selected === today && (
              <span className="mt-1 inline-block rounded-full bg-navy-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Today
              </span>
            )}
          </div>
          {canEdit && !editing && (
            <button
              type="button"
              className="btn-outline shrink-0 text-sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          )}
        </div>

        {state.ok && !editing && <Alert tone="success">{state.ok}</Alert>}

        {editing ? (
          <form key={selected} action={action} className="mt-2 space-y-3">
            {state.error && <Alert tone="error">{state.error}</Alert>}
            {MEAL_TYPES.map((m) => (
              <div key={m}>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-navy-500">
                  <span aria-hidden>{MEAL_ICON[m]}</span> {mealLabel(m)}
                </label>
                <textarea
                  name={`items__${selected}__${m}`}
                  defaultValue={selDay[m] ?? ""}
                  rows={2}
                  placeholder={`What's for ${mealLabel(m).toLowerCase()}?`}
                  className="input min-h-[3rem] resize-y text-sm"
                />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <SubmitButton className="btn-primary" pendingText="Saving…">
                Save
              </SubmitButton>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-2 space-y-2">
            {MEAL_TYPES.map((m) => (
              <div
                key={m}
                className="flex gap-3 rounded-xl border border-navy-50 bg-navy-50/30 p-3"
              >
                <span className="text-xl" aria-hidden>
                  {MEAL_ICON[m]}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">
                    {mealLabel(m)}
                  </p>
                  <p className="mt-0.5 text-sm text-navy-800">
                    {selDay[m] || <span className="text-navy-300">Not set yet</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
