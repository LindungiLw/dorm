"use client";

import { useActionState } from "react";
import {
  markReturnedAction,
  type ExitState,
} from "@/lib/domain/permissions-actions";
import { SubmitButton } from "@/components/SubmitButton";

// Dorm-staff / security control: mark a student who is OUT as returned. Students never
// see this — the authority to close a pass belongs to the dorm.
export function ReturnButton({ id }: { id: string }) {
  const [state, action] = useActionState<ExitState, FormData>(
    markReturnedAction,
    {},
  );
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="id" value={id} />
      {state.error && <p className="mb-1 text-xs text-red-600">{state.error}</p>}
      <SubmitButton className="btn-primary w-full text-sm" pendingText="Marking…">
        Mark returned
      </SubmitButton>
    </form>
  );
}
