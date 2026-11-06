"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminWithdrawal,
  apiGetAdminWithdrawal,
} from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { WithdrawalStatusBadge } from "./withdrawal-status-badge";
import { WithdrawalModalAction } from "./withdrawal-action-modal";
import { Button } from "@/components/ui/button";
import {
  X,
  CreditCard,
  Building2,
  User,
  Mail,
  Phone,
  Wallet,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Clock,
  FileText,
  BadgeAlert,
  Loader2,
} from "lucide-react";

const PRIORITY_THRESHOLD_DZD = 20000;

interface Props {
  withdrawal: AdminWithdrawal;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (withdrawal: AdminWithdrawal, action: WithdrawalModalAction) => void;
  lang?: "fr" | "ar" | "en";
}

const translations = {
  fr: {
    title: "Détails du Retrait Affilié",
    subtitle: "Vérification minutieuse et validation de la demande",
    priorityBadge: "PRIORITAIRE",
    financialSection: "Audit Financier & Montant",
    requestedAmount: "Montant demandé",
    currentBalance: "Solde actuel du portefeuille",
    sufficientBalance: "Solde suffisant pour honorer ce retrait",
    insufficientBalance: "Attention : Le solde actuel est inférieur au montant demandé",
    accountingNote: "Principe comptable : Le solde n'est débité qu'au moment de la confirmation du virement réel (Statut Payé).",
    coordinatesSection: "Coordonnées de Virement Algérie Poste / BaridiMob",
    methodLabel: "Méthode de virement",
    fullCoordinates: "Coordonnées complètes",
    maskedCoordinates: "Coordonnées masquées",
    copySuccess: "Copié !",
    copyBtn: "Copier",
    beneficiarySection: "Profil de l'Affilié Bénéficiaire",
    name: "Nom complet",
    email: "Adresse e-mail",
    phone: "Numéro de téléphone",
    role: "Rôle",
    userId: "ID Utilisateur",
    auditSection: "Historique & Traçabilité",
    submittedAt: "Date de demande",
    reviewedAt: "Date d'examen",
    reviewedBy: "Examiné par",
    paidAt: "Date de paiement",
    paymentRef: "Référence bordereau / reçu",
    rejectedAt: "Date de rejet",
    rejectionReason: "Motif de rejet / échec",
    adminNote: "Note administrative interne",
    btnFullPage: "Ouvrir la page complète",
    btnClose: "Fermer",
    actions: {
      approve: "Approuver la demande",
      reject: "Rejeter",
      markPaid: "Confirmer le Paiement",
      markFailed: "Déclarer l'Échec",
    },
  },
  en: {
    title: "Affiliate Withdrawal Details",
    subtitle: "Detailed verification and request validation",
    priorityBadge: "PRIORITY",
    financialSection: "Financial Audit & Amount",
    requestedAmount: "Requested Amount",
    currentBalance: "Current Wallet Balance",
    sufficientBalance: "Sufficient balance to fulfill this withdrawal",
    insufficientBalance: "Warning: Current wallet balance is lower than requested amount",
    accountingNote: "Accounting rule: Balance is only deducted upon actual payment confirmation (Paid status).",
    coordinatesSection: "Algeria Post / BaridiMob Payment Coordinates",
    methodLabel: "Payout Method",
    fullCoordinates: "Full Coordinates",
    maskedCoordinates: "Masked Coordinates",
    copySuccess: "Copied!",
    copyBtn: "Copy",
    beneficiarySection: "Beneficiary Affiliate Profile",
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    role: "Role",
    userId: "User ID",
    auditSection: "Audit Trail & Timeline",
    submittedAt: "Submission Date",
    reviewedAt: "Review Date",
    reviewedBy: "Reviewed by",
    paidAt: "Paid Date",
    paymentRef: "Payment Reference / Receipt",
    rejectedAt: "Rejection Date",
    rejectionReason: "Rejection / Failure Reason",
    adminNote: "Internal Admin Note",
    btnFullPage: "Open Full Page",
    btnClose: "Close",
    actions: {
      approve: "Approve Request",
      reject: "Reject",
      markPaid: "Confirm Payment",
      markFailed: "Mark as Failed",
    },
  },
  ar: {
    title: "تفاصيل طلب سحب الأرباح",
    subtitle: "المراجعة الدقيقة والتحقق من بيانات الدفع",
    priorityBadge: "أولوية قصوى",
    financialSection: "التدقيق المالي والمبلغ",
    requestedAmount: "المبلغ المطلوب",
    currentBalance: "الرصيد الحالي للمحفظة",
    sufficientBalance: "الرصيد كافٍ لتنفيذ أمر التحويل",
    insufficientBalance: "تنبيه: الرصيد الحالي أقل من المبلغ المطلوب سحبه",
    accountingNote: "القيد المالي: لا يُخصم المبلغ من المحفظة إلا بعد تأكيد تنفيذ التحويل الفعلي وتسجيل الوصل.",
    coordinatesSection: "بيانات التحويل عبر بريد الجزائر / بريدي موب",
    methodLabel: "طريقة الاستلام",
    fullCoordinates: "البيانات الكاملة (RIP / CCP)",
    maskedCoordinates: "البيانات المشفرة",
    copySuccess: "تم النسخ!",
    copyBtn: "نسخ",
    beneficiarySection: "بيانات المسوق المستفيد",
    name: "الاسم واللقب",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    role: "الصفة",
    userId: "معرف المستخدم",
    auditSection: "سجل التدقيق والتتبع",
    submittedAt: "تاريخ الطلب",
    reviewedAt: "تاريخ المراجعة",
    reviewedBy: "تمت المراجعة بواسطة",
    paidAt: "تاريخ الدفع",
    paymentRef: "رقم الحوالة / وصل الدفع",
    rejectedAt: "تاريخ الرفض",
    rejectionReason: "سبب الرفض أو الفشل",
    adminNote: "ملاحظة الإدارة الداخلية",
    btnFullPage: "فتح الصفحة الكاملة",
    btnClose: "إغلاق",
    actions: {
      approve: "الموافقة على الطلب",
      reject: "رفض الطلب",
      markPaid: "تأكيد الدفع وتسجيل الحوالة",
      markFailed: "تسجيل فشل التحويل",
    },
  },
};

export function WithdrawalDetailModal({
  withdrawal: initialWithdrawal,
  isOpen,
  onClose,
  onAction,
  lang = "fr",
}: Props) {
  const [withdrawal, setWithdrawal] = useState<AdminWithdrawal>(initialWithdrawal);
  const [isLoadingFresh, setIsLoadingFresh] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentLang = lang === "ar" || lang === "en" || lang === "fr" ? lang : "fr";
  const t = translations[currentLang];
  const isAr = currentLang === "ar";

  // Refresh fresh details from backend
  useEffect(() => {
    setWithdrawal(initialWithdrawal);
    if (!isOpen || !initialWithdrawal?.id) return;

    let isMounted = true;
    setIsLoadingFresh(true);
    apiGetAdminWithdrawal(initialWithdrawal.id)
      .then((fresh) => {
        if (isMounted && fresh) {
          setWithdrawal(fresh);
        }
      })
      .catch((err) => {
        console.debug("Failed to refresh withdrawal details:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingFresh(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialWithdrawal]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = (key: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const rawCoordinates = withdrawal.recipientDetailsEncrypted || withdrawal.recipientDetailsMasked;
  const isPriority = withdrawal.amount >= PRIORITY_THRESHOLD_DZD;
  const walletBalance = withdrawal.walletBalance ?? 0;
  const hasSufficientBalance = walletBalance >= withdrawal.amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdrawal-detail-title"
        className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-2xl w-full max-h-[min(92vh,calc(100dvh-2rem))] overflow-y-auto p-5 sm:p-7 text-start relative animate-in fade-in zoom-in-95 duration-150 space-y-6"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t.btnClose}
          className="absolute top-5 end-5 p-1.5 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-neutral-100 pb-4 pe-8">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h2 id="withdrawal-detail-title" className="text-xl font-bold text-neutral-900">
              {t.title}
            </h2>
            {isLoadingFresh && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
            )}
          </div>
          <p className="text-xs text-neutral-500 mb-3">{t.subtitle}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-mono text-xs font-semibold">
              ID: {withdrawal.id}
            </span>
            <button
              type="button"
              onClick={() => handleCopy("id", withdrawal.id)}
              className="text-neutral-400 hover:text-neutral-700 p-1 rounded transition-colors"
              title={t.copyBtn}
            >
              {copiedKey === "id" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <WithdrawalStatusBadge status={withdrawal.status} lang={lang} />
            {isPriority && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {t.priorityBadge}
              </span>
            )}
          </div>
        </div>

        {/* Section 1: Financial Overview */}
        <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-neutral-600" />
              {t.financialSection}
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              {formatDateTime(withdrawal.createdAt, lang)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-white p-3.5 rounded-xl border border-neutral-100 shadow-2xs">
              <span className="text-xs text-neutral-500 block mb-1">{t.requestedAmount}</span>
              <span className="text-2xl font-bold font-mono text-neutral-900 block">
                {formatDZD(withdrawal.amount, lang)}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-neutral-100 shadow-2xs">
              <span className="text-xs text-neutral-500 block mb-1">{t.currentBalance}</span>
              <span className="text-2xl font-bold font-mono text-neutral-900 block">
                {formatDZD(walletBalance, lang)}
              </span>
            </div>
          </div>

          {/* Balance verification note */}
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
              hasSufficientBalance
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-amber-50 text-amber-900 border border-amber-200"
            }`}
          >
            {hasSufficientBalance ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            )}
            <span className="font-medium">
              {hasSufficientBalance ? t.sufficientBalance : t.insufficientBalance}
            </span>
          </div>

          <p className="text-[11px] text-neutral-400 italic ps-1">
            {t.accountingNote}
          </p>
        </div>

        {/* Section 2: Payout Coordinates (BaridiMob / CCP) */}
        <div className="border border-neutral-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-neutral-600" />
              {t.coordinatesSection}
            </span>
            {withdrawal.method === "BARIDIMOB" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 font-mono font-bold text-xs">
                BARIDIMOB
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-xs">
                CCP ALGÉRIE POSTE
              </span>
            )}
          </div>

          {/* Raw Coordinates Box with Big Copy Button */}
          <div className="bg-neutral-900 text-neutral-100 rounded-xl p-3.5 sm:p-4 font-mono text-sm flex items-center justify-between gap-3 shadow-inner">
            <div className="min-w-0">
              <span className="text-[10px] text-neutral-400 block mb-0.5">
                {withdrawal.recipientDetailsEncrypted ? t.fullCoordinates : t.maskedCoordinates}
              </span>
              <span className="text-base sm:text-lg font-bold tracking-wider break-all select-all text-amber-300">
                {rawCoordinates}
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleCopy("coord", rawCoordinates)}
              className="shrink-0 bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700 gap-1.5 text-xs"
            >
              {copiedKey === "coord" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.copySuccess}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.copyBtn}</span>
                </>
              )}
            </Button>
          </div>

          {/* Masked info if raw exists */}
          {withdrawal.recipientDetailsEncrypted && withdrawal.recipientDetailsMasked && (
            <div className="text-[11px] text-neutral-500 font-mono px-1">
              {t.maskedCoordinates}: {withdrawal.recipientDetailsMasked}
            </div>
          )}
        </div>

        {/* Section 3: Beneficiary Info */}
        <div className="border border-neutral-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <User className="w-4 h-4 text-neutral-600" />
            {t.beneficiarySection}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
              <span className="text-neutral-400 block text-[11px]">{t.name}</span>
              <span className="font-semibold text-neutral-900 text-sm">
                {withdrawal.fullName || "—"}
              </span>
            </div>

            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
              <span className="text-neutral-400 block text-[11px]">{t.email}</span>
              <span className="font-mono text-neutral-800 break-all">
                {withdrawal.userEmail || "—"}
              </span>
            </div>

            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
              <span className="text-neutral-400 block text-[11px]">{t.phone}</span>
              <span className="font-mono text-neutral-800">
                {withdrawal.userPhone || "Non renseigné"}
              </span>
            </div>

            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
              <span className="text-neutral-400 block text-[11px]">{t.role}</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] mt-0.5 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {withdrawal.userRole || "AFFILIATE"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Audit Trail & Timestamps */}
        <div className="border border-neutral-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-neutral-600" />
            {t.auditSection}
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
              <span className="text-neutral-500">{t.submittedAt}</span>
              <span className="font-mono text-neutral-900">
                {formatDateTime(withdrawal.createdAt, lang)}
              </span>
            </div>

            {withdrawal.reviewedAt && (
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span className="text-neutral-500">{t.reviewedAt}</span>
                <span className="font-mono text-neutral-900">
                  {formatDateTime(withdrawal.reviewedAt, lang)}
                  {withdrawal.reviewerName ? ` (${withdrawal.reviewerName})` : ""}
                </span>
              </div>
            )}

            {withdrawal.paidAt && (
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span className="text-neutral-500">{t.paidAt}</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {formatDateTime(withdrawal.paidAt, lang)}
                </span>
              </div>
            )}

            {withdrawal.paymentReference && (
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span className="text-neutral-500">{t.paymentRef}</span>
                <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                  {withdrawal.paymentReference}
                </span>
              </div>
            )}

            {withdrawal.rejectedAt && (
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span className="text-neutral-500">{t.rejectedAt}</span>
                <span className="font-mono text-rose-700 font-bold">
                  {formatDateTime(withdrawal.rejectedAt, lang)}
                </span>
              </div>
            )}

            {withdrawal.adminNote && (
              <div className="pt-2">
                <span className="text-neutral-500 block mb-1">
                  {withdrawal.status === "REJECTED" || withdrawal.status === "FAILED"
                    ? t.rejectionReason
                    : t.adminNote}
                </span>
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs">
                  {withdrawal.adminNote}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-neutral-200 flex-wrap">
          <Link
            href={`/admin/withdrawals/${withdrawal.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{t.btnFullPage}</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              {t.btnClose}
            </Button>

            {/* Direct Workflow Actions inside the Modal */}
            {onAction && withdrawal.status === "PENDING" && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    onAction(withdrawal, "APPROVE");
                  }}
                  className="text-xs bg-[#064e3b] hover:bg-[#085a44] text-amber-200 border border-emerald-900 shadow-2xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 me-1 text-amber-300" />
                  <span>{t.actions.approve}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onAction(withdrawal, "REJECT");
                  }}
                  className="text-xs text-rose-700 hover:bg-rose-50"
                >
                  <XCircle className="w-3.5 h-3.5 me-1" />
                  <span>{t.actions.reject}</span>
                </Button>
              </>
            )}

            {onAction && withdrawal.status === "APPROVED" && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onAction(withdrawal, "PAID");
                  }}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CreditCard className="w-3.5 h-3.5 me-1" />
                  <span>{t.actions.markPaid}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onAction(withdrawal, "FAILED");
                  }}
                  className="text-xs text-amber-700 hover:bg-amber-50"
                >
                  <AlertTriangle className="w-3.5 h-3.5 me-1" />
                  <span>{t.actions.markFailed}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
