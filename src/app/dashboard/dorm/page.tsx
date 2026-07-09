import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { hasRole, scopesFor } from "@/lib/authz/policy";
import { getDormRequests } from "@/lib/domain/permissions";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/time";
import { ReturnButton } from "@/components/ReturnButton";
import { AutoRefresh } from "@/components/AutoRefresh";
import { MapPreview } from "@/components/MapPreview";

export default async function DormAdminPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  // Dorm admins only — others are bounced home silently.
  if (!hasRole(actor, "DORMITORY_ADMIN")) redirect("/dashboard");

  const scopeIds = scopesFor(actor, "DORMITORY_ADMIN");
  const requests = await getDormRequests(scopeIds);
  // A returned pass is deleted on return to keep the table lean, so this is only who is out.
  const out = requests.filter((r) => r.status === "OUT");

  return (
    <div>
      <AutoRefresh seconds={12} />
      <PageHeader
        title="Dorm Access Monitor"
        subtitle={`Scope: ${scopeIds.filter(Boolean).join(", ") || "—"}`}
        icon="🗂️"
      />

      <div className="mb-5">
        <Link
          href="/dashboard/permission/borrow/manage"
          className="btn-outline text-sm"
        >
          Manage borrow items
        </Link>
      </div>

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
                {formatDateTime(r.departureAt)} → {formatDateTime(r.returnAt)}
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
    </div>
  );
}
