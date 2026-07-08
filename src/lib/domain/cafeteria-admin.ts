import { prisma } from "@/lib/db";

// Student cafeteria feedback / complaints are persisted as append-only audit entries
// (see submitCafeteriaFeedbackAction). This reads them back for the admin inbox — no
// separate table needed.
export type FeedbackKind = "FEEDBACK" | "COMPLAINT";
export type FeedbackItem = {
  id: string;
  kind: FeedbackKind;
  message: string;
  from: string;
  at: Date;
};

export async function getCafeteriaFeedback(limit = 30): Promise<FeedbackItem[]> {
  const rows = await prisma.auditLog.findMany({
    where: { action: { in: ["cafeteria.feedback", "cafeteria.complaint"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => {
    let message = "";
    try {
      if (r.meta) message = (JSON.parse(r.meta).message as string) ?? "";
    } catch {
      /* malformed meta — leave message blank */
    }
    return {
      id: r.id,
      kind: r.action === "cafeteria.complaint" ? "COMPLAINT" : "FEEDBACK",
      message,
      from: r.actorName,
      at: r.createdAt,
    };
  });
}
