"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  helperText,
  options,
  children,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-start">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-neutral-800 tracking-tight"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          id={selectId}
          className={`w-full appearance-none rounded-2xl bg-white border border-black/10 py-2.5 ps-3.5 pe-10 text-sm text-neutral-900 transition-all focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 disabled:opacity-50 disabled:bg-neutral-50 ${
            error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10" : ""
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute inset-y-0 end-0 pe-3.5 flex items-center pointer-events-none text-neutral-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}
