import { getCurrentActor } from "@/lib/auth/session";
import { getSellerProfile, getMyProducts } from "@/lib/domain/seller";
import { PageHeader, Card, Alert } from "@/components/ui";
import { ModuleSubnav, MARKET_TABS } from "@/components/ModuleSubnav";
import { SellerRequestForm } from "@/components/SellerRequestForm";
import { SellerDashboard } from "@/components/SellerDashboard";

export default async function SellPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  const profile = await getSellerProfile(actor.id);
  const status = profile?.status ?? null;

  return (
    <div>
      <ModuleSubnav tabs={MARKET_TABS} />
      <PageHeader title="Become a Seller" icon="🏪" />

      {status === "APPROVED" ? (
        <SellerDashboard products={await getMyProducts(actor.id)} />
      ) : status === "PENDING" ? (
        <Card className="max-w-lg">
          <Alert tone="info">
            Your request to become a seller is <strong>pending</strong> — a market
            admin will review it soon.
          </Alert>
        </Card>
      ) : (
        <Card className="max-w-lg">
          <h2 className="mb-1 font-semibold text-navy-800">
            Request to Become a Seller
          </h2>
          <p className="mb-4 text-sm text-navy-500">
            Add your details and QRIS so buyers can pay you directly. A market admin
            will review your request.
          </p>
          {status === "REJECTED" && (
            <div className="mb-4">
              <Alert tone="error">
                Your previous request wasn&rsquo;t approved. Update your details and
                re-apply below.
              </Alert>
            </div>
          )}
          <SellerRequestForm
            defaults={
              profile
                ? {
                    storeName: profile.storeName,
                    phone: profile.phone,
                    qrisNumber: profile.qrisNumber ?? undefined,
                    qrisImage: profile.qrisImage,
                  }
                : undefined
            }
          />
        </Card>
      )}
    </div>
  );
}
