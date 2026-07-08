import { PageHeader, Card, Alert } from "@/components/ui";
import { ModuleSubnav, PERMISSION_TABS } from "@/components/ModuleSubnav";

const ITEMS = [
  { name: "Study Room A", type: "Room", emoji: "🚪" },
  { name: "Projector", type: "Item", emoji: "📽️" },
  { name: "Badminton Set", type: "Item", emoji: "🏸" },
  { name: "Vacuum Cleaner", type: "Item", emoji: "🧹" },
];

export default function BorrowPage() {
  return (
    <div>
      <ModuleSubnav tabs={PERMISSION_TABS} />
      <PageHeader
        title="Peminjaman Barang"
        subtitle="Borrow items & book rooms"
        icon="📦"
      />

      <Alert tone="info">
        Borrowing (inventory + room scheduling with availability and overdue tracking) is
        the next build phase. Below is a preview of the catalog.
      </Alert>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((it) => (
          <Card key={it.name}>
            <div className="flex h-20 items-center justify-center rounded-lg bg-navy-50 text-4xl">
              {it.emoji}
            </div>
            <h3 className="mt-3 font-semibold text-navy-800">{it.name}</h3>
            <p className="text-xs text-navy-400">{it.type}</p>
            <button className="btn-outline mt-3 w-full" disabled title="Coming soon">
              Request
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
