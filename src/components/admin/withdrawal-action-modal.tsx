"use client";

import React, { useState } from "react";
import { AdminWithdrawal, apiApproveWithdrawal, apiRejectWithdrawal, apiMarkWithdrawalPaid, apiMarkWithdrawalFailed } from "@/lib/api-client";
import { formatDZD } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, XCircle, AlertCircle, Send, DollarSign } from "lucide-react";

export type WithdrawalModalAction = "APPROVE" | "REJECT" | "PAID" | "FAILED";

interface Props {
  withdrawal: AdminWithdrawal;
  action: WithdrawalModalAction;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang?: "fr" | "ar" | "en";
}

export function WithdrawalActionModal({
  withdrawal,
  action,
  isOpen,
  onClose,
  onSuccess,
  lang = "fr",
}: Props) {
  const [reason, setReason] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (action === "APPROVE") {
        await apiApproveWithdrawal(withdrawal.id, adminNote || undefined);
      } else if (action === "REJECT") {
        if (!reason.trim()) {
          setError(lang === "ar" ? "يرجى تحديد سبب الرفض" : "Le motif de rejet est obligatoire");
          setIsSubmitting(false);
          return;
        }
        await apiRejectWithdrawal(withdrawal.id, reason.trim());
      } else if (action === "PAID") {
        if (!paymentReference.trim()) {
          setError(lang === "ar" ? "يرجى إدخال رقم الحوالة أو وصل الدفع" : "Le numéro de virement/référence est obligatoire");
          setIsSubmitting(false);
          return;
        }
        await apiMarkWithdrawalPaid(withdrawal.id, paymentReference.trim(), adminNote || undefined);
      } else if (action === "FAILED") {
        if (!reason.trim()) {
          setError(lang === "ar" ? "يرجى تحديد سبب الفشل" : "Le motif d'échec est obligatoire");
          setIsSubmitting(false);
          return;
        }
        await apiMarkWithdrawalFailed(withdrawal.id, reason.trim());
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue lors du traitement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (action) {
      case "APPROVE":
        return lang === "ar" ? "تأكيد الموافقة على السحب" : "Approuver la Demande de Retrait";
      case "REJECT":
        return lang === "ar" ? "رفض طلب السحب واسترجاع الرصيد" : "Rejeter le Retrait & Rembourser le Solde";
      case "PAID":
        return lang === "ar" ? "تأكيد إتمام التحويل (CCP / BaridiMob)" : "Confirmer le Virement Bancaire / CCP";
      case "FAILED":
        return lang === "ar" ? "الإبلاغ عن فشل التحويل واسترجاع الرصيد" : "Déclarer l'Échec & Rembourser";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-lg w-full p-6 text-start relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 end-5 p-1 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-neutral-900 mb-1">{getTitle()}</h3>
        <p className="text-xs text-[#6b6b6b] mb-4">
          ID: <span className="font-mono text-neutral-700">{withdrawal.id.slice(0, 8)}</span> •{" "}
          {withdrawal.fullName || withdrawal.userEmail} •{" "}
          <span className="font-mono font-bold text-neutral-900">{formatDZD(withdrawal.amount, lang)}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {action === "APPROVE" && (
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-sky-900 text-xs space-y-2">
              <p className="leading-relaxed">
                {lang === "ar"
                  ? "الموافقة تعني التحقق من شرعية الأرباح وتجهيز أمر الدفع للفريق المالي. لن يتم خصم الرصيد مرة أخرى."
                  : "L'approbation valide la conformité des commissions et prépare le paiement. Le solde a déjà été provisionné."}
              </p>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Note interne (optionnelle)</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ex: Conforme, prêt pour virement BaridiMob lot #12"
                  className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          {action === "REJECT" && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                {lang === "ar"
                  ? "سيتم استرجاع مبلغ السحب تلقائياً إلى محفظة المسوق عبر قيد مالي تعويضي في سجل الحسابات."
                  : "Le rejet recrédite automatiquement le solde de l'affilié via une écriture compensatoire dans le grand livre."}
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  {lang === "ar" ? "سبب الرفض (إلزامي)" : "Motif obligatoire du rejet"}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={lang === "ar" ? "مثال: رقم RIP خاطئ، يرجى تحديث بيانات الحساب..." : "Ex: Numéro RIP invalide, suspicion de commandes frauduleuses..."}
                  className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {action === "PAID" && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                {lang === "ar"
                  ? "أدخل رقم الحوالة البريدية أو المرجع البنكي لإثبات التحويل."
                  : "Saisissez la référence de la transaction CCP / BaridiMob (ex: numéro du récépissé)."}
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  {lang === "ar" ? "مرجع التحويل / رقم الوصل" : "Référence de Paiement (Reçu / Bordereau)"}
                </label>
                <input
                  type="text"
                  required
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ex: CCP-TX-84920491 ou BMOB-REC-9921"
                  className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Note admin additionnelle</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ex: Virement exécuté le 12/03 via bureau de poste Didouche"
                  className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {action === "FAILED" && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                {lang === "ar"
                  ? "الإبلاغ عن الفشل سيقوم تلقائياً بإرجاع المبلغ إلى محفظة المسوق."
                  : "Marquer l'échec va restaurer le solde de l'affilié par écriture compensatoire."}
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  {lang === "ar" ? "سبب الفشل" : "Motif de l'échec bancaire"}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Rejet postal pour compte bloqué..."
                  className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs px-4 py-2"
            >
              {lang === "ar" ? "إلغاء" : "Annuler"}
            </Button>

            {action === "APPROVE" && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-xs px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Traitement..." : lang === "ar" ? "تأكيد الموافقة" : "Confirmer l'Approbation"}</span>
              </Button>
            )}

            {action === "REJECT" && (
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="danger"
                className="text-xs px-4 py-2"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Traitement..." : lang === "ar" ? "تأكيد الرفض" : "Confirmer le Rejet"}</span>
              </Button>
            )}

            {action === "PAID" && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-xs px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Traitement..." : lang === "ar" ? "تأكيد الدفع" : "Marquer comme Payé"}</span>
              </Button>
            )}

            {action === "FAILED" && (
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="danger"
                className="text-xs px-4 py-2"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Traitement..." : lang === "ar" ? "تأكيد الفشل" : "Déclarer l'Échec"}</span>
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
