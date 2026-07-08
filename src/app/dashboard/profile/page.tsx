import { getCurrentActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { logoutAction } from "@/lib/auth/actions";
import { AllergyForm } from "./AllergyForm";

function initialsOf(name: string): string {
  const words = name.replace(/[^A-Za-z ]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function roleLabelOf(roles: string[], memberType: string): string {
  if (roles.includes("ACADEMIC_ADMIN")) return "Academic Admin";
  if (roles.includes("DORMITORY_ADMIN")) return "Dorm Admin";
  if (roles.includes("CAFETERIA_ADMIN")) return "Cafeteria Admin";
  return memberType === "FACULTY" ? "Faculty" : "Student";
}

export default async function ProfilePage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  const member = await prisma.member.findUnique({
    where: { id: actor.id },
    include: { roleAssignments: true },
  });
  if (!member) return null;

  const roles = member.roleAssignments.map((r) => r.role);
  const roleLabel = roleLabelOf(roles, member.memberType);

  const identity: { label: string; value: string }[] = [
    {
      label: member.memberType === "FACULTY" ? "Staff ID" : "Student ID (NIM)",
      value: member.campusId,
    },
    { label: "Member type", value: member.memberType },
    { label: "Dormitory", value: member.dormId ?? "—" },
    { label: "Account status", value: member.status },
  ];

  return (
    <div>
      {/* User profile hero — this is where signing out lives now */}
      <Card className="mb-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-600 text-xl font-bold text-white">
              {initialsOf(member.fullName)}
            </span>
            <div>
              <h1 className="text-xl font-bold text-navy-800">{member.fullName}</h1>
              <p className="text-sm text-navy-500">{member.email}</p>
              <span className="mt-1 inline-block rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
                {roleLabel}
              </span>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn-outline">
              Sign out
            </button>
          </form>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-navy-800">Identity</h2>
            <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs text-navy-500">
              read-only · synced from campus directory
            </span>
          </div>
          <dl className="divide-y divide-navy-50">
            {identity.map((row) => (
              <div key={row.label} className="flex justify-between py-2 text-sm">
                <dt className="text-navy-400">{row.label}</dt>
                <dd className="font-medium text-navy-800">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {member.roleAssignments.map((r) => (
              <span
                key={r.id}
                className="rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-700"
              >
                {r.role}
                {r.scopeId ? ` · ${r.scopeId}` : ""}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-navy-800">Allergy information</h2>
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-navy-600">
              you own this · sensitive
            </span>
          </div>
          <p className="mb-4 text-sm text-navy-500">
            This is the one field you can edit — identity fields come from the campus
            directory. Allergy data is sensitive and access is need-to-know.
          </p>
          <AllergyForm initial={member.allergyInfo ?? ""} />
        </Card>
      </div>
    </div>
  );
}
