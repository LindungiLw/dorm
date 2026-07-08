import { PageHeader, Card } from "@/components/ui";
import { ModuleSubnav, MARKET_TABS } from "@/components/ModuleSubnav";

// Marketplace is FACILITATOR-ONLY (no money moves in-app). This catalog is a stub for
// the full Phase 5 build; "payment method" will be a label on the order, not a charge.
const PRODUCTS = [
  { name: "Study Desk Lamp", price: "Rp 45.000", emoji: "💡", seller: "Andi P." },
  { name: "Scientific Calculator", price: "Rp 80.000", emoji: "🧮", seller: "Bunga S." },
  { name: "Mini Fridge (used)", price: "Rp 350.000", emoji: "🧊", seller: "Citra D." },
  { name: "Textbook: Algorithms", price: "Rp 60.000", emoji: "📘", seller: "Dewa N." },
  { name: "Desk Fan", price: "Rp 55.000", emoji: "🌀", seller: "Andi P." },
  { name: "Instant Noodle Pack", price: "Rp 25.000", emoji: "🍜", seller: "Bunga S." },
];

export default function CatalogPage() {
  return (
    <div>
      <ModuleSubnav tabs={MARKET_TABS} />
      <PageHeader
        title="Marketplace"
        subtitle="Student-to-student · facilitator only (settle offline)"
        icon="🛒"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => (
          <Card key={p.name} className="flex flex-col">
            <div className="flex h-28 items-center justify-center rounded-lg bg-navy-50 text-5xl">
              {p.emoji}
            </div>
            <h3 className="mt-3 font-semibold text-navy-800">{p.name}</h3>
            <p className="text-xs text-navy-400">Seller: {p.seller}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-bold text-navy-700">{p.price}</span>
              <button className="btn-gold" disabled title="Checkout ships in Phase 5">
                Add to cart
              </button>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-navy-400">
        Catalog is a Phase 5 stub — listings, checkout, delivery labels, and moderation are
        the next build.
      </p>
    </div>
  );
}
