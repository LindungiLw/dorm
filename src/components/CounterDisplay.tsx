"use client";

import { useEffect, useState } from "react";

type CodeData = { counter: string; code: string; secondsLeft: number };

// Polls the counter code endpoint once a second so the displayed code always matches
// what the server will accept. Simulates the physical counter's screen.
export function CounterDisplay({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<CodeData | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/counter-code", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as CodeData;
        if (alive) setData(json);
      } catch {
        /* transient — retried next tick */
      }
    };
    load();
    const id = setInterval(load, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div
      className={`rounded-xl border border-navy-200 bg-navy-800 text-center text-white ${
        compact ? "p-4" : "p-8"
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-navy-200">
        {data ? data.counter : "Counter"} · live code
      </p>
      <p
        className={`font-bold tabular-nums tracking-[0.3em] ${
          compact ? "text-4xl" : "text-6xl"
        } my-2`}
      >
        {data ? data.code : "······"}
      </p>
      <p className="text-xs text-navy-200">
        {data ? `rotates in ${data.secondsLeft}s` : "loading…"}
      </p>
    </div>
  );
}
