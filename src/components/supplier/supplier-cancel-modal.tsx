"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Language } from "@/lib/locales";
import { SupplierOrder } from "@/lib/api-client";
import { XCircle, AlertCircle, X } from "lucide-react";

interface SupplierCancelModalProps {
  order: SupplierOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  lang: Language;
}

const cancelModalTranslations = {
  fr: {
    title: "Annuler la Commande Lead",
    desc: "Vous annulez la commande d'un client. Choisissez le motif officiel pour l'historique et pour informer l'affilié :",
    customerPrefix: "Client :",
    destinationPrefix: "Wilaya :",
    reasons: [
      "Client injoignable après 3 tentatives d'appel",
      "Commande dupliquée / Erreur du client",
      "Client a changé d'avis / Refus d'achat",
      "Adresse ou Wilaya hors zone de couverture",
      "Autre",
    ],
    otherPlaceholder: "Précisez le motif exact...",
    errOtherRequired: "Veuillez préciser le motif personnalisé d'annulation.",
    cancel: "Retour",
    confirm: "Confirmer l'Annulation",
    submitting: "Traitement...",
  },
  en: {
    title: "Cancel Lead Order",
    desc: "You are canceling a customer order. Select the official reason for audit records and affiliate notification:",
    customerPrefix: "Customer:",
    destinationPrefix: "Wilaya:",
    reasons: [
      "Customer unreachable after 3 call attempts",
      "Duplicate order / Customer input error",
      "Customer changed mind / Refusal to buy",
      "Address or Wilaya outside delivery zone",
      "Other",
    ],
    otherPlaceholder: "Specify exact reason...",
    errOtherRequired: "Please specify the custom cancellation reason.",
    cancel: "Back",
    confirm: "Confirm Cancellation",
    submitting: "Processing...",
  },
  ar: {
    title: "إلغاء طلبية الزبون (Lead)",
    desc: "أنت على وشك إلغاء طلب الزبون. يُرجى تحديد السبب الرسمي لأرشفة الإجراء وإبلاغ المسوق بالعمولة:",
    customerPrefix: "الزبون:",
    destinationPrefix: "الولاية:",
    reasons: [
      "الزبون لا يرد بعد 3 محاولات اتصال هاتفية",
      "طلبية مكررة / خطأ في تسجيل البيانات",
      "الزبون تراجع عن الشراء / رفض الاستلام",
      "العنوان أو الولاية خارج نطاق تغطية التوصيل",
      "أخرى",
    ],
    otherPlaceholder: "حدد السبب بالتفصيل...",
    errOtherRequired: "يُرجى توضيح سبب الإلغاء.",
    cancel: "تراجع",
    confirm: "تأكيد الإلغاء",
    submitting: "جار المعالجة...",
  },
};

export function SupplierCancelModal({
  order,
  isOpen,
  onClose,
  onConfirm,
  lang = "fr",
}: SupplierCancelModalProps) {
  const t = cancelModalTranslations[lang] || cancelModalTranslations.fr;
  const isAr = lang === "ar";

  const [selectedReason, setSelectedReason] = useState(t.reasons[0]);
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(t.reasons[0]);
      setCustomReason("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, t.reasons]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isOther = selectedReason === t.reasons[4] || selectedReason === "Autre" || selectedReason === "Other" || selectedReason === "أخرى";
    const finalReason = isOther ? customReason.trim() : selectedReason;

    if (isOther && !finalReason) {
      setError(t.errOtherRequired);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(finalReason);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'annulation du lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 [overscroll-behavior:contain]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supplier-cancel-modal-title"
      data-testid="supplier-cancel-modal"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-black/[0.08] overflow-hidden text-start flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] [overscroll-behavior:contain] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="supplier-cancel-modal-title"
                className="text-sm font-bold text-neutral-900 tracking-tight"
              >
                {t.title}
              </h2>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body with Virtual Keyboard Scrolling Support */}
        <form noValidate onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
          {/* Target Customer pill */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs space-y-1">
            <div className="font-semibold text-neutral-900">
              {t.customerPrefix} {order.customerName}
            </div>
            <div className="text-neutral-500 text-[11px] flex items-center justify-between">
              <span>{t.destinationPrefix} W.{order.wilaya} ({order.commune})</span>
              <span dir="ltr" className="font-mono text-neutral-800">{order.customerPhone}</span>
            </div>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">{t.desc}</p>

          {/* Radio Options */}
          <div className="space-y-2">
            {t.reasons.map((reason, idx) => {
              const isSelected = selectedReason === reason;
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "border-rose-500 bg-rose-50/50 text-rose-950 font-semibold"
                      : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={isSelected}
                    onChange={() => {
                      setSelectedReason(reason);
                      if (error) setError(null);
                    }}
                    className="accent-rose-600"
                  />
                  <span>{reason}</span>
                </label>
              );
            })}

            {/* Custom reason input if "Autre" selected */}
            {(selectedReason === t.reasons[4] || selectedReason === "Autre" || selectedReason === "Other" || selectedReason === "أخرى") && (
              <div className="pt-1">
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={t.otherPlaceholder}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  data-testid="cancel-custom-reason-input"
                />
              </div>
            )}
          </div>

          {/* Error alert */}
          {error && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2"
              data-testid="cancel-error-alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={isSubmitting}
              className="text-xs"
              data-testid="confirm-cancel-lead-btn"
            >
              {isSubmitting ? t.submitting : t.confirm}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
