"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Language } from "@/lib/locales";

interface ReconciliationStatusBadgeProps {
  status: "reconciled" | "discrepancy" | "warning";
  lang: Language;
}

export function ReconciliationStatusBadge({
  status,
  lang,
}: ReconciliationStatusBadgeProps) {
  const isArabic = lang === "ar";

  switch (status) {
    case "reconciled":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isArabic ? "متطابق 100%" : "Équilibré (0 Variance)"}
        </span>
      );
    case "discrepancy":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
          {isArabic ? "فارق محاسبي" : "Anomalie Détectée"}
        </span>
      );
    case "warning":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          {isArabic ? "قيد المراجعة" : "À vérifier"}
        </span>
      );
  }
}
