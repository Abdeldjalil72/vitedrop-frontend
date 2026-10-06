import React from "react";

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70 ${className}`}
      {...props}
    />
  );
}
