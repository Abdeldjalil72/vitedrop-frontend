import React from "react";
import { OrderStatus } from "@/types";
import { Language, translations } from "@/lib/locales";

export const STATUS_CONFIG: Record<
  OrderStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  lead_generated: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  supplier_confirmed: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  dispatched: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  in_transit: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  delivered: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  rto_in_transit: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  returned_to_supplier: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  canceled: {
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    border: "border-neutral-200",
    dot: "bg-neutral-400",
  },
};

export interface StatusBadgeProps {
  status: OrderStatus;
  lang?: Language;
  showDot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  status,
  lang = "fr",
  showDot = true,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.lead_generated;
  const label = translations[lang]?.statuses[status] || status;

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClasses} ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot} ${
            status === "in_transit" || status === "lead_generated" ? "animate-pulse" : ""
          }`}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
