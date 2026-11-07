"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ModernSelect } from "@/components/ui/modern-select";
import { formatDZD } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import { apiGetAffiliateOrders, AffiliateOrder } from "@/lib/api-client";
import { getWilayaByCode, ALGERIA_WILAYAS } from "@/lib/algeria-locations";
import { OrderStatus } from "@/types";
import {
  ListOrdered,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Copy,
  ShoppingBag,
  MapPin,
  RefreshCw,
  X,
  Package,
  Eye,
  Check,
} from "lucide-react";
import Link from "next/link";

const leadsI18n = {
  fr: {
    totalOrdersSuffix: "commandes au total",
    subtitle: "Suivi en temps réel de vos prospects de la capture jusqu'à la livraison finale",
    refresh: "Actualiser",
    kpiCleared: "Gains Encaissés (Livrés)",
    kpiDeliveredSuffix: "commandes livrées",
    kpiPipeline: "Commissions En Cours",
    kpiPipelineSuffix: "dans le pipeline",
    kpiTotal: "Total Prospects",
    kpiNewLeadsSuffix: "nouveaux leads",
    kpiDeliveryRate: "Taux de Livraison",
    kpiRtoSuffix: "annulations/retours",
    searchPlaceholder: "Rechercher par N° de commande, client, téléphone ou tracking...",
    allWilayas: "Toutes les wilayas (58)",
    tabs: {
      all: "Tous",
      newLeads: "Nouveaux Leads",
      inPipeline: "En cours / Expédié",
      delivered: "Livrés",
      canceledReturns: "Annulés / Retours",
    },
    colOrderRef: "Réf. Commande",
    colCustomer: "Client & Destination",
    colDate: "Date",
    colCourier: "Transporteur & Tracking",
    colStatus: "Statut",
    colCommission: "Commission Nette",
    awaitingCall: "En attente d'appel",
    unassigned: "Non assigné",
    commissionCleared: "Encaissé",
    commissionCanceled: "Annulé",
    commissionPending: "En attente",
    emptyTitle: "Aucune commande trouvée",
    emptyDesc: "Partagez vos liens d'affiliation pour capturer de nouveaux prospects",
    viewCatalog: "Voir le catalogue",
    commissionNetteLabel: "Commission Nette:",
    viewDetails: "Voir les détails",
    modal: {
      title: "Détails de la commande",
      statusLabel: "Statut actuel",
      commissionLabel: "Commission nette",
      trackingLabel: "Numéro de suivi",
      customerSection: "Coordonnées Client",
      name: "Nom:",
      phone: "Téléphone:",
      destination: "Destination:",
      address: "Adresse:",
      cancellationReason: "Motif de l'annulation:",
      close: "Fermer",
    },
  },
  en: {
    totalOrdersSuffix: "total orders",
    subtitle: "Real-time tracking of your leads from capture to final delivery",
    refresh: "Refresh",
    kpiCleared: "Cleared Earnings (Delivered)",
    kpiDeliveredSuffix: "orders delivered",
    kpiPipeline: "Commissions In Pipeline",
    kpiPipelineSuffix: "in the pipeline",
    kpiTotal: "Total Prospects",
    kpiNewLeadsSuffix: "new leads",
    kpiDeliveryRate: "Delivery Rate",
    kpiRtoSuffix: "cancellations/returns",
    searchPlaceholder: "Search by order ID, customer name, phone, or tracking...",
    allWilayas: "All wilayas (58)",
    tabs: {
      all: "All",
      newLeads: "New Leads",
      inPipeline: "In Transit / Dispatched",
      delivered: "Delivered",
      canceledReturns: "Canceled / Returns",
    },
    colOrderRef: "Order Ref.",
    colCustomer: "Customer & Destination",
    colDate: "Date",
    colCourier: "Carrier & Tracking",
    colStatus: "Status",
    colCommission: "Net Commission",
    awaitingCall: "Awaiting phone confirmation",
    unassigned: "Unassigned",
    commissionCleared: "Cleared",
    commissionCanceled: "Canceled",
    commissionPending: "Pending",
    emptyTitle: "No orders found",
    emptyDesc: "Share your affiliate tracking links to capture new orders and sales",
    viewCatalog: "Browse Catalog",
    commissionNetteLabel: "Net Commission:",
    viewDetails: "View details",
    modal: {
      title: "Order & Delivery Details",
      statusLabel: "Current status",
      commissionLabel: "Net commission due",
      trackingLabel: "Tracking number",
      customerSection: "Customer Information",
      name: "Name:",
      phone: "Phone:",
      destination: "Destination:",
      address: "Address:",
      cancellationReason: "Cancellation reason:",
      close: "Close",
    },
  },
  ar: {
    totalOrdersSuffix: "طلب مسجل",
    subtitle: "تتبع مباشر للطلبات من مرحلة التسجيل حتى التحصيل والتسليم النهائي عبر شركات التوصيل",
    refresh: "تحديث",
    kpiCleared: "العمولات المحصلة",
    kpiDeliveredSuffix: "طلب تم تسليمه",
    kpiPipeline: "عمولات قيد المعالجة",
    kpiPipelineSuffix: "طلب في المسار",
    kpiTotal: "إجمالي الطلبات",
    kpiNewLeadsSuffix: "طلب جديد بانتظار التأكيد",
    kpiDeliveryRate: "نسبة التسليم",
    kpiRtoSuffix: "ملغاة أو مسترجعة",
    searchPlaceholder: "بحث برقم الطلب، اسم العميل، الهاتف، أو رقم التتبع...",
    allWilayas: "جميع الولايات (58 ولاية)",
    tabs: {
      all: "الكل",
      newLeads: "طلبات جديدة",
      inPipeline: "قيد الشحن والتوصيل",
      delivered: "تم التسليم",
      canceledReturns: "ملغاة ومسترجعة",
    },
    colOrderRef: "رقم الطلب",
    colCustomer: "العميل والوجهة",
    colDate: "التاريخ",
    colCourier: "شركة التوصيل والتتبع",
    colStatus: "الحالة",
    colCommission: "العمولة الصافية",
    awaitingCall: "بانتظار التأكيد الهاتفي",
    unassigned: "غير معين",
    commissionCleared: "مكتسب 100%",
    commissionCanceled: "غير مستحق",
    commissionPending: "معلق",
    emptyTitle: "لم يتم العثور على أي طلبات",
    emptyDesc: "شارك روابط التتبع الخاصة بمنتجاتك لتوليد طلبات ومبيعات جديدة",
    viewCatalog: "تصفح المنتجات",
    commissionNetteLabel: "العمولة الصافية:",
    viewDetails: "معاينة التفاصيل",
    modal: {
      title: "تفاصيل الطلب والتوصيل",
      statusLabel: "حالة الطلب الحالية",
      commissionLabel: "العمولة الصافية المستحقة",
      trackingLabel: "رقم بوليصة الشحن",
      customerSection: "معلومات الزبون",
      name: "الاسم:",
      phone: "الهاتف:",
      destination: "الوجهة:",
      address: "العنوان:",
      cancellationReason: "سبب الإلغاء:",
      close: "إغلاق",
    },
  },
};

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
      console.warn("Failed to fetch live affiliate orders:", err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedOrder) {
        setSelectedOrder(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOrder]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Mask phone number for privacy (0550***456)
  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 8) return phone;
    return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
  };

  return (
    <DashboardLayout initialRole="affiliate" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const dict = leadsI18n[lang as "en" | "fr" | "ar"] || leadsI18n.fr;
        const isAr = lang === "ar";
        const isEn = lang === "en";

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

        // Realized Earnings (Delivered only)
        const realizedEarnings = deliveredOrders.reduce(
          (acc, o) => acc + Number(o.cpaCommission || 0),
          0
        );

        // Pending Commission (In pipeline)
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
          <div className="space-y-6 text-start w-full max-w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isAr ? "" : "font-mono uppercase tracking-wider"} text-sky-700 font-semibold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100`}>
                    {t.roles.affiliate}
                  </span>
                  <span className="text-xs font-medium text-neutral-400">•</span>
                  <span className="text-xs font-medium text-neutral-500">
                    {orders.length} {dict.totalOrdersSuffix}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight mt-1">
                  {t.nav.leads}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl">
                  {dict.subtitle}
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
                  <span>{dict.refresh}</span>
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
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block">
                  {dict.kpiCleared}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-600">
                    {formatDZD(realizedEarnings, lang)}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                  {deliveredOrders.length} {dict.kpiDeliveredSuffix}
                </p>
              </Card>

              <Card className="p-4 sm:p-5">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block">
                  {dict.kpiPipeline}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-blue-600">
                    {formatDZD(pendingCommission, lang)}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {newLeads.length + inTransitOrders.length} {dict.kpiPipelineSuffix}
                </p>
              </Card>

              <Card className="p-4 sm:p-5">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block">
                  {dict.kpiTotal}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-neutral-900">
                    {totalLeads}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
                    <ListOrdered className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {newLeads.length} {dict.kpiNewLeadsSuffix}
                </p>
              </Card>

              <Card className="p-4 sm:p-5">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block">
                  {dict.kpiDeliveryRate}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-neutral-900">
                    {deliveryRate}%
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {canceledOrders.length} {dict.kpiRtoSuffix}
                </p>
              </Card>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="affiliate-order-search-input"
                    placeholder={dict.searchPlaceholder}
                    className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white rounded-xl border border-black/10 py-2 ps-10 pe-4 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
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

                {/* Modern Animated Wilaya Filter with Search */}
                <div className="w-full md:w-64 shrink-0">
                  <ModernSelect
                    value={wilayaFilter}
                    onChange={(val) => setWilayaFilter(val)}
                    options={[
                      {
                        value: "all",
                        label: dict.allWilayas,
                        badge: "58",
                        badgeColor: "bg-sky-50 text-sky-700 border-sky-200/60",
                      },
                      ...ALGERIA_WILAYAS.map((w) => ({
                        value: String(parseInt(w.code, 10)),
                        label: isAr ? `${w.nameAr} (${w.name})` : `${w.name} (${w.nameAr})`,
                        badge: w.code,
                      })),
                    ]}
                    icon={<MapPin className="w-3.5 h-3.5 text-sky-600" />}
                    searchable
                    searchPlaceholder={
                      isAr
                        ? "ابحث بالاسم أو الرقم (مثلاً: 16، وهران)..."
                        : "Rechercher wilaya (ex: 16, Alger)..."
                    }
                    nativeSelectTestId="affiliate-wilaya-select"
                    data-testid="affiliate-wilaya-dropdown"
                    triggerClassName="py-2 px-3 rounded-xl bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border-black/10 text-xs sm:text-sm"
                    menuClassName="min-w-[260px]"
                    align="end"
                  />
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
                {[
                  { id: "all", label: dict.tabs.all, count: totalLeads },
                  { id: "lead_generated", label: dict.tabs.newLeads, count: newLeads.length },
                  { id: "in_pipeline", label: dict.tabs.inPipeline, count: inTransitOrders.length },
                  { id: "delivered", label: dict.tabs.delivered, count: deliveredOrders.length },
                  { id: "returned_canceled", label: dict.tabs.canceledReturns, count: canceledOrders.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    data-testid={`tab-status-${tab.id}`}
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

            {/* Desktop Orders Table (>= 640px) */}
            <div className="hidden sm:block bg-white rounded-2xl border border-black/[0.08] shadow-xs overflow-hidden">
              <Table data-testid="affiliate-orders-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">{dict.colOrderRef}</TableHead>
                    <TableHead>{dict.colCustomer}</TableHead>
                    <TableHead>{dict.colDate}</TableHead>
                    <TableHead>{dict.colCourier}</TableHead>
                    <TableHead>{dict.colStatus}</TableHead>
                    <TableHead className="text-end">{dict.colCommission}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-xs text-neutral-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
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
                          data-testid="affiliate-order-row"
                          className="hover:bg-neutral-50/80 transition-colors cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          {/* Order ID */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-semibold text-neutral-800">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(order.id, order.id);
                                }}
                                data-testid="copy-order-id-btn"
                                className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded cursor-pointer"
                                title="Copier ID complet"
                              >
                                {copiedId === order.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </TableCell>

                          {/* Customer & Location */}
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-semibold text-neutral-900 tracking-tight leading-snug">
                                {order.customerName}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                                <span className="font-mono font-medium text-neutral-600" dir="ltr">
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
                                lang === "ar" ? "ar-DZ" : isEn ? "en-US" : "fr-FR",
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
                                  data-testid="copy-tracking-number-btn"
                                  className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                                  title="Copier Numéro de suivi"
                                >
                                  {copiedId === `track-${order.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400 italic">
                                {order.status === "lead_generated"
                                  ? dict.awaitingCall
                                  : dict.unassigned}
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
                                data-testid="affiliate-order-payout"
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
                                  ? dict.commissionCleared
                                  : isFailed
                                  ? dict.commissionCanceled
                                  : dict.commissionPending}
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
                            {dict.emptyTitle}
                          </p>
                          <p className="text-xs text-neutral-400 max-w-sm">
                            {dict.emptyDesc}
                          </p>
                          <Link href="/affiliate/marketplace">
                            <Button size="sm" className="mt-2">
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{dict.viewCatalog}</span>
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Orders Card List (< 640px) */}
            <div className="sm:hidden flex flex-col gap-3">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-neutral-500 bg-white rounded-2xl border border-black/[0.08]">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
                  <span>{t.common.loading}</span>
                </div>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const wilayaInfo = getWilayaByCode(String(order.wilaya).padStart(2, "0"));
                  const isDelivered = order.status === "delivered";
                  const isFailed =
                    order.status === "canceled" ||
                    order.status === "rto_in_transit" ||
                    order.status === "returned_to_supplier";

                  return (
                    <div
                      key={order.id}
                      data-testid="affiliate-order-card"
                      className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-3 cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-neutral-800">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(order.id, order.id);
                              }}
                              data-testid="copy-order-id-btn"
                              className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded cursor-pointer"
                            >
                              {copiedId === order.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <h3 className="text-sm font-semibold text-neutral-900 tracking-tight leading-snug mt-1">
                            {order.customerName}
                          </h3>
                        </div>

                        <StatusBadge status={order.status as OrderStatus} lang={lang} />
                      </div>

                      <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-neutral-50">
                        <span className="text-neutral-500 text-[11px]">
                          {dict.commissionNetteLabel}
                        </span>
                        <span
                          data-testid="affiliate-order-payout"
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

                      <div className="flex items-center justify-between text-[11px] text-neutral-600">
                        <span className="font-mono" dir="ltr">
                          {maskPhone(order.customerPhone)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-neutral-400" />
                          <span>
                            {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${order.wilaya}`}{" "}
                            ({order.commune})
                          </span>
                        </span>
                      </div>

                      {order.trackingNumber && (
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px]">
                          <span className="text-neutral-500 font-medium">
                            {order.courier || "YALIDINE"}:
                          </span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-semibold text-neutral-800">{order.trackingNumber}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(order.trackingNumber!, `track-${order.id}`);
                              }}
                              data-testid="copy-tracking-number-btn"
                              className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                            >
                              {copiedId === `track-${order.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedOrder(order)}
                        data-testid="view-order-details-btn"
                        className="w-full text-xs py-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 me-1" />
                        <span>{dict.viewDetails}</span>
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-neutral-500 bg-white rounded-2xl border border-black/[0.08]">
                  <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="font-semibold text-neutral-700">
                    {dict.emptyTitle}
                  </p>
                </div>
              )}
            </div>

            {/* ORDER DETAIL ACCESSIBLE MODAL */}
            {selectedOrder && (
              <div
                role="dialog"
                aria-modal="true"
                data-testid="affiliate-order-detail-modal"
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-3xl border border-black/[0.08] max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                    <div>
                      <span className="text-xs font-mono font-semibold text-neutral-800">
                        #{selectedOrder.id.slice(0, 8).toUpperCase()}
                      </span>
                      <h3 className="text-lg font-bold text-neutral-900 mt-0.5">
                        {dict.modal.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      data-testid="close-order-modal-btn"
                      className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Status Timeline */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-500">
                        {dict.modal.statusLabel}
                      </span>
                      <StatusBadge status={selectedOrder.status as OrderStatus} lang={lang} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-500">
                        {dict.modal.commissionLabel}
                      </span>
                      <span className="font-mono text-sm font-bold text-emerald-600">
                        {formatDZD(Number(selectedOrder.cpaCommission || 0), lang)}
                      </span>
                    </div>

                    {selectedOrder.trackingNumber && (
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                        <span className="text-xs font-semibold text-neutral-500">
                          {dict.modal.trackingLabel}
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
                      {dict.modal.customerSection}
                    </p>
                    <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">{dict.modal.name}</span>
                        <span className="font-semibold text-neutral-900">{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">{dict.modal.phone}</span>
                        <span className="font-mono font-semibold text-neutral-900" dir="ltr">
                          {maskPhone(selectedOrder.customerPhone)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">{dict.modal.destination}</span>
                        <span className="font-semibold text-neutral-900">
                          Wilaya {selectedOrder.wilaya} ({selectedOrder.commune})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">{dict.modal.address}</span>
                        <span className="text-neutral-700 text-end max-w-[240px] truncate">
                          {selectedOrder.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.cancellationReason && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                      <p className="font-semibold mb-0.5">{dict.modal.cancellationReason}</p>
                      <p>{selectedOrder.cancellationReason}</p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedOrder(null)}
                      data-testid="close-order-modal-btn"
                    >
                      {dict.modal.close}
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
