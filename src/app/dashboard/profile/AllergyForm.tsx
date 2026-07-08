"use client";

import { useActionState } from "react";
import { updateAllergyAction, type ProfileState } from "@/lib/domain/profile-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

export function AllergyForm({ initial }: { initial: string }) {
  const [state, action] = useActionState<ProfileState, FormData>(
    updateAllergyAction,
    {},
  );
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      <div>
        <label className="label" htmlFor="allergyInfo">
          Allergy information
        </label>
        <textarea
          id="allergyInfo"
          name="allergyInfo"
          rows={3}
          className="input"
          defaultValue={initial}
          placeholder="e.g. Peanuts, shellfish — or leave blank if none"
        />
      </div>
      <SubmitButton pendingText="Saving…">Save allergy info</SubmitButton>
    </form>
  );
}
