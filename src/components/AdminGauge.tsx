"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QrIcon, ClipboardIcon, CartIcon, GaugeIcon } from "@/components/nav";
import type { AdminConsole } from "@/lib/authz/policy";

// A small icon per console so the picker reads at a glance.
function iconFor(key: string) {
  switch (key) {
    case "cafeteria":
      return <QrIcon />;
    case "dorm":
      return <ClipboardIcon />;
    case "market":
      return <CartIcon />;
    case "root":
      return <CrownIcon />;
    case "academic":
      return <CapIcon />;
    case "security":
      return <ShieldIcon />;
    default:
      return <GaugeIcon />;
  }
}

const BTN =
  "flex h-11 w-11 items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-1";

// The nav's admin entry. One console links straight to it (unchanged behaviour); two or
// more open a small picker so a multi-feature admin can reach each console.
export function AdminGauge({
  consoles,
  placement,
}: {
  consoles: AdminConsole[];
  placement: "right" | "top";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus(); // keep focus on the trigger, not on <body>
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (consoles.length === 0) return null;

  // A console is its own single page, so highlight on an exact match only. (The cafeteria
  // console shares its base path with the public cafeteria module, so startsWith would
  // wrongly light up on the normal menu/allergy/checkin pages.)
  const isOn = (href: string) => pathname === href;

  // Single console: a plain link (exactly like before).
  if (consoles.length === 1) {
    const c = consoles[0];
    const on = isOn(c.href);
    return (
      <Link
        href={c.href}
        aria-label="Admin"
        title="Admin"
        aria-current={on ? "page" : undefined}
        className={`${BTN} ${
          on
            ? "bg-navy-700 text-white"
            : "text-navy-500 hover:bg-navy-50 hover:text-navy-700"
        }`}
      >
        <GaugeIcon />
      </Link>
    );
  }

  // Several consoles: a button that opens a small picker.
  const anyActive = consoles.some((c) => isOn(c.href));
  const panelPos =
    placement === "right" ? "left-full bottom-0 ml-2" : "bottom-full right-0 mb-2";

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Admin consoles"
        title="Admin consoles"
        className={`${BTN} ${
          open || anyActive
            ? "bg-navy-700 text-white"
            : "text-navy-500 hover:bg-navy-50 hover:text-navy-700"
        }`}
      >
        <GaugeIcon />
      </button>

      {open && (
        <div
          aria-label="Admin consoles"
          className={`absolute z-50 ${panelPos} w-52 overflow-hidden rounded-2xl border border-navy-100 bg-white p-1.5 shadow-xl`}
        >
          <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy-400">
            Admin consoles
          </p>
          {consoles.map((c) => {
            const on = isOn(c.href);
            return (
              <Link
                key={c.key}
                href={c.href}
                aria-current={on ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition ${
                  on ? "bg-navy-100 text-navy-800" : "text-navy-600 hover:bg-navy-50"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    on ? "bg-navy-200 text-navy-800" : "bg-navy-50 text-navy-500"
                  }`}
                >
                  {iconFor(c.key)}
                </span>
                {c.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Icons for consoles that have no module icon (currentColor, matches the nav set). */
function CrownIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 8l4 3.5L12 5l5 6.5L21 8l-2 10H5z" />
    </svg>
  );
}
function CapIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
    </svg>
  );
}
