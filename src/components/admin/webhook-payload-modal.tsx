"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Language } from "@/lib/locales";
import { WebhookEventItem } from "@/lib/api-client";
import { formatDateTime } from "@/lib/formatters";
import { Radio, Copy, Check, X, FileCode } from "lucide-react";

interface WebhookPayloadModalProps {
  event: WebhookEventItem | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export function WebhookPayloadModal({
  event,
  isOpen,
  onClose,
  lang = "fr",
}: WebhookPayloadModalProps) {
  const [copied, setCopied] = useState(false);
  const isArabic = lang === "ar";
  const isEnglish = lang === "en";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const formattedJson = (() => {
    if (!event.rawPayload) return "{}";
    try {
      return JSON.stringify(JSON.parse(event.rawPayload), null, 2);
    } catch {
      return event.rawPayload;
    }
  })();

  const handleCopyJson = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 [overscroll-behavior:contain]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="webhook-payload-modal-title"
      data-testid="webhook-payload-modal"
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-black/[0.08] overflow-hidden text-start animate-in zoom-in-95 duration-200 flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] [overscroll-behavior:contain]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="webhook-payload-modal-title"
                className="text-sm font-bold text-neutral-900 tracking-tight"
              >
                {isArabic
                  ? "بيانات الويب هوك الخام (Payload JSON)"
                  : isEnglish
                  ? "Raw Webhook Payload (JSON)"
                  : "Payload Brut du Webhook"}
              </h2>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                {event.provider} &bull;{" "}
                <span dir="ltr">{event.trackingNumber}</span> &bull;{" "}
                {formatDateTime(event.createdAt, lang)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label={isArabic ? "إغلاق" : isEnglish ? "Close" : "Fermer"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {isArabic ? "الحمولة المشفرة / المستلمة" : isEnglish ? "Received JSON Payload" : "JSON Payload Reçu"}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyJson}
              className="text-xs h-7 px-2.5 gap-1.5"
              data-testid="copy-payload-btn"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">
                    {isArabic ? "تم النسخ" : isEnglish ? "Copied" : "Copié"}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{isArabic ? "نسخ JSON" : isEnglish ? "Copy JSON" : "Copier le JSON"}</span>
                </>
              )}
            </Button>
          </div>

          <div
            className="p-4 bg-neutral-950 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto max-h-[420px] border border-neutral-800"
            dir="ltr"
          >
            <pre className="whitespace-pre">{formattedJson}</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50/50 border-t border-neutral-100 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            {isArabic ? "إغلاق" : isEnglish ? "Close" : "Fermer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
