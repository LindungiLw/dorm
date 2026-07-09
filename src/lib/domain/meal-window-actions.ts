"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { writeAudit } from "@/lib/audit";
import { MEAL_TYPES, mealLabel, hhmmToMin } from "@/lib/time";

export type WindowState = { error?: string; ok?: string };

// Cafeteria admin sets the check-in window for a meal (stored as campus-local minutes).
export async function setMealWindowAction(
  _prev: WindowState,
  formData: FormData,
): Promise<WindowState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };
  if (!can(actor, "cafeteria:manageMenu")) {
    return { error: "Only cafeteria staff can change the check-in window." };
  }

  const mealType = String(formData.get("mealType") ?? "");
  if (!(MEAL_TYPES as readonly string[]).includes(mealType)) {
    return { error: "Pick a valid meal." };
  }

  const startMin = hhmmToMin(String(formData.get("start") ?? ""));
  const endMin = hhmmToMin(String(formData.get("end") ?? ""));
  if (startMin === null || endMin === null) {
    return { error: "Enter valid open and close times." };
  }
  if (endMin <= startMin) {
    return { error: "The close time must be after the open time." };
  }

  await prisma.mealWindow.upsert({
    where: { mealType },
    create: { mealType, startMin, endMin },
    update: { startMin, endMin },
  });
  await writeAudit(actor, "cafeteria.window.set", "MealWindow", mealType, {
    startMin,
    endMin,
  });
  revalidatePath("/dashboard/cafeteria");
  revalidatePath("/dashboard/cafeteria/checkin");
  return { ok: `${mealLabel(mealType)} window saved.` };
}
