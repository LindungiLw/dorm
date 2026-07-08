"use client";

import { useActionState } from "react";
import {
  activateCouponAction,
  redeemCouponAction,
  type CouponState,
} from "@/lib/domain/coupons-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { StatusBadge, Alert } from "@/components/ui";

type Coupon = { id: string; mealType: string; status: string };

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};
const MEAL_ICON: Record<string, string> = {
  BREAKFAST: "🥐",
  LUNCH: "🍛",
  DINNER: "🍜",
};

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const [activateState, activate] = useActionState<CouponState, FormData>(
    activateCouponAction,
    {},
  );
  const [redeemState, redeem] = useActionState<CouponState, FormData>(
    redeemCouponAction,
    {},
  );

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {MEAL_ICON[coupon.mealType]}
          </span>
          <span className="font-semibold text-navy-800">
            {MEAL_LABEL[coupon.mealType] ?? coupon.mealType}
          </span>
        </div>
        <StatusBadge status={coupon.status} />
      </div>

      {coupon.status === "ISSUED" && (
        <form action={activate} className="space-y-2">
          <input type="hidden" name="couponId" value={coupon.id} />
          {activateState.error && <Alert tone="error">{activateState.error}</Alert>}
          <p className="text-sm text-navy-500">
            Activate your coupon before heading to the counter.
          </p>
          <SubmitButton className="btn-gold w-full" pendingText="Activating…">
            Activate coupon
          </SubmitButton>
        </form>
      )}

      {coupon.status === "ACTIVE" && (
        <form action={redeem} className="space-y-2">
          <input type="hidden" name="couponId" value={coupon.id} />
          {redeemState.error && <Alert tone="error">{redeemState.error}</Alert>}
          {redeemState.ok && <Alert tone="success">{redeemState.ok}</Alert>}
          <label className="label" htmlFor={`code-${coupon.id}`}>
            Counter code
          </label>
          <input
            id={`code-${coupon.id}`}
            name="counterCode"
            inputMode="numeric"
            placeholder="6-digit code at the counter"
            className="input tracking-widest"
            autoComplete="off"
          />
          <SubmitButton className="btn-primary w-full" pendingText="Redeeming…">
            Redeem meal
          </SubmitButton>
        </form>
      )}

      {coupon.status === "REDEEMED" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          ✅ Redeemed — enjoy your meal.
        </p>
      )}

      {coupon.status === "EXPIRED" && (
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
          This coupon has expired.
        </p>
      )}
    </div>
  );
}
