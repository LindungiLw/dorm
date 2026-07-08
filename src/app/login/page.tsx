import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";
import { getCurrentActor } from "@/lib/auth/session";
import { homePathFor } from "@/lib/authz/policy";
import { isGoogleConfigured } from "@/auth";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Access Denied: Please use your JIU campus email.",
  Configuration: "Sign-in is not configured correctly. Contact an administrator.",
  Verification: "This sign-in link is invalid or has expired.",
  CredentialsSignin: "Invalid credentials, or this account is not active.",
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
