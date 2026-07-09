import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { getPendingSellerRequests } from "@/lib/domain/seller";
import { PageHeader, Card } from "@/components/ui";
import { SellerReview } from "@/components/SellerReview";

export default async function MarketAdminPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  // Market admins only — others are bounced home silently.
  if (!can(actor, "market:manage")) redirect("/dashboard");

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
