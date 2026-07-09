import { prisma } from "@/lib/db";
import type { Product } from "@/lib/market-shared";

// All marketplace products, newest first, each carrying its seller's QRIS payment
// details (when the seller is approved) so the buyer can pay at checkout. The catalog
// filters/searches client-side.
export async function getProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      category: true,
      emoji: true,
      sellerId: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const sellerIds = [
    ...new Set(products.map((p) => p.sellerId).filter((v): v is string => !!v)),
  ];
  const profiles = sellerIds.length
    ? await prisma.sellerProfile.findMany({
        where: { memberId: { in: sellerIds }, status: "APPROVED" },
        select: {
          memberId: true,
          storeName: true,
          qrisNumber: true,
          qrisImage: true,
        },
      })
    : [];
  const byMember = new Map(profiles.map((s) => [s.memberId, s]));

  return products
    // Show seeded demo items (no seller) and products from currently-approved sellers only,
    // so a revoked seller's listings drop out of the catalog.
    .filter((p) => !p.sellerId || byMember.has(p.sellerId))
    .map((p) => {
      const s = p.sellerId ? byMember.get(p.sellerId) : null;
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        emoji: p.emoji,
        sellerKey: p.sellerId ?? null,
        storeName: s?.storeName ?? null,
        qrisNumber: s?.qrisNumber ?? null,
        qrisImage: s?.qrisImage ?? null,
      };
    });
}
