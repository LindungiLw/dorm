// Server-authoritative time helpers. Client clocks are never trusted for coupon
// validity or meal windows (per the security review, S1 / C1.4).

// The cafeteria serves lunch and dinner only.
export const MEAL_TYPES = ["LUNCH", "DINNER"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export function todayStr(d: Date = new Date()): string {
  // YYYY-MM-DD in the server's local zone (single-campus-timezone assumption).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// The meal window a given moment falls into (server-authoritative). Defaults the
// check-in station to "the meal happening now": lunch until 15:00, then dinner.
export function currentMealType(d: Date = new Date()): MealType {
  return d.getHours() < 15 ? "LUNCH" : "DINNER";
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

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
