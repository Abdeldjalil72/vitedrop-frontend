"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Language, translations } from "@/lib/locales";

interface ReconciliationStatusBadgeProps {
  status: "reconciled" | "discrepancy" | "warning";
  lang?: Language;
}

export function ReconciliationStatusBadge({
  status,
  lang = "fr",
}: ReconciliationStatusBadgeProps) {
  const t = translations[lang] || translations.fr;
  const rec = t.reconciliation.wallets;

  switch (status) {
    case "reconciled":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{rec.statusClean}</span>
        </span>
      );
    case "discrepancy":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{rec.statusVariance}</span>
        </span>
      );
    case "warning":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            {lang === "ar"
              ? "قيد المراجعة"
              : lang === "en"
              ? "Needs Review"
              : "À vérifier"}
          </span>
        </span>
      );
  }
}
