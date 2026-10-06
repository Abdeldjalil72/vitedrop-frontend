"use client";

import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className = "",
  id,
  rows = 3,
  ...props
}: TextareaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-start">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-semibold text-neutral-800 tracking-tight"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full rounded-2xl bg-white border border-black/10 p-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 disabled:opacity-50 disabled:bg-neutral-50 ${
          error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10" : ""
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}
