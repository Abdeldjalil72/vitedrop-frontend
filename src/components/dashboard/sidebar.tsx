"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { removeAuthToken } from "@/lib/api-client";
import { UserRole } from "@/types";
import { Language, translations } from "@/lib/locales";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
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

export function Sidebar({
  role,
  lang,
  isOpen,
  isRtl,
  onClose,
  activePath,
  onNavigate,
}: SidebarProps) {
  const t = translations[lang];
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncViewport = () => setIsDesktop(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  const affiliateNav: NavItem[] = [
    {
      id: "overview",
      label: t.dashboard.title,
      href: "/affiliate",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "marketplace",
      label: t.nav.marketplace,
      href: "/affiliate/marketplace",
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: "HOT",
    },
    {
      id: "leads",
      label: t.nav.leads,
      href: "/affiliate/leads",
      icon: <ListOrdered className="w-4 h-4" />,
    },
    {
      id: "links",
      label: t.nav.links,
      href: "/affiliate/links",
      icon: <Link2 className="w-4 h-4" />,
    },
    {
      id: "wallet",
      label: t.nav.wallet,
      href: "/affiliate/wallet",
      icon: <Wallet className="w-4 h-4" />,
    },
    {
      id: "settings",
      label: t.nav.settings,
      href: "/affiliate/settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const supplierNav: NavItem[] = [
    {
      id: "supplier-queue",
      label: t.nav.supplierDashboard,
      href: "/supplier",
      icon: <Headphones className="w-4 h-4" />,
      badge: "3 New",
    },
    {
      id: "supplier-products",
      label: t.nav.supplierProducts,
      href: "/supplier/products",
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: "supplier-orders",
      label: t.nav.supplierOrders,
      href: "/supplier/orders",
      icon: <Truck className="w-4 h-4" />,
    },
    {
      id: "supplier-wallet",
      label: t.nav.wallet,
      href: "/supplier/wallet",
      icon: <Wallet className="w-4 h-4" />,
    },
  ];

  const adminNav: NavItem[] = [
    {
      id: "admin-overview",
      label: t.nav.adminOverview,
      href: "/admin",
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: "admin-withdrawals",
      label: t.nav.adminWithdrawals,
      href: "/admin/withdrawals",
      icon: <Wallet className="w-4 h-4" />,
    },
    {
      id: "admin-orders",
      label: t.nav.adminOrders,
      href: "/admin/orders",
      icon: <Truck className="w-4 h-4" />,
    },
    {
      id: "admin-products",
      label: t.nav.adminProducts,
      href: "/admin/products",
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: "admin-reconciliation",
      label: t.nav.adminReconciliation,
      href: "/admin/reconciliation",
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: "admin-webhooks",
      label: t.nav.adminWebhooks,
      href: "/admin/webhooks",
      icon: <Radio className="w-4 h-4" />,
    },
    {
      id: "admin-agents",
      label: t.nav.adminAgents,
      href: "/admin/agents",
      icon: <Headphones className="w-4 h-4" />,
    },
    {
      id: "admin-users",
      label: t.nav.adminUsers,
      href: "/admin/users",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "admin-audit-log",
      label: t.nav.adminAuditLog,
      href: "/admin/audit-log",
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  const navItems =
    role === "affiliate" ? affiliateNav : role === "supplier" ? supplierNav : adminNav;

  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  const currentPath = pathname || activePath || (role === "affiliate" ? "/affiliate" : role === "supplier" ? "/supplier" : "/admin");

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden"
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
        className={`fixed inset-y-0 start-0 z-50 w-[min(18rem,calc(100vw-2rem))] bg-white border-e border-black/[0.08] flex flex-col justify-between overflow-hidden transition-[width] duration-300 md:static ${
          isOpen
            ? "translate-x-0 md:w-64"
            : `${isRtl ? "translate-x-full" : "-translate-x-full"} md:translate-x-0 md:w-0 md:border-transparent`
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Header */}
          <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-black/[0.06] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#2563eb] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-500/20">
                VD
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-neutral-900 leading-none">
                  ViteDrop
                </span>
                <span className="text-[10px] text-[#6b6b6b] font-medium tracking-tight">
                  Algerian COD Network
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-black md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role badge */}
          <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-black/[0.04] bg-[#fafafa]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b6b6b] block">
              {t.roles[role]}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-2.5 py-3 sm:px-3 sm:py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    if (onNavigate) onNavigate(item.href);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 min-h-[40px] rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#f4f4f4] text-neutral-950 font-bold shadow-xs"
                      : "text-[#6b6b6b] hover:text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className={`shrink-0 ${isActive ? "text-[#0284c7]" : "text-neutral-400"}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-sky-100 text-sky-800 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer info: VIP Status & Logout */}
          <div className="p-3 m-2 sm:m-3 space-y-2 border-t border-black/[0.06] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="p-3 rounded-2xl bg-[#fafafa] border border-black/[0.04] flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#17c964] animate-pulse" />
              </div>
              <div className="flex flex-col text-start">
                <span className="text-xs font-semibold text-neutral-900">
                  VIP Manager DZ
                </span>
                <span className="text-[11px] text-[#6b6b6b] font-mono">
                  WhatsApp: +213 550 00 00
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50/70 transition-all cursor-pointer text-start"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>{t.common.logout}</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
