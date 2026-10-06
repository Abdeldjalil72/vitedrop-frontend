"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { translations, Language } from "@/lib/locales";
import { apiGetAffiliateOrders, apiGetMyWallet, AffiliateOrder } from "@/lib/api-client";
import { getWilayaByCode } from "@/lib/algeria-locations";
import { OrderStatus } from "@/types";
import {
  TrendingUp,
  PackageCheck,
  Clock,
  RotateCcw,
  ArrowUpRight,
  ShoppingBag,
  ListOrdered,
  Sparkles,
  RefreshCw,
  Wallet,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function AffiliateDashboardPage() {
  const [orders, setOrders] = useState<AffiliateOrder[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, walletData] = await Promise.allSettled([
        apiGetAffiliateOrders(),
        apiGetMyWallet(),
      ]);

      if (ordersData.status === "fulfilled" && Array.isArray(ordersData.value)) {
        setOrders(ordersData.value);
      } else { setOrders([]); }

      if (walletData.status === "fulfilled" && walletData.value) {
        setWalletBalance(Number(walletData.value.balance || 0));
      }
    } catch (err) {
      console.warn("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <DashboardLayout initialRole="affiliate" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const isAr = lang === "ar";

        // Metrics calculations
        const totalLeads = orders.length;
        const deliveredOrders = orders.filter((o) => o.status === "delivered");
        const inTransitOrders = orders.filter(
          (o) => o.status === "in_transit" || o.status === "dispatched"
        );
        const canceledOrders = orders.filter(
          (o) =>
            o.status === "canceled" ||
            o.status === "rto_in_transit" ||
            o.status === "returned_to_supplier"
        );

        // Net Earnings (from wallet balance if available, otherwise sum of delivered commissions)
        const totalDeliveredEarnings = deliveredOrders.reduce(
          (acc, o) => acc + Number(o.cpaCommission || 0),
          0
        );
        const effectiveEarnings = walletBalance !== null ? walletBalance : totalDeliveredEarnings;

        // Pending Commission (pipeline)
        const pendingCommission = orders
          .filter(
            (o) =>
              o.status === "lead_generated" ||
              o.status === "supplier_confirmed" ||
              o.status === "dispatched" ||
              o.status === "in_transit"
          )
          .reduce((acc, o) => acc + Number(o.cpaCommission || 0), 0);

        // Rates
        const terminalCount = deliveredOrders.length + canceledOrders.length;
        const deliveryRate =
          terminalCount > 0
            ? Math.round((deliveredOrders.length / terminalCount) * 100)
            : totalLeads > 0
            ? Math.round((deliveredOrders.length / totalLeads) * 100)
            : 0;

        const recentOrders = orders.slice(0, 5);

        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-sky-600 font-bold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                    {t.roles.affiliate}
                  </span>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {isAr ? "شبكة التسويق بالعمولة CPA الجزائر" : "Réseau CPA Affiliation Algérie"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1">
                  {t.dashboard.title}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  {t.dashboard.welcome}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadDashboardData}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>{isAr ? "تحديث" : "Actualiser"}</span>
                </Button>

                <Link href="/affiliate/marketplace">
                  <Button size="sm" className="gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{t.nav.marketplace}</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Total Net Earnings */}
              <Card enableHover className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500">
                    {t.dashboard.stats.totalEarnings}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-bold text-neutral-900 font-mono">
                    {formatDZD(effectiveEarnings, lang)}
                  </span>
                  <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {isAr
                        ? "عمولة صافية 100% (نسبة 80% للمسوق)"
                        : "100% CPA Net (80% Reversé)"}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 2. Delivered Orders */}
              <Card enableHover className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500">
                    {t.dashboard.stats.deliveredOrders}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center text-xs">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-bold text-neutral-900 font-mono">
                    {deliveredOrders.length}
                  </span>
                  <div className="mt-2 text-xs text-sky-600 font-semibold">
                    {isAr
                      ? "مؤكد عبر واجهة برمجة Yalidine و ZR"
                      : "Confirmé par Webhook Yalidine/ZR"}
                  </div>
                </div>
              </Card>

              {/* 3. Delivery Rate % */}
              <Card enableHover className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500">
                    {t.dashboard.stats.deliveryRate}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-bold text-neutral-900 font-mono">
                    {deliveryRate}%
                  </span>
                  <div className="mt-2 text-xs text-neutral-500">
                    {isAr ? "المعدل المحسوب للطلبات المنجزة" : "Taux d'encaissement effectif"}
                  </div>
                </div>
              </Card>

              {/* 4. Pending Commissions */}
              <Card enableHover className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500">
                    {isAr ? "عمولات قيد الشحن" : "Commissions En Cours"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-bold text-neutral-900 font-mono">
                    {formatDZD(pendingCommission, lang)}
                  </span>
                  <div className="mt-2 text-xs text-amber-600 font-semibold">
                    {orders.length - deliveredOrders.length - canceledOrders.length}{" "}
                    {isAr ? "طلب في طور المعالجة" : "commandes dans le circuit"}
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Action Ribbon */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-neutral-900 to-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
                  {isAr ? "زيادة الأرباح" : "Maximiser vos gains"}
                </span>
                <h3 className="text-base sm:text-lg font-bold">
                  {isAr
                    ? "هل أنت مستعد لإطلاق حملاتك الإعلانية القادمة؟"
                    : "Prêt à scaler vos campagnes publicitaires ?"}
                </h3>
                <p className="text-xs text-neutral-300">
                  {isAr
                    ? "اختر منتجات عالية الطلب مع عمولات صافية تصل إلى 3,500 د.ج للقطعة الواحدة."
                    : "Sélectionnez des produits à fort potentiel avec jusqu'à 3 500 DZD de CPA net."}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link href="/affiliate/marketplace">
                  <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white border-0">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isAr ? "كتالوج المنتجات" : "Catalogue Produits"}</span>
                  </Button>
                </Link>
                <Link href="/affiliate/leads">
                  <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                    <ListOrdered className="w-4 h-4" />
                    <span>{isAr ? "سجل الطلبات" : "Toutes les commandes"}</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Recent Leads / Orders Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-neutral-900">
                    {t.dashboard.recentLeads}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isAr ? "آخر الطلبات المسجلة من إعلاناتك" : "Dernières conversions enregistrées"}
                  </p>
                </div>

                <Link
                  href="/affiliate/leads"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <span>{t.common.viewAll}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.dashboard.leadId}</TableHead>
                      <TableHead>{t.dashboard.customer}</TableHead>
                      <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                      <TableHead>{t.common.status}</TableHead>
                      <TableHead className="text-end">{t.dashboard.payout}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => {
                        const wilayaInfo = getWilayaByCode(String(order.wilaya).padStart(2, "0"));
                        const isDelivered = order.status === "delivered";
                        const isFailed =
                          order.status === "canceled" ||
                          order.status === "rto_in_transit" ||
                          order.status === "returned_to_supplier";

                        return (
                          <TableRow key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                            <TableCell className="font-mono text-xs font-bold text-sky-700">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-neutral-900">
                                  {order.customerName}
                                </span>
                                <span className="text-[11px] text-neutral-500">
                                  {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `Wilaya ${order.wilaya}`} •{" "}
                                  {order.commune}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-neutral-500">
                              {new Date(order.createdAt).toLocaleDateString(
                                lang === "ar" ? "ar-DZ" : "fr-FR",
                                { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                              )}
                            </TableCell>

                            <TableCell>
                              <StatusBadge status={order.status as OrderStatus} lang={lang} />
                            </TableCell>

                            <TableCell className="text-end">
                              <span
                                className={`font-mono text-xs font-bold ${
                                  isDelivered
                                    ? "text-emerald-600"
                                    : isFailed
                                    ? "text-neutral-400 line-through"
                                    : "text-blue-600"
                                }`}
                              >
                                {formatDZD(Number(order.cpaCommission || 0), lang)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-28 text-center text-xs text-neutral-400">
                          {isAr ? "لا توجد طلبات مسجلة بعد" : "Aucune commande pour le moment"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
