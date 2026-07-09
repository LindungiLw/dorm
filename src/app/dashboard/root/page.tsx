import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { hasRole } from "@/lib/authz/policy";
import { getAdmins } from "@/lib/domain/admins";
import { PageHeader, Card } from "@/components/ui";
import { RootAdminManager } from "@/components/RootAdminManager";

export default async function RootPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  // Only the ROOT super-admin may see this — others are bounced home silently.
  if (!hasRole(actor, "ROOT")) redirect("/dashboard");

  const admins = await getAdmins();

  return (
    <div>
      <PageHeader
        title="Root — Access Control"
        subtitle="Grant or revoke Cafeteria, Dorm, and Market admin access"
        icon="🛡️"
      />
      <Card className="max-w-2xl">
        <RootAdminManager admins={admins} />
      </Card>
    </div>
  );
}
