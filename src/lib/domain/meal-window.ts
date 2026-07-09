import { prisma } from "@/lib/db";
import {
  MEAL_TYPES,
  MEAL_WINDOWS,
  minToHHMM,
  type MealType,
  type MealWindows,
} from "@/lib/time";

// The effective check-in windows: the admin-configured rows from the DB, falling back to
// the code defaults (MEAL_WINDOWS) for any meal that has not been customised. Any DB error
// (e.g. the table not existing yet) safely yields the defaults.
export async function getMealWindows(): Promise<MealWindows> {
  const result = {} as MealWindows;
  for (const m of MEAL_TYPES) {
    const d = MEAL_WINDOWS[m];
    result[m] = { startMin: d.startMin, endMin: d.endMin, start: d.start, end: d.end };
  }
  try {
    const rows = await prisma.mealWindow.findMany();
    for (const r of rows) {
      if ((MEAL_TYPES as readonly string[]).includes(r.mealType)) {
        result[r.mealType as MealType] = {
          startMin: r.startMin,
          endMin: r.endMin,
          start: minToHHMM(r.startMin),
          end: minToHHMM(r.endMin),
        };
      }
    }
  } catch {
    /* table not ready or DB blip — defaults already populated above */
  }
  return result;
}
