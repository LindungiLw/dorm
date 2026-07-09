// Identity is set once at onboarding and locked, so this is a read-only display.
function statusLabel(memberType: string): string {
  if (memberType === "LECTURER") return "Lecturer";
  if (memberType === "STAFF" || memberType === "FACULTY") return "Staff";
  return "Student";
}

export function IdentityForm({
  campusId,
  memberType,
  dormId,
}: {
  campusId: string;
  memberType: string;
  dormId: string | null;
}) {
  const isStudent = memberType === "STUDENT";
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-navy-400">
          {isStudent ? "Student number (NIM)" : "Staff / Lecturer number"}
        </dt>
        <dd className="font-semibold text-navy-800">{campusId}</dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-navy-400">Status</dt>
        <dd className="font-semibold text-navy-800">{statusLabel(memberType)}</dd>
      </div>
      {isStudent && (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-navy-400">Dormitory</dt>
          <dd className="font-semibold text-navy-800">{dormId ?? "None"}</dd>
        </div>
      )}
      <p className="border-t border-navy-50 pt-3 text-xs text-navy-400">
        Your ID is locked. Contact an admin if it needs a correction.
      </p>
    </dl>
  );
}
