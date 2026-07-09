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

  const parsed = entrySchema.safeParse({ food: formData.get("food") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  // `allergens` column stays (NOT NULL) but is unused now; store an empty string.
  const created = await prisma.allergenEntry.create({
    data: { food: parsed.data.food, allergens: "" },
  });
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
  const parsed = entrySchema.safeParse({ food: formData.get("food") });
  if (!id) return { error: "Missing entry id." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  await prisma.allergenEntry.update({
    where: { id },
    data: { food: parsed.data.food },
  });
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

// ── Student: save my own food choices ────────────────────────────────────────────────
// A map of AllergenEntry id -> "safe" | "avoid". Only the foods currently on the list are
// kept, so choices for deleted foods are pruned as members re-save.
const choiceSchema = z.record(z.string(), z.enum(["safe", "avoid"]));

export async function saveFoodChoicesAction(choicesJson: string): Promise<AllergyState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };
  // Saving your own choices is an ownership action (your profile, your data).
  if (!can(actor, "profile:updateAllergy", { ownerId: actor.id })) {
    return { error: "You can't save choices right now." };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(choicesJson);
  } catch {
    return { error: "Couldn't read your choices. Please try again." };
  }
  const parsed = choiceSchema.safeParse(raw);
  if (!parsed.success) return { error: "Those choices look invalid." };

  // Drop any ids that are no longer on the cafeteria's list.
  const live = await prisma.allergenEntry.findMany({ select: { id: true } });
  const liveIds = new Set(live.map((e) => e.id));
  const clean: Record<string, "safe" | "avoid"> = {};
  for (const [id, val] of Object.entries(parsed.data)) {
    if (liveIds.has(id)) clean[id] = val;
  }

  await prisma.member.update({
    where: { id: actor.id },
    data: { foodChoices: JSON.stringify(clean) },
  });
  revalidatePath("/dashboard/cafeteria/allergy");
  return { ok: "Your choices are saved." };
}
