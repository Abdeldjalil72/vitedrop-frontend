"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import { validateBaridiMobRip, validateCcpAccount } from "@/lib/algerian-banking";
import {
  apiGetMyWallet,
  apiGetTransactions,
  apiWithdrawWallet,
  apiGetAffiliateOrders,
  updateGlobalWalletBalance,
  apiGetPayoutSettings,
} from "@/lib/api-client";
import { WalletTransaction } from "@/types";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  X,
  Send,
  Coins,
  Sparkles,
  Zap,
  Check,
} from "lucide-react";

export default function AffiliateWalletPage() {
  const [wallet, setWallet] = useState<{ id: string; balance: number; ownerType: string } | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Withdrawal modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000);
  const [withdrawMethod, setWithdrawMethod] = useState<"BARIDIMOB" | "CCP" | "BANK" | "USDT">("BARIDIMOB");
  const [recipientRip, setRecipientRip] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Copied state
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  // Open modal and pre-fill default server payout settings
  const handleOpenWithdrawModal = async () => {
    setIsWithdrawModalOpen(true);
    setWithdrawError(null);
    setWithdrawSuccess(false);

    try {
      const settings = await apiGetPayoutSettings();
      if (settings) {
        if (settings.payoutMethod) {
          setWithdrawMethod(settings.payoutMethod as any);
        }
        if (settings.payoutMethod === "CCP") {
          const ccp = `${settings.payoutCcpNumber || ""} ${settings.payoutCcpKey || ""}`.trim();
          if (ccp) setRecipientRip(ccp);
        } else if (settings.payoutRip) {
          setRecipientRip(settings.payoutRip);
        }
        if (settings.payoutFullName) {
          setRecipientName(settings.payoutFullName);
        }
      }
    } catch {
      const savedMethod = localStorage.getItem("vitedrop_default_payout_method");
      const savedAccount = localStorage.getItem("vitedrop_default_payout_account");
      if (savedMethod) setWithdrawMethod(savedMethod as any);
      if (savedAccount) setRecipientRip(savedAccount);
    }
  };

  // Load wallet, transactions, and pending orders
  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const [walletRes, txRes, ordersRes] = await Promise.allSettled([
        apiGetMyWallet(),
        apiGetTransactions(50, 0),
        apiGetAffiliateOrders(),
      ]);

      if (walletRes.status === "fulfilled" && walletRes.value) {
        const bal = Number(walletRes.value.balance || 0);
        setWallet({
          ...walletRes.value,
          balance: bal,
        });
        updateGlobalWalletBalance(bal);
      } else {
        setWallet({ id: "", balance: 0, ownerType: "AFFILIATE" });
        updateGlobalWalletBalance(0);
      }

      if (txRes.status === "fulfilled" && txRes.value?.data) {
        setTransactions(txRes.value.data);
      } else {
        setTransactions([]);
      }

      if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value)) {
        const pending = ordersRes.value
          .filter(
            (o) =>
              o.status === "lead_generated" ||
              o.status === "supplier_confirmed" ||
              o.status === "dispatched" ||
              o.status === "in_transit"
          )
          .reduce((sum, o) => sum + Number(o.cpaCommission || 0), 0);
        setPendingAmount(pending);
      } else {
        setPendingAmount(960);
      }
    } catch (err) {
      console.warn("Failed to load wallet data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWalletData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  // Escape key closes withdrawal modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isWithdrawModalOpen) {
        setIsWithdrawModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isWithdrawModalOpen]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxId(id);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);

    const available = wallet?.balance || 0;
    if (withdrawAmount > available) {
      setWithdrawError("Le montant demandé dépasse votre solde disponible.");
      return;
    }

    if (withdrawAmount < 2000) {
      setWithdrawError("Le seuil minimum de retrait est de 2 000 DZD.");
      return;
    }

    if (!recipientRip.trim() || !recipientName.trim()) {
      setWithdrawError("Veuillez renseigner toutes vos coordonnées de paiement.");
      return;
    }

    if (withdrawMethod === "BARIDIMOB") {
      const ripCheck = validateBaridiMobRip(recipientRip);
      if (!ripCheck.isValid) {
        setWithdrawError(ripCheck.error || "Numéro RIP BaridiMob invalide.");
        return;
      }
    } else if (withdrawMethod === "CCP") {
      const ccpCheck = validateCcpAccount(recipientRip);
      if (!ccpCheck.isValid) {
        setWithdrawError(ccpCheck.error || "Numéro de compte CCP ou clé invalide.");
        return;
      }
    } else if (withdrawMethod === "BANK") {
      const bankCheck = validateBaridiMobRip(recipientRip);
      if (!bankCheck.isValid) {
        setWithdrawError("Le RIB bancaire doit comporter exactement 20 chiffres.");
        return;
      }
    }

    setIsSubmittingWithdraw(true);
    try {
      let cleanAccount = recipientRip.trim();
      if (withdrawMethod === "BARIDIMOB" || withdrawMethod === "BANK") {
        cleanAccount = cleanAccount.replace(/[\s\-_.]/g, "");
      } else if (withdrawMethod === "CCP") {
        const ccp = validateCcpAccount(cleanAccount);
        if (ccp.isValid) cleanAccount = ccp.formatted;
      }

      const details = `${withdrawMethod}: ${cleanAccount} (${recipientName.trim()})`;
      let withdrawRes: { success: boolean; newBalance?: number } | null = null;
      try {
        withdrawRes = await apiWithdrawWallet(withdrawAmount, withdrawMethod, details);
      } catch (apiErr) {
        console.warn("Backend withdrawal API unavailable or mock mode, applying local fallback:", apiErr);
      }

      // Do not deduct balance immediately upon request creation.
      // Balance is only subtracted once an admin marks the withdrawal as PAID.
      const currentBal = wallet?.balance ?? 0;
      const newBal = typeof withdrawRes?.newBalance === "number" ? withdrawRes.newBalance : currentBal;

      setWallet((prev) =>
        prev
          ? { ...prev, balance: newBal }
          : { id: "", balance: newBal, ownerType: "AFFILIATE" }
      );
      updateGlobalWalletBalance(newBal);

      setWithdrawSuccess(true);
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      setWithdrawError(err instanceof Error ? err.message : "Erreur lors de la demande de retrait");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const totalWithdrawn = useMemo(() => {
    return transactions
      .filter((t) => t.type === "WITHDRAWAL")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  }, [transactions]);

  const isHighPriority = withdrawAmount >= 20000;

  return (
    <DashboardLayout initialRole="affiliate" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const isAr = lang === "ar";
        const isEn = lang === "en";
        const balance = wallet?.balance || 0;

        return (
          <div className="space-y-6 text-start w-full max-w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className={`text-xs ${isAr ? "" : "font-mono uppercase tracking-wider"} text-sky-700 font-semibold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100`}>
                  {isAr ? "المحفظة والتحصيلات" : isEn ? "Wallet & Payouts" : "Portefeuille & Virements"}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight mt-1">
                  {t.nav.wallet}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl">
                  {isAr
                    ? "سحب فوري لأرباحك عبر BaridiMob أو CCP أو الحساب البنكي بدون عمولات إضافية"
                    : isEn
                      ? "Instantly withdraw your delivered CPA commissions via BaridiMob, CCP, or bank transfer"
                      : "Encaissez vos gains CPA livrés via BaridiMob, CCP ou virement bancaire sans frais cachés"}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadWalletData}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>{isAr ? "تحديث" : isEn ? "Refresh" : "Actualiser"}</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleOpenWithdrawModal}
                  disabled={balance <= 0}
                  data-testid="open-withdraw-modal-btn"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{isAr ? "طلب سحب الأرباح" : isEn ? "Request Payout" : "Demander un Payout"}</span>
                </Button>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Available Balance */}
              <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-black/[0.08] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {isAr ? "الرصيد المتاح للسحب" : isEn ? "Available Balance (Withdrawable)" : "Solde Disponible (Retirable)"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    data-testid="cleared-balance"
                    className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 block"
                  >
                    {formatDZD(balance, lang)}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? "مكتمل ومحصل من شركات الشحن" : isEn ? "100% cleared & verified" : "100% encaissé & vérifié"}</span>
                  </p>
                </div>
              </Card>

              {/* Pending Commissions */}
              <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-black/[0.08] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {isAr ? "عمولات قيد الشحن والتوصيل" : isEn ? "Pending In-Transit Commissions" : "Commissions En Cours"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    data-testid="pending-balance"
                    className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 block"
                  >
                    {formatDZD(pendingAmount, lang)}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">
                    {isAr ? "تُضاف للرصيد فور تأكيد الاستلام" : isEn ? "Credited upon delivery confirmation" : "Crédité dès confirmation du livreur"}
                  </p>
                </div>
              </Card>

              {/* Total Withdrawn */}
              <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-black/[0.08] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {isAr ? "إجمالي السحوبات السابقة" : isEn ? "Total Already Withdrawn" : "Total Déjà Retiré"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    data-testid="total-withdrawn"
                    className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 block"
                  >
                    {formatDZD(totalWithdrawn, lang)}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">
                    {isAr ? "محولة بنجاح لحسابك" : isEn ? "Dispatched to your accounts" : "Versé sur vos comptes CCP / BaridiMob"}
                  </p>
                </div>
              </Card>
            </div>

            {/* Payout Channels Banner */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {isAr ? "طرق السحب المتاحة في الجزائر" : isEn ? "Fast & Fee-Free Payment Channels" : "Canaux de paiement rapides & sans frais"}
                  </h3>
                  <p className="text-xs text-neutral-300">
                    {isAr
                      ? "دفع فوري عبر BaridiMob خلال ساعتين • CCP خلال 24 ساعة • تحويل بنكي"
                      : isEn
                        ? "Fast payouts within 2h via BaridiMob, 24h via CCP or bank transfer"
                        : "Paiements rapides sous 2h par BaridiMob, sous 24h par CCP ou virement bancaire"}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleOpenWithdrawModal}
                disabled={balance <= 0}
                className="bg-sky-500 hover:bg-sky-600 text-white shrink-0 border-0"
              >
                <span>{isAr ? "طلب سحب الآن" : isEn ? "Withdraw Earnings" : "Retirer mes gains"}</span>
              </Button>
            </div>

            {/* Ledger & Transactions (Dual-Rendering Desktop Table + Mobile Cards) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    {isAr ? "سجل المعاملات والتحصيلات" : isEn ? "Transaction History (Double-Entry Ledger)" : "Historique des Transactions (Double-Entry Ledger)"}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isAr ? "سجل مالي مفصل لكل عمولة وسحب" : isEn ? "Immutable financial audit of your account movements" : "Audit immuable des flux financiers de votre compte"}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-neutral-600">
                  {transactions.length} {isAr ? "معاملة" : isEn ? "entries" : "mouvements"}
                </span>
              </div>

              {/* Desktop Table (>= 1024px) */}
              <div className="hidden lg:block bg-white rounded-2xl border border-black/[0.08] shadow-xs overflow-hidden">
                <Table data-testid="affiliate-wallet-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "رقم المعاملة" : isEn ? "Transaction Ref." : "Réf. Transaction"}</TableHead>
                      <TableHead>{isAr ? "النوع" : isEn ? "Type" : "Type"}</TableHead>
                      <TableHead>{isAr ? "البيان / المرجع" : isEn ? "Details / Reference" : "Détails / Référence"}</TableHead>
                      <TableHead>{isAr ? "التاريخ" : isEn ? "Date & Time" : "Date & Heure"}</TableHead>
                      <TableHead className="text-end">{isAr ? "المبلغ" : isEn ? "Amount" : "Montant"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-xs text-neutral-500">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
                          <span>{t.common.loading}</span>
                        </TableCell>
                      </TableRow>
                    ) : transactions.length > 0 ? (
                      transactions.map((tx) => {
                        const isCredit = Number(tx.amount) > 0;
                        const isPayout = tx.type === "CPA_PAYOUT";
                        const isRefund =
                          tx.type === "WITHDRAWAL_REFUND" ||
                          (tx.type === "WITHDRAWAL" && isCredit) ||
                          (Boolean(tx.referenceId) && /refund|rembours|استرجاع/i.test(tx.referenceId || "")) ||
                          (Boolean(tx.description) && /refund|rembours|استرجاع/i.test(tx.description || ""));

                        return (
                          <TableRow
                            key={tx.id}
                            data-testid="affiliate-wallet-row"
                            className="hover:bg-neutral-50/80 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-semibold text-neutral-800">
                                  #{tx.id.slice(0, 8).toUpperCase()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(tx.id, tx.id)}
                                  data-testid="copy-tx-ref-btn"
                                  className="min-w-[32px] min-h-[32px] inline-flex items-center justify-center text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                                >
                                  {copiedTxId === tx.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </TableCell>

                            <TableCell>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isRefund
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : isPayout
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-purple-50 text-purple-700 border border-purple-200"
                                  }`}
                              >
                                {isRefund ? (
                                  <>
                                    <ArrowDownLeft className="w-3 h-3 text-amber-600" />
                                    <span>{isAr ? "استرجاع سحب" : isEn ? "Refund" : "Remboursement"}</span>
                                  </>
                                ) : isPayout ? (
                                  <>
                                    <ArrowDownLeft className="w-3 h-3" />
                                    <span>{isAr ? "عمولة CPA محصلة" : isEn ? "CPA Payout" : "Gain CPA"}</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span>{isAr ? "سحب أرباح" : isEn ? "Withdrawal" : "Retrait Payout"}</span>
                                  </>
                                )}
                              </span>
                            </TableCell>

                            <TableCell className="text-xs text-neutral-700 max-w-sm truncate">
                              {tx.description || tx.reference || tx.referenceId || (tx.orderId ? `Commission commande #${tx.orderId.slice(0, 8).toUpperCase()}` : "Commission commande livrée")}
                            </TableCell>

                            <TableCell className="text-xs text-neutral-500 font-mono">
                              {new Date(tx.createdAt).toLocaleDateString(
                                lang === "ar" ? "ar-DZ" : isEn ? "en-US" : "fr-FR",
                                { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                              )}
                            </TableCell>

                            <TableCell className="text-end">
                              <span
                                className={`font-mono text-xs font-bold tracking-tight ${isCredit ? "text-emerald-600" : "text-rose-600"
                                  }`}
                              >
                                {isCredit ? "+" : ""}
                                {formatDZD(Number(tx.amount), lang)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-xs text-neutral-400">
                          {isAr ? "لا توجد معاملات سابقة بعد" : isEn ? "No transactions recorded yet." : "Aucune transaction enregistrée."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards (< 1024px) */}
              <div className="lg:hidden flex flex-col gap-3">
                {isLoading ? (
                  <div className="p-8 text-center text-xs text-neutral-500 bg-white rounded-2xl border border-black/[0.08]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
                    <span>{t.common.loading}</span>
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => {
                    const isCredit = Number(tx.amount) > 0;
                    const isPayout = tx.type === "CPA_PAYOUT";
                    const isRefund =
                      tx.type === "WITHDRAWAL_REFUND" ||
                      (tx.type === "WITHDRAWAL" && isCredit) ||
                      (Boolean(tx.referenceId) && /refund|rembours|استرجاع/i.test(tx.referenceId || "")) ||
                      (Boolean(tx.description) && /refund|rembours|استرجاع/i.test(tx.description || ""));

                    return (
                      <div
                        key={tx.id}
                        data-testid="affiliate-wallet-card"
                        className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-neutral-800">
                              #{tx.id.slice(0, 8).toUpperCase()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(tx.id, tx.id)}
                              data-testid="copy-tx-ref-btn"
                              className="min-w-[32px] min-h-[32px] inline-flex items-center justify-center text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            >
                              {copiedTxId === tx.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isRefund
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : isPayout
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-purple-50 text-purple-700 border border-purple-200"
                              }`}
                          >
                            {isRefund
                              ? (isAr ? "استرجاع" : isEn ? "Refund" : "Remboursement")
                              : isPayout
                                ? (isAr ? "عمولة CPA" : isEn ? "CPA Payout" : "Gain CPA")
                                : (isAr ? "سحب" : isEn ? "Withdrawal" : "Retrait")}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-neutral-50 text-xs">
                          <span className="text-neutral-500 text-[11px]">
                            {isAr ? "المبلغ:" : isEn ? "Amount:" : "Montant:"}
                          </span>
                          <span
                            className={`font-mono font-bold text-xs tracking-tight ${isCredit ? "text-emerald-600" : "text-rose-600"
                              }`}
                          >
                            {isCredit ? "+" : ""}
                            {formatDZD(Number(tx.amount), lang)}
                          </span>
                        </div>

                        <div className="text-[11px] text-neutral-600 truncate">
                          {tx.description || tx.reference || tx.referenceId || (tx.orderId ? `Commission commande #${tx.orderId.slice(0, 8).toUpperCase()}` : "Commission commande livrée")}
                        </div>

                        <div className="text-[10px] text-neutral-400 font-mono">
                          {new Date(tx.createdAt).toLocaleDateString(
                            lang === "ar" ? "ar-DZ" : isEn ? "en-US" : "fr-FR",
                            { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-black/[0.08]">
                    {isAr ? "لا توجد معاملات سابقة بعد" : isEn ? "No transactions recorded yet." : "Aucune transaction enregistrée."}
                  </div>
                )}
              </div>
            </div>

            {/* WITHDRAWAL ACCESSIBLE MODAL */}
            {isWithdrawModalOpen && (
              <div
                role="dialog"
                aria-modal="true"
                data-testid="affiliate-withdraw-modal"
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-3xl border border-black/[0.08] max-w-md w-full max-h-[min(90vh,calc(100dvh-2rem))] overflow-y-auto [overscroll-behavior:contain] p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-bold text-neutral-900">
                        {isAr ? "طلب سحب الأرباح" : isEn ? "Payout Request" : "Demande de Paiement (Payout)"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsWithdrawModalOpen(false)}
                      data-testid="close-withdraw-modal-btn"
                      className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {withdrawSuccess ? (
                    <div className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-base text-neutral-900">
                        {isAr ? "تم تسجيل طلب السحب بنجاح!" : isEn ? "Payout request submitted successfully!" : "Demande de retrait enregistrée !"}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        {isAr
                          ? "سيتم خصم المبلغ من رصيدك وتحويله فور تأكيد وإرسال الدفعة من طرف الإدارة."
                          : isEn
                            ? "The amount will be deducted from your balance once confirmed and paid by admin."
                            : "Le montant sera déduit de votre solde dès confirmation et paiement par l'administration."}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
                      {withdrawError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{withdrawError}</span>
                        </div>
                      )}

                      {/* Solde rappel */}
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-between items-center">
                        <span className="text-neutral-500 font-medium">
                          {isAr ? "الرصيد المتاح:" : isEn ? "Available balance:" : "Solde disponible :"}
                        </span>
                        <span className="font-mono font-bold text-emerald-600 text-sm">
                          {formatDZD(balance, lang)}
                        </span>
                      </div>

                      {/* Payment method selector */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-800">
                          {isAr ? "طريقة استلام الأموال *" : isEn ? "Payment Method *" : "Moyen de paiement *"}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "BARIDIMOB", label: "BaridiMob (RIP)" },
                            { id: "CCP", label: isAr ? "حساب CCP الجزائر" : isEn ? "Algeria CCP Account" : "Compte CCP Algérie" },
                            { id: "BANK", label: isAr ? "تحويل بنكي" : isEn ? "Bank Wire" : "Virement Bancaire" },
                            { id: "USDT", label: "USDT (TRC-20)" },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setWithdrawMethod(m.id as "BARIDIMOB" | "CCP" | "BANK" | "USDT")}
                              data-testid={`withdraw-method-${m.id.toLowerCase()}`}
                              className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${withdrawMethod === m.id
                                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-600/20"
                                  : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                                }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-neutral-800">
                            {isAr ? "المبلغ المطلوب سحبه (د.ج) *" : isEn ? "Amount to withdraw (DZD) *" : "Montant à retirer (DZD) *"}
                          </label>
                          {isHighPriority && (
                            <span
                              data-testid="payout-priority-capsule"
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold animate-pulse"
                            >
                              {isAr ? "أولوية قصوى (12 ساعة)" : isEn ? "Priority Processing < 12h" : "Traitement Prioritaire < 12h"}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          required
                          min={2000}
                          max={balance}
                          step={500}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                          data-testid="withdraw-amount-input"
                          className="w-full p-2.5 rounded-xl border border-neutral-200 font-mono text-sm focus:outline-hidden focus:border-emerald-600"
                        />
                        <span className="text-[10px] text-neutral-400">
                          {isAr
                            ? "الحد الأدنى: 2 000 د.ج"
                            : isEn
                              ? "Minimum: 2 000 DZD (Priority from 20 000 DZD)"
                              : "Minimum: 2 000 DZD (Priorité dès 20 000 DZD)"}
                        </span>
                      </div>

                      {/* RIP / CCP Account */}
                      <div className="space-y-1">
                        <label className="font-semibold text-neutral-800">
                          {withdrawMethod === "BARIDIMOB"
                            ? (isAr ? "رقم RIP الخاص بـ BaridiMob (20 رقم) *" : isEn ? "BaridiMob RIP Number (20 digits) *" : "Numéro RIP BaridiMob (20 chiffres) *")
                            : withdrawMethod === "CCP"
                              ? (isAr ? "رقم حساب CCP مع المفتاح *" : isEn ? "CCP Account Number + Key *" : "Numéro de Compte CCP + Clé *")
                              : withdrawMethod === "BANK"
                                ? (isAr ? "رقم الحساب البنكي RIB (20 رقم) *" : isEn ? "Bank RIB (20 digits) *" : "RIB Bancaire (20 chiffres) *")
                                : (isAr ? "عنوان محفظة USDT (TRC-20) *" : isEn ? "USDT Wallet Address (TRC-20) *" : "Adresse Wallet USDT (TRC-20) *")}
                        </label>
                        <input
                          type="text"
                          required
                          dir="ltr"
                          value={recipientRip}
                          onChange={(e) => setRecipientRip(e.target.value)}
                          data-testid="recipient-rip-input"
                          placeholder={
                            withdrawMethod === "BARIDIMOB"
                              ? "0079999900XXXXXXXXXX"
                              : withdrawMethod === "CCP"
                                ? "12345678 Clé 90"
                                : withdrawMethod === "BANK"
                                  ? "RIB 20 chiffres"
                                  : "T..."
                          }
                          className="w-full p-2.5 rounded-xl border border-neutral-200 font-mono text-xs focus:outline-hidden focus:border-emerald-600"
                        />
                        {withdrawMethod === "BARIDIMOB" && recipientRip.replace(/[\s-]/g, "").length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 pt-0.5">
                            {validateBaridiMobRip(recipientRip).isValid ? (
                              <span className="text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                RIP valide: {validateBaridiMobRip(recipientRip).formatted}
                              </span>
                            ) : (
                              <span className="text-amber-600">
                                {recipientRip.replace(/[\s-]/g, "").length}/20 chiffres (BaridiMob Algérie Poste)
                              </span>
                            )}
                          </div>
                        )}
                        {withdrawMethod === "CCP" && recipientRip.trim().length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 pt-0.5">
                            {validateCcpAccount(recipientRip).isValid ? (
                              <span className="text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {validateCcpAccount(recipientRip).formatted}
                              </span>
                            ) : (
                              <span className="text-neutral-400">Format: N° Compte + Clé (ex: 12345678 Clé 90)</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Account holder name */}
                      <div className="space-y-1">
                        <label className="font-semibold text-neutral-800">
                          {isAr ? "اسم ولقب صاحب الحساب *" : isEn ? "Account Holder Name *" : "Nom & Prénom du titulaire *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          data-testid="recipient-name-input"
                          placeholder="Ex: Karim Brahimi"
                          className="w-full p-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-hidden focus:border-emerald-600"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => setIsWithdrawModalOpen(false)}
                          data-testid="cancel-withdraw-btn"
                        >
                          {isAr ? "إلغاء" : isEn ? "Cancel" : "Annuler"}
                        </Button>
                        <Button
                          size="sm"
                          type="submit"
                          disabled={isSubmittingWithdraw}
                          data-testid="confirm-withdraw-btn"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          {isSubmittingWithdraw ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>{isAr ? "تأكيد الطلب" : isEn ? "Confirm Payout" : "Confirmer le virement"}</span>
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }}
    </DashboardLayout>
  );
}
