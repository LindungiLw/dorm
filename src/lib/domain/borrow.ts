import { prisma } from "@/lib/db";
import {
  deriveStatus,
  parseParts,
  type BorrowItemRow,
} from "@/lib/domain/borrow-types";

export { deriveStatus, parseParts } from "@/lib/domain/borrow-types";
export type {
  BorrowStatus,
  BorrowPart,
  BorrowItemRow,
} from "@/lib/domain/borrow-types";

function toRow(r: {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  emoji: string | null;
  location: string;
  schedule: string;
  quantity: number;
  description: string;
  parts: string | null;
}): BorrowItemRow {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    imageUrl: r.imageUrl,
    emoji: r.emoji,
    location: r.location,
    schedule: r.schedule,
    quantity: r.quantity,
    description: r.description,
    parts: parseParts(r.parts),
    status: deriveStatus(r.quantity),
  };
}

export async function getBorrowItems(): Promise<BorrowItemRow[]> {
  const rows = await prisma.borrowItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return rows.map(toRow);
}
