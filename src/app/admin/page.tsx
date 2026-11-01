"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { Language } from "@/lib/locales";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Users,
  Receipt,
  RefreshCw,
  Search,
  ChevronRight,
  Sparkles,
  Lock,
  PackageCheck,
  Scale,
  Activity,
  TrendingUp,
  ArrowDownToLine,
} from "lucide-react";

import { apiGetAdminStats, apiGetPendingWithdrawals, AdminWithdrawal } from "@/lib/api-client";
import { WithdrawalActionModal, WithdrawalModalAction } from "@/components/admin/withdrawal-action-modal";

type MethodFilter = "ALL" | "BARIDIMOB" | "CCP" | "HIGH_PRIORITY";

const adminPageI18n = {
  fr: {
    title: "Vue d'ensemble",
    subtitle: "Trésorerie COD & File de Décaissement",
    telemetryWilayas: "DZ-58 WILAYAS",
    telemetryCouriers: "YALIDINE · ZR CONNECTÉS",
    telemetryMobile: "DZ-58 ● EN DIRECT",
    refreshBtn: "Actualiser",
    auditBtn: "Audit Escrow",
    retryBtn: "Réessayer",
    heroCard: {
      label: "Revenus Plateforme",
      badge: "20% SPREAD",
      footerLeft: "Marge brute sur livraisons confirmées",
      footerRight: "LEDGER VERIFIED",
    },
    escrowCard: {
      label: "Solde Escrow Fournisseurs",
      coverageMultiple: "Couverture",
      coverageRatio: "Ratio de solvabilité",
      liabilityLabel: "Passif affiliés :",
    },
    withdrawalsCard: {
      label: "Décaissements en Attente",
      pendingSuffix: "demande(s) à décaisser",
      railsTag: "RAILS: BARIDIMOB · CCP",
    },
    networkCard: {
      label: "Comptes Actifs",
      mediaBuyers: "Affiliés",
      suppliers: "Fournisseurs",
      volumeLabel: "Volume global :",
      leadsSuffix: "leads",
    },
    quickLaunch: {
      orders: "Commandes & Bordereaux",
      reconciliation: "Réconciliation",
      depositRequests: "Dépôts Fournisseurs",
      webhooks: "Webhooks Yalidine/ZR",
      users: "Gestion Utilisateurs",
    },
    queueSection: {
      title: "File des Décaissements",
      pendingBadge: "en attente",
    },
    filterToolbar: {
      all: "Tous",
      baridimob: "BaridiMob",
      ccp: "CCP Algérie Poste",
      highPriority: "≥ 20,000 DZD",
      searchPlaceholder: "Rechercher un affilié, email ou RIP...",
    },
    table: {
      thRef: "Réf",
      thBeneficiary: "Bénéficiaire",
      thMethod: "Mode & Coordonnées",
      thAmount: "Montant à Décaisser",
      thDate: "Date",
      thActions: "Décaissement",
      loading: "Chargement de la file...",
      emptyTitle: "Aucun décaissement en attente",
      emptyFilter: "Aucun résultat pour cette recherche.",
      emptyClear: "Tous les décaissements ont été régularisés.",
      btnReject: "Rejeter",
      btnApprove: "Valider Virement",
      tagPriority: "Prioritaire",
      allLink: "Historique complet des décaissements →",
    },
  },
  en: {
    title: "Overview",
    subtitle: "ViteDrop COD Treasury & Clearinghouse",
    telemetryWilayas: "DZ-58 WILAYAS",
    telemetryCouriers: "YALIDINE · ZR SYNCED",
    telemetryMobile: "DZ-58 ● LIVE",
    refreshBtn: "Refresh",
    auditBtn: "Escrow Audit",
    retryBtn: "Retry",
    heroCard: {
      label: "Platform Revenue",
      badge: "20% SPREAD",
      footerLeft: "Net courier delivery margin",
      footerRight: "LEDGER VERIFIED",
    },
    escrowCard: {
      label: "Supplier Escrow Balance",
      coverageMultiple: "Covered",
      coverageRatio: "Solvency Coverage",
      liabilityLabel: "Affiliate liabilities:",
    },
    withdrawalsCard: {
      label: "Pending Disbursements",
      pendingSuffix: "requests pending",
      railsTag: "RAILS: BARIDIMOB · CCP",
    },
    networkCard: {
      label: "Active Accounts",
      mediaBuyers: "Affiliates",
      suppliers: "Suppliers",
      volumeLabel: "Total volume:",
      leadsSuffix: "leads",
    },
    quickLaunch: {
      orders: "Orders & Waybills",
      reconciliation: "Reconciliation",
      depositRequests: "Supplier Deposit Slips",
      webhooks: "Courier Webhooks",
      users: "User Accounts",
    },
    queueSection: {
      title: "Disbursement Clearinghouse",
      pendingBadge: "pending",
    },
    filterToolbar: {
      all: "All",
      baridimob: "BaridiMob",
      ccp: "CCP Post",
      highPriority: "≥ 20,000 DZD",
      searchPlaceholder: "Search affiliate, email or RIP...",
    },
    table: {
      thRef: "Ref",
      thBeneficiary: "Beneficiary",
      thMethod: "Payment Rail & Details",
      thAmount: "Disbursement Amount",
      thDate: "Date",
      thActions: "Actions",
      loading: "Loading clearinghouse queue...",
      emptyTitle: "No pending disbursements",
      emptyFilter: "No results match the current filter.",
      emptyClear: "All affiliate disbursements have been processed.",
      btnReject: "Reject",
      btnApprove: "Approve Transfer",
      tagPriority: "Priority",
      allLink: "View complete clearinghouse archive →",
    },
  },
  ar: {
    title: "لوحة التحكم",
    subtitle: "خزينة الدفع عند الاستلام والتصفية المالية",
    telemetryWilayas: "58 ولاية",
    telemetryCouriers: "ربط ياليدين وZR نشط",
    telemetryMobile: "58 ولاية ● مباشر",
    refreshBtn: "تحديث",
    auditBtn: "تدقيق الضمان",
    retryBtn: "إعادة المحاولة",
    heroCard: {
      label: "أرباح المنصة المقتطعة",
      badge: "20% عمولة",
      footerLeft: "أرباح مؤكدة على الطرود المسلمة",
      footerRight: "القيد المزدوج: نشط",
    },
    escrowCard: {
      label: "رصيد الضمان المحجوز",
      coverageMultiple: "مستوى التغطية",
      coverageRatio: "نسبة السيولة المتاحة",
      liabilityLabel: "مستحقات المسوقين:",
    },
    withdrawalsCard: {
      label: "سحوبات قيد التحويل",
      pendingSuffix: "طلبات تنتظر التحويل",
      railsTag: "الوسائل: بريدي موب · CCP",
    },
    networkCard: {
      label: "الحسابات النشطة",
      mediaBuyers: "مسوق",
      suppliers: "مورد",
      volumeLabel: "إجمالي الطلبيات:",
      leadsSuffix: "طلبية",
    },
    quickLaunch: {
      orders: "الطلبيات والبوالص",
      reconciliation: "المطابقة المالية",
      depositRequests: "طلبات شحن الموردين",
      webhooks: "ربط شركات الشحن",
      users: "إدارة المستخدمين",
    },
    queueSection: {
      title: "سجل تصفية السحوبات",
      pendingBadge: "قيد المراجعة",
    },
    filterToolbar: {
      all: "الكل",
      baridimob: "BaridiMob",
      ccp: "بريد الجزائر CCP",
      highPriority: "أولوية (≥ 20 ألف دج)",
      searchPlaceholder: "البحث بالاسم، البريد أو رقم الحساب...",
    },
    table: {
      thRef: "المرجع",
      thBeneficiary: "المستفيد",
      thMethod: "وسيلة التحويل والبيانات",
      thAmount: "المبلغ المطلوب",
      thDate: "التاريخ",
      thActions: "إجراء التحويل",
      loading: "جار تحميل طلبات السحب...",
      emptyTitle: "لا توجد سحوبات معلقة",
      emptyFilter: "لا توجد نتائج تطابق البحث.",
      emptyClear: "تمت معالجة كافة السحوبات بنجاح.",
      btnReject: "رفض",
      btnApprove: "اعتماد التحويل",
      tagPriority: "أولوية",
      allLink: "الأرشيف الكامل للسحوبات ←",
    },
  },
};

export default function AdminDashboardPage() {
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawal | null>(null);
  const [modalAction, setModalAction] = useState<WithdrawalModalAction | null>(null);

  const loadData = async () => {
    try {
      const [statsData, withdrawalsData] = await Promise.all([
        apiGetAdminStats(),
        apiGetPendingWithdrawals(),
      ]);
      setStats((prev) => ({ ...prev, ...(statsData || {}) }));
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Impossible de charger les données.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    setError(null);
    void loadData();
  };

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  // Filtered withdrawals
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (w.fullName && w.fullName.toLowerCase().includes(q)) ||
        (w.userEmail && w.userEmail.toLowerCase().includes(q)) ||
        (w.id && w.id.toLowerCase().includes(q)) ||
        (w.recipientDetailsMasked && w.recipientDetailsMasked.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (methodFilter === "BARIDIMOB") {
        return w.method === "BARIDIMOB";
      }
      if (methodFilter === "CCP") {
        return w.method === "CCP";
      }
      if (methodFilter === "HIGH_PRIORITY") {
        return w.amount >= 20000;
      }
      return true;
    });
  }, [withdrawals, searchQuery, methodFilter]);

  const springTransition = { type: "spring", stiffness: 450, damping: 35 } as const;

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const currentLang: Language = (lang === "ar" || lang === "en" || lang === "fr") ? lang : "fr";
        const tr = adminPageI18n[currentLang];

        const solvencyMultiple =
          stats.totalAffiliateLiability > 0
            ? (stats.totalSupplierEscrow / stats.totalAffiliateLiability).toFixed(1)
            : "10.0";
        const solvencyRatio =
          stats.totalAffiliateLiability > 0
            ? Math.round((stats.totalSupplierEscrow / stats.totalAffiliateLiability) * 100)
            : 1000;

        return (
          <div className="space-y-6 text-start">
            {/* Header with Infrastructure Telemetry */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-1">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight">
                  {tr.title}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {tr.subtitle}
                </p>
              </div>

              {/* Controls and Telemetry */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Desktop/Tablet Telemetry Capsules */}
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-200/60 border border-[#e7e5df] text-neutral-700 text-xs font-mono font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                  <span>{tr.telemetryWilayas}</span>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#064e3b] text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                  <span>{tr.telemetryCouriers}</span>
                </div>

                {/* Mobile Compact Telemetry Capsule (390px) */}
                <div className="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-200/60 border border-[#e7e5df] text-neutral-700 text-[11px] font-mono font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                  <span>{tr.telemetryMobile}</span>
                </div>

                {/* Accessible Refresh Button (44px min touch target on mobile) */}
                <button
                  type="button"
                  onClick={refreshData}
                  disabled={isLoading}
                  aria-label={tr.refreshBtn}
                  className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#e7e5df] bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 transition-all hover:bg-stone-50 active:scale-95 disabled:cursor-wait disabled:opacity-60 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#064e3b] cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
                  <span className="hidden sm:inline">{tr.refreshBtn}</span>
                </button>

                {/* Primary Escrow Audit Action (Deep Racing Green + Gold) */}
                <Link
                  href="/admin/reconciliation"
                  className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#064e3b] text-amber-200 text-xs font-semibold hover:bg-[#085a44] transition-all shadow-xs active:scale-95 border border-[#0a5e47] focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <Scale className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                  <span>{tr.auditBtn}</span>
                </Link>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={refreshData}
                  className="w-fit rounded-full border border-rose-300 bg-white px-3.5 py-1 text-xs font-semibold transition-colors hover:bg-rose-100"
                >
                  {tr.retryBtn}
                </button>
              </motion.div>
            )}

            {/* 1. KPI GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: ViteDrop Signature Treasury (British Racing Green + Brushed Gold) */}
              <motion.div
                whileHover={{ y: -3, transition: springTransition }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#064e3b] via-[#07533f] to-[#043a2c] text-white p-5 border border-[#0a5e47] shadow-lg shadow-emerald-950/10 flex flex-col justify-between group"
              >
                {/* VD Monogram Watermark */}
                <span
                  className="absolute -right-2 -bottom-4 text-7xl font-bold font-mono text-white/[0.04] select-none pointer-events-none"
                  aria-hidden="true"
                >
                  VD
                </span>

                {/* Ambient Soft Gold / Emerald Glow */}
                <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-400/20 transition-all duration-500" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-emerald-200/90 tracking-wide">
                      {tr.heroCard.label}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold">
                      <Sparkles className="w-2.5 h-2.5 text-amber-300" aria-hidden="true" />
                      <span>{tr.heroCard.badge}</span>
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white mb-1">
                    {isLoading ? "—" : formatDZD(stats.platformRevenue, lang)}
                  </div>
                </div>

                <div className="relative z-10 pt-3 border-t border-emerald-800/80 flex items-center justify-between text-[11px] text-emerald-200 mt-2">
                  <span className="flex items-center gap-1 text-amber-300 font-medium truncate">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{tr.heroCard.footerLeft}</span>
                  </span>
                  <span className="font-mono text-emerald-300/80 text-[10px] shrink-0 ms-1">
                    {tr.heroCard.footerRight}
                  </span>
                </div>
              </motion.div>

              {/* Card 2: Escrow Buffer & Solvency */}
              <motion.div
                whileHover={{ y: -3, transition: springTransition }}
                className="relative overflow-hidden rounded-2xl bg-white p-5 border border-[#e7e5df] shadow-xs flex flex-col justify-between group hover:border-neutral-400/60 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-neutral-500">
                      {tr.escrowCard.label}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#064e3b] border border-emerald-100 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 mb-2">
                    {isLoading ? "—" : formatDZD(stats.totalSupplierEscrow, lang)}
                  </div>

                  {/* Solvency Gauge Hierarchy */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-neutral-500 font-sans">{tr.escrowCard.coverageRatio}</span>
                      <span className="font-bold text-[#064e3b]">{solvencyMultiple}× ({solvencyRatio}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full bg-[#064e3b] rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(solvencyRatio, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e7e5df] flex items-center justify-between text-[11px] text-neutral-500 mt-3">
                  <span>{tr.escrowCard.liabilityLabel}</span>
                  <span className="font-mono font-bold text-neutral-800">
                    {isLoading ? "—" : formatDZD(stats.totalAffiliateLiability, lang)}
                  </span>
                </div>

                <Link
                  href="/admin/deposit-requests"
                  className="pt-2.5 border-t border-[#e7e5df] flex items-center justify-between text-[11px] text-purple-700 font-semibold hover:text-purple-900 group transition-colors mt-2.5"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <ArrowDownToLine className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{lang === "ar" ? "معالجة بوالص شحن الموردين" : lang === "en" ? "Manage Supplier Deposit Slips" : "Gérer les bordereaux de dépôt"}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0 ms-1" />
                </Link>
              </motion.div>

              {/* Card 3: Pending Disbursements Clearinghouse */}
              <motion.div
                whileHover={{ y: -3, transition: springTransition }}
                className="relative overflow-hidden rounded-2xl bg-white p-5 border border-[#e7e5df] shadow-xs flex flex-col justify-between group hover:border-neutral-400/60 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-neutral-500">
                      {tr.withdrawalsCard.label}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center">
                      <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 mb-2">
                    {isLoading
                      ? "—"
                      : formatDZD(stats.pendingWithdrawalsAmount || stats.totalAffiliateLiability, lang)}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" aria-hidden="true" />
                    <span>
                      {isLoading ? "—" : stats.pendingWithdrawalsCount || withdrawals.length}{" "}
                      {tr.withdrawalsCard.pendingSuffix}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e7e5df] flex items-center justify-between text-[11px] text-neutral-500 mt-3">
                  <span className="font-mono text-neutral-700 font-semibold text-[10px]">
                    {tr.withdrawalsCard.railsTag}
                  </span>
                  <span className="font-mono text-amber-800 text-[10px] font-bold">DZ-POSTAL</span>
                </div>
              </motion.div>

              {/* Card 4: Network Scale */}
              <motion.div
                whileHover={{ y: -3, transition: springTransition }}
                className="relative overflow-hidden rounded-2xl bg-white p-5 border border-[#e7e5df] shadow-xs flex flex-col justify-between group hover:border-neutral-400/60 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-neutral-500">
                      {tr.networkCard.label}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-stone-100 text-neutral-700 border border-[#e7e5df] flex items-center justify-center">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-neutral-900 mb-2">
                    {isLoading ? "—" : `${stats.totalAffiliates + stats.totalSuppliers}`}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-neutral-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#064e3b]" aria-hidden="true" />
                      <strong className="text-neutral-900">{stats.totalAffiliates}</strong> {tr.networkCard.mediaBuyers}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-600" aria-hidden="true" />
                      <strong className="text-neutral-900">{stats.totalSuppliers}</strong> {tr.networkCard.suppliers}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e7e5df] flex items-center justify-between text-[11px] text-neutral-500 mt-3">
                  <span>{tr.networkCard.volumeLabel}</span>
                  <span className="font-mono font-bold text-neutral-800">
                    {isLoading ? "—" : (stats.totalOrders ?? 0).toLocaleString()} {tr.networkCard.leadsSuffix}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* 2. OPERATIONAL QUICK LAUNCH */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Link
                href="/admin/orders"
                className="group p-3.5 rounded-xl bg-white border border-[#e7e5df] hover:border-neutral-400/60 hover:shadow-xs transition-all flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#064e3b] border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <PackageCheck className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-900 truncate">
                    {tr.quickLaunch.orders}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all shrink-0 ms-1" />
              </Link>

              <Link
                href="/admin/deposit-requests"
                className="group p-3.5 rounded-xl bg-white border border-[#e7e5df] hover:border-purple-300 hover:shadow-xs transition-all flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-900 truncate">
                    {tr.quickLaunch.depositRequests}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all shrink-0 ms-1" />
              </Link>

              <Link
                href="/admin/reconciliation"
                className="group p-3.5 rounded-xl bg-white border border-[#e7e5df] hover:border-neutral-400/60 hover:shadow-xs transition-all flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 text-neutral-700 border border-[#e7e5df] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Scale className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-900 truncate">
                    {tr.quickLaunch.reconciliation}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all shrink-0 ms-1" />
              </Link>

              <Link
                href="/admin/webhooks"
                className="group p-3.5 rounded-xl bg-white border border-[#e7e5df] hover:border-neutral-400/60 hover:shadow-xs transition-all flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Activity className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-900 truncate">
                    {tr.quickLaunch.webhooks}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all shrink-0 ms-1" />
              </Link>

              <Link
                href="/admin/users"
                className="group p-3.5 rounded-xl bg-white border border-[#e7e5df] hover:border-neutral-400/60 hover:shadow-xs transition-all flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 text-neutral-700 border border-[#e7e5df] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-900 truncate">
                    {tr.quickLaunch.users}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all shrink-0 ms-1" />
              </Link>
            </div>

            {/* 3. DISBURSEMENT CLEARINGHOUSE */}
            <div className="space-y-3 pt-2">
              {/* Header & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e5df] pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-neutral-950">
                    {tr.queueSection.title}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono font-semibold">
                    {filteredWithdrawals.length} {tr.queueSection.pendingBadge}
                  </span>
                </div>

                {/* Postal Rail Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto max-w-full scrollbar-none py-0.5">
                  <div className="inline-flex items-center p-1 bg-stone-200/60 border border-[#e7e5df] rounded-full text-xs shrink-0 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setMethodFilter("ALL")}
                      className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                        methodFilter === "ALL"
                          ? "bg-white text-black shadow-2xs"
                          : "text-neutral-600 hover:text-black"
                      }`}
                    >
                      {tr.filterToolbar.all}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethodFilter("BARIDIMOB")}
                      className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                        methodFilter === "BARIDIMOB"
                          ? "bg-white text-cyan-900 shadow-2xs"
                          : "text-neutral-600 hover:text-black"
                      }`}
                    >
                      {tr.filterToolbar.baridimob}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethodFilter("CCP")}
                      className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                        methodFilter === "CCP"
                          ? "bg-white text-amber-900 shadow-2xs"
                          : "text-neutral-600 hover:text-black"
                      }`}
                    >
                      {tr.filterToolbar.ccp}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethodFilter("HIGH_PRIORITY")}
                      className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                        methodFilter === "HIGH_PRIORITY"
                          ? "bg-amber-100 text-amber-900 shadow-2xs"
                          : "text-neutral-600 hover:text-black"
                      }`}
                    >
                      {tr.filterToolbar.highPriority}
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tr.filterToolbar.searchPlaceholder}
                  className="w-full h-9 ps-9 pe-4 bg-white border border-[#e7e5df] rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all shadow-2xs"
                />
              </div>

              {/* Table Container with Explicit Horizontal Scroll (No Document Overflow) */}
              <div className="w-full overflow-x-auto rounded-2xl border border-[#e7e5df] bg-white shadow-xs">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow className="bg-stone-50/80 text-neutral-500 font-medium text-[11px] uppercase tracking-wider border-b border-[#e7e5df]">
                      <TableHead>{tr.table.thRef}</TableHead>
                      <TableHead>{tr.table.thBeneficiary}</TableHead>
                      <TableHead>{tr.table.thMethod}</TableHead>
                      <TableHead>{tr.table.thAmount}</TableHead>
                      <TableHead>{tr.table.thDate}</TableHead>
                      <TableHead className="text-end">{tr.table.thActions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-28 text-center text-neutral-500">
                          <span className="inline-flex items-center gap-2" aria-live="polite">
                            <RefreshCw className="h-4 w-4 animate-spin text-[#064e3b]" aria-hidden="true" />
                            {tr.table.loading}
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : filteredWithdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-neutral-500">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                            <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#064e3b] flex items-center justify-center border border-emerald-200/80">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-xs text-neutral-900">
                              {tr.table.emptyTitle}
                            </span>
                            <span className="text-[11px] text-[#6b6b6b]">
                              {searchQuery || methodFilter !== "ALL"
                                ? tr.table.emptyFilter
                                : tr.table.emptyClear}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWithdrawals.map((w) => {
                        const isBaridimob = w.method === "BARIDIMOB";
                        const isHighAmount = w.amount >= 20000;

                        return (
                          <TableRow key={w.id} className="group hover:bg-stone-50/70 transition-colors">
                            {/* Reference ID */}
                            <TableCell className="font-mono text-xs font-bold text-neutral-900">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-neutral-700 text-[11px]">
                                #{w.id.slice(0, 8)}
                              </span>
                            </TableCell>

                            {/* Beneficiary */}
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-50 to-stone-100 border border-[#e7e5df] flex items-center justify-center font-bold text-xs text-[#064e3b] shrink-0 select-none shadow-2xs">
                                  {(w.fullName || w.userEmail || "AF").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-xs text-neutral-950 tracking-tight leading-snug truncate">
                                    {w.fullName || "Media Buyer"}
                                  </span>
                                  <span className="text-[10px] text-[#6b6b6b] truncate">
                                    {w.userEmail || "—"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Payment Rail & Masked Details */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {isBaridimob ? (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" aria-hidden="true" />
                                    <span>BaridiMob</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                                    <span>CCP Algérie Poste</span>
                                  </div>
                                )}
                                <span className="font-mono text-xs text-neutral-600 tracking-wider">
                                  {w.recipientDetailsMasked || w.paymentReference || "—"}
                                </span>
                              </div>
                            </TableCell>

                            {/* Amount */}
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-sm font-bold text-neutral-950">
                                  {formatDZD(w.amount, lang)}
                                </span>
                                {isHighAmount && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                    {tr.table.tagPriority}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Date */}
                            <TableCell className="text-xs text-[#6b6b6b] font-mono">
                              {new Date(w.createdAt).toLocaleDateString(
                                currentLang === "ar" ? "ar-DZ" : currentLang === "en" ? "en-DZ" : "fr-DZ",
                                { day: "2-digit", month: "short", year: "numeric" }
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-end">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedWithdrawal(w);
                                    setModalAction("REJECT");
                                  }}
                                  className="text-[11px] px-2.5 py-1 h-7 rounded-lg shadow-2xs hover:bg-rose-100 active:scale-95 transition-all"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>{tr.table.btnReject}</span>
                                </Button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedWithdrawal(w);
                                    setModalAction("APPROVE");
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] px-3 py-1 h-7 rounded-lg font-semibold bg-[#064e3b] hover:bg-[#085a44] text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
                                  <span>{tr.table.btnApprove}</span>
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Footer Link */}
              <div className="flex justify-end pt-1">
                <Link
                  href="/admin/withdrawals"
                  className="text-xs font-semibold text-emerald-900 hover:text-emerald-950 hover:underline"
                >
                  {tr.table.allLink}
                </Link>
              </div>
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
                onSuccess={refreshData}
                lang={currentLang}
              />
            )}
          </div>
        );
      }}
    </DashboardLayout>
  );
}
