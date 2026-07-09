import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/session";
import { Logo } from "@/components/Logo";
import { OnboardingForm } from "@/components/OnboardingForm";

const STAFF_DOMAIN = "k-eduplex.net";

export default async function OnboardingPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.idConfirmed) redirect("/dashboard");

  const isStaff = actor.email.endsWith(`@${STAFF_DOMAIN}`);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" />
          <h1 className="mt-6 text-2xl font-bold text-navy-800">Complete your profile</h1>
          <p className="mt-1 text-sm text-navy-500">
            Welcome, {actor.fullName.split(" ")[0]}. Enter your{" "}
            {isStaff ? "staff or lecturer number" : "student number"} to continue. This is a
            one time step.
          </p>
        </div>
        <div className="card">
          <OnboardingForm isStaff={isStaff} />
        </div>
      </div>
    </main>
  );
}
