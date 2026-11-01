"use client";

import React, { useState } from "react";
import { WebhookEventItem } from "@/lib/api-client";
import { formatDateTime } from "@/lib/formatters";
import { Language } from "@/lib/locales";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Truck,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

interface WebhookEventTableProps {
  events: WebhookEventItem[];
  lang: Language;
  onViewPayload: (event: WebhookEventItem) => void;
  onRetry?: (event: WebhookEventItem) => void;
}

export function WebhookEventTable({
  events,
  lang,
  onViewPayload,
  onRetry,
}: WebhookEventTableProps) {
  const isArabic = lang === "ar";
  const isEnglish = lang === "en";
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            PROCESSED
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      case "IGNORED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
            <AlertCircle className="w-3 h-3" />
            IGNORED
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <>
      {/* Mobile Card View (Phone / Small Screens) */}
      <div className="block sm:hidden divide-y divide-neutral-100">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="p-3.5 space-y-2.5"
            data-testid="admin-webhook-card"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 text-xs">
                <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{evt.provider}</span>
              </div>
              <div>{getStatusBadge(evt.processingStatus)}</div>
            </div>

            <div className="flex items-baseline justify-between gap-2 text-xs">
              <div className="min-w-0 flex items-center gap-1.5">
                <span dir="ltr" className="font-mono font-bold text-neutral-900 truncate">
                  {evt.trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(evt.trackingNumber, `card-track-${evt.id}`)}
                  className="p-1 rounded text-neutral-400 hover:text-black transition-colors"
                  data-testid="copy-tracking-btn"
                  aria-label={isArabic ? "نسخ رقم التتبع" : isEnglish ? "Copy tracking number" : "Copier numéro de suivi"}
                >
                  {copiedKey === `card-track-${evt.id}` ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <div className="text-[10px] text-neutral-400 font-mono text-end shrink-0">
                {formatDateTime(evt.createdAt, lang)}
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg text-xs">
              <span className="text-neutral-500 text-[11px]">
                {isArabic ? "الحالة:" : isEnglish ? "Status:" : "Statut:"}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-[11px] font-mono text-neutral-700">
                {evt.receivedStatus}
              </span>
              <span className="text-neutral-400">&rarr;</span>
              <span className="font-semibold text-neutral-900 text-[11px]">
                {evt.normalizedStatus}
              </span>
            </div>

            {evt.errorMessage && (
              <div className="text-[11px] text-rose-600 bg-rose-50/80 p-2 rounded-lg border border-rose-200/60 line-clamp-2">
                {evt.errorMessage}
              </div>
            )}

            <div className="pt-1 flex items-center justify-end gap-2">
              {onRetry && evt.processingStatus === "FAILED" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRetry(evt)}
                  className="min-h-[36px] px-3 text-xs text-rose-700 font-medium flex items-center gap-1.5"
                  data-testid="retry-webhook-btn"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {isArabic ? "إعادة المحاولة" : isEnglish ? "Retry" : "Retenter"}
                </Button>
              )}

              {evt.rawPayload && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewPayload(evt)}
                  className="min-h-[36px] px-3 text-xs text-neutral-700 font-medium flex items-center gap-1.5 w-full justify-center"
                  data-testid="view-payload-btn"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isArabic ? "عرض بيانات الويب هوك الخام" : isEnglish ? "Inspect Raw JSON" : "Examiner le JSON Brut"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-xs text-start">
          <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3.5 text-start">
                {isArabic ? "المزود / التاريخ" : isEnglish ? "Provider & Date" : "Fournisseur & Date"}
              </th>
              <th className="px-4 py-3.5 text-start">
                {isArabic ? "رقم التتبع" : isEnglish ? "Tracking #" : "N° de Suivi"}
              </th>
              <th className="px-4 py-3.5 text-start">
                {isArabic ? "الحالة المستلمة" : isEnglish ? "Received Status" : "Statut Reçu"}
              </th>
              <th className="px-4 py-3.5 text-start">
                {isArabic ? "الحالة المعيارية" : isEnglish ? "Normalized Status" : "Statut Normalisé"}
              </th>
              <th className="px-4 py-3.5 text-start">
                {isArabic ? "نتيجة المعالجة" : isEnglish ? "Processing Result" : "Résultat Traitement"}
              </th>
              <th className="px-4 py-3.5 text-end">
                {isArabic ? "الإجراءات" : isEnglish ? "Actions" : "Actions"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 font-mono">
            {events.map((evt) => (
              <tr
                key={evt.id}
                className="hover:bg-neutral-50/60 transition-colors"
                data-testid="admin-webhook-row"
              >
                {/* Provider & Date */}
                <td className="px-4 py-3.5 font-sans">
                  <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>{evt.provider}</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {formatDateTime(evt.createdAt, lang)}
                  </div>
                </td>

                {/* Tracking Number */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span dir="ltr" className="font-bold text-neutral-900">
                      {evt.trackingNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(evt.trackingNumber, `tbl-track-${evt.id}`)}
                      className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
                      data-testid="copy-tracking-btn"
                      aria-label={isArabic ? "نسخ رقم التتبع" : isEnglish ? "Copy tracking number" : "Copier numéro de suivi"}
                    >
                      {copiedKey === `tbl-track-${evt.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {evt.providerEventId && (
                    <div className="text-[10px] text-neutral-400 font-normal">
                      ID: <span dir="ltr">{evt.providerEventId}</span>
                    </div>
                  )}
                </td>

                {/* Received Status */}
                <td className="px-4 py-3.5 font-sans text-neutral-700">
                  <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 text-[11px] font-mono">
                    {evt.receivedStatus}
                  </span>
                </td>

                {/* Normalized Status */}
                <td className="px-4 py-3.5 font-sans font-semibold text-neutral-900">
                  {evt.normalizedStatus}
                </td>

                {/* Processing Status & Error */}
                <td className="px-4 py-3.5 font-sans">
                  {getStatusBadge(evt.processingStatus)}
                  {evt.errorMessage && (
                    <div
                      className="text-[10px] text-rose-600 mt-1 line-clamp-1 max-w-[220px]"
                      title={evt.errorMessage}
                    >
                      {evt.errorMessage}
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-end font-sans">
                  <div className="flex items-center justify-end gap-1.5">
                    {evt.rawPayload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewPayload(evt)}
                        className="h-7 px-2.5 text-xs text-neutral-600 hover:text-neutral-900"
                        data-testid="view-payload-btn"
                      >
                        <Eye className="w-3.5 h-3.5 me-1" />
                        JSON
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
