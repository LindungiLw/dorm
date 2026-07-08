import { prisma } from "@/lib/db";

export type AllergenRow = { id: string; food: string; allergens: string };

// The cafeteria's food-allergen list, alphabetised by dish. Read by everyone.
export async function getAllergenEntries(): Promise<AllergenRow[]> {
  return prisma.allergenEntry.findMany({
    select: { id: true, food: true, allergens: true },
    orderBy: { food: "asc" },
  });
}
