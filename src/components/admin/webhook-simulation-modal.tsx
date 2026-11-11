"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Language } from "@/lib/locales";
import { apiSimulateCourierWebhook } from "@/lib/api-client";
import { Radio, Truck, CheckCircle2, AlertCircle, X, Send } from "lucide-react";

interface WebhookSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trackingNumber: string, status: "Livre" | "Retour") => void;
  lang: Language;
}

const simulationTranslations = {
  fr: {
    title: "Simuler un Webhook Transporteur",
    desc: "Envoyez une notification de livraison ou d'échec simulée pour tester la transition d'état et le déblocage des commissions.",
    providerLabel: "Transporteur Logistique",
    trackingLabel: "Numéro de Suivi (Tracking)",
    trackingPlaceholder: "Ex: YAL-ALG-987456, ZR-ORN-12345, NOE-..., ECO-...",
    statusLabel: "Événement Reçu",
    delivered: "Livré (Livre)",
    deliveredDesc: "Déclenche le passage à 'delivered' et le déblocage du CPA affilié.",
    returned: "Retour / Échec (Retour)",
    returnedDesc: "Déclenche le passage à 'returned' et l'annulation des commissions.",
    errTrackingRequired: "Le numéro de suivi est requis.",
    cancel: "Annuler",
    send: "Émettre l'Événement",
    sending: "Envoi en cours...",
  },
  en: {
    title: "Simulate Courier Webhook",
    desc: "Send a mock delivery or return signal to test order state progression and affiliate payout release.",
    providerLabel: "Courier Logistics Provider",
    trackingLabel: "Tracking Number",
    trackingPlaceholder: "e.g. YAL-ALG-987456, ZR-ORN-12345, NOE-..., ECO-...",
    statusLabel: "Inbound Status Event",
    delivered: "Delivered (Livre)",
    deliveredDesc: "Transitions order to 'delivered' and unlocks affiliate CPA payout.",
    returned: "Returned / Failed (Retour)",
    returnedDesc: "Transitions order to 'returned' and reverses commission ledger.",
    errTrackingRequired: "Tracking number is required.",
    cancel: "Cancel",
    send: "Dispatch Webhook",
    sending: "Dispatching...",
  },
  ar: {
    title: "محاكاة إشعار شركة الشحن (Webhook)",
    desc: "إرسال إشارة توصيل أو إرجاع تجريبية لاختبار دورة حياة الطلبية وتسوية عمولة المسوق.",
    providerLabel: "شركة التوصيل",
    trackingLabel: "رقم التتبع (Tracking)",
    trackingPlaceholder: "مثال: YAL-ALG-987456, ZR-ORN-12345, NOE-..., ECO-...",
    statusLabel: "حالة الإشعار الوارد",
    delivered: "تم التوصيل (Livre)",
    deliveredDesc: "ينقل الطلبية إلى 'تم التوصيل' ويحرر عمولة المسوق في المحفظة.",
    returned: "مرتجع / فشل (Retour)",
    returnedDesc: "ينقل الطلبية إلى 'مرتجع' ويوقف صرف العمولة.",
    errTrackingRequired: "رقم التتبع إلزامي لإجراء المحاكاة.",
    cancel: "إلغاء",
    send: "إرسال الإشعار",
    sending: "جار الإرسال...",
  },
};

export const COURIER_PROVIDERS = [
  { id: "yalidine", name: "Yalidine", colorClass: "border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500/20" },
  { id: "zr_express", name: "ZR Express", colorClass: "border-amber-600 bg-amber-50/70 text-amber-900 ring-1 ring-amber-500/20" },
  { id: "noest", name: "Noest", colorClass: "border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-500/20" },
  { id: "ecotrack", name: "Ecotrack", colorClass: "border-purple-600 bg-purple-50/70 text-purple-900 ring-1 ring-purple-500/20" },
  { id: "maystro", name: "Maystro", colorClass: "border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-500/20" },
  { id: "guepex", name: "Guepex", colorClass: "border-cyan-600 bg-cyan-50/70 text-cyan-900 ring-1 ring-cyan-500/20" },
] as const;

export type CourierProviderType = (typeof COURIER_PROVIDERS)[number]["id"];

export function WebhookSimulationModal({
  isOpen,
  onClose,
  onSuccess,
  lang = "fr",
}: WebhookSimulationModalProps) {
  const [provider, setProvider] = useState<CourierProviderType>("yalidine");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState<"Livre" | "Retour">("Livre");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = simulationTranslations[lang] || simulationTranslations.fr;

  useEffect(() => {
    if (isOpen) {
      setTrackingNumber("");
      setStatus("Livre");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError(t.errTrackingRequired);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiSimulateCourierWebhook(trackingNumber.trim(), status, provider);
      onSuccess(trackingNumber.trim(), status);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'émission du webhook.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 [overscroll-behavior:contain]"
      onClick={() => !isSubmitting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="webhook-simulation-modal-title"
      data-testid="simulate-webhook-modal"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-black/[0.08] overflow-hidden text-start animate-in zoom-in-95 duration-200 flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] [overscroll-behavior:contain]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="webhook-simulation-modal-title"
                className="text-sm font-bold text-neutral-900 tracking-tight"
              >
                {t.title}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                DZ Logistics Gateway Telemetry
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

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
          <p className="text-xs text-neutral-600 leading-relaxed">{t.desc}</p>

          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-900 block">
              {t.providerLabel}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COURIER_PROVIDERS.map((p) => {
                const isSelected = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? p.colorClass
                        : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <Truck className={`w-3.5 h-3.5 ${isSelected ? "text-current" : "text-neutral-400"}`} />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tracking Number Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="sim-tracking-input"
              className="text-xs font-semibold text-neutral-900 block"
            >
              {t.trackingLabel}
            </label>
            <Input
              id="sim-tracking-input"
              type="text"
              value={trackingNumber}
              onChange={(e) => {
                setTrackingNumber(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t.trackingPlaceholder}
              className="text-xs font-mono min-h-[40px]"
              dir="ltr"
              data-testid="simulate-tracking-input"
            />
          </div>

          {/* Status Event Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-900 block">
              {t.statusLabel}
            </label>
            <div className="space-y-2">
              <div
                onClick={() => setStatus("Livre")}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  status === "Livre"
                    ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-500/20"
                    : "border-neutral-200 hover:bg-neutral-50"
                }`}
                data-testid="simulate-status-delivered"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-neutral-900">
                    {t.delivered}
                  </span>
                  {status === "Livre" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">{t.deliveredDesc}</p>
              </div>

              <div
                onClick={() => setStatus("Retour")}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  status === "Retour"
                    ? "border-rose-600 bg-rose-50/60 ring-1 ring-rose-500/20"
                    : "border-neutral-200 hover:bg-neutral-50"
                }`}
                data-testid="simulate-status-returned"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-neutral-900">
                    {t.returned}
                  </span>
                  {status === "Retour" && (
                    <CheckCircle2 className="w-4 h-4 text-rose-600" />
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">{t.returnedDesc}</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2"
              data-testid="simulate-error-alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
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
              size="sm"
              disabled={isSubmitting}
              className="text-xs bg-neutral-900 hover:bg-black text-white gap-1.5"
              data-testid="confirm-simulation-btn"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? t.sending : t.send}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
