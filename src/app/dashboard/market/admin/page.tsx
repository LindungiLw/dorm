import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { getPendingSellerRequests } from "@/lib/domain/seller";
import { PageHeader, Card, Alert } from "@/components/ui";
import { SellerReview } from "@/components/SellerReview";

export default async function MarketAdminPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  if (!can(actor, "market:manage")) {
    return (
      <div>
        <PageHeader title="Market Admin" icon="🛍️" />
        <Alert tone="info">This area is for market administrators.</Alert>
      </div>
    );
  }

  const requests = await getPendingSellerRequests();

  return (
    <div>
      <PageHeader
        title="Market Administration"
        subtitle="Review requests to become a seller"
        icon="🛍️"
      />
      <Card>
        <h2 className="mb-3 font-semibold text-navy-800">
          Pending seller requests ({requests.length})
        </h2>
        <SellerReview requests={requests} />
      </Card>
    </div>
  );
}
