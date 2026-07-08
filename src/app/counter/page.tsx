import { Logo } from "@/components/Logo";
import { CounterDisplay } from "@/components/CounterDisplay";

// Public page simulating the cafeteria counter's physical display screen. In real life
// this runs on a screen AT the counter; a member reads the code and types it to redeem.
export default function CounterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <Logo size="lg" />
      <div className="w-full max-w-sm">
        <CounterDisplay />
      </div>
      <p className="max-w-sm text-center text-sm text-navy-500">
        This screen is displayed at the cafeteria counter. To redeem a meal, enter this
        code in the app — it changes every 30 seconds, so a screenshot won't work.
      </p>
    </main>
  );
}
