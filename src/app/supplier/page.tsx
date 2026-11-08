"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { translations, Language } from "@/lib/locales";
import { SupplierCancelModal } from "@/components/supplier/supplier-cancel-modal";
import { SupplierTopUpModal } from "@/components/supplier/supplier-topup-modal";
import {
  apiGetSupplierLeads,
  apiGetSupplierOrders,
  apiConfirmSupplierLead,
  apiCancelSupplierLead,
  apiDispatchSupplierOrder,
  apiRecordCallAttempt,
  apiSimulateCourierWebhook,
  apiGetMyWallet,
  SupplierOrder,
} from "@/lib/api-client";
import { getWilayaByCode } from "@/lib/algeria-locations";
import { WilayaDeliveryIntelBadge } from "@/components/supplier/wilaya-delivery-intel-badge";
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
  Check,
  ShieldCheck,
  Send,
  MapPin,
  ExternalLink,
  MessageSquare,
  PhoneMissed,
  Keyboard,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function SupplierDashboardView({
  defaultTab = "queue",
  isCallCenterOnly = false,
}: {
  defaultTab?: "queue" | "confirmed" | "all";
  isCallCenterOnly?: boolean;
} = {}) {
  const [activeTab, setActiveTab] = useState<"queue" | "confirmed" | "all">(defaultTab);
  const [leads, setLeads] = useState<SupplierOrder[]>([]);
  const [allOrders, setAllOrders] = useState<SupplierOrder[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Priority 2: Batch Selection & Multi-Lead actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Priority 2: Speed-Dial / Focus Mode ("Mode Agent Dédié")
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);

  // Call attempt counter per lead (3-strike workflow)
  const [callAttempts, setCallAttempts] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vitedrop_call_attempts");
      if (saved) {
        setCallAttempts(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load call attempts from localStorage", e);
    }
  }, []);

  const handleIncrementCallAttempt = (leadId: string, reason?: string) => {
    let nextAttempt = 1;
    setCallAttempts((prev) => {
      const current = prev[leadId] || 0;
      nextAttempt = (current + 1) % 4;
      const updated = { ...prev, [leadId]: nextAttempt };
      try {
        localStorage.setItem("vitedrop_call_attempts", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to save call attempts to localStorage", e);
      }
      return updated;
    });

    if (nextAttempt > 0) {
      apiRecordCallAttempt(leadId, nextAttempt, reason || "Injoignable / Pas de réponse").catch((err) => {
        console.warn("Failed to persist call attempt to backend:", err);
      });
    }
  };

  // Helper to build WhatsApp deep link with prefilled confirmation message
  const buildWhatsAppUrl = (lead: SupplierOrder, lang: Language) => {
    const cleanPhone = (lead.customerPhone || "").replace(/\D/g, "").replace(/^0/, "");
    const wilayaInfo = getWilayaByCode(String(lead.wilaya).padStart(2, "0"));
    const wilayaName = wilayaInfo
      ? lang === "ar"
        ? wilayaInfo.nameAr
        : wilayaInfo.name
      : `W.${lead.wilaya}`;
    const tpl = translations[lang].supplier.dashboard.whatsAppMsgTemplate;
    const msg = tpl
      .replace("{name}", lead.customerName || "Client")
      .replace("{product}", lead.productName || "produit")
      .replace("{wilaya}", `${wilayaName} (${lead.commune || ""})`);
    return `https://wa.me/213${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Priority 2: Batch Selection Handlers
  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length && leads.length > 0) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  const handleBatchConfirm = async (customMsg?: string) => {
    if (selectedLeadIds.length === 0) return;
    setIsBatchProcessing(true);
    setErrorMessage(null);
    try {
      const results = await Promise.allSettled(
        selectedLeadIds.map((id) => apiConfirmSupplierLead(id))
      );
      const successful = results.filter((r) => r.status === "fulfilled").length;
      setActionMessage(
        customMsg
          ? customMsg.replace("{count}", String(successful))
          : `${successful} leads confirmés avec succès !`
      );
      setTimeout(() => setActionMessage(null), 4000);
      setSelectedLeadIds([]);
      await loadSupplierData();
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la confirmation par lot.");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchCallAttempt = (customMsg?: string) => {
    if (selectedLeadIds.length === 0) return;
    const toRecord: { id: string; next: number }[] = [];
    setCallAttempts((prev) => {
      const updated = { ...prev };
      selectedLeadIds.forEach((id) => {
        const current = updated[id] || 0;
        const next = (current + 1) % 4;
        updated[id] = next;
        if (next > 0) toRecord.push({ id, next });
      });
      try {
        localStorage.setItem("vitedrop_call_attempts", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to save call attempts", e);
      }
      return updated;
    });

    toRecord.forEach(({ id, next }) => {
      apiRecordCallAttempt(id, next, "Injoignable / Pas de réponse (Batch)").catch((err) => {
        console.warn("Failed to persist batch call attempt note:", err);
      });
    });

    setActionMessage(
      customMsg
        ? customMsg.replace("{count}", String(selectedLeadIds.length))
        : `Tentative d'appel enregistrée pour ${selectedLeadIds.length} leads.`
    );
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Cancellation Modal state
  const [cancelModalOrder, setCancelModalOrder] = useState<SupplierOrder | null>(null);

  // Top-up simulation modal
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  // Alerts & Clipboard Feedback
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Load supplier data from backend
  const loadSupplierData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
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
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors du chargement des données fournisseur.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, []);

  // 1. Confirm Lead
  const handleConfirmLead = async (orderId: string, customMsg?: string) => {
    setActionLoadingId(orderId);
    setErrorMessage(null);
    try {
      await apiConfirmSupplierLead(orderId);
      setActionMessage(customMsg || "Lead confirmé avec succès. Prêt pour expédition.");
      setTimeout(() => setActionMessage(null), 3500);
      await loadSupplierData();
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la confirmation du lead.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Cancel Lead
  const handleCancelLeadConfirm = async (reason: string, customMsg?: string) => {
    if (!cancelModalOrder) return;
    setActionLoadingId(cancelModalOrder.id);
    setErrorMessage(null);
    try {
      await apiCancelSupplierLead(cancelModalOrder.id, reason);
      setActionMessage(customMsg || "Lead annulé avec succès.");
      setTimeout(() => setActionMessage(null), 3500);
      setCancelModalOrder(null);
      await loadSupplierData();
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de l'annulation du lead.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Dispatch Order
  const handleDispatchOrder = async (orderId: string, customMsg?: string) => {
    setActionLoadingId(orderId);
    setErrorMessage(null);
    try {
      await apiDispatchSupplierOrder(orderId);
      setActionMessage(customMsg || "Bordereau Yalidine généré et commande expédiée.");
      setTimeout(() => setActionMessage(null), 3500);
      await loadSupplierData();
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la création du bordereau d'expédition.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Simulate Courier Webhook
  const handleSimulateWebhook = async (
    trackingNumber: string,
    status: "Livre" | "Retour",
    customMsg?: string
  ) => {
    setActionLoadingId(trackingNumber);
    setErrorMessage(null);
    try {
      await apiSimulateCourierWebhook(trackingNumber, status);
      setActionMessage(
        customMsg ||
          (status === "Livre"
            ? `Notification de livraison simulée avec succès pour ${trackingNumber}.`
            : `Notification de retour simulée pour ${trackingNumber}.`)
      );
      setTimeout(() => setActionMessage(null), 3500);
      await loadSupplierData();
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la simulation du webhook transporteur.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Keyboard shortcuts for Call Center operator ([C] Confirm first, [X] Cancel first, [R] Refresh, [Esc] Close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          (activeEl as HTMLElement).isContentEditable);
      if (isInput) return;

      if (e.key === "Escape") {
        if (cancelModalOrder) setCancelModalOrder(null);
        if (isTopUpModalOpen) setIsTopUpModalOpen(false);
        return;
      }

      if (activeTab !== "queue") return;

      if (isFocusMode && leads.length > 0) {
        const currentTarget = leads[focusIndex] || leads[0];
        if ((e.key === "c" || e.key === "C") && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          if (!actionLoadingId) {
            handleConfirmLead(currentTarget.id);
            if (focusIndex < leads.length - 1) {
              setFocusIndex((prev) => prev + 1);
            }
          }
          return;
        } else if ((e.key === "x" || e.key === "X") && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          if (!actionLoadingId) {
            setCancelModalOrder(currentTarget);
          }
          return;
        } else if (e.key === "ArrowRight" || e.key === "j" || e.key === "J") {
          e.preventDefault();
          setFocusIndex((prev) => (prev < leads.length - 1 ? prev + 1 : 0));
          return;
        } else if (e.key === "ArrowLeft" || e.key === "k" || e.key === "K") {
          e.preventDefault();
          setFocusIndex((prev) => (prev > 0 ? prev - 1 : leads.length - 1));
          return;
        }
      }

      if ((e.key === "c" || e.key === "C") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (leads.length > 0 && !actionLoadingId) {
          handleConfirmLead(leads[0].id);
        }
      } else if ((e.key === "x" || e.key === "X") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (leads.length > 0 && !actionLoadingId) {
          setCancelModalOrder(leads[0]);
        }
      } else if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (!isLoading) {
          loadSupplierData();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, leads, actionLoadingId, isLoading, cancelModalOrder, isTopUpModalOpen, isFocusMode, focusIndex]);

  const confirmedOrders = allOrders.filter((o) => o.status === "supplier_confirmed");

  return (
    <DashboardLayout initialRole="supplier" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const isAr = lang === "ar";
        const isEn = lang === "en";
        const s = t.supplier.dashboard;

        const currentBalance = walletBalance !== null ? walletBalance : 8000;
        const isLowBalance = currentBalance < 3000;
        const avgCpa = leads.length > 0
          ? Math.round(
              leads.reduce((acc, l) => acc + (Number(l.cpaCommission || 0) + Number(l.platformFee || 0)), 0) /
                leads.length
            )
          : 1250;
        const runwayDeliveries = avgCpa > 0 ? Math.floor(currentBalance / avgCpa) : 0;

        return (
          <div className="space-y-6 text-start w-full max-w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 ${isAr ? "" : "font-mono uppercase tracking-wider"}`}>
                    {s.hubBadge}
                  </span>
                  <span className="text-xs text-neutral-400">&bull;</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {leads.length} {s.leadsWaitingSuffix}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight mt-1">
                  {s.title}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {s.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadSupplierData}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>{s.refresh}</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white shadow-md shadow-purple-600/20"
                  data-testid="topup-escrow-btn"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{s.rechargeEscrow}</span>
                </Button>
              </div>
            </div>

            {/* In-page Alerts */}
            {actionMessage && (
              <div
                role="status"
                className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in"
                data-testid="supplier-action-alert"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in"
                data-testid="supplier-error-alert"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="truncate">{errorMessage}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(errorMessage.toLowerCase().includes("solde") ||
                    errorMessage.toLowerCase().includes("escrow") ||
                    errorMessage.toLowerCase().includes("recharger")) && (
                    <Button
                      size="sm"
                      onClick={() => setIsTopUpModalOpen(true)}
                      className="text-xs h-7 px-2.5 bg-rose-700 hover:bg-rose-800 text-white gap-1 shadow-xs cursor-pointer"
                      data-testid="insufficient-escrow-topup-btn"
                    >
                      <Wallet className="w-3 h-3" />
                      <span>{isAr ? "شحن الرصيد الآن" : isEn ? "Top Up Escrow Now" : "Recharger mon Solde"}</span>
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-rose-600 hover:text-rose-900 text-xs shrink-0 font-bold"
                  >
                    {s.close}
                  </button>
                </div>
              </div>
            )}

            {/* Prepaid Escrow & Ledger Health Banner */}
            {!isCallCenterOnly && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors min-w-0 w-full ${
                  isLowBalance
                    ? "bg-amber-50/80 border-amber-200 text-amber-950"
                    : "bg-purple-50/70 border-purple-200/80 text-purple-950"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isLowBalance ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base">
                        {s.escrowBannerTitle}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isLowBalance
                            ? "bg-amber-200/80 text-amber-900"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isLowBalance
                          ? s.statusLowBalance
                          : s.statusOperational}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
                      {s.escrowBannerDesc}
                    </p>
                    {/* Dynamic Solvency Runway Telemetry */}
                    <div className="pt-1.5 flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-800 bg-white/70 px-2.5 py-0.5 rounded-lg border border-neutral-200/60 shadow-2xs">
                        <span className={`w-2 h-2 rounded-full ${isLowBalance ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                        <span>{s.solvencyRunwayText.replace("{count}", String(runwayDeliveries))}</span>
                      </span>
                      <span className="text-[11px] font-mono text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md font-semibold">
                        ~{avgCpa} DZD / CPA
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xs p-3 px-4 rounded-xl border border-black/5 shrink-0 self-stretch md:self-auto justify-between md:justify-start">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide block truncate">
                      {s.availableBalance}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-neutral-900 block truncate">
                      {formatDZD(currentBalance, lang)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsTopUpModalOpen(true)}
                    className="text-xs shrink-0"
                  >
                    {s.details}
                  </Button>
                </div>
              </div>
            )}

            {/* Workflow Navigation Tabs */}
            {!isCallCenterOnly && (
              <div className="flex items-center gap-2 border-b border-neutral-200/80 pb-2 overflow-x-auto no-scrollbar w-full max-w-full min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("queue")}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    activeTab === "queue"
                      ? "bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white shadow-md shadow-sky-500/20"
                      : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60"
                  }`}
                  data-testid="tab-queue"
                >
                  <Headphones className="w-4 h-4 text-sky-400" />
                  <span>{s.tabQueue}</span>
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
                  data-testid="tab-confirmed"
                >
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span>{s.tabConfirmed}</span>
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
                  data-testid="tab-all"
                >
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>{s.tabAll}</span>
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
            )}

            {/* TAB 1: CALL CENTER QUEUE */}
            {activeTab === "queue" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                      <Headphones className="w-5 h-5 text-indigo-600" />
                      <span>{s.queueTitle}</span>
                    </h3>
                    <span className="text-xs text-neutral-500 font-mono">
                      ({leads.length} {s.prospectsWaitingSuffix})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Priority 2: Speed-Dial / Focus Mode Button */}
                    <Button
                      variant={isFocusMode ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => {
                        setIsFocusMode(!isFocusMode);
                        setFocusIndex(0);
                      }}
                      className={`gap-1.5 text-xs ${
                        isFocusMode
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20"
                          : ""
                      }`}
                      data-testid="toggle-focus-mode-btn"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isFocusMode ? "text-white" : "text-amber-500"}`} />
                      <span>{s.focusModeToggle}</span>
                    </Button>

                    {/* Operator Hotkeys Legend */}
                    <div
                      className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-500 font-mono bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200/70"
                      data-testid="operator-hotkeys-legend"
                    >
                      <Keyboard className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{s.operatorHotkeysTitle}:</span>
                      <span className="flex items-center gap-1 font-semibold text-neutral-700">
                        <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-300 text-[10px] font-bold shadow-2xs">C</kbd>
                        <span className="text-[10px]">{s.confirm}</span>
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="flex items-center gap-1 font-semibold text-neutral-700">
                        <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-300 text-[10px] font-bold shadow-2xs">X</kbd>
                        <span className="text-[10px]">{s.cancel}</span>
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="flex items-center gap-1 font-semibold text-neutral-700">
                        <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-300 text-[10px] font-bold shadow-2xs">R</kbd>
                        <span className="text-[10px]">{s.refresh}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Priority 2: Speed-Dial / Focus Mode Panel */}
                {isFocusMode && leads.length > 0 && (
                  (() => {
                    const focusLead = leads[focusIndex] || leads[0];
                    const wilayaInfo = getWilayaByCode(String(focusLead.wilaya).padStart(2, "0"));
                    const isProcessing = actionLoadingId === focusLead.id;
                    const attemptCount = callAttempts[focusLead.id] || 0;

                    return (
                      <div
                        className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-neutral-900 to-slate-950 text-white shadow-xl border border-white/10 space-y-4 animate-in fade-in zoom-in-95 duration-200"
                        data-testid="speed-dial-panel"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                              {s.focusLeadProgress
                                .replace("{current}", String(focusIndex + 1))
                                .replace("{total}", String(leads.length))}
                            </span>
                            <span className="text-xs text-neutral-400 font-mono">
                              #{focusLead.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setFocusIndex((prev) => (prev > 0 ? prev - 1 : leads.length - 1))}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                              title={s.focusPrev}
                              aria-label={s.focusPrev}
                              data-testid="focus-prev-btn"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-mono text-neutral-300">
                              {focusIndex + 1} / {leads.length}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFocusIndex((prev) => (prev < leads.length - 1 ? prev + 1 : 0))}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                              title={s.focusNext}
                              aria-label={s.focusNext}
                              data-testid="focus-next-btn"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsFocusMode(false)}
                              className="text-xs text-neutral-400 hover:text-white ml-2 underline cursor-pointer"
                              data-testid="focus-close-btn"
                            >
                              {s.focusClose}
                            </button>
                          </div>
                        </div>

                        {/* Customer & Call Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide block">
                              {s.colCustomerPhone}
                            </span>
                            <h4 className="text-lg font-bold text-white tracking-tight">
                              {focusLead.customerName}
                            </h4>
                            <div className="flex items-center gap-2 pt-1">
                              <a
                                href={`tel:${focusLead.customerPhone}`}
                                className="font-mono text-sm font-bold text-sky-400 hover:underline flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-xl"
                                data-testid="focus-phone-link"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                <span dir="ltr">{focusLead.customerPhone}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopy(focusLead.customerPhone, `focus-phone-${focusLead.id}`)}
                                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white"
                                data-testid="focus-copy-phone-btn"
                                aria-label="Copier téléphone"
                              >
                                {copiedKey === `focus-phone-${focusLead.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <a
                                href={buildWhatsAppUrl(focusLead, lang)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/50 flex items-center gap-1 text-xs font-bold"
                                title={s.whatsAppTooltip}
                                data-testid="focus-whatsapp-btn"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                                <span>WA</span>
                              </a>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide block">
                              {s.colDestinationAddress}
                            </span>
                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                              <span>
                                {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${focusLead.wilaya}`} ({focusLead.commune})
                              </span>
                            </div>
                            <WilayaDeliveryIntelBadge
                              wilaya={focusLead.wilaya}
                              lang={lang}
                              showAdvice={true}
                              className="pt-1"
                              testId="focus-wilaya-intel-badge"
                            />
                            <p className="text-xs text-neutral-300 leading-relaxed pt-0.5">
                              {focusLead.address}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide block">
                              {focusLead.productName || s.colQuantityTotal}
                            </span>
                            <div className="text-sm font-bold text-white">
                              {focusLead.quantity}x {s.piece}
                            </div>
                            <div className="text-xs font-mono text-emerald-400 font-bold pt-0.5">
                              CPA: {formatDZD(Number(focusLead.cpaCommission) + Number(focusLead.platformFee), lang)}
                            </div>
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => handleIncrementCallAttempt(focusLead.id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                                  attemptCount === 0
                                    ? "bg-white/10 text-neutral-300 border-white/20"
                                    : attemptCount === 1
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                    : attemptCount === 2
                                    ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                                    : "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                                }`}
                                data-testid="focus-attempt-btn"
                              >
                                <PhoneMissed className="w-3 h-3" />
                                <span>{s.strikeBadge.replace("{count}", String(attemptCount))}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Power Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/10">
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => setCancelModalOrder(focusLead)}
                            className="min-h-[42px] text-xs font-bold justify-center gap-1.5"
                            data-testid="focus-cancel-btn"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>{s.cancel} [X]</span>
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleIncrementCallAttempt(focusLead.id)}
                            className="min-h-[42px] text-xs font-bold justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20"
                            data-testid="focus-unanswered-btn"
                          >
                            <PhoneMissed className="w-4 h-4" />
                            <span>{s.markAttemptBtn}</span>
                          </Button>

                          <Button
                            size="sm"
                            disabled={isProcessing}
                            onClick={async () => {
                              await handleConfirmLead(focusLead.id, s.msgLeadConfirmed);
                              if (focusIndex < leads.length - 1) {
                                setFocusIndex((prev) => prev + 1);
                              }
                            }}
                            className="min-h-[42px] text-xs font-bold justify-center bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white gap-1.5 shadow-lg shadow-emerald-500/20"
                            data-testid="focus-confirm-btn"
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            <span>{s.focusConfirmNext} [C]</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })()
                )}

                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  {/* Mobile Cards View (< 1024px) */}
                  <div className="block lg:hidden divide-y divide-neutral-100">
                    {isLoading ? (
                      <div className="p-6 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : leads.length === 0 ? (
                      <div className="p-8 text-center text-neutral-500 space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="text-xs font-semibold text-neutral-800">
                          {s.emptyQueueTitle}
                        </p>
                      </div>
                    ) : (
                      leads.map((lead) => {
                        const wilayaInfo = getWilayaByCode(String(lead.wilaya).padStart(2, "0"));
                        const isProcessing = actionLoadingId === lead.id;

                        return (
                          <div
                            key={lead.id}
                            className={`p-3.5 space-y-2.5 transition-colors ${
                              selectedLeadIds.includes(lead.id) ? "bg-indigo-50/50" : ""
                            }`}
                            data-testid="supplier-lead-card"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedLeadIds.includes(lead.id)}
                                  onChange={() => handleToggleSelectLead(lead.id)}
                                  className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                  aria-label={`Select lead ${lead.id}`}
                                  data-testid={`lead-select-checkbox-mobile-${lead.id}`}
                                />
                                <span className="font-mono text-xs font-bold text-indigo-700">
                                  #{lead.id.slice(0, 8).toUpperCase()}
                                </span>
                              </div>
                              <StatusBadge status={lead.status as OrderStatus} lang={lang} />
                            </div>

                            <div className="space-y-1 text-xs">
                              <div className="font-bold text-neutral-900">{lead.customerName}</div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`tel:${lead.customerPhone}`}
                                    className="font-mono text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 min-h-[32px]"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span dir="ltr">{lead.customerPhone}</span>
                                  </a>
                                  <a
                                    href={buildWhatsAppUrl(lead, lang)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="min-w-[32px] min-h-[32px] inline-flex items-center justify-center p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors gap-0.5 text-[11px] font-bold"
                                    title={s.whatsAppTooltip}
                                    aria-label={s.whatsAppTooltip}
                                    data-testid="whatsapp-lead-btn"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-[10px]">WA</span>
                                  </a>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {/* Call Attempt Counter */}
                                  <button
                                    type="button"
                                    onClick={() => handleIncrementCallAttempt(lead.id)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 min-h-[32px] rounded-full text-[10px] font-bold font-mono transition-all cursor-pointer border ${
                                      (callAttempts[lead.id] || 0) === 0
                                        ? "bg-neutral-50 text-neutral-600 border-neutral-200"
                                        : (callAttempts[lead.id] || 0) === 1
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : (callAttempts[lead.id] || 0) === 2
                                        ? "bg-orange-50 text-orange-700 border-orange-200"
                                        : "bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-300"
                                    }`}
                                    title={
                                      (callAttempts[lead.id] || 0) >= 3
                                        ? s.strikeMaxAlert
                                        : `${s.callAttemptsLabel}: ${callAttempts[lead.id] || 0}/3`
                                    }
                                    data-testid="call-attempt-btn"
                                  >
                                    <PhoneMissed className="w-3 h-3 shrink-0" />
                                    <span>
                                      {s.strikeBadge.replace("{count}", String(callAttempts[lead.id] || 0))}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(lead.customerPhone, `lead-phone-${lead.id}`)}
                                    className="min-w-[32px] min-h-[32px] inline-flex items-center justify-center p-1 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
                                    data-testid="copy-phone-btn"
                                    aria-label="Copier téléphone"
                                  >
                                    {copiedKey === `lead-phone-${lead.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              {(callAttempts[lead.id] || 0) >= 3 && (
                                <div className="p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[10px] font-semibold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>{s.strikeMaxAlert}</span>
                                </div>
                              )}
                              <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                                <span className="truncate">
                                  {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${lead.wilaya}`}{" "}
                                  ({lead.commune}) - {lead.address}
                                </span>
                              </div>
                              <WilayaDeliveryIntelBadge
                                wilaya={lead.wilaya}
                                lang={lang}
                                className="pt-1"
                                testId={`mobile-queue-wilaya-intel-${lead.id}`}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => setCancelModalOrder(lead)}
                                className="min-h-[40px] text-xs justify-center gap-1"
                                data-testid="cancel-lead-btn"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{s.cancel}</span>
                              </Button>
                              <Button
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleConfirmLead(lead.id, s.msgLeadConfirmed)}
                                className="min-h-[40px] text-xs justify-center bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                data-testid="confirm-lead-btn"
                              >
                                {isProcessing ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>{s.confirm}</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <input
                              type="checkbox"
                              checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                              onChange={handleToggleSelectAll}
                              className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                              aria-label={s.selectAllLeads}
                              data-testid="select-all-leads-checkbox"
                            />
                          </TableHead>
                          <TableHead>{s.colLeadRef}</TableHead>
                          <TableHead>{s.colCustomerPhone}</TableHead>
                          <TableHead>{s.colDestinationAddress}</TableHead>
                          <TableHead>{s.colQuantityTotal}</TableHead>
                          <TableHead>{s.colStatus}</TableHead>
                          <TableHead className="text-end">{s.colActions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-xs text-neutral-500">
                              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                              <span>{t.common.loading}</span>
                            </TableCell>
                          </TableRow>
                        ) : leads.length > 0 ? (
                          leads.map((lead) => {
                            const wilayaInfo = getWilayaByCode(String(lead.wilaya).padStart(2, "0"));
                            const isProcessing = actionLoadingId === lead.id;

                            return (
                              <TableRow
                                key={lead.id}
                                className={`transition-colors ${
                                  selectedLeadIds.includes(lead.id)
                                    ? "bg-indigo-50/50 hover:bg-indigo-50/70"
                                    : "hover:bg-neutral-50/80"
                                }`}
                                data-testid="supplier-lead-row"
                              >
                                <TableCell className="w-10">
                                  <input
                                    type="checkbox"
                                    checked={selectedLeadIds.includes(lead.id)}
                                    onChange={() => handleToggleSelectLead(lead.id)}
                                    className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                    aria-label={`Select lead ${lead.id}`}
                                    data-testid={`lead-select-checkbox-${lead.id}`}
                                  />
                                </TableCell>
                                {/* Order ID */}
                                <TableCell className="font-mono text-xs font-semibold text-neutral-800">
                                  #{lead.id.slice(0, 8).toUpperCase()}
                                </TableCell>

                                {/* Customer */}
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-neutral-900 tracking-tight leading-snug">
                                      {lead.customerName}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <a
                                        href={`tel:${lead.customerPhone}`}
                                        className="font-mono text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                                      >
                                        <Phone className="w-3 h-3 text-emerald-600" />
                                        <span dir="ltr">{lead.customerPhone}</span>
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(lead.customerPhone, `tbl-phone-${lead.id}`)}
                                        className="p-0.5 rounded text-neutral-400 hover:text-black"
                                        data-testid="copy-phone-btn"
                                        aria-label="Copier téléphone"
                                      >
                                        {copiedKey === `tbl-phone-${lead.id}` ? (
                                          <Check className="w-3 h-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                      {/* 1-Click WhatsApp Trigger */}
                                      <a
                                        href={buildWhatsAppUrl(lead, lang)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-0.5 text-[11px] font-bold"
                                        title={s.whatsAppTooltip}
                                        aria-label={s.whatsAppTooltip}
                                        data-testid="whatsapp-lead-btn"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-[10px]">WA</span>
                                      </a>
                                      {/* Call Attempt Counter */}
                                      <button
                                        type="button"
                                        onClick={() => handleIncrementCallAttempt(lead.id)}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono transition-all cursor-pointer border ${
                                          (callAttempts[lead.id] || 0) === 0
                                            ? "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                                            : (callAttempts[lead.id] || 0) === 1
                                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                            : (callAttempts[lead.id] || 0) === 2
                                            ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                                            : "bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-300 hover:bg-rose-100"
                                        }`}
                                        title={
                                          (callAttempts[lead.id] || 0) >= 3
                                            ? s.strikeMaxAlert
                                            : `${s.callAttemptsLabel}: ${callAttempts[lead.id] || 0}/3`
                                        }
                                        data-testid="call-attempt-btn"
                                      >
                                        <PhoneMissed className="w-3 h-3 shrink-0" />
                                        <span>
                                          {s.strikeBadge.replace("{count}", String(callAttempts[lead.id] || 0))}
                                        </span>
                                      </button>
                                    </div>
                                    {(callAttempts[lead.id] || 0) >= 3 && (
                                      <span className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                        <span>{s.strikeMaxAlert}</span>
                                      </span>
                                    )}
                                  </div>
                                </TableCell>

                                {/* Address */}
                                <TableCell>
                                  <div className="flex flex-col text-xs max-w-xs gap-1">
                                    <span className="font-semibold text-neutral-800 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-neutral-400" />
                                      <span>
                                        {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${lead.wilaya}`} (
                                        {lead.commune})
                                      </span>
                                    </span>
                                    <WilayaDeliveryIntelBadge
                                      wilaya={lead.wilaya}
                                      lang={lang}
                                      testId={`queue-wilaya-intel-${lead.id}`}
                                    />
                                    <span className="text-[11px] text-neutral-500 truncate" title={lead.address}>
                                      {lead.address}
                                    </span>
                                  </div>
                                </TableCell>

                                {/* Quantity & Payout */}
                                <TableCell className="text-xs">
                                  <span className="font-semibold text-neutral-900">
                                    {lead.quantity}x {s.piece}
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
                                      data-testid="cancel-lead-btn"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>{s.cancel}</span>
                                    </Button>

                                    <Button
                                      size="sm"
                                      disabled={isProcessing}
                                      onClick={() => handleConfirmLead(lead.id, s.msgLeadConfirmed)}
                                      className="text-[11px] px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-1 shadow-xs"
                                      data-testid="confirm-lead-btn"
                                    >
                                      {isProcessing ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      )}
                                      <span>{s.confirmOrder}</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-xs text-neutral-400">
                              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                              <p className="font-semibold text-neutral-800">
                                {s.emptyQueueTitle}
                              </p>
                              <p className="text-neutral-500 mt-0.5">
                                {s.emptyQueueDesc}
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Priority 2: Floating Sticky Batch Drawer */}
                {selectedLeadIds.length > 0 && (
                  <div
                    className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-2xl w-[94vw] animate-in slide-in-from-bottom-5 duration-200"
                    data-testid="supplier-batch-drawer"
                  >
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <span className="font-mono text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
                        {s.batchSelectedCount.replace("{count}", String(selectedLeadIds.length))}
                      </span>
                      <div className="text-xs text-neutral-300 font-mono">
                        {s.batchTotalCpa}{" "}
                        <span className="font-bold text-white">
                          {formatDZD(
                            leads
                              .filter((l) => selectedLeadIds.includes(l.id))
                              .reduce(
                                (sum, l) =>
                                  sum + (Number(l.cpaCommission || 0) + Number(l.platformFee || 0)),
                                0
                              ),
                            lang
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleBatchCallAttempt(s.batchCallAttemptSuccess)}
                        className="flex-1 sm:flex-none min-h-[40px] text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5"
                        data-testid="batch-attempt-btn"
                      >
                        <PhoneMissed className="w-3.5 h-3.5" />
                        <span>{s.batchCallAttemptBtn}</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleBatchConfirm(s.batchConfirmSuccess)}
                        disabled={isBatchProcessing}
                        className="flex-1 sm:flex-none min-h-[40px] text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold gap-1.5 shadow-md shadow-emerald-500/20"
                        data-testid="batch-confirm-btn"
                      >
                        {isBatchProcessing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>{s.batchConfirmBtn.replace("{count}", String(selectedLeadIds.length))}</span>
                      </Button>

                      <button
                        type="button"
                        onClick={() => setSelectedLeadIds([])}
                        className="w-full sm:w-auto text-center min-h-[32px] inline-flex items-center justify-center text-xs text-neutral-400 hover:text-white underline cursor-pointer px-1 sm:ml-1"
                        data-testid="batch-deselect-btn"
                      >
                        {s.batchDeselectBtn}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CONFIRMED ORDERS WAITING FOR DISPATCH */}
            {activeTab === "confirmed" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-purple-600" />
                      <span>{s.confirmedTitle}</span>
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {s.confirmedSubtitle}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    {confirmedOrders.length} {s.readySuffix}
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  {/* Mobile Cards (< 1024px) */}
                  <div className="block lg:hidden divide-y divide-neutral-100">
                    {confirmedOrders.length === 0 ? (
                      <div className="p-8 text-center text-neutral-400 text-xs">
                        {s.emptyConfirmed}
                      </div>
                    ) : (
                      confirmedOrders.map((order) => {
                        const wilayaInfo = getWilayaByCode(String(order.wilaya).padStart(2, "0"));
                        const isProcessing = actionLoadingId === order.id;

                        return (
                          <div
                            key={order.id}
                            className="p-3.5 space-y-2.5"
                            data-testid="supplier-confirmed-card"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-purple-700">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              <StatusBadge status={order.status as OrderStatus} lang={lang} />
                            </div>

                            <div className="space-y-1 text-xs">
                              <div className="font-bold text-neutral-900">{order.customerName}</div>
                              <div dir="ltr" className="font-mono text-[11px] text-neutral-500">
                                {order.customerPhone}
                              </div>
                              <div className="text-[11px] text-neutral-600">
                                {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${order.wilaya}`}{" "}
                                ({order.commune}) - {order.address}
                              </div>
                            </div>

                            <div className="pt-1">
                              <Button
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleDispatchOrder(order.id, s.msgDispatched)}
                                className="w-full text-xs min-h-[40px] justify-center bg-slate-900 hover:bg-neutral-800 text-white gap-1.5"
                                data-testid="dispatch-order-btn"
                              >
                                {isProcessing ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                <span>{s.generateWaybill}</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{s.colOrderRef}</TableHead>
                          <TableHead>{s.colClient}</TableHead>
                          <TableHead>{s.colDestination}</TableHead>
                          <TableHead>{s.colAddress}</TableHead>
                          <TableHead>{s.colStatus}</TableHead>
                          <TableHead className="text-end">{s.colAction}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {confirmedOrders.length > 0 ? (
                          confirmedOrders.map((order) => {
                            const wilayaInfo = getWilayaByCode(String(order.wilaya).padStart(2, "0"));
                            const isProcessing = actionLoadingId === order.id;

                            return (
                              <TableRow
                                key={order.id}
                                className="hover:bg-neutral-50/80 transition-colors"
                                data-testid="supplier-confirmed-row"
                              >
                                <TableCell className="font-mono text-xs font-semibold text-neutral-800">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-semibold text-neutral-900 tracking-tight leading-snug block">
                                    {order.customerName}
                                  </span>
                                  <span dir="ltr" className="text-xs font-mono font-medium text-neutral-800 block mt-0.5">
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
                                    onClick={() => handleDispatchOrder(order.id, s.msgDispatched)}
                                    className="text-xs px-3.5 py-1.5 bg-slate-900 hover:bg-neutral-800 text-white gap-1.5 shadow-xs"
                                    data-testid="dispatch-order-btn"
                                  >
                                    {isProcessing ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Send className="w-3.5 h-3.5" />
                                    )}
                                    <span>{s.generateWaybill}</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-xs text-neutral-400">
                              {s.emptyConfirmed}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ALL ORDERS & COURIER SIMULATOR */}
            {activeTab === "all" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                      {s.allOrdersTitle}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {s.allOrdersSubtitle}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  {/* Mobile Cards View (< 1024px) */}
                  <div className="block lg:hidden divide-y divide-neutral-100">
                    {allOrders.length === 0 ? (
                      <div className="p-8 text-center text-neutral-400 text-xs">
                        {s.emptyAllOrders}
                      </div>
                    ) : (
                      allOrders.map((order) => {
                        const wilayaInfo = getWilayaByCode(String(order.wilaya).padStart(2, "0"));
                        const isDelivered = order.status === "delivered";
                        const isDispatched =
                          order.status === "dispatched" || order.status === "in_transit";
                        const totalCost =
                          Number(order.cpaCommission || 0) + Number(order.platformFee || 0);

                        return (
                          <div
                            key={order.id}
                            className="p-3.5 space-y-2.5"
                            data-testid="supplier-order-card"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-sky-700">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              <StatusBadge status={order.status as OrderStatus} lang={lang} />
                            </div>

                            <div className="space-y-1 text-xs">
                              <div className="font-bold text-neutral-900">{order.customerName}</div>
                              <div className="text-[11px] text-neutral-500">
                                {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${order.wilaya}`} &bull; {order.commune}
                              </div>
                              {order.trackingNumber && (
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100">
                                  <span className="font-mono font-bold text-neutral-800" dir="ltr">
                                    {order.trackingNumber}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(order.trackingNumber!, `all-track-${order.id}`)}
                                    className="min-w-[32px] min-h-[32px] inline-flex items-center justify-center p-1 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
                                    data-testid="copy-tracking-btn"
                                    aria-label="Copier tracking"
                                  >
                                    {copiedKey === `all-track-${order.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              )}
                              <div className="text-[11px] font-mono text-neutral-700 font-bold">
                                CPA: {formatDZD(totalCost, lang)}
                              </div>
                            </div>

                            {/* Actions on card */}
                            {isDispatched && order.trackingNumber && (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <Button
                                  size="sm"
                                  disabled={actionLoadingId === order.trackingNumber}
                                  onClick={() =>
                                    handleSimulateWebhook(
                                      order.trackingNumber!,
                                      "Livre",
                                      s.msgWebhookDelivered.replace("{tracking}", order.trackingNumber!)
                                    )
                                  }
                                  className="min-h-[40px] text-xs justify-center bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                  data-testid="simulate-delivery-btn"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{s.simulateDelivered}</span>
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  disabled={actionLoadingId === order.trackingNumber}
                                  onClick={() =>
                                    handleSimulateWebhook(
                                      order.trackingNumber!,
                                      "Retour",
                                      s.msgWebhookReturn.replace("{tracking}", order.trackingNumber!)
                                    )
                                  }
                                  className="min-h-[40px] text-xs justify-center gap-1"
                                  data-testid="simulate-return-btn"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>{s.simulateReturn}</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{s.colOrderRef}</TableHead>
                          <TableHead>{s.colClientDestination}</TableHead>
                          <TableHead>{s.colCourierTracking}</TableHead>
                          <TableHead>{s.colStatus}</TableHead>
                          <TableHead>{s.colTotalCpaCost}</TableHead>
                          <TableHead className="text-end">{s.colWebhookSimulator}</TableHead>
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
                              <TableRow
                                key={order.id}
                                className="hover:bg-neutral-50/80 transition-colors"
                                data-testid="supplier-order-row"
                              >
                                <TableCell className="font-mono text-xs font-semibold text-neutral-800">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-semibold text-neutral-900 tracking-tight leading-snug block">
                                    {order.customerName}
                                  </span>
                                  <span className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                                    {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `W.${order.wilaya}`} &bull;{" "}
                                    {order.commune}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {order.trackingNumber ? (
                                    <div className="flex items-center gap-1.5">
                                      <span dir="ltr" className="font-mono text-xs font-bold text-neutral-800">
                                        {order.trackingNumber}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(order.trackingNumber!, `tbl-all-track-${order.id}`)}
                                        className="text-neutral-400 hover:text-neutral-700 p-0.5"
                                        data-testid="copy-tracking-btn"
                                        aria-label="Copier tracking"
                                      >
                                        {copiedKey === `tbl-all-track-${order.id}` ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-neutral-400 italic">
                                      {order.status === "lead_generated"
                                        ? s.waitingForCall
                                        : s.notGenerated}
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
                                          handleSimulateWebhook(
                                            order.trackingNumber!,
                                            "Livre",
                                            s.msgWebhookDelivered.replace("{tracking}", order.trackingNumber!)
                                          )
                                        }
                                        className="text-[11px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                        data-testid="simulate-delivery-btn"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>{s.simulateDelivered}</span>
                                      </Button>

                                      <Button
                                        variant="danger"
                                        size="sm"
                                        disabled={actionLoadingId === order.trackingNumber}
                                        onClick={() =>
                                          handleSimulateWebhook(
                                            order.trackingNumber!,
                                            "Retour",
                                            s.msgWebhookReturn.replace("{tracking}", order.trackingNumber!)
                                          )
                                        }
                                        className="text-[11px] px-2.5 py-1 gap-1"
                                        data-testid="simulate-return-btn"
                                      >
                                        <XCircle className="w-3 h-3" />
                                        <span>{s.simulateReturn}</span>
                                      </Button>
                                    </div>
                                  ) : isDelivered ? (
                                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                      {s.debitedAndDelivered}
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
                              {s.emptyAllOrders}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {/* Accessible Cancellation Modal */}
            <SupplierCancelModal
              order={cancelModalOrder}
              isOpen={!!cancelModalOrder}
              onClose={() => setCancelModalOrder(null)}
              onConfirm={(reason) => handleCancelLeadConfirm(reason, s.msgLeadCancelled)}
              lang={lang}
            />

            {/* Accessible Top-Up Escrow Modal */}
            <SupplierTopUpModal
              isOpen={isTopUpModalOpen}
              onClose={() => setIsTopUpModalOpen(false)}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}

export default function SupplierDashboardPage() {
  return <SupplierDashboardView defaultTab="queue" isCallCenterOnly={false} />;
}
