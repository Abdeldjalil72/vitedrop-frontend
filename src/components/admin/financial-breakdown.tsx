"use client";

import React from "react";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { Language } from "@/lib/locales";
import { ArrowDownRight, ArrowUpRight, ShieldCheck, AlertCircle } from "lucide-react";

interface FinancialBreakdownProps {
  grossCpa: number;
  affiliatePayout: number;
  platformFee: number;
  status: string;
  transactions?: Array<{
    id: string;
    walletId: string;
    type: string;
    amount: number;
    balanceAfter: number | null;
    createdAt: string;
  }>;
  lang: Language;
}

export function FinancialBreakdown({
  grossCpa,
  affiliatePayout,
  platformFee,
  status,
  transactions = [],
  lang,
}: FinancialBreakdownProps) {
  const isArabic = lang === "ar";
  const isSettled = status === "delivered" && transactions.length >= 3;

  return (
    <div className="bg-white rounded-xl border border-neutral-200/80 p-3.5 sm:p-5 lg:p-6 space-y-5 sm:space-y-6 text-start">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          {isArabic ? "التسوية المالية والعمولات (Double-Entry Ledger)" : "Décomposition Financière & Grand Livre"}
        </h3>
        <div>
          {isSettled ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isArabic ? "تمت التسوية بنجاح" : "Régularisé (Settled)"}
            </span>
          ) : status === "delivered" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5" />
              {isArabic ? "بانتظار التسوية" : "En attente de régularisation"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
              {isArabic ? "تسوية غير مستحقة بعد" : "Non éligible (En cours)"}
            </span>
          )}
        </div>
      </div>

      {/* CPA Split Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Supplier Debit (100% CPA) */}
        <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200">
          <div className="text-[11px] font-medium text-neutral-500 mb-1 flex items-center justify-between">
            <span>{isArabic ? "خصم المورد (Gross CPA)" : "Débit Fournisseur (Brut)"}</span>
            <span className="text-purple-600 font-mono text-[10px]">100%</span>
          </div>
          <div className="text-lg font-bold font-mono text-purple-700">
            {formatDZD(grossCpa, lang)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            {isArabic ? "يُخصم من رصيد ضمان المورد" : "Prélevé de l'escrow fournisseur"}
          </p>
        </div>

        {/* Affiliate Payout (80% CPA) */}
        <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
          <div className="text-[11px] font-medium text-emerald-800 mb-1 flex items-center justify-between">
            <span>{isArabic ? "أرباح المسوق (Net CPA)" : "Gain Affilié (Net)"}</span>
            <span className="text-emerald-700 font-mono text-[10px]">80%</span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-700">
            {formatDZD(affiliatePayout, lang)}
          </div>
          <p className="text-[10px] text-emerald-600/80 mt-1">
            {isArabic ? "يُضاف لمحفظة المسوق القابلة للسحب" : "Versé au portefeuille affilié"}
          </p>
        </div>

        {/* Platform Fee (20% CPA) */}
        <div className="p-3.5 rounded-lg bg-sky-50/60 border border-sky-200">
          <div className="text-[11px] font-medium text-sky-800 mb-1 flex items-center justify-between">
            <span>{isArabic ? "عمولة المنصة (20%)" : "Frais Plateforme (ViteDrop)"}</span>
            <span className="text-sky-700 font-mono text-[10px]">20%</span>
          </div>
          <div className="text-lg font-bold font-mono text-sky-700">
            {formatDZD(platformFee, lang)}
          </div>
          <p className="text-[10px] text-sky-600/80 mt-1">
            {isArabic ? "أرباح تشغيل شبكة فايت دروب" : "Marge opérationnelle réseau"}
          </p>
        </div>
      </div>

      {/* Linked Ledger Transactions */}
      <div>
        <h4 className="text-xs font-semibold text-neutral-700 mb-2.5">
          {isArabic ? "سجلات القيود المحاسبية المرتبطة" : "Écritures Comptables Associées"}
        </h4>
        {transactions.length === 0 ? (
          <p className="text-xs text-neutral-400 italic py-2">
            {isArabic
              ? "لا توجد قيود مسجلة بعد. يتم تسجيل القيود تلقائياً عند تأكيد تسليم الطرد من شركة التوصيل."
              : "Aucune écriture comptable. Les flux sont déclenchés exclusivement lors de la livraison confirmée."}
          </p>
        ) : (
          <div className="rounded-lg border border-neutral-200 overflow-hidden">
            {/* Mobile View */}
            <div className="block sm:hidden divide-y divide-neutral-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                        tx.type === "SUPPLIER_DEBIT"
                          ? "bg-purple-100 text-purple-700"
                          : tx.type === "CPA_PAYOUT"
                          ? "bg-emerald-100 text-emerald-700"
                          : tx.type === "PLATFORM_FEE"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {tx.type}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        tx.amount < 0 ? "text-purple-600" : "text-emerald-600"
                      }`}
                    >
                      {formatDZD(tx.amount, lang)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                    <span>Wallet: {tx.walletId.slice(0, 8)}...</span>
                    <span>{formatDateTime(tx.createdAt, lang)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                  <tr>
                    <th className="px-3 py-2 text-start">{isArabic ? "نوع المعاملة" : "Type"}</th>
                    <th className="px-3 py-2 text-start">{isArabic ? "المبلغ" : "Montant"}</th>
                    <th className="px-3 py-2 text-start">{isArabic ? "الرصيد بعدها" : "Solde Après"}</th>
                    <th className="px-3 py-2 text-start">{isArabic ? "المحفظة" : "Wallet ID"}</th>
                    <th className="px-3 py-2 text-start">{isArabic ? "التاريخ" : "Date"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-mono">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-50/50">
                      <td className="px-3 py-2 font-medium">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                            tx.type === "SUPPLIER_DEBIT"
                              ? "bg-purple-100 text-purple-700"
                              : tx.type === "CPA_PAYOUT"
                              ? "bg-emerald-100 text-emerald-700"
                              : tx.type === "PLATFORM_FEE"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-2 font-semibold ${
                          tx.amount < 0 ? "text-purple-600" : "text-emerald-600"
                        }`}
                      >
                        {formatDZD(tx.amount, lang)}
                      </td>
                      <td className="px-3 py-2 text-neutral-600">
                        {tx.balanceAfter !== null ? formatDZD(tx.balanceAfter, lang) : "—"}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-neutral-400">
                        {tx.walletId.slice(0, 8)}...
                      </td>
                      <td className="px-3 py-2 text-neutral-500 text-[11px]">
                        {formatDateTime(tx.createdAt, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
