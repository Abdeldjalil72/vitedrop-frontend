"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, apiGetMyWallet, apiGetAdminStats } from "@/lib/api-client";
import { UserRole } from "@/types";
import { Language, isRTL } from "@/lib/locales";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface DashboardLayoutProps {
  children: (props: {
    role: UserRole;
    lang: Language;
    setRole: (r: UserRole) => void;
    setLang: (l: Language) => void;
    balance?: number;
    setBalance?: (b: number) => void;
  }) => React.ReactNode;
  initialRole?: UserRole;
  initialLang?: Language;
}

type AuthStatus = "checking" | "authorized" | "redirecting";

function getDefaultRoleBalance(r: string): number {
  switch (r.toLowerCase()) {
    case "affiliate":
      return 1200;
    case "supplier":
    case "call_center_agent":
      return 8500;
    case "admin":
      return 1890000;
    default:
      return 0;
  }
}

function getRoleDashboardPath(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "SUPPLIER":
    case "CALL_CENTER_AGENT":
      return "/supplier";
    case "AFFILIATE":
    default:
      return "/affiliate";
  }
}

export function DashboardLayout({
  children,
  initialRole = "affiliate",
  initialLang = "fr",
}: DashboardLayoutProps) {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [lang, setLang] = useState<Language>(initialLang);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(getRoleDashboardPath(initialRole.toUpperCase()));
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [balance, setBalance] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("vitedrop_wallet_balance");
        if (cached !== null && !isNaN(Number(cached))) {
          const num = Number(cached);
          if (initialRole.toLowerCase() === "affiliate" && num === 14500) {
            return 1200;
          }
          return num;
        }
      } catch {}
    }
    return getDefaultRoleBalance(initialRole);
  });
  const router = useRouter();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncSidebarState = () => {
      if (mediaQuery.matches) {
        try {
          const saved = localStorage.getItem("vitedrop_sidebar_desktop");
          setIsSidebarOpen(saved !== null ? saved === "true" : true);
        } catch {
          setIsSidebarOpen(true);
        }
      } else {
        setIsSidebarOpen(false);
      }
    };

    syncSidebarState();
    mediaQuery.addEventListener("change", syncSidebarState);
    return () => mediaQuery.removeEventListener("change", syncSidebarState);
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setAuthStatus("redirecting");
      router.replace("/login");
      return;
    }

    const expectedRole = initialRole.toUpperCase();
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isSpecialAdminExemption = user.role === "ADMIN" && searchParams?.get("from") === "admin";

    const isMatchingRole =
      user.role === expectedRole ||
      isSpecialAdminExemption ||
      (expectedRole === "SUPPLIER" && user.role === "CALL_CENTER_AGENT");

    if (!isMatchingRole) {
      setAuthStatus("redirecting");
      router.replace(getRoleDashboardPath(user.role));
      return;
    }

    setAuthStatus("authorized");
  }, [router, initialRole]);

  useEffect(() => {
    const handleUnauthorized = (e: any) => {
      e.preventDefault();
      const returnUrl = e?.detail?.returnUrl || window.location.pathname;
      router.replace(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    };
    window.addEventListener("vitedrop:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("vitedrop:unauthorized", handleUnauthorized);
  }, [router]);

  useEffect(() => {
    const syncLang = () => {
      try {
        const saved = localStorage.getItem("vitedrop_lang") as Language;
        if (saved && (saved === "fr" || saved === "ar" || saved === "en")) {
          setLang(saved);
        }
      } catch (e) {}
    };

    syncLang();
    window.addEventListener("vitedrop_lang_changed", syncLang);
    window.addEventListener("storage", syncLang);
    return () => {
      window.removeEventListener("vitedrop_lang_changed", syncLang);
      window.removeEventListener("storage", syncLang);
    };
  }, []);

  useEffect(() => {
    const handleBalanceUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        setBalance(customEvent.detail);
        try {
          localStorage.setItem("vitedrop_wallet_balance", String(customEvent.detail));
        } catch {}
      }
    };
    window.addEventListener("vitedrop_balance_updated", handleBalanceUpdate);
    return () => {
      window.removeEventListener("vitedrop_balance_updated", handleBalanceUpdate);
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "authorized") return;
    const fetchBalance = async () => {
      const user = getCurrentUser();
      const effectiveRole = user?.role ? user.role.toLowerCase() : role;
      try {
        if (effectiveRole === "admin" || user?.role === "ADMIN") {
          const stats = await apiGetAdminStats();
          const val = Number(stats?.platformRevenue ?? 1890000);
          setBalance(val);
          try {
            localStorage.setItem("vitedrop_wallet_balance", String(val));
          } catch {}
        } else {
          const wallet = await apiGetMyWallet();
          if (wallet && wallet.balance !== undefined && !isNaN(Number(wallet.balance))) {
            const num = Number(wallet.balance);
            setBalance(num);
            try {
              localStorage.setItem("vitedrop_wallet_balance", String(num));
            } catch {}
          } else {
            const fallback = getDefaultRoleBalance(effectiveRole);
            setBalance(fallback);
          }
        }
      } catch (err) {
        console.warn("Could not fetch user wallet balance for Topbar", err);
        const fallback = getDefaultRoleBalance(effectiveRole);
        setBalance(fallback);
      }
    };
    fetchBalance();
  }, [authStatus, role]);

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
    try {
      localStorage.setItem("vitedrop_wallet_balance", String(newBalance));
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vitedrop_balance_updated", { detail: newBalance }));
    }
  };

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem("vitedrop_lang", newLang);
      window.dispatchEvent(new Event("vitedrop_lang_changed"));
    } catch (e) {}
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === "affiliate") setCurrentPath("/affiliate");
    if (newRole === "supplier") setCurrentPath("/supplier");
    if (newRole === "admin") setCurrentPath("/admin");
  };

  const rtl = isRTL(lang);

  if (authStatus !== "authorized") {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      data-dashboard-role={role}
      className={`dashboard-ui min-h-screen ${
        role === "admin" ? "bg-[#f8f7f4]" : "bg-[#fafafa]"
      } flex antialiased text-neutral-900 w-full max-w-full overflow-x-clip`}
    >
      {/* Sidebar */}
      <Sidebar
        role={role}
        lang={lang}
        isOpen={isSidebarOpen}
        isRtl={rtl}
        onClose={() => setIsSidebarOpen(false)}
        activePath={currentPath}
        onNavigate={(p) => {
          setCurrentPath(p);
          if (typeof window !== "undefined" && window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
          router.push(p);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-clip">
        <Topbar
          role={role}
          balance={balance}
          onRoleChange={handleRoleChange}
          lang={lang}
          onLangChange={handleLangChange}
          onOpenMobileMenu={() => {
            setIsSidebarOpen((open) => {
              const next = !open;
              if (typeof window !== "undefined" && window.innerWidth >= 768) {
                try {
                  localStorage.setItem("vitedrop_sidebar_desktop", String(next));
                } catch (e) {}
              }
              return next;
            });
          }}
        />

        <main className="flex-1 px-3 py-4 sm:p-6 lg:p-8 max-w-7xl 2xl:max-w-[1640px] w-full min-w-0 mx-auto">
          {children({
            role,
            lang,
            setRole: handleRoleChange,
            setLang: handleLangChange,
            balance,
            setBalance: updateBalance,
          })}
        </main>
      </div>
    </div>
  );
}
