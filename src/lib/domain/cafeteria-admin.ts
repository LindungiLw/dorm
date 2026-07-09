import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/time";

// Today's check-ins, newest first, read from the redemption ledger (the source of truth).
export type CheckinRecord = {
  id: string;
  name: string;
  campusId: string;
  meal: string;
  at: Date;
};

export async function getTodaysCheckins(limit = 60): Promise<CheckinRecord[]> {
  const today = todayStr();
  const rows = await prisma.redemption.findMany({
    where: { redeemedAt: { gte: new Date(`${today}T00:00:00`) } },
    orderBy: { redeemedAt: "desc" },
    take: limit,
    include: { coupon: { select: { mealType: true } } },
  });
  const memberIds = [...new Set(rows.map((r) => r.memberId))];
  const members = memberIds.length
    ? await prisma.member.findMany({
        where: { id: { in: memberIds } },
        select: { id: true, fullName: true, campusId: true },
      })
    : [];
  const byId = new Map(members.map((m) => [m.id, m]));
  return rows.map((r) => {
    const m = byId.get(r.memberId);
    return {
      id: r.id,
      name: m?.fullName ?? "Unknown",
      campusId: m?.campusId ?? "",
      meal: r.coupon?.mealType ?? "",
      at: r.redeemedAt,
    };
  });
}

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
