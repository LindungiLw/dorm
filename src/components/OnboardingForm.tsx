"use client";

import { useActionState } from "react";
import {
  completeOnboardingAction,
  type OnboardingState,
} from "@/lib/domain/onboarding-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

export function OnboardingForm({ isStaff }: { isStaff: boolean }) {
  const [state, action] = useActionState<OnboardingState, FormData>(
    completeOnboardingAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <div>
        <label className="label" htmlFor="campusId">
          {isStaff ? "Staff / Lecturer number" : "Student number (NIM)"}
        </label>
        <input
          id="campusId"
          name="campusId"
          className="input"
          autoComplete="off"
          inputMode={isStaff ? "text" : "numeric"}
          placeholder={isStaff ? "e.g. STF2024001" : "e.g. 20230012345"}
          required
        />
      </div>

      {isStaff ? (
        <div>
          <label className="label" htmlFor="memberType">
            Status
          </label>
          <select id="memberType" name="memberType" defaultValue="STAFF" className="input">
            <option value="STAFF">Staff</option>
            <option value="LECTURER">Lecturer</option>
          </select>
        </div>
      ) : (
        <input type="hidden" name="memberType" value="STUDENT" />
      )}

      <label className="flex items-start gap-2.5 rounded-xl border border-navy-100 bg-navy-50/40 p-3 text-sm text-navy-600">
        <input type="checkbox" name="confirm" className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          I confirm this ID is correct. It is locked afterwards and can only be corrected by
          an admin.
        </span>
      </label>

      <SubmitButton className="btn-primary w-full" pendingText="Saving…">
        Continue
      </SubmitButton>
    </form>
  );
}
