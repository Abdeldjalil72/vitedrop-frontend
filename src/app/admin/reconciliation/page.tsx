"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { ReconciliationSummaryCards } from "@/components/admin/reconciliation-summary";
import { ReconciliationStatusBadge } from "@/components/admin/reconciliation-status-badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  apiGetReconciliationSummary,
  apiGetReconciliationWallets,
  apiGetReconciliationOrders,
  apiRunReconciliation,
  apiGetReconciliationRuns,
  ReconciliationSummary,
  WalletDiscrepancy,
  OrderDiscrepancy,
} from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import {
  RefreshCw,
  Play,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function AdminReconciliationPage() {
  const [activeTab, setActiveTab] = useState<string>("wallets");
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [walletDiscrepancies, setWalletDiscrepancies] = useState<WalletDiscrepancy[]>([]);
  const [orderDiscrepancies, setOrderDiscrepancies] = useState<OrderDiscrepancy[]>([]);
  const [runs, setRuns] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumData, walletsData, ordersData, runsData] = await Promise.all([
        apiGetReconciliationSummary(),
        apiGetReconciliationWallets(),
        apiGetReconciliationOrders(),
        apiGetReconciliationRuns().catch(() => []),
      ]);
      setSummary(sumData);
      setWalletDiscrepancies(walletsData.discrepancies || []);
      setOrderDiscrepancies(ordersData.discrepancies || []);
      setRuns(runsData || []);
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement des données de réconciliation.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunReconciliation = async () => {
    setIsRunning(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiRunReconciliation();
      setSuccessMessage("Cycle de réconciliation exécuté avec succès.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Échec de l'exécution de la réconciliation.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const isArabic = lang === "ar";

        const tabs = [
          {
            id: "wallets",
            label: isArabic ? "فروقات المحافظ" : "Écarts Portefeuilles",
            badge: walletDiscrepancies.length,
          },
          {
            id: "orders",
            label: isArabic ? "شذوذ تسوية الطلبيات" : "Anomalies Commandes",
            badge: orderDiscrepancies.length,
          },
          {
            id: "history",
            label: isArabic ? "سجل دورات التدقيق" : "Historique des Runs",
            badge: runs.length,
          },
        ];

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Header */}
            <AdminPageHeader
              eyebrow={isArabic ? "المطابقة والتدقيق المحاسبي" : "Double-Entry Ledger Audit"}
              title={isArabic ? "مطابقة القيود وسلامة الحسابات" : "Réconciliation Financière"}
              description={
                isArabic
                  ? "التأكد من التوازن المحاسبي بين رصيد المحافظ وسجل المعاملات، ورصد أي شذوذ في التسويات."
                  : "Contrôle d'intégrité comptable : variance de solde et complétude des écritures tripartite."
              }
              actions={
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={loadData}
                    disabled={isLoading || isRunning}
                    className="text-xs flex items-center justify-center gap-1.5 h-8"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    <span>{isArabic ? "تحديث" : "Actualiser"}</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRunReconciliation}
                    disabled={isRunning}
                    className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center gap-1.5 h-8"
                  >
                    <Play className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
                    <span>
                      {isRunning
                        ? isArabic
                          ? "جاري التدقيق..."
                          : "Audit..."
                        : isArabic
                        ? "تشغيل دورة"
                        : "Lancer Run"}
                    </span>
                  </Button>
                </div>
              }
            />

            {/* Notifications */}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Summary Cards */}
            <ReconciliationSummaryCards summary={summary} lang={lang} />

            {/* Tabs & Content */}
            <div className="space-y-4">
              <div className="overflow-x-auto pb-1 sm:pb-0">
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
              </div>

              {/* Tab 1: Wallet Discrepancies */}
              {activeTab === "wallets" && (
                <div className="bg-white rounded-xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="p-3.5 sm:p-4 border-b border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800">
                      {isArabic ? "فروقات المحافظ المالية" : "Écarts de Portefeuille (Variance)"}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {walletDiscrepancies.length} {isArabic ? "حالة مسجلة" : "résultat(s)"}
                    </span>
                  </div>

                  {walletDiscrepancies.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center text-neutral-500 space-y-2">
                      <ShieldCheck className="w-9 h-9 text-emerald-500 mx-auto" />
                      <p className="text-sm font-semibold text-neutral-900">
                        {isArabic
                          ? "جميع المحافظ متطابقة تماماً مع سجل القيود"
                          : "Intégrité parfaite : Tous les soldes correspondent au grand livre."}
                      </p>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        cachedBalance == sum(wallet_transactions)
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Cards for Wallets */}
                      <div className="block sm:hidden divide-y divide-neutral-100">
                        {walletDiscrepancies.map((w) => (
                          <div key={w.walletId} className="p-3.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold font-mono text-neutral-900">
                                {w.walletId.slice(0, 8)}...
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  w.ownerType === "SUPPLIER"
                                    ? "bg-purple-100 text-purple-700"
                                    : w.ownerType === "AFFILIATE"
                                    ? "bg-sky-100 text-sky-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {w.ownerType}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100 text-[11px] font-mono">
                              <div>
                                <span className="text-[10px] text-neutral-400 block font-sans">Solde Actuel</span>
                                <span>{formatDZD(w.cachedBalance, lang)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-neutral-400 block font-sans">Somme Ledger</span>
                                <span>{formatDZD(w.ledgerSum, lang)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                              <span className="text-xs font-bold text-rose-600 font-mono">
                                Écart: {formatDZD(w.variance, lang)}
                              </span>
                              <ReconciliationStatusBadge status="discrepancy" lang={lang} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table for Wallets */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-xs text-start">
                          <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                            <tr>
                              <th className="px-4 py-3 text-start">{isArabic ? "معرف المحفظة" : "Wallet ID"}</th>
                              <th className="px-4 py-3 text-start">{isArabic ? "صاحب المحفظة" : "Propriétaire"}</th>
                              <th className="px-4 py-3 text-start">{isArabic ? "الرصيد المسجل" : "Solde Actuel"}</th>
                              <th className="px-4 py-3 text-start">{isArabic ? "مجموع القيود" : "Somme Ledger"}</th>
                              <th className="px-4 py-3 text-start">{isArabic ? "الفارق" : "Variance"}</th>
                              <th className="px-4 py-3 text-end">{isArabic ? "الحالة" : "Diagnostic"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 font-mono">
                            {walletDiscrepancies.map((w) => (
                              <tr key={w.walletId} className="hover:bg-neutral-50/60">
                                <td className="px-4 py-3 font-bold text-neutral-900">
                                  {w.walletId}
                                </td>
                                <td className="px-4 py-3 font-sans">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                                      w.ownerType === "SUPPLIER"
                                        ? "bg-purple-100 text-purple-700"
                                        : w.ownerType === "AFFILIATE"
                                        ? "bg-sky-100 text-sky-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {w.ownerType}
                                  </span>
                                </td>
                                <td className="px-4 py-3">{formatDZD(w.cachedBalance, lang)}</td>
                                <td className="px-4 py-3">{formatDZD(w.ledgerSum, lang)}</td>
                                <td className="px-4 py-3 font-bold text-rose-600">
                                  {formatDZD(w.variance, lang)}
                                </td>
                                <td className="px-4 py-3 text-end font-sans">
                                  <ReconciliationStatusBadge status="discrepancy" lang={lang} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab 2: Order Discrepancies */}
              {activeTab === "orders" && (
                <div className="bg-white rounded-xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="p-3.5 sm:p-4 border-b border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800">
                      {isArabic ? "شذوذ تسوية طلبيات التوصيل" : "Anomalies de Règlement des Commandes"}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {orderDiscrepancies.length} {isArabic ? "حالة" : "anomalie(s)"}
                    </span>
                  </div>

                  {orderDiscrepancies.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center text-neutral-500 space-y-2">
                      <ShieldCheck className="w-9 h-9 text-emerald-500 mx-auto" />
                      <p className="text-sm font-semibold text-neutral-900">
                        {isArabic
                          ? "جميع الطلبيات المسلمة تمت تسويتها دون أي تكرار أو نقص"
                          : "Toutes les commandes livrées sont correctement régularisées."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Cards for Orders */}
                      <div className="block sm:hidden divide-y divide-neutral-100">
                        {orderDiscrepancies.map((o) => (
                          <div key={o.orderId} className="p-3.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                href={`/admin/orders/${o.orderId}`}
                                className="font-bold text-neutral-900 hover:text-rose-600 font-mono underline"
                              >
                                #{o.orderId.slice(0, 8)}...
                              </Link>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-700">
                                {o.orderStatus}
                              </span>
                            </div>
                            <div className="text-rose-600 font-medium">
                              {o.issue}
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-neutral-100 font-mono text-[11px]">
                              <span>CPA: {formatDZD(o.expectedCpa, lang)}</span>
                              <Link href={`/admin/orders/${o.orderId}`}>
                                <Button variant="secondary" size="sm" className="h-7 px-2 text-xs">
                                  {isArabic ? "تسوية" : "Inspecter"}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table for Orders */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-xs text-start">
                          <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                            <tr>
                              <th className="px-4 py-3 text-start">{isArabic ? "الطلبية" : "Order ID"}</th>
                              <th className="px-4 py-3 text-start">{isArabic ? "الحالة والتتبع" : "Statut & Suivi"}</th>
                              <th className="px-4 py-3 text-start">{isArabic ? "CPA المتوقع" : "CPA Prévu"}</th>
                              <th className="px-4 py-3 text-start">{isArabic ? "الخصم والتحويل" : "Débit vs Payout"}</th>
                              <th className="px-4 py-3 text-start">{isArabic ? "المشكلة المرصودة" : "Problème"}</th>
                              <th className="px-4 py-3 text-end">{isArabic ? "إجراء" : "Action"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 font-mono">
                            {orderDiscrepancies.map((o) => (
                              <tr key={o.orderId} className="hover:bg-neutral-50/60">
                                <td className="px-4 py-3">
                                  <Link
                                    href={`/admin/orders/${o.orderId}`}
                                    className="font-bold text-neutral-900 hover:text-rose-600 underline"
                                  >
                                    {o.orderId.slice(0, 8)}...
                                  </Link>
                                </td>
                                <td className="px-4 py-3 font-sans">
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-700">
                                    {o.orderStatus}
                                  </span>
                                  {o.trackingNumber && (
                                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                      {o.trackingNumber}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3">{formatDZD(o.expectedCpa, lang)}</td>
                                <td className="px-4 py-3">
                                  <div>Deb: {formatDZD(o.supplierDebitSum, lang)}</div>
                                  <div className="text-[10px] text-neutral-400">
                                    Aff: {formatDZD(o.affiliatePayoutSum, lang)} &bull; Fee:{" "}
                                    {formatDZD(o.platformFeeSum, lang)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-sans text-rose-600 font-medium">
                                  {o.issue}
                                </td>
                                <td className="px-4 py-3 text-end font-sans">
                                  <Link href={`/admin/orders/${o.orderId}`}>
                                    <Button variant="secondary" size="sm" className="h-7 text-xs">
                                      {isArabic ? "فحص وتسوية" : "Inspecter"}
                                    </Button>
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab 3: History */}
              {activeTab === "history" && (
                <div className="bg-white rounded-xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="p-3.5 sm:p-4 border-b border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800">
                      {isArabic ? "سجل دورات التدقيق السابقة" : "Historique des Cycles d'Audit"}
                    </span>
                  </div>

                  {runs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-400">
                      {isArabic ? "لا توجد دورات تدقيق سابقة مسجلة." : "Aucun historique disponible."}
                    </div>
                  ) : (
                    <>
                      {/* Mobile Cards for Runs */}
                      <div className="block sm:hidden divide-y divide-neutral-100">
                        {runs.map((run) => (
                          <div key={run.id} className="p-3.5 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold font-mono">#{run.id.slice(0, 8)}...</span>
                              <span
                                className={`text-[11px] font-semibold ${
                                  run.walletsWithVariance === 0 ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {run.walletsWithVariance === 0 ? "CONFORME" : "ÉCARTS"}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono">
                              {formatDateTime(run.createdAt, lang)}
                            </div>
                            <div className="text-[11px] text-neutral-600">
                              Portefeuilles: {run.walletsAudited} | Écarts: {run.walletsWithVariance}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table for Runs */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-xs text-start">
                          <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                            <tr>
                              <th className="px-4 py-3 text-start">{isArabic ? "المعرف" : "ID"}</th>
                              <th className="px-4 py-3 text-start">{isArabic ? "التاريخ" : "Date"}</th>
                              <th className="px-4 py-3 text-start">{isArabic ? "المحافظ المراجعة" : "Wallets"}</th>
                              <th className="px-4 py-3 text-start">{isArabic ? "الفوارق" : "Écarts"}</th>
                              <th className="px-4 py-3 text-end">{isArabic ? "النتيجة" : "Résultat"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 font-mono">
                            {runs.map((run) => (
                              <tr key={run.id} className="hover:bg-neutral-50/60">
                                <td className="px-4 py-3 font-bold text-neutral-900">
                                  {run.id.slice(0, 8)}...
                                </td>
                                <td className="px-4 py-3 text-neutral-500">
                                  {formatDateTime(run.createdAt, lang)}
                                </td>
                                <td className="px-4 py-3">{run.walletsAudited}</td>
                                <td className="px-4 py-3 text-rose-600 font-bold">
                                  {run.walletsWithVariance}
                                </td>
                                <td className="px-4 py-3 text-end font-sans">
                                  {run.walletsWithVariance === 0 ? (
                                    <span className="text-emerald-600 font-semibold text-xs">
                                      CONFORME
                                    </span>
                                  ) : (
                                    <span className="text-rose-600 font-semibold text-xs">
                                      DISCORDANCES
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
