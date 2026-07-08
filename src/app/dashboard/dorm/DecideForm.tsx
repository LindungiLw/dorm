"use client";

import { useActionState } from "react";
import {
  decideExitRequestAction,
  type ExitState,
} from "@/lib/domain/permissions-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

export function DecideForm({ requestId }: { requestId: string }) {
  const [state, action] = useActionState<ExitState, FormData>(
    decideExitRequestAction,
    {},
  );
  return (
    <form action={action} className="mt-3 space-y-2 border-t border-navy-100 pt-3">
      <input type="hidden" name="requestId" value={requestId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      <input
        name="note"
        className="input"
        placeholder="Optional note to the student…"
        autoComplete="off"
      />
      <div className="flex gap-2">
        <SubmitButton
          className="btn-primary flex-1"
          pendingText="…"
          name="decision"
          value="APPROVE"
        >
          Approve
        </SubmitButton>
        <SubmitButton
          className="btn-danger flex-1"
          pendingText="…"
          name="decision"
          value="REJECT"
        >
          Reject
        </SubmitButton>
      </div>
    </form>
  );
}
