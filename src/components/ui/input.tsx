"use client";

import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  startIcon,
  endIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-start">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-neutral-800 tracking-tight"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {startIcon && (
          <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-neutral-400">
            {startIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full rounded-2xl bg-white border border-black/10 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 disabled:opacity-50 disabled:bg-neutral-50 ${
            startIcon ? "ps-10" : "ps-3.5"
          } ${endIcon ? "pe-10" : "pe-3.5"} ${
            error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10" : ""
          } ${className}`}
          {...props}
        />
        {endIcon && (
          <div className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-neutral-400">
            {endIcon}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}
