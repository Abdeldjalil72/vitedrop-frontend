"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, Wallet as WalletIcon, LogOut, Shield } from "lucide-react";
import { UserRole } from "@/types";
import { Language, translations } from "@/lib/locales";
import { formatDZD } from "@/lib/formatters";
import { removeAuthToken } from "@/lib/api-client";

interface TopbarProps {
  role: UserRole;
  onRoleChange?: (newRole: UserRole) => void;
  lang: Language;
  onLangChange: (newLang: Language) => void;
  onOpenMobileMenu: () => void;
  balance?: number;
  allowRoleSwitch?: boolean;
}

export function Topbar({
  role,
  onRoleChange,
  lang,
  onLangChange,
  onOpenMobileMenu,
  balance = 0,
  allowRoleSwitch = false,
}: TopbarProps) {
  const router = useRouter();
  const t = translations[lang];

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  const roleStyles = {
    affiliate: "bg-sky-50 text-sky-700 border-sky-200",
    supplier: "bg-purple-50 text-purple-700 border-purple-200",
    admin: "bg-neutral-100 text-neutral-800 border-neutral-300",
  };

  const badgeClass = roleStyles[role];
  const roleLabel = t.roles[role] || role;

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-black/[0.08] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Start side: Hamburger + Role Badge */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-1.5 sm:p-2 rounded-xl text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Role Identity Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold border shrink-0 ${badgeClass}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>{roleLabel}</span>
        </div>

        {/* Optional dev/admin role switcher if explicitly enabled */}
        {allowRoleSwitch && onRoleChange && (
          <div className="hidden lg:inline-flex items-center p-1 bg-[#f4f4f4] rounded-full text-[11px] font-semibold border border-black/[0.04]">
            {(["affiliate", "supplier", "admin"] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => onRoleChange(r)}
                className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                  role === r
                    ? "bg-white text-black shadow-xs font-bold"
                    : "text-[#6b6b6b] hover:text-black"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* End side: Balance + Language Switcher + Notifications + Logout */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Wallet Balance Capsule */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/60 text-emerald-800 text-[11px] sm:text-xs font-semibold max-w-[130px] sm:max-w-none">
          <WalletIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-mono truncate">{formatDZD(balance, lang)}</span>
        </div>

        {/* Language Switcher */}
        <div className="relative group">
          <button
            type="button"
            className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl hover:bg-[#f4f4f4] transition-colors text-[11px] sm:text-xs font-semibold text-black"
          >
            <svg className="w-3.5 h-3.5 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span>{lang.toUpperCase()}</span>
            <svg className="w-3 h-3 text-neutral-400 group-hover:text-black transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute end-0 top-full mt-1 w-28 bg-white rounded-xl shadow-xl border border-black/[0.06] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1 z-50">
            <button onClick={() => onLangChange("en")} className={`w-full text-start px-3.5 py-1.5 text-xs font-medium hover:bg-neutral-50 ${lang === "en" ? "text-sky-600" : "text-black"}`}>English</button>
            <button onClick={() => onLangChange("fr")} className={`w-full text-start px-3.5 py-1.5 text-xs font-medium hover:bg-neutral-50 ${lang === "fr" ? "text-sky-600" : "text-black"}`}>Français</button>
            <button onClick={() => onLangChange("ar")} className={`w-full text-start px-3.5 py-1.5 text-xs font-medium hover:bg-neutral-50 ${lang === "ar" ? "text-sky-600" : "text-black"}`}>العربية</button>
          </div>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="p-1.5 sm:p-2 rounded-full text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors relative cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-sky-500" />
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          title={t.common.logout}
          className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/60 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">{t.common.logout}</span>
        </button>
      </div>
    </header>
  );
}
