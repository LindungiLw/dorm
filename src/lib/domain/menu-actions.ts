"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { writeAudit } from "@/lib/audit";
import { MEAL_TYPES } from "@/lib/time";

export type MenuState = { error?: string; ok?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MEALS = new Set<string>(MEAL_TYPES);

// Save the whole editable week in one submit. The form carries one field per cell named
// `items__<YYYY-MM-DD>__<MEALTYPE>`; each is upserted (or cleared if blank).
export async function saveMenuAction(
  _prev: MenuState,
  formData: FormData,
): Promise<MenuState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  // Role gate: only cafeteria staff may edit the menu (evaluated centrally).
  if (!can(actor, "cafeteria:manageMenu")) {
    return { error: "Only cafeteria staff can edit the menu." };
  }

  let changed = 0;
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("items__")) continue;
    const [, menuDate, mealType] = key.split("__");
    if (!menuDate || !DATE_RE.test(menuDate) || !MEALS.has(mealType)) continue;

    const items = String(value).trim().slice(0, 400);
    if (items) {
      await prisma.cafeteriaMenu.upsert({
        where: { menuDate_mealType: { menuDate, mealType } },
        create: { menuDate, mealType, items },
        update: { items },
      });
    } else {
      // Blank clears that meal for that day.
      await prisma.cafeteriaMenu.deleteMany({ where: { menuDate, mealType } });
    }
    changed++;
  }

  await writeAudit(actor, "cafeteria.menu.update", "CafeteriaMenu", "week", {
    cells: changed,
  });
  revalidatePath("/dashboard/cafeteria/menu");
  return { ok: "Menu saved." };
}
