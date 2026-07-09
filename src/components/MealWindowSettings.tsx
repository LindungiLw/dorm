"use client";

import { useActionState } from "react";
import {
  setMealWindowAction,
  type WindowState,
} from "@/lib/domain/meal-window-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { MEAL_TYPES, mealLabel, type MealWindows } from "@/lib/time";

export function MealWindowSettings({ windows }: { windows: MealWindows }) {
  return (
    <div className="space-y-3">
      {MEAL_TYPES.map((m) => (
        <MealWindowRow
          key={m}
          meal={m}
          start={windows[m].start}
          end={windows[m].end}
        />
      ))}
      <p className="text-xs text-navy-400">
        Students can only check in during these times (campus time, WIB).
      </p>
    </div>
  );
}

function MealWindowRow({
  meal,
  start,
  end,
}: {
  meal: string;
  start: string;
  end: string;
}) {
  const [state, action] = useActionState<WindowState, FormData>(
    setMealWindowAction,
    {},
  );
  return (
    <form action={action} className="rounded-xl border border-navy-100 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-navy-800">{mealLabel(meal)}</p>
        {state.ok && (
          <span className="text-xs font-medium text-emerald-600">{state.ok}</span>
        )}
        {state.error && (
          <span className="text-xs font-medium text-red-600">{state.error}</span>
        )}
      </div>
      <input type="hidden" name="mealType" value={meal} />
      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
        <div className="sm:w-32">
          <label className="label" htmlFor={`${meal}-start`}>
            Open
          </label>
          <input
            id={`${meal}-start`}
            name="start"
            type="time"
            defaultValue={start}
            className="input"
            required
          />
        </div>
        <div className="sm:w-32">
          <label className="label" htmlFor={`${meal}-end`}>
            Close
          </label>
          <input
            id={`${meal}-end`}
            name="end"
            type="time"
            defaultValue={end}
            className="input"
            required
          />
        </div>
        <SubmitButton
          className="btn-outline col-span-2 text-sm sm:col-span-1 sm:w-auto"
          pendingText="Saving…"
        >
          Save
        </SubmitButton>
      </div>
    </form>
  );
}
