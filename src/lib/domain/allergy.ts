import { prisma } from "@/lib/db";

export type AllergenRow = { id: string; food: string };

// A member's saved choice for a listed food.
export type FoodChoice = "safe" | "avoid";
export type FoodChoiceMap = Record<string, FoodChoice>;

// The cafeteria's list of foods served, alphabetised. Maintained by cafeteria staff,
// read by everyone (students mark which ones they can eat or want to avoid).
export async function getAllergenEntries(): Promise<AllergenRow[]> {
  return prisma.allergenEntry.findMany({
    select: { id: true, food: true },
    orderBy: { food: "asc" },
  });
}

// One member's own saved food choices (parsed from the JSON they last saved). Unknown or
// malformed data is treated as "nothing saved yet" so a bad value never breaks the page.
export async function getMyFoodChoices(memberId: string): Promise<FoodChoiceMap> {
  const m = await prisma.member.findUnique({
    where: { id: memberId },
    select: { foodChoices: true },
  });
  return parseFoodChoices(m?.foodChoices);
}

// Keep only well-formed entries: string id -> "safe" | "avoid". Everything else is dropped.
export function parseFoodChoices(raw: string | null | undefined): FoodChoiceMap {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw) as unknown;
    if (!obj || typeof obj !== "object") return {};
    const out: FoodChoiceMap = {};
    for (const [id, val] of Object.entries(obj as Record<string, unknown>)) {
      if (val === "safe" || val === "avoid") out[id] = val;
    }
    return out;
  } catch {
    return {};
  }
}
