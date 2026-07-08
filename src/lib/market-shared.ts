// Client-safe marketplace helpers (NO Prisma import), shared by the server page and the
// client catalog component.

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number; // whole Rupiah
  category: string;
  emoji: string | null;
  // Seller / payment info (present in the public catalog so checkout can show the
  // right QRIS). Optional because seeded demo items have no seller.
  sellerKey?: string | null; // groups cart items by seller at checkout
  storeName?: string | null;
  qrisNumber?: string | null;
  qrisImage?: string | null; // data URL of the seller's QRIS code
};

export type Category = { value: string; label: string; emoji: string };

export const CATEGORIES: Category[] = [
  { value: "ELECTRONICS", label: "Electronics", emoji: "💻" },
  { value: "FASHION", label: "Fashion", emoji: "👕" },
  { value: "STATIONERY", label: "Stationery", emoji: "✏️" },
  { value: "FOOD_BEVERAGE", label: "Food & Beverages", emoji: "🍫" },
];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);

export function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}
