"use client";

import { useActionState } from "react";
import {
  submitReturnPassAction,
  type ExitState,
} from "@/lib/domain/permissions-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import { LocationField } from "@/components/LocationField";

export function ReturnPassForm({ defaultReturn }: { defaultReturn: string }) {
  const [state, action] = useActionState<ExitState, FormData>(
    submitReturnPassAction,
    {},
  );
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}

      <div>
        <label className="label" htmlFor="actualReturnAt">
          Return
        </label>
        <input
          id="actualReturnAt"
          name="actualReturnAt"
          type="datetime-local"
          className="input"
          defaultValue={defaultReturn}
          required
        />
        <p className="mt-1 text-xs text-navy-400">
          Date &amp; time you actually got back to the dorm.
        </p>
      </div>

      <LocationField label="Return location (back at the dorm)" />

      <SubmitButton className="btn-primary" pendingText="Submitting…">
        Submit
      </SubmitButton>
    </form>
  );
}
