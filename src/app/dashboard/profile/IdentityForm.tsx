"use client";

import { useActionState } from "react";
import { updateIdentityAction, type ProfileState } from "@/lib/domain/profile-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

// Map the stored member type to one of the three selectable statuses.
function statusValue(memberType: string): string {
  if (memberType === "LECTURER") return "LECTURER";
  if (memberType === "STAFF") return "STAFF";
  if (memberType === "FACULTY") return "STAFF"; // legacy value → closest option
  return "STUDENT";
}

export function IdentityForm({
  campusId,
  memberType,
  dormId,
}: {
  campusId: string;
  memberType: string;
  dormId: string | null;
}) {
  const [state, action] = useActionState<ProfileState, FormData>(updateIdentityAction, {});

  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}

      <div>
        <label className="label" htmlFor="campusId">
          Student ID (NIM)
        </label>
        <input
          id="campusId"
          name="campusId"
          defaultValue={campusId}
          className="input"
          autoComplete="off"
        />
      </div>

      <div>
        <label className="label" htmlFor="memberType">
          Status
        </label>
        <select
          id="memberType"
          name="memberType"
          defaultValue={statusValue(memberType)}
          className="input"
        >
          <option value="STUDENT">Student</option>
          <option value="LECTURER">Lecturer</option>
          <option value="STAFF">Staff</option>
        </select>
      </div>

      <div className="flex justify-between border-t border-navy-50 pt-3 text-sm">
        <span className="text-navy-400">Dormitory</span>
        <span className="font-medium text-navy-800">{dormId ?? "—"}</span>
      </div>

      <SubmitButton pendingText="Saving…">Save</SubmitButton>
    </form>
  );
}
