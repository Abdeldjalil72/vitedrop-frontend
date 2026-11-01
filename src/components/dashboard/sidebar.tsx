"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  ListOrdered,
  Link2,
  Wallet,
  Settings,
  Headphones,
  Package,
  Truck,
  ShieldCheck,
  TrendingUp,
  X,
  Store,
  Users,
  LogOut,
  Receipt,
  Radio,
  FileText,
  ArrowDownToLine,
} from "lucide-react";
import { removeAuthToken } from "@/lib/api-client";
import { UserRole } from "@/types";
import { Language, translations } from "@/lib/locales";

export type NavColorTheme =
  | "sky"
  | "emerald"
  | "indigo"
  | "amber"
  | "purple"
  | "cyan"
  | "teal"
  | "blue"
  | "rose"
  | "slate";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  colorTheme?: NavColorTheme;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

interface SidebarProps {
  role: UserRole;
  lang: Language;
  isOpen: boolean;
  isRtl: boolean;
  onClose: () => void;
  activePath?: string;
  onNavigate?: (path: string) => void;
}

const colorThemeStyles: Record<
  NavColorTheme,
  {
    iconActive: string;
    iconInactiveHover: string;
    iconBoxActive: string;
    iconBoxHover: string;
    indicatorGradient: string;
    badgeStyle: string;
  }
> = {
  sky: {
    iconActive: "text-sky-600",
    iconInactiveHover: "group-hover:text-sky-600",
    iconBoxActive: "bg-sky-50 text-sky-600 border-sky-200/80",
    iconBoxHover: "group-hover:bg-sky-50/80 group-hover:text-sky-600",
    indicatorGradient: "from-sky-500 via-sky-600 to-blue-600",
    badgeStyle: "bg-sky-100 text-sky-800 border-sky-300/60",
  },
  emerald: {
    iconActive: "text-emerald-700",
    iconInactiveHover: "group-hover:text-emerald-700",
    iconBoxActive: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
    iconBoxHover: "group-hover:bg-emerald-50/80 group-hover:text-emerald-700",
    indicatorGradient: "from-emerald-600 via-teal-600 to-emerald-700",
    badgeStyle: "bg-emerald-100 text-emerald-900 border-emerald-300/60",
  },
  indigo: {
    iconActive: "text-indigo-600",
    iconInactiveHover: "group-hover:text-indigo-600",
    iconBoxActive: "bg-indigo-50 text-indigo-600 border-indigo-200/80",
    iconBoxHover: "group-hover:bg-indigo-50/80 group-hover:text-indigo-600",
    indicatorGradient: "from-indigo-500 via-indigo-600 to-purple-600",
    badgeStyle: "bg-indigo-100 text-indigo-800 border-indigo-300/60",
  },
  amber: {
    iconActive: "text-amber-600",
    iconInactiveHover: "group-hover:text-amber-600",
    iconBoxActive: "bg-amber-50 text-amber-700 border-amber-200/80",
    iconBoxHover: "group-hover:bg-amber-50/80 group-hover:text-amber-700",
    indicatorGradient: "from-amber-500 via-amber-600 to-orange-500",
    badgeStyle: "bg-amber-100 text-amber-900 border-amber-300/60",
  },
  purple: {
    iconActive: "text-purple-600",
    iconInactiveHover: "group-hover:text-purple-600",
    iconBoxActive: "bg-purple-50 text-purple-700 border-purple-200/80",
    iconBoxHover: "group-hover:bg-purple-50/80 group-hover:text-purple-700",
    indicatorGradient: "from-purple-500 via-purple-600 to-violet-600",
    badgeStyle: "bg-purple-100 text-purple-800 border-purple-300/60",
  },
  cyan: {
    iconActive: "text-cyan-600",
    iconInactiveHover: "group-hover:text-cyan-600",
    iconBoxActive: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
    iconBoxHover: "group-hover:bg-cyan-50/80 group-hover:text-cyan-700",
    indicatorGradient: "from-cyan-500 via-cyan-600 to-sky-600",
    badgeStyle: "bg-cyan-100 text-cyan-800 border-cyan-300/60",
  },
  teal: {
    iconActive: "text-teal-600",
    iconInactiveHover: "group-hover:text-teal-600",
    iconBoxActive: "bg-teal-50 text-teal-700 border-teal-200/80",
    iconBoxHover: "group-hover:bg-teal-50/80 group-hover:text-teal-700",
    indicatorGradient: "from-teal-500 via-teal-600 to-emerald-600",
    badgeStyle: "bg-teal-100 text-teal-800 border-teal-300/60",
  },
  blue: {
    iconActive: "text-blue-600",
    iconInactiveHover: "group-hover:text-blue-600",
    iconBoxActive: "bg-blue-50 text-blue-700 border-blue-200/80",
    iconBoxHover: "group-hover:bg-blue-50/80 group-hover:text-blue-700",
    indicatorGradient: "from-blue-500 via-blue-600 to-indigo-600",
    badgeStyle: "bg-blue-100 text-blue-800 border-blue-300/60",
  },
  rose: {
    iconActive: "text-rose-600",
    iconInactiveHover: "group-hover:text-rose-600",
    iconBoxActive: "bg-rose-50 text-rose-700 border-rose-200/80",
    iconBoxHover: "group-hover:bg-rose-50/80 group-hover:text-rose-700",
    indicatorGradient: "from-rose-500 via-rose-600 to-red-600",
    badgeStyle: "bg-rose-100 text-rose-800 border-rose-300/60",
  },
  slate: {
    iconActive: "text-neutral-800",
    iconInactiveHover: "group-hover:text-neutral-900",
    iconBoxActive: "bg-neutral-100 text-neutral-800 border-neutral-200",
    iconBoxHover: "group-hover:bg-neutral-100 group-hover:text-neutral-900",
    indicatorGradient: "from-neutral-700 via-neutral-800 to-neutral-900",
    badgeStyle: "bg-neutral-100 text-neutral-800 border-neutral-300/60",
  },
};

const sidebarI18n = {
  fr: {
    adminSections: {
      treasury: "Trésorerie & Escrow",
      operations: "Opérations COD",
      governance: "Gouvernance & Réseau",
    },
    affiliateSections: {
      performance: "Performance & Trafic",
      management: "Gestion & Finance",
    },
    supplierSections: {
      operations: "Opérations Call Center",
      catalog: "Catalogue & Trésorerie",
    },
    roles: {
      admin: "Super Admin",
      supplier: "Fournisseur COD",
      affiliate: "Media Buyer",
      agent: "Agent Call Center",
    },
    footerAdminTitle: "Node Algiers • Escrow OK",
    footerAdminSub: "Double-Entry Ledger Vérifié",
    footerVipTitle: "VIP Manager DZ",
    footerVipSub: "WhatsApp Support Actif",
  },
  en: {
    adminSections: {
      treasury: "Treasury & Escrow",
      operations: "COD Operations",
      governance: "Governance & Network",
    },
    affiliateSections: {
      performance: "Performance & Traffic",
      management: "Management & Finance",
    },
    supplierSections: {
      operations: "Call Center Operations",
      catalog: "Catalog & Escrow",
    },
    roles: {
      admin: "Super Admin",
      supplier: "COD Supplier",
      affiliate: "Media Buyer",
      agent: "Call Center Agent",
    },
    footerAdminTitle: "Node Algiers • Escrow OK",
    footerAdminSub: "Double-Entry Ledger Verified",
    footerVipTitle: "VIP Manager DZ",
    footerVipSub: "WhatsApp Support Active",
  },
  ar: {
    adminSections: {
      treasury: "الخزينة والضمان المالي",
      operations: "العمليات اللوجستية والشحن",
      governance: "الحوكمة والشبكة",
    },
    affiliateSections: {
      performance: "الأداء والعروض",
      management: "الإدارة والمالية",
    },
    supplierSections: {
      operations: "مركز الاتصال والشحن",
      catalog: "المنتجات والضمان",
    },
    roles: {
      admin: "المسؤول العام",
      supplier: "مورّد معتمد",
      affiliate: "مسوق (Media Buyer)",
      agent: "وكيل مركز الاتصال",
    },
    footerAdminTitle: "خادم الجزائر • الضمان نشط",
    footerAdminSub: "سجل القيد المزدوج مؤكد",
    footerVipTitle: "مدير الحسابات VIP",
    footerVipSub: "دعم واتساب نشط ومتاح",
  },
};

export function Sidebar({
  role,
  lang,
  isOpen,
  isRtl,
  onClose,
  activePath,
  onNavigate,
}: SidebarProps) {
  const currentLang = (lang === "ar" || lang === "en" || lang === "fr") ? lang : "fr";
  const t = translations[currentLang];
  const tr = sidebarI18n[currentLang];

  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncViewport = () => setIsDesktop(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  // Sections definition with context-driven color identity
  const affiliateSections: NavSection[] = [
    {
      title: tr.affiliateSections.performance,
      items: [
        {
          id: "overview",
          label: t.dashboard.title,
          href: "/affiliate",
          icon: <TrendingUp className="w-4 h-4" />,
          colorTheme: "sky",
        },
        {
          id: "marketplace",
          label: t.nav.marketplace,
          href: "/affiliate/marketplace",
          icon: <ShoppingBag className="w-4 h-4" />,
          badge: "HOT",
          colorTheme: "rose",
        },
        {
          id: "links",
          label: t.nav.links,
          href: "/affiliate/links",
          icon: <Link2 className="w-4 h-4" />,
          colorTheme: "indigo",
        },
      ],
    },
    {
      title: tr.affiliateSections.management,
      items: [
        {
          id: "leads",
          label: t.nav.leads,
          href: "/affiliate/leads",
          icon: <ListOrdered className="w-4 h-4" />,
          colorTheme: "amber",
        },
        {
          id: "wallet",
          label: t.nav.wallet,
          href: "/affiliate/wallet",
          icon: <Wallet className="w-4 h-4" />,
          colorTheme: "emerald",
        },
        {
          id: "settings",
          label: t.nav.settings,
          href: "/affiliate/settings",
          icon: <Settings className="w-4 h-4" />,
          colorTheme: "slate",
        },
      ],
    },
  ];

  const supplierSections: NavSection[] = [
    {
      title: tr.supplierSections.operations,
      items: [
        {
          id: "supplier-queue",
          label: t.nav.supplierDashboard,
          href: "/supplier",
          icon: <Headphones className="w-4 h-4" />,
          badge: "3 New",
          colorTheme: "amber",
        },
        {
          id: "supplier-orders",
          label: t.nav.supplierOrders,
          href: "/supplier/orders",
          icon: <Truck className="w-4 h-4" />,
          colorTheme: "sky",
        },
      ],
    },
    {
      title: tr.supplierSections.catalog,
      items: [
        {
          id: "supplier-products",
          label: t.nav.supplierProducts,
          href: "/supplier/products",
          icon: <Package className="w-4 h-4" />,
          colorTheme: "purple",
        },
        {
          id: "supplier-wallet",
          label: t.nav.wallet,
          href: "/supplier/wallet",
          icon: <Wallet className="w-4 h-4" />,
          colorTheme: "emerald",
        },
        {
          id: "supplier-settings",
          label: t.nav.supplierSettings,
          href: "/supplier/settings",
          icon: <Settings className="w-4 h-4" />,
          colorTheme: "slate",
        },
      ],
    },
  ];

  const adminSections: NavSection[] = [
    {
      title: tr.adminSections.treasury,
      items: [
        {
          id: "admin-overview",
          label: t.nav.adminOverview,
          href: "/admin",
          icon: <ShieldCheck className="w-4 h-4" />,
          colorTheme: "emerald", // Platform overview / British Racing Green Treasury
        },
        {
          id: "admin-withdrawals",
          label: t.nav.adminWithdrawals,
          href: "/admin/withdrawals",
          icon: <Wallet className="w-4 h-4" />,
          colorTheme: "emerald", // Banking cash disbursements (CCP / BaridiMob)
        },
        {
          id: "admin-deposit-requests",
          label: t.nav.adminDepositRequests,
          href: "/admin/deposit-requests",
          icon: <ArrowDownToLine className="w-4 h-4" />,
          colorTheme: "purple", // Supplier escrow top-up deposits
        },
        {
          id: "admin-reconciliation",
          label: t.nav.adminReconciliation,
          href: "/admin/reconciliation",
          icon: <Receipt className="w-4 h-4" />,
          colorTheme: "indigo", // Accounting ledger reconciliation
        },
      ],
    },
    {
      title: tr.adminSections.operations,
      items: [
        {
          id: "admin-orders",
          label: t.nav.adminOrders,
          href: "/admin/orders",
          icon: <Truck className="w-4 h-4" />,
          colorTheme: "amber", // Shipping logistics & deliveries
        },
        {
          id: "admin-products",
          label: t.nav.adminProducts,
          href: "/admin/products",
          icon: <Package className="w-4 h-4" />,
          colorTheme: "purple", // Product catalog & supplier inventory
        },
        {
          id: "admin-webhooks",
          label: t.nav.adminWebhooks,
          href: "/admin/webhooks",
          icon: <Radio className="w-4 h-4" />,
          colorTheme: "cyan", // Real-time courier API signals
        },
      ],
    },
    {
      title: tr.adminSections.governance,
      items: [
        {
          id: "admin-agents",
          label: t.nav.adminAgents,
          href: "/admin/agents",
          icon: <Headphones className="w-4 h-4" />,
          colorTheme: "teal", // Call center agents & support
        },
        {
          id: "admin-users",
          label: t.nav.adminUsers,
          href: "/admin/users",
          icon: <Users className="w-4 h-4" />,
          colorTheme: "blue", // User accounts & role management
        },
        {
          id: "admin-audit-log",
          label: t.nav.adminAuditLog,
          href: "/admin/audit-log",
          icon: <FileText className="w-4 h-4" />,
          colorTheme: "rose", // Security audit trail & critical logs
        },
        {
          id: "admin-settings",
          label: t.nav.adminSettings,
          href: "/admin/settings",
          icon: <Settings className="w-4 h-4" />,
          colorTheme: "slate",
        },
      ],
    },
  ];

  const navSections =
    role === "affiliate"
      ? affiliateSections
      : role === "supplier"
      ? supplierSections
      : adminSections;

  const currentPath =
    pathname ||
    activePath ||
    (role === "affiliate" ? "/affiliate" : role === "supplier" ? "/supplier" : "/admin");

  const handleItemClick = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    }
    // CRITICAL BUGFIX: Never close sidebar on desktop viewports!
    if (!isDesktop) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && !isDesktop && (
          <motion.div
            key="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar container */}
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop ? 0 : isOpen ? 0 : isRtl ? "100%" : "-100%",
        }}
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{ willChange: "transform" }}
        className={`fixed inset-y-0 start-0 z-50 w-[min(18rem,calc(100vw-2rem))] bg-white border-e ${
          role === "admin" ? "border-[#e7e5df]" : "border-black/[0.08]"
        } flex flex-col justify-between overflow-hidden transition-[width] duration-300 md:static ${
          isOpen
            ? "translate-x-0 md:w-64"
            : `${isRtl ? "translate-x-full" : "-translate-x-full"} md:translate-x-0 md:w-0 md:border-transparent`
        }`}
      >
        <div className={`flex flex-col h-full ${
          role === "admin"
            ? "bg-gradient-to-b from-white via-[#fdfdfc] to-[#f8f7f4]"
            : "bg-gradient-to-b from-white via-white to-[#fafafa]"
        }`}>
          {/* Logo & Header */}
          <div className={`h-14 sm:h-16 px-4 sm:px-5 border-b ${
            role === "admin" ? "border-[#e7e5df]" : "border-black/[0.06]"
          } flex items-center justify-between shrink-0`}>
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#2563eb] flex items-center justify-center text-white font-bold text-xs shadow-md shadow-sky-500/20 group-hover:shadow-sky-500/35 transition-all">
                VD
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif-luxury text-xl font-semibold italic tracking-[-0.08em] text-neutral-950 leading-none">
                  ViteDrop
                </span>
                <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200/80">
                  COD
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 md:hidden cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Identity Badge Strip */}
          <div className={`px-4 sm:px-5 py-2.5 border-b ${
            role === "admin"
              ? "border-[#e7e5df] bg-[#fbfaf8]/80"
              : "border-black/[0.04] bg-[#fafafa]/80"
          } flex items-center justify-between shrink-0`}>
            {role === "admin" ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>{tr.roles.admin}</span>
              </div>
            ) : role === "supplier" ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">
                <Store className="w-3.5 h-3.5 text-purple-600" />
                <span>{tr.roles.supplier}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs">
                <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                <span>{tr.roles.affiliate}</span>
              </div>
            )}

            <span className={`text-[10px] font-mono ${
              role === "admin"
                ? "text-neutral-500 bg-stone-100/90 px-1.5 py-0.5 rounded border border-[#e7e5df]"
                : "text-neutral-400"
            }`}>
              DZ-58
            </span>
          </div>

          {/* Categorized Navigation Links with Context-Driven Color Highlights */}
          <nav className="flex-1 px-2.5 py-3 sm:px-3 sm:py-3.5 space-y-4 overflow-y-auto">
            {navSections.map((section, sIdx) => (
              <div key={section.title || sIdx} className="space-y-1">
                {section.title && (
                  <div className="px-3 pt-1 pb-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold select-none text-start">
                    {section.title}
                  </div>
                )}

                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = currentPath === item.href;
                    const themeKey = item.colorTheme || "sky";
                    const theme = colorThemeStyles[themeKey];

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => handleItemClick(item.href)}
                        className={`relative w-full flex items-center justify-between px-2.5 py-1.5 min-h-[38px] rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                          isActive
                            ? "text-neutral-950 font-bold"
                            : "text-[#6b6b6b] hover:text-neutral-950 hover:bg-neutral-50"
                        }`}
                      >
                        {/* Active Sliding Background Pill (Spring Physics) */}
                        {isActive && (
                          <motion.div
                            layoutId="active-sidebar-pill"
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                            className={`absolute inset-0 rounded-xl z-0 border shadow-2xs ${
                              role === "admin"
                                ? "bg-white border-[#e7e5df] shadow-xs"
                                : "bg-neutral-100/90 border-black/[0.04]"
                            }`}
                          />
                        )}

                        {/* Active Contextual Leading Edge Accent Bar */}
                        {isActive && (
                          <motion.span
                            layoutId="active-sidebar-indicator"
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                            className={`absolute start-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b ${theme.indicatorGradient} z-10`}
                          />
                        )}

                        <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                          {/* Contextual Icon Micro-Badge */}
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                              isActive
                                ? `${theme.iconBoxActive} border shadow-2xs`
                                : `text-neutral-400 ${theme.iconInactiveHover} ${theme.iconBoxHover}`
                            }`}
                          >
                            {item.icon}
                          </div>

                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`relative z-10 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold border shrink-0 ${theme.badgeStyle}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Contextual Status Footer & Logout */}
          <div className={`p-3 border-t ${
            role === "admin"
              ? "border-[#e7e5df] bg-[#fbfaf8]/70"
              : "border-black/[0.06] bg-white/50"
          } space-y-2.5 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]`}>
            {/* Role Contextual Widget */}
            {role === "admin" ? (
              <div className="p-2.5 rounded-xl bg-[#06241b] text-emerald-50 border border-emerald-900/60 shadow-2xs flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="flex flex-col text-start min-w-0">
                  <span className="text-[11px] font-semibold text-white truncate">
                    {tr.footerAdminTitle}
                  </span>
                  <span className="text-[9px] text-emerald-300/80 font-mono truncate">
                    {tr.footerAdminSub}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#fafafa] border border-black/[0.06] flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0">
                  <Headphones className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-start min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-semibold text-neutral-900 truncate">
                      {tr.footerVipTitle}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#6b6b6b] font-mono truncate">
                    {tr.footerVipSub}
                  </span>
                </div>
              </div>
            )}

            {/* Logout Trigger */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-rose-700 hover:bg-rose-50/70 border border-transparent hover:border-rose-200/60 transition-all cursor-pointer group active:scale-98"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5 text-neutral-400 group-hover:text-rose-600 transition-colors" />
                <span>{t.common.logout}</span>
              </div>
              <span className="text-[10px] text-neutral-400 group-hover:text-rose-600 font-mono">
                ESC
              </span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
