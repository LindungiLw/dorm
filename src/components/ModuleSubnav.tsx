"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Tab = { label: string; href: string };

export const CAFETERIA_TABS: Tab[] = [
  { label: "Menu", href: "/dashboard/cafeteria/menu" },
  { label: "Allergy", href: "/dashboard/cafeteria/allergy" },
  { label: "Check-in", href: "/dashboard/cafeteria/checkin" },
  { label: "Feedback", href: "/dashboard/cafeteria/pengajuan" },
];
export const PERMISSION_TABS: Tab[] = [
  { label: "Exit Permission", href: "/dashboard/permission/exit" },
  { label: "Borrow Items", href: "/dashboard/permission/borrow" },
];
export const MARKET_TABS: Tab[] = [
  { label: "Product Catalog", href: "/dashboard/market/catalog" },
  { label: "Become a Seller", href: "/dashboard/market/sell" },
];

// Sub-navigation shown inside a module so users can switch between its two features.
export function ModuleSubnav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  return (
    <div className="mb-6 hidden flex-wrap gap-1 rounded-full border border-navy-100 bg-white p-1 shadow-sm md:inline-flex">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active ? "bg-navy-700 text-white" : "text-navy-500 hover:bg-navy-50"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
