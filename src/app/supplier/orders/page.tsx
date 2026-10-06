"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { translations, Language } from "@/lib/locales";
import {
  apiGetSupplierOrders,
  apiDispatchSupplierOrder,
  apiSimulateCourierWebhook,
  SupplierOrder,
} from "@/lib/api-client";
import { getWilayaByCode, ALGERIA_WILAYAS } from "@/lib/algeria-locations";
import { OrderStatus } from "@/types";
import {
  Truck,
  CheckCircle2,
  XCircle,
  Package,
  RefreshCw,
  Copy,
  Printer,
  Search,
  Filter,
  Send,
  MapPin,
  ExternalLink,
  Phone,
} from "lucide-react";

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [wilayaFilter, setWilayaFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await apiGetSupplierOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to load supplier orders:", err);
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

  const handleDispatchOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await apiDispatchSupplierOrder(orderId);
      await fetchOrders();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'expédition");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSimulateWebhook = async (trackingNumber: string, status: "Livre" | "Retour") => {
    setActionLoadingId(trackingNumber);
    try {
      await apiSimulateCourierWebhook(trackingNumber, status);
      await fetchOrders();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la simulation du webhook");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
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

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-purple-700 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {isAr ? "الخدمات اللوجستية والشحن" : "Logistique & Expéditions"}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1">
                  {t.nav.supplierOrders}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  {isAr
                    ? "إصدار بوالص الشحن لشركات التوصيل (Yalidine و ZR Express) وتتبع الطرود المسلمة"
                    : "Édition des bordereaux de transport Yalidine / ZR Express et suivi des colis"}
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
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isAr
                        ? "بحث برقم الطلب، العميل، الهاتف، أو رقم التتبع..."
                        : "Rechercher par N° commande, client, téléphone ou tracking..."
                    }
                    className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white rounded-xl border border-neutral-200 py-2 ps-10 pe-4 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 transition-all"
                  />
                </div>

                <div className="w-full sm:w-56 shrink-0">
                  <select
                    value={wilayaFilter}
                    onChange={(e) => setWilayaFilter(e.target.value)}
                    className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white rounded-xl border border-neutral-200 py-2 px-3 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 transition-all cursor-pointer"
                  >
                    <option value="all">{isAr ? "جميع الولايات (58)" : "Toutes les wilayas (58)"}</option>
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
                  { id: "all", label: isAr ? "الكل" : "Tous" },
                  { id: "supplier_confirmed", label: isAr ? "مؤكد للارسال" : "À Expédier" },
                  { id: "dispatched", label: isAr ? "تم تسليم الطرد" : "Bordereau Généré" },
                  { id: "in_transit", label: isAr ? "قيد النقل" : "En Transit" },
                  { id: "delivered", label: isAr ? "تم التسليم" : "Livrés" },
                  { id: "rto_in_transit", label: isAr ? "مرتجع" : "Retours RTO" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
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

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "رقم الطلب" : "Réf. Commande"}</TableHead>
                    <TableHead>{isAr ? "الزبون والوجهة" : "Destinataire"}</TableHead>
                    <TableHead>{isAr ? "بوليصة الشحن" : "Bordereau / Tracking"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Statut"}</TableHead>
                    <TableHead>{isAr ? "تكلفة CPA" : "Coût CPA"}</TableHead>
                    <TableHead className="text-end">{isAr ? "إجراءات الشحن" : "Actions"}</TableHead>
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
                        <TableRow key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-purple-700">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-neutral-900">
                                {order.customerName}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                                <span className="font-mono">{order.customerPhone}</span>
                                <span>•</span>
                                <span>
                                  {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${order.wilaya}`}
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
                                <span className="font-mono text-xs font-medium text-neutral-800">
                                  {order.trackingNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(order.trackingNumber!, order.id)}
                                  className="text-neutral-400 hover:text-neutral-700 p-0.5"
                                >
                                  {copiedId === order.id ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400 italic">
                                {isReadyToDispatch ? "En attente de bordereau" : "-"}
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
                              <Button
                                size="sm"
                                disabled={actionLoadingId === order.id}
                                onClick={() => handleDispatchOrder(order.id)}
                                className="text-xs px-3 py-1 bg-slate-900 hover:bg-neutral-800 text-white gap-1"
                              >
                                {actionLoadingId === order.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                <span>{isAr ? "إنشاء بوليصة" : "Bordereau Yalidine"}</span>
                              </Button>
                            ) : isDispatched && order.trackingNumber ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  disabled={actionLoadingId === order.trackingNumber}
                                  onClick={() =>
                                    handleSimulateWebhook(order.trackingNumber!, "Livre")
                                  }
                                  className="text-[11px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{isAr ? "محاكاة تسليم" : "Simuler Livré"}</span>
                                </Button>
                              </div>
                            ) : isDelivered ? (
                              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                {isAr ? "تم التحصيل والخصم" : "Livré & Soldé"}
                              </span>
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
                        {isAr ? "لا توجد شحنات مطابقة" : "Aucun colis trouvé."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
