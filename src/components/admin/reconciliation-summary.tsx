"use client";

import React from "react";
import { ReconciliationSummary } from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { Language } from "@/lib/locales";
import { ShieldCheck, AlertOctagon, Scale, Clock, RefreshCw } from "lucide-react";

interface ReconciliationSummaryProps {
  summary: ReconciliationSummary | null;
  lang: Language;
}

export function ReconciliationSummaryCards({
  summary,
  lang,
}: ReconciliationSummaryProps) {
  const isArabic = lang === "ar";

  if (!summary) return null;

  const hasVariance = summary.walletsWithVariance > 0 || summary.totalVarianceAmount !== 0;
  const hasOrderIssues =
    summary.ordersMissingSettlement > 0 || summary.ordersWithDuplicateTransactions > 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-start">
      {/* Card 1: Wallets Audited */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-xl border border-neutral-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500">
            {isArabic ? "المحافظ المراجعة" : "Portefeuilles Audités"}
          </span>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center ${
              hasVariance ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-neutral-900">
            {summary.walletsAudited}
          </div>
          <div
            className={`text-xs font-semibold mt-1 ${
              hasVariance ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {summary.walletsWithVariance === 0
              ? isArabic
                ? "لا توجد أي فروقات في المحافظ"
                : "100% Intègres sans écart"
              : isArabic
              ? `${summary.walletsWithVariance} محفظة بفوارق حسابية`
              : `${summary.walletsWithVariance} avec écarts de solde`}
          </div>
        </div>
      </div>

      {/* Card 2: Total Variance */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500">
            {isArabic ? "إجمالي الفارق المحاسبي" : "Écart Total (Variance)"}
          </span>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center ${
              summary.totalVarianceAmount === 0
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-2xl font-bold font-mono ${
              summary.totalVarianceAmount === 0 ? "text-emerald-700" : "text-rose-600"
            }`}
          >
            {formatDZD(summary.totalVarianceAmount, lang)}
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            {isArabic
              ? "مقارنة رصيد المحفظة مع مجموع القيود"
              : "Différence solde vs somme du ledger"}
          </div>
        </div>
      </div>

      {/* Card 3: Delivered Orders Settlement */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500">
            {isArabic ? "طلبيات تم تسليمها مدققة" : "Commandes Livrées"}
          </span>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center ${
              hasOrderIssues ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-neutral-900">
            {summary.deliveredOrdersAudited}
          </div>
          <div
            className={`text-xs font-semibold mt-1 ${
              summary.ordersMissingSettlement > 0 ? "text-amber-700" : "text-emerald-600"
            }`}
          >
            {summary.ordersMissingSettlement > 0
              ? isArabic
                ? `${summary.ordersMissingSettlement} طلبيات بحاجة لتسوية القيود`
                : `${summary.ordersMissingSettlement} sans écritures comptables`
              : isArabic
              ? "جميع الطلبيات المسلمة تمت تسويتها"
              : "Toutes les livraisons sont régularisées"}
          </div>
        </div>
      </div>

      {/* Card 4: Last Audit Run */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500">
            {isArabic ? "آخر تدقيق آلي" : "Dernière Réconciliation"}
          </span>
          <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-sm font-bold font-mono text-neutral-800">
            {summary.lastRunAt ? formatDateTime(summary.lastRunAt, lang) : isArabic ? "لم يتم بعد" : "Jamais"}
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            {isArabic ? "تدقيق رياضي ثلاثي الأطراف" : "Contrôle d'intégrité tripartite"}
          </div>
        </div>
      </div>
    </div>
  );
}
