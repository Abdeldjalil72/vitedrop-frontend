"use client";

import React from "react";
import { motion, HTMLMotionProps } from "motion/react";

export interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  enableHover?: boolean;
}

export function Card({
  children,
  className = "",
  enableHover = false,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={enableHover ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 450, damping: 35 }}
      className={`bg-white rounded-3xl border border-black/[0.08] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 pb-4 border-b border-black/[0.06] ${className}`}>
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-black">{title}</h3>
        {subtitle && <p className="text-xs text-[#6b6b6b] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`pt-4 ${className}`}>{children}</div>;
}
