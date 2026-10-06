"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { formatDZD } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import {
  ShieldAlert,
  Coins,
  CheckCircle2,
  XCircle,
  Users,
  Store,
  DollarSign,
  TrendingUp,
  Receipt,
  ArrowUpRight,
} from "lucide-react";

import Link from "next/link";
import { apiGetAdminStats, apiGetPendingWithdrawals, AdminWithdrawal } from "@/lib/api-client";
import { WithdrawalActionModal, WithdrawalModalAction } from "@/components/admin/withdrawal-action-modal";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMetricGrid, AdminMetricCard } from "@/components/admin/admin-metric-grid";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("withdrawals");

  const [stats, setStats] = useState({
    totalAffiliates: 0,
    totalSuppliers: 0,
    totalOrders: 0,
    totalSupplierEscrow: 0,
    totalAffiliateLiability: 0,
    pendingWithdrawalsCount: 0,
    pendingWithdrawalsAmount: 0,
    platformRevenue: 0,
  });
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [modalAction, setModalAction] = useState<WithdrawalModalAction | null>(null);

  const loadData = async () => {
    try {
      const [statsData, withdrawalsData] = await Promise.all([
        apiGetAdminStats(),
        apiGetPendingWithdrawals(),
      ]);
      setStats(statsData);
      setWithdrawals(withdrawalsData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);



  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];

        const tabs = [
          {
            id: "withdrawals",
            label: lang === "ar" ? "طلبات السحب (CCP)" : "Demandes de Retraits",
            badge: withdrawals.length,
          },
          {
            id: "ledger",
            label: lang === "ar" ? "سجل عمولات المنصة" : "Grand Livre Escrow (20%)",
          },
        ];

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Header */}
            <AdminPageHeader
              eyebrow={lang === "ar" ? "لوحة الإدارة والتحكم العام" : "Platform Master Administration"}
              title={lang === "ar" ? "إدارة شبكة فايت دروب" : "Supervision & Escrow ViteDrop"}
              description={
                lang === "ar"
                  ? "التحكم في العمولات المحجوزة، سحوبات بريد الجزائر، وتراخيص المنتجات."
                  : "Surveillance de l'escrow, validation des virements CCP/BaridiMob et approbations de stock."
              }
              actions={
                <div className="px-3 py-1.5 rounded-2xl bg-neutral-900 text-white text-xs font-mono font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Escrow: {formatDZD(stats.totalSupplierEscrow, lang)}</span>
                </div>
              }
            />

            {/* Platform Master KPIs */}
            <AdminMetricGrid columns={4}>
              {/* Card 1: Platform Revenue */}
              <AdminMetricCard
                label={lang === "ar" ? "أرباح المنصة (20%)" : "Frais Plateforme (20%)"}
                value={formatDZD(stats.platformRevenue, lang)}
                icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
                subtext={
                  <span className="text-emerald-600 font-semibold">
                    {lang === "ar" ? "مقتطعة عند التسليم" : "Crédit sur delivered"}
                  </span>
                }
              />

              {/* Card 2: Pending Withdrawals */}
              <AdminMetricCard
                label={lang === "ar" ? "سحوبات بالانتظار" : "Retraits en Attente"}
                value={formatDZD(stats.pendingWithdrawalsAmount || stats.totalAffiliateLiability, lang)}
                icon={<Receipt className="w-4 h-4 text-amber-600" />}
                subtext={
                  <span className="text-amber-700 font-semibold">
                    {stats.pendingWithdrawalsCount || withdrawals.length} {lang === "ar" ? "طلبات معلقة" : "à traiter"}
                  </span>
                }
              />

              {/* Card 3: Affiliates */}
              <AdminMetricCard
                label={lang === "ar" ? "المسوقون المسجلون" : "Media Buyers"}
                value={stats.totalAffiliates}
                icon={<Users className="w-4 h-4 text-sky-600" />}
                subtext={
                  <span className="text-sky-600 font-semibold">
                    {lang === "ar" ? "حسابات نشطة" : "Affiliés actifs"}
                  </span>
                }
              />

              {/* Card 4: Suppliers */}
              <AdminMetricCard
                label={lang === "ar" ? "الموردون المعتمدون" : "Fournisseurs"}
                value={stats.totalSuppliers}
                icon={<Store className="w-4 h-4 text-purple-600" />}
                subtext={
                  <span className="text-purple-600 font-semibold">
                    {stats.totalOrders} {lang === "ar" ? "طلبيات" : "commandes"}
                  </span>
                }
              />
            </AdminMetricGrid>

            {/* Management Section with Tabs */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
              </div>

              {/* Tab 1: Withdrawals Queue */}
              {activeTab === "withdrawals" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réf Retrait</TableHead>
                      <TableHead>Affilié</TableHead>
                      <TableHead>Méthode / Coordonnées</TableHead>
                      <TableHead>Montant Demandé</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-end">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-neutral-500">
                          Aucune demande de retrait
                        </TableCell>
                      </TableRow>
                    ) : (
                      withdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-mono text-xs font-bold text-neutral-900">
                            {w.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-neutral-900">{w.fullName}</span>
                              <span className="text-[11px] text-[#6b6b6b]">{w.role}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-neutral-900">Virement</span>
                              <span className="text-[11px] font-mono text-[#6b6b6b]">{w.reference}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-emerald-600">
                            {formatDZD(w.amount, lang)}
                          </TableCell>
                          <TableCell className="text-xs text-[#6b6b6b] font-mono">
                            {new Date(w.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedWithdrawal(w);
                                  setModalAction("REJECT");
                                }}
                                className="text-[11px] px-2.5 py-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rejeter</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedWithdrawal(w);
                                  setModalAction("APPROVE");
                                }}
                                className="text-[11px] px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Valider Virement</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {/* Link to dedicated withdrawals queue */}
              {activeTab === "withdrawals" && (
                <div className="flex justify-end pt-2">
                  <Link
                    href="/admin/withdrawals"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    <span>{lang === "ar" ? "عرض جميع طلبات السحب وحالاتها ←" : "Ouvrir la file complète des retraits →"}</span>
                  </Link>
                </div>
              )}

              {/* Tab 2: Ledger Rules reminder */}
              {activeTab === "ledger" && (
                <Card className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900">
                        Règles d'Immutabilité Financière ViteDrop
                      </h4>
                      <p className="text-xs text-[#6b6b6b] mt-1 leading-relaxed">
                        Chaque mouvement de fonds est consigné dans la table{" "}
                        <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-[11px]">
                          wallet_transactions
                        </code>
                        . Les statuts autorisés sont strictement typés :{" "}
                        <span className="font-mono font-bold text-neutral-800">
                          DEPOSIT, WITHDRAWAL, CPA_PAYOUT, PLATFORM_FEE, SUPPLIER_DEBIT
                        </span>
                        . Le spread de 20% est prélevé automatiquement lors de l'encaissement
                        confirmé par le webhook transporteur.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Action Modal */}
            {selectedWithdrawal && modalAction && (
              <WithdrawalActionModal
                withdrawal={selectedWithdrawal}
                action={modalAction}
                isOpen={true}
                onClose={() => {
                  setSelectedWithdrawal(null);
                  setModalAction(null);
                }}
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
