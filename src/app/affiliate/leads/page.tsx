"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { translations, Language } from "@/lib/locales";
import { apiGetAffiliateOrders, AffiliateOrder } from "@/lib/api-client";
import { getWilayaByCode, ALGERIA_WILAYAS } from "@/lib/algeria-locations";
import { OrderStatus } from "@/types";
import {
  ListOrdered,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Copy,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  Phone,
  MapPin,
  RefreshCw,
  X,
  Package,
} from "lucide-react";
import Link from "next/link";

export default function AffiliateLeadsPage() {
  const [orders, setOrders] = useState<AffiliateOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [wilayaFilter, setWilayaFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AffiliateOrder | null>(null);

  // Load orders from backend
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await apiGetAffiliateOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to fetch live affiliate orders, using fallback leads:", err);
      // Fallback mock leads for demonstration if token missing
      setOrders([
        {
          id: "a9e1040f-fd56-4ac7-b701-57cf528b1e0d",
          affiliateId: "cdc56d60-c4dd-48ed-be17-d637bcb392ae",
          cpaCommission: 1600,
          status: "lead_generated",
          customerName: "Karim Brahimi",
          customerPhone: "0550123456",
          address: "12 Rue Didouche Mourad",
          productId: "3ff5cfa2-22cc-4992-ba21-6466b78f7863",
          productName: "Test Prod",
          quantity: 1,
          wilaya: 16,
          commune: "Alger Centre",
          trackingNumber: null,
          courier: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "0e1a947e-3772-416a-8778-d73554dcf110",
          affiliateId: "cdc56d60-c4dd-48ed-be17-d637bcb392ae",
          cpaCommission: 1600,
          status: "delivered",
          customerName: "Amine Meziani",
          customerPhone: "0661987654",
          address: "Cité 1000 Logements, Bât A4",
          productId: "3ff5cfa2-22cc-4992-ba21-6466b78f7863",
          productName: "Test Prod",
          quantity: 1,
          wilaya: 31,
          commune: "Oran",
          trackingNumber: "YAL-1791039550527",
          courier: "YALIDINE",
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "b6f0f645-d4eb-4e4c-bc2d-fd71b6154f2a",
          affiliateId: "cdc56d60-c4dd-48ed-be17-d637bcb392ae",
          cpaCommission: 1600,
          status: "in_transit",
          customerName: "Yassine Mansouri",
          customerPhone: "0770334455",
          address: "Rue Colonel Lotfi",
          productId: "3ff5cfa2-22cc-4992-ba21-6466b78f7863",
          productName: "Test Prod",
          quantity: 1,
          wilaya: 19,
          commune: "Sétif",
          trackingNumber: "ZR-849201948",
          courier: "ZR_EXPRESS",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "0234bd71-5c97-470d-a30f-0c047f0fb523",
          affiliateId: "cdc56d60-c4dd-48ed-be17-d637bcb392ae",
          cpaCommission: 1600,
          status: "canceled",
          customerName: "Samir Kaci",
          customerPhone: "0559887766",
          address: "Village Azazga",
          productId: "3ff5cfa2-22cc-4992-ba21-6466b78f7863",
          productName: "Test Prod",
          quantity: 1,
          wilaya: 15,
          commune: "Tizi Ouzou",
          trackingNumber: null,
          courier: null,
          cancellationReason: "Client injoignable après 3 tentatives d'appel",
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Mask phone number for security / privacy (Algerian style: 0550***456)
  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 8) return phone;
    return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
  };

  return (
    <DashboardLayout initialRole="affiliate" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const isAr = lang === "ar";

        // KPI Calculations
        const totalLeads = orders.length;
        const deliveredOrders = orders.filter((o) => o.status === "delivered");
        const inTransitOrders = orders.filter(
          (o) => o.status === "in_transit" || o.status === "dispatched"
        );
        const newLeads = orders.filter((o) => o.status === "lead_generated");
        const canceledOrders = orders.filter(
          (o) =>
            o.status === "canceled" ||
            o.status === "rto_in_transit" ||
            o.status === "returned_to_supplier"
        );

        // Realized Earnings (Delivered only!)
        const realizedEarnings = deliveredOrders.reduce(
          (acc, o) => acc + Number(o.cpaCommission || 0),
          0
        );

        // Pending Commission (In transit or waiting for confirmation)
        const pendingCommission = orders
          .filter(
            (o) =>
              o.status === "lead_generated" ||
              o.status === "supplier_confirmed" ||
              o.status === "dispatched" ||
              o.status === "in_transit"
          )
          .reduce((acc, o) => acc + Number(o.cpaCommission || 0), 0);

        // Delivery Rate %
        const terminalCount = deliveredOrders.length + canceledOrders.length;
        const deliveryRate =
          terminalCount > 0
            ? Math.round((deliveredOrders.length / terminalCount) * 100)
            : totalLeads > 0
            ? Math.round((deliveredOrders.length / totalLeads) * 100)
            : 0;

        // Filtered Orders
        const filteredOrders = orders.filter((order) => {
          // Status filter
          if (statusFilter !== "all") {
            if (statusFilter === "in_pipeline") {
              if (
                order.status !== "lead_generated" &&
                order.status !== "supplier_confirmed" &&
                order.status !== "dispatched" &&
                order.status !== "in_transit"
              )
                return false;
            } else if (statusFilter === "returned_canceled") {
              if (
                order.status !== "canceled" &&
                order.status !== "rto_in_transit" &&
                order.status !== "returned_to_supplier"
              )
                return false;
            } else if (order.status !== statusFilter) {
              return false;
            }
          }

          // Wilaya filter
          if (wilayaFilter !== "all" && String(order.wilaya) !== wilayaFilter) {
            return false;
          }

          // Search query
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matchesId = order.id.toLowerCase().includes(q);
            const matchesName = order.customerName.toLowerCase().includes(q);
            const matchesPhone = order.customerPhone.includes(q);
            const matchesCommune = order.commune.toLowerCase().includes(q);
            const matchesTracking = order.trackingNumber?.toLowerCase().includes(q);
            if (!matchesId && !matchesName && !matchesPhone && !matchesCommune && !matchesTracking) {
              return false;
            }
          }

          return true;
        });

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-sky-600 font-bold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                    {t.roles.affiliate}
                  </span>
                  <span className="text-xs font-medium text-neutral-400">•</span>
                  <span className="text-xs font-medium text-neutral-500">
                    {orders.length} {isAr ? "طلب مسجل" : "commandes au total"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1">
                  {t.nav.leads}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  {isAr
                    ? "تتبع مباشر للطلبات من مرحلة التسجيل حتى التحصيل والتسليم النهائي عبر شركات التوصيل"
                    : "Suivi en temps réel de vos prospects de la capture jusqu'à la livraison finale"}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchOrders}
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

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-4 sm:p-5">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                  {isAr ? "العمولات المحصلة" : "Gains Encaissés (Livrés)"}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600">
                    {formatDZD(realizedEarnings, lang)}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                  {deliveredOrders.length} {isAr ? "طلب تم تسليمه" : "commandes livrées"}
                </p>
              </Card>

              <Card className="p-4 sm:p-5">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                  {isAr ? "عمولات قيد المعالجة" : "Commissions En Cours"}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-blue-600">
                    {formatDZD(pendingCommission, lang)}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {newLeads.length + inTransitOrders.length} {isAr ? "طلب في المسار" : "dans le pipeline"}
                </p>
              </Card>

              <Card className="p-4 sm:p-5">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                  {isAr ? "إجمالي الطلبات" : "Total Prospects"}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">
                    {totalLeads}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
                    <ListOrdered className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {newLeads.length} {isAr ? "طلب جديد بانتظار التأكيد" : "nouveaux leads"}
                </p>
              </Card>

              <Card className="p-4 sm:p-5">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                  {isAr ? "نسبة التسليم" : "Taux de Livraison"}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">
                    {deliveryRate}%
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {canceledOrders.length} {isAr ? "ملغاة أو مسترجعة" : "annulations/retours"}
                </p>
              </Card>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isAr
                        ? "بحث برقم الطلب، اسم العميل، الهاتف، أو رقم التتبع..."
                        : "Rechercher par N° de commande, client, téléphone ou tracking..."
                    }
                    className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white rounded-xl border border-neutral-200 py-2 ps-10 pe-4 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Wilaya Filter */}
                <div className="w-full md:w-56 shrink-0">
                  <select
                    value={wilayaFilter}
                    onChange={(e) => setWilayaFilter(e.target.value)}
                    className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white rounded-xl border border-neutral-200 py-2 px-3 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all cursor-pointer"
                  >
                    <option value="all">{isAr ? "جميع الولايات (58 ولاية)" : "Toutes les wilayas (58)"}</option>
                    {ALGERIA_WILAYAS.map((w) => (
                      <option key={w.code} value={String(parseInt(w.code, 10))}>
                        {w.code} - {isAr ? w.nameAr : w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
                {[
                  { id: "all", label: isAr ? "الكل" : "Tous", count: totalLeads },
                  { id: "lead_generated", label: isAr ? "طلبات جديدة" : "Nouveaux Leads", count: newLeads.length },
                  { id: "in_pipeline", label: isAr ? "قيد الشحن والتوصيل" : "En cours / Expédié", count: inTransitOrders.length },
                  { id: "delivered", label: isAr ? "تم التسليم" : "Livrés", count: deliveredOrders.length },
                  { id: "returned_canceled", label: isAr ? "ملغاة ومسترجعة" : "Annulés / Retours", count: canceledOrders.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === tab.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        statusFilter === tab.id
                          ? "bg-white/20 text-white"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">{isAr ? "رقم الطلب" : "Réf. Commande"}</TableHead>
                    <TableHead>{isAr ? "العميل والوجهة" : "Client & Destination"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{isAr ? "شركة التوصيل والتتبع" : "Transporteur & Tracking"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Statut"}</TableHead>
                    <TableHead className="text-end">{isAr ? "العمولة الصافية" : "Commission Nette"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-xs text-neutral-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                        <span>{t.common.loading}</span>
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const wilayaInfo = getWilayaByCode(String(order.wilaya).padStart(2, "0"));
                      const isDelivered = order.status === "delivered";
                      const isFailed =
                        order.status === "canceled" ||
                        order.status === "rto_in_transit" ||
                        order.status === "returned_to_supplier";

                      return (
                        <TableRow
                          key={order.id}
                          className="hover:bg-neutral-50/80 transition-colors cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          {/* Order ID */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-sky-700">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(order.id, order.id);
                                }}
                                className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded"
                                title="Copier ID complet"
                              >
                                {copiedId === order.id ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </TableCell>

                          {/* Customer & Location */}
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-neutral-900">
                                {order.customerName}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                                <span className="font-mono font-medium text-neutral-600">
                                  {maskPhone(order.customerPhone)}
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-neutral-700">
                                  <MapPin className="w-3 h-3 text-neutral-400" />
                                  <span>
                                    {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${order.wilaya}`}{" "}
                                    ({order.commune})
                                  </span>
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            <span className="text-xs text-neutral-600">
                              {new Date(order.createdAt).toLocaleDateString(
                                lang === "ar" ? "ar-DZ" : "fr-FR",
                                { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </TableCell>

                          {/* Logistics / Tracking */}
                          <TableCell>
                            {order.trackingNumber ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
                                  {order.courier || "YALIDINE"}
                                </span>
                                <span className="font-mono text-xs font-medium text-neutral-800">
                                  {order.trackingNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(order.trackingNumber!, `track-${order.id}`);
                                  }}
                                  className="text-neutral-400 hover:text-neutral-700 p-0.5"
                                >
                                  {copiedId === `track-${order.id}` ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400 italic">
                                {order.status === "lead_generated"
                                  ? isAr
                                    ? "بانتظار التأكيد الهاتفي"
                                    : "En attente d'appel"
                                  : "Non assigné"}
                              </span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <StatusBadge status={order.status as OrderStatus} lang={lang} />
                          </TableCell>

                          {/* CPA Commission */}
                          <TableCell className="text-end">
                            <div className="flex flex-col items-end">
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
                              <span className="text-[10px] text-neutral-400">
                                {isDelivered
                                  ? isAr
                                    ? "مكتسب 100%"
                                    : "Encaissé"
                                  : isFailed
                                  ? isAr
                                    ? "غير مستحق"
                                    : "Annulé"
                                  : isAr
                                  ? "معلق"
                                  : "En attente"}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Package className="w-8 h-8 text-neutral-300" />
                          <p className="text-sm font-semibold text-neutral-700">
                            {isAr ? "لم يتم العثور على أي طلبات" : "Aucune commande trouvée"}
                          </p>
                          <p className="text-xs text-neutral-400 max-w-sm">
                            {isAr
                              ? "شارك روابط التتبع الخاصة بمنتجاتك لتوليد طلبات ومبيعات جديدة"
                              : "Partagez vos liens d'affiliation pour capturer de nouveaux prospects"}
                          </p>
                          <Link href="/affiliate/marketplace">
                            <Button size="sm" className="mt-2">
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{isAr ? "تصفح المنتجات" : "Voir le catalogue"}</span>
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ORDER DETAIL MODAL */}
            {selectedOrder && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-neutral-200 max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-sky-600 uppercase">
                        #{selectedOrder.id.slice(0, 8).toUpperCase()}
                      </span>
                      <h3 className="text-lg font-bold text-neutral-900 mt-0.5">
                        {isAr ? "تفاصيل الطلب والتوصيل" : "Détails de la commande"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Status Timeline */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-500">
                        {isAr ? "حالة الطلب الحالية" : "Statut actuel"}
                      </span>
                      <StatusBadge status={selectedOrder.status as OrderStatus} lang={lang} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-500">
                        {isAr ? "العمولة الصافية المستحقة (80%)" : "Commission nette (80%)"}
                      </span>
                      <span className="font-mono text-sm font-bold text-emerald-600">
                        {formatDZD(Number(selectedOrder.cpaCommission || 0), lang)}
                      </span>
                    </div>

                    {selectedOrder.trackingNumber && (
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                        <span className="text-xs font-semibold text-neutral-500">
                          {isAr ? "رقم بوليصة الشحن" : "Numéro de suivi"}
                        </span>
                        <span className="font-mono text-xs font-bold text-neutral-900">
                          {selectedOrder.courier || "YALIDINE"} • {selectedOrder.trackingNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-neutral-900 uppercase text-[11px] tracking-wider">
                      {isAr ? "معلومات الزبون" : "Coordonnées Client"}
                    </p>
                    <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">{isAr ? "الاسم:" : "Nom:"}</span>
                        <span className="font-semibold">{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">{isAr ? "الهاتف:" : "Téléphone:"}</span>
                        <span className="font-mono font-semibold" dir="ltr">
                          {maskPhone(selectedOrder.customerPhone)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">{isAr ? "الوجهة:" : "Destination:"}</span>
                        <span className="font-semibold">
                          Wilaya {selectedOrder.wilaya} ({selectedOrder.commune})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">{isAr ? "العنوان:" : "Adresse:"}</span>
                        <span className="text-neutral-700 text-end max-w-[240px] truncate">
                          {selectedOrder.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.cancellationReason && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                      <p className="font-semibold mb-0.5">{isAr ? "سبب الإلغاء:" : "Motif de l'annulation:"}</p>
                      <p>{selectedOrder.cancellationReason}</p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(null)}>
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
