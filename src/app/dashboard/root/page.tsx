import { getCurrentActor } from "@/lib/auth/session";
import { hasRole } from "@/lib/authz/policy";
import { getAdmins } from "@/lib/domain/admins";
import { PageHeader, Card, Alert } from "@/components/ui";
import { RootAdminManager } from "@/components/RootAdminManager";

export default async function RootPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  if (!hasRole(actor, "ROOT")) {
    return (
      <div>
        <PageHeader title="Root" icon="🛡️" />
        <Alert tone="info">This area is for the root super-admin only.</Alert>
      </div>
    );
  }

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
      <p className="mt-3 max-w-2xl text-xs text-navy-400">
        Root is set in code and can&rsquo;t be revoked here. To let someone also run a
        module day-to-day (e.g. edit the cafeteria menu yourself), grant yourself that
        module&rsquo;s admin role too.
      </p>
    </div>
  );
}
