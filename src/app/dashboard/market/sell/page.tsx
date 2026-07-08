import { PageHeader, Card, Alert } from "@/components/ui";
import { ModuleSubnav, MARKET_TABS } from "@/components/ModuleSubnav";

export default function SellPage() {
  return (
    <div>
      <ModuleSubnav tabs={MARKET_TABS} />
      <PageHeader
        title="Jadi Penjual"
        subtitle="Create and manage your listings"
        icon="🏪"
      />

      <Alert tone="info">
        Seller tools (create a listing, upload photos, set price, manage stock) ship in the
        marketplace phase. Here's a preview of the listing form.
      </Alert>

      <Card className="mt-4 max-w-xl space-y-3 opacity-70">
        <div>
          <label className="label">Product name</label>
          <input className="input" placeholder="e.g. Study desk lamp" disabled />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Price (IDR)</label>
            <input className="input" placeholder="45000" disabled />
          </div>
          <div>
            <label className="label">Stock</label>
            <input className="input" placeholder="1" disabled />
          </div>
        </div>
        <div>
          <label className="label">Photo</label>
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-navy-200 text-sm text-navy-400">
            Upload (coming soon)
          </div>
        </div>
        <button className="btn-gold w-full" disabled title="Coming soon">
          Publish listing
        </button>
      </Card>
    </div>
  );
}
