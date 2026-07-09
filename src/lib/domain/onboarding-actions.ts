"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth/session";

export type OnboardingState = { error?: string };

const STAFF_DOMAIN = "k-eduplex.net";

const schema = z.object({
  campusId: z.string().trim().min(1, "Enter your ID.").max(40),
  memberType: z.enum(["STUDENT", "STAFF", "LECTURER"]),
});

// First-login onboarding: the member confirms their real ID (and, for staff, their exact
// status). The ID is unique and locked afterwards.
export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Your session has expired. Please sign in again." };
  if (actor.idConfirmed) redirect("/dashboard");

  if (formData.get("confirm") !== "on") {
    return { error: "Please confirm your ID is correct. It cannot be changed later." };
  }

  const parsed = schema.safeParse({
    campusId: formData.get("campusId"),
    memberType: formData.get("memberType"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  // The domain fixes the persona: the staff domain may pick Staff or Lecturer; every other
  // domain is a dorm-resident student.
  const isStaff = actor.email.endsWith(`@${STAFF_DOMAIN}`);
  const memberType = isStaff
    ? parsed.data.memberType === "LECTURER"
      ? "LECTURER"
      : "STAFF"
    : "STUDENT";
  const dormId = memberType === "STUDENT" ? "DORM-A" : null;

  try {
    await prisma.member.update({
      where: { id: actor.id },
      data: {
        campusId: parsed.data.campusId,
        memberType,
        dormId,
        idConfirmed: true,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "That ID is already registered to another account." };
    }
    throw e;
  }

  redirect("/dashboard");
}
