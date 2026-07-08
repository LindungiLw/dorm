import { PageHeader } from "@/components/ui";
import { ModuleSubnav, PERMISSION_TABS } from "@/components/ModuleSubnav";
import { BorrowCatalog } from "@/components/BorrowCatalog";

export default function BorrowPage() {
  return (
    <div>
      <ModuleSubnav tabs={PERMISSION_TABS} />
      <PageHeader
        title="Peminjaman Barang"
        subtitle="Borrow items & book rooms across campus"
        icon="📦"
      />
      <BorrowCatalog />
    </div>
  );
}
