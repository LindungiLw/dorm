// Client-safe borrow types + pure helpers (NO Prisma import), so both client components
// (catalog, manager) and the server read layer can share them. Categories are free text
// written by the admin, so there is no fixed list here.

export type BorrowStatus = "AVAILABLE" | "LIMITED" | "BORROWED";
export type BorrowPart = { name: string; qty: number };

export type BorrowItemRow = {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  emoji: string | null;
  location: string;
  schedule: string;
  quantity: number;
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
