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
const FIELD_RE = /^(items|ingredients)__(\d{4}-\d{2}-\d{2})__([A-Z]+)$/;

// Save the whole editable menu in one submit. Each cell carries two fields:
// `items__<date>__<MEAL>` (the dish) and `ingredients__<date>__<MEAL>`. A cell with
// neither is cleared.
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

  // Collect both fields per (date, meal) before writing.
  const cells = new Map<string, { menuDate: string; mealType: string; items: string; ingredients: string }>();
  for (const [key, value] of formData.entries()) {
    const m = FIELD_RE.exec(key);
    if (!m) continue;
    const [, field, menuDate, mealType] = m;
    if (!DATE_RE.test(menuDate) || !MEALS.has(mealType)) continue;
    const k = `${menuDate}|${mealType}`;
    const cell = cells.get(k) ?? { menuDate, mealType, items: "", ingredients: "" };
    cell[field as "items" | "ingredients"] = String(value).trim().slice(0, 400);
    cells.set(k, cell);
  }

  for (const c of cells.values()) {
    if (c.items || c.ingredients) {
      await prisma.cafeteriaMenu.upsert({
        where: { menuDate_mealType: { menuDate: c.menuDate, mealType: c.mealType } },
        create: {
          menuDate: c.menuDate,
          mealType: c.mealType,
          items: c.items,
          ingredients: c.ingredients || null,
        },
        update: { items: c.items, ingredients: c.ingredients || null },
      });
    } else {
      // Both blank clears that meal for that day.
      await prisma.cafeteriaMenu.deleteMany({
        where: { menuDate: c.menuDate, mealType: c.mealType },
      });
    }
  }

  await writeAudit(actor, "cafeteria.menu.update", "CafeteriaMenu", "week", {
    cells: cells.size,
  });
  revalidatePath("/dashboard/cafeteria/menu");
  return { ok: "Menu saved." };
}
