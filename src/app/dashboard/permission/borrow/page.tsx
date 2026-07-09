import Link from "next/link";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { getBorrowItems } from "@/lib/domain/borrow";
import { PageHeader } from "@/components/ui";
import { ModuleSubnav, PERMISSION_TABS } from "@/components/ModuleSubnav";
import { BorrowCatalog } from "@/components/BorrowCatalog";

export default async function BorrowPage() {
  const actor = await getCurrentActor();
  const items = await getBorrowItems();
  const canManage = actor ? can(actor, "borrow:manage") : false;

  return (
    <div>
      <ModuleSubnav tabs={PERMISSION_TABS} />
      <PageHeader
        title="Peminjaman Barang"
        subtitle="Borrow items & book rooms across campus"
        icon="📦"
      />
      {canManage && (
        <div className="mb-4">
          <Link
            href="/dashboard/permission/borrow/manage"
            className="btn-primary text-sm"
          >
            Manage items
          </Link>
        </div>
      )}
      <BorrowCatalog items={items} />
    </div>
  );
}
