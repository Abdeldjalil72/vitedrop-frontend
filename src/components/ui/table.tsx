import React from "react";

export function Table({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-black/[0.08] bg-white">
      <table className={`w-full text-start text-sm border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <thead
      className={`bg-[#fbfbfb] text-[#6b6b6b] text-xs font-medium uppercase tracking-wider border-b border-black/[0.06] ${className}`}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tbody className={`divide-y divide-black/[0.04] ${className}`}>{children}</tbody>;
}

export function TableRow({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-[#f9f9f9] transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`py-3.5 px-4 text-start font-semibold whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`py-3.5 px-4 text-start align-middle ${className}`}>
      {children}
    </td>
  );
}
