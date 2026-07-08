"use client";

import { useActionState, useState } from "react";
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
];
const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r;

function GrantForm() {
  const [state, action] = useActionState<RootState, FormData>(grantRoleAction, {});
  const [role, setRole] = useState("CAFETERIA_ADMIN");

  return (
    <form
      action={action}
      className="rounded-xl border border-dashed border-navy-200 bg-navy-50/40 p-4"
    >
      <p className="mb-1 text-sm font-semibold text-navy-800">Grant admin access</p>
      <p className="mb-3 text-xs text-navy-400">
        The person must have signed in at least once first.
      </p>
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          name="email"
          type="email"
          required
          placeholder="person@jiu.ac"
          className="input text-sm sm:flex-1"
        />
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input text-sm sm:w-44"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {role === "DORMITORY_ADMIN" && (
          <select name="dormId" className="input text-sm sm:w-32" defaultValue="DORM-A">
            <option value="DORM-A">DORM-A</option>
            <option value="DORM-B">DORM-B</option>
          </select>
        )}
        <SubmitButton className="btn-primary shrink-0" pendingText="Granting…">
          Grant
        </SubmitButton>
      </div>
    </form>
  );
}

function AdminRowItem({ admin }: { admin: AdminRow }) {
  const [state, action] = useActionState<RootState, FormData>(revokeRoleAction, {});
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-navy-800">{admin.fullName}</p>
        <p className="text-xs text-navy-400">{admin.email}</p>
        {state.error && (
          <p className="mt-1 text-xs text-red-600">{state.error}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
          {roleLabel(admin.role)}
          {admin.scopeId ? ` · ${admin.scopeId}` : ""}
        </span>
        <form action={action}>
          <input type="hidden" name="memberId" value={admin.memberId} />
          <input type="hidden" name="role" value={admin.role} />
          <SubmitButton
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            pendingText="…"
          >
            Revoke
          </SubmitButton>
        </form>
      </div>
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
            No module admins yet — grant one above.
          </p>
        ) : (
          <ul className="divide-y divide-navy-50">
            {admins.map((a) => (
              <AdminRowItem key={a.assignmentId} admin={a} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
