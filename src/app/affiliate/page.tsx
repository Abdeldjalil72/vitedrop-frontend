"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import {
  apiGetAffiliateOrders,
  apiGetMyWallet,
  apiGetAffiliateAnalytics,
  updateGlobalWalletBalance,
  AffiliateOrder,
  AffiliateAnalytics,
} from "@/lib/api-client";
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
  Link2,
  MousePointerClick,
  Percent,
  Coins,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default function AffiliateDashboardPage() {
  const [orders, setOrders] = useState<AffiliateOrder[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<AffiliateAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, walletData, analyticsData] = await Promise.allSettled([
        apiGetAffiliateOrders(),
        apiGetMyWallet(),
        apiGetAffiliateAnalytics(),
      ]);

      if (ordersData.status === "fulfilled" && Array.isArray(ordersData.value)) {
        setOrders(ordersData.value);
      } else {
        setOrders([]);
      }

      if (walletData.status === "fulfilled" && walletData.value) {
        const bal = Number(walletData.value.balance || 0);
        setWalletBalance(bal);
        updateGlobalWalletBalance(bal);
      } else {
        setWalletBalance(0);
      }

      if (analyticsData.status === "fulfilled" && analyticsData.value) {
        setAnalytics(analyticsData.value);
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
        const isEn = lang === "en";

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
          <div className="space-y-8 text-start w-full max-w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isAr ? "" : "font-mono uppercase tracking-wider"} text-sky-700 font-semibold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100`}>
                    {t.roles.affiliate}
                  </span>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {isAr
                      ? "شبكة التسويق بالعمولة CPA الجزائر"
                      : isEn
                      ? "Algeria CPA Affiliate Network"
                      : "Réseau CPA Affiliation Algérie"}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight mt-1">
                  {t.dashboard.title}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl">
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
                  <span>{isAr ? "تحديث" : isEn ? "Refresh" : "Actualiser"}</span>
                </Button>

                <Link href="/affiliate/marketplace">
                  <Button size="sm" data-testid="quick-marketplace-btn" className="gap-1.5">
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
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {t.dashboard.stats.totalEarnings}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    data-testid="stat-total-earnings"
                    className="text-2xl sm:text-3xl font-bold text-neutral-900 font-mono tracking-tight"
                  >
                    {formatDZD(effectiveEarnings, lang)}
                  </span>
                  <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {isAr
                        ? "عمولة صافية 100%"
                        : isEn
                        ? "100% Net CPA"
                        : "100% CPA Net"}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 2. Delivered Orders */}
              <Card enableHover className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {t.dashboard.stats.deliveredOrders}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center text-xs">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    data-testid="stat-delivered-orders"
                    className="text-2xl sm:text-3xl font-bold text-neutral-900 font-mono tracking-tight"
                  >
                    {deliveredOrders.length}
                  </span>
                  <div className="mt-2 text-xs text-sky-600 font-semibold">
                    {isAr
                      ? "مؤكد عبر واجهة ربط شركات التوصيل (6 شركات)"
                      : isEn
                      ? "Confirmed via Carrier Webhook (6 Couriers)"
                      : "Confirmé par Webhook Transporteur (6 Sociétés)"}
                  </div>
                </div>
              </Card>

              {/* 3. Delivery Rate % */}
              <Card enableHover className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {t.dashboard.stats.deliveryRate}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    data-testid="stat-delivery-rate"
                    className="text-2xl sm:text-3xl font-bold text-neutral-900 font-mono tracking-tight"
                  >
                    {deliveryRate}%
                  </span>
                  <div className="mt-2 text-xs text-neutral-500">
                    {isAr
                      ? "المعدل المحسوب للطلبات المنجزة"
                      : isEn
                      ? "Effective clearance rate"
                      : "Taux d'encaissement effectif"}
                  </div>
                </div>
              </Card>

              {/* 4. Pending Commissions */}
              <Card enableHover className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {isAr
                      ? "عمولات قيد الشحن"
                      : isEn
                      ? "Pending Commissions"
                      : "Commissions En Cours"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    data-testid="stat-pending-commissions"
                    className="text-2xl sm:text-3xl font-bold text-neutral-900 font-mono tracking-tight"
                  >
                    {formatDZD(pendingCommission, lang)}
                  </span>
                  <div className="mt-2 text-xs text-amber-600 font-semibold">
                    {inTransitOrders.length}{" "}
                    {isAr
                      ? "طلب في طور الشحن"
                      : isEn
                      ? "orders in transit"
                      : "commandes dans le circuit"}
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Action Ribbon */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50/70 via-white to-blue-50/40 border border-sky-100/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-100/80 text-sky-700 border border-sky-200/50">
                  <Sparkles className="w-3 h-3 text-sky-600" />
                  <span className={`text-[11px] ${isAr ? "" : "font-mono uppercase tracking-wider"} font-bold`}>
                    {isAr
                      ? "زيادة الأرباح"
                      : isEn
                      ? "Maximize Your Earnings"
                      : "Maximiser vos gains"}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                  {isAr
                    ? "هل أنت مستعد لإطلاق حملاتك الإعلانية القادمة؟"
                    : isEn
                    ? "Ready to scale your ad campaigns?"
                    : "Prêt à scaler vos campagnes publicitaires ?"}
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed max-w-xl">
                  {isAr
                    ? "اختر منتجات عالية الطلب مع عمولات صافية تصل إلى 3,500 د.ج للقطعة الواحدة."
                    : isEn
                    ? "Select high-potential products with up to 3,500 DZD net CPA."
                    : "Sélectionnez des produits à fort potentiel avec jusqu'à 3 500 DZD de CPA net."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link href="/affiliate/marketplace">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] hover:brightness-105 text-white font-semibold shadow-sm shadow-sky-500/20 border-0"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isAr ? "كتالوج المنتجات" : isEn ? "Product Catalog" : "Catalogue"}</span>
                  </Button>
                </Link>
                <Link href="/affiliate/links">
                  <Button
                    variant="secondary"
                    size="sm"
                    data-testid="quick-links-btn"
                    className="bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200 shadow-2xs font-medium"
                  >
                    <Link2 className="w-4 h-4 text-neutral-500" />
                    <span>{isAr ? "إنشاء الروابط" : isEn ? "S2S Links" : "Liens S2S"}</span>
                  </Button>
                </Link>
                <Link href="/affiliate/wallet">
                  <Button
                    variant="secondary"
                    size="sm"
                    data-testid="quick-wallet-btn"
                    className="bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200 shadow-2xs font-medium"
                  >
                    <Wallet className="w-4 h-4 text-neutral-500" />
                    <span>{isAr ? "المحفظة" : isEn ? "Wallet" : "Portefeuille"}</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Advertising & Telemetry Strip */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    {isAr
                      ? "مؤشرات الحملات الإعلانية ونسب التحويل (CAPI Telemetry)"
                      : isEn
                      ? "Ad Campaigns & Server-Side Telemetry (CAPI)"
                      : "Télémétrie Publicitaire & Conversion S2S"}
                  </h3>
                </div>
                <Link
                  href="/affiliate/links"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <span>{isAr ? "إدارة روابط الحملات" : isEn ? "Manage Tracking Links" : "Gérer les liens de campagne"}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Clicks */}
                <Card enableHover className="p-5 border-black/[0.06] bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      {isAr ? "إجمالي الزيارات والضغطات" : isEn ? "Visits & Ad Clicks" : "Visites & Clics Ad"}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
                      <MousePointerClick className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span
                      data-testid="stat-total-clicks"
                      className="text-2xl font-bold font-mono text-neutral-900"
                    >
                      {analytics?.totalClicks ?? 0}
                    </span>
                    <p className="mt-1 text-[11px] text-neutral-500">
                      {isAr ? "زيارات موثوقة ومحمية من التكرار" : isEn ? "Unique verified clicks (anti-fraud)" : "Clics uniques filtrés anti-fraude"}
                    </p>
                  </div>
                </Card>

                {/* Conversion Rate */}
                <Card enableHover className="p-5 border-black/[0.06] bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      {isAr ? "معدل التحويل (CR %)" : isEn ? "Conversion Rate (CR)" : "Taux de Conversion (CR)"}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Percent className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span
                      data-testid="stat-conversion-rate"
                      className="text-2xl font-bold font-mono text-emerald-600"
                    >
                      {analytics?.conversionRate ?? 0}%
                    </span>
                    <p className="mt-1 text-[11px] text-neutral-500">
                      {isAr ? "نسبة تحويل الزوار إلى طلبات مؤكدة" : isEn ? "Orders generated / Clicks" : "Commandes générées / Clics"}
                    </p>
                  </div>
                </Card>

                {/* EPC (Earnings Per Click) */}
                <Card enableHover className="p-5 border-black/[0.06] bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      {isAr ? "عائد النقرة (EPC)" : isEn ? "Earnings Per Click (EPC)" : "Gains par Clic (EPC)"}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span
                      data-testid="stat-epc"
                      className="text-2xl font-bold font-mono text-amber-600"
                    >
                      {formatDZD(analytics?.epc ?? 0, lang)}
                    </span>
                    <p className="mt-1 text-[11px] text-neutral-500">
                      {isAr ? "متوسط الربح الصافي عن كل زيارة" : isEn ? "Average net profit generated per visit" : "Gain net moyen généré par visite"}
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Recent Leads / Orders Section (Dual-Rendering Desktop Table + Mobile Cards) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-neutral-900">
                    {t.dashboard.recentLeads}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isAr
                      ? "آخر الطلبات المسجلة من إعلاناتك"
                      : isEn
                      ? "Latest conversions recorded from your ads"
                      : "Dernières conversions enregistrées"}
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

              {/* Desktop Table View (>= 1024px) */}
              <div className="hidden lg:block bg-white rounded-2xl border border-black/[0.08] shadow-xs overflow-hidden">
                <Table data-testid="affiliate-recent-orders-table">
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
                          <TableRow
                            key={order.id}
                            data-testid="affiliate-recent-order-row"
                            className="hover:bg-neutral-50/80 transition-colors"
                          >
                            <TableCell className="font-mono text-xs font-semibold text-neutral-800">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-neutral-900 tracking-tight leading-snug">
                                  {order.customerName}
                                </span>
                                <span className="text-xs text-neutral-500 mt-0.5">
                                  {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `Wilaya ${order.wilaya}`} •{" "}
                                  {order.commune}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-neutral-500">
                              {new Date(order.createdAt).toLocaleDateString(
                                lang === "ar" ? "ar-DZ" : isEn ? "en-US" : "fr-FR",
                                { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                              )}
                            </TableCell>

                            <TableCell>
                              <StatusBadge status={order.status as OrderStatus} lang={lang} />
                            </TableCell>

                            <TableCell className="text-end">
                              <span
                                className={`font-mono text-xs font-bold tracking-tight ${
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
                          {isAr
                            ? "لا توجد طلبات مسجلة بعد"
                            : isEn
                            ? "No orders recorded yet"
                            : "Aucune commande pour le moment"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards View (< 1024px) */}
              <div className="lg:hidden flex flex-col gap-3">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => {
                    const wilayaInfo = getWilayaByCode(String(order.wilaya).padStart(2, "0"));
                    const isDelivered = order.status === "delivered";
                    const isFailed =
                      order.status === "canceled" ||
                      order.status === "rto_in_transit" ||
                      order.status === "returned_to_supplier";

                    return (
                      <div
                        key={order.id}
                        data-testid="affiliate-recent-order-card"
                        className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-semibold text-neutral-800">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <h4 className="text-sm font-semibold text-neutral-900 tracking-tight leading-snug mt-0.5">
                              {order.customerName}
                            </h4>
                          </div>
                          <StatusBadge status={order.status as OrderStatus} lang={lang} />
                        </div>

                        <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-neutral-50">
                          <span className="text-[11px] text-neutral-500">
                            {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${order.wilaya}`} ({order.commune})
                          </span>
                          <span
                            className={`font-mono font-bold text-xs ${
                              isDelivered
                                ? "text-emerald-600"
                                : isFailed
                                ? "text-neutral-400 line-through"
                                : "text-blue-600"
                            }`}
                          >
                            {formatDZD(Number(order.cpaCommission || 0), lang)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-black/[0.08]">
                    {isAr
                      ? "لا توجد طلبات مسجلة بعد"
                      : isEn
                      ? "No orders recorded yet"
                      : "Aucune commande pour le moment"}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
