"use client";

import React from "react";
import { ReconciliationSummary } from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { Language, translations } from "@/lib/locales";
import { ShieldCheck, AlertOctagon, Scale, Clock } from "lucide-react";

interface ReconciliationSummaryProps {
  summary: ReconciliationSummary | null;
  lang?: Language;
}

export function ReconciliationSummaryCards({
  summary,
  lang = "fr",
}: ReconciliationSummaryProps) {
  const t = translations[lang] || translations.fr;
  const rec = t.reconciliation.summary;
  const recPosture = t.reconciliation.posture;

  if (!summary) return null;

  const hasVariance = summary.walletsWithVariance > 0 || summary.totalVarianceAmount !== 0;
  const hasOrderIssues =
    summary.ordersMissingSettlement > 0 || summary.ordersWithDuplicateTransactions > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 text-start">
      {/* Card 1: Wallets Audited */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e7e5df] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {rec.walletsAudited}
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              hasVariance
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3.5">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-neutral-900 tracking-tight">
            {summary.walletsAudited}
          </div>
          <div
            className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${
              hasVariance ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                hasVariance ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            <span>
              {summary.walletsWithVariance === 0
                ? rec.walletsAllClean
                : rec.walletsVarianceCount.replace("{count}", String(summary.walletsWithVariance))}
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Total Variance */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e7e5df] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {rec.totalVariance}
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              summary.totalVarianceAmount === 0
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3.5">
          <div
            className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
              summary.totalVarianceAmount === 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {formatDZD(summary.totalVarianceAmount, lang)}
          </div>
          <div className="text-xs text-neutral-400 mt-1.5">
            {rec.varianceDesc}
          </div>
        </div>
      </div>

      {/* Card 3: Delivered Orders Settlement */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e7e5df] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {rec.deliveredOrders}
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              hasOrderIssues
                ? "bg-amber-50 text-amber-900 border border-amber-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3.5">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-neutral-900 tracking-tight">
            {summary.deliveredOrdersAudited}
          </div>
          <div
            className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${
              summary.ordersMissingSettlement > 0 ? "text-amber-800" : "text-emerald-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                summary.ordersMissingSettlement > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            <span>
              {summary.ordersMissingSettlement > 0
                ? rec.ordersMissingSettlementCount.replace("{count}", String(summary.ordersMissingSettlement))
                : rec.ordersAllSettled}
            </span>
          </div>
        </div>
      </div>

      {/* Card 4: Last Audit Run */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e7e5df] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {rec.lastAuditRun}
          </span>
          <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3.5">
          <div className="text-sm sm:text-base font-bold font-mono text-neutral-900">
            {summary.lastRunAt ? formatDateTime(summary.lastRunAt, lang) : recPosture.neverAudited}
          </div>
          <div className="text-xs text-neutral-400 mt-1.5">
            {rec.auditTripartite}
          </div>
        </div>
      </div>
    </div>
  );
}
