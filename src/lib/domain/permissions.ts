import { prisma } from "@/lib/db";

export async function getOwnExitRequests(memberId: string) {
  return prisma.exitRequest.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
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

// Campus-wide live board for security (satpam): everyone currently out, across all dorms.
export async function getOutRequests() {
  return prisma.exitRequest.findMany({
    where: { status: "OUT" },
    orderBy: { departureAt: "desc" },
    include: { member: { select: { fullName: true, campusId: true } } },
  });
}

// The most recent returns, so the guard can confirm a pass was just closed.
export async function getRecentReturns(limit = 15) {
  return prisma.exitRequest.findMany({
    where: { status: "RETURNED" },
    orderBy: { actualReturnAt: "desc" },
    include: { member: { select: { fullName: true, campusId: true } } },
    take: limit,
  });
}
