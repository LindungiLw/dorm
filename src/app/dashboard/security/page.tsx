import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { hasRole } from "@/lib/authz/policy";
import { getOutRequests, getRecentReturns } from "@/lib/domain/permissions";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { formatDateTime, formatClock } from "@/lib/time";
import { ReturnButton } from "@/components/ReturnButton";
import { AutoRefresh } from "@/components/AutoRefresh";
import { MapPreview } from "@/components/MapPreview";

// Satpam kiosk: the ONE page a security account has. A live board of every student
// currently out, each with a Return button. No other menu is reachable.
export default async function SecurityMonitorPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  // Security accounts only — everyone else is bounced home silently.
  if (!hasRole(actor, "SECURITY")) redirect("/dashboard");

  const [out, returned] = await Promise.all([
    getOutRequests(),
    getRecentReturns(15),
  ]);

  return (
    <div>
      {/* Live board — refreshes on its own so new passes appear and returns drop off. */}
      <AutoRefresh seconds={10} />

      <PageHeader
        title="Security · Gate Monitor"
        subtitle="Students currently outside · mark them returned when they arrive back"
        icon="🛡️"
      />

      <h2 className="mb-3 font-semibold text-navy-800">
        Currently out ({out.length})
      </h2>
      {out.length === 0 ? (
        <Card>
          <p className="text-sm text-navy-400">Everyone is in. 🏠</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {out.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-navy-800">{r.member.fullName}</p>
                  <p className="text-xs text-navy-400">
                    {r.member.campusId} · Dorm {r.dormId.replace(/^DORM-/i, "")}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-2 text-sm text-navy-700">📍 {r.destination}</p>
              <p className="text-sm text-navy-500">
                Out {formatDateTime(r.departureAt)} · back by{" "}
                {formatDateTime(r.returnAt)}
              </p>
              {r.departureLat != null && r.departureLng != null && (
                <MapPreview
                  lat={r.departureLat}
                  lng={r.departureLng}
                  height={150}
                  className="mt-3"
                />
              )}
              <ReturnButton id={r.id} />
            </Card>
          ))}
        </div>
      )}

      {returned.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-semibold text-navy-800">Returned recently</h2>
          <Card>
            <ul className="divide-y divide-navy-50">
              {returned.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="text-navy-700">
                    {r.member.fullName} · {r.destination}
                  </span>
                  <span className="text-xs text-emerald-600">
                    {r.actualReturnAt ? `back ${formatClock(r.actualReturnAt)} WIB` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
