import React from "react";

export function Table({
  children,
  className = "",
  containerClassName = "",
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & {
  containerClassName?: string;
}) {
  return (
    <div className={`w-full overflow-x-auto custom-scrollbar rounded-2xl border border-black/[0.08] bg-white ${containerClassName}`}>
      <table className={`w-full text-start text-sm border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`bg-[#fbfbfb] text-[#6b6b6b] text-xs font-medium uppercase tracking-wider border-b border-black/[0.06] ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-black/[0.04] ${className}`} {...props}>{children}</tbody>;
}

export function TableRow({
  children,
  className = "",
  onClick,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-[#f9f9f9] transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`py-3.5 px-4 text-start font-semibold whitespace-nowrap ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
  colSpan,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td colSpan={colSpan} className={`py-3.5 px-4 text-start align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}
