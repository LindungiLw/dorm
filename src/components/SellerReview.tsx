"use client";

import { useActionState } from "react";
import { decideSellerAction, type SellerState } from "@/lib/domain/seller-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import type { PendingRequest } from "@/lib/domain/seller";

function RequestRow({ r }: { r: PendingRequest }) {
  const [state, action] = useActionState<SellerState, FormData>(
    decideSellerAction,
    {},
  );
  return (
    <div className="rounded-xl border border-navy-100 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-navy-800">{r.storeName}</p>
          <p className="text-sm text-navy-500">
            {r.member?.fullName ?? "Unknown"}
            {r.member?.campusId ? ` · ${r.member.campusId}` : ""}
          </p>
          <p className="text-xs text-navy-400">{r.member?.email}</p>
          <dl className="mt-2 space-y-0.5 text-sm">
            <div className="flex gap-2">
              <dt className="text-navy-400">Contact:</dt>
              <dd className="text-navy-700">{r.phone}</dd>
            </div>
            {r.qrisNumber && (
              <div className="flex gap-2">
                <dt className="text-navy-400">QRIS no.:</dt>
                <dd className="text-navy-700">{r.qrisNumber}</dd>
              </div>
            )}
          </dl>
        </div>
        {r.qrisImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.qrisImage}
            alt="QRIS"
            className="h-24 w-24 shrink-0 rounded-lg border border-navy-100 object-contain"
          />
        )}
      </div>

      {state.error && (
        <div className="mt-3">
          <Alert tone="error">{state.error}</Alert>
        </div>
      )}
      {state.ok ? (
        <div className="mt-3">
          <Alert tone="success">{state.ok}</Alert>
        </div>
      ) : (
        <form action={action} className="mt-3 flex gap-2">
          <input type="hidden" name="memberId" value={r.memberId} />
          <SubmitButton
            name="decision"
            value="APPROVED"
            className="btn-primary text-sm"
            pendingText="…"
          >
            Approve
          </SubmitButton>
          <SubmitButton
            name="decision"
            value="REJECTED"
            className="rounded-lg border border-red-200 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            pendingText="…"
          >
            Reject
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

export function SellerReview({ requests }: { requests: PendingRequest[] }) {
  if (requests.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-navy-400">
        No pending seller requests.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <RequestRow key={r.memberId} r={r} />
      ))}
    </div>
  );
}
