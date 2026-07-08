import { prisma } from "@/lib/db";

export async function getOwnExitRequests(memberId: string) {
  return prisma.exitRequest.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
  });
}

// The member's currently-open leave pass (if they are out), else null.
export async function getActivePass(memberId: string) {
  return prisma.exitRequest.findFirst({
    where: { memberId, status: "OUT" },
    orderBy: { departureAt: "desc" },
  });
}

export async function getDormRequests(dormIds: (string | null)[]) {
  const ids = dormIds.filter((d): d is string => Boolean(d));
  if (ids.length === 0) return [];
  return prisma.exitRequest.findMany({
    where: { dormId: { in: ids } },
    orderBy: [{ status: "asc" }, { departureAt: "desc" }],
    include: { member: { select: { fullName: true, campusId: true } } },
  });
}
