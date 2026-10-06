"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Language } from "@/lib/locales";

interface ResponsiveAdminListProps<T> {
  items: T[];
  total: number;
  isLoading: boolean;
  error?: string | null;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  renderTable: () => React.ReactNode;
  renderCard: (item: T, index: number) => React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  lang?: Language;
  title?: string;
  toolbarRight?: React.ReactNode;
}

export function ResponsiveAdminList<T>({
  items,
  total,
  isLoading,
  error,
  page,
  totalPages,
  onPageChange,
  renderTable,
  renderCard,
  emptyIcon,
  emptyTitle = "Aucun élément trouvé",
  emptyDescription = "Aucun enregistrement ne correspond aux critères de recherche.",
  lang = "fr",
  title,
  toolbarRight,
}: ResponsiveAdminListProps<T>) {
  const isArabic = lang === "ar";

  return (
    <div className="bg-white rounded-xl border border-neutral-200/80 shadow-xs overflow-hidden">
      {/* List Header */}
      {(title || total !== undefined || toolbarRight) && (
        <div className="p-3.5 sm:p-4 border-b border-neutral-100 flex items-center justify-between gap-3 text-start">
          <div className="flex items-center gap-2 min-w-0">
            {title && (
              <span className="text-xs sm:text-sm font-semibold text-neutral-800 truncate">
                {title}
              </span>
            )}
            <span className="text-[11px] sm:text-xs text-neutral-500 font-mono shrink-0">
              ({total} {isArabic ? "مسجل" : "total"})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {toolbarRight}
            {totalPages > 1 && (
              <span className="text-[11px] sm:text-xs text-neutral-400 font-mono hidden sm:inline">
                {isArabic ? `الصفحة ${page} من ${totalPages}` : `Page ${page} / ${totalPages}`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs flex items-center gap-2 text-start">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="p-4 sm:p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 sm:p-12 text-center text-neutral-500 space-y-2">
          {emptyIcon && <div className="mx-auto w-10 h-10 text-neutral-300 flex items-center justify-center">{emptyIcon}</div>}
          <p className="text-sm font-semibold text-neutral-800">{emptyTitle}</p>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">{emptyDescription}</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards (Phones only: block sm:hidden) */}
          <div className="block sm:hidden divide-y divide-neutral-100">
            {items.map((item, index) => (
              <div key={index} className="p-3.5 hover:bg-neutral-50/50 transition-colors">
                {renderCard(item, index)}
              </div>
            ))}
          </div>

          {/* Desktop Table (Tablet & Desktop: hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto">
            {renderTable()}
          </div>
        </>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && !isLoading && (
        <div className="p-3 sm:p-4 border-t border-neutral-100 flex items-center justify-between text-xs">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="text-xs flex items-center gap-1 h-8 px-2.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{isArabic ? "السابق" : "Précédent"}</span>
          </Button>

          <span className="font-mono text-neutral-600 text-xs">
            {page} / {totalPages}
          </span>

          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="text-xs flex items-center gap-1 h-8 px-2.5"
          >
            <span>{isArabic ? "التالي" : "Suivant"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
