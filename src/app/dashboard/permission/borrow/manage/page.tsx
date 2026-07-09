import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { getBorrowItems } from "@/lib/domain/borrow";
import { PageHeader } from "@/components/ui";
import { BorrowManager } from "@/components/BorrowManager";

// Permission (dorm) admins only — others are bounced home silently.
export default async function BorrowManagePage() {
  const actor = await getCurrentActor();
  if (!actor) return null;
  if (!can(actor, "borrow:manage")) redirect("/dashboard");

  const items = await getBorrowItems();

  return (
    <div>
      <PageHeader
        title="Manage Borrow Items"
        subtitle="Add photos, set how many are available, and list the parts inside"
        icon="📦"
      />
      <div className="mb-4">
        <Link href="/dashboard/permission/borrow" className="btn-outline text-sm">
          ← Back to catalog
        </Link>
      </div>
      <BorrowManager items={items} />
    </div>
  );
}
