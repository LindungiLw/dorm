import { prisma } from "@/lib/db";
import type { Product } from "@/lib/market-shared";

export async function getSellerProfile(memberId: string) {
  return prisma.sellerProfile.findUnique({ where: { memberId } });
}

export type PendingRequest = {
  memberId: string;
  storeName: string;
  phone: string;
  qrisNumber: string | null;
  qrisImage: string | null;
  createdAt: Date;
  member: { fullName: string; campusId: string; email: string } | null;
};

// Seller requests awaiting a market-admin decision, with the requester's identity.
export async function getPendingSellerRequests(): Promise<PendingRequest[]> {
  const rows = await prisma.sellerProfile.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
  const members = await prisma.member.findMany({
    where: { id: { in: rows.map((r) => r.memberId) } },
    select: { id: true, fullName: true, campusId: true, email: true },
  });
  const byId = new Map(members.map((m) => [m.id, m]));
  return rows.map((r) => ({
    memberId: r.memberId,
    storeName: r.storeName,
    phone: r.phone,
    qrisNumber: r.qrisNumber,
    qrisImage: r.qrisImage,
    createdAt: r.createdAt,
    member: byId.get(r.memberId) ?? null,
  }));
}

// A seller's own product listings.
export async function getMyProducts(sellerId: string): Promise<Product[]> {
  return prisma.product.findMany({
    where: { sellerId },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      category: true,
      emoji: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
