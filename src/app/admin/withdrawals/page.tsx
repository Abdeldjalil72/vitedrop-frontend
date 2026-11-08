"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { WithdrawalStatusBadge } from "@/components/admin/withdrawal-status-badge";
import {
  WithdrawalActionModal,
  WithdrawalModalAction,
} from "@/components/admin/withdrawal-action-modal";
import { WithdrawalDetailModal } from "@/components/admin/withdrawal-detail-modal";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveAdminList } from "@/components/admin/responsive-admin-list";
import {
  apiGetAdminWithdrawals,
  AdminWithdrawal,
} from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import {
  Receipt,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CreditCard,
  AlertTriangle,
  Copy,
  Eye,
} from "lucide-react";

const PRIORITY_THRESHOLD_DZD = 20000;

const translations = {
  fr: {
    eyebrow: "Trésorerie & Payouts BaridiMob/CCP",
    title: "Gestion des Retraits Affiliés",
    description: "Flux d'approbation et d'exécution des paiements avec double-écriture comptable.",
    refresh: "Actualiser",
    searchPlaceholder: "Filtrer...",
    tabs: {
      ALL: "Toutes les demandes",
      PENDING: "En attente (Pending)",
      APPROVED: "Approuvées (À payer)",
      PAID: "Payées",
      REJECTED: "Rejetées",
      FAILED: "Échouées",
    },
    table: {
      beneficiary: "Bénéficiaire",
      amount: "Montant",
      method: "Méthode & Coordonnées",
      status: "Statut",
      date: "Date & Référence",
      actions: "Actions",
    },
    priorityBadge: "PRIORITAIRE",
    copyBtn: "Copier les coordonnées",
    userFallback: "Utilisateur",
    actions: {
      details: "Détails",
      approve: "Approuver",
      reject: "Rejeter",
      markPaid: "Marquer Payé",
      markFailed: "Échoué",
    },
    emptyTitle: "Aucune demande de retrait",
    listTitle: "Retraits",
  },
  en: {
    eyebrow: "Treasury & BaridiMob/CCP Payouts",
    title: "Affiliate Withdrawals Queue",
    description: "Approval workflow and payment execution with double-entry accounting.",
    refresh: "Refresh",
    searchPlaceholder: "Filter...",
    tabs: {
      ALL: "All Requests",
      PENDING: "Pending Review",
      APPROVED: "Approved (Ready to Pay)",
      PAID: "Paid",
      REJECTED: "Rejected",
      FAILED: "Failed",
    },
    table: {
      beneficiary: "Beneficiary",
      amount: "Amount",
      method: "Method & Details",
      status: "Status",
      date: "Date & Reference",
      actions: "Actions",
    },
    priorityBadge: "PRIORITY",
    copyBtn: "Copy details",
    userFallback: "User",
    actions: {
      details: "Details",
      approve: "Approve",
      reject: "Reject",
      markPaid: "Mark as Paid",
      markFailed: "Failed",
    },
    emptyTitle: "No withdrawal requests found",
    listTitle: "Withdrawals",
  },
  ar: {
    eyebrow: "إدارة السيولة والسحوبات",
    title: "طلبات سحب أرباح المسوقين",
    description: "مراجعة الطلبات، اعتماد أوامر التحويل، وتسجيل مراجع الدفع عبر بريد الجزائر.",
    refresh: "تحديث",
    searchPlaceholder: "بحث...",
    tabs: {
      ALL: "الكل",
      PENDING: "قيد المراجعة",
      APPROVED: "معتمدة للدفع",
      PAID: "مدفوعة",
      REJECTED: "مرفوضة",
      FAILED: "فشلت",
    },
    table: {
      beneficiary: "المستفيد",
      amount: "المبلغ",
      method: "طريقة السحب والبيانات",
      status: "الحالة",
      date: "التاريخ / المرجع",
      actions: "إجراء",
    },
    priorityBadge: "أولوية قصوى",
    copyBtn: "نسخ البيانات",
    userFallback: "مستخدم",
    actions: {
      details: "التفاصيل",
      approve: "موافقة",
      reject: "رفض",
      markPaid: "تسجيل الدفع",
      markFailed: "فشل",
    },
    emptyTitle: "لا توجد طلبات سحب",
    listTitle: "سجل السحوبات",
  },
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  // Action Modal State
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawal | null>(null);
  const [modalAction, setModalAction] = useState<WithdrawalModalAction | null>(null);

  // Detail Modal State
  const [detailWithdrawal, setDetailWithdrawal] = useState<AdminWithdrawal | null>(null);

  const handleCopyRecipient = (id: string, text: string) => {
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
      const res = await apiGetAdminWithdrawals(
        activeTab === "ALL" ? undefined : activeTab,
        limit,
        offset
      );
      setWithdrawals(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Erreur de chargement des retraits."
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

  const filteredWithdrawals = useMemo(() => {
    if (!searchQuery.trim()) return withdrawals;
    const q = searchQuery.toLowerCase();
    return withdrawals.filter(
      (w) =>
        w.id.toLowerCase().includes(q) ||
        (w.fullName && w.fullName.toLowerCase().includes(q)) ||
        (w.userEmail && w.userEmail.toLowerCase().includes(q)) ||
        w.recipientDetailsMasked.toLowerCase().includes(q) ||
        (w.paymentReference && w.paymentReference.toLowerCase().includes(q))
    );
  }, [withdrawals, searchQuery]);

  const openModal = (withdrawal: AdminWithdrawal, action: WithdrawalModalAction) => {
    setSelectedWithdrawal(withdrawal);
    setModalAction(action);
  };

  const closeModal = () => {
    setSelectedWithdrawal(null);
    setModalAction(null);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const currentLang = (lang === "ar" || lang === "en" || lang === "fr") ? lang : "fr";
        const t = translations[currentLang];

        const tabs = [
          { id: "ALL", label: t.tabs.ALL },
          { id: "PENDING", label: t.tabs.PENDING },
          { id: "APPROVED", label: t.tabs.APPROVED },
          { id: "PAID", label: t.tabs.PAID },
          { id: "REJECTED", label: t.tabs.REJECTED },
          { id: "FAILED", label: t.tabs.FAILED },
        ];

        const renderMobileCard = (w: AdminWithdrawal) => (
          <div
            data-testid="admin-withdrawal-card"
            data-withdrawal-id={w.id}
            className="space-y-2.5 text-xs text-start"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-semibold text-neutral-900 truncate block">
                  {w.fullName || w.userEmail || t.userFallback}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {formatDateTime(w.createdAt, lang)}
                </span>
              </div>
              <WithdrawalStatusBadge status={w.status} lang={lang} />
            </div>

            <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-neutral-100">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-base font-bold font-mono text-neutral-900">
                    {formatDZD(w.amount, lang)}
                  </span>
                  {w.amount >= PRIORITY_THRESHOLD_DZD && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/80 text-[9px] font-mono font-bold shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span>{t.priorityBadge}</span>
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  {w.method === "BARIDIMOB" ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-mono font-bold">
                      BARIDIMOB
                    </span>
                  ) : w.method === "CCP" ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-mono font-bold">
                      CCP
                    </span>
                  ) : (
                    <span className="inline-block px-1.5 py-0.2 rounded bg-neutral-100 font-sans text-[10px] font-semibold text-neutral-700">
                      {w.method}
                    </span>
                  )}
                  <div className="inline-flex items-center gap-1">
                    <span className="text-[11px] text-neutral-600 font-mono">{w.recipientDetailsMasked}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyRecipient(w.id, w.recipientDetailsMasked)}
                      title={t.copyBtn}
                      aria-label={t.copyBtn}
                      className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      {copiedId === w.id ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {w.paymentReference && (
                <div className="text-end text-[10px] text-neutral-500 font-mono">
                  Ref: {w.paymentReference}
                </div>
              )}
            </div>

            {/* Actions on phone & tablet */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              {w.status === "PENDING" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openModal(w, "APPROVE")}
                    className="min-h-[40px] text-xs font-semibold text-emerald-700 bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-100 w-full flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.actions.approve}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => openModal(w, "REJECT")}
                    className="min-h-[40px] text-xs font-semibold w-full flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t.actions.reject}</span>
                  </Button>
                </div>
              )}
              {w.status === "APPROVED" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => openModal(w, "PAID")}
                    className="min-h-[40px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white w-full flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{t.actions.markPaid}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openModal(w, "FAILED")}
                    className="min-h-[40px] text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 w-full flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t.actions.markFailed}</span>
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDetailWithdrawal(w)}
                className="min-h-[38px] text-xs text-neutral-700 hover:text-neutral-900 w-full flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t.actions.details}</span>
              </Button>
            </div>
          </div>
        );

        const renderDesktopTable = () => (
          <table className="w-full text-xs text-start">
            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-start">{t.table.beneficiary}</th>
                <th className="px-4 py-3 text-start">{t.table.amount}</th>
                <th className="px-4 py-3 text-start">{t.table.method}</th>
                <th className="px-4 py-3 text-start">{t.table.status}</th>
                <th className="px-4 py-3 text-start">{t.table.date}</th>
                <th className="px-4 py-3 text-end">{t.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {filteredWithdrawals.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => setDetailWithdrawal(w)}
                  className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3 font-sans">
                    <div className="font-bold text-neutral-900 group-hover:text-emerald-950 transition-colors">
                      {w.fullName || "—"}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono mt-0.5">{w.userEmail}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-neutral-900 text-sm">
                    <div>{formatDZD(w.amount, lang)}</div>
                    {w.amount >= PRIORITY_THRESHOLD_DZD && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/80 text-[9px] font-mono font-bold shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                          <span>{t.priorityBadge}</span>
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {w.method === "BARIDIMOB" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-mono font-bold mb-0.5">
                        BARIDIMOB
                      </span>
                    ) : w.method === "CCP" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-mono font-bold mb-0.5">
                        CCP ALGÉRIE POSTE
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-100 font-sans text-[10px] font-semibold text-neutral-700 mb-0.5">
                        {w.method}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-neutral-600 font-mono">
                        {w.recipientDetailsMasked}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyRecipient(w.id, w.recipientDetailsMasked);
                        }}
                        title={t.copyBtn}
                        aria-label={t.copyBtn}
                        className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                      >
                        {copiedId === w.id ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <WithdrawalStatusBadge status={w.status} lang={lang} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-[11px]">
                    <div>{formatDateTime(w.createdAt, lang)}</div>
                    {w.paymentReference && (
                      <div className="text-emerald-700 font-bold mt-0.5">
                        Ref: {w.paymentReference}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end font-sans">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailWithdrawal(w);
                        }}
                        className="h-7 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 px-2"
                        title={t.actions.details}
                      >
                        <Eye className="w-3.5 h-3.5 me-1" />
                        <span>{t.actions.details}</span>
                      </Button>

                      {w.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(w, "APPROVE");
                            }}
                            className="h-7 text-xs bg-[#064e3b] hover:bg-[#085a44] text-amber-200 border border-emerald-900 shadow-2xs font-semibold px-2.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 me-1 text-amber-300" />
                            <span>{t.actions.approve}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(w, "REJECT");
                            }}
                            className="h-7 text-xs text-rose-700 hover:bg-rose-50"
                          >
                            <XCircle className="w-3.5 h-3.5 me-1" />
                            <span>{t.actions.reject}</span>
                          </Button>
                        </>
                      )}
                      {w.status === "APPROVED" && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(w, "PAID");
                            }}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CreditCard className="w-3.5 h-3.5 me-1" />
                            <span>{t.actions.markPaid}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(w, "FAILED");
                            }}
                            className="h-7 text-xs text-amber-700 hover:bg-amber-50"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 me-1" />
                            <span>{t.actions.markFailed}</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Header */}
            <AdminPageHeader
              eyebrow={t.eyebrow}
              badgeVariant="amber"
              title={t.title}
              description={t.description}
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadData}
                  disabled={isLoading}
                  className="text-xs gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>{t.refresh}</span>
                </Button>
              }
            />

            {/* Filter Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#e7e5df] shadow-xs flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
              <div className="overflow-x-auto pb-1 sm:pb-0">
                <Tabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onChange={(tabId) => {
                    setActiveTab(tabId);
                    setPage(1);
                  }}
                />
              </div>

              <div className="relative sm:w-64 shrink-0">
                <Search className="w-4 h-4 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 text-xs bg-neutral-50 border border-[#e7e5df] rounded-xl focus:bg-white focus:border-neutral-900 font-mono"
                />
              </div>
            </div>

            {/* Responsive Withdrawals List */}
            <ResponsiveAdminList
              items={filteredWithdrawals}
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
              lang={lang}
              title={t.listTitle}
            />

            {/* Detail Modal */}
            {detailWithdrawal && (
              <WithdrawalDetailModal
                withdrawal={detailWithdrawal}
                isOpen={!!detailWithdrawal}
                onClose={() => setDetailWithdrawal(null)}
                onAction={(w, act) => {
                  setDetailWithdrawal(null);
                  openModal(w, act);
                }}
                lang={lang}
              />
            )}

            {/* Action Modal */}
            {selectedWithdrawal && modalAction && (
              <WithdrawalActionModal
                withdrawal={selectedWithdrawal}
                action={modalAction}
                isOpen={!!selectedWithdrawal && !!modalAction}
                onClose={closeModal}
                onSuccess={loadData}
                lang={lang}
              />
            )}
          </div>
        );
      }}
    </DashboardLayout>
  );
}
