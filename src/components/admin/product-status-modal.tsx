"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Language } from "@/lib/locales";
import { apiUpdateProductStatus, AdminProductItem } from "@/lib/api-client";
import { AlertTriangle, ShieldCheck, Archive, X, AlertCircle } from "lucide-react";

export type ProductTargetStatus = "active" | "suspended" | "archived";

interface ProductStatusModalProps {
  product: AdminProductItem | null;
  targetStatus: ProductTargetStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: Language;
}

const statusModalTranslations = {
  fr: {
    titles: {
      active: "Réactiver le Produit",
      suspended: "Suspendre Opérationnellement",
      archived: "Archiver le Produit",
    },
    activeHelp:
      "Le produit sera réactivé dans le catalogue après vérification du stock et de la couverture escrow.",
    suspendedHelp:
      "Le motif de suspension est obligatoire pour l'audit et sera consigné dans l'historique administratif.",
    suspendedReasonLabel: "Motif obligatoire de la suspension",
    suspendedReasonPlaceholder:
      "Ex: Taux de retour excessif, rupture fournisseur non déclarée, solde escrow insuffisant...",
    suspendedNotice:
      "Le produit sera masqué du marketplace sans impacter les commandes en cours d'acheminement.",
    archivedHelp:
      "Attention : L'archivage est définitif et retirera l'article de tous les flux opérationnels.",
    errReasonRequired: "Le motif de suspension est obligatoire",
    btnCancel: "Annuler",
    btnConfirm: "Confirmer",
    submitting: "Traitement...",
  },
  en: {
    titles: {
      active: "Reactivate Product",
      suspended: "Suspend Product Operations",
      archived: "Archive Product",
    },
    activeHelp:
      "The product will be restored to the catalog after validating stock and escrow coverage.",
    suspendedHelp:
      "Suspension reason is required for administrative audit logs.",
    suspendedReasonLabel: "Suspension Reason (Required)",
    suspendedReasonPlaceholder:
      "e.g. High return rate, unreported stock deficit, insufficient escrow...",
    suspendedNotice:
      "The product will be hidden from the marketplace without affecting in-flight orders.",
    archivedHelp:
      "Warning: Archival is permanent and removes the product from all operational queues.",
    errReasonRequired: "Suspension reason is required",
    btnCancel: "Cancel",
    btnConfirm: "Confirm",
    submitting: "Processing...",
  },
  ar: {
    titles: {
      active: "إعادة تفعيل المنتج",
      suspended: "تعليق تشغيلي للمنتج",
      archived: "أرشفة المنتج",
    },
    activeHelp:
      "سيتم التحقق من توفر المخزون ورصيد ضمان المورد وإعادة إتاحة المنتج في سوق المسوقين.",
    suspendedHelp:
      "سبب التعليق إلزامي لتوثيق الإجراء في سجل التدقيق الإداري.",
    suspendedReasonLabel: "سبب التعليق التشغيلي (إلزامي)",
    suspendedReasonPlaceholder:
      "مثال: نسبة مرتجعات مرتفعة، شكاوى متكررة، رصيد ضمان غير كاف...",
    suspendedNotice:
      "سيتم إخفاء المنتج فوراً من متجر المسوقين مع الحفاظ على الطلبيات القائمة في مسار الشحن.",
    archivedHelp:
      "تحذير: أرشفة المنتج إجراء نهائي وسيمنع استخدامه أو إظهاره مجدداً للمسوقين.",
    errReasonRequired: "سبب التعليق التشغيلي إلزامي للتدقيق الإداري",
    btnCancel: "إلغاء",
    btnConfirm: "تأكيد",
    submitting: "جار المعالجة...",
  },
};

export function ProductStatusModal({
  product,
  targetStatus,
  isOpen,
  onClose,
  onSuccess,
  lang = "fr",
}: ProductStatusModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !product || !targetStatus) return null;

  const currentLang = lang === "ar" || lang === "en" || lang === "fr" ? lang : "fr";
  const tr = statusModalTranslations[currentLang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetStatus === "suspended" && !reason.trim()) {
      setError(tr.errReasonRequired);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await apiUpdateProductStatus(product.id, targetStatus, reason.trim() || undefined);
      setReason("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la mise à jour du statut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = () => {
    switch (targetStatus) {
      case "active":
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case "suspended":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "archived":
        return <Archive className="w-5 h-5 text-rose-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-status-modal-title"
        className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-lg w-full max-h-[min(92vh,calc(100dvh-2rem))] overflow-y-auto p-5 sm:p-6 text-start relative animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label={tr.btnCancel}
          className="absolute top-5 end-5 p-1 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="product-status-modal-title" className="text-lg font-bold text-neutral-900 mb-1">
          {tr.titles[targetStatus]}
        </h3>
        <p className="text-xs text-[#6b6b6b] mb-4">
          ID: <span className="font-mono text-neutral-700">{product.id.slice(0, 8)}</span> &bull;{" "}
          <span className="font-semibold text-neutral-900">{product.name}</span>
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
            <div className="shrink-0 mt-0.5">{getIcon()}</div>
            <div className="text-xs text-neutral-700">
              <p className="font-semibold text-neutral-900">{product.name}</p>
              <p className="text-neutral-500 font-mono mt-0.5">ID: {product.id}</p>
            </div>
          </div>

          {targetStatus === "suspended" && (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                {tr.suspendedHelp}
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  {tr.suspendedReasonLabel}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={tr.suspendedReasonPlaceholder}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs rounded-xl border border-black/10 bg-white p-3 text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
                />
                <p className="text-[11px] text-neutral-500 mt-1">{tr.suspendedNotice}</p>
              </div>
            </div>
          )}

          {targetStatus === "active" && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
              {tr.activeHelp}
            </div>
          )}

          {targetStatus === "archived" && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed">
              {tr.archivedHelp}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs px-4 py-2"
            >
              {tr.btnCancel}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              variant={targetStatus === "suspended" ? "danger" : "primary"}
              className="text-xs px-4 py-2"
            >
              {isSubmitting ? tr.submitting : tr.btnConfirm}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
