import { getCurrentActor } from "@/lib/auth/session";
import { getOwnExitRequests } from "@/lib/domain/permissions";
import { PageHeader, Card, StatusBadge, Alert } from "@/components/ui";
import { formatDateTime } from "@/lib/time";
import { ModuleSubnav, PERMISSION_TABS } from "@/components/ModuleSubnav";
import { ExitRequestForm } from "@/app/dashboard/permissions/ExitRequestForm";

export default async function ExitPermissionPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  if (actor.memberType !== "STUDENT") {
    return (
      <div>
        <PageHeader title="Exit Permissions" icon="🚪" />
        <Alert tone="info">
          Exit-dorm permissions are for dorm-resident students.
        </Alert>
      </div>
    );
  }

  const requests = await getOwnExitRequests(actor.id);

  return (
    <div>
      <ModuleSubnav tabs={PERMISSION_TABS} />
      <PageHeader
        title="Exit Permissions"
        subtitle={`Dormitory ${actor.dormId ?? "—"}`}
        icon="🚪"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-navy-800">New exit request</h2>
          <ExitRequestForm />
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-navy-800">
            My requests ({requests.length})
          </h2>
          {requests.length === 0 ? (
            <p className="text-sm text-navy-400">No requests yet.</p>
          ) : (
            <ul className="space-y-3">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-navy-100 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-navy-800">
                      {r.destination}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-navy-500">
                    {formatDateTime(r.departureAt)} → {formatDateTime(r.returnAt)}
                  </p>
                  {r.decisionNote && (
                    <p className="mt-1 text-xs text-navy-400">
                      Note: {r.decisionNote}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
