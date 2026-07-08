import crypto from "crypto";

// Presence-anchor for self-service meal-coupon redemption.
//
// The cafeteria counter DISPLAYS a 6-digit code derived from the counter secret and a
// 30-second time bucket (TOTP-style). To redeem, a member types the code shown at the
// counter. Because it rotates every 30s and is computed server-side, a screenshot is
// stale within seconds and redemption proves the member is physically at the counter —
// exactly the "presence-anchored, zero-staff self-service" decision from the plan.

const BUCKET_MS = 30_000;

export function counterCode(secret: string, bucketOffset = 0): string {
  const bucket = Math.floor(Date.now() / BUCKET_MS) + bucketOffset;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(String(bucket))
    .digest("hex");
  const num = parseInt(digest.slice(0, 8), 16) % 1_000_000;
  return String(num).padStart(6, "0");
}

// Accept the current bucket and the previous one, so a code typed right on a rollover
// boundary still works.
export function isValidCounterCode(secret: string, code: string): boolean {
  const c = code.trim();
  return c === counterCode(secret, 0) || c === counterCode(secret, -1);
}

export function secondsUntilRotate(): number {
  return Math.ceil((BUCKET_MS - (Date.now() % BUCKET_MS)) / 1000);
}
