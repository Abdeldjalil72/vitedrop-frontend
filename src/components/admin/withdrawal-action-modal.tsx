"use client";

import React, { useState } from "react";
import { AdminWithdrawal, apiApproveWithdrawal, apiRejectWithdrawal, apiMarkWithdrawalPaid, apiMarkWithdrawalFailed } from "@/lib/api-client";
import { formatDZD } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, XCircle, AlertCircle, Send } from "lucide-react";

export type WithdrawalModalAction = "APPROVE" | "REJECT" | "PAID" | "FAILED";

interface Props {
  withdrawal: AdminWithdrawal;
  action: WithdrawalModalAction;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang?: "fr" | "ar" | "en";
}

const modalTranslations = {
  fr: {
    titles: {
      APPROVE: "Approuver la Demande de Retrait",
      REJECT: "Rejeter le Retrait",
      PAID: "Confirmer le Virement Bancaire / CCP",
      FAILED: "Déclarer l'Échec du Retrait",
    },
    approveHelp: "L'approbation valide la conformité des commissions et prépare le paiement. Le solde sera déduit dès la confirmation du paiement.",
    adminNoteLabel: "Note interne (optionnelle)",
    adminNotePlaceholder: "Ex: Conforme, prêt pour virement BaridiMob lot #12",
    rejectHelp: "Le rejet annule la demande sans déduire de solde de l'affilié.",
    rejectReasonLabel: "Motif obligatoire du rejet",
    rejectReasonPlaceholder: "Ex: Numéro RIP invalide, suspicion de commandes frauduleuses...",
    paidHelp: "Saisissez la référence de la transaction CCP / BaridiMob (ex: numéro du récépissé). Le montant sera débité du solde de l'affilié.",
    paidRefLabel: "Référence de Paiement (Reçu / Bordereau)",
    paidRefPlaceholder: "Ex: CCP-TX-84920491 ou BMOB-REC-9921",
    paidNotePlaceholder: "Ex: Virement exécuté le 12/03 via bureau de poste Didouche",
    failedHelp: "Marquer l'échec annule la tentative sans modification du solde.",
    failedReasonLabel: "Motif de l'échec bancaire",
    failedReasonPlaceholder: "Ex: Rejet postal pour compte bloqué...",
    btnCancel: "Annuler",
    btnApprove: "Confirmer l'Approbation",
    btnReject: "Confirmer le Rejet",
    btnPaid: "Marquer comme Payé",
    btnFailed: "Déclarer l'Échec",
    submitting: "Traitement...",
    errRejectRequired: "Le motif de rejet est obligatoire",
    errPaidRequired: "Le numéro de virement/référence est obligatoire",
    errFailedRequired: "Le motif d'échec est obligatoire",
    errGeneric: "Une erreur est survenue lors du traitement",
  },
  en: {
    titles: {
      APPROVE: "Approve Withdrawal Request",
      REJECT: "Reject Withdrawal",
      PAID: "Confirm Bank / CCP Transfer",
      FAILED: "Mark as Failed",
    },
    approveHelp: "Approval verifies commission compliance and queues disbursement. Balance will be deducted upon final payment.",
    adminNoteLabel: "Internal note (optional)",
    adminNotePlaceholder: "e.g. Verified, ready for BaridiMob payout batch #12",
    rejectHelp: "Rejection cancels the request without deducting any balance.",
    rejectReasonLabel: "Rejection reason (required)",
    rejectReasonPlaceholder: "e.g. Invalid RIP number, suspicious order pattern...",
    paidHelp: "Enter the CCP / BaridiMob payment receipt or bank reference code. The withdrawal amount will be debited upon confirmation.",
    paidRefLabel: "Payment Reference (Receipt / Voucher)",
    paidRefPlaceholder: "e.g. CCP-TX-84920491 or BMOB-REC-9921",
    paidNotePlaceholder: "e.g. Transfer completed via post office Didouche",
    failedHelp: "Marking as failed cancels the attempt without balance deduction.",
    failedReasonLabel: "Failure reason",
    failedReasonPlaceholder: "e.g. Postal rejection due to frozen account...",
    btnCancel: "Cancel",
    btnApprove: "Confirm Approval",
    btnReject: "Confirm Rejection",
    btnPaid: "Mark as Paid",
    btnFailed: "Declare Failure",
    submitting: "Processing...",
    errRejectRequired: "Rejection reason is required",
    errPaidRequired: "Payment reference is required",
    errFailedRequired: "Failure reason is required",
    errGeneric: "An error occurred during processing",
  },
  ar: {
    titles: {
      APPROVE: "تأكيد الموافقة على السحب",
      REJECT: "رفض طلب السحب",
      PAID: "تأكيد إتمام التحويل (CCP / BaridiMob)",
      FAILED: "الإبلاغ عن فشل التحويل",
    },
    approveHelp: "الموافقة تعني التحقق من شرعية الأرباح وتجهيز أمر الدفع. سيتم خصم المبلغ من الرصيد عند تأكيد الدفع الفعلي.",
    adminNoteLabel: "ملاحظة داخلية (اختيارية)",
    adminNotePlaceholder: "مثال: مراجع وجاهز للتحويل عبر بريدي موب دفعة #12",
    rejectHelp: "رفض الطلب يلغي العملية دون أي خصم من رصيد المسوق.",
    rejectReasonLabel: "سبب الرفض (إلزامي)",
    rejectReasonPlaceholder: "مثال: رقم RIP خاطئ، يرجى تحديث بيانات الحساب...",
    paidHelp: "أدخل رقم الحوالة البريدية أو المرجع البنكي لإثبات التحويل. سيتم خصم المبلغ من رصيد المسوق.",
    paidRefLabel: "مرجع التحويل / رقم الوصل",
    paidRefPlaceholder: "مثال: CCP-TX-84920491 أو BMOB-REC-9921",
    paidNotePlaceholder: "مثال: تم التحويل بنجاح من مكتب بريد ديدوش",
    failedHelp: "الإبلاغ عن الفشل يلغي العملية دون أي خصم من رصيد المسوق.",
    failedReasonLabel: "سبب الفشل",
    failedReasonPlaceholder: "مثال: رفض بريدي بسبب تجميد الحساب...",
    btnCancel: "إلغاء",
    btnApprove: "تأكيد الموافقة",
    btnReject: "تأكيد الرفض",
    btnPaid: "تأكيد الدفع",
    btnFailed: "تأكيد الفشل",
    submitting: "جار المعالجة...",
    errRejectRequired: "يرجى تحديد سبب الرفض",
    errPaidRequired: "يرجى إدخال رقم الحوالة أو وصل الدفع",
    errFailedRequired: "يرجى تحديد سبب الفشل",
    errGeneric: "حدث خطأ أثناء معالجة الطلب",
  },
};

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


  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const currentLang = (lang === "ar" || lang === "en" || lang === "fr") ? lang : "fr";
  const tr = modalTranslations[currentLang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (action === "APPROVE") {
        await apiApproveWithdrawal(withdrawal.id, adminNote || undefined);
      } else if (action === "REJECT") {
        if (!reason.trim()) {
          setError(tr.errRejectRequired);
          setIsSubmitting(false);
          return;
        }
        await apiRejectWithdrawal(withdrawal.id, reason.trim());
      } else if (action === "PAID") {
        if (!paymentReference.trim()) {
          setError(tr.errPaidRequired);
          setIsSubmitting(false);
          return;
        }
        await apiMarkWithdrawalPaid(withdrawal.id, paymentReference.trim(), adminNote || undefined);
      } else if (action === "FAILED") {
        if (!reason.trim()) {
          setError(tr.errFailedRequired);
          setIsSubmitting(false);
          return;
        }
        await apiMarkWithdrawalFailed(withdrawal.id, reason.trim());
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tr.errGeneric;
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs [overscroll-behavior:contain]"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdrawal-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-lg w-full max-h-[min(92vh,calc(100dvh-2rem))] overflow-y-auto p-5 sm:p-6 text-start relative animate-in fade-in zoom-in-95 duration-150 [overscroll-behavior:contain]"
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

        <h3 id="withdrawal-modal-title" className="text-lg font-bold text-neutral-900 mb-1">{tr.titles[action]}</h3>
        <p className="text-xs text-[#6b6b6b] mb-4">
          ID: <span className="font-mono text-neutral-700">{withdrawal.id.slice(0, 8)}</span> •{" "}
          {withdrawal.fullName || withdrawal.userEmail} •{" "}
          <span className="font-mono font-bold text-neutral-900">{formatDZD(withdrawal.amount, lang)}</span>
        </p>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {action === "APPROVE" && (
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-sky-900 text-xs space-y-2">
              <p className="leading-relaxed">{tr.approveHelp}</p>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">{tr.adminNoteLabel}</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={tr.adminNotePlaceholder}
                  className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          {action === "REJECT" && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                {tr.rejectHelp}
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  {tr.rejectReasonLabel}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={tr.rejectReasonPlaceholder}
                  className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {action === "PAID" && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                {tr.paidHelp}
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  {tr.paidRefLabel}
                </label>
                <input
                  type="text"
                  required
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder={tr.paidRefPlaceholder}
                  className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">{tr.adminNoteLabel}</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={tr.paidNotePlaceholder}
                  className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {action === "FAILED" && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                {tr.failedHelp}
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  {tr.failedReasonLabel}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={tr.failedReasonPlaceholder}
                  className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs px-4 py-2"
            >
              {tr.btnCancel}
            </Button>

            {action === "APPROVE" && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-xs px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? tr.submitting : tr.btnApprove}</span>
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
                <span>{isSubmitting ? tr.submitting : tr.btnReject}</span>
              </Button>
            )}

            {action === "PAID" && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-xs px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? tr.submitting : tr.btnPaid}</span>
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
                <span>{isSubmitting ? tr.submitting : tr.btnFailed}</span>
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
