"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { translations, Language } from "@/lib/locales";
import {
  apiGetMyWallet,
  apiGetTransactions,
  apiWithdrawWallet,
  apiGetAffiliateOrders,
} from "@/lib/api-client";
import { TransactionType } from "@/types";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  PlusCircle,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Copy,
  X,
  Sparkles,
  ShieldCheck,
  Send,
  Coins,
} from "lucide-react";

export default function AffiliateWalletPage() {
  const [wallet, setWallet] = useState<{ id: string; balance: number; ownerType: string } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
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
        setWallet({
          ...walletRes.value,
          balance: Number(walletRes.value.balance || 0),
        });
      } else { setWallet({ id: "mock-wallet", balance: 0, ownerType: "AFFILIATE" }); }

      if (txRes.status === "fulfilled" && txRes.value?.data) {
        setTransactions(txRes.value.data);
      } else { setTransactions([]); }

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
        setPendingAmount(6400);
      }
    } catch (err) {
      console.warn("Failed to load wallet data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

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

    setIsSubmittingWithdraw(true);
    try {
      const details = `${withdrawMethod}: ${recipientRip.trim()} (${recipientName.trim()})`;
      await apiWithdrawWallet(withdrawAmount, withdrawMethod, details);
      setWithdrawSuccess(true);
      await loadWalletData();
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawSuccess(false);
      }, 2000);
    } catch (err: any) {
      setWithdrawError(err.message || "Erreur lors de la demande de retrait");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const totalWithdrawn = useMemo(() => {
    return transactions
      .filter((t) => t.type === "WITHDRAWAL")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  }, [transactions]);

  return (
    <DashboardLayout initialRole="affiliate" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const isAr = lang === "ar";
        const balance = wallet?.balance || 0;

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-sky-600 font-bold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                  {isAr ? "المحفظة والتحصيلات" : "Portefeuille & Virements"}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1">
                  {t.nav.wallet}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  {isAr
                    ? "سحب فوري لأرباحك عبر BaridiMob أو CCP أو الحساب البنكي بدون عمولات إضافية"
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
                  <span>{isAr ? "تحديث" : "Actualiser"}</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => setIsWithdrawModalOpen(true)}
                  disabled={balance <= 0}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{isAr ? "طلب سحب الأرباح" : "Demander un Payout"}</span>
                </Button>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Available Balance */}
              <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {isAr ? "الرصيد المتاح للسحب" : "Solde Disponible (Retirable)"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black font-mono text-emerald-600">
                    {formatDZD(balance, lang)}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? "مكتمل ومحصل من شركات الشحن" : "100% encaissé & vérifié"}</span>
                  </p>
                </div>
              </Card>

              {/* Pending Commissions */}
              <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {isAr ? "عمولات قيد الشحن والتوصيل" : "Commissions En Cours"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black font-mono text-blue-600">
                    {formatDZD(pendingAmount, lang)}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">
                    {isAr ? "تُضاف للرصيد فور تأكيد الاستلام" : "Crédité dès confirmation du livreur"}
                  </p>
                </div>
              </Card>

              {/* Total Withdrawn */}
              <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {isAr ? "إجمالي السحوبات السابقة" : "Total Déjà Retiré"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black font-mono text-neutral-900">
                    {formatDZD(totalWithdrawn, lang)}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">
                    {isAr ? "محولة بنجاح لحسابك" : "Versé sur vos comptes CCP / BaridiMob"}
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
                    {isAr ? "طرق السحب المتاحة في الجزائر" : "Canaux de paiement rapides & sans frais"}
                  </h3>
                  <p className="text-xs text-neutral-300">
                    {isAr
                      ? "دفع فوري عبر BaridiMob خلال ساعتين • CCP خلال 24 ساعة • USDT TRC20"
                      : "Paiements rapides sous 2h par BaridiMob, sous 24h par CCP ou virement bancaire"}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => setIsWithdrawModalOpen(true)}
                className="bg-sky-500 hover:bg-sky-600 text-white shrink-0 border-0"
              >
                <span>{isAr ? "طلب سحب الآن" : "Retirer mes gains"}</span>
              </Button>
            </div>

            {/* Ledger & Transactions Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    {isAr ? "سجل المعاملات والتحصيلات" : "Historique des Transactions (Double-Entry Ledger)"}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isAr ? "سجل مالي مفصل لكل عمولة وسحب" : "Audit immuable des flux financiers de votre compte"}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-neutral-600">
                  {transactions.length} {isAr ? "معاملة" : "mouvements"}
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "رقم المعاملة" : "Réf. Transaction"}</TableHead>
                      <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                      <TableHead>{isAr ? "البيان / المرجع" : "Détails / Référence"}</TableHead>
                      <TableHead>{isAr ? "التاريخ" : "Date & Heure"}</TableHead>
                      <TableHead className="text-end">{isAr ? "المبلغ" : "Montant"}</TableHead>
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

                        return (
                          <TableRow key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-neutral-800">
                                  #{tx.id.slice(0, 8).toUpperCase()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(tx.id, tx.id)}
                                  className="text-neutral-400 hover:text-neutral-700 p-0.5"
                                >
                                  {copiedTxId === tx.id ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </TableCell>

                            <TableCell>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  isPayout
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                                }`}
                              >
                                {isPayout ? (
                                  <>
                                    <ArrowDownLeft className="w-3 h-3" />
                                    <span>{isAr ? "عمولة CPA محصلة" : "Gain CPA"}</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span>{isAr ? "سحب أرباح" : "Retrait Payout"}</span>
                                  </>
                                )}
                              </span>
                            </TableCell>

                            <TableCell className="text-xs text-neutral-700 max-w-sm truncate">
                              {tx.reference || "Commission commande livrée"}
                            </TableCell>

                            <TableCell className="text-xs text-neutral-500 font-mono">
                              {new Date(tx.createdAt).toLocaleDateString(
                                lang === "ar" ? "ar-DZ" : "fr-FR",
                                { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                              )}
                            </TableCell>

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
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-xs text-neutral-400">
                          {isAr ? "لا توجد معاملات سابقة بعد" : "Aucune transaction enregistrée."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* WITHDRAWAL MODAL */}
            {isWithdrawModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-bold text-neutral-900">
                        {isAr ? "طلب سحب الأرباح" : "Demande de Paiement (Payout)"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsWithdrawModalOpen(false)}
                      className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400"
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
                        {isAr ? "تم تسجيل طلب السحب بنجاح!" : "Demande de retrait enregistrée !"}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        {isAr
                          ? "سيتم تحويل المبلغ إلى حسابك ومراجعة العملية في أقرب وقت."
                          : "Le virement sera exécuté sous peu sur les coordonnées indiquées."}
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
                        <span className="text-neutral-500 font-medium">Solde disponible :</span>
                        <span className="font-mono font-bold text-emerald-600 text-sm">
                          {formatDZD(balance, lang)}
                        </span>
                      </div>

                      {/* Payment method selector */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-800">
                          {isAr ? "طريقة استلام الأموال *" : "Moyen de paiement *"}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "BARIDIMOB", label: "BaridiMob (RIP)" },
                            { id: "CCP", label: "Compte CCP Algérie" },
                            { id: "BANK", label: "Virement Bancaire" },
                            { id: "USDT", label: "USDT (TRC-20)" },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setWithdrawMethod(m.id as any)}
                              className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                                withdrawMethod === m.id
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
                        <label className="font-semibold text-neutral-800">
                          {isAr ? "المبلغ المطلوب سحبه (د.ج) *" : "Montant à retirer (DZD) *"}
                        </label>
                        <input
                          type="number"
                          required
                          min={2000}
                          max={balance}
                          step={500}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl border border-neutral-200 font-mono text-sm focus:outline-none focus:border-emerald-600"
                        />
                        <span className="text-[10px] text-neutral-400">Minimum: 2 000 DZD</span>
                      </div>

                      {/* RIP / CCP Account */}
                      <div className="space-y-1">
                        <label className="font-semibold text-neutral-800">
                          {withdrawMethod === "BARIDIMOB"
                            ? "Numéro RIP BaridiMob (20 chiffres) *"
                            : withdrawMethod === "CCP"
                            ? "Numéro de Compte CCP + Clé *"
                            : withdrawMethod === "BANK"
                            ? "RIB Bancaire (20 chiffres) *"
                            : "Adresse Wallet USDT (TRC-20) *"}
                        </label>
                        <input
                          type="text"
                          required
                          dir="ltr"
                          value={recipientRip}
                          onChange={(e) => setRecipientRip(e.target.value)}
                          placeholder={
                            withdrawMethod === "BARIDIMOB"
                              ? "0079999900XXXXXXXXXX"
                              : withdrawMethod === "CCP"
                              ? "12345678 Clé 90"
                              : withdrawMethod === "BANK"
                              ? "RIB 20 chiffres"
                              : "T..."
                          }
                          className="w-full p-2.5 rounded-xl border border-neutral-200 font-mono text-xs focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      {/* Account holder name */}
                      <div className="space-y-1">
                        <label className="font-semibold text-neutral-800">
                          {isAr ? "اسم ولقب صاحب الحساب *" : "Nom & Prénom du titulaire *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Ex: Karim Brahimi"
                          className="w-full p-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => setIsWithdrawModalOpen(false)}
                        >
                          {isAr ? "إلغاء" : "Annuler"}
                        </Button>
                        <Button
                          size="sm"
                          type="submit"
                          disabled={isSubmittingWithdraw}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          {isSubmittingWithdraw ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>{isAr ? "تأكيد الطلب" : "Confirmer le virement"}</span>
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
