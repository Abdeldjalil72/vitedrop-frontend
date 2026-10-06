import React from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-dashed border-black/[0.1] ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-black/[0.06] flex items-center justify-center text-neutral-400 mb-4">
        {icon || <Inbox className="w-6 h-6 stroke-1" />}
      </div>
      <h4 className="text-base font-semibold text-neutral-900 tracking-tight">{title}</h4>
      {description && (
        <p className="text-xs text-[#6b6b6b] max-w-sm mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
