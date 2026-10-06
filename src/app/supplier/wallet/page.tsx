"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { translations, Language } from "@/lib/locales";
import { apiGetMyWallet, apiGetTransactions } from "@/lib/api-client";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ShieldCheck,
  Coins,
  Send,
  X,
} from "lucide-react";

export default function SupplierWalletPage() {
  const [wallet, setWallet] = useState<{ id: string; balance: number; ownerType: string } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const [walletRes, txRes] = await Promise.allSettled([
        apiGetMyWallet(),
        apiGetTransactions(50, 0),
      ]);

      if (walletRes.status === "fulfilled" && walletRes.value) {
        setWallet({
          ...walletRes.value,
          balance: Number(walletRes.value.balance || 0),
        });
      } else { setWallet({ id: "mock-wallet", balance: 0, ownerType: "SUPPLIER" }); }

      if (txRes.status === "fulfilled" && txRes.value?.data) {
        setTransactions(txRes.value.data);
      } else { setTransactions([]); }
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
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const balance = wallet?.balance || 0;
  const isLowBalance = balance < 3000;

  return (
    <DashboardLayout initialRole="supplier" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const isAr = lang === "ar";

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-purple-700 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {isAr ? "حساب الضمان المالي Escrow" : "Compte Escrow & Trésorerie"}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1">
                  {t.nav.wallet}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  {isAr
                    ? "إدارة رصيد الضمان المسبق لتغطية عمولات CPA الخاصة بالمسوقين بعد التحصيل"
                    : "Gestion de votre réserve prépayée pour financer les commissions CPA à la livraison"}
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
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white shadow-md shadow-purple-600/20"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{isAr ? "إيداع وتعبئة الرصيد" : "Recharger mon Solde"}</span>
                </Button>
              </div>
            </div>

            {/* Escrow Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Balance */}
              <Card className="p-6 bg-gradient-to-br from-white to-purple-50/30 border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {isAr ? "الرصيد المتاح حالياً" : "Solde Escrow Actuel"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black font-mono text-purple-800">
                    {formatDZD(balance, lang)}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">
                    {isLowBalance
                      ? isAr
                        ? "تنبيه: يُرجى التعبئة قبل استنفاذ الرصيد"
                        : "Attention: solde bas pour les futures livraisons"
                      : isAr
                      ? "كافٍ لتغطية الشحنات الحالية"
                      : "Couverture suffisante pour les expéditions"}
                  </p>
                </div>
              </Card>

              {/* Security info */}
              <Card className="p-6 bg-gradient-to-br from-white to-slate-50 border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {isAr ? "طريقة الخصم" : "Règle de Débit"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-lg font-bold text-neutral-900 block">
                    {isAr ? "عند التسليم فقط (0 د.ج عند المرتجع)" : "À la livraison uniquement"}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">
                    {isAr
                      ? "لا تدفع شيئاً على الطرود المرتجعة أو الملغاة."
                      : "0 DZD de frais plateforme ou CPA en cas de retour (RTO)."}
                  </p>
                </div>
              </Card>

              {/* Recharge speed */}
              <Card className="p-6 bg-gradient-to-br from-white to-slate-50 border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {isAr ? "سرعة التفعيل" : "Délai de Crédit"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-lg font-bold text-neutral-900 block">
                    {isAr ? "فوري عبر BaridiMob / CCP" : "Instantané sous 1h"}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">
                    {isAr
                      ? "يتم تفعيل الرصيد مباشرة بعد إرسال الإشعار."
                      : "Validation rapide dès réception du bordereau de versement."}
                  </p>
                </div>
              </Card>
            </div>

            {/* Transactions Ledger Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    {isAr ? "سجل القيود المحاسبية للمورد" : "Grand Livre des Mouvements (Double-Entry Ledger)"}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isAr ? "تدقيق مالي لكل إيداع وخصم لتوصيل" : "Traçabilité intégrale de vos dépôts et prélèvements"}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-neutral-600">
                  {transactions.length} {isAr ? "حركة مالية" : "lignes"}
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "رقم القيد" : "Réf. Mouvement"}</TableHead>
                      <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                      <TableHead>{isAr ? "البيان / تفاصيل العملية" : "Libellé / Détails"}</TableHead>
                      <TableHead>{isAr ? "التاريخ" : "Date & Heure"}</TableHead>
                      <TableHead className="text-end">{isAr ? "المبلغ" : "Montant"}</TableHead>
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
                    ) : transactions.length > 0 ? (
                      transactions.map((tx) => {
                        const isCredit = Number(tx.amount) > 0;
                        const isDeposit = tx.type === "DEPOSIT";

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
                                  {copiedId === tx.id ? (
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
                                  isDeposit
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {isDeposit ? (
                                  <>
                                    <ArrowDownLeft className="w-3 h-3" />
                                    <span>{isAr ? "إيداع رصيد (CREDIT)" : "Dépôt (Crédit)"}</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span>{isAr ? "خصم تسليم طلب (DEBIT)" : "Débit Livraison"}</span>
                                  </>
                                )}
                              </span>
                            </TableCell>

                            <TableCell className="text-xs text-neutral-700 max-w-sm truncate">
                              {tx.reference || "Opération financière"}
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
                          {isAr ? "لا توجد معاملات مسجلة بعد" : "Aucun mouvement financier enregistré."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* TOP UP MODAL */}
            {isTopUpModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-neutral-200 max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-bold text-neutral-900">
                        {isAr ? "تعبئة رصيد الضمان المالي" : "Rechargement Compte Escrow"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTopUpModalOpen(false)}
                      className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
                    <p>
                      {isAr
                        ? "قم بتحويل المبلغ المرغوب إلى الحسابات التالية ثم أرسل إشعار التحويل لتفعيل الرصيد:"
                        : "Effectuez votre virement vers l'un des comptes ci-dessous puis transmettez le reçu pour validation :"}
                    </p>

                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5 font-mono text-neutral-800 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 font-sans">Compte CCP:</span>
                        <strong className="select-all">0021948293 Clé 45</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 font-sans">BaridiMob RIP:</span>
                        <strong className="select-all">00799999002194829345</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 font-sans">Banque (BNA):</span>
                        <strong className="select-all">00100 02103 0000123456 78</strong>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-neutral-200">
                        <span className="text-neutral-500 font-sans">Titulaire:</span>
                        <strong className="font-sans">SARL ViteDrop Logistics DZ</strong>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px]">
                      <strong>Confirmation rapide :</strong> Envoyez la capture d'écran du transfert sur WhatsApp à votre gestionnaire de compte ou par email à <code>finance@vitedrop.com</code>.
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-neutral-100">
                    <Button
                      size="sm"
                      onClick={() => setIsTopUpModalOpen(false)}
                    >
                      {isAr ? "إغلاق" : "Fermer"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </DashboardLayout>
  );
}
