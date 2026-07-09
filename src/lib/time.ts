// Server-authoritative time helpers. Client clocks are never trusted for coupon
// validity or meal windows (per the security review, S1 / C1.4).
//
// Times are anchored to the CAMPUS timezone (WIB / Asia/Jakarta) so windows and dates
// are correct regardless of where the server runs (Vercel functions run in UTC/US).

export const CAMPUS_TZ = "Asia/Jakarta";

// The cafeteria serves lunch and dinner only.
export const MEAL_TYPES = ["LUNCH", "DINNER"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

// Operating window per meal (campus-local, minutes since midnight).
export const MEAL_WINDOWS: Record<
  MealType,
  { start: string; end: string; startMin: number; endMin: number }
> = {
  LUNCH: { start: "12:00", end: "13:00", startMin: 12 * 60, endMin: 13 * 60 },
  DINNER: { start: "18:00", end: "19:00", startMin: 18 * 60, endMin: 19 * 60 },
};

// Break a Date into campus-local (WIB) parts.
function campusParts(d: Date): { date: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAMPUS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const v = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${v("year")}-${v("month")}-${v("day")}`,
    hour: Number(v("hour")) % 24,
    minute: Number(v("minute")),
  };
}

export function todayStr(d: Date = new Date()): string {
  return campusParts(d).date;
}

// Campus-local minutes since midnight — used to gate the check-in window server-side.
export function nowCampusMinutes(d: Date = new Date()): number {
  const p = campusParts(d);
  return p.hour * 60 + p.minute;
}

// The meal window a given moment falls into: lunch until 15:00 (campus time), then dinner.
export function currentMealType(d: Date = new Date()): MealType {
  return campusParts(d).hour < 15 ? "LUNCH" : "DINNER";
}

export function isWithinMealWindow(mealType: MealType, minutes: number): boolean {
  const w = MEAL_WINDOWS[mealType];
  return minutes >= w.startMin && minutes < w.endMin;
}

// Parse a `datetime-local` value ("YYYY-MM-DDTHH:mm") as CAMPUS (WIB) wall time into a
// real UTC Date. WIB is a fixed UTC+7 offset (no DST), so a student entering "20:00" gets
// stored as the correct instant and displays back as 20:00 via formatDateTime.
export function parseCampusLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(s).trim());
  if (!m) return null;
  const utcMs =
    Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - 7 * 60 * 60 * 1000;
  const d = new Date(utcMs);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function mealLabel(t: string): string {
  switch (t) {
    case "BREAKFAST":
      return "Breakfast";
    case "LUNCH":
      return "Lunch";
    case "DINNER":
      return "Dinner";
    default:
      return t;
  }
}

// Clock time only ("HH:MM"), anchored to campus time (WIB) regardless of device tz.
export function formatClock(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-GB", {
    timeZone: CAMPUS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    timeZone: CAMPUS_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
