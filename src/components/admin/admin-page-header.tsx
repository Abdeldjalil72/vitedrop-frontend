"use client";

import React from "react";

interface AdminPageHeaderProps {
  eyebrow?: string;
  badge?: string;
  badgeVariant?: "rose" | "neutral" | string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  eyebrow,
  badge,
  badgeVariant,
  title,
  description,
  actions,
  className = "",
}: AdminPageHeaderProps) {
  const badgeText = eyebrow || badge;

  const variantStyles: Record<string, string> = {
    rose: "text-rose-700 bg-rose-50 border-rose-200",
    emerald: "text-emerald-800 bg-emerald-50 border-emerald-200",
    amber: "text-amber-900 bg-amber-50 border-amber-200",
    cyan: "text-sky-800 bg-sky-50 border-sky-200",
    neutral: "text-neutral-700 bg-stone-100 border-stone-200",
  };
  const activeBadgeClass = (badgeVariant && variantStyles[badgeVariant]) || variantStyles.amber;

  return (
    <div
      className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4 text-start ${className}`}
    >
      <div className="space-y-1 min-w-0">
        {badgeText && (
          <span className={`inline-block text-[11px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${activeBadgeClass}`}>
            {badgeText}
          </span>
        )}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-neutral-900 leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[#6b6b6b] leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap pt-1 lg:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
