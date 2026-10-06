"use client";

import React, { useState } from "react";
import { WebhookEventItem } from "@/lib/api-client";
import { formatDateTime } from "@/lib/formatters";
import { Language } from "@/lib/locales";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Eye, Truck } from "lucide-react";

interface WebhookEventTableProps {
  events: WebhookEventItem[];
  lang: Language;
}

export function WebhookEventTable({ events, lang }: WebhookEventTableProps) {
  const isArabic = lang === "ar";
  const [selectedPayload, setSelectedPayload] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            PROCESSED
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      case "IGNORED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
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
          <div key={evt.id} className="p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 text-xs">
                <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{evt.provider}</span>
              </div>
              <div>{getStatusBadge(evt.processingStatus)}</div>
            </div>

            <div className="flex items-baseline justify-between gap-2 text-xs">
              <div className="min-w-0">
                <div className="font-mono font-bold text-neutral-900 truncate">
                  {evt.trackingNumber}
                </div>
                {evt.providerEventId && (
                  <div className="text-[10px] text-neutral-400 font-mono">
                    ID: {evt.providerEventId}
                  </div>
                )}
              </div>
              <div className="text-[10px] text-neutral-400 font-mono text-end shrink-0">
                {formatDateTime(evt.createdAt, lang)}
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg text-xs">
              <span className="text-neutral-500 text-[11px]">
                {isArabic ? "الحالة:" : "Statut:"}
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

            {evt.rawPayload && (
              <div className="pt-1 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedPayload(evt.rawPayload || "")}
                  className="min-h-[36px] px-3 text-xs text-neutral-700 font-medium flex items-center gap-1.5 w-full justify-center"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isArabic ? "عرض بيانات الويب هوك الخام" : "Examiner le JSON Brut"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-xs text-start">
          <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-start">{isArabic ? "المزود / التاريخ" : "Fournisseur & Date"}</th>
              <th className="px-4 py-3 text-start">{isArabic ? "رقم التتبع" : "N° de Suivi"}</th>
              <th className="px-4 py-3 text-start">{isArabic ? "الحالة المستلمة" : "Statut Reçu"}</th>
              <th className="px-4 py-3 text-start">{isArabic ? "الحالة المعيارية" : "Statut Normalisé"}</th>
              <th className="px-4 py-3 text-start">{isArabic ? "نتيجة المعالجة" : "Résultat Traitement"}</th>
              <th className="px-4 py-3 text-end">{isArabic ? "البيانات الخام" : "Payload"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 font-mono">
            {events.map((evt) => (
              <tr key={evt.id} className="hover:bg-neutral-50/60">
                <td className="px-4 py-3">
                  <div className="font-bold text-neutral-900 font-sans flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>{evt.provider}</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {formatDateTime(evt.createdAt, lang)}
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-neutral-900">
                  {evt.trackingNumber}
                  {evt.providerEventId && (
                    <div className="text-[10px] text-neutral-400 font-normal">
                      ID: {evt.providerEventId}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-sans text-neutral-700">
                  <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 text-[11px]">
                    {evt.receivedStatus}
                  </span>
                </td>
                <td className="px-4 py-3 font-sans font-semibold text-neutral-900">
                  {evt.normalizedStatus}
                </td>
                <td className="px-4 py-3 font-sans">
                  {getStatusBadge(evt.processingStatus)}
                  {evt.errorMessage && (
                    <div className="text-[10px] text-rose-600 mt-1 line-clamp-1 max-w-[200px]" title={evt.errorMessage}>
                      {evt.errorMessage}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-end font-sans">
                  {evt.rawPayload && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPayload(evt.rawPayload || "")}
                      className="h-7 px-2 text-xs text-neutral-600 hover:text-neutral-900"
                    >
                      <Eye className="w-3.5 h-3.5 me-1" />
                      JSON
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Raw Payload Modal */}
      <Modal
        isOpen={!!selectedPayload}
        onClose={() => setSelectedPayload(null)}
        title={isArabic ? "بيانات الويب هوك الخام (Raw JSON)" : "Payload Brut du Webhook"}
        maxWidth="lg"
      >
        <div className="p-4 bg-neutral-950 text-emerald-400 rounded-lg font-mono text-xs overflow-x-auto max-h-96">
          <pre>
            {selectedPayload
              ? (() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedPayload), null, 2);
                  } catch {
                    return selectedPayload;
                  }
                })()
              : ""}
          </pre>
        </div>
      </Modal>
    </>
  );
}
