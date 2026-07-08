"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

// Short, skippable, auth-aware welcome splash. Auto-redirects after ~1.8s (shorter when
// the user prefers reduced motion), and a tap anywhere skips the wait immediately.
export function WelcomeSplash({
  target,
  loggedIn,
}: {
  target: string;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  const go = () => {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    setTimeout(() => router.push(target), 250); // let the fade-out play
  };

  useEffect(() => {
    router.prefetch(target);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(go, reduce ? 400 : 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      onClick={go}
      role="button"
      aria-label="Continue"
      className={`flex min-h-screen cursor-pointer flex-col items-center justify-center gap-6 px-6 text-center transition-opacity duration-300 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="animate-splash-in flex flex-col items-center gap-6">
        <div className="scale-150">
          <Logo size="lg" withWordmark={false} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-navy-800 sm:text-4xl">
            Welcome to <span className="text-navy-700">JIU</span>
            <span className="text-navy-500">nity</span>
          </h1>
          <p className="mt-2 text-sm text-navy-500">
            {loggedIn ? "Preparing your dashboard…" : "Taking you to sign in…"}
          </p>
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-navy-100">
          <div className="animate-splash-bar h-full rounded-full bg-navy-600" />
        </div>
        <p className="text-xs text-navy-300">tap anywhere to continue</p>
      </div>
    </main>
  );
}
