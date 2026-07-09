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
  const latest = passes[0]; // newest first
  const isOut = latest?.status === "OUT";
  const justReturned = latest?.status === "RETURNED";

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

        {/* Coming back — the return is recorded by security / dorm staff, not the student */}
        <Card>
          <h2 className="mb-3 font-semibold text-navy-800">Coming back</h2>
          {isOut ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                </span>
                <p className="font-semibold text-amber-800">Still outside</p>
              </div>
              <p className="mt-2 text-sm text-amber-700">
                You are still outside. The <strong>security (satpam)</strong> or{" "}
                <strong>dorm staff</strong> will mark you returned once you arrive back
                at campus.
              </p>
              {latest?.destination && (
                <p className="mt-2 text-xs text-amber-600">
                  📍 {latest.destination} · back by {formatDateTime(latest.returnAt)}
                </p>
              )}
            </div>
          ) : justReturned ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7 text-emerald-600"
                  aria-hidden
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p className="mt-3 font-bold text-emerald-800">Back at campus</p>
              <p className="text-sm text-emerald-700">Welcome back!</p>
              {latest?.actualReturnAt && (
                <p className="mt-1 text-xs text-emerald-600">
                  Marked returned {formatDateTime(latest.actualReturnAt)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-navy-500">
              Submit a Leave Pass and you will be marked <strong>Out</strong>. Your return
              is recorded by the <strong>security (satpam)</strong> or{" "}
              <strong>dorm staff</strong> when you arrive back. Students can&rsquo;t press
              return.
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
