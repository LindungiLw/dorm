"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Polls the server component on an interval so a shared board stays live: new passes
// appear and closed ones drop off without anyone reloading. Cheap — router.refresh()
// only re-runs the server render, keeping client state (open forms) intact.
export function AutoRefresh({ seconds = 12 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
