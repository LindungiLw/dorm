"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export type LoginState = { error?: string };

// Credentials sign-in (stands in for SSO / admin accounts). Generic error — no enumeration.
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    // A successful sign-in throws a redirect (not an AuthError) — let it propagate.
    if (error instanceof AuthError) {
      return { error: "Invalid credentials, or this account is not active." };
    }
    throw error;
  }
}

// Google SSO — the @jiu.ac gate lives in the signIn callback (auth.ts).
export async function googleSignInAction(): Promise<void> {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
