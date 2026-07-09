import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { hasRole } from "@/lib/authz/policy";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/ui";
import { formatDateTime } from "@/lib/time";

export default async function AcademicAdminPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  // Academic admins only — others are bounced home silently.
  if (!hasRole(actor, "ACADEMIC_ADMIN")) redirect("/dashboard");

  const [students, faculty, suspended, exitTotal, redemptions, audit] =
    await Promise.all([
      prisma.member.count({ where: { memberType: "STUDENT" } }),
      prisma.member.count({ where: { memberType: "FACULTY" } }),
      prisma.member.count({ where: { status: "SUSPENDED" } }),
      prisma.exitRequest.count(),
      prisma.redemption.count(),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    ]);

  const stats = [
    { label: "Students", value: students },
    { label: "Faculty", value: faculty },
    { label: "Suspended", value: suspended },
    { label: "Exit requests", value: exitTotal },
    { label: "Meals redeemed", value: redemptions },
  ];

  return (
    <div>
      <PageHeader
        title="Academic Administration"
        subtitle="Campus-wide monitoring & reporting"
        icon="📊"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="text-center">
            <p className="text-3xl font-bold text-navy-700">{s.value}</p>
            <p className="mt-1 text-xs text-navy-400">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-semibold text-navy-800">
          Audit trail
          <span className="ml-2 text-xs font-normal text-navy-400">
            (append-only; privileged & value-affecting actions)
          </span>
        </h2>
        <Card>
          {audit.length === 0 ? (
            <p className="text-sm text-navy-400">
              No audit entries yet — approve a request or redeem a meal to generate one.
            </p>
          ) : (
            <ul className="divide-y divide-navy-50">
              {audit.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span>
                    <span className="font-mono text-xs text-navy-500">
                      {a.action}
                    </span>{" "}
                    <span className="text-navy-700">by {a.actorName}</span>
                  </span>
                  <span className="text-xs text-navy-400">
                    {a.targetType} · {formatDateTime(a.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
