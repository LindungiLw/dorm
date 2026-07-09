"use client";

import { useActionState, useState } from "react";
import { revokeSellerAction, type SellerState } from "@/lib/domain/seller-actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { ApprovedSeller } from "@/lib/domain/seller";

function SellerRow({ s }: { s: ApprovedSeller }) {
  const [state, action] = useActionState<SellerState, FormData>(
    revokeSellerAction,
    {},
  );
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="rounded-xl border border-navy-100 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-navy-800">{s.storeName}</p>
          <p className="truncate text-xs text-navy-500">
            {s.member?.fullName ?? "Unknown"}
            {s.member?.campusId ? ` · ${s.member.campusId}` : ""}
          </p>
          <p className="truncate text-xs text-navy-400">
            {s.productCount} product{s.productCount === 1 ? "" : "s"} · {s.phone}
          </p>
        </div>
        <form
          action={action}
          className="shrink-0"
          onSubmit={(e) => {
            // First tap arms the confirm; the second tap actually revokes.
            if (!confirming) {
              e.preventDefault();
              setConfirming(true);
            }
          }}
        >
          <input type="hidden" name="memberId" value={s.memberId} />
          <SubmitButton
            className={`w-full rounded-lg border px-3 py-1.5 text-sm font-medium sm:w-auto ${
              confirming
                ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                : "border-red-200 text-red-600 hover:bg-red-50"
            }`}
            pendingText="Revoking…"
          >
            {confirming ? "Confirm revoke?" : "Revoke access"}
          </SubmitButton>
        </form>
      </div>
      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
    </li>
  );
}

export function SellerManage({ sellers }: { sellers: ApprovedSeller[] }) {
  if (sellers.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-navy-400">
        No active sellers yet. Approved sellers appear here.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {sellers.map((s) => (
        <SellerRow key={s.memberId} s={s} />
      ))}
    </ul>
  );
}
