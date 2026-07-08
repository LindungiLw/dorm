"use client";

import { useActionState } from "react";
import {
  submitCafeteriaFeedbackAction,
  type FeedbackState,
} from "@/lib/domain/cafeteria-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

export function PengajuanForm() {
  const [state, action] = useActionState<FeedbackState, FormData>(
    submitCafeteriaFeedbackAction,
    {},
  );
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      <div>
        <label className="label" htmlFor="kind">
          Type
        </label>
        <select id="kind" name="kind" className="input">
          <option value="FEEDBACK">Feedback</option>
          <option value="COMPLAINT">Food complaint</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="input"
          placeholder="Tell us about your meal experience…"
        />
      </div>
      <SubmitButton pendingText="Submitting…">Submit</SubmitButton>
    </form>
  );
}
