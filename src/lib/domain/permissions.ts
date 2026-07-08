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
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { member: { select: { fullName: true, campusId: true } } },
  });
}
