"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none cursor-pointer";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-full gap-1.5",
    md: "px-5 py-2.5 text-sm rounded-full gap-2",
    lg: "px-7 py-3.5 text-base rounded-full gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white shadow-md shadow-sky-500/20 hover:shadow-sky-500/35 hover:brightness-105",
    secondary:
      "border border-black/10 hover:border-black/30 bg-white text-black hover:bg-neutral-50/50",
    ghost:
      "text-[#6b6b6b] hover:text-black hover:bg-black/[0.04]",
    danger:
      "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}
