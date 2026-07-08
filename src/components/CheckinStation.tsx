"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  checkInStudentAction,
  type CheckinState,
} from "@/lib/domain/checkin-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import { MEAL_TYPES, mealLabel } from "@/lib/time";

// Cafeteria staff station: scan a student ID card (a barcode scanner types the ID then
// Enter) or type it, pick the meal, and check the student in.
export function CheckinStation({ defaultMeal }: { defaultMeal: string }) {
  const [state, action] = useActionState<CheckinState, FormData>(
    checkInStudentAction,
    {},
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // After each submit, clear the ID field and refocus so the next scan just works.
  useEffect(() => {
    if (state.ok || state.error) {
      formRef.current?.reset();
      inputRef.current?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}

      <div>
        <label className="label" htmlFor="campusId">
          Student / staff ID (scan or type)
        </label>
        <input
          ref={inputRef}
          id="campusId"
          name="campusId"
          autoFocus
          autoComplete="off"
          inputMode="numeric"
          placeholder="e.g. 20210001"
          className="input text-lg tracking-wide"
        />
        <p className="mt-1 text-xs text-navy-400">
          A barcode scanner types the ID and presses Enter — that submits automatically.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="mealType">
          Meal window
        </label>
        <select
          id="mealType"
          name="mealType"
          defaultValue={defaultMeal}
          className="input"
        >
          {MEAL_TYPES.map((m) => (
            <option key={m} value={m}>
              {mealLabel(m)}
            </option>
          ))}
        </select>
      </div>

      <SubmitButton className="btn-primary w-full" pendingText="Checking in…">
        Check in
      </SubmitButton>
    </form>
  );
}
