import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { getPendingSellerRequests, getApprovedSellers } from "@/lib/domain/seller";
import { PageHeader, Card } from "@/components/ui";
import { SellerReview } from "@/components/SellerReview";
import { SellerManage } from "@/components/SellerManage";

export default async function MarketAdminPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  // Market admins only — others are bounced home silently.
  if (!can(actor, "market:manage")) redirect("/dashboard");

  const [requests, sellers] = await Promise.all([
    getPendingSellerRequests(),
    getApprovedSellers(),
  ]);

  return (
    <div>
      <PageHeader
        title="Market Administration"
        subtitle="Grant seller access and manage who can sell"
        icon="🛍️"
      />
      <div className="space-y-6">
        <Card>
          <h2 className="mb-3 font-semibold text-navy-800">
            Pending seller requests ({requests.length})
          </h2>
          <SellerReview requests={requests} />
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-navy-800">
            Active sellers ({sellers.length})
          </h2>
          <p className="mb-3 text-sm text-navy-500">
            These students can add products. Revoke access to remove their listings from
            the catalog. They can re-apply afterwards.
          </p>
          <SellerManage sellers={sellers} />
        </Card>
      </div>
    </div>
  );
}
