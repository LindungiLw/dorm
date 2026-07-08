import { getProducts } from "@/lib/domain/market";
import { PageHeader } from "@/components/ui";
import { ModuleSubnav, MARKET_TABS } from "@/components/ModuleSubnav";
import { ProductCatalog } from "@/components/ProductCatalog";

export default async function CatalogPage() {
  const products = await getProducts();

  return (
    <div>
      <ModuleSubnav tabs={MARKET_TABS} />
      <PageHeader
        title="Marketplace"
        subtitle="Student-to-student · pay with QRIS"
        icon="🛒"
      />
      <ProductCatalog products={products} />
    </div>
  );
}
