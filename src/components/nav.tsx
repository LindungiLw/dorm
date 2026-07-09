"use client";

import type { ReactNode } from "react";

const ip = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* Main module icons */
export function QrIcon() {
  return (
    <svg {...ip} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4" />
    </svg>
  );
}
export function ClipboardIcon() {
  return (
    <svg {...ip} aria-hidden>
      <rect x="8" y="3" width="8" height="4" rx="1" />
      <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}
export function CartIcon() {
  return (
    <svg {...ip} aria-hidden>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2l2.4 12.3a1 1 0 0 0 1 .7h9.3a1 1 0 0 0 1-.78L21 7H6" />
    </svg>
  );
}
export function GaugeIcon() {
  return (
    <svg {...ip} aria-hidden>
      <path d="M12 14l3-3" />
      <path d="M3.5 18a9 9 0 1 1 17 0" />
      <circle cx="12" cy="14" r="1" />
    </svg>
  );
}

/* Sub-item icons */
function AllergyIcon() {
  // Allergen warning triangle.
  return (
    <svg {...ip} aria-hidden>
      <path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
function UtensilsIcon() {
  return (
    <svg {...ip} aria-hidden>
      <path d="M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M6 12v9" />
      <path d="M17 3c-1.7 0-3 2-3 5s1 4 2 4v9" />
    </svg>
  );
}
function ScanIcon() {
  return (
    <svg {...ip} aria-hidden>
      <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg {...ip} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}
function DoorIcon() {
  return (
    <svg {...ip} aria-hidden>
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8" />
      <path d="M14 3l4 2v14l-4 2z" />
      <path d="M12 12h.01" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg {...ip} aria-hidden>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg {...ip} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg {...ip} aria-hidden>
      <path d="M4 9h16l-1-5H5z" />
      <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export type SubItem = { label: string; href: string; icon: ReactNode };
export type ModuleDef = {
  key: string;
  label: string;
  base: string;
  primary: string;
  icon: ReactNode;
  sub: SubItem[];
};

// Single source of truth for the module nav (used by the desktop side capsule, the
// mobile bottom bar, and the mobile sub-menu capsule).
export const MODULES: ModuleDef[] = [
  {
    key: "cafeteria",
    label: "Cafetaria",
    base: "/dashboard/cafeteria",
    primary: "/dashboard/cafeteria/menu",
    icon: <QrIcon />,
    sub: [
      { label: "Menu", href: "/dashboard/cafeteria/menu", icon: <UtensilsIcon /> },
      { label: "Allergy", href: "/dashboard/cafeteria/allergy", icon: <AllergyIcon /> },
      { label: "Check-in", href: "/dashboard/cafeteria/checkin", icon: <ScanIcon /> },
      { label: "Feedback", href: "/dashboard/cafeteria/pengajuan", icon: <DocIcon /> },
    ],
  },
  {
    key: "permission",
    label: "Permission",
    base: "/dashboard/permission",
    primary: "/dashboard/permission/exit",
    icon: <ClipboardIcon />,
    sub: [
      { label: "Izin Keluar Masuk", href: "/dashboard/permission/exit", icon: <DoorIcon /> },
      { label: "Peminjaman Barang", href: "/dashboard/permission/borrow", icon: <BoxIcon /> },
    ],
  },
  {
    key: "market",
    label: "Market",
    base: "/dashboard/market",
    primary: "/dashboard/market/catalog",
    icon: <CartIcon />,
    sub: [
      { label: "Katalog Produk", href: "/dashboard/market/catalog", icon: <GridIcon /> },
      { label: "Jadi Penjual", href: "/dashboard/market/sell", icon: <StoreIcon /> },
    ],
  },
];

export function activeModule(pathname: string): ModuleDef | undefined {
  return MODULES.find((m) => pathname.startsWith(m.base));
}
