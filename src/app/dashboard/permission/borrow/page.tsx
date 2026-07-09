import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { can, canUsePermission } from "@/lib/authz/policy";
import { getBorrowItems } from "@/lib/domain/borrow";
import { PageHeader } from "@/components/ui";
import { ModuleSubnav, PERMISSION_TABS } from "@/components/ModuleSubnav";
import { BorrowCatalog } from "@/components/BorrowCatalog";

export default async function BorrowPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;
  // The Permission module is for dorm-resident students only. Admins manage borrow items
  // from the Dorm console instead.
  if (!canUsePermission(actor)) redirect("/dashboard");

  const items = await getBorrowItems();
  const canManage = can(actor, "borrow:manage");

  return (
    <div>
      <ModuleSubnav tabs={PERMISSION_TABS} />
      <PageHeader
        title="Borrow Items"
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
