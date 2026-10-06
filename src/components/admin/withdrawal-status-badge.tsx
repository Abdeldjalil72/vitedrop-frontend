import React from "react";
import { WithdrawalStatus } from "@/lib/api-client";
import { Clock, CheckCircle2, XCircle, AlertCircle, ShieldCheck } from "lucide-react";

interface Props {
  status: WithdrawalStatus;
  lang?: "fr" | "ar" | "en";
}

export function WithdrawalStatusBadge({ status, lang = "fr" }: Props) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-800 border-amber-200/80">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>{lang === "ar" ? "قيد المراجعة" : lang === "en" ? "Pending" : "En attente"}</span>
        </span>
      );
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-sky-50 text-sky-700 border-sky-200/80">
          <ShieldCheck className="w-3 h-3 text-sky-600" />
          <span>{lang === "ar" ? "تمت الموافقة" : lang === "en" ? "Approved" : "Approuvé"}</span>
        </span>
      );
    case "PAID":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{lang === "ar" ? "تم التحويل (مدفوع)" : lang === "en" ? "Paid" : "Payé"}</span>
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-rose-50 text-rose-700 border-rose-200/80">
          <XCircle className="w-3 h-3 text-rose-600" />
          <span>{lang === "ar" ? "مرفوض" : lang === "en" ? "Rejected" : "Rejeté"}</span>
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-red-50 text-red-700 border-red-200/80">
          <AlertCircle className="w-3 h-3 text-red-600" />
          <span>{lang === "ar" ? "فشل التحويل" : lang === "en" ? "Failed" : "Échoué"}</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-neutral-100 text-neutral-800 border-neutral-200">
          <span>{status}</span>
        </span>
      );
  }
}
