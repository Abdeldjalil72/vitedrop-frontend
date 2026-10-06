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
  }) => React.ReactNode;
  initialRole?: UserRole;
  initialLang?: Language;
}

type AuthStatus = "checking" | "authorized" | "redirecting";

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
  const [balance, setBalance] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncSidebarState = () => setIsSidebarOpen(mediaQuery.matches);

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
    const isMatchingRole =
      user.role === expectedRole ||
      (expectedRole === "SUPPLIER" && user.role === "CALL_CENTER_AGENT");

    if (!isMatchingRole) {
      setAuthStatus("redirecting");
      router.replace(getRoleDashboardPath(user.role));
      return;
    }

    setAuthStatus("authorized");
  }, [router, initialRole]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vitedrop_lang") as Language;
      if (saved && (saved === "fr" || saved === "ar" || saved === "en")) {
        setLang(saved);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (authStatus !== "authorized") return;
    const fetchBalance = async () => {
      try {
        const user = getCurrentUser();
        if (!user) return;
        if (user.role === "ADMIN") {
          const stats = await apiGetAdminStats();
          setBalance(Number(stats?.platformRevenue || 0));
        } else {
          const wallet = await apiGetMyWallet();
          setBalance(Number(wallet?.balance || 0));
        }
      } catch (err) {
        console.warn("Could not fetch user wallet balance for Topbar", err);
      }
    };
    fetchBalance();
  }, [authStatus]);

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem("vitedrop_lang", newLang);
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
      className="dashboard-ui min-h-screen bg-[#fafafa] flex antialiased text-neutral-900"
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
          setIsSidebarOpen(false);
          router.push(p);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          role={role}
          balance={balance}
          onRoleChange={handleRoleChange}
          lang={lang}
          onLangChange={handleLangChange}
          onOpenMobileMenu={() => setIsSidebarOpen((open) => !open)}
        />

        <main className="flex-1 px-3 py-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children({ role, lang, setRole: handleRoleChange, setLang: handleLangChange })}
        </main>
      </div>
    </div>
  );
}
