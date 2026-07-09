import { getCurrentActor } from "@/lib/auth/session";
import { getOwnExitRequests } from "@/lib/domain/permissions";
import { PageHeader, Card, StatusBadge, Alert } from "@/components/ui";
import { formatDateTime } from "@/lib/time";
import { ModuleSubnav, PERMISSION_TABS } from "@/components/ModuleSubnav";
import { LeavePassForm } from "@/components/LeavePassForm";
import { AutoRefresh } from "@/components/AutoRefresh";

function mapLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

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

  const passes = await getOwnExitRequests(actor.id);
  const isOut = passes.some((p) => p.status === "OUT");

  return (
    <div>
      {/* While out, poll so the card flips the moment security marks the return. */}
      {isOut && <AutoRefresh seconds={15} />}
      <ModuleSubnav tabs={PERMISSION_TABS} />
      <PageHeader
        title="Exit Permissions"
        subtitle={`Dormitory ${actor.dormId ?? "—"}`}
        icon="🚪"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leave Pass */}
        <Card>
          <h2 className="mb-1 font-semibold text-navy-800">Leave Pass</h2>
          <p className="mb-3 text-sm text-navy-500">
            Log that you&rsquo;re leaving the dorm.
          </p>
          <LeavePassForm />
        </Card>

        {/* Coming back — return is recorded by dorm staff, not the student */}
        <Card>
          <h2 className="mb-1 font-semibold text-navy-800">Coming back</h2>
          {isOut ? (
            <Alert tone="info">
              You&rsquo;re currently marked <strong>Out</strong>. When you reach the
              dorm, the <strong>dorm staff / security</strong> will mark you as
              returned — there&rsquo;s nothing to do here.
            </Alert>
          ) : (
            <p className="text-sm text-navy-500">
              Once you submit a Leave Pass you&rsquo;ll be marked <strong>Out</strong>.
              Your return is recorded by the <strong>dorm staff / security</strong>{" "}
              when you arrive back — students can&rsquo;t press return.
            </p>
          )}
        </Card>
      </div>

      {/* History */}
      <Card className="mt-6">
        <h2 className="mb-3 font-semibold text-navy-800">
          My passes ({passes.length})
        </h2>
        {passes.length === 0 ? (
          <p className="text-sm text-navy-400">No passes yet.</p>
        ) : (
          <ul className="space-y-3">
            {passes.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-navy-100 p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-navy-800">{r.destination}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 text-navy-500">
                  {formatDateTime(r.departureAt)} → {formatDateTime(r.returnAt)}
                  {r.actualReturnAt && (
                    <span className="text-emerald-600">
                      {" "}
                      · back {formatDateTime(r.actualReturnAt)}
                    </span>
                  )}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs">
                  {r.departureLat != null && r.departureLng != null && (
                    <a
                      href={mapLink(r.departureLat, r.departureLng)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-navy-500 hover:underline"
                    >
                      📍 Departure point
                    </a>
                  )}
                  {r.returnLat != null && r.returnLng != null && (
                    <a
                      href={mapLink(r.returnLat, r.returnLng)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-emerald-600 hover:underline"
                    >
                      📍 Return point
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
