"use client";

import React from "react";

interface AdminMetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function AdminMetricGrid({
  children,
  columns = 4,
  className = "",
}: AdminMetricGridProps) {
  const colClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={`grid ${colClasses} gap-3 sm:gap-4 ${className}`}>
      {children}
    </div>
  );
}

interface AdminMetricCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode | React.ElementType;
  subtext?: React.ReactNode;
  subvalue?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: "default" | "emerald" | "rose" | "sky" | "purple";
  trend?: React.ReactNode;
  className?: string;
}

export function AdminMetricCard({
  label,
  value,
  icon,
  subtext,
  subvalue,
  badge,
  variant = "default",
  trend,
  className = "",
}: AdminMetricCardProps) {
  const variantStyles = {
    default: "bg-neutral-50 text-neutral-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
    purple: "bg-purple-50 text-purple-600",
  }[variant];

  const valueStyles = {
    default: "text-neutral-900",
    emerald: "text-emerald-700",
    rose: "text-rose-600",
    sky: "text-sky-600",
    purple: "text-purple-600",
  }[variant];

  return (
    <div
      className={`bg-white p-3.5 sm:p-5 lg:p-6 rounded-xl border border-neutral-200/80 shadow-xs text-start flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <span className="text-[11px] sm:text-xs font-semibold text-[#6b6b6b] line-clamp-1">
            {label}
          </span>
          {icon && (
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${variantStyles}`}>
              {React.isValidElement(icon)
                ? icon
                : React.createElement(icon as React.ElementType, { className: "w-4 h-4" })}
            </div>
          )}
        </div>
        <div className={`text-xl sm:text-2xl lg:text-3xl font-bold font-mono leading-none ${valueStyles}`}>
          {value}
        </div>
      </div>

      {(subtext || subvalue || badge || trend) && (
        <div className="mt-2.5 sm:mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between gap-2 text-[10px] sm:text-xs">
          {(subtext || subvalue) && <div className="text-[#6b6b6b] truncate">{subtext || subvalue}</div>}
          {trend && <div className="text-neutral-500">{trend}</div>}
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}
    </div>
  );
}
