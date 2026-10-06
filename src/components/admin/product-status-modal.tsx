"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Language } from "@/lib/locales";
import { apiUpdateProductStatus, AdminProductItem } from "@/lib/api-client";
import { AlertTriangle, ShieldCheck, Archive } from "lucide-react";

export type ProductTargetStatus = "active" | "suspended" | "archived";

interface ProductStatusModalProps {
  product: AdminProductItem | null;
  targetStatus: ProductTargetStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: Language;
}

export function ProductStatusModal({
  product,
  targetStatus,
  isOpen,
  onClose,
  onSuccess,
  lang,
}: ProductStatusModalProps) {
  const isArabic = lang === "ar";
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!product || !targetStatus) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetStatus === "suspended" && !reason.trim()) {
      setError(
        isArabic
          ? "سبب التعليق التشغيلي إلزامي للتدقيق الإداري."
          : "Le motif de suspension est obligatoire pour l'audit."
      );
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

  const getTitle = () => {
    switch (targetStatus) {
      case "active":
        return isArabic ? "إعادة تفعيل المنتج" : "Réactiver le Produit";
      case "suspended":
        return isArabic ? "تعليق تشغيلي للمنتج" : "Suspendre Opérationnellement";
      case "archived":
        return isArabic ? "أرشفة المنتج" : "Archiver le Produit";
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
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-start">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
          <div className="shrink-0 mt-0.5">{getIcon()}</div>
          <div className="text-xs text-neutral-700">
            <p className="font-semibold text-neutral-900">{product.name}</p>
            <p className="text-neutral-500 font-mono mt-0.5">ID: {product.id}</p>
          </div>
        </div>

        {targetStatus === "suspended" && (
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              {isArabic ? "سبب التعليق (مطلوب)" : "Motif de Suspension (Obligatoire)"}
            </label>
            <textarea
              rows={3}
              required
              placeholder={
                isArabic
                  ? "مثال: عدم تطابق جودة المنتج، شكاوى متكررة من الزبائن، رصيد ضمان غير كاف..."
                  : "Ex: Taux de retour anormal, défauts qualité signalés, solde escrow insuffisant..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 resize-none"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              {isArabic
                ? "سيتم إخفاء المنتج فوراً من متجر المسوقين مع الحفاظ على الطلبيات القائمة."
                : "Le produit sera masqué du marketplace sans impacter les commandes en cours."}
            </p>
          </div>
        )}

        {targetStatus === "active" && (
          <p className="text-xs text-neutral-600">
            {isArabic
              ? "سيتم التحقق من توفر المخزون ورصيد ضمان المورد وإعادة إتاحة المنتج في سوق المسوقين."
              : "Le produit sera réactivé après vérification du stock et de la couverture escrow."}
          </p>
        )}

        {targetStatus === "archived" && (
          <p className="text-xs text-rose-600">
            {isArabic
              ? "تحذير: أرشفة المنتج ستمنع استخدامه أو إظهاره مجدداً للمسوقين."
              : "Attention: L'archivage est définitif et retirera l'article de tous les flux."}
          </p>
        )}

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            {isArabic ? "إلغاء" : "Annuler"}
          </Button>
          <Button
            type="submit"
            variant={targetStatus === "suspended" ? "danger" : "primary"}
            size="sm"
            disabled={isSubmitting}
            className="text-xs"
          >
            {isSubmitting
              ? isArabic
                ? "جاري الحفظ..."
                : "Traitement..."
              : isArabic
              ? "تأكيد"
              : "Confirmer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
