import { prisma } from "@/lib/db";
import type { Product } from "@/lib/market-shared";

// All marketplace products, newest first. The catalog filters/searches client-side.
export async function getProducts(): Promise<Product[]> {
  return prisma.product.findMany({
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
