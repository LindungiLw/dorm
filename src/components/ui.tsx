import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-navy-800">
        {icon && <span aria-hidden>{icon}</span>}
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  ISSUED: "bg-navy-50 text-navy-600",
  ACTIVE: "bg-navy-100 text-navy-800",
  REDEEMED: "bg-emerald-100 text-emerald-800",
  EXPIRED: "bg-gray-100 text-gray-500",
  SUSPENDED: "bg-red-100 text-red-700",
  OUT: "bg-sky-100 text-sky-700",
  RETURNED: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

export function Alert({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const cls =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-navy-200 bg-navy-50 text-navy-700";
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>{children}</div>
  );
}
