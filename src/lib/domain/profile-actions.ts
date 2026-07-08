"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";

export type ProfileState = { error?: string; ok?: string };

const allergySchema = z.object({ allergyInfo: z.string().max(500) });

// A member's own allergy note (matched against the cafeteria's allergen alerts).
export async function updateAllergyAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  if (!can(actor, "profile:updateAllergy", { ownerId: actor.id })) {
    return { error: "Not authorized." };
  }

  const parsed = allergySchema.safeParse({ allergyInfo: formData.get("allergyInfo") ?? "" });
  if (!parsed.success) return { error: "Allergy note is too long." };

  await prisma.member.update({
    where: { id: actor.id },
    data: { allergyInfo: parsed.data.allergyInfo.trim() || null },
  });

  revalidatePath("/dashboard/profile");
  return { ok: "Saved." };
}

const identitySchema = z.object({
  campusId: z.string().trim().min(1, "Enter your ID.").max(40),
  memberType: z.enum(["STUDENT", "LECTURER", "STAFF"]),
});

// The Status option shown as the select's default for a stored member type. Must match
// IdentityForm.statusValue so an *unchanged* dropdown round-trips to "no change".
function memberStatusDefault(memberType: string): string {
  if (memberType === "LECTURER") return "LECTURER";
  if (memberType === "STAFF" || memberType === "FACULTY") return "STAFF";
  return "STUDENT";
}

// The member's own Student ID (NIM) + status. Student ID is unique across members.
export async function updateIdentityAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  if (!can(actor, "profile:updateIdentity", { ownerId: actor.id })) {
    return { error: "Not authorized." };
  }

  const parsed = identitySchema.safeParse({
    campusId: formData.get("campusId"),
    memberType: formData.get("memberType"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  // Only change the status when the user actually moved the dropdown off its default,
  // so a NIM-only save never silently clobbers a stored value (e.g. a legacy FACULTY
  // member being reclassified to STAFF and dropping the faculty headcount).
  const changedStatus = parsed.data.memberType !== memberStatusDefault(actor.memberType);
  const data = changedStatus
    ? { campusId: parsed.data.campusId, memberType: parsed.data.memberType }
    : { campusId: parsed.data.campusId };

  try {
    await prisma.member.update({ where: { id: actor.id }, data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "That Student ID is already taken by another member." };
    }
    throw e;
  }

  revalidatePath("/dashboard/profile");
  return { ok: "Profile updated." };
}

// Profile photo, saved as a small data URL (resized client-side). "__REMOVE__" clears it.
const PHOTO_MAX_CHARS = 500_000; // ~370 KB of base64 — plenty for a 256px avatar.

export async function updatePhotoAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };

  if (!can(actor, "profile:updatePhoto", { ownerId: actor.id })) {
    return { error: "Not authorized." };
  }

  const photo = String(formData.get("photo") ?? "");

  if (photo === "__REMOVE__") {
    await prisma.member.update({ where: { id: actor.id }, data: { photoUrl: null } });
    revalidatePath("/dashboard/profile");
    return { ok: "Photo removed." };
  }

  if (!photo.startsWith("data:image/")) {
    return { error: "Please choose a valid image." };
  }
  if (photo.length > PHOTO_MAX_CHARS) {
    return { error: "Image is too large — try a smaller photo." };
  }

  await prisma.member.update({ where: { id: actor.id }, data: { photoUrl: photo } });
  revalidatePath("/dashboard/profile");
  return { ok: "Photo updated." };
}
