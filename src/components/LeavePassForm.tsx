"use client";

import { useActionState, useEffect, useState } from "react";
import {
  submitLeavePassAction,
  type ExitState,
} from "@/lib/domain/permissions-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import { LocationField, type Coords } from "@/components/LocationField";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
// Read the WIB wall-clock via UTC getters on a +7h-shifted Date, so the prefill matches the
// server's WIB interpretation regardless of the device timezone.
function fmtDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function fmtTime(d: Date): string {
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function LeavePassForm() {
  const [state, action] = useActionState<ExitState, FormData>(
    submitLeavePassAction,
    {},
  );

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [minDate, setMinDate] = useState("");
  const [coords, setCoords] = useState<Coords | null>(null);

  // Client-only defaults (avoids a hydration mismatch). The expected return defaults to about
  // two hours out: always a valid future time the student can adjust, never the current
  // instant (which the server rejects as "not in the future").
  useEffect(() => {
    const wibNow = new Date(Date.now() + WIB_OFFSET_MS);
    setMinDate(fmtDate(wibNow));
    const wibReturn = new Date(wibNow.getTime() + 2 * 60 * 60 * 1000);
    setDate(fmtDate(wibReturn));
    setTime(fmtTime(wibReturn));
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

      <LocationField
        label="Your location now"
        required
        value={coords}
        onChange={setCoords}
      />

      <div className="flex justify-center pt-1 sm:justify-start">
        <SubmitButton
          className="btn-primary w-full sm:w-auto sm:px-8 disabled:cursor-not-allowed disabled:opacity-60"
          pendingText="Submitting…"
          disabled={!coords}
        >
          Submit
        </SubmitButton>
      </div>
    </form>
  );
}
