import { getCurrentActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { logoutAction } from "@/lib/auth/actions";
import { IdentityForm } from "./IdentityForm";
import { ProfileAvatar } from "./ProfileAvatar";

function initialsOf(name: string): string {
  const words = name.replace(/[^A-Za-z ]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function statusLabel(memberType: string): string {
  if (memberType === "LECTURER") return "Lecturer";
  if (memberType === "STAFF" || memberType === "FACULTY") return "Staff";
  return "Student";
}

function roleLabelOf(roles: string[], memberType: string): string {
  if (roles.includes("ROOT")) return "Root";
  if (roles.includes("ACADEMIC_ADMIN")) return "Academic Admin";
  if (roles.includes("DORMITORY_ADMIN")) return "Dorm Admin";
  if (roles.includes("CAFETERIA_ADMIN")) return "Cafeteria Admin";
  if (roles.includes("MARKET_ADMIN")) return "Market Admin";
  return statusLabel(memberType);
}

export default async function ProfilePage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  // getCurrentActor already carries name/email/roles/memberType/dormId — only the extra
  // JIUnity-owned fields need loading.
  const extra = await prisma.member.findUnique({
    where: { id: actor.id },
    select: { campusId: true, photoUrl: true },
  });
  if (!extra) return null;

  const roleLabel = roleLabelOf(
    actor.roles.map((r) => r.role),
    actor.memberType,
  );

  return (
    <div>
      {/* Hero — profile photo + name/email/role */}
      <Card className="mb-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
          <ProfileAvatar
            initials={initialsOf(actor.fullName)}
            photoUrl={extra.photoUrl}
          />
          <div>
            <h1 className="text-xl font-bold text-navy-800">{actor.fullName}</h1>
            <p className="text-sm text-navy-500">{actor.email}</p>
            <span className="mt-1 inline-block rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
              {roleLabel}
            </span>
          </div>
        </div>
      </Card>

      {/* My profile — editable identity */}
      <Card>
        <h2 className="mb-3 font-semibold text-navy-800">My profile</h2>
        <IdentityForm
          campusId={extra.campusId}
          memberType={actor.memberType}
          dormId={actor.dormId}
        />
      </Card>

      {/* Sign out — at the very bottom */}
      <div className="mt-8 flex justify-center">
        <form action={logoutAction}>
          <button type="submit" className="btn-outline w-full sm:w-auto">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
