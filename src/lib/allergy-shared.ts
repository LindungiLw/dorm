// Client-safe allergen catalog (NO Prisma import), shared by the picker component and
// the server action (which validates submitted names against this allow-list).
//
// The cafeteria flags which of these ingredients are present in the food; students
// check the flagged list before they eat. Names are the Indonesian ingredient names.

export type Allergen = { name: string; emoji: string };

export const ALLERGEN_CATALOG: Allergen[] = [
  { name: "Udang", emoji: "🦐" },
  { name: "Kerang", emoji: "🦪" },
  { name: "Ikan", emoji: "🐟" },
  { name: "Telur", emoji: "🥚" },
  { name: "Susu", emoji: "🥛" },
  { name: "Kacang Tanah", emoji: "🥜" },
  { name: "Kacang Pohon", emoji: "🌰" },
  { name: "Kedelai", emoji: "🫛" },
  { name: "Gandum", emoji: "🌾" },
  { name: "Wijen", emoji: "🫓" },
];

export const ALLERGEN_NAMES: string[] = ALLERGEN_CATALOG.map((a) => a.name);

const EMOJI_BY_NAME: Record<string, string> = Object.fromEntries(
  ALLERGEN_CATALOG.map((a) => [a.name, a.emoji]),
);

export function allergenEmoji(name: string): string {
  return EMOJI_BY_NAME[name] ?? "⚠️";
}
