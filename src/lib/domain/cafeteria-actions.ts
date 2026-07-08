"use server";

import { z } from "zod";
import { getCurrentActor } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit";

export type FeedbackState = { error?: string; ok?: string };

const schema = z.object({
  kind: z.enum(["FEEDBACK", "COMPLAINT"]),
  message: z.string().min(3, "Please write a short message.").max(1000),
});

// Cafeteria "Pengajuan" — submit feedback or a food complaint. Persisted as an
// append-only audit entry (visible on the Academic dashboard).
export async function submitCafeteriaFeedbackAction(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  const parsed = schema.safeParse({
    kind: formData.get("kind"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  await writeAudit(
    actor,
    parsed.data.kind === "COMPLAINT" ? "cafeteria.complaint" : "cafeteria.feedback",
    "Cafeteria",
    actor.id,
    { message: parsed.data.message },
  );

  return {
    ok:
      parsed.data.kind === "COMPLAINT"
        ? "Complaint submitted — thank you, the cafeteria team will review it."
        : "Feedback submitted — thank you!",
  };
}
