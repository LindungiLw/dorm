"use client";

import { useActionState, useEffect, useState } from "react";
import {
  submitLeavePassAction,
  type ExitState,
} from "@/lib/domain/permissions-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import { LocationField } from "@/components/LocationField";

type Preset = { label: string; date: string; time: string };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// A couple of one-tap return times so students rarely need the native picker on a phone.
// Built on the client (in an effect) so the device clock, not the server's, decides them.
function buildPresets(): Preset[] {
  const now = new Date();
  const out: Preset[] = [];
  if (now.getHours() < 21) {
    out.push({ label: "Tonight, 9 PM", date: fmtDate(now), time: "21:00" });
  }
  const tmr = new Date(now);
  tmr.setDate(tmr.getDate() + 1);
  out.push({ label: "Tomorrow, 8 AM", date: fmtDate(tmr), time: "08:00" });
  out.push({ label: "Tomorrow, 6 PM", date: fmtDate(tmr), time: "18:00" });
  return out;
}

export function LeavePassForm() {
  const [state, action] = useActionState<ExitState, FormData>(
    submitLeavePassAction,
    {},
  );

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [minDate, setMinDate] = useState("");

  // Client-only: avoids a server/client hydration mismatch on the computed dates.
  useEffect(() => {
    setPresets(buildPresets());
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

        {presets.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {presets.map((p) => {
              const active = date === p.date && time === p.time;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setDate(p.date);
                    setTime(p.time);
                  }}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-navy-600 bg-navy-600 text-white"
                      : "border-navy-200 text-navy-600 hover:bg-navy-50"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}

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
