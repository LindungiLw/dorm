"use client";

import { useActionState, useEffect, useState } from "react";
import {
  submitLeavePassAction,
  type ExitState,
} from "@/lib/domain/permissions-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import { LocationField } from "@/components/LocationField";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function LeavePassForm() {
  const [state, action] = useActionState<ExitState, FormData>(
    submitLeavePassAction,
    {},
  );

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [minDate, setMinDate] = useState("");

  // Client-only: today's date as the earliest selectable day (avoids a hydration mismatch).
  useEffect(() => {
    setMinDate(fmtDate(new Date()));
  }, []);

  // The single value the server parses (WIB wall-clock), assembled from the two fields.
  const returnAt = date && time ? `${date}T${time}` : "";

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
          className="input"
          placeholder="e.g. Family home, city centre…"
          required
        />
      </div>

      <div>
        <span className="label">Expected return</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            aria-label="Return date"
            type="date"
            value={date}
            min={minDate || undefined}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
          <input
            aria-label="Return time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input"
            required
          />
        </div>

        <input type="hidden" name="returnAt" value={returnAt} readOnly />
        <p className="mt-1.5 text-xs text-navy-400">
          Departure time is logged automatically.
        </p>
      </div>

      <LocationField label="Your location now" />

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
