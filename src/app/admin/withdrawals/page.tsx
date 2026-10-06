"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { WithdrawalStatusBadge } from "@/components/admin/withdrawal-status-badge";
import {
  WithdrawalActionModal,
  WithdrawalModalAction,
} from "@/components/admin/withdrawal-action-modal";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveAdminList } from "@/components/admin/responsive-admin-list";
import {
  apiGetAdminWithdrawals,
  AdminWithdrawal,
  WithdrawalStatus,
} from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import {
  Receipt,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  // Action Modal State
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawal | null>(null);
  const [modalAction, setModalAction] = useState<WithdrawalModalAction | null>(null);

  const loadData = async () => {
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
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur de chargement des retraits.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, page]);

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
        const isArabic = lang === "ar";

        const tabs = [
          { id: "ALL", label: isArabic ? "الكل" : "Toutes les demandes" },
          { id: "PENDING", label: isArabic ? "قيد المراجعة" : "En attente (Pending)" },
          { id: "APPROVED", label: isArabic ? "معتمدة للدفع" : "Approuvées (À payer)" },
          { id: "PAID", label: isArabic ? "مدفوعة" : "Payées" },
          { id: "REJECTED", label: isArabic ? "مرفوضة" : "Rejetées" },
          { id: "FAILED", label: isArabic ? "فشلت" : "Échouées" },
        ];

        const renderMobileCard = (w: AdminWithdrawal) => (
          <div className="space-y-2.5 text-xs text-start">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-semibold text-neutral-900 truncate block">
                  {w.fullName || w.userEmail || "Utilisateur"}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {formatDateTime(w.createdAt, lang)}
                </span>
              </div>
              <WithdrawalStatusBadge status={w.status} lang={lang} />
            </div>

            <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-neutral-100">
              <div>
                <span className="text-base font-bold font-mono text-neutral-900">
                  {formatDZD(w.amount, lang)}
                </span>
                <div className="text-[11px] text-neutral-600 font-mono mt-0.5">
                  <span className="font-semibold text-neutral-700">{w.method}:</span> {w.recipientDetailsMasked}
                </div>
              </div>
              {w.paymentReference && (
                <div className="text-end text-[10px] text-neutral-500 font-mono">
                  Ref: {w.paymentReference}
                </div>
              )}
            </div>

            {/* Actions on phone */}
            {(w.status === "PENDING" || w.status === "APPROVED") && (
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-neutral-100">
                {w.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openModal(w, "APPROVE")}
                      className="h-7 text-xs text-emerald-700 hover:bg-emerald-50 px-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 me-1" />
                      <span>{isArabic ? "موافقة" : "Approuver"}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openModal(w, "REJECT")}
                      className="h-7 text-xs text-rose-700 hover:bg-rose-50 px-2"
                    >
                      <XCircle className="w-3.5 h-3.5 me-1" />
                      <span>{isArabic ? "رفض" : "Rejeter"}</span>
                    </Button>
                  </>
                )}
                {w.status === "APPROVED" && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => openModal(w, "PAID")}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                    >
                      <CreditCard className="w-3.5 h-3.5 me-1" />
                      <span>{isArabic ? "تسجيل الدفع" : "Marquer Payé"}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openModal(w, "FAILED")}
                      className="h-7 text-xs text-amber-700 hover:bg-amber-50 px-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 me-1" />
                      <span>{isArabic ? "فشل" : "Échoué"}</span>
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        );

        const renderDesktopTable = () => (
          <table className="w-full text-xs text-start">
            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-start">{isArabic ? "المستفيد" : "Bénéficiaire"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "المبلغ" : "Montant"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "طريقة السحب والبيانات" : "Méthode & Coordonnées"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "الحالة" : "Statut"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "التاريخ / المرجع" : "Date & Référence"}</th>
                <th className="px-4 py-3 text-end">{isArabic ? "إجراء" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {filteredWithdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="px-4 py-3 font-sans">
                    <div className="font-bold text-neutral-900">{w.fullName || "—"}</div>
                    <div className="text-[11px] text-neutral-500 font-mono mt-0.5">{w.userEmail}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-neutral-900 text-sm">
                    {formatDZD(w.amount, lang)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-100 font-sans text-[10px] font-semibold text-neutral-700 mb-0.5">
                      {w.method}
                    </span>
                    <div className="text-[11px] text-neutral-600 font-mono">
                      {w.recipientDetailsMasked}
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
                    <div className="flex items-center justify-end gap-1.5">
                      {w.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openModal(w, "APPROVE")}
                            className="h-7 text-xs text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 me-1" />
                            <span>{isArabic ? "موافقة" : "Approuver"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openModal(w, "REJECT")}
                            className="h-7 text-xs text-rose-700 hover:bg-rose-50"
                          >
                            <XCircle className="w-3.5 h-3.5 me-1" />
                            <span>{isArabic ? "رفض" : "Rejeter"}</span>
                          </Button>
                        </>
                      )}
                      {w.status === "APPROVED" && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openModal(w, "PAID")}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CreditCard className="w-3.5 h-3.5 me-1" />
                            <span>{isArabic ? "تسجيل الدفع" : "Marquer Payé"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openModal(w, "FAILED")}
                            className="h-7 text-xs text-amber-700 hover:bg-amber-50"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 me-1" />
                            <span>{isArabic ? "فشل" : "Échoué"}</span>
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
              eyebrow={isArabic ? "إدارة السيولة والسحوبات" : "Trésorerie & Payouts BaridiMob/CCP"}
              title={isArabic ? "طلبات سحب أرباح المسوقين" : "Gestion des Retraits Affiliés"}
              description={
                isArabic
                  ? "مراجعة الطلبات، اعتماد أوامر التحويل، وتسجيل مراجع الدفع عبر بريد الجزائر."
                  : "Flux d'approbation et d'exécution des paiements avec double-écriture comptable."
              }
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadData}
                  disabled={isLoading}
                  className="text-xs gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>{isArabic ? "تحديث" : "Actualiser"}</span>
                </Button>
              }
            />

            {/* Filter Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
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
                  placeholder={isArabic ? "بحث..." : "Filtrer..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white font-mono"
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
              emptyTitle={isArabic ? "لا توجد طلبات سحب" : "Aucune demande de retrait"}
              lang={lang}
              title={isArabic ? "سجل السحوبات" : "Retraits"}
            />

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
