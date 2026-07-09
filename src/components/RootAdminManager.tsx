"use client";

import { useActionState } from "react";
import {
  grantRoleAction,
  revokeRoleAction,
  type RootState,
} from "@/lib/domain/root-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import type { AdminRow } from "@/lib/domain/admins";

// Inlined (client-safe) copy of the managed roles — the server list in admins.ts pulls
// in Prisma, so it can't be imported into a client component.
const ROLES = [
  { value: "CAFETERIA_ADMIN", label: "Cafeteria admin" },
  { value: "DORMITORY_ADMIN", label: "Dorm admin" },
  { value: "MARKET_ADMIN", label: "Market admin" },
  { value: "SECURITY", label: "Security (Satpam)" },
];
const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r;

function GrantForm() {
  const [state, action] = useActionState<RootState, FormData>(grantRoleAction, {});

  return (
    <form
      action={action}
      className="rounded-xl border border-dashed border-navy-200 bg-navy-50/40 p-4"
    >
      <p className="mb-3 text-sm font-semibold text-navy-800">Grant admin access</p>
      {state.error && (
        <div className="mb-2">
          <Alert tone="error">{state.error}</Alert>
        </div>
      )}
      {state.ok && (
        <div className="mb-2">
          <Alert tone="success">{state.ok}</Alert>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="label" htmlFor="grant-email">
            Admin email
          </label>
          <input
            id="grant-email"
            name="email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder="e.g. jiupoem2026@jiu.ac"
            className="input text-base sm:text-sm"
          />
          <p className="mt-1 text-xs text-navy-400">
            They must have signed in at least once.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="grant-role">
            Role
          </label>
          <select
            id="grant-role"
            name="role"
            defaultValue="CAFETERIA_ADMIN"
            className="input"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <SubmitButton
          className="btn-primary w-full sm:w-auto sm:px-8"
          pendingText="Granting…"
        >
          Grant access
        </SubmitButton>
      </div>
    </form>
  );
}

function AdminRowItem({ admin }: { admin: AdminRow }) {
  const [state, action] = useActionState<RootState, FormData>(revokeRoleAction, {});
  // Only one dorm exists, so a dorm admin shows no scope suffix.
  const scope =
    admin.scopeId && admin.role !== "DORMITORY_ADMIN"
      ? admin.scopeId.replace(/-/g, " ")
      : "";
  return (
    <li className="rounded-xl border border-navy-100 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-navy-800">
            {admin.fullName}
          </p>
          <p className="truncate text-xs text-navy-400">{admin.email}</p>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="rounded-full bg-navy-100 px-2.5 py-1 text-xs font-semibold text-navy-700">
            {roleLabel(admin.role)}
            {scope ? ` · ${scope}` : ""}
          </span>
          <form action={action}>
            <input type="hidden" name="memberId" value={admin.memberId} />
            <input type="hidden" name="role" value={admin.role} />
            <SubmitButton
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              pendingText="Revoking…"
            >
              Revoke
            </SubmitButton>
          </form>
        </div>
      </div>
      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
    </li>
  );
}

export function RootAdminManager({ admins }: { admins: AdminRow[] }) {
  return (
    <div className="space-y-5">
      <GrantForm />
      <div>
        <p className="mb-1 text-sm font-semibold text-navy-800">
          Current module admins ({admins.length})
        </p>
        {admins.length === 0 ? (
          <p className="py-2 text-sm text-navy-400">
            No module admins yet. Grant one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {admins.map((a) => (
              <AdminRowItem key={a.assignmentId} admin={a} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
