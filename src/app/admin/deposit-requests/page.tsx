"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveAdminList } from "@/components/admin/responsive-admin-list";
import {
  apiGetAdminDepositRequests,
  apiApproveDepositRequest,
  apiRejectDepositRequest,
  apiGetAdminUsers,
  DepositRequest,
  DepositPaymentRail,
} from "@/lib/api-client";
import { AdminTopUpModal, AdminTopUpSupplierInfo } from "@/components/admin/admin-topup-modal";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { Language } from "@/lib/locales";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  Plus,
  X,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const PRIORITY_DEPOSIT_THRESHOLD_DZD = 50000;

const pageTranslations = {
  fr: {
    eyebrow: "Trésorerie & Comptes Séquestres",
    title: "Dépôts & Rechargements Fournisseurs",
    description:
      "Vérification des bordereaux de versement et crédit immédiat du solde Escrow sous double-écriture.",
    refresh: "Actualiser",
    directTopUpBtn: "Recharger Directement",
    searchPlaceholder: "Filtrer par fournisseur, note ou téléphone...",
    kpi: {
      pendingSum: "Total en Attente",
      pendingSumSub: "En cours de vérification bancaire",
      pendingCount: "Bordereaux à Traiter",
      pendingCountSub: "Bordereaux en attente d'approbation",
      approvedCount: "Validés & Crédités",
      approvedCountSub: "Validés et crédités au Grand-Livre",
      approvedSum: "Total Dépôts Encaissés",
      approvedSumSub: "Fonds virés sur les comptes séquestres",
    },
    tabs: {
      ALL: "Toutes les demandes",
      PENDING: "En attente",
      APPROVED: "Validées & Créditées",
      REJECTED: "Rejetées",
    },
    table: {
      supplier: "Fournisseur",
      amount: "Montant",
      rail: "Canal & Coordonnées",
      slip: "Bordereau / Reçu",
      status: "Statut",
      date: "Date & Réf.",
      actions: "Actions",
    },
    priorityBadge: "GROS MONTANT",
    copyBtn: "Copier la référence",
    copyPhoneBtn: "Copier le téléphone",
    previewSlip: "Aperçu du reçu",
    actions: {
      approve: "Valider & Créditer",
      reject: "Rejeter",
      approvedDone: "Crédité au Grand-Livre",
      rejectedReason: "Motif du rejet",
    },
    emptyTitle: "Aucune demande de rechargement",
    emptyDesc: "Aucun bordereau de versement ne correspond aux filtres sélectionnés.",
    noNote: "Sans note",
    copied: "Copié",
    copy: "Copier",
    viewSlip: "Voir le reçu",
    amountCol: "Montant",
    railCol: "Canal",
    approveModal: {
      title: "Valider & Créditer le Solde Escrow",
      accountingNoticeTitle: "Double-Écriture Comptable :",
      accountingNoticeDesc:
        "Cette action incrémente immédiatement le solde Escrow avec verrouillage pessimiste et enregistre une transaction DEPOSIT dans le grand-livre.",
      amountLabel: "Montant Validé Reçu (DZD) :",
      declaredAmountPrefix: "Montant déclaré par le fournisseur :",
      internalNoteLabel: "Note interne ou confirmation bancaire (Optionnel) :",
      internalNotePlaceholder: "Ex: Vérifié sur extrait BaridiMob #102...",
      cancel: "Annuler",
      confirm: "Confirmer & Créditer",
      crediting: "Crédit en cours...",
    },
    rejectModal: {
      title: "Rejeter la Demande de Dépôt",
      reasonLabel: "Motif du rejet (Obligatoire) :",
      reasonPlaceholder:
        "Ex: Virement introuvable sur le relevé BaridiMob, bordereau illisible...",
      cancel: "Annuler",
      confirm: "Rejeter la demande",
      rejecting: "Rejet en cours...",
    },
    previewModal: {
      titlePrefix: "Bordereau de Versement #",
      supplierPrefix: "Fournisseur :",
      refPrefix: "Réf :",
      railPrefix: "Canal :",
      approveBtn: "Valider le Dépôt",
      closeBtn: "Fermer",
      altImg: "Reçu de versement bancaire",
      documentPrefix: "Document :",
    },
    notifications: {
      approveSuccess: (amt: string, name: string) =>
        `Dépôt de ${amt} DZD validé avec succès pour ${name}.`,
      approveError: "Erreur lors de la validation du dépôt.",
      rejectSuccess: "Demande de dépôt rejetée avec succès.",
      rejectError: "Erreur lors du rejet du dépôt.",
      loadError: "Erreur lors du chargement des demandes de dépôt.",
    },
  },
  en: {
    eyebrow: "Treasury & Escrow Accounts",
    title: "Supplier Top-Up & Deposit Requests",
    description:
      "Verification of wire deposit slips and instant double-entry Escrow ledger crediting.",
    refresh: "Refresh",
    directTopUpBtn: "Direct Top-Up",
    searchPlaceholder: "Filter by supplier, note, or phone...",
    kpi: {
      pendingSum: "Total Pending Clearing",
      pendingSumSub: "Pending bank clearing verification",
      pendingCount: "Slips to Process",
      pendingCountSub: "Slips awaiting clearance",
      approvedCount: "Approved & Credited",
      approvedCountSub: "Approved & credited to Ledger",
      approvedSum: "Total Cleared Deposits",
      approvedSumSub: "Funds allocated to escrow reserves",
    },
    tabs: {
      ALL: "All Requests",
      PENDING: "Pending Review",
      APPROVED: "Approved & Credited",
      REJECTED: "Rejected",
    },
    table: {
      supplier: "Supplier",
      amount: "Amount",
      rail: "Payment Rail",
      slip: "Deposit Slip",
      status: "Status",
      date: "Date & Ref.",
      actions: "Actions",
    },
    priorityBadge: "HIGH VALUE",
    copyBtn: "Copy reference",
    copyPhoneBtn: "Copy phone",
    previewSlip: "Preview receipt",
    actions: {
      approve: "Approve & Credit",
      reject: "Reject",
      approvedDone: "Credited to Ledger",
      rejectedReason: "Rejection Reason",
    },
    emptyTitle: "No deposit requests found",
    emptyDesc: "No bank deposit slips match the active filter criteria.",
    noNote: "No note",
    copied: "Copied",
    copy: "Copy",
    viewSlip: "View receipt",
    amountCol: "Amount",
    railCol: "Rail",
    approveModal: {
      title: "Approve & Credit Escrow Balance",
      accountingNoticeTitle: "Double-Entry Accounting:",
      accountingNoticeDesc:
        "This action immediately credits the Escrow balance with pessimistic locking and records a DEPOSIT ledger entry.",
      amountLabel: "Verified Amount Received (DZD):",
      declaredAmountPrefix: "Amount declared by supplier:",
      internalNoteLabel: "Internal note or bank confirmation (Optional):",
      internalNotePlaceholder: "e.g. Verified on BaridiMob statement #102...",
      cancel: "Cancel",
      confirm: "Confirm & Credit",
      crediting: "Crediting...",
    },
    rejectModal: {
      title: "Reject Deposit Request",
      reasonLabel: "Rejection reason (Required):",
      reasonPlaceholder:
        "e.g. Wire not found on BaridiMob statement, illegible slip...",
      cancel: "Cancel",
      confirm: "Reject Request",
      rejecting: "Rejecting...",
    },
    previewModal: {
      titlePrefix: "Deposit Slip #",
      supplierPrefix: "Supplier:",
      refPrefix: "Ref:",
      railPrefix: "Rail:",
      approveBtn: "Approve Deposit",
      closeBtn: "Close",
      altImg: "Bank deposit receipt",
      documentPrefix: "Document:",
    },
    notifications: {
      approveSuccess: (amt: string, name: string) =>
        `Deposit of ${amt} DZD successfully approved for ${name}.`,
      approveError: "Error while approving deposit request.",
      rejectSuccess: "Deposit request rejected successfully.",
      rejectError: "Error while rejecting deposit request.",
      loadError: "Error while loading deposit requests.",
    },
  },
  ar: {
    eyebrow: "الخزينة وحسابات الضمان المالي",
    title: "إيداعات وشحن أرصدة الموردين",
    description:
      "مراجعة وصولات التحويل البنكي وتفعيل أرصدة الضمان المالي فوراً بالقيد المزدوج.",
    refresh: "تحديث",
    directTopUpBtn: "شحن مباشر",
    searchPlaceholder: "البحث بالمورد، الملاحظة أو الهاتف...",
    kpi: {
      pendingSum: "إجمالي قيد المعالجة",
      pendingSumSub: "قيد التحقق من الحساب البنكي",
      pendingCount: "وصولات للتحقق",
      pendingCountSub: "وصولات تنتظر الموافقة",
      approvedCount: "تم القبول والشحن",
      approvedCountSub: "معتمدة ومشحونة في دفتر الأستاذ",
      approvedSum: "إجمالي الإيداعات المقبولة",
      approvedSumSub: "أموال محولة لحسابات الضمان المالي",
    },
    tabs: {
      ALL: "جميع الطلبات",
      PENDING: "قيد الانتظار",
      APPROVED: "مقبولة ومشحونة",
      REJECTED: "مرفوضة",
    },
    table: {
      supplier: "المورد",
      amount: "المبلغ",
      rail: "طريقة التحويل",
      slip: "وصل الدفع",
      status: "الحالة",
      date: "التاريخ والمعرف",
      actions: "الإجراءات",
    },
    priorityBadge: "مبلغ مرتفع",
    copyBtn: "نسخ المعرف",
    copyPhoneBtn: "نسخ الهاتف",
    previewSlip: "معاينة الوصل",
    actions: {
      approve: "قبول وشحن الرصيد",
      reject: "رفض",
      approvedDone: "تم شحن المحفظة",
      rejectedReason: "سبب الرفض",
    },
    emptyTitle: "لا توجد طلبات إيداع",
    emptyDesc: "لم يتم العثور على أي وصولات مطابقة لمعايير البحث الحالية.",
    noNote: "بدون ملاحظة",
    copied: "تم النسخ",
    copy: "نسخ",
    viewSlip: "عرض الوصل",
    amountCol: "المبلغ",
    railCol: "القناة",
    approveModal: {
      title: "تأكيد وشحن رصيد الضمان المالي (Escrow)",
      accountingNoticeTitle: "القيد المحاسبي المزدوج:",
      accountingNoticeDesc:
        "يقوم هذا الإجراء بزيادة رصيد الضمان المالي فوراً مع قفل تشاؤمي وتسجيل عملية إيداع DEPOSIT في دفتر الأستاذ.",
      amountLabel: "المبلغ الفعلي المستلم (دج):",
      declaredAmountPrefix: "المبلغ المصرح به من المورد:",
      internalNoteLabel: "ملاحظة داخلية أو رقم التحقق البنكي (اختياري):",
      internalNotePlaceholder: "مثال: تم التحقق من كشف بريدي موب رقم #102...",
      cancel: "إلغاء",
      confirm: "تأكيد وشحن الرصيد",
      crediting: "جاري الشحن...",
    },
    rejectModal: {
      title: "رفض طلب الإيداع",
      reasonLabel: "سبب الرفض (إلزامي):",
      reasonPlaceholder:
        "مثال: لم يتم العثور على التحويل في كشف الحساب، أو الوصل غير واضح...",
      cancel: "إلغاء",
      confirm: "تأكيد الرفض",
      rejecting: "جاري الرفض...",
    },
    previewModal: {
      titlePrefix: "وصل الإيداع #",
      supplierPrefix: "المورد:",
      refPrefix: "المرجع:",
      railPrefix: "القناة:",
      approveBtn: "قبول الإيداع",
      closeBtn: "إغلاق",
      altImg: "وصل التحويل البنكي",
      documentPrefix: "المستند:",
    },
    notifications: {
      approveSuccess: (amt: string, name: string) =>
        `تم تأكيد إيداع ${amt} دج بنجاح لحساب ${name}.`,
      approveError: "حدث خطأ أثناء تأكيد طلب الإيداع.",
      rejectSuccess: "تم رفض طلب الإيداع بنجاح.",
      rejectError: "حدث خطأ أثناء رفض طلب الإيداع.",
      loadError: "حدث خطأ أثناء تحميل طلبات الإيداع.",
    },
  },
};

export default function AdminDepositRequestsPage() {
  const [activeTab, setActiveTab] = useState<string>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  // Direct topup modal
  const [isDirectTopUpOpen, setIsDirectTopUpOpen] = useState(false);
  const [suppliersList, setSuppliersList] = useState<AdminTopUpSupplierInfo[]>([]);

  // Preview slip modal
  const [previewSlipRequest, setPreviewSlipRequest] = useState<DepositRequest | null>(null);

  // Approve modal
  const [approvingRequest, setApprovingRequest] = useState<DepositRequest | null>(null);
  const [verifiedAmount, setVerifiedAmount] = useState<string>("");
  const [approvalNote, setApprovalNote] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);

  // Reject modal
  const [rejectingRequest, setRejectingRequest] = useState<DepositRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isRejecting, setIsRejecting] = useState(false);

  const handleCopy = (id: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const offset = (page - 1) * limit;
      const res = await apiGetAdminDepositRequests({
        status: activeTab === "ALL" ? undefined : activeTab,
        limit,
        offset,
      });
      setRequests(res.data || []);
      setTotal(res.total || 0);
      setPendingCount(res.pendingCount || 0);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des demandes de dépôt."
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, limit, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const handleOpenDirectTopUp = async () => {
    setIsDirectTopUpOpen(true);
    if (suppliersList.length === 0) {
      try {
        const users = await apiGetAdminUsers();
        const suppliers = users
          .filter((u) => u.role === "SUPPLIER")
          .map((u) => ({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
            balance: u.balance,
          }));
        setSuppliersList(suppliers);
      } catch {
        // Fallback
      }
    }
  };

  // Open Approve Modal
  const handleOpenApproveModal = (req: DepositRequest) => {
    setApprovingRequest(req);
    setVerifiedAmount(String(req.amount));
    setApprovalNote("");
  };

  const handleConfirmApproval = async (lang: Language = "fr") => {
    if (!approvingRequest) return;
    setIsApproving(true);
    const t = pageTranslations[lang] || pageTranslations.fr;
    try {
      const numAmount = Number(verifiedAmount) || approvingRequest.amount;
      await apiApproveDepositRequest(approvingRequest.id, numAmount, approvalNote || undefined);
      setSuccessMessage(
        t.notifications.approveSuccess(numAmount.toLocaleString(), approvingRequest.supplierName)
      );
      setApprovingRequest(null);
      void loadData();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : t.notifications.approveError
      );
    } finally {
      setIsApproving(false);
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (req: DepositRequest) => {
    setRejectingRequest(req);
    setRejectionReason("");
  };

  const handleConfirmRejection = async (lang: Language = "fr") => {
    if (!rejectingRequest || !rejectionReason.trim()) return;
    setIsRejecting(true);
    const t = pageTranslations[lang] || pageTranslations.fr;
    try {
      await apiRejectDepositRequest(rejectingRequest.id, rejectionReason.trim());
      setSuccessMessage(t.notifications.rejectSuccess);
      setRejectingRequest(null);
      void loadData();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : t.notifications.rejectError
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q) ||
        r.supplierEmail.toLowerCase().includes(q) ||
        (r.supplierPhone && r.supplierPhone.includes(q)) ||
        (r.referenceNote && r.referenceNote.toLowerCase().includes(q))
    );
  }, [requests, searchQuery]);

  // Aggregate KPI stats
  const kpis = useMemo(() => {
    const pendingSum = requests
      .filter((r) => r.status === "PENDING")
      .reduce((acc, r) => acc + Number(r.amount), 0);
    const approvedSum = requests
      .filter((r) => r.status === "APPROVED")
      .reduce((acc, r) => acc + Number(r.amount), 0);
    const approvedCount = requests.filter((r) => r.status === "APPROVED").length;

    return {
      pendingSum,
      approvedSum,
      approvedCount,
    };
  }, [requests]);

  const totalPages = Math.ceil(total / limit) || 1;

  // Rail capsule helper
  const renderRailCapsule = (rail: DepositPaymentRail | string) => {
    switch (rail) {
      case "BARIDIMOB":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
            BaridiMob
          </span>
        );
      case "CCP":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Algérie Poste CCP
          </span>
        );
      case "BNA":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            Banque BNA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            {rail}
          </span>
        );
    }
  };

  // Status badge helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            En attente
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Validée
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejetée
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const currentLang = (lang === "ar" || lang === "en" || lang === "fr") ? lang : "fr";
        const t = pageTranslations[currentLang] || pageTranslations.fr;

        const renderDesktopTable = () => (
          <table className="w-full text-start">
            <thead className="bg-[#fbfbfb] border-b border-black/[0.04]">
              <tr>
                <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-start">
                  {t.table.supplier}
                </th>
                <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-start">
                  {t.table.amount}
                </th>
                <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-start">
                  {t.table.rail}
                </th>
                <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-start">
                  {t.table.slip}
                </th>
                <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-start">
                  {t.table.status}
                </th>
                <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-start">
                  {t.table.date}
                </th>
                <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-end">
                  {t.table.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((item) => {
                const isHighValue = Number(item.amount) >= PRIORITY_DEPOSIT_THRESHOLD_DZD;
                return (
                  <tr
                    key={item.id}
                    className="border-t border-black/[0.04] hover:bg-neutral-50/60 transition-colors"
                    data-testid="admin-deposit-row"
                  >
                    {/* Supplier */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {item.supplierName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-neutral-900 block truncate">
                            {item.supplierName}
                          </span>
                          <span className="text-[11px] text-neutral-400 block truncate font-mono">
                            {item.supplierEmail}
                          </span>
                          {item.supplierPhone && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span dir="ltr" className="text-[10px] font-mono text-neutral-500">
                                {item.supplierPhone}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(`phone-${item.id}`, item.supplierPhone)}
                                className="text-neutral-400 hover:text-black p-0.5"
                                title={t.copyPhoneBtn}
                              >
                                {copiedId === `phone-${item.id}` ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="space-y-0.5">
                        <div className="font-mono font-bold text-xs text-neutral-900">
                          {formatDZD(item.amount, currentLang)}
                        </div>
                        {isHighValue && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800"
                            data-testid="priority-deposit-badge"
                          >
                            {t.priorityBadge}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Rail */}
                    <td className="py-3.5 px-4 align-middle">
                      {renderRailCapsule(item.paymentRail)}
                    </td>

                    {/* Slip preview & reference */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        {item.receiptUrl === "DIRECT_ADMIN_TOPUP" ? (
                          <div
                            className="w-9 h-9 rounded-lg border border-emerald-200 bg-emerald-50/70 text-emerald-700 flex items-center justify-center shrink-0"
                            title="Rechargement direct de l'administration"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPreviewSlipRequest(item)}
                            className="w-9 h-9 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0 transition-colors"
                            data-testid="preview-slip-btn"
                            title={t.previewSlip}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <div className="min-w-0 max-w-[140px]">
                          <span className="text-[11px] font-mono font-bold text-neutral-800 block truncate">
                            {item.referenceNote || t.noNote}
                          </span>
                          {item.referenceNote && (
                            <button
                              type="button"
                              onClick={() => handleCopy(`ref-${item.id}`, item.referenceNote || "")}
                              className="text-[10px] text-neutral-400 hover:text-black flex items-center gap-0.5 transition-colors cursor-pointer"
                            >
                              {copiedId === `ref-${item.id}` ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>{t.copied}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>{t.copy}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 align-middle">
                      {renderStatusBadge(item.status)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="text-[11px] text-neutral-600 font-mono">
                        {formatDateTime(item.createdAt, currentLang)}
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">
                        #{item.id.slice(0, 8)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-middle text-end">
                      {item.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <motion.div whileTap={{ scale: 0.96 }}>
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(item)}
                              className="inline-flex items-center justify-center text-xs px-2.5 py-1 rounded-xl h-8 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.96] text-white font-semibold shadow-xs transition-all cursor-pointer gap-1"
                              data-testid="approve-deposit-btn"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 me-1" />
                              <span>{t.actions.approve}</span>
                            </button>
                          </motion.div>
                          <motion.div whileTap={{ scale: 0.96 }}>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleOpenRejectModal(item)}
                              className="text-xs px-2.5 py-1 rounded-xl h-8"
                              data-testid="reject-deposit-btn"
                            >
                              <XCircle className="w-3.5 h-3.5 me-1" />
                              {t.actions.reject}
                            </Button>
                          </motion.div>
                        </div>
                      ) : item.status === "APPROVED" ? (
                        <span className="text-[11px] font-medium text-emerald-700 flex items-center justify-end gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {t.actions.approvedDone}
                        </span>
                      ) : (
                        <span
                          className="text-[10px] text-rose-600 italic block truncate max-w-[150px]"
                          title={item.rejectionReason || ""}
                        >
                          {item.rejectionReason || t.actions.rejectedReason}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

        const renderMobileCard = (item: DepositRequest) => {
          const isHighValue = Number(item.amount) >= PRIORITY_DEPOSIT_THRESHOLD_DZD;
          return (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-black/[0.06] bg-white space-y-3"
              data-testid="admin-deposit-card"
            >
              {/* Top Row: Supplier & Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {item.supplierName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-xs text-neutral-900 block truncate">
                      {item.supplierName}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono block truncate">
                      {item.supplierEmail}
                    </span>
                  </div>
                </div>
                {renderStatusBadge(item.status)}
              </div>

              {/* Middle Details Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/[0.04] text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                    {t.amountCol}
                  </span>
                  <span className="font-mono font-bold text-sm text-neutral-900">
                    {formatDZD(item.amount, currentLang)}
                  </span>
                  {isHighValue && (
                    <span
                      className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 ml-1"
                      data-testid="priority-deposit-badge"
                    >
                      {t.priorityBadge}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                    {t.railCol}
                  </span>
                  <div className="mt-0.5">{renderRailCapsule(item.paymentRail)}</div>
                </div>
              </div>

              {/* Slip preview & Reference */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.04]">
                <div className="min-w-0 flex items-center gap-2">
                  {item.receiptUrl === "DIRECT_ADMIN_TOPUP" ? (
                    <div className="px-2 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin Direct</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPreviewSlipRequest(item)}
                      className="px-2 py-1 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                      data-testid="preview-slip-btn"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t.viewSlip}</span>
                    </button>
                  )}
                  {item.referenceNote && (
                    <span className="text-[10px] font-mono text-neutral-600 truncate">
                      {item.referenceNote}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  {formatDateTime(item.createdAt, currentLang)}
                </span>
              </div>

              {/* Actions */}
              {item.status === "PENDING" && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/[0.04]">
                  <button
                    type="button"
                    onClick={() => handleOpenApproveModal(item)}
                    className="inline-flex items-center justify-center text-xs bg-emerald-600 hover:bg-emerald-700 active:scale-[0.96] text-white font-semibold h-9 rounded-xl shadow-xs transition-all cursor-pointer gap-1"
                    data-testid="approve-deposit-btn"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 me-1" />
                    <span>{t.actions.approve}</span>
                  </button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleOpenRejectModal(item)}
                    className="text-xs h-9 rounded-xl"
                    data-testid="reject-deposit-btn"
                  >
                    <XCircle className="w-3.5 h-3.5 me-1" />
                    {t.actions.reject}
                  </Button>
                </div>
              )}
            </div>
          );
        };

        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-300">
            {/* Header */}
            <AdminPageHeader
              eyebrow={t.eyebrow}
              badgeVariant="amber"
              title={t.title}
              description={t.description}
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void loadData()}
                    disabled={isLoading}
                    className="rounded-full gap-1.5 text-xs h-9"
                    data-testid="refresh-deposits-btn"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    <span>{t.refresh}</span>
                  </Button>
                  <button
                    type="button"
                    onClick={handleOpenDirectTopUp}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 h-9 rounded-full bg-[#064e3b] hover:bg-[#085a44] border border-[#0a5e47] text-amber-200 text-xs font-semibold shadow-xs active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-amber-300 cursor-pointer"
                    data-testid="direct-topup-header-btn"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                    <span>{t.directTopUpBtn}</span>
                  </button>
                </div>
              }
            />

            {/* In-page Alerts */}
            {errorMessage && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between"
                data-testid="admin-deposits-error-banner"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="p-1 text-rose-400 hover:text-rose-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between"
                data-testid="admin-deposits-success-banner"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="p-1 text-emerald-400 hover:text-emerald-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  {t.kpi.pendingSum}
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-amber-700">
                  {formatDZD(kpis.pendingSum, currentLang)}
                </div>
                <p className="text-[10px] text-neutral-400">{t.kpi.pendingSumSub}</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  {t.kpi.pendingCount}
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-neutral-900 flex items-center gap-2">
                  <span>{pendingCount}</span>
                  {pendingCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">{t.kpi.pendingCountSub}</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  {t.kpi.approvedCount}
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-emerald-700">
                  {kpis.approvedCount}
                </div>
                <p className="text-[10px] text-neutral-400">{t.kpi.approvedCountSub}</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  {t.kpi.approvedSum}
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-[#064e3b]">
                  {formatDZD(kpis.approvedSum, currentLang)}
                </div>
                <p className="text-[10px] text-neutral-400">{t.kpi.approvedSumSub}</p>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <Tabs
                tabs={[
                  { id: "ALL", label: t.tabs.ALL },
                  {
                    id: "PENDING",
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        {t.tabs.PENDING}
                        {pendingCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold">
                            {pendingCount}
                          </span>
                        )}
                      </span>
                    ),
                  },
                  { id: "APPROVED", label: t.tabs.APPROVED },
                  { id: "REJECTED", label: t.tabs.REJECTED },
                ]}
                activeTab={activeTab}
                onChange={(id) => {
                  setActiveTab(id);
                  setPage(1);
                }}
              />

              <div className="relative min-w-[260px] sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-full border border-black/[0.1] bg-white placeholder:text-neutral-400 focus:outline-none focus:border-purple-600"
                  data-testid="deposits-search-input"
                />
              </div>
            </div>

            {/* Responsive Admin List */}
            <ResponsiveAdminList
              items={filteredRequests}
              total={total}
              isLoading={isLoading}
              error={errorMessage}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              renderTable={renderDesktopTable}
              renderCard={renderMobileCard}
              emptyIcon={<Receipt className="w-8 h-8 text-neutral-300" />}
              emptyTitle={t.emptyTitle}
              emptyDescription={t.emptyDesc}
              lang={currentLang}
            />

            {/* Lightbox Slip Preview Modal */}
            <AnimatePresence>
              {previewSlipRequest && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="preview-slip-modal-title"
                  data-testid="receipt-slip-preview-modal"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setPreviewSlipRequest(null)}
                    className="fixed inset-0 bg-black/75 backdrop-blur-xs"
                    aria-hidden="true"
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    onClick={(e) => e.stopPropagation()}
                    dir={currentLang === "ar" ? "rtl" : "ltr"}
                    className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh] my-auto text-start"
                  >
                    {/* Header */}
                    <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50 shrink-0">
                      <div>
                        <h3
                          id="preview-slip-modal-title"
                          className="text-sm font-bold text-neutral-900"
                        >
                          {t.previewModal.titlePrefix}
                          <span dir="ltr" className="font-mono">
                            {previewSlipRequest.id.slice(0, 8)}
                          </span>
                        </h3>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                          {t.previewModal.supplierPrefix} {previewSlipRequest.supplierName} •{" "}
                          <span dir="ltr">
                            {formatDZD(previewSlipRequest.amount, currentLang)}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewSlipRequest(null)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer"
                        data-testid="close-slip-preview-btn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Image Viewer Body */}
                    <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-neutral-900/5 min-h-[300px]">
                      {previewSlipRequest.receiptUrl === "DIRECT_ADMIN_TOPUP" ? (
                        <div className="p-8 text-center space-y-3">
                          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                            <ShieldCheck className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-neutral-900">
                              Rechargement Direct Administrateur
                            </p>
                            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                              Cette transaction a été saisie et créditée directement par l'équipe administrative de ViteDrop.
                            </p>
                          </div>
                          {previewSlipRequest.referenceNote && (
                            <div className="inline-block px-3 py-1.5 rounded-lg bg-neutral-100 font-mono text-xs text-neutral-800 font-semibold border border-neutral-200">
                              {previewSlipRequest.referenceNote}
                            </div>
                          )}
                        </div>
                      ) : previewSlipRequest.receiptUrl.startsWith("data:") ||
                      previewSlipRequest.receiptUrl.startsWith("http") ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={previewSlipRequest.receiptUrl}
                          alt={t.previewModal.altImg}
                          className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-md"
                          data-testid="preview-slip-img"
                        />
                      ) : (
                        <div className="p-8 text-center text-xs text-neutral-500 font-mono">
                          {t.previewModal.documentPrefix} {previewSlipRequest.receiptUrl}
                        </div>
                      )}
                    </div>

                    {/* Footer Info & Actions */}
                    <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between shrink-0">
                      <div className="text-xs font-mono text-neutral-600">
                        {previewSlipRequest.referenceNote ? (
                          <span>
                            {t.previewModal.refPrefix} {previewSlipRequest.referenceNote}
                          </span>
                        ) : (
                          <span>
                            {t.previewModal.railPrefix} {previewSlipRequest.paymentRail}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {previewSlipRequest.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => {
                              const req = previewSlipRequest;
                              setPreviewSlipRequest(null);
                              handleOpenApproveModal(req);
                            }}
                            className="inline-flex items-center justify-center text-xs px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold transition-all shadow-xs cursor-pointer gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t.previewModal.approveBtn}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPreviewSlipRequest(null)}
                          className="inline-flex items-center justify-center text-xs px-3 py-1.5 rounded-xl text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 font-medium transition-all cursor-pointer"
                        >
                          {t.previewModal.closeBtn}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Approve Modal */}
            <AnimatePresence>
              {approvingRequest && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="approve-deposit-modal-title"
                  data-testid="approve-deposit-modal"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setApprovingRequest(null)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                    aria-hidden="true"
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    onClick={(e) => e.stopPropagation()}
                    dir={currentLang === "ar" ? "rtl" : "ltr"}
                    className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto text-start"
                  >
                    <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-emerald-50/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                          <h3
                            id="approve-deposit-modal-title"
                            className="text-sm font-bold text-neutral-900"
                          >
                            {t.approveModal.title}
                          </h3>
                          <p className="text-xs text-neutral-500 font-mono">
                            <span dir="ltr">{approvingRequest.supplierName}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setApprovingRequest(null)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer"
                        data-testid="close-approve-modal-btn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-4 sm:p-5 space-y-4 text-xs">
                      {/* Double-entry notice */}
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <strong>{t.approveModal.accountingNoticeTitle}</strong>{" "}
                          {t.approveModal.accountingNoticeDesc}
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-700 block">
                          {t.approveModal.amountLabel}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            dir="ltr"
                            inputMode="numeric"
                            value={verifiedAmount}
                            onChange={(e) =>
                              setVerifiedAmount(e.target.value.replace(/[^0-9]/g, ""))
                            }
                            data-testid="verified-amount-input"
                            className="w-full text-sm font-mono font-bold px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-emerald-600"
                          />
                          <span className="absolute end-3 top-2.5 text-xs font-mono font-bold text-neutral-400">
                            DZD
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400">
                          {t.approveModal.declaredAmountPrefix}{" "}
                          <strong dir="ltr">{formatDZD(approvingRequest.amount, currentLang)}</strong>
                        </span>
                      </div>

                      {/* Internal Note */}
                      <div className="space-y-1">
                        <label className="font-semibold text-neutral-700 block">
                          {t.approveModal.internalNoteLabel}
                        </label>
                        <input
                          type="text"
                          value={approvalNote}
                          onChange={(e) => setApprovalNote(e.target.value)}
                          placeholder={t.approveModal.internalNotePlaceholder}
                          data-testid="approval-note-input"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setApprovingRequest(null)}
                        disabled={isApproving}
                        className="inline-flex items-center justify-center min-h-[38px] px-4 py-2 rounded-xl text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 transition-all cursor-pointer"
                      >
                        {t.approveModal.cancel}
                      </button>
                      <button
                        type="button"
                        disabled={isApproving || Number(verifiedAmount) < 1000}
                        onClick={() => handleConfirmApproval(currentLang)}
                        data-testid="confirm-approve-deposit-btn"
                        className="inline-flex items-center justify-center min-h-[38px] px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md shadow-emerald-600/25 disabled:opacity-50 disabled:pointer-events-none cursor-pointer gap-1.5"
                      >
                        {isApproving ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{t.approveModal.crediting}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t.approveModal.confirm}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Reject Modal */}
            <AnimatePresence>
              {rejectingRequest && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="reject-deposit-modal-title"
                  data-testid="reject-deposit-modal"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setRejectingRequest(null)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                    aria-hidden="true"
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    onClick={(e) => e.stopPropagation()}
                    dir={currentLang === "ar" ? "rtl" : "ltr"}
                    className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto text-start"
                  >
                    <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-rose-50/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-rose-700" />
                        </div>
                        <div>
                          <h3
                            id="reject-deposit-modal-title"
                            className="text-sm font-bold text-neutral-900"
                          >
                            {t.rejectModal.title}
                          </h3>
                          <p className="text-xs text-neutral-500 font-mono">
                            {rejectingRequest.supplierName} •{" "}
                            <span dir="ltr">
                              {formatDZD(rejectingRequest.amount, currentLang)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRejectingRequest(null)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer"
                        data-testid="close-reject-modal-btn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-4 sm:p-5 space-y-3 text-xs">
                      <label className="font-semibold text-neutral-700 block">
                        {t.rejectModal.reasonLabel}
                      </label>
                      <textarea
                        rows={3}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder={t.rejectModal.reasonPlaceholder}
                        data-testid="rejection-reason-input"
                        className="w-full text-xs p-3 rounded-xl border border-neutral-200 bg-white placeholder:text-neutral-400 focus:outline-none focus:border-rose-600"
                      />
                    </div>

                    <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRejectingRequest(null)}
                        disabled={isRejecting}
                        className="inline-flex items-center justify-center min-h-[38px] px-4 py-2 rounded-xl text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 transition-all cursor-pointer"
                      >
                        {t.rejectModal.cancel}
                      </button>
                      <button
                        type="button"
                        disabled={isRejecting || !rejectionReason.trim()}
                        onClick={() => handleConfirmRejection(currentLang)}
                        data-testid="confirm-reject-deposit-btn"
                        className="inline-flex items-center justify-center min-h-[38px] px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-all shadow-md shadow-rose-600/25 disabled:opacity-50 disabled:pointer-events-none cursor-pointer gap-1.5"
                      >
                        {isRejecting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{t.rejectModal.rejecting}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{t.rejectModal.confirm}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Direct Top-Up Modal (Ad-hoc) */}
            <AdminTopUpModal
              isOpen={isDirectTopUpOpen}
              onClose={() => setIsDirectTopUpOpen(false)}
              suppliersList={suppliersList}
              onSuccess={() => void loadData()}
              lang={currentLang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
