import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";
import { getCurrentActor } from "@/lib/auth/session";
import { homePathFor } from "@/lib/authz/policy";
import { isGoogleConfigured } from "@/auth";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Access Denied — sign in with your @jiu.ac campus Google account (not a personal Gmail). On a phone, tap your JIU account in the chooser.",
  Configuration:
    "Sign-in hit a server error (the database may be waking up). Please wait a moment and try again — if it keeps failing, contact an administrator.",
  Verification: "This sign-in link is invalid or has expired.",
  CredentialsSignin: "Invalid credentials, or this account is not active.",
  Callback:
    "Sign-in was interrupted. Open the app in Chrome or Safari directly (not inside another app's in-app browser) and try again.",
  OAuthCallback:
    "Sign-in was interrupted. Open the app in Chrome or Safari directly (not inside another app's in-app browser) and try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const actor = await getCurrentActor();
  if (actor) redirect(homePathFor(actor));

  const { error } = await searchParams;
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "Sign-in failed. Please try again.")
    : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Logo size="lg" />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-navy-800">Sign in</h1>
          <p className="mt-1 text-sm text-navy-500">
            Use your campus account to continue.
          </p>
        </div>
        <div className="card">
          <LoginForm googleEnabled={isGoogleConfigured} initialError={errorMessage} />
        </div>
      </div>
    </main>
  );
}
