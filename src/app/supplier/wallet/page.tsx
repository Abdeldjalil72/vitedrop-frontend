"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import { SupplierTopUpModal } from "@/components/supplier/supplier-topup-modal";
import {
  apiGetMyWallet,
  apiGetTransactions,
  apiGetSupplierOrders,
  apiGetMyDepositRequests,
  updateGlobalWalletBalance,
  SupplierOrder,
  DepositRequest,
} from "@/lib/api-client";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Search,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Download,
  Sparkles,
  X,
  FileText,
} from "lucide-react";

export interface WalletTransactionItem {
  id: string;
  walletId: string;
  type: "DEPOSIT" | "SUPPLIER_DEBIT" | "CPA_PAYOUT" | "PLATFORM_FEE" | "WITHDRAWAL" | "WITHDRAWAL_REFUND" | string;
  amount: number;
  balanceAfter?: number | null;
  reference?: string | null;
  createdAt: string;
}

export default function SupplierWalletPage() {
  const [wallet, setWallet] = useState<{ id: string; balance: number; ownerType: string } | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DEPOSITS" | "DEBITS">("ALL");
  const [timeframeFilter, setTimeframeFilter] = useState<"ALL" | "TODAY" | "7_DAYS" | "THIS_MONTH">("ALL");

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const [walletRes, txRes, ordersRes, depositsRes] = await Promise.allSettled([
        apiGetMyWallet(),
        apiGetTransactions(100, 0),
        apiGetSupplierOrders(),
        apiGetMyDepositRequests(),
      ]);

      if (walletRes.status === "fulfilled" && walletRes.value) {
        const bal = Number(walletRes.value.balance || 0);
        setWallet({
          ...walletRes.value,
          balance: bal,
        });
        updateGlobalWalletBalance(bal);
      } else {
        setWallet({ id: "", balance: 0, ownerType: "SUPPLIER" });
        updateGlobalWalletBalance(0);
      }

      if (txRes.status === "fulfilled" && txRes.value) {
        const list = Array.isArray(txRes.value)
          ? txRes.value
          : Array.isArray(txRes.value?.data)
          ? txRes.value.data
          : [];
        setTransactions(list);
      } else {
        setTransactions([]);
      }

      if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value)) {
        setOrders(ordersRes.value);
      }

      if (depositsRes.status === "fulfilled" && Array.isArray(depositsRes.value)) {
        setDepositRequests(depositsRes.value);
      }
    } catch (err) {
      console.warn("Failed to load supplier wallet data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyPreset = (amount: number, customMsg?: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(String(amount));
      setActionMessage(customMsg || `Montant de ${formatDZD(amount, "fr")} copié dans le presse-papiers pour BaridiMob.`);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const balance = wallet?.balance || 0;
  const isLowBalance = balance < 3000;

  // In-Transit CPA liability & solvency telemetry
  const inTransitOrders = orders.filter(
    (o) => o.status === "dispatched" || o.status === "in_transit"
  );
  const inTransitLiability = inTransitOrders.reduce(
    (sum, o) => sum + (Number(o.cpaCommission || 0) + Number(o.platformFee || 0)),
    0
  );
  const inTransitCount = inTransitOrders.length;
  const netFreeMargin = Math.max(0, balance - inTransitLiability);
  const runwayDeliveries = Math.floor(balance / 1250);
  const runwayStatus: "OPTIMAL" | "WARNING" | "CRITICAL" =
    balance >= 10000 ? "OPTIMAL" : balance >= 3000 ? "WARNING" : "CRITICAL";
  const coveragePercentage =
    balance > 0 ? Math.min(100, Math.round((netFreeMargin / balance) * 100)) : 0;
  const recommendedTopupAmount = Math.max(
    15000,
    inTransitLiability > 0 ? inTransitLiability * 2 : 25000
  );

  // Filtered transactions with Timeframe support
  const now = Date.now();
  const filteredTransactions = transactions.filter((tx) => {
    const isDeposit = tx.type === "DEPOSIT";
    const isDebit = tx.type === "SUPPLIER_DEBIT" || Number(tx.amount) < 0;

    const matchesType =
      typeFilter === "ALL" ||
      (typeFilter === "DEPOSITS" && isDeposit) ||
      (typeFilter === "DEBITS" && isDebit);

    const matchesSearch =
      searchTerm.trim() === "" ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.reference && tx.reference.toLowerCase().includes(searchTerm.toLowerCase()));

    // Timeframe filtering
    const txTime = new Date(tx.createdAt).getTime();
    if (timeframeFilter === "TODAY") {
      const isToday = new Date(tx.createdAt).toDateString() === new Date().toDateString();
      if (!isToday) return false;
    } else if (timeframeFilter === "7_DAYS") {
      if (now - txTime > 7 * 86400000) return false;
    } else if (timeframeFilter === "THIS_MONTH") {
      const txDate = new Date(tx.createdAt);
      const currDate = new Date();
      if (
        txDate.getMonth() !== currDate.getMonth() ||
        txDate.getFullYear() !== currDate.getFullYear()
      ) {
        return false;
      }
    }

    return matchesType && matchesSearch;
  });

  const handleExportCSV = (customMsg?: string) => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      "Date",
      "Heure",
      "ID Transaction",
      "Type de Flux",
      "Libelle / Details",
      "Montant (DZD)",
      "Solde Apres (DZD)",
    ];

    const rows = filteredTransactions.map((tx) => {
      const d = new Date(tx.createdAt);
      const dateStr = d.toLocaleDateString("fr-FR");
      const timeStr = d.toLocaleTimeString("fr-FR");
      const isDeposit = tx.type === "DEPOSIT" || Number(tx.amount) > 0;
      const typeStr = isDeposit ? "CREDIT_DEPOT" : "DEBIT_LIVRAISON_CPA";
      const details = (tx.reference || (isDeposit ? "Rechargement Escrow" : "Commission CPA Livraison")).replace(/;/g, ",");
      const amountStr = `${isDeposit ? "+" : ""}${tx.amount}`;
      const balanceAfterStr = tx.balanceAfter !== undefined && tx.balanceAfter !== null ? String(tx.balanceAfter) : "";

      return [dateStr, timeStr, tx.id, typeStr, details, amountStr, balanceAfterStr].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `vitedrop-releve-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setActionMessage(customMsg || "Relevé de compte CSV téléchargé avec succès.");
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Financial aggregates
  const totalDeposits = transactions
    .filter((tx) => tx.type === "DEPOSIT" || Number(tx.amount) > 0)
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

  const totalDebits = transactions
    .filter((tx) => tx.type === "SUPPLIER_DEBIT" || (tx.type !== "DEPOSIT" && Number(tx.amount) < 0))
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

  return (
    <DashboardLayout initialRole="supplier" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const isAr = lang === "ar";
        const isEn = lang === "en";
        const wLoc = t.supplier.wallet;

        return (
          <div className="space-y-6 text-start w-full max-w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 ${isAr ? "" : "font-mono uppercase tracking-wider"}`}>
                    {wLoc.escrowBadge}
                  </span>
                  <span className="text-xs text-neutral-400">&bull;</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {transactions.length} {wLoc.movementsSuffix}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight mt-1">
                  {wLoc.title}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {wLoc.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExportCSV(wLoc.exportSuccess)}
                  disabled={isLoading || filteredTransactions.length === 0}
                  className="gap-1.5"
                  data-testid="export-ledger-csv-btn"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{wLoc.exportCsvBtn}</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadWalletData}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>{wLoc.refresh}</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white shadow-md shadow-purple-600/20"
                  data-testid="supplier-wallet-topup-btn"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{wLoc.recharge}</span>
                </Button>
              </div>
            </div>

            {/* In-page Alerts */}
            {actionMessage && (
              <div
                role="status"
                className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in"
                data-testid="wallet-action-alert"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionMessage(null)}
                  className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Predictive Solvency & Runway Hero Card */}
            <div
              className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-50/70 via-white to-stone-50/80 text-neutral-900 border border-purple-200/80 shadow-xs space-y-4"
              data-testid="solvency-runway-hero-card"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-100/80 border border-purple-200/60 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold tracking-tight text-neutral-950">
                      {wLoc.gaugeTitle}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {wLoc.gaugeSubtitle}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-tight shrink-0 border ${
                    runwayStatus === "OPTIMAL"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : runwayStatus === "WARNING"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                  }`}
                  data-testid="solvency-status-badge"
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>
                    {runwayStatus === "OPTIMAL"
                      ? wLoc.runwayOptimal
                      : runwayStatus === "WARNING"
                      ? wLoc.runwayWarning
                      : wLoc.runwayCritical}
                  </span>
                </span>
              </div>

              {/* Visual Progress / Runway Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-600">
                  <span>
                    {wLoc.netFreeMarginTitle}: <strong className="text-neutral-900 font-bold">{formatDZD(netFreeMargin, lang)}</strong>
                  </span>
                  <span>
                    {wLoc.inTransitLiabilityTitle}: <strong className="text-purple-700 font-bold">{formatDZD(inTransitLiability, lang)}</strong>
                  </span>
                </div>
                <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-black/[0.06]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      runwayStatus === "OPTIMAL"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                        : runwayStatus === "WARNING"
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                        : "bg-gradient-to-r from-rose-600 to-red-500"
                    }`}
                    style={{ width: `${Math.max(8, coveragePercentage)}%` }}
                    data-testid="solvency-runway-progress-bar"
                  />
                </div>
              </div>

              {/* 4-Metric Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-black/[0.06] text-xs">
                <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-2xs space-y-1">
                  <span className="text-[11px] text-neutral-500 block font-medium">
                    {wLoc.solvencyAvailableBalance}
                  </span>
                  <span className="font-mono text-base font-bold text-neutral-950 block" data-testid="solvency-available-balance">
                    {formatDZD(balance, lang)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-2xs space-y-1">
                  <span className="text-[11px] text-neutral-500 block font-medium">
                    {wLoc.inTransitLiabilityTitle}
                  </span>
                  <span className="font-mono text-base font-bold text-amber-700 block" data-testid="solvency-transit-liability">
                    {formatDZD(inTransitLiability, lang)}
                  </span>
                  <span className="text-[10px] text-neutral-400 block font-mono">
                    {inTransitCount} {wLoc.parcelsOnTheRoad}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-2xs space-y-1">
                  <span className="text-[11px] text-neutral-500 block font-medium">
                    {wLoc.netFreeMarginTitle}
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-700 block" data-testid="solvency-net-free-margin">
                    {formatDZD(netFreeMargin, lang)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-2xs space-y-1">
                  <span className="text-[11px] text-neutral-500 block font-medium">
                    Couverture Estimée
                  </span>
                  <span className="font-mono text-base font-bold text-purple-700 block" data-testid="solvency-runway-deliveries">
                    ~{runwayDeliveries} livraisons
                  </span>
                  <span className="text-[10px] text-neutral-400 block font-mono">
                    ~1 250 DZD/CPA
                  </span>
                </div>
              </div>

              {/* Velocity-Based Top-up Recommendation Assistant */}
              <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-purple-950 block">
                    {wLoc.recommendedTopupTitle}
                  </span>
                  <p className="text-[11px] text-purple-700/80">
                    {wLoc.recommendedTopupDesc.replace("{amount}", formatDZD(recommendedTopupAmount, lang))}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-neutral-500 me-1 hidden md:inline font-medium">
                    {wLoc.quickPresetsTitle}
                  </span>
                  {[10000, 25000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleCopyPreset(amt, `${wLoc.copiedAmount} (+${formatDZD(amt, lang)})`)}
                      data-testid={`preset-chip-${amt}`}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-100/60 text-purple-950 font-mono text-[11px] font-bold transition-all cursor-pointer border border-purple-200/90 shadow-2xs"
                    >
                      +{formatDZD(amt, lang)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Escrow Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Balance */}
              <Card className="p-5 bg-gradient-to-br from-white to-purple-50/40 border-neutral-200/90 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {wLoc.cardBalanceTitle}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-neutral-900 tracking-tight block">
                    {formatDZD(balance, lang)}
                  </span>
                  <div className="mt-2">
                    {isLowBalance ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          {wLoc.lowBalanceWarning}
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          {wLoc.sufficientBalance}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Dynamic Solvency Runway Telemetry */}
                  <div className="mt-3 pt-2.5 border-t border-purple-100 flex items-center justify-between text-xs">
                    <span className="text-neutral-600 font-medium">
                      {lang === "fr"
                        ? `Couverture : ~${Math.floor(balance / 1250)} livraisons CPA`
                        : lang === "ar"
                        ? `التغطية: ~${Math.floor(balance / 1250)} طلباً CPA`
                        : `Est. runway: ~${Math.floor(balance / 1250)} CPA deliveries`}
                    </span>
                    <span className="font-mono text-[11px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200/50">
                      ~1,250 DZD/CPA
                    </span>
                  </div>
                </div>
              </Card>

              {/* Card 2: Cumulative Deposits */}
              <Card className="p-5 bg-gradient-to-br from-white to-emerald-50/30 border-neutral-200/90 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {wLoc.cardDepositsTitle}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-neutral-900 tracking-tight block">
                    {formatDZD(totalDeposits, lang)}
                  </span>
                  <p className="text-xs text-neutral-500 mt-2">
                    {wLoc.cardDepositsDesc}
                  </p>
                </div>
              </Card>

              {/* Card 3: Cumulative Debits */}
              <Card className="p-5 bg-gradient-to-br from-white to-slate-50 border-neutral-200/90 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {wLoc.cardDebitsTitle}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200/60">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-neutral-900 tracking-tight block">
                    {formatDZD(totalDebits, lang)}
                  </span>
                  <p className="text-xs text-neutral-500 mt-2">
                    {wLoc.cardDebitsDesc}
                  </p>
                </div>
              </Card>
            </div>

            {/* Recent Deposit Slips Queue */}
            {depositRequests.length > 0 && (
              <div
                className="bg-white rounded-2xl border border-black/[0.08] shadow-xs p-5 space-y-4"
                data-testid="supplier-deposit-requests-section"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">
                        {isAr ? "وصولات وطلبات الشحن الأخيرة" : isEn ? "Recent Deposit Slips" : "Bordereaux de Versement Récent"}
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        {isAr ? "متابعة حالة مراجعة الإيداعات البنكية والبريدية" : isEn ? "BaridiMob & CCP deposit review tracking" : "Suivi de validation des dépôts BaridiMob / CCP"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-500">
                    {depositRequests.length} {isAr ? "طلبات" : isEn ? "slip(s)" : "dépôt(s)"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {depositRequests.map((req) => (
                    <div
                      key={req.id}
                      data-testid={`supplier-deposit-request-item-${req.id}`}
                      className="p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-purple-700">
                          #{req.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          data-testid={`deposit-status-badge-${req.id}`}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.status === "APPROVED"
                            ? isAr ? "تم التأكيد والإيداع" : isEn ? "Approved & Credited" : "Validé & Crédité"
                            : req.status === "REJECTED"
                            ? isAr ? "مرفوض" : isEn ? "Rejected" : "Rejeté"
                            : isAr ? "قيد المراجعة" : isEn ? "Under Review" : "En cours de validation"}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-[11px] text-neutral-500 font-medium">
                          {req.paymentRail}
                        </span>
                        <span className="font-mono font-extrabold text-sm text-neutral-900">
                          {formatDZD(Number(req.amount), lang)}
                        </span>
                      </div>

                      {req.referenceNote && (
                        <p className="text-[11px] text-neutral-600 truncate bg-white p-1 rounded border border-neutral-200/60 font-mono">
                          {req.referenceNote}
                        </p>
                      )}

                      {req.rejectionReason && (
                        <p className="text-[10px] text-rose-700 font-medium bg-rose-50 p-1.5 rounded border border-rose-200">
                          {req.rejectionReason}
                        </p>
                      )}

                      <p className="text-[10px] text-neutral-400 font-mono">
                        {new Date(req.createdAt).toLocaleString(isAr ? "ar-DZ" : "fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder={wLoc.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="tx-search-input"
                  className="ps-9 text-xs sm:text-sm h-9"
                />
              </div>

              {/* Filters container */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 overflow-x-auto no-scrollbar shrink-0">
                {/* Timeframe Filter Pills */}
                <div className="flex items-center gap-1 bg-neutral-100/90 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setTimeframeFilter("ALL")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                      timeframeFilter === "ALL"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                    data-testid="timeframe-all-btn"
                  >
                    {wLoc.timeframeAll}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeframeFilter("TODAY")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                      timeframeFilter === "TODAY"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                    data-testid="timeframe-today-btn"
                  >
                    {wLoc.timeframeToday}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeframeFilter("7_DAYS")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                      timeframeFilter === "7_DAYS"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                    data-testid="timeframe-7days-btn"
                  >
                    {wLoc.timeframeLast7Days}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeframeFilter("THIS_MONTH")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                      timeframeFilter === "THIS_MONTH"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                    data-testid="timeframe-month-btn"
                  >
                    {wLoc.timeframeThisMonth}
                  </button>
                </div>

                <div className="h-5 w-px bg-neutral-200 hidden sm:block shrink-0" />

                {/* Type Filter Pills */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTypeFilter("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                      typeFilter === "ALL"
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                    data-testid="filter-all-btn"
                  >
                    {wLoc.filterAll} ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("DEPOSITS")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                      typeFilter === "DEPOSITS"
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                    data-testid="filter-deposits-btn"
                  >
                    {wLoc.filterDeposits}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("DEBITS")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                      typeFilter === "DEBITS"
                        ? "bg-rose-600 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                    data-testid="filter-debits-btn"
                  >
                    {wLoc.filterDebits}
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions Ledger Container */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              {/* Mobile Cards View (< 640px) */}
              <div className="block sm:hidden divide-y divide-neutral-100">
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 space-y-2">
                    <Wallet className="w-8 h-8 text-neutral-400 mx-auto" />
                    <p className="text-xs font-semibold text-neutral-800">
                      {isAr ? "لا توجد معاملات مطابقة" : isEn ? "No matching financial transactions" : "Aucun mouvement financier correspondant"}
                    </p>
                  </div>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isCredit = Number(tx.amount) > 0;
                    const isDeposit = tx.type === "DEPOSIT";

                    return (
                      <div
                        key={tx.id}
                        className="p-4 space-y-2.5"
                        data-testid="supplier-wallet-tx-card"
                      >
                        {/* Top: Reference & Type Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span dir="ltr" className="font-mono text-xs font-bold text-neutral-800 truncate">
                              #{tx.id.slice(0, 8).toUpperCase()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(tx.id, `mob-${tx.id}`)}
                              className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                              data-testid="copy-tx-ref-btn"
                              aria-label="Copier Réf"
                            >
                              {copiedId === `mob-${tx.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              isDeposit
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {isDeposit ? (
                              <>
                                <ArrowDownLeft className="w-2.5 h-2.5" />
                                <span>{wLoc.depositCredit}</span>
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-2.5 h-2.5" />
                                <span>{wLoc.debitDelivery}</span>
                              </>
                            )}
                          </span>
                        </div>

                        {/* Middle: Details / Reference description */}
                        <p className="text-xs text-neutral-700 leading-snug">
                          {tx.reference || (isDeposit ? wLoc.refRecharge : wLoc.refDeliveryCpa)}
                        </p>

                        {/* Bottom: Date & Signed Amount */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
                          <span className="text-neutral-500 font-mono text-[11px]">
                            {new Date(tx.createdAt).toLocaleDateString(
                              lang === "ar" ? "ar-DZ" : lang === "en" ? "en-US" : "fr-FR",
                              { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                          <span
                            className={`font-mono text-xs font-bold ${
                              isCredit ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isCredit ? "+" : ""}
                            {formatDZD(Number(tx.amount), lang)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View (>= 640px) */}
              <div className="hidden sm:block overflow-x-auto w-full min-w-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{wLoc.colTxRef}</TableHead>
                      <TableHead>{wLoc.colType}</TableHead>
                      <TableHead>{wLoc.colDetails}</TableHead>
                      <TableHead>{wLoc.colDateTime}</TableHead>
                      <TableHead className="text-end">{wLoc.colAmount}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-xs text-neutral-500">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-600" />
                          <span>{t.common.loading}</span>
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-xs text-neutral-400">
                          {wLoc.emptyLedger}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const isCredit = Number(tx.amount) > 0;
                        const isDeposit = tx.type === "DEPOSIT";

                        return (
                          <TableRow
                            key={tx.id}
                            className="hover:bg-neutral-50/80 transition-colors"
                            data-testid="supplier-wallet-tx-row"
                          >
                            {/* Ref */}
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span dir="ltr" className="font-mono text-xs font-bold text-neutral-800">
                                  #{tx.id.slice(0, 8).toUpperCase()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(tx.id, `tbl-${tx.id}`)}
                                  className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                                  data-testid="copy-tx-ref-btn"
                                  aria-label="Copier Réf"
                                >
                                  {copiedId === `tbl-${tx.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </TableCell>

                            {/* Type */}
                            <TableCell>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  isDeposit
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {isDeposit ? (
                                  <>
                                    <ArrowDownLeft className="w-3 h-3" />
                                    <span>{wLoc.depositCreditTable}</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span>{wLoc.debitDeliveryTable}</span>
                                  </>
                                )}
                              </span>
                            </TableCell>

                            {/* Details */}
                            <TableCell className="text-xs text-neutral-700 max-w-sm truncate">
                              {tx.reference || (isDeposit ? wLoc.refRecharge : wLoc.refDeliveryCpa)}
                            </TableCell>

                            {/* Date */}
                            <TableCell className="text-xs text-neutral-500 font-mono">
                              {new Date(tx.createdAt).toLocaleDateString(
                                lang === "ar" ? "ar-DZ" : lang === "en" ? "en-US" : "fr-FR",
                                { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                              )}
                            </TableCell>

                            {/* Amount */}
                            <TableCell className="text-end">
                              <span
                                className={`font-mono text-xs font-bold ${
                                  isCredit ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {isCredit ? "+" : ""}
                                {formatDZD(Number(tx.amount), lang)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Reusable Accessible Top-Up Modal */}
            <SupplierTopUpModal
              isOpen={isTopUpModalOpen}
              onClose={() => setIsTopUpModalOpen(false)}
              onSuccess={loadWalletData}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
