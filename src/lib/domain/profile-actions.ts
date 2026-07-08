"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";

export type ProfileState = { error?: string; ok?: string };

const schema = z.object({ allergyInfo: z.string().max(500) });

// Only ALLERGY is editable. Identity fields (name, campus ID, email) are a read-only
// projection from the campus directory — JIUnity never edits them locally.
export async function updateAllergyAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  if (!can(actor, "profile:updateAllergy", { ownerId: actor.id })) {
    return { error: "Not authorized." };
  }

  const parsed = schema.safeParse({ allergyInfo: formData.get("allergyInfo") ?? "" });
  if (!parsed.success) return { error: "Allergy note is too long." };

  await prisma.member.update({
    where: { id: actor.id },
    data: { allergyInfo: parsed.data.allergyInfo.trim() || null },
  });

  revalidatePath("/dashboard/profile");
  return { ok: "Allergy information updated." };
}
