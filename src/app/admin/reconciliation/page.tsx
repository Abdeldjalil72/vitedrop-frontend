"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { ReconciliationSummaryCards } from "@/components/admin/reconciliation-summary";
import { ReconciliationStatusBadge } from "@/components/admin/reconciliation-status-badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveAdminList } from "@/components/admin/responsive-admin-list";
import {
  apiGetReconciliationSummary,
  apiGetReconciliationWallets,
  apiGetReconciliationOrders,
  apiRunReconciliation,
  apiGetReconciliationRuns,
  apiGetAdminUsers,
  ReconciliationSummary,
  WalletDiscrepancy,
  OrderDiscrepancy,
  ReconciliationRun,
} from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { translations, Language } from "@/lib/locales";
import { AdminTopUpModal, AdminTopUpSupplierInfo } from "@/components/admin/admin-topup-modal";
import {
  RefreshCw,
  Play,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Clock,
  X,
  ExternalLink,
  Wallet,
} from "lucide-react";

const PAGE_SIZE = 10;

export default function AdminReconciliationPage() {
  const [activeTab, setActiveTab] = useState<string>("wallets");
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [walletDiscrepancies, setWalletDiscrepancies] = useState<WalletDiscrepancy[]>([]);
  const [orderDiscrepancies, setOrderDiscrepancies] = useState<OrderDiscrepancy[]>([]);
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);

  const [walletPage, setWalletPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [runPage, setRunPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [suppliersList, setSuppliersList] = useState<AdminTopUpSupplierInfo[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenTopUp = async () => {
    setIsTopUpModalOpen(true);
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
        // Keep existing list
      }
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRunsError(null);

    // Core summary, wallets, and orders
    try {
      const [sumData, walletsData, ordersData] = await Promise.all([
        apiGetReconciliationSummary(),
        apiGetReconciliationWallets(),
        apiGetReconciliationOrders(),
      ]);
      setSummary(sumData);
      setWalletDiscrepancies(walletsData.discrepancies || []);
      setOrderDiscrepancies(ordersData.discrepancies || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des données de réconciliation.";
      setError(msg);
    }

    // Pre-fetch suppliers list for Top-Up desk
    try {
      const usersData = await apiGetAdminUsers();
      if (Array.isArray(usersData)) {
        const suppliers = usersData
          .filter((u) => u.role === "SUPPLIER")
          .map((u) => ({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
            balance: u.balance,
          }));
        setSuppliersList(suppliers);
      }
    } catch {
      // Keep existing list
    }

    // Run history isolated so secondary failure doesn't conceal discrepancies
    try {
      const runsData = await apiGetReconciliationRuns();
      setRuns(runsData || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible de charger l'historique des cycles d'audit.";
      setRunsError(msg);
      setRuns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        void loadData();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [loadData]);

  // Modal keyboard dismissal
  useEffect(() => {
    if (!isConfirmModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isRunning) {
        setIsConfirmModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmModalOpen, isRunning]);

  const handleCopy = (id: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      void navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        })
        .catch(() => {
          // Clipboard access may be unavailable in restricted browser contexts.
        });
    }
  };

  const executeReconciliationRun = async (lang: Language) => {
    setIsRunning(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { run } = await apiRunReconciliation();
      const runIdShort = run?.id ? `#${run.id.slice(0, 8)}` : "";
      setSuccessMessage(
        lang === "ar"
          ? `تم تنفيذ دورة التدقيق ${runIdShort} بنجاح.`
          : lang === "en"
          ? `Reconciliation audit run ${runIdShort} executed successfully.`
          : `Cycle d'audit ${runIdShort} exécuté avec succès.`
      );
      setIsConfirmModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Échec de l'exécution de la réconciliation.";
      setError(msg);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang] || translations.fr;
        const rec = t.reconciliation;
        const isAr = lang === "ar";
        const isEn = lang === "en";

        const isClean =
          summary !== null &&
          summary.walletsWithVariance === 0 &&
          summary.totalVarianceAmount === 0 &&
          summary.ordersMissingSettlement === 0;

        const tabs = [
          {
            id: "wallets",
            label: rec.tabs.wallets,
            badge: walletDiscrepancies.length,
          },
          {
            id: "orders",
            label: rec.tabs.orders,
            badge: orderDiscrepancies.length,
          },
          {
            id: "history",
            label: rec.tabs.history,
            badge: runs.length,
          },
        ];

        // Paginated slices
        const paginatedWallets = walletDiscrepancies.slice(
          (walletPage - 1) * PAGE_SIZE,
          walletPage * PAGE_SIZE
        );
        const totalWalletPages = Math.ceil(walletDiscrepancies.length / PAGE_SIZE) || 1;

        const paginatedOrders = orderDiscrepancies.slice(
          (orderPage - 1) * PAGE_SIZE,
          orderPage * PAGE_SIZE
        );
        const totalOrderPages = Math.ceil(orderDiscrepancies.length / PAGE_SIZE) || 1;

        const paginatedRuns = runs.slice(
          (runPage - 1) * PAGE_SIZE,
          runPage * PAGE_SIZE
        );
        const totalRunPages = Math.ceil(runs.length / PAGE_SIZE) || 1;

        // Render Desktop Table for Wallets
        const renderWalletTable = () => (
          <table className="w-full text-xs text-start">
            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-start">{rec.wallets.colWalletId}</th>
                <th className="px-4 py-3 text-start">{rec.wallets.colOwner}</th>
                <th className="px-4 py-3 text-start">{rec.wallets.colCachedBalance}</th>
                <th className="px-4 py-3 text-start">{rec.wallets.colLedgerSum}</th>
                <th className="px-4 py-3 text-start">{rec.wallets.colVariance}</th>
                <th className="px-4 py-3 text-end">{rec.wallets.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {paginatedWallets.map((w) => (
                <tr key={w.walletId} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                    <div className="flex items-center gap-1.5">
                      <span title={w.walletId}>#{w.walletId.slice(0, 8)}...</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`w-${w.walletId}`, w.walletId)}
                        aria-label={t.common.copy}
                        className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 transition-colors"
                      >
                        {copiedId === `w-${w.walletId}` ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        w.ownerType === "SUPPLIER"
                          ? "bg-purple-50 text-purple-800 border border-purple-200"
                          : w.ownerType === "AFFILIATE"
                          ? "bg-sky-50 text-sky-800 border border-sky-200"
                          : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                      }`}
                    >
                      {w.ownerType}
                    </span>
                    <span className="block text-[10px] text-neutral-400 font-mono mt-0.5 truncate max-w-[120px]">
                      {w.ownerId}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-800">
                    {formatDZD(w.cachedBalance, lang)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatDZD(w.ledgerSum, lang)}
                  </td>
                  <td
                    className={`px-4 py-3 font-bold ${
                      w.variance === 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {w.variance > 0 ? `+${formatDZD(w.variance, lang)}` : formatDZD(w.variance, lang)}
                  </td>
                  <td className="px-4 py-3 text-end font-sans">
                    <ReconciliationStatusBadge
                      status={w.variance === 0 ? "reconciled" : "discrepancy"}
                      lang={lang}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

        // Render Mobile Card for Wallets
        const renderWalletCard = (w: WalletDiscrepancy) => (
          <div
            data-testid="reconciliation-wallet-card"
            data-wallet-id={w.walletId}
            className="space-y-2.5 text-xs text-start"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold font-mono text-neutral-900 truncate">
                  #{w.walletId.slice(0, 8)}...
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(`wm-${w.walletId}`, w.walletId)}
                  aria-label={t.common.copy}
                  className="p-0.5 rounded text-neutral-400 hover:text-neutral-700"
                >
                  {copiedId === `wm-${w.walletId}` ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <ReconciliationStatusBadge
                status={w.variance === 0 ? "reconciled" : "discrepancy"}
                lang={lang}
              />
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  w.ownerType === "SUPPLIER"
                    ? "bg-purple-50 text-purple-800 border border-purple-200"
                    : w.ownerType === "AFFILIATE"
                    ? "bg-sky-50 text-sky-800 border border-sky-200"
                    : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                }`}
              >
                {w.ownerType}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono truncate">
                {w.ownerId}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-neutral-100 text-[11px] font-mono">
              <div>
                <span className="text-[10px] text-neutral-400 block font-sans">
                  {rec.wallets.colCachedBalance}
                </span>
                <span className="font-semibold text-neutral-800">
                  {formatDZD(w.cachedBalance, lang)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block font-sans">
                  {rec.wallets.colLedgerSum}
                </span>
                <span className="text-neutral-600">
                  {formatDZD(w.ledgerSum, lang)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100">
              <span className="text-[11px] font-sans text-neutral-500">
                {rec.wallets.colVariance}
              </span>
              <span
                className={`font-mono font-bold text-xs ${
                  w.variance === 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {w.variance > 0 ? `+${formatDZD(w.variance, lang)}` : formatDZD(w.variance, lang)}
              </span>
            </div>
          </div>
        );

        // Render Desktop Table for Orders
        const renderOrderTable = () => (
          <table className="w-full text-xs text-start">
            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-start">{rec.orders.colOrderId}</th>
                <th className="px-4 py-3 text-start">{rec.orders.colStatusTracking}</th>
                <th className="px-4 py-3 text-start">{rec.orders.colExpectedCpa}</th>
                <th className="px-4 py-3 text-start">{rec.orders.colDebitVsPayout}</th>
                <th className="px-4 py-3 text-start">{rec.orders.colIssue}</th>
                <th className="px-4 py-3 text-end">{rec.orders.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {paginatedOrders.map((o) => (
                <tr key={o.orderId} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.orderId}`}
                      className="font-bold text-neutral-900 hover:text-emerald-800 flex items-center gap-1 group"
                    >
                      <span>#{o.orderId.slice(0, 8)}...</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-emerald-700" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-700 font-medium">
                      {o.orderStatus}
                    </span>
                    {o.trackingNumber && (
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        {o.trackingNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-800">
                    {formatDZD(o.expectedCpa, lang)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-neutral-700">Deb: {formatDZD(o.supplierDebitSum, lang)}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Aff: {formatDZD(o.affiliatePayoutSum, lang)} &bull; Fee:{" "}
                      {formatDZD(o.platformFeeSum, lang)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans text-rose-700 font-medium max-w-xs truncate">
                    {o.issue}
                  </td>
                  <td className="px-4 py-3 text-end font-sans">
                    <Link href={`/admin/orders/${o.orderId}`}>
                      <Button variant="secondary" size="sm" className="h-7 text-xs px-2.5">
                        <span>{rec.orders.btnInspect}</span>
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

        // Render Mobile Card for Orders
        const renderOrderCard = (o: OrderDiscrepancy) => (
          <div
            data-testid="reconciliation-order-card"
            data-order-id={o.orderId}
            className="space-y-2.5 text-xs text-start"
          >
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/admin/orders/${o.orderId}`}
                className="font-bold text-neutral-900 hover:text-emerald-800 font-mono flex items-center gap-1 group"
              >
                <span>#{o.orderId.slice(0, 8)}...</span>
                <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-emerald-700" />
              </Link>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-700 font-medium">
                {o.orderStatus}
              </span>
            </div>

            {o.trackingNumber && (
              <div className="text-[10px] text-neutral-400 font-mono">
                Tracking: {o.trackingNumber}
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
              {o.issue}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100 font-mono text-[11px]">
              <div>
                <span className="text-[10px] text-neutral-400 block font-sans">
                  {rec.orders.colExpectedCpa}
                </span>
                <span className="font-semibold text-neutral-800">
                  {formatDZD(o.expectedCpa, lang)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block font-sans">
                  Deb / Aff / Fee
                </span>
                <span className="text-neutral-600 text-[10px]">
                  {formatDZD(o.supplierDebitSum, lang)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1.5 border-t border-neutral-100">
              <Link href={`/admin/orders/${o.orderId}`}>
                <Button variant="secondary" size="sm" className="h-7 text-xs px-2.5">
                  <span>{rec.orders.btnInspect}</span>
                </Button>
              </Link>
            </div>
          </div>
        );

        // Render Desktop Table for Runs
        const renderRunTable = () => (
          <table className="w-full text-xs text-start">
            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-start">{rec.history.colRunId}</th>
                <th className="px-4 py-3 text-start">{rec.history.colDate}</th>
                <th className="px-4 py-3 text-start">{rec.history.colWalletsAudited}</th>
                <th className="px-4 py-3 text-start">{rec.history.colVariances}</th>
                <th className="px-4 py-3 text-end">{rec.history.colResult}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {paginatedRuns.map((run) => (
                <tr key={run.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="px-4 py-3 font-bold text-neutral-900">
                    <div className="flex items-center gap-1.5">
                      <span title={run.id}>#{run.id.slice(0, 8)}...</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`r-${run.id}`, run.id)}
                        aria-label={t.common.copy}
                        className="p-0.5 rounded text-neutral-400 hover:text-neutral-700"
                      >
                        {copiedId === `r-${run.id}` ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-[11px]">
                    {formatDateTime(run.createdAt, lang)}
                  </td>
                  <td className="px-4 py-3 text-neutral-800">{run.walletsAudited}</td>
                  <td
                    className={`px-4 py-3 font-bold ${
                      run.walletsWithVariance === 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {run.walletsWithVariance}
                  </td>
                  <td className="px-4 py-3 text-end font-sans">
                    {run.walletsWithVariance === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{rec.history.resultClean}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>{rec.history.resultAnomalies}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

        // Render Mobile Card for Runs
        const renderRunCard = (run: ReconciliationRun) => (
          <div
            data-testid="reconciliation-run-card"
            data-run-id={run.id}
            className="space-y-2 text-xs text-start"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold font-mono text-neutral-900">
                #{run.id.slice(0, 8)}...
              </span>
              {run.walletsWithVariance === 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  <span>{rec.history.resultClean}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                  <span>{rec.history.resultAnomalies}</span>
                </span>
              )}
            </div>

            <div className="text-[11px] text-neutral-500 font-mono">
              {formatDateTime(run.createdAt, lang)}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-100 font-mono text-[11px]">
              <span className="text-neutral-500 font-sans">
                {rec.history.colWalletsAudited}: {run.walletsAudited}
              </span>
              <span
                className={`font-bold ${
                  run.walletsWithVariance === 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {rec.history.colVariances}: {run.walletsWithVariance}
              </span>
            </div>
          </div>
        );

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Header */}
            <AdminPageHeader
              eyebrow={rec.header.eyebrow}
              badgeVariant={isClean ? "emerald" : "amber"}
              title={rec.header.title}
              description={rec.header.description}
              actions={
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleOpenTopUp}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 h-8 rounded-full bg-[#064e3b] hover:bg-[#085a44] border border-[#0a5e47] text-amber-200 text-xs font-semibold shadow-xs active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-amber-300 cursor-pointer"
                    data-testid="header-topup-supplier-btn"
                  >
                    <Wallet className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                    <span>{isAr ? "شحن رصيد مورد" : isEn ? "Top-Up Supplier" : "Recharger Fournisseur"}</span>
                  </button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={loadData}
                    disabled={isLoading || isRunning}
                    className="text-xs flex items-center justify-center gap-1.5 h-8 px-3"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    <span>{rec.actions.refresh}</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => setIsConfirmModalOpen(true)}
                    disabled={isRunning}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 h-8 rounded-full bg-[#064e3b] hover:bg-[#085a44] border border-[#0a5e47] text-amber-200 text-xs font-semibold shadow-xs active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Play className={`w-3.5 h-3.5 text-amber-300 ${isRunning ? "animate-spin" : ""}`} aria-hidden="true" />
                    <span>{isRunning ? rec.actions.runningAudit : rec.actions.runAudit}</span>
                  </button>
                </div>
              }
            />

            {/* Audit Posture Status Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#e7e5df] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isClean ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
                    }`}
                  />
                  <span>{isClean ? rec.posture.allBalanced : rec.posture.anomaliesDetected}</span>
                </span>
                <span className="text-neutral-300 font-mono hidden sm:inline">&bull;</span>
                <span className="text-neutral-500 font-mono text-[11px]">
                  {rec.posture.lastAuditPrefix}:{" "}
                  {summary?.lastRunAt
                    ? formatDateTime(summary.lastRunAt, lang)
                    : rec.posture.neverAudited}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700">
                  {walletDiscrepancies.length} {rec.wallets.countLabel}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700">
                  {orderDiscrepancies.length} {rec.orders.countLabel}
                </span>
              </div>
            </div>

            {/* Notifications */}
            {successMessage && (
              <div
                role="status"
                className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-2xs"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shadow-2xs"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Summary Cards */}
            <ReconciliationSummaryCards summary={summary} lang={lang} />

            {/* Discrepancy Tabs & Filter Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#e7e5df] shadow-xs">
              <div className="overflow-x-auto pb-1 sm:pb-0">
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
              </div>
            </div>

            {/* Tab 1: Wallets */}
            {activeTab === "wallets" && (
              <ResponsiveAdminList
                items={paginatedWallets}
                total={walletDiscrepancies.length}
                isLoading={isLoading}
                error={null}
                page={walletPage}
                totalPages={totalWalletPages}
                onPageChange={setWalletPage}
                renderTable={renderWalletTable}
                renderCard={renderWalletCard}
                emptyIcon={<ShieldCheck className="w-10 h-10 text-emerald-600" />}
                emptyTitle={rec.wallets.emptyTitle}
                emptyDescription={rec.wallets.emptyDesc}
                lang={lang}
                title={rec.wallets.title}
              />
            )}

            {/* Tab 2: Orders */}
            {activeTab === "orders" && (
              <ResponsiveAdminList
                items={paginatedOrders}
                total={orderDiscrepancies.length}
                isLoading={isLoading}
                error={null}
                page={orderPage}
                totalPages={totalOrderPages}
                onPageChange={setOrderPage}
                renderTable={renderOrderTable}
                renderCard={renderOrderCard}
                emptyIcon={<ShieldCheck className="w-10 h-10 text-emerald-600" />}
                emptyTitle={rec.orders.emptyTitle}
                emptyDescription={rec.orders.emptyDesc}
                lang={lang}
                title={rec.orders.title}
              />
            )}

            {/* Tab 3: History */}
            {activeTab === "history" && (
              <ResponsiveAdminList
                items={paginatedRuns}
                total={runs.length}
                isLoading={isLoading}
                error={runsError}
                page={runPage}
                totalPages={totalRunPages}
                onPageChange={setRunPage}
                renderTable={renderRunTable}
                renderCard={renderRunCard}
                emptyIcon={<Clock className="w-10 h-10 text-neutral-300" />}
                emptyTitle={rec.history.emptyTitle}
                emptyDescription={rec.history.emptyDesc}
                lang={lang}
                title={rec.history.title}
              />
            )}

            {/* Audit Run Confirmation Modal */}
            {isConfirmModalOpen && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-run-title"
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
              >
                <div className="bg-white rounded-3xl border border-[#e7e5df] shadow-2xl max-w-md w-full p-6 text-start space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 id="confirm-run-title" className="text-base font-bold text-neutral-900">
                      {rec.actions.confirmRunTitle}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsConfirmModalOpen(false)}
                      disabled={isRunning}
                      aria-label={rec.actions.cancelBtn}
                      className="p-1 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {rec.actions.confirmRunDesc}
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsConfirmModalOpen(false)}
                      disabled={isRunning}
                      className="text-xs h-8 px-3"
                    >
                      {rec.actions.cancelBtn}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => executeReconciliationRun(lang)}
                      disabled={isRunning}
                      className="text-xs h-8 px-4 bg-[#064e3b] hover:bg-[#085a44] text-amber-200 border border-emerald-900 shadow-2xs font-semibold flex items-center gap-1.5"
                    >
                      {isRunning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{rec.actions.runningAudit}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-amber-300" />
                          <span>{rec.actions.confirmRunBtn}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Prepaid Escrow Supplier Top-Up Modal */}
            <AdminTopUpModal
              isOpen={isTopUpModalOpen}
              onClose={() => setIsTopUpModalOpen(false)}
              suppliersList={suppliersList}
              onSuccess={() => {
                loadData();
                setSuccessMessage(
                  isAr
                    ? "تم شحن رصيد المورد وتحديث الخزينة بنجاح"
                    : isEn
                    ? "Supplier escrow balance credited and treasury updated"
                    : "Solde séquestre fournisseur rechargé et trésorerie actualisée"
                );
                setTimeout(() => setSuccessMessage(null), 4000);
              }}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
