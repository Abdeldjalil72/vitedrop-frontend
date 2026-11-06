"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { WithdrawalStatusBadge } from "@/components/admin/withdrawal-status-badge";
import {
  WithdrawalActionModal,
  WithdrawalModalAction,
} from "@/components/admin/withdrawal-action-modal";
import {
  apiGetAdminWithdrawal,
  AdminWithdrawal,
} from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import {
  ArrowLeft,
  ArrowRight,
  Wallet,
  CreditCard,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  RefreshCw,
  ShieldCheck,
  Building2,
  FileText,
  Send,
  Loader2,
} from "lucide-react";

const PRIORITY_THRESHOLD_DZD = 20000;

const translations = {
  fr: {
    backToList: "Retour à la liste des retraits",
    title: "Détails du Retrait Affilié",
    eyebrow: "Trésorerie & Payouts BaridiMob / CCP",
    priorityBadge: "PRIORITAIRE",
    refresh: "Actualiser",
    loading: "Chargement des détails du retrait...",
    errorTitle: "Erreur lors du chargement du retrait",
    notFound: "Demande de retrait introuvable.",
    financialAudit: "Audit Financier & Montant",
    requestedAmount: "Montant demandé",
    currentBalance: "Solde actuel du portefeuille",
    sufficientBalance: "Solde suffisant pour honorer ce retrait",
    insufficientBalance: "Attention : Le solde actuel est inférieur au montant demandé",
    accountingRule: "Règle comptable : Le solde de l'affilié reste intact tant que le paiement n'est pas exécuté et confirmé.",
    paymentDetails: "Coordonnées de Virement Algérie Poste",
    method: "Méthode de virement",
    fullCoordinates: "Coordonnées complètes (RIP / CCP)",
    maskedCoordinates: "Coordonnées masquées",
    copySuccess: "Copié !",
    copyBtn: "Copier",
    beneficiary: "Bénéficiaire",
    name: "Nom complet",
    email: "Adresse e-mail",
    phone: "Téléphone",
    role: "Rôle",
    userId: "ID Utilisateur",
    timeline: "Piste d'Audit & Historique",
    submittedAt: "Date de soumission",
    reviewedAt: "Date d'examen",
    reviewedBy: "Examiné par",
    paidAt: "Date de paiement",
    paymentReference: "Référence de bordereau / reçu",
    rejectedAt: "Date de rejet",
    reason: "Motif",
    adminNote: "Note administrative interne",
    actionsCard: "Actions Administratives",
    actionsHelpPending: "Cette demande est en attente de vérification. Vous pouvez l'approuver pour la programmer en paiement, ou la rejeter.",
    actionsHelpApproved: "Cette demande est validée et prête pour le virement BaridiMob / CCP. Après exécution postale, enregistrez le numéro de reçu pour débiter le portefeuille.",
    actionsHelpFinal: "Cette demande est clôturée. Aucune action supplémentaire n'est requise.",
    actions: {
      approve: "Approuver la demande",
      reject: "Rejeter la demande",
      markPaid: "Confirmer le Paiement (Payé)",
      markFailed: "Déclarer l'Échec",
    },
  },
  en: {
    backToList: "Back to Withdrawals List",
    title: "Affiliate Withdrawal Details",
    eyebrow: "Treasury & BaridiMob / CCP Payouts",
    priorityBadge: "PRIORITY",
    refresh: "Refresh",
    loading: "Loading withdrawal details...",
    errorTitle: "Error loading withdrawal",
    notFound: "Withdrawal request not found.",
    financialAudit: "Financial Audit & Amount",
    requestedAmount: "Requested Amount",
    currentBalance: "Current Wallet Balance",
    sufficientBalance: "Sufficient balance to fulfill this withdrawal",
    insufficientBalance: "Warning: Current wallet balance is lower than requested amount",
    accountingRule: "Accounting rule: Affiliate balance remains untouched until payout execution is confirmed.",
    paymentDetails: "Algeria Post Payment Coordinates",
    method: "Payout Method",
    fullCoordinates: "Full Coordinates (RIP / CCP)",
    maskedCoordinates: "Masked Coordinates",
    copySuccess: "Copied!",
    copyBtn: "Copy",
    beneficiary: "Beneficiary",
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    role: "Role",
    userId: "User ID",
    timeline: "Audit Trail & History",
    submittedAt: "Submission Date",
    reviewedAt: "Review Date",
    reviewedBy: "Reviewed by",
    paidAt: "Paid Date",
    paymentReference: "Receipt / Voucher Reference",
    rejectedAt: "Rejection Date",
    reason: "Reason",
    adminNote: "Internal Admin Note",
    actionsCard: "Administrative Actions",
    actionsHelpPending: "This request is pending review. You can approve it for payout or reject it.",
    actionsHelpApproved: "This request is approved and ready for transfer. After postal transfer, record the voucher number to debit the wallet.",
    actionsHelpFinal: "This request is closed. No further action required.",
    actions: {
      approve: "Approve Request",
      reject: "Reject Request",
      markPaid: "Confirm Payment (Paid)",
      markFailed: "Declare Failure",
    },
  },
  ar: {
    backToList: "العودة إلى قائمة السحوبات",
    title: "تفاصيل طلب سحب الأرباح",
    eyebrow: "إدارة الخزينة والتحويلات البريدية",
    priorityBadge: "أولوية قصوى",
    refresh: "تحديث",
    loading: "جارٍ تحميل تفاصيل السحب...",
    errorTitle: "خطأ أثناء تحميل الطلب",
    notFound: "طلب السحب غير موجود.",
    financialAudit: "التدقيق المالي والمبلغ",
    requestedAmount: "المبلغ المطلوب",
    currentBalance: "الرصيد الحالي للمحفظة",
    sufficientBalance: "الرصيد كافٍ لتنفيذ أمر التحويل",
    insufficientBalance: "تنبيه: الرصيد الحالي أقل من المبلغ المطلوب",
    accountingRule: "القيد المحاسبي: لا يتم خصم الرصيد إلا بعد تأكيد تنفيذ التحويل الفعلي وتسجيل الوصل.",
    paymentDetails: "بيانات التحويل عبر بريد الجزائر",
    method: "طريقة الاستلام",
    fullCoordinates: "البيانات الكاملة (RIP / CCP)",
    maskedCoordinates: "البيانات المشفرة",
    copySuccess: "تم النسخ!",
    copyBtn: "نسخ",
    beneficiary: "المستفيد",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    role: "الصفة",
    userId: "معرف المستخدم",
    timeline: "سجل التدقيق والتتبع",
    submittedAt: "تاريخ الطلب",
    reviewedAt: "تاريخ المراجعة",
    reviewedBy: "تمت المراجعة بواسطة",
    paidAt: "تاريخ الدفع",
    paymentReference: "رقم الحوالة / وصل الدفع",
    rejectedAt: "تاريخ الرفض",
    reason: "السبب",
    adminNote: "ملاحظة الإدارة الداخلية",
    actionsCard: "إجراءات الإدارة",
    actionsHelpPending: "هذا الطلب قيد المراجعة. يمكنك اعتماده للدفع أو رفضه مع تحديد السبب.",
    actionsHelpApproved: "تم اعتماد الطلب وجاهز للدفع عبر بريد الجزائر. بعد إتمام التحويل، سجّل رقم الوصل لخصم الرصيد.",
    actionsHelpFinal: "تمت معالجة هذا الطلب نهائياً. لا توجد إجراءات إضافية مطلوبة.",
    actions: {
      approve: "الموافقة على الطلب",
      reject: "رفض الطلب",
      markPaid: "تأكيد الدفع وتسجيل الحوالة",
      markFailed: "تسجيل فشل التحويل",
    },
  },
};

export default function AdminWithdrawalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [withdrawal, setWithdrawal] = useState<AdminWithdrawal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Action Modal State
  const [modalAction, setModalAction] = useState<WithdrawalModalAction | null>(null);

  const fetchWithdrawal = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGetAdminWithdrawal(id);
      setWithdrawal(data);
    } catch (err: any) {
      setError(err?.message || "Erreur de chargement du retrait.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawal();
  }, [id]);

  const handleCopy = (key: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const currentLang = lang === "ar" || lang === "en" || lang === "fr" ? lang : "fr";
        const t = translations[currentLang];
        const isAr = currentLang === "ar";
        const BackIcon = isAr ? ArrowRight : ArrowLeft;

        if (isLoading) {
          return (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
              <p className="text-xs text-neutral-500 font-medium">{t.loading}</p>
            </div>
          );
        }

        if (error || !withdrawal) {
          return (
            <div className="max-w-xl mx-auto py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">
                {error || t.notFound}
              </h3>
              <div className="flex items-center justify-center gap-2">
                <Button variant="secondary" size="sm" onClick={fetchWithdrawal}>
                  <RefreshCw className="w-3.5 h-3.5 me-1.5" />
                  <span>{t.refresh}</span>
                </Button>
                <Link href="/admin/withdrawals">
                  <Button variant="ghost" size="sm">
                    <BackIcon className="w-3.5 h-3.5 me-1.5" />
                    <span>{t.backToList}</span>
                  </Button>
                </Link>
              </div>
            </div>
          );
        }

        const rawCoordinates =
          withdrawal.recipientDetailsEncrypted || withdrawal.recipientDetailsMasked;
        const isPriority = withdrawal.amount >= PRIORITY_THRESHOLD_DZD;
        const walletBalance = withdrawal.walletBalance ?? 0;
        const hasSufficientBalance = walletBalance >= withdrawal.amount;

        return (
          <div className="space-y-6 sm:space-y-8 text-start max-w-6xl mx-auto">
            {/* Top Bar Navigation & Actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Link
                href="/admin/withdrawals"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <BackIcon className="w-4 h-4" />
                <span>{t.backToList}</span>
              </Link>

              <Button
                variant="secondary"
                size="sm"
                onClick={fetchWithdrawal}
                className="text-xs gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.refresh}</span>
              </Button>
            </div>

            {/* Header Banner */}
            <div className="bg-white rounded-3xl border border-[#e7e5df] p-5 sm:p-7 shadow-xs">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                {t.eyebrow}
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
                    {t.title}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-800 font-mono text-xs font-semibold">
                      ID: {withdrawal.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("id", withdrawal.id)}
                      className="text-neutral-400 hover:text-neutral-800 p-1 rounded transition-colors cursor-pointer"
                      title={t.copyBtn}
                    >
                      {copiedKey === "id" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <WithdrawalStatusBadge status={withdrawal.status} lang={lang} />
                    {isPriority && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-mono font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {t.priorityBadge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:text-end">
                  <span className="text-xs text-neutral-400 block mb-0.5">
                    {t.requestedAmount}
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-neutral-900">
                    {formatDZD(withdrawal.amount, lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* Two-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Details (2 cols on large screen) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Financial Verification Card */}
                <div className="bg-white rounded-3xl border border-[#e7e5df] p-5 sm:p-6 shadow-xs space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-neutral-700" />
                    {t.financialAudit}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                      <span className="text-xs text-neutral-500 block mb-1">
                        {t.requestedAmount}
                      </span>
                      <span className="text-2xl font-bold font-mono text-neutral-900 block">
                        {formatDZD(withdrawal.amount, lang)}
                      </span>
                    </div>

                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                      <span className="text-xs text-neutral-500 block mb-1">
                        {t.currentBalance}
                      </span>
                      <span className="text-2xl font-bold font-mono text-neutral-900 block">
                        {formatDZD(walletBalance, lang)}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs flex items-center gap-3 ${
                      hasSufficientBalance
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-900 border border-amber-200"
                    }`}
                  >
                    {hasSufficientBalance ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                    )}
                    <span className="font-medium">
                      {hasSufficientBalance ? t.sufficientBalance : t.insufficientBalance}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 italic">
                    {t.accountingRule}
                  </p>
                </div>

                {/* Payout Coordinates Card */}
                <div className="bg-white rounded-3xl border border-[#e7e5df] p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-neutral-700" />
                      {t.paymentDetails}
                    </span>
                    {withdrawal.method === "BARIDIMOB" ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300 font-mono font-bold text-xs">
                        BARIDIMOB
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-xs">
                        CCP ALGÉRIE POSTE
                      </span>
                    )}
                  </div>

                  <div className="bg-neutral-900 text-neutral-100 rounded-2xl p-4 sm:p-5 font-mono text-sm flex items-center justify-between gap-3 shadow-inner">
                    <div className="min-w-0">
                      <span className="text-[11px] text-neutral-400 block mb-1">
                        {withdrawal.recipientDetailsEncrypted
                          ? t.fullCoordinates
                          : t.maskedCoordinates}
                      </span>
                      <span className="text-base sm:text-xl font-bold tracking-wider break-all select-all text-amber-300">
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
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{t.copySuccess}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{t.copyBtn}</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {withdrawal.recipientDetailsEncrypted && withdrawal.recipientDetailsMasked && (
                    <div className="text-xs text-neutral-500 font-mono px-1">
                      {t.maskedCoordinates}: {withdrawal.recipientDetailsMasked}
                    </div>
                  )}
                </div>

                {/* Beneficiary Profile Card */}
                <div className="bg-white rounded-3xl border border-[#e7e5df] p-5 sm:p-6 shadow-xs space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-700" />
                    {t.beneficiary}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
                      <span className="text-neutral-400 block text-[11px] mb-0.5">{t.name}</span>
                      <span className="font-bold text-neutral-900 text-sm">
                        {withdrawal.fullName || "—"}
                      </span>
                    </div>

                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
                      <span className="text-neutral-400 block text-[11px] mb-0.5">{t.email}</span>
                      <span className="font-mono text-neutral-800 break-all font-medium">
                        {withdrawal.userEmail || "—"}
                      </span>
                    </div>

                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
                      <span className="text-neutral-400 block text-[11px] mb-0.5">{t.phone}</span>
                      <span className="font-mono text-neutral-800 font-medium">
                        {withdrawal.userPhone || "Non renseigné"}
                      </span>
                    </div>

                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
                      <span className="text-neutral-400 block text-[11px] mb-0.5">{t.role}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] mt-0.5 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {withdrawal.userRole || "AFFILIATE"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Timeline & Action Center */}
              <div className="space-y-6">
                {/* Administrative Actions Card */}
                <div className="bg-white rounded-3xl border border-[#e7e5df] p-5 sm:p-6 shadow-xs space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                    {t.actionsCard}
                  </span>

                  {withdrawal.status === "PENDING" && (
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {t.actionsHelpPending}
                      </p>
                      <div className="flex flex-col gap-2 pt-1">
                        <Button
                          variant="secondary"
                          onClick={() => setModalAction("APPROVE")}
                          className="w-full justify-center text-xs bg-[#064e3b] hover:bg-[#085a44] text-amber-200 border border-emerald-900 shadow-2xs font-semibold py-2.5"
                        >
                          <CheckCircle2 className="w-4 h-4 me-1.5 text-amber-300" />
                          <span>{t.actions.approve}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setModalAction("REJECT")}
                          className="w-full justify-center text-xs text-rose-700 hover:bg-rose-50 py-2.5"
                        >
                          <XCircle className="w-4 h-4 me-1.5" />
                          <span>{t.actions.reject}</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {withdrawal.status === "APPROVED" && (
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {t.actionsHelpApproved}
                      </p>
                      <div className="flex flex-col gap-2 pt-1">
                        <Button
                          variant="primary"
                          onClick={() => setModalAction("PAID")}
                          className="w-full justify-center text-xs bg-emerald-600 hover:bg-emerald-700 text-white py-2.5"
                        >
                          <CreditCard className="w-4 h-4 me-1.5" />
                          <span>{t.actions.markPaid}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setModalAction("FAILED")}
                          className="w-full justify-center text-xs text-amber-700 hover:bg-amber-50 py-2.5"
                        >
                          <AlertTriangle className="w-4 h-4 me-1.5" />
                          <span>{t.actions.markFailed}</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {(withdrawal.status === "PAID" ||
                    withdrawal.status === "REJECTED" ||
                    withdrawal.status === "FAILED") && (
                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 leading-relaxed">
                      {t.actionsHelpFinal}
                    </div>
                  )}
                </div>

                {/* Timeline Card */}
                <div className="bg-white rounded-3xl border border-[#e7e5df] p-5 sm:p-6 shadow-xs space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-700" />
                    {t.timeline}
                  </span>

                  <div className="space-y-3 text-xs">
                    <div className="pb-3 border-b border-neutral-100">
                      <span className="text-neutral-400 block text-[11px] mb-0.5">
                        {t.submittedAt}
                      </span>
                      <span className="font-mono text-neutral-900 font-medium">
                        {formatDateTime(withdrawal.createdAt, lang)}
                      </span>
                    </div>

                    {withdrawal.reviewedAt && (
                      <div className="pb-3 border-b border-neutral-100">
                        <span className="text-neutral-400 block text-[11px] mb-0.5">
                          {t.reviewedAt}
                        </span>
                        <span className="font-mono text-neutral-900 font-medium block">
                          {formatDateTime(withdrawal.reviewedAt, lang)}
                        </span>
                        {withdrawal.reviewerName && (
                          <span className="text-[11px] text-neutral-500 mt-0.5 block">
                            {t.reviewedBy}: {withdrawal.reviewerName}
                          </span>
                        )}
                      </div>
                    )}

                    {withdrawal.paidAt && (
                      <div className="pb-3 border-b border-neutral-100">
                        <span className="text-neutral-400 block text-[11px] mb-0.5">
                          {t.paidAt}
                        </span>
                        <span className="font-mono text-emerald-700 font-bold block">
                          {formatDateTime(withdrawal.paidAt, lang)}
                        </span>
                      </div>
                    )}

                    {withdrawal.paymentReference && (
                      <div className="pb-3 border-b border-neutral-100">
                        <span className="text-neutral-400 block text-[11px] mb-0.5">
                          {t.paymentReference}
                        </span>
                        <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded block">
                          {withdrawal.paymentReference}
                        </span>
                      </div>
                    )}

                    {withdrawal.rejectedAt && (
                      <div className="pb-3 border-b border-neutral-100">
                        <span className="text-neutral-400 block text-[11px] mb-0.5">
                          {t.rejectedAt}
                        </span>
                        <span className="font-mono text-rose-700 font-bold block">
                          {formatDateTime(withdrawal.rejectedAt, lang)}
                        </span>
                      </div>
                    )}

                    {withdrawal.adminNote && (
                      <div className="pt-1">
                        <span className="text-neutral-400 block text-[11px] mb-1">
                          {withdrawal.status === "REJECTED" || withdrawal.status === "FAILED"
                            ? t.reason
                            : t.adminNote}
                        </span>
                        <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs">
                          {withdrawal.adminNote}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Modal (Approve, Reject, Mark Paid, Mark Failed) */}
            {modalAction && (
              <WithdrawalActionModal
                withdrawal={withdrawal}
                action={modalAction}
                isOpen={!!modalAction}
                onClose={() => setModalAction(null)}
                onSuccess={() => {
                  setModalAction(null);
                  fetchWithdrawal();
                }}
                lang={lang}
              />
            )}
          </div>
        );
      }}
    </DashboardLayout>
  );
}

