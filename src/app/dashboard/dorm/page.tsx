import { getCurrentActor } from "@/lib/auth/session";
import { hasRole, scopesFor } from "@/lib/authz/policy";
import { getDormRequests } from "@/lib/domain/permissions";
import { PageHeader, Card, StatusBadge, Alert } from "@/components/ui";
import { formatDateTime } from "@/lib/time";

function mapLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export default async function DormAdminPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  if (!hasRole(actor, "DORMITORY_ADMIN")) {
    return (
      <div>
        <PageHeader title="Dorm Access" icon="🗂️" />
        <Alert tone="info">This area is for dormitory administrators.</Alert>
      </div>
    );
  }

  const scopeIds = scopesFor(actor, "DORMITORY_ADMIN");
  const requests = await getDormRequests(scopeIds);
  const out = requests.filter((r) => r.status === "OUT");
  const returned = requests.filter((r) => r.status === "RETURNED");

  return (
    <div>
      <PageHeader
        title="Dorm Access Monitor"
        subtitle={`Scope: ${scopeIds.filter(Boolean).join(", ") || "—"}`}
        icon="🗂️"
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
                    {r.member.campusId} · Dorm {r.dormId}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-2 text-sm text-navy-700">📍 {r.destination}</p>
              <p className="text-sm text-navy-500">
                {formatDateTime(r.departureAt)} → {formatDateTime(r.returnAt)}
              </p>
              {r.departureLat != null && r.departureLng != null && (
                <a
                  href={mapLink(r.departureLat, r.departureLng)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs font-medium text-navy-500 hover:underline"
                >
                  📍 Departure point
                </a>
              )}
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
                  <span className="text-xs text-navy-400">
                    {r.actualReturnAt ? `back ${formatDateTime(r.actualReturnAt)}` : ""}
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
