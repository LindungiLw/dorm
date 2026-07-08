"use client";

import { useActionState } from "react";
import {
  createExitRequestAction,
  type ExitState,
} from "@/lib/domain/permissions-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

export function ExitRequestForm() {
  const [state, action] = useActionState<ExitState, FormData>(
    createExitRequestAction,
    {},
  );
  return (
    <form action={action} className="space-y-3">
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="departureAt">
            Departure
          </label>
          <input
            id="departureAt"
            name="departureAt"
            type="datetime-local"
            className="input"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="returnAt">
            Expected return
          </label>
          <input
            id="returnAt"
            name="returnAt"
            type="datetime-local"
            className="input"
            required
          />
        </div>
      </div>
      <SubmitButton pendingText="Submitting…">Submit exit request</SubmitButton>
    </form>
  );
}
