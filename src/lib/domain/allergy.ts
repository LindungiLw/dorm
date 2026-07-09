import { prisma } from "@/lib/db";

export type AllergenRow = { id: string; food: string };

// The cafeteria's list of foods served, alphabetised. Maintained by cafeteria staff,
// read by everyone (students mark which ones they can eat or want to avoid).
export async function getAllergenEntries(): Promise<AllergenRow[]> {
  return prisma.allergenEntry.findMany({
    select: { id: true, food: true },
    orderBy: { food: "asc" },
  });
}
