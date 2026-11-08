"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Language } from "@/lib/locales";
import { apiUpdateUserStatus, AdminUser } from "@/lib/api-client";
import { UserX, UserCheck, AlertTriangle, AlertCircle, X } from "lucide-react";

interface UserStatusModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: AdminUser) => void;
  lang: Language;
}

const userStatusTranslations = {
  fr: {
    titleSuspend: "Suspendre le Compte Utilisateur",
    titleActivate: "Réactiver le Compte Utilisateur",
    suspendWarning:
      "La suspension révoquera immédiatement la session de l'utilisateur et bloquera tout accès aux fonctionnalités de la plateforme.",
    activateNotice:
      "La réactivation restaurera l'accès au tableau de bord et autorisera de nouvelles transactions.",
    reasonLabel: "Motif obligatoire de suspension (Audit)",
    reasonPlaceholder:
      "Ex: Suspicion de faux leads, documents KYC non conformes, litige de paiement...",
    optionalNoteLabel: "Note d'audit (optionnelle)",
    optionalNotePlaceholder: "Ex: Résolution du litige, conformité validée...",
    quickReasons: [
      "Suspicion de fraude / Faux leads",
      "Non-conformité KYC / Documents",
      "Rupture de stock / Commandes non traitées",
      "Taux de retour anormalement élevé",
    ],
    errReasonRequired: "Le motif de suspension est obligatoire pour l'audit administratif.",
    cancel: "Annuler",
    confirmSuspend: "Confirmer la Suspension",
    confirmActivate: "Réactiver le Compte",
    processing: "Traitement en cours...",
  },
  en: {
    titleSuspend: "Suspend User Account",
    titleActivate: "Reactivate User Account",
    suspendWarning:
      "Suspending will immediately revoke the user's active session and block all platform access.",
    activateNotice:
      "Reactivation will restore dashboard access and permit new platform transactions.",
    reasonLabel: "Mandatory Suspension Reason (Audit Log)",
    reasonPlaceholder:
      "e.g. Fraud suspicion, invalid KYC documentation, payment dispute...",
    optionalNoteLabel: "Audit note (optional)",
    optionalNotePlaceholder: "e.g. Dispute resolved, verification completed...",
    quickReasons: [
      "Fraud suspicion / Fake leads",
      "KYC / Document non-compliance",
      "Stock deficit / Unfulfilled orders",
      "Abnormally high return rate",
    ],
    errReasonRequired: "Suspension reason is mandatory for the administrative audit log.",
    cancel: "Cancel",
    confirmSuspend: "Confirm Suspension",
    confirmActivate: "Reactivate Account",
    processing: "Processing...",
  },
  ar: {
    titleSuspend: "تعليق حساب المستخدم",
    titleActivate: "إعادة تفعيل حساب المستخدم",
    suspendWarning:
      "سيؤدي التعليق إلى إبطال جلسة المستخدم فوراً ومنع وصوله إلى أي من وظائف المنصة.",
    activateNotice:
      "ستؤدي إعادة التفعيل إلى استعادة وصول المستخدم إلى لوحة التحكم والسماح بالعمليات مجدداً.",
    reasonLabel: "سبب التعليق الإلزامي (سجل التدقيق)",
    reasonPlaceholder:
      "مثال: اشتباه في تسجيلات وهمية، وثائق غير مطابقة، نزاع مالي...",
    optionalNoteLabel: "ملاحظة تدقيق (اختيارية)",
    optionalNotePlaceholder: "مثال: تم التحقق من الوثائق بنجاح...",
    quickReasons: [
      "اشتباه في احتيال / تسجيلات وهمية",
      "عدم مطابقة وثائق الهوية (KYC)",
      "نفاد مخزون / تأخير في الشحن",
      "نسبة إرجاع غير طبيعية",
    ],
    errReasonRequired: "سبب التعليق إلزامي لتوثيق الإجراء في سجل التدقيق الإداري.",
    cancel: "إلغاء",
    confirmSuspend: "تأكيد التعليق",
    confirmActivate: "تفعيل الحساب",
    processing: "جار المعالجة...",
  },
};

export function UserStatusModal({
  user,
  isOpen,
  onClose,
  onSuccess,
  lang = "fr",
}: UserStatusModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = userStatusTranslations[lang] || userStatusTranslations.fr;
  const isSuspending = user ? user.isActive : false;

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle escape key dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSuspending && !reason.trim()) {
      setError(t.errReasonRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      const newStatus = !user.isActive;
      await apiUpdateUserStatus(user.id, newStatus, reason.trim() || undefined);
      onSuccess({
        ...user,
        isActive: newStatus,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la mise à jour du statut.");
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
      aria-labelledby="user-status-modal-title"
      data-testid="user-status-modal"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-black/[0.08] overflow-hidden text-start animate-in zoom-in-95 duration-200 flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] [overscroll-behavior:contain]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isSuspending
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {isSuspending ? (
                <UserX className="w-5 h-5" />
              ) : (
                <UserCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2
                id="user-status-modal-title"
                className="text-sm font-bold text-neutral-900 tracking-tight"
              >
                {isSuspending ? t.titleSuspend : t.titleActivate}
              </h2>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                {user.email} &bull; <span dir="ltr">{user.id.slice(0, 8)}</span>
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
        <form noValidate onSubmit={handleSubmit} className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
          {/* User Target Card */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs space-y-1">
            <div className="font-semibold text-neutral-900">
              {user.fullName || (lang === "ar" ? "بدون اسم" : lang === "en" ? "Not specified" : "Non spécifié")}
            </div>
            <div className="flex items-center justify-between text-neutral-500 font-mono text-[11px]">
              <span>{user.role}</span>
              <span className="font-bold text-neutral-900">{user.balance.toLocaleString()} DZD</span>
            </div>
          </div>

          {/* Operational Banner */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              isSuspending
                ? "bg-rose-50/70 border-rose-200/80 text-rose-800"
                : "bg-emerald-50/70 border-emerald-200/80 text-emerald-800"
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              {isSuspending ? t.suspendWarning : t.activateNotice}
            </p>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="status-reason-input"
              className="block text-xs font-semibold text-neutral-900"
            >
              {isSuspending ? t.reasonLabel : t.optionalNoteLabel}
            </label>
            <textarea
              id="status-reason-input"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder={
                isSuspending ? t.reasonPlaceholder : t.optionalNotePlaceholder
              }
              className={`w-full p-2.5 text-xs rounded-xl border bg-white focus:outline-hidden focus:ring-2 transition-all resize-none ${
                error
                  ? "border-rose-400 focus:ring-rose-200"
                  : "border-neutral-200 focus:border-black focus:ring-black/5"
              }`}
              data-testid="suspension-reason-input"
            />
          </div>

          {/* Quick Reasons (only when suspending) */}
          {isSuspending && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">
                {lang === "ar" ? "أسباب سريعة" : lang === "en" ? "Quick reasons" : "Motifs rapides"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {t.quickReasons.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => {
                      setReason(qr);
                      if (error) setError(null);
                    }}
                    className="text-[10px] px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md transition-colors"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2"
              data-testid="status-modal-error"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
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
              variant={isSuspending ? "danger" : "primary"}
              size="sm"
              disabled={isSubmitting}
              className={`text-xs ${
                !isSuspending
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : ""
              }`}
              data-testid="confirm-status-btn"
            >
              {isSubmitting
                ? t.processing
                : isSuspending
                ? t.confirmSuspend
                : t.confirmActivate}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
