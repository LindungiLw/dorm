"use client";

import { useActionState } from "react";
import {
  submitLeavePassAction,
  type ExitState,
} from "@/lib/domain/permissions-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import { LocationField } from "@/components/LocationField";

export function LeavePassForm() {
  const [state, action] = useActionState<ExitState, FormData>(
    submitLeavePassAction,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}

      <div>
        <label className="label" htmlFor="destination">
          Destination
        </label>
        <input
          id="destination"
          name="destination"
          className="input text-base sm:text-sm"
          placeholder="e.g. Family home, city centre…"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="returnAt">
          Expected return (jam balik)
        </label>
        <input
          id="returnAt"
          name="returnAt"
          type="datetime-local"
          className="input min-h-[2.75rem] w-full text-base sm:text-sm"
          required
        />
        <p className="mt-1 text-xs text-navy-400">
          Departure time is logged automatically when you submit.
        </p>
      </div>

      <LocationField label="Your location now (leaving the dorm)" />

      <div className="flex justify-center pt-1 sm:justify-start">
        <SubmitButton
          className="btn-primary w-full sm:w-auto sm:px-8"
          pendingText="Submitting…"
        >
          Submit
        </SubmitButton>
      </div>
    </form>
  );
}
