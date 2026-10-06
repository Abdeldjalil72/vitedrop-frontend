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
  apiGetSupplierLeads,
  apiGetSupplierOrders,
  apiConfirmSupplierLead,
  apiCancelSupplierLead,
  apiDispatchSupplierOrder,
  apiSimulateCourierWebhook,
  apiGetMyWallet,
  SupplierOrder,
} from "@/lib/api-client";
import { getWilayaByCode, ALGERIA_WILAYAS } from "@/lib/algeria-locations";
import { OrderStatus } from "@/types";
import {
  Headphones,
  CheckCircle2,
  XCircle,
  Truck,
  Wallet,
  AlertCircle,
  Phone,
  Package,
  RefreshCw,
  Copy,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  X,
  Send,
  Building2,
  MapPin,
  Flame,
} from "lucide-react";
import Link from "next/link";

export default function SupplierDashboardPage() {
  const [activeTab, setActiveTab] = useState<"queue" | "confirmed" | "all">("queue");
  const [leads, setLeads] = useState<SupplierOrder[]>([]);
  const [allOrders, setAllOrders] = useState<SupplierOrder[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Cancellation Modal state
  const [cancelModalOrder, setCancelModalOrder] = useState<SupplierOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("Client injoignable après 3 tentatives d'appel");
  const [customReason, setCustomReason] = useState("");

  // Top-up simulation modal
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  // Copied state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load supplier data from backend
  const loadSupplierData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, ordersRes, walletRes] = await Promise.allSettled([
        apiGetSupplierLeads(),
        apiGetSupplierOrders(),
        apiGetMyWallet(),
      ]);

      if (leadsRes.status === "fulfilled" && Array.isArray(leadsRes.value)) {
        setLeads(leadsRes.value);
      }
      if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value)) {
        setAllOrders(ordersRes.value);
      }
      if (walletRes.status === "fulfilled" && walletRes.value) {
        setWalletBalance(Number(walletRes.value.balance || 0));
      }
    } catch (err) {
      console.warn("Error loading supplier data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Confirm Lead
  const handleConfirmLead = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await apiConfirmSupplierLead(orderId);
      await loadSupplierData();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la confirmation du lead");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Cancel Lead
  const handleCancelLeadSubmit = async () => {
    if (!cancelModalOrder) return;
    const finalReason = cancelReason === "Autre" ? customReason.trim() : cancelReason;
    if (!finalReason) {
      alert("Veuillez préciser la raison d'annulation");
      return;
    }

    setActionLoadingId(cancelModalOrder.id);
    try {
      await apiCancelSupplierLead(cancelModalOrder.id, finalReason);
      setCancelModalOrder(null);
      setCustomReason("");
      await loadSupplierData();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'annulation du lead");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Dispatch Order
  const handleDispatchOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await apiDispatchSupplierOrder(orderId);
      await loadSupplierData();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la création du bordereau d'expédition");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Simulate Courier Webhook (Yalidine delivery / return)
  const handleSimulateWebhook = async (trackingNumber: string, status: "Livre" | "Retour") => {
    setActionLoadingId(trackingNumber);
    try {
      await apiSimulateCourierWebhook(trackingNumber, status);
      await loadSupplierData();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la simulation du webhook transporteur");
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmedOrders = allOrders.filter((o) => o.status === "supplier_confirmed");
  const inTransitOrders = allOrders.filter(
    (o) => o.status === "dispatched" || o.status === "in_transit"
  );
  const deliveredOrders = allOrders.filter((o) => o.status === "delivered");

  return (
    <DashboardLayout initialRole="supplier" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const isAr = lang === "ar";

        const currentBalance = walletBalance !== null ? walletBalance : 8000;
        const isLowBalance = currentBalance < 3000;

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-purple-700 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {isAr ? "مركز اتصالات وتأكيد الطلبات" : "Fournisseur Hub • Call Center Desk"}
                  </span>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {leads.length} {isAr ? "طلبات بانتظار الاتصال" : "leads en attente d'appel"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1">
                  {isAr ? "إدارة الطلبات والشحن" : "File d'attente & Confirmation"}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  {isAr
                    ? "تأكيد الطلبات هاتفياً مع الزبائن، إنشاء بوالص الشحن لـ Yalidine، ومتابعة التحصيل"
                    : "Confirmez les commandes par téléphone, générez les bordereaux Yalidine et suivez les livraisons"}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadSupplierData}
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
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{isAr ? "شحن رصيد الضمان" : "Recharger le Solde Escrow"}</span>
                </Button>
              </div>
            </div>

            {/* Prepaid Escrow & Ledger Health Banner */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
                isLowBalance
                  ? "bg-amber-50/80 border-amber-200 text-amber-950"
                  : "bg-purple-50/70 border-purple-200/80 text-purple-950"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isLowBalance ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base">
                      {isAr ? "نظام الضمان المالي المسبق (Escrow Ledger)" : "Modèle Escrow Prépayé ViteDrop"}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                        isLowBalance
                          ? "bg-amber-200/80 text-amber-900"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isLowBalance
                        ? isAr
                          ? "رصيد منخفض"
                          : "Solde Bas"
                        : isAr
                        ? "جاهز للتشغيل"
                        : "Opérationnel"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
                    {isAr
                      ? "رصيدك الحالي يضمن تغطية عمولات CPA للمسوقين بعد نجاح التسليم الفعلي فقط. في حال إلغاء الطلب أو إرجاعه (RTO)، لا يتم خصم أي عمولة منصة أو مسوق."
                      : "Votre solde garantit les commissions CPA des affiliés. Le débit intervient uniquement au moment de la livraison confirmée par le transporteur. 0 DZD débité en cas de retour."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xs p-3 px-4 rounded-xl border border-black/5 shrink-0 self-stretch md:self-auto justify-between md:justify-start">
                <div>
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                    {isAr ? "الرصيد المتاح" : "Solde Actuel"}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-purple-700">
                    {formatDZD(currentBalance, lang)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="text-xs"
                >
                  {isAr ? "تفاصيل" : "Détails"}
                </Button>
              </div>
            </div>

            {/* Workflow Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-200/80 pb-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === "queue"
                    ? "bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white shadow-md shadow-sky-500/20"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60"
                }`}
              >
                <Headphones className="w-4 h-4 text-sky-400" />
                <span>{isAr ? "طلبات بانتظار الاتصال" : "File d'appel Call Center"}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    activeTab === "queue" ? "bg-white/20 text-white" : "bg-sky-100 text-sky-800"
                  }`}
                >
                  {leads.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("confirmed")}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === "confirmed"
                    ? "bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white shadow-md shadow-sky-500/20"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60"
                }`}
              >
                <Truck className="w-4 h-4 text-purple-400" />
                <span>{isAr ? "بانتظار بوليصة الشحن" : "À Expédier (Bordereaux)"}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    activeTab === "confirmed"
                      ? "bg-white/20 text-white"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {confirmedOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === "all"
                    ? "bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white shadow-md shadow-sky-500/20"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60"
                }`}
              >
                <Package className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? "جميع الطلبات والتتبع" : "Toutes les Commandes"}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    activeTab === "all"
                      ? "bg-white/20 text-white"
                      : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {allOrders.length}
                </span>
              </button>
            </div>

            {/* TAB 1: CALL CENTER QUEUE */}
            {activeTab === "queue" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-indigo-600" />
                    <span>
                      {isAr ? "قائمة الاتصال والتأكيد المباشر" : "File d'attente des leads à contacter"}
                    </span>
                  </h3>
                  <span className="text-xs text-neutral-500">
                    {leads.length} {isAr ? "طلب يتطلب اتصالاً" : "prospects en attente"}
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isAr ? "رقم الطلب" : "Réf. Lead"}</TableHead>
                        <TableHead>{isAr ? "بيانات الزبون" : "Client & Téléphone"}</TableHead>
                        <TableHead>{isAr ? "العنوان والولاية" : "Destination & Adresse"}</TableHead>
                        <TableHead>{isAr ? "الكمية والمبلغ" : "Quantité & Total"}</TableHead>
                        <TableHead>{isAr ? "الحالة" : "Statut"}</TableHead>
                        <TableHead className="text-end">{isAr ? "إجراءات التأكيد" : "Actions Call Center"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-xs text-neutral-500">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                            <span>{t.common.loading}</span>
                          </TableCell>
                        </TableRow>
                      ) : leads.length > 0 ? (
                        leads.map((lead) => {
                          const wilayaInfo = getWilayaByCode(String(lead.wilaya).padStart(2, "0"));
                          const isProcessing = actionLoadingId === lead.id;

                          return (
                            <TableRow key={lead.id} className="hover:bg-neutral-50/80 transition-colors">
                              {/* Order ID */}
                              <TableCell className="font-mono text-xs font-bold text-indigo-700">
                                #{lead.id.slice(0, 8).toUpperCase()}
                              </TableCell>

                              {/* Customer */}
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-neutral-900">
                                    {lead.customerName}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <a
                                      href={`tel:${lead.customerPhone}`}
                                      className="font-mono text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                                      dir="ltr"
                                    >
                                      <Phone className="w-3 h-3 text-emerald-600" />
                                      <span>{lead.customerPhone}</span>
                                    </a>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Address */}
                              <TableCell>
                                <div className="flex flex-col text-xs max-w-xs">
                                  <span className="font-semibold text-neutral-800 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-neutral-400" />
                                    <span>
                                      {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${lead.wilaya}`} (
                                      {lead.commune})
                                    </span>
                                  </span>
                                  <span className="text-[11px] text-neutral-500 truncate" title={lead.address}>
                                    {lead.address}
                                  </span>
                                </div>
                              </TableCell>

                              {/* Quantity & Payout */}
                              <TableCell className="text-xs">
                                <span className="font-semibold text-neutral-900">
                                  {lead.quantity}x {isAr ? "قطعة" : "pièce(s)"}
                                </span>
                                <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                                  CPA: {formatDZD(Number(lead.cpaCommission) + Number(lead.platformFee), lang)}
                                </div>
                              </TableCell>

                              {/* Status */}
                              <TableCell>
                                <StatusBadge status={lead.status as OrderStatus} lang={lang} />
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="text-end">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    disabled={isProcessing}
                                    onClick={() => setCancelModalOrder(lead)}
                                    className="text-[11px] px-2.5 py-1 gap-1"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>{isAr ? "إلغاء" : "Annuler"}</span>
                                  </Button>

                                  <Button
                                    size="sm"
                                    disabled={isProcessing}
                                    onClick={() => handleConfirmLead(lead.id)}
                                    className="text-[11px] px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-1 shadow-sm"
                                  >
                                    {isProcessing ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    )}
                                    <span>{isAr ? "تأكيد الطلب" : "Confirmer"}</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-xs text-neutral-400">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <p className="font-semibold text-neutral-800">
                              {isAr ? "قائمة الاتصال فارغة حالياً" : "Aucun lead en attente d'appel"}
                            </p>
                            <p className="text-neutral-500 mt-0.5">
                              {isAr
                                ? "تم تأكيد جميع الطلبات الواردة من المسوقين بنجاح."
                                : "Toutes les commandes ont été traitées par votre équipe call center."}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* TAB 2: CONFIRMED ORDERS WAITING FOR DISPATCH */}
            {activeTab === "confirmed" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-purple-600" />
                      <span>{isAr ? "الطلبات المؤكدة الجاهزة للشحن" : "Commandes confirmées à expédier"}</span>
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {isAr
                        ? "أنشئ بوالص الشحن واربطها مباشرة مع Yalidine و ZR Express"
                        : "Générez les bordereaux de livraison et confiez les colis au transporteur"}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    {confirmedOrders.length} {isAr ? "جاهزة" : "prêtes"}
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isAr ? "رقم الطلب" : "Réf. Commande"}</TableHead>
                        <TableHead>{isAr ? "العميل" : "Client"}</TableHead>
                        <TableHead>{isAr ? "الوجهة" : "Destination"}</TableHead>
                        <TableHead>{isAr ? "العنوان الكامل" : "Adresse"}</TableHead>
                        <TableHead>{isAr ? "الحالة" : "Statut"}</TableHead>
                        <TableHead className="text-end">{isAr ? "الإجراء" : "Action"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {confirmedOrders.length > 0 ? (
                        confirmedOrders.map((order) => {
                          const wilayaInfo = getWilayaByCode(String(order.wilaya).padStart(2, "0"));
                          const isProcessing = actionLoadingId === order.id;

                          return (
                            <TableRow key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                              <TableCell className="font-mono text-xs font-bold text-purple-700">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </TableCell>
                              <TableCell>
                                <span className="text-xs font-bold text-neutral-900 block">
                                  {order.customerName}
                                </span>
                                <span className="text-[11px] font-mono text-neutral-500">
                                  {order.customerPhone}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs font-semibold text-neutral-800">
                                {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${order.wilaya}`} (
                                {order.commune})
                              </TableCell>
                              <TableCell className="text-xs text-neutral-600 max-w-xs truncate">
                                {order.address}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={order.status as OrderStatus} lang={lang} />
                              </TableCell>
                              <TableCell className="text-end">
                                <Button
                                  size="sm"
                                  disabled={isProcessing}
                                  onClick={() => handleDispatchOrder(order.id)}
                                  className="text-xs px-3.5 py-1.5 bg-slate-900 hover:bg-neutral-800 text-white gap-1.5 shadow-sm"
                                >
                                  {isProcessing ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isAr ? "إنشاء بوليصة Yalidine" : "Générer Bordereau & Expédier"}</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-xs text-neutral-400">
                            {isAr
                              ? "لا توجد طلبات مؤكدة بانتظار الشحن حالياً."
                              : "Aucune commande en attente d'expédition. Confirmez les leads dans l'onglet Call Center."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* TAB 3: ALL ORDERS & COURIER SIMULATOR */}
            {activeTab === "all" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                      {isAr ? "سجل جميع الطلبات وتتبع شركات الشحن" : "Historique & Suivi Transporteur"}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {isAr
                        ? "تحكم كامل وتتبع بوالص الشحن عبر Yalidine و ZR Express مع محاكي الويب هوك"
                        : "Suivez les livraisons en temps réel ou simulez les webhooks pour tester la comptabilité"}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isAr ? "رقم الطلب" : "Réf. Commande"}</TableHead>
                        <TableHead>{isAr ? "العميل والوجهة" : "Client & Destination"}</TableHead>
                        <TableHead>{isAr ? "شركة التوصيل ورقم التتبع" : "Transporteur & Tracking"}</TableHead>
                        <TableHead>{isAr ? "الحالة" : "Statut"}</TableHead>
                        <TableHead>{isAr ? "التكلفة الإجمالية" : "Coût CPA Total"}</TableHead>
                        <TableHead className="text-end">{isAr ? "محاكي الويب هوك" : "Simulateur Webhook"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allOrders.length > 0 ? (
                        allOrders.map((order) => {
                          const wilayaInfo = getWilayaByCode(String(order.wilaya).padStart(2, "0"));
                          const isDelivered = order.status === "delivered";
                          const isDispatched =
                            order.status === "dispatched" || order.status === "in_transit";
                          const totalCost =
                            Number(order.cpaCommission || 0) + Number(order.platformFee || 0);

                          return (
                            <TableRow key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                              <TableCell className="font-mono text-xs font-bold text-sky-700">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </TableCell>
                              <TableCell>
                                <span className="text-xs font-bold text-neutral-900 block">
                                  {order.customerName}
                                </span>
                                <span className="text-[11px] text-neutral-500">
                                  {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${order.wilaya}`} •{" "}
                                  {order.commune}
                                </span>
                              </TableCell>
                              <TableCell>
                                {order.trackingNumber ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs font-bold text-neutral-800">
                                      {order.trackingNumber}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(order.trackingNumber!, order.id)}
                                      className="text-neutral-400 hover:text-neutral-700 p-0.5"
                                    >
                                      {copiedId === order.id ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-neutral-400 italic">
                                    {order.status === "lead_generated"
                                      ? "En attente d'appel"
                                      : "Non généré"}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={order.status as OrderStatus} lang={lang} />
                              </TableCell>
                              <TableCell className="font-mono text-xs font-bold text-neutral-800">
                                {formatDZD(totalCost, lang)}
                              </TableCell>
                              <TableCell className="text-end">
                                {isDispatched && order.trackingNumber ? (
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
                                      <span>{isAr ? "محاكاة تسليم ناجح" : "Simuler Livré"}</span>
                                    </Button>

                                    <Button
                                      variant="danger"
                                      size="sm"
                                      disabled={actionLoadingId === order.trackingNumber}
                                      onClick={() =>
                                        handleSimulateWebhook(order.trackingNumber!, "Retour")
                                      }
                                      className="text-[11px] px-2.5 py-1 gap-1"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      <span>{isAr ? "محاكاة إرجاع" : "Simuler Retour"}</span>
                                    </Button>
                                  </div>
                                ) : isDelivered ? (
                                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    {isAr ? "تم التحصيل والخصم" : "Débité & Livré"}
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
                            Aucune commande enregistrée.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* CANCELLATION MODAL */}
            {cancelModalOrder && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                        <XCircle className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-bold text-neutral-900">
                        {isAr ? "إلغاء الطلب" : "Annuler la commande"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCancelModalOrder(null)}
                      className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {isAr
                      ? `أنت على وشك إلغاء طلب الزبون (${cancelModalOrder.customerName}). يُرجى تحديد السبب للأرشفة وإبلاغ المسوق:`
                      : `Vous annulez la commande de ${cancelModalOrder.customerName}. Choisissez le motif officiel :`}
                  </p>

                  <div className="space-y-2">
                    {[
                      "Client injoignable après 3 tentatives d'appel",
                      "Commande dupliquée / Erreur du client",
                      "Client a changé d'avis / Refus d'achat",
                      "Adresse ou Wilaya hors zone de couverture",
                      "Autre",
                    ].map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          cancelReason === reason
                            ? "border-rose-500 bg-rose-50/50 text-rose-950 font-semibold"
                            : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="cancelReason"
                          value={reason}
                          checked={cancelReason === reason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="accent-rose-600"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}

                    {cancelReason === "Autre" && (
                      <input
                        type="text"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Précisez le motif..."
                        className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-rose-500"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCancelModalOrder(null)}
                    >
                      {isAr ? "تراجع" : "Retour"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleCancelLeadSubmit}
                    >
                      {isAr ? "تأكيد الإلغاء" : "Confirmer l'annulation"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TOP-UP ESCROW MODAL */}
            {isTopUpModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-neutral-200 max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-bold text-neutral-900">
                        {isAr ? "شحن رصيد الضمان Escrow" : "Rechargement du Solde Escrow"}
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
                        ? "يتم شحن حسابات الموردين عبر تحويل بنكي أو بريدي (CCP / BaridiMob) أو عبر الإيداع المباشر في مقر ViteDrop."
                        : "Le rechargement s'effectue par virement bancaire ou postal (BaridiMob / CCP) ou dépôt direct au siège ViteDrop."}
                    </p>

                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2 font-mono text-neutral-800 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500 font-sans">Compte CCP:</span>
                        <strong className="select-all">0021948293 Clé 45</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500 font-sans">BaridiMob RIP:</span>
                        <strong className="select-all">00799999002194829345</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500 font-sans">Titulaire:</span>
                        <strong className="font-sans">SARL ViteDrop Logistics DZ</strong>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px]">
                      <strong>Note importante :</strong> Envoyez le reçu de virement à votre account manager ou à <code>billing@vitedrop.com</code> pour validation et crédit instantané sur votre compte.
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-neutral-100">
                    <Button
                      size="sm"
                      onClick={() => setIsTopUpModalOpen(false)}
                    >
                      {isAr ? "حسناً، فهمت" : "Compris"}
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
