// Client-safe borrow types + pure helpers (NO Prisma import), so both client components
// (catalog, manager) and the server read layer can share them.

export const BORROW_CATEGORIES = [
  { value: "ROOM", label: "Study Room" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "LAB", label: "Computer Lab" },
  { value: "SPORTS", label: "Sports" },
  { value: "MUSIC", label: "Music" },
  { value: "OTHER", label: "Other" },
] as const;

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  BORROW_CATEGORIES.map((c) => [c.value, c.label]),
);

// Rooms and labs are measured in people; everything else in units.
export function unitLabelFor(category: string): string {
  return category === "ROOM" || category === "LAB" ? "people" : "units";
}

export type BorrowStatus = "AVAILABLE" | "LIMITED" | "BORROWED";
export type BorrowPart = { name: string; qty: number };

export type BorrowItemRow = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  imageUrl: string | null;
  emoji: string | null;
  location: string;
  schedule: string;
  quantity: number;
  unitLabel: string;
  description: string;
  parts: BorrowPart[];
  status: BorrowStatus;
};

// Availability is derived from how many are left, so the admin only tracks one number.
export function deriveStatus(quantity: number): BorrowStatus {
  if (quantity <= 0) return "BORROWED";
  if (quantity <= 2) return "LIMITED";
  return "AVAILABLE";
}

export function parseParts(raw: string | null): BorrowPart[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((p) => ({
        name: String(p?.name ?? "").trim(),
        qty: Number.isFinite(Number(p?.qty)) ? Math.max(0, Math.round(Number(p.qty))) : 0,
      }))
      .filter((p) => p.name);
  } catch {
    return [];
  }
}
