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

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-start ${className}`}
    >
      <div className="space-y-1 min-w-0">
        {badgeText && (
          <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
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
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap pt-1 sm:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
