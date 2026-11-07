"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { translations, Language } from "@/lib/locales";
import {
  apiGetSupplierOrders,
  apiDispatchSupplierOrder,
  apiDispatchYalidine,
  apiSimulateCourierWebhook,
  apiRestockRtoOrder,
  SupplierOrder,
} from "@/lib/api-client";
import { getWilayaByCode, ALGERIA_WILAYAS } from "@/lib/algeria-locations";
import { WilayaDeliveryIntelBadge } from "@/components/supplier/wilaya-delivery-intel-badge";
import { OrderStatus } from "@/types";
import {
  Truck,
  CheckCircle2,
  RefreshCw,
  Copy,
  Search,
  Send,
  Phone,
  AlertCircle,
  X,
  Package,
  MessageSquare,
  Printer,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { OrderWaybillModal, WaybillOrderData } from "@/components/admin/order-waybill-modal";
import { Modal } from "@/components/ui/modal";

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [wilayaFilter, setWilayaFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Waybill and Custom Dispatch Modals
  const [selectedWaybillOrder, setSelectedWaybillOrder] = useState<WaybillOrderData | null>(null);
  const [isWaybillModalOpen, setIsWaybillModalOpen] = useState(false);
  const [customDispatchOrder, setCustomDispatchOrder] = useState<SupplierOrder | null>(null);
  const [customTrackingInput, setCustomTrackingInput] = useState("");
  const [customCourierInput, setCustomCourierInput] = useState("YALIDINE");

  const fetchOrders = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiGetSupplierOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.warn("Failed to load supplier orders:", err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleOpenWaybill = (order: Partial<SupplierOrder> & { id: string }) => {
    if (!order || !order.id) return;
    setSelectedWaybillOrder({
      id: order.id,
      customerName: order.customerName || "Client",
      customerPhone: order.customerPhone || "",
      wilaya: Number(order.wilaya || 16),
      commune: order.commune || "",
      address: order.address || "",
      productName: order.productName,
      productId: order.productId || "",
      quantity: Number(order.quantity || 1),
      trackingNumber: order.trackingNumber || null,
      courier: order.courier || "YALIDINE",
      courierLabelUrl: order.courierLabelUrl || null,
      supplierId: order.supplierId || "",
      cpaCommission: Number(order.cpaCommission || 0),
      createdAt: order.createdAt || new Date().toISOString(),
    });
    setIsWaybillModalOpen(true);
  };

  const buildWhatsAppUrl = (order: SupplierOrder, lang: Language) => {
    const cleanPhone = (order.customerPhone || "").replace(/\D/g, "").replace(/^0/, "");
    const wilayaInfo = getWilayaByCode(String(order.wilaya).padStart(2, "0"));
    const wilayaName = wilayaInfo
      ? lang === "ar"
        ? wilayaInfo.nameAr
        : wilayaInfo.name
      : `W.${order.wilaya}`;
    const tpl = translations[lang].supplier.dashboard.whatsAppMsgTemplate;
    let msg = tpl
      .replace("{name}", order.customerName || "Client")
      .replace("{product}", order.productName || "produit")
      .replace("{wilaya}", `${wilayaName} (${order.commune || ""})`);

    if (order.trackingNumber) {
      const trackingExtra =
        lang === "ar"
          ? `\nرقم التتبع الخاص بك مع ${order.courier || "Yalidine"}: ${order.trackingNumber}`
          : `\nVotre numéro de suivi ${order.courier || "Yalidine"}: ${order.trackingNumber}`;
      msg += trackingExtra;
    }
    return `https://wa.me/213${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleDispatchYalidine = async (orderId: string) => {
    setActionLoadingId(orderId);
    setErrorMessage(null);
    try {
      const existingOrder = orders.find((o) => o.id === orderId);
      const dispatched = await apiDispatchYalidine(orderId);
      setActionMessage("Bordereau officiel Yalidine API généré avec succès !");
      setTimeout(() => setActionMessage(null), 3500);
      await fetchOrders();
      if (dispatched) {
        const orderData = existingOrder || dispatched;
        handleOpenWaybill({
          ...orderData,
          id: orderData.id || orderId,
          trackingNumber: dispatched.trackingNumber || orderData.trackingNumber || null,
          courier: dispatched.courier || "YALIDINE",
          courierLabelUrl: dispatched.courierLabelUrl || null,
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de l'expédition Yalidine API.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDispatchOrder = async (
    orderId: string,
    customMsg?: string,
    dispatchOptions?: { trackingNumber?: string; courier?: string }
  ) => {
    setActionLoadingId(orderId);
    setErrorMessage(null);
    try {
      const existingOrder = orders.find((o) => o.id === orderId);
      const dispatched = await apiDispatchSupplierOrder(orderId, dispatchOptions);
      setActionMessage(customMsg || "Bordereau Yalidine généré avec succès. Colis en transit.");
      setTimeout(() => setActionMessage(null), 3500);
      await fetchOrders();
      if (dispatched && (dispatched.trackingNumber || dispatchOptions?.trackingNumber)) {
        const orderData = existingOrder || dispatched;
        if (orderData && (orderData.id || orderId)) {
          handleOpenWaybill({
            ...orderData,
            id: orderData.id || orderId,
            trackingNumber: dispatched.trackingNumber || dispatchOptions?.trackingNumber || orderData.trackingNumber || null,
            courier: dispatched.courier || dispatchOptions?.courier || orderData.courier || "YALIDINE",
            courierLabelUrl: dispatched.courierLabelUrl || orderData.courierLabelUrl || null,
          });
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de l'expédition du colis.");
    } finally {
      setActionLoadingId(null);
      setCustomDispatchOrder(null);
    }
  };

  const handleSimulateWebhook = async (
    trackingNumber: string,
    status: "Livre" | "Retour",
    customMsg?: string
  ) => {
    setActionLoadingId(trackingNumber);
    setErrorMessage(null);
    try {
      await apiSimulateCourierWebhook(trackingNumber, status);
      setActionMessage(customMsg || `Webhook de livraison simulé avec succès (${status}).`);
      setTimeout(() => setActionMessage(null), 3500);
      await fetchOrders();
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la simulation du webhook.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestockRto = async (orderId: string, condition: "INTACT" | "DAMAGED") => {
    setActionLoadingId(orderId);
    setErrorMessage(null);
    try {
      const res = await apiRestockRtoOrder(orderId, condition);
      setActionMessage(
        res.message ||
          (condition === "INTACT"
            ? "Le produit a été réintégré à votre stock avec succès."
            : "Le produit a été classé comme défectueux (perte comptabilisée).")
      );
      setTimeout(() => setActionMessage(null), 3500);
      await fetchOrders();
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la mise à jour de l'inventaire RTO.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all") {
      if (statusFilter === "rto_in_transit") {
        if (!["rto_in_transit", "returned_to_supplier", "return_requested"].includes(order.status)) {
          return false;
        }
      } else if (order.status !== statusFilter) {
        return false;
      }
    }
    if (wilayaFilter !== "all" && String(order.wilaya) !== wilayaFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = order.id.toLowerCase().includes(q);
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchPhone = order.customerPhone.includes(q);
      const matchTracking = order.trackingNumber?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone && !matchTracking) return false;
    }
    return true;
  });

  return (
    <DashboardLayout initialRole="supplier" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const isAr = lang === "ar";
        const isEn = lang === "en";
        const o = t.supplier.orders;

        return (
          <div className="space-y-6 text-start w-full max-w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 ${isAr ? "" : "font-mono uppercase tracking-wider"}`}>
                  {o.logisticsBadge}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight mt-1">
                  {t.nav.supplierOrders}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {o.subtitle}
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
                  <span>{o.refresh}</span>
                </Button>
              </div>
            </div>

            {/* In-Page Feedback Banners (Zero Native Alerts) */}
            {actionMessage && (
              <div
                role="status"
                data-testid="supplier-action-banner"
                className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionMessage}</span>
                </div>
                <button
                  onClick={() => setActionMessage(null)}
                  className="text-emerald-600 hover:text-emerald-900 p-0.5 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                data-testid="supplier-error-banner"
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-600 hover:text-rose-900 p-0.5 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    data-testid="supplier-order-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={o.searchPlaceholder}
                    className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white rounded-xl border border-neutral-200 py-2 ps-10 pe-4 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 transition-all"
                  />
                </div>

                <div className="w-full sm:w-56 shrink-0">
                  <select
                    data-testid="supplier-wilaya-select"
                    value={wilayaFilter}
                    onChange={(e) => setWilayaFilter(e.target.value)}
                    className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white rounded-xl border border-neutral-200 py-2 px-3 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 transition-all cursor-pointer"
                  >
                    <option value="all">{o.allWilayas}</option>
                    {ALGERIA_WILAYAS.map((w) => (
                      <option key={w.code} value={String(parseInt(w.code, 10))}>
                        {w.code} - {isAr ? w.nameAr : w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
                {[
                  { id: "all", label: o.tabAll },
                  { id: "supplier_confirmed", label: o.tabToDispatch },
                  { id: "dispatched", label: o.tabDispatched },
                  { id: "in_transit", label: o.tabInTransit },
                  { id: "delivered", label: o.tabDelivered },
                  { id: "rto_in_transit", label: o.tabRto },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={`supplier-status-tab-${tab.id}`}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
                      statusFilter === tab.id
                        ? "bg-purple-900 text-white shadow-xs"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Orders Table (>= 640px) */}
            <div className="hidden sm:block bg-white rounded-2xl border border-black/[0.08] shadow-xs overflow-hidden">
              <Table data-testid="supplier-orders-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>{o.colOrderRef}</TableHead>
                    <TableHead>{o.colRecipient}</TableHead>
                    <TableHead>{o.colWaybillTracking}</TableHead>
                    <TableHead>{o.colStatus}</TableHead>
                    <TableHead>{o.colCpaCost}</TableHead>
                    <TableHead className="text-end">{o.colActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-xs text-neutral-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-600" />
                        <span>{t.common.loading}</span>
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const wilayaInfo = getWilayaByCode(String(order.wilaya).padStart(2, "0"));
                      const isReadyToDispatch = order.status === "supplier_confirmed";
                      const isDispatched =
                        order.status === "dispatched" || order.status === "in_transit";
                      const isDelivered = order.status === "delivered";
                      const totalCpa =
                        Number(order.cpaCommission || 0) + Number(order.platformFee || 0);

                      return (
                        <TableRow
                          key={order.id}
                          data-testid="supplier-orders-row"
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
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono mt-0.5">
                                <span dir="ltr">{order.customerPhone}</span>
                                <a
                                  href={buildWhatsAppUrl(order, lang)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors inline-flex items-center gap-0.5"
                                  title="WhatsApp"
                                  aria-label="WhatsApp"
                                  data-testid="whatsapp-order-btn"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1.5 flex-wrap">
                                  <span>
                                    {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${order.wilaya}`}{" "}
                                    ({order.commune})
                                  </span>
                                  <WilayaDeliveryIntelBadge
                                    wilaya={order.wilaya}
                                    lang={lang}
                                    testId={`order-wilaya-intel-${order.id}`}
                                  />
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {order.trackingNumber ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
                                  {order.courier || "YALIDINE"}
                                </span>
                                <span className="font-mono text-xs font-medium text-neutral-800" dir="ltr">
                                  {order.trackingNumber}
                                </span>
                                <button
                                  type="button"
                                  data-testid="copy-tracking-btn"
                                  onClick={() => handleCopy(order.trackingNumber!, order.id)}
                                  className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded transition-colors"
                                  title={o.copyTrackingTitle}
                                >
                                  {copiedId === order.id ? (
                                    <span className="inline-flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.2 rounded">
                                      ✓
                                    </span>
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400 italic">
                                {isReadyToDispatch ? o.waitingWaybill : "-"}
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            <StatusBadge status={order.status as OrderStatus} lang={lang} />
                          </TableCell>

                          <TableCell className="font-mono text-xs font-bold text-neutral-800">
                            {formatDZD(totalCpa, lang)}
                          </TableCell>

                          <TableCell className="text-end">
                            {isReadyToDispatch ? (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <Button
                                  size="sm"
                                  data-testid="dispatch-yalidine-btn"
                                  disabled={actionLoadingId === order.id}
                                  onClick={() => handleDispatchYalidine(order.id)}
                                  className="text-xs px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white gap-1 shadow-xs"
                                  title={isAr ? "إنشاء بوليصة شحن عبر واجهة ياليدين" : "Expédier via Yalidine API"}
                                >
                                  {actionLoadingId === order.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Truck className="w-3 h-3" />
                                  )}
                                  <span>{isAr ? "شحن Yalidine API" : "Yalidine API"}</span>
                                </Button>
                                <Button
                                  size="sm"
                                  data-testid="dispatch-order-btn"
                                  disabled={actionLoadingId === order.id}
                                  onClick={() => handleDispatchOrder(order.id, o.msgDispatched)}
                                  className="text-xs px-2.5 py-1 bg-slate-900 hover:bg-neutral-800 text-white gap-1"
                                >
                                  {actionLoadingId === order.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Send className="w-3 h-3" />
                                  )}
                                  <span>{o.waybillYalidine}</span>
                                </Button>
                                <button
                                  type="button"
                                  data-testid="open-custom-dispatch-modal-btn"
                                  onClick={() => {
                                    setCustomDispatchOrder(order);
                                    setCustomTrackingInput(order.trackingNumber || "");
                                    setCustomCourierInput(order.courier || "YALIDINE");
                                  }}
                                  className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                                  title={isAr ? "إدخال رقم تتبع مخصص" : "Saisir un numéro de suivi personnalisé"}
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : isDispatched && order.trackingNumber ? (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {order.courierLabelUrl && (
                                  <a
                                    href={order.courierLabelUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    data-testid="official-courier-pdf-link"
                                    className="p-1 px-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
                                    title="Télécharger l'étiquette officielle Yalidine (PDF)"
                                  >
                                    <Printer className="w-3 h-3" />
                                    <span>PDF</span>
                                  </a>
                                )}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  data-testid="view-waybill-btn"
                                  onClick={() => handleOpenWaybill(order)}
                                  className="text-[11px] px-2 py-1 gap-1 text-neutral-700 hover:text-neutral-900 border-neutral-300"
                                  title={isAr ? "معاينة بوليصة الشحن" : "Voir le bordereau"}
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>{isAr ? "البوليصة" : "Bordereau"}</span>
                                </Button>
                                <Button
                                  size="sm"
                                  data-testid="simulate-delivery-btn"
                                  disabled={actionLoadingId === order.trackingNumber}
                                  onClick={() =>
                                    handleSimulateWebhook(
                                      order.trackingNumber!,
                                      "Livre",
                                      o.msgWebhookDelivered.replace("{status}", "Livre")
                                    )
                                  }
                                  className="text-[11px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{o.simulateDelivered}</span>
                                </Button>
                                <Button
                                  size="sm"
                                  data-testid="simulate-return-btn"
                                  disabled={actionLoadingId === order.trackingNumber}
                                  onClick={() =>
                                    handleSimulateWebhook(
                                      order.trackingNumber!,
                                      "Retour",
                                      isAr
                                        ? "تمت محاكاة إرجاع الطرد (Retour RTO) بنجاح."
                                        : "Simulation de retour (RTO) enregistrée avec succès."
                                    )
                                  }
                                  className="text-[11px] px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white gap-1"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>{isAr ? "محاكاة الإرجاع (RTO)" : "Simuler Retour"}</span>
                                </Button>
                              </div>
                            ) : isDelivered ? (
                              <div className="flex items-center justify-end gap-1.5">
                                {order.courierLabelUrl && (
                                  <a
                                    href={order.courierLabelUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    data-testid="official-courier-pdf-link"
                                    className="p-1 px-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
                                    title="Télécharger l'étiquette officielle Yalidine (PDF)"
                                  >
                                    <Printer className="w-3 h-3" />
                                    <span>PDF</span>
                                  </a>
                                )}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  data-testid="view-waybill-btn"
                                  onClick={() => handleOpenWaybill(order)}
                                  className="text-[11px] px-2 py-1 gap-1 text-neutral-700 hover:text-neutral-900 border-neutral-300"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>{isAr ? "البوليصة" : isEn ? "Waybill" : "Bordereau"}</span>
                                </Button>
                                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  {o.deliveredSettled}
                                </span>
                              </div>
                            ) : ["returned_to_supplier", "rto_in_transit", "return_requested"].includes(order.status) ? (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {order.restockStatus === "RESTOCKED" ? (
                                  <span
                                    data-testid={`restock-badge-restocked-${order.id}`}
                                    className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{isAr ? "تمت إعادة للمخزون" : isEn ? "Stock Restocked" : "Stock Réintégré"}</span>
                                  </span>
                                ) : order.restockStatus === "DAMAGED" ? (
                                  <span
                                    data-testid={`restock-badge-damaged-${order.id}`}
                                    className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                                  >
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{isAr ? "منتج تالف (خسارة)" : isEn ? "Damaged / Loss" : "Défectueux / Perte"}</span>
                                  </span>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      data-testid="rto-restock-btn"
                                      disabled={actionLoadingId === order.id}
                                      onClick={() => handleRestockRto(order.id, "INTACT")}
                                      className="text-[11px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs cursor-pointer"
                                      title={isAr ? "إعادة المنتج الصالح إلى المخزون (+1)" : isEn ? "Restock item to available inventory (+1)" : "Réintégrer au stock disponible (+1)"}
                                    >
                                      {actionLoadingId === order.id ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Package className="w-3 h-3" />
                                      )}
                                      <span>{isAr ? "إعادة للمخزون" : isEn ? "Restock" : "Réintégrer Stock"}</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      data-testid="rto-damage-btn"
                                      disabled={actionLoadingId === order.id}
                                      onClick={() => handleRestockRto(order.id, "DAMAGED")}
                                      className="text-[11px] px-2 py-1 text-rose-700 hover:bg-rose-50 border-rose-200 gap-1 cursor-pointer"
                                      title={isAr ? "شطب المنتج كقطعة تالفة" : isEn ? "Mark item as damaged" : "Classer comme produit défectueux"}
                                    >
                                      <AlertCircle className="w-3 h-3 text-rose-600" />
                                      <span>{isAr ? "تالف" : isEn ? "Damaged" : "Défectueux"}</span>
                                    </Button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-xs text-neutral-400">
                        {o.emptyOrders}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View (< 640px) */}
            <div className="sm:hidden flex flex-col gap-3">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-neutral-500 bg-white rounded-2xl border border-black/[0.08]">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-600" />
                  <span>{t.common.loading}</span>
                </div>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const wilayaInfo = getWilayaByCode(String(order.wilaya).padStart(2, "0"));
                  const isReadyToDispatch = order.status === "supplier_confirmed";
                  const isDispatched =
                    order.status === "dispatched" || order.status === "in_transit";
                  const isDelivered = order.status === "delivered";
                  const totalCpa =
                    Number(order.cpaCommission || 0) + Number(order.platformFee || 0);

                  return (
                    <div
                      key={order.id}
                      data-testid="supplier-orders-card"
                      className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-purple-700">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <h4 className="font-semibold text-xs text-neutral-900 mt-0.5">
                            {order.customerName}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono text-neutral-500 block" dir="ltr">
                              {order.customerPhone}
                            </span>
                            <a
                              href={buildWhatsAppUrl(order, lang)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors inline-flex items-center"
                              title="WhatsApp"
                              aria-label="WhatsApp"
                              data-testid="whatsapp-order-btn-mobile"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                        <StatusBadge status={order.status as OrderStatus} lang={lang} />
                      </div>

                      <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-neutral-50 gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="text-[11px] text-neutral-600 font-medium truncate">
                            {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${order.wilaya}`}{" "}
                            ({order.commune})
                          </span>
                          <WilayaDeliveryIntelBadge
                            wilaya={order.wilaya}
                            lang={lang}
                            testId={`mobile-order-wilaya-intel-${order.id}`}
                          />
                        </div>
                        <span className="font-mono font-bold text-xs text-neutral-900 shrink-0">
                          {formatDZD(totalCpa, lang)}
                        </span>
                      </div>

                      {order.trackingNumber ? (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/60 border border-purple-100 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="font-mono font-bold text-purple-900 text-[11px]" dir="ltr">
                              {order.trackingNumber}
                            </span>
                          </div>
                          <button
                            type="button"
                            data-testid="copy-tracking-btn-mobile"
                            onClick={() => handleCopy(order.trackingNumber!, order.id)}
                            className="text-purple-700 hover:text-purple-900 font-medium text-[11px] px-2 py-0.5 rounded bg-white shadow-2xs"
                          >
                            {copiedId === order.id ? (
                              <span className="text-emerald-600 font-bold">✓</span>
                            ) : (
                              <span>{o.copy}</span>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-neutral-400 italic px-1">
                          {isReadyToDispatch ? o.waitingWaybill : "-"}
                        </div>
                      )}

                      {/* Mobile Actions */}
                      <div className="pt-1 flex flex-col gap-1.5">
                        {isReadyToDispatch ? (
                          <div className="flex items-center gap-1.5 w-full flex-wrap">
                            <Button
                              size="sm"
                              data-testid="dispatch-yalidine-btn-mobile"
                              disabled={actionLoadingId === order.id}
                              onClick={() => handleDispatchYalidine(order.id)}
                              className="flex-1 text-xs py-1.5 bg-purple-700 hover:bg-purple-800 text-white gap-1 justify-center shadow-xs"
                            >
                              {actionLoadingId === order.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Truck className="w-3.5 h-3.5" />
                              )}
                              <span>Yalidine API</span>
                            </Button>
                            <Button
                              size="sm"
                              data-testid="dispatch-order-btn-mobile"
                              disabled={actionLoadingId === order.id}
                              onClick={() => handleDispatchOrder(order.id, o.msgDispatched)}
                              className="flex-1 text-xs py-1.5 bg-slate-900 hover:bg-neutral-800 text-white gap-1 justify-center"
                            >
                              {actionLoadingId === order.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>{o.waybillYalidine}</span>
                            </Button>
                            <button
                              type="button"
                              data-testid="open-custom-dispatch-modal-btn-mobile"
                              onClick={() => {
                                setCustomDispatchOrder(order);
                                setCustomTrackingInput(order.trackingNumber || "");
                                setCustomCourierInput(order.courier || "YALIDINE");
                              }}
                              className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors shrink-0 cursor-pointer"
                              title={isAr ? "إدخال رقم تتبع مخصص" : "Saisir un numéro de suivi personnalisé"}
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isDispatched && order.trackingNumber ? (
                          <div className="flex flex-col gap-1.5 w-full">
                            <div className="flex items-center gap-1.5 w-full">
                              <Button
                                size="sm"
                                variant="secondary"
                                data-testid="view-waybill-btn-mobile"
                                onClick={() => handleOpenWaybill(order)}
                                className="flex-1 text-xs py-1.5 gap-1 text-neutral-700 hover:text-neutral-900 border-neutral-300 justify-center"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>{isAr ? "البوليصة" : isEn ? "Waybill" : "Bordereau"}</span>
                              </Button>
                            </div>
                            <div className="flex items-center gap-1.5 w-full">
                              <Button
                                size="sm"
                                data-testid="simulate-delivery-btn-mobile"
                                disabled={actionLoadingId === order.trackingNumber}
                                onClick={() =>
                                  handleSimulateWebhook(
                                    order.trackingNumber!,
                                    "Livre",
                                    o.msgWebhookDelivered.replace("{status}", "Livre")
                                  )
                                }
                                className="flex-1 text-xs py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 justify-center"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{o.simulateDeliveredMobile}</span>
                              </Button>
                              <Button
                                size="sm"
                                data-testid="simulate-return-btn-mobile"
                                disabled={actionLoadingId === order.trackingNumber}
                                onClick={() =>
                                  handleSimulateWebhook(
                                    order.trackingNumber!,
                                    "Retour",
                                    isAr
                                      ? "تمت محاكاة إرجاع الطرد (Retour RTO) بنجاح."
                                      : isEn
                                      ? "RTO return simulated successfully."
                                      : "Simulation de retour (RTO) enregistrée avec succès."
                                  )
                                }
                                className="flex-1 text-xs py-1.5 bg-rose-600 hover:bg-rose-700 text-white gap-1 justify-center"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{isAr ? "إرجاع" : isEn ? "Return" : "Retour"}</span>
                              </Button>
                            </div>
                          </div>
                        ) : isDelivered ? (
                          <div className="flex items-center gap-2 w-full">
                            <Button
                              size="sm"
                              variant="secondary"
                              data-testid="view-waybill-btn-mobile"
                              onClick={() => handleOpenWaybill(order)}
                              className="text-xs py-1 px-2.5 gap-1 text-neutral-700 hover:text-neutral-900 border-neutral-300"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>{isAr ? "البوليصة" : isEn ? "Waybill" : "Bordereau"}</span>
                            </Button>
                            <span className="flex-1 text-center text-[11px] font-semibold text-emerald-600 bg-emerald-50 py-1 rounded-xl border border-emerald-200">
                              {o.deliveredSettled}
                            </span>
                          </div>
                        ) : ["returned_to_supplier", "rto_in_transit", "return_requested"].includes(order.status) ? (
                          <div className="flex flex-col gap-1.5 w-full pt-1">
                            {order.restockStatus === "RESTOCKED" ? (
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-center flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isAr ? "تمت إعادة للمخزون" : isEn ? "Stock Restocked" : "Stock Réintégré"}</span>
                              </span>
                            ) : order.restockStatus === "DAMAGED" ? (
                              <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl text-center flex items-center justify-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{isAr ? "منتج تالف (خسارة)" : isEn ? "Damaged / Loss" : "Défectueux / Perte"}</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 w-full">
                                <Button
                                  size="sm"
                                  data-testid="rto-restock-btn-mobile"
                                  disabled={actionLoadingId === order.id}
                                  onClick={() => handleRestockRto(order.id, "INTACT")}
                                  className="flex-1 text-xs py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 justify-center shadow-xs cursor-pointer"
                                >
                                  {actionLoadingId === order.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Package className="w-3 h-3" />
                                  )}
                                  <span>{isAr ? "إعادة للمخزون" : isEn ? "Restock" : "Réintégrer Stock"}</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  data-testid="rto-damage-btn-mobile"
                                  disabled={actionLoadingId === order.id}
                                  onClick={() => handleRestockRto(order.id, "DAMAGED")}
                                  className="text-xs py-1.5 text-rose-700 border-rose-200 hover:bg-rose-50 gap-1 px-3 cursor-pointer"
                                >
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  <span>{isAr ? "تالف" : isEn ? "Damaged" : "Défectueux"}</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-black/[0.08]">
                  {o.emptyOrders}
                </div>
              )}
            </div>

            {/* Custom Dispatch Modal */}
            {customDispatchOrder && (
              <Modal
                isOpen={!!customDispatchOrder}
                onClose={() => setCustomDispatchOrder(null)}
                title={isAr ? "شحن الطرد مع رقم تتبع مخصص" : isEn ? "Dispatch with Tracking Number" : "Expédier avec numéro de suivi"}
                description={
                  isAr
                    ? `الطلب #${customDispatchOrder.id.slice(0, 8)} - ${customDispatchOrder.customerName}`
                    : `Order #${customDispatchOrder.id.slice(0, 8)} - ${customDispatchOrder.customerName}`
                }
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!customDispatchOrder) return;
                    handleDispatchOrder(customDispatchOrder.id, o.msgDispatched, {
                      trackingNumber: customTrackingInput.trim() || undefined,
                      courier: customCourierInput || "YALIDINE",
                    });
                  }}
                  className="space-y-4 pt-2"
                >
                  <div className="space-y-1.5 text-start">
                    <label className="text-xs font-semibold text-neutral-700 block">
                      {isAr ? "شركة التوصيل" : isEn ? "Carrier / Courier" : "Transporteur"}
                    </label>
                    <select
                      value={customCourierInput}
                      onChange={(e) => setCustomCourierInput(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="YALIDINE">Yalidine Express</option>
                      <option value="ZR_EXPRESS">ZR Express</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-start">
                    <label className="text-xs font-semibold text-neutral-700 block">
                      {isAr ? "رقم التتبع (Tracking Number)" : isEn ? "Tracking Number" : "Numéro de suivi (Tracking Number)"}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        isAr
                          ? "مثال: yal-12345678 (فارغ للتوليد التلقائي)"
                          : isEn
                          ? "E.g. yal-12345678 (leave empty for auto)"
                          : "Ex: yal-12345678 (laisser vide pour auto)"
                      }
                      value={customTrackingInput}
                      onChange={(e) => setCustomTrackingInput(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      dir="ltr"
                    />
                    <p className="text-[11px] text-neutral-500">
                      {isAr
                        ? "إذا تركته فارغاً، سيتم توليد رقم تتبع تلقائي تجريبي من قبل النظام."
                        : isEn
                        ? "If left blank, an official tracking number will be generated automatically."
                        : "Si laissé vide, un numéro de suivi officiel sera généré automatiquement."}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setCustomDispatchOrder(null)}
                    >
                      {t.common.cancel || "Annuler"}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={actionLoadingId === customDispatchOrder.id}
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                    >
                      {actionLoadingId === customDispatchOrder.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{isAr ? "تأكيد الشحن وتوليد البوليصة" : isEn ? "Confirm & Dispatch" : "Confirmer et expédier"}</span>
                    </Button>
                  </div>
                </form>
              </Modal>
            )}

            {/* Waybill Modal */}
            <OrderWaybillModal
              order={selectedWaybillOrder}
              isOpen={isWaybillModalOpen}
              onClose={() => setIsWaybillModalOpen(false)}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
