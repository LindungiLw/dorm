"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { writeAudit } from "@/lib/audit";

export type AllergyState = { error?: string; ok?: string };

const entrySchema = z.object({
  food: z.string().trim().min(1, "Enter a food name.").max(120),
  allergens: z.string().trim().min(1, "List the allergens.").max(200),
});

async function requireCafeteriaAdmin() {
  const actor = await getCurrentActor();
  if (!actor) return { actor: null, error: "Your session has expired. Please sign in again." };
  if (!can(actor, "cafeteria:manageAllergens")) {
    return { actor: null, error: "Only cafeteria staff can edit the allergen list." };
  }
  return { actor, error: undefined };
}

// Add a new dish + its allergens to the list.
export async function addAllergenAction(
  _prev: AllergyState,
  formData: FormData,
): Promise<AllergyState> {
  const { actor, error } = await requireCafeteriaAdmin();
  if (!actor) return { error };

  const parsed = entrySchema.safeParse({
    food: formData.get("food"),
    allergens: formData.get("allergens"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const created = await prisma.allergenEntry.create({ data: parsed.data });
  await writeAudit(actor, "cafeteria.allergen.add", "AllergenEntry", created.id, parsed.data);
  revalidatePath("/dashboard/cafeteria/allergy");
  return { ok: `Added "${parsed.data.food}".` };
}

// Edit an existing entry.
export async function updateAllergenAction(
  _prev: AllergyState,
  formData: FormData,
): Promise<AllergyState> {
  const { actor, error } = await requireCafeteriaAdmin();
  if (!actor) return { error };

  const id = String(formData.get("id") ?? "");
  const parsed = entrySchema.safeParse({
    food: formData.get("food"),
    allergens: formData.get("allergens"),
  });
  if (!id) return { error: "Missing entry id." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  await prisma.allergenEntry.update({ where: { id }, data: parsed.data });
  await writeAudit(actor, "cafeteria.allergen.update", "AllergenEntry", id, parsed.data);
  revalidatePath("/dashboard/cafeteria/allergy");
  return { ok: "Saved." };
}

// Remove an entry.
export async function deleteAllergenAction(
  _prev: AllergyState,
  formData: FormData,
): Promise<AllergyState> {
  const { actor, error } = await requireCafeteriaAdmin();
  if (!actor) return { error };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing entry id." };

  await prisma.allergenEntry.deleteMany({ where: { id } });
  await writeAudit(actor, "cafeteria.allergen.delete", "AllergenEntry", id);
  revalidatePath("/dashboard/cafeteria/allergy");
  return { ok: "Removed." };
}
