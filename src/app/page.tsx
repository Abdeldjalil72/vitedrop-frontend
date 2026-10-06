"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { pageTranslations } from "./locales";
import Link from "next/link";
import { getCurrentUser, DecodedToken } from "@/lib/api-client";
import { useEffect } from "react";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeAudience, setActiveAudience] = useState<"buyer" | "supplier">("buyer");
  const [orderStep, setOrderStep] = useState(0);
  const [pageLang, setPageLang] = useState<"en" | "fr" | "ar">("en");
  const [currentUser, setCurrentUser] = useState<DecodedToken | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const t = pageTranslations[pageLang];

  const tickerItems = [
    "58 Wilayas Covered",
    "Yalidine API Realtime",
    "ZR Express Synced",
    "Zero Inventory Risk",
    "Server-Side S2S Tracking",
    "24h BaridiMob Payouts",
    "Vetted Winning Products",
    "Automated Escrow",
  ];

  const partners = [
    { name: "YALIDINE", sub: "Fast Express", font: "font-black tracking-widest text-sm" },
    { name: "ZR EXPRESS", sub: "Nationwide Logistics", font: "font-extrabold tracking-wider text-sm" },
    { name: "BARIDIMOB", sub: "Direct Transfer", font: "font-bold tracking-tight text-base" },
    { name: "ALGÉRIE POSTE", sub: "CCP Payouts", font: "font-semibold tracking-normal text-sm" },
    { name: "META ADS", sub: "S2S Conversions API", font: "font-bold tracking-tight text-sm" },
    { name: "TIKTOK ADS", sub: "Pixel Integration", font: "font-black tracking-wider text-sm" },
  ];

  const orderStates = [
    { title: t.step1Title, desc: t.step1Desc, badge: "State 1" },
    { title: t.step2Title, desc: t.step2Desc, badge: "State 2" },
    { title: t.step3Title, desc: t.step3Desc, badge: "State 3" },
    { title: t.step4Title, desc: t.step4Desc, badge: "State 4" },
    { title: t.step5Title, desc: t.step5Desc, badge: "State 5" },
    { title: t.step6Title, desc: t.step6Desc, badge: "State 6" },
    { title: t.step7Title, desc: t.step7Desc, badge: "State 7" },
    { title: t.step8Title, desc: t.step8Desc, badge: "State 8" },
  ];

  return (
    <div 
      dir={pageLang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-white text-[#0a0a0a] flex flex-col justify-between relative overflow-x-hidden"
    >
      {/* 1. Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-1 group">
            <span className="font-serif-luxury text-[32px] font-semibold italic tracking-[-0.08em] text-black">
              ViteDrop
            </span>
            <sup className="text-xs font-semibold text-black -top-3">®</sup>
          </a>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#6b6b6b]">
            <a href="#products" className="hover:text-black transition-colors">
              {t.navCatalog}
            </a>
            <a href="#ecosystem" className="hover:text-black transition-colors">
              {t.navAudience}
            </a>
            <a href="#lifecycle" className="hover:text-black transition-colors">
              {t.navLifecycle}
            </a>
            <a href="#logistics" className="hover:text-black transition-colors">
              {t.navLogistics}
            </a>
          </div>

          {/* Menu Button / CTA / Language */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-[#f4f4f4] transition-colors text-sm font-semibold text-black"
              >
                <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {pageLang.toUpperCase()}
                <svg className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-black/[0.06] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1 z-50">
                <button onClick={() => setPageLang("en")} className={`w-full text-start px-4 py-2 text-sm font-medium hover:bg-neutral-50 ${pageLang === "en" ? "text-sky-600" : "text-black"}`}>English</button>
                <button onClick={() => setPageLang("fr")} className={`w-full text-start px-4 py-2 text-sm font-medium hover:bg-neutral-50 ${pageLang === "fr" ? "text-sky-600" : "text-black"}`}>Français</button>
                <button onClick={() => setPageLang("ar")} className={`w-full text-start px-4 py-2 text-sm font-medium hover:bg-neutral-50 ${pageLang === "ar" ? "text-sky-600" : "text-black"}`}>العربية</button>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-1.5 border-l border-black/[0.06] pl-3 mr-1">
              {currentUser ? (
                <Link href={currentUser.role === "SUPPLIER" ? "/supplier" : currentUser.role === "ADMIN" ? "/admin" : "/affiliate"} className="text-sm font-semibold text-white bg-black hover:bg-neutral-800 transition-colors px-5 py-2 rounded-full flex items-center gap-2">
                  {pageLang === 'ar' ? 'لوحة التحكم' : (pageLang === 'fr' ? 'Tableau de Bord' : 'Dashboard')}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
              ) : (
                <React.Fragment>
                  <Link href="/login" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors px-3 py-2 rounded-xl hover:bg-neutral-50">
                    {pageLang === 'ar' ? 'تسجيل الدخول' : (pageLang === 'fr' ? 'Connexion' : 'Login')}
                  </Link>
                  <Link href="/register" className="text-sm font-semibold text-white bg-black hover:bg-neutral-800 transition-colors px-4 py-2 rounded-full">
                    {pageLang === 'ar' ? 'إنشاء حساب' : (pageLang === 'fr' ? "S'inscrire" : 'Sign Up')}
                  </Link>
                </React.Fragment>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white text-[14px] font-medium px-5 py-2.5 rounded-full shadow-md shadow-sky-500/20 hover:shadow-sky-500/35 hover:brightness-105 transition-all"
              aria-label="Toggle navigation drawer"
            >
              <span>{isMenuOpen ? t.closeLabel : t.navMenu}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isMenuOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Optimized High-Performance Mega-Menu Panel */}
      <AnimatePresence>
        {isMenuOpen && (
          <React.Fragment key="menu-container">
            {/* Smooth Non-blocking Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/30"
            />

            {/* Floating Menu Card (Hardware Accelerated) */}
            <div className="fixed inset-0 z-50 pt-20 px-4 sm:px-6 overflow-y-auto pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                style={{ willChange: "transform, opacity" }}
                className="pointer-events-auto max-w-[1200px] mx-auto bg-white rounded-3xl border border-black/[0.08] shadow-2xl p-6 sm:p-10 my-4"
              >
              {/* Top Bar with Header, Language Selector & Close */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-black/[0.06] mb-8 gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-serif-luxury text-2xl font-semibold italic tracking-[-0.08em] text-black">
                    ViteDrop
                  </span>
                  <span className="text-xs text-[#6b6b6b] font-medium ml-2">
                    — {t.subtitle}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Language Selector Pill */}
                  <div
                    role="group"
                    aria-label={t.langAria}
                    className="flex items-center p-1 rounded-full bg-[#f4f4f4] border border-black/[0.06] text-xs font-semibold"
                  >
                    <button
                      type="button"
                      onClick={() => setPageLang("en")}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        pageLang === "en"
                          ? "bg-white text-black shadow-sm font-bold"
                          : "text-[#6b6b6b] hover:text-black"
                      }`}
                    >
                      🇬🇧 EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageLang("fr")}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        pageLang === "fr"
                          ? "bg-white text-black shadow-sm font-bold"
                          : "text-[#6b6b6b] hover:text-black"
                      }`}
                    >
                      🇫🇷 FR
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageLang("ar")}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        pageLang === "ar"
                          ? "bg-white text-black shadow-sm font-bold"
                          : "text-[#6b6b6b] hover:text-black"
                      }`}
                    >
                      🇩🇿 عربي
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-xs font-semibold text-[#6b6b6b] hover:text-black px-3 py-1.5 rounded-full border border-black/10 hover:border-black/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{t.closeLabel}</span>
                    <span className="text-sm leading-none">✕</span>
                  </button>
                </div>
              </div>

              {/* 3-Column Structured Layout (Multilingual + RTL Support) */}
              <div
                dir={pageLang === "ar" ? "rtl" : "ltr"}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
              >
                {/* Col 1: For Media Buyers */}
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                    <div>
                      <strong className="text-xs font-bold text-black uppercase tracking-wider block">
                        🎯 {t.col1Title}
                      </strong>
                      <span className="text-[11px] text-[#6b6b6b]">
                        {t.col1Subtitle}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                      {t.col1Badge}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        const el = document.getElementById("products");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full text-start group block p-4 rounded-2xl border border-black/[0.06] hover:border-black/20 hover:bg-[#fafafa] transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-semibold text-black group-hover:text-neutral-900">
                          {t.col1Item1Title}
                        </strong>
                        <span className="text-[10px] font-semibold text-[#17c964]">
                          {t.col1Item1Badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6b6b] leading-relaxed">
                        {t.col1Item1Desc}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveAudience("buyer");
                        setIsMenuOpen(false);
                        const el = document.getElementById("ecosystem");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full text-start group block p-4 rounded-2xl border border-black/[0.06] hover:border-black/20 hover:bg-[#fafafa] transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-semibold text-black group-hover:text-neutral-900">
                          {t.col1Item2Title}
                        </strong>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black text-white">
                          {t.col1Item2Badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6b6b] leading-relaxed">
                        {t.col1Item2Desc}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveAudience("buyer");
                        setIsMenuOpen(false);
                        const el = document.getElementById("ecosystem");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full text-start group block p-4 rounded-2xl border border-black/[0.06] hover:border-black/20 hover:bg-[#fafafa] transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-semibold text-black group-hover:text-neutral-900">
                          {t.col1Item3Title}
                        </strong>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t.col1Item3Badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6b6b] leading-relaxed">
                        {t.col1Item3Desc}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Col 2: For Warehouse Suppliers */}
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                    <div>
                      <strong className="text-xs font-bold text-black uppercase tracking-wider block">
                        📦 {t.col2Title}
                      </strong>
                      <span className="text-[11px] text-[#6b6b6b]">
                        {t.col2Subtitle}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-black/10">
                      {t.col2Badge}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAudience("supplier");
                        setIsMenuOpen(false);
                        const el = document.getElementById("ecosystem");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full text-start group block p-4 rounded-2xl border border-black/[0.06] hover:border-black/20 hover:bg-[#fafafa] transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-semibold text-black group-hover:text-neutral-900">
                          {t.col2Item1Title}
                        </strong>
                        <span className="text-[10px] font-semibold text-neutral-800">
                          {t.col2Item1Badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6b6b] leading-relaxed">
                        {t.col2Item1Desc}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        const el = document.getElementById("lifecycle");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full text-start group block p-4 rounded-2xl border border-black/[0.06] hover:border-black/20 hover:bg-[#fafafa] transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-semibold text-black group-hover:text-neutral-900">
                          {t.col2Item2Title}
                        </strong>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                          {t.col2Item2Badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6b6b] leading-relaxed">
                        {t.col2Item2Desc}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveAudience("supplier");
                        setIsMenuOpen(false);
                        const el = document.getElementById("ecosystem");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full text-start group block p-4 rounded-2xl border border-black/[0.06] hover:border-black/20 hover:bg-[#fafafa] transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-semibold text-black group-hover:text-neutral-900">
                          {t.col2Item3Title}
                        </strong>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t.col2Item3Badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6b6b] leading-relaxed">
                        {t.col2Item3Desc}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Col 3: Platform Infrastructure */}
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                    <div>
                      <strong className="text-xs font-bold text-black uppercase tracking-wider block">
                        ⚡ {t.col3Title}
                      </strong>
                      <span className="text-[11px] text-[#6b6b6b]">
                        {t.col3Subtitle}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {t.col3Badge}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        const el = document.getElementById("lifecycle");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full text-start group block p-4 rounded-2xl border border-black/[0.06] hover:border-black/20 hover:bg-[#fafafa] transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-semibold text-black group-hover:text-neutral-900">
                          {t.col3Item1Title}
                        </strong>
                        <span className="text-[10px] font-semibold text-blue-600">
                          {t.col3Item1Badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6b6b] leading-relaxed">
                        {t.col3Item1Desc}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        const el = document.getElementById("logistics");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full text-start group block p-4 rounded-2xl border border-black/[0.06] hover:border-black/20 hover:bg-[#fafafa] transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-semibold text-black group-hover:text-neutral-900">
                          {t.col3Item2Title}
                        </strong>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {t.col3Item2Badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6b6b] leading-relaxed">
                        {t.col3Item2Desc}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        const el = document.getElementById("logistics");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full text-start group block p-4 rounded-2xl border border-black/[0.06] hover:border-black/20 hover:bg-[#fafafa] transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-semibold text-black group-hover:text-neutral-900">
                          {t.col3Item3Title}
                        </strong>
                        <span className="text-[10px] font-semibold text-neutral-800">
                          {t.col3Item3Badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6b6b] leading-relaxed">
                        {t.col3Item3Desc}
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Access Action Bar */}
              <div
                dir={pageLang === "ar" ? "rtl" : "ltr"}
                className="mt-8 pt-6 border-t border-black/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAudience("buyer");
                      setIsMenuOpen(false);
                      const el = document.getElementById("ecosystem");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white text-xs font-semibold shadow-md shadow-sky-500/20 hover:brightness-105 transition-all cursor-pointer"
                  >
                    <span>🎯</span>
                    <span>{t.buyerPortalBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveAudience("supplier");
                      setIsMenuOpen(false);
                      const el = document.getElementById("ecosystem");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-black text-white hover:bg-neutral-800 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span>📦</span>
                    <span>{t.supplierPortalBtn}</span>
                  </button>
                </div>

                <a
                  href="https://wa.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-black/10 hover:border-black/30 text-xs font-semibold text-black transition-all bg-white hover:bg-neutral-50"
                >
                  <span className="w-2 h-2 rounded-full bg-[#17c964] animate-pulse"></span>
                  <span>{t.whatsappBtn}</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>

              {/* Bottom Footer Inside Menu */}
              <div
                dir={pageLang === "ar" ? "rtl" : "ltr"}
                className="mt-6 pt-5 border-t border-black/[0.06] flex flex-wrap items-center justify-between text-xs text-[#6b6b6b] gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                  <span>{t.footerBadge1}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{t.footerBadge2}</span>
                </div>
                <div className="flex items-center gap-4 text-black font-medium">
                  <a href="#products" onClick={() => setIsMenuOpen(false)} className="hover:underline">
                    {t.navCatalog}
                  </a>
                  <a href="#ecosystem" onClick={() => setIsMenuOpen(false)} className="hover:underline">
                    {t.navAudience}
                  </a>
                  <a href="#lifecycle" onClick={() => setIsMenuOpen(false)} className="hover:underline">
                    {t.navLifecycle}
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </React.Fragment>
        )}
      </AnimatePresence>

      {/* 2. Hero Section with Moving Blue Gradient and Staggered Typography Entrance */}
      <section className="relative min-h-[850px] pt-36 pb-20 px-6 flex flex-col items-center justify-center overflow-hidden">
        {/* Left Side: Animated Moving Blue Gradient Aura */}
        <div className="absolute left-0 top-0 bottom-0 w-[45%] max-w-[620px] pointer-events-none overflow-hidden select-none z-0">
          <div className="absolute -left-20 top-1/4 w-[480px] h-[520px] rounded-full bg-gradient-to-tr from-[#0284c7] via-[#38bdf8] to-[#60a5fa] opacity-65 blur-[95px] animate-fluid-blob-left" />
          <div className="absolute -left-32 top-1/2 w-[420px] h-[460px] rounded-full bg-gradient-to-br from-[#1d4ed8] via-[#0ea5e9] to-[#3b82f6] opacity-50 blur-[85px] animate-fluid-blob-right" />
          {/* Inward gradient feather to keep center clean */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-white pointer-events-none" />
        </div>

        {/* Right Side: Animated Moving Blue Gradient Aura */}
        <div className="absolute right-0 top-0 bottom-0 w-[45%] max-w-[620px] pointer-events-none overflow-hidden select-none z-0">
          <div className="absolute -right-20 top-1/4 w-[480px] h-[520px] rounded-full bg-gradient-to-tl from-[#1d4ed8] via-[#38bdf8] to-[#0ea5e9] opacity-65 blur-[95px] animate-fluid-blob-right" />
          <div className="absolute -right-32 top-1/2 w-[420px] h-[460px] rounded-full bg-gradient-to-bl from-[#0284c7] via-[#60a5fa] to-[#0284c7] opacity-50 blur-[85px] animate-fluid-blob-left" />
          {/* Inward gradient feather to keep center clean */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/30 to-white pointer-events-none" />
        </div>

        {/* Decorative Pulsing Curved Lines (Left & Right) */}
        <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none select-none z-[1]">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={`left-line-${i}`}
              className="absolute left-0 border-r-[2.5px] border-t-[2.5px] border-white/90 rounded-tr-[100px] animate-line-pulse shadow-sm"
              style={{
                width: `${70 + i * 16}px`,
                height: `${280 + i * 28}px`,
                top: `-${140 + i * 14}px`,
                animationDelay: `${i * 0.22}s`,
              }}
            />
          ))}
        </div>

        <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none z-[1]">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={`right-line-${i}`}
              className="absolute right-0 border-l-[2.5px] border-t-[2.5px] border-white/90 rounded-tl-[100px] animate-line-pulse shadow-sm"
              style={{
                width: `${70 + i * 16}px`,
                height: `${280 + i * 28}px`,
                top: `-${140 + i * 14}px`,
                animationDelay: `${i * 0.22}s`,
              }}
            />
          ))}
        </div>

        {/* Hero Content Container with Staggered Entrance */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.12, delayChildren: 0.08 },
            },
          }}
          className="max-w-[880px] mx-auto w-full flex flex-col items-center text-center relative z-10"
        >
          {/* Ticker Row */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="w-full max-w-[540px] h-9 mb-10 overflow-hidden marquee-mask relative"
          >
            <div className="marquee-track flex items-center gap-2">
              {[...tickerItems, ...tickerItems].map((item, idx) => (
                <span
                  key={idx}
                  className="shrink-0 text-[13px] font-medium text-[#6b6b6b] px-3.5 py-1.5 rounded-full bg-[#fbfbfb] border border-black/[0.08]"
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Title with Blur Fade-in */}
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 35, filter: "blur(6px)" },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { type: "spring", damping: 24, stiffness: 220 },
              },
            }}
            className="text-[46px] sm:text-[68px] lg:text-[80px] font-semibold leading-[1.03] tracking-[-0.07em] text-black max-w-[760px] mb-6"
          >
            {t.heroTitle}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="text-[17px] sm:text-[18px] leading-[1.5] text-[#6b6b6b] font-normal max-w-[540px] mb-10"
          >
            {t.heroSubtitle}
          </motion.p>

          {/* CTA Row with Tactile Springs */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            {/* Primary Action Button */}
            <motion.a
              whileHover={{ y: -2, boxShadow: "0 14px 28px -6px rgba(14, 165, 233, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              href="#products"
              className="w-full sm:w-auto h-14 px-8 rounded-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white text-[15px] font-semibold flex items-center justify-center shadow-lg shadow-sky-500/25 hover:brightness-105 transition-all"
            >
              Explore Winning Products
            </motion.a>

            {/* VIP WhatsApp Manager Button */}
            <motion.a
              whileHover={{ y: -2, boxShadow: "0 12px 24px -6px rgba(0, 0, 0, 0.08)" }}
              whileTap={{ scale: 0.98 }}
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto h-14 pl-2 pr-6 rounded-full bg-white border-4 border-[#f8f8f8] hover:border-black/10 transition-colors flex items-center gap-3 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
                VD
              </div>
              <div className="text-left">
                <div className="text-[14px] font-semibold text-black leading-tight">
                  Chat with VIP Manager
                </div>
                <div className="text-[12px] font-medium text-[#6b6b6b] flex items-center gap-1.5 leading-none mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#17c964] shrink-0"></span>
                  Fast-track approval (🇩🇿)
                </div>
              </div>
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Bottom subtle progressive blur/gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
      </section>

      {/* 3. TrustedBy / Courier & Payment Rails Marquee */}
      <section className="py-12 border-y border-black/[0.08] bg-[#fafafa]">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
          <div className="text-[14px] font-medium text-[#6b6b6b] leading-snug">
            Integrated courier &amp; banking rails across 58 wilayas.
          </div>
          <div className="md:col-span-3 overflow-hidden marquee-mask">
            <div className="marquee-track-slow flex items-center gap-12">
              {[...partners, ...partners].map((p, idx) => (
                <div key={idx} className="shrink-0 flex flex-col text-black">
                  <span className={p.font}>{p.name}</span>
                  <span className="text-[10px] text-[#6b6b6b] font-medium uppercase tracking-wider">
                    {p.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Dual Perspective Ecosystem with Shared Layout Pill (layoutId) */}
      <motion.section
        id="ecosystem"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 px-6 max-w-[1200px] mx-auto w-full"
      >
        <div className="flex flex-col items-center text-center max-w-[640px] mx-auto mb-16">
          <span className="text-[13px] font-semibold text-black uppercase tracking-widest mb-3">
            {t.ecoSectionTitle}
          </span>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.05em] text-black mb-4">
            {t.ecoSectionHeadline}
          </h2>
          <p className="text-[16px] text-[#6b6b6b] leading-relaxed">
            {t.ecoSectionDesc}
          </p>

          {/* Tab Switcher with Shared Layout Animation */}
          <div className="mt-8 p-1.5 rounded-full bg-[#f4f4f4] flex items-center relative">
            <button
              type="button"
              onClick={() => setActiveAudience("buyer")}
              className={`relative px-6 py-2.5 rounded-full text-xs font-semibold transition-colors z-10 ${
                activeAudience === "buyer"
                  ? "text-white"
                  : "text-[#6b6b6b] hover:text-black"
              }`}
            >
              {activeAudience === "buyer" && (
                <motion.div
                  layoutId="active-audience-pill"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] rounded-full shadow-md shadow-sky-500/25"
                  style={{ zIndex: -1 }}
                />
              )}
              {t.ecoTabBuyer}
            </button>
            <button
              type="button"
              onClick={() => setActiveAudience("supplier")}
              className={`relative px-6 py-2.5 rounded-full text-xs font-semibold transition-colors z-10 ${
                activeAudience === "supplier"
                  ? "text-white"
                  : "text-[#6b6b6b] hover:text-black"
              }`}
            >
              {activeAudience === "supplier" && (
                <motion.div
                  layoutId="active-audience-pill"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] rounded-full shadow-md shadow-sky-500/25"
                  style={{ zIndex: -1 }}
                />
              )}
              {t.ecoTabSupplier}
            </button>
          </div>
        </div>

        {/* Feature Cards Grid with Crossfade Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAudience}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {activeAudience === "buyer" ? (
              <>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="editorial-card p-8 rounded-3xl flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-sm mb-6">
                      01
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-black mb-2">
                      {t.col1Item1Title}
                    </h3>
                    <p className="text-sm text-[#6b6b6b] leading-relaxed">
                      {t.col1Item1Desc}
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-black/[0.06] text-xs font-semibold text-black">
                    {t.col1Item1Badge}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="editorial-card p-8 rounded-3xl flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-sm mb-6">
                      02
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-black mb-2">
                      {t.col1Item2Title}
                    </h3>
                    <p className="text-sm text-[#6b6b6b] leading-relaxed">
                      {t.col1Item2Desc}
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-black/[0.06] text-xs font-semibold text-black">
                    {t.col1Item2Badge}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="editorial-card p-8 rounded-3xl flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-sm mb-6">
                      03
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-black mb-2">
                      {t.col1Item3Title}
                    </h3>
                    <p className="text-sm text-[#6b6b6b] leading-relaxed">
                      {t.col1Item3Desc}
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-black/[0.06] text-xs font-semibold text-black">
                    {t.col1Item3Badge}
                  </div>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="editorial-card p-8 rounded-3xl flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-sm mb-6">
                      01
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-black mb-2">
                      {t.col2Item1Title}
                    </h3>
                    <p className="text-sm text-[#6b6b6b] leading-relaxed">
                      {t.col2Item1Desc}
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-black/[0.06] text-xs font-semibold text-black">
                    {t.col2Item1Badge}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="editorial-card p-8 rounded-3xl flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-sm mb-6">
                      02
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-black mb-2">
                      {t.col2Item2Title}
                    </h3>
                    <p className="text-sm text-[#6b6b6b] leading-relaxed">
                      {t.col2Item2Desc}
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-black/[0.06] text-xs font-semibold text-black">
                    {t.col2Item2Badge}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="editorial-card p-8 rounded-3xl flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-sm mb-6">
                      03
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-black mb-2">
                      {t.col2Item3Title}
                    </h3>
                    <p className="text-sm text-[#6b6b6b] leading-relaxed">
                      {t.col2Item3Desc}
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-black/[0.06] text-xs font-semibold text-black">
                    {t.col2Item3Badge}
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.section>

      {/* 5. Live Winning Product & Unit Economics Showcase */}
      <motion.section
        id="products"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 px-6 bg-[#fafafa] border-t border-black/[0.08]"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Product Image with Elevation Hover */}
            <div className="lg:col-span-6">
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-3xl overflow-hidden border border-black/[0.08] bg-white shadow-xl group"
              >
                <img
                  src="/vitedrop_cod_products_1791095797096.jpg"
                  alt="COD Winning Products in Algeria"
                  className="w-full h-[440px] sm:h-[500px] object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-5 left-5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-xs font-semibold text-black border border-black/10">
                  🔥 Trending Vertical • Tech &amp; Gadgets
                </div>
                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-white/95 backdrop-blur border border-black/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#6b6b6b] block">Central Stock</span>
                    <strong className="text-black text-sm">1,450 Units in Blida</strong>
                  </div>
                  <span className="text-[#17c964] font-bold flex items-center gap-1.5">
                    <motion.span
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-2 h-2 rounded-full bg-[#17c964]"
                    />
                    Immediate Dispatch
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Right: Transparent Unit Economics Breakdown */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[13px] font-semibold text-black uppercase tracking-widest">
                Unit Economics Breakdown
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.04em] text-black">
                UltraSonic Pro 4K Mini Projector
              </h2>
              <p className="text-[16px] text-[#6b6b6b] leading-relaxed">
                Here is a realistic example of cashflow on a single delivered order in the Algerian market. Transparent numbers with zero hidden deductions.
              </p>

              {/* Breakdown Table */}
              <div className="editorial-card p-6 rounded-2xl space-y-3.5 text-sm">
                <div className="flex justify-between items-center text-[#6b6b6b]">
                  <span>Customer Selling Price (COD collected at door):</span>
                  <span className="font-semibold text-black">4,800 DZD</span>
                </div>
                <div className="flex justify-between items-center text-[#6b6b6b]">
                  <span>Supplier Base Inventory Cost:</span>
                  <span>- 2,400 DZD</span>
                </div>
                <div className="flex justify-between items-center text-[#6b6b6b]">
                  <span>Average Yalidine Courier Delivery Fee:</span>
                  <span>- 800 DZD</span>
                </div>
                <div className="pt-3 border-t border-black/[0.08] flex justify-between items-center">
                  <span className="font-bold text-black text-base">Your Net CPA Commission:</span>
                  <span className="text-xl font-extrabold text-black">
                    + 1,600 DZD <span className="text-xs font-normal text-[#6b6b6b]">/ order</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <motion.a
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  href="#lifecycle"
                  className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white text-sm font-semibold shadow-md shadow-sky-500/25 hover:brightness-105 transition-all"
                >
                  See Order State Machine
                </motion.a>
                <span className="text-xs text-[#6b6b6b]">
                  58 Wilayas Doorstep Delivery
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 6. Order Lifecycle State Machine with Stepper Progression Animation */}
      <motion.section
        id="lifecycle"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 px-6 max-w-[1200px] mx-auto w-full"
      >
        <div className="max-w-[640px] mx-auto text-center mb-16">
          <span className="text-[13px] font-semibold text-black uppercase tracking-widest mb-3 block">
            {t.lifeSectionTitle}
          </span>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.05em] text-black mb-4">
            {t.lifeSectionHeadline}
          </h2>
          <p className="text-[16px] text-[#6b6b6b]">
            {t.lifeSectionDesc}
          </p>
        </div>

        {/* Stepper Buttons with Progress Fill */}
        <div className="relative mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
            {orderStates.map((state, idx) => (
              <button
                key={state.title}
                type="button"
                onClick={() => setOrderStep(idx)}
                className={`p-5 rounded-2xl border text-left transition-all relative ${
                  orderStep === idx
                    ? "text-white border-black shadow-lg"
                    : "bg-white text-black border-black/[0.08] hover:border-black/30"
                }`}
              >
                {orderStep === idx && (
                  <motion.div
                    layoutId="active-step-highlight"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] rounded-2xl shadow-md shadow-sky-500/25"
                    style={{ zIndex: -1 }}
                  />
                )}
                <span
                  className={`text-[11px] font-mono block mb-1 ${
                    orderStep === idx ? "text-neutral-400" : "text-[#6b6b6b]"
                  }`}
                >
                  {state.badge}
                </span>
                <strong className="text-lg font-semibold block">{state.title}</strong>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Step Card with Smooth Fade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={orderStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="editorial-card p-8 rounded-3xl border border-black/[0.08] flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white flex items-center justify-center font-bold shrink-0 text-sm shadow-md shadow-sky-500/20">
              0{orderStep + 1}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-black mb-2">
                Phase {orderStep + 1}: {orderStates[orderStep].title}
              </h3>
              <p className="text-[15px] text-[#6b6b6b] leading-relaxed">
                {orderStates[orderStep].desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.section>

      {/* 7. Logistics & 58 Wilayas Coverage */}
      <motion.section
        id="logistics"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 px-6 bg-[#fafafa] border-t border-black/[0.08]"
      >
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[13px] font-semibold text-black uppercase tracking-widest">
              {t.logSectionTitle}
            </span>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.05em] text-black">
              {t.logSectionHeadline}
            </h2>
            <p className="text-[16px] text-[#6b6b6b] leading-relaxed">
              {t.logSectionDesc}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <motion.div
                whileHover={{ y: -4 }}
                className="editorial-card p-5 rounded-2xl"
              >
                <span className="text-2xl font-bold text-black block mb-1">24h - 48h</span>
                <span className="text-xs text-[#6b6b6b]">Transit time to major Northern Wilayas</span>
              </motion.div>
              <motion.div
                whileHover={{ y: -4 }}
                className="editorial-card p-5 rounded-2xl"
              >
                <span className="text-2xl font-bold text-black block mb-1">88.4%</span>
                <span className="text-xs text-[#6b6b6b]">Average confirmed delivery success rate</span>
              </motion.div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl overflow-hidden border border-black/[0.08] shadow-xl bg-black"
            >
              <img
                src="/vitedrop_logistics_map_1791095822497.jpg"
                alt="Algeria 58 Wilayas Logistics Network"
                className="w-full h-[420px] object-cover object-center"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 8. Editorial Footer */}
      <footer className="border-t border-black/[0.08] py-16 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <span className="font-serif-luxury text-3xl font-semibold italic tracking-[-0.08em] text-black">
                ViteDrop
              </span>
              <sup className="text-xs font-semibold text-black -top-3">®</sup>
            </div>
            <p className="text-sm text-[#6b6b6b] max-w-sm leading-relaxed">
              Algeria&apos;s premier Cash-on-Delivery CPA network. Vetted supplier stock, elite media buyers, automated courier waybills, and guaranteed escrow.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <div>
              <strong className="block text-black font-semibold mb-3">Platform</strong>
              <div className="space-y-2 text-[#6b6b6b]">
                <a href="#products" className="block hover:text-black transition-colors">Winning Products</a>
                <a href="#ecosystem" className="block hover:text-black transition-colors">Media Buyers</a>
                <a href="#ecosystem" className="block hover:text-black transition-colors">Suppliers</a>
                <a href="#lifecycle" className="block hover:text-black transition-colors">Escrow Engine</a>
              </div>
            </div>
            <div>
              <strong className="block text-black font-semibold mb-3">Partners</strong>
              <div className="space-y-2 text-[#6b6b6b]">
                <span className="block">Yalidine Fast Express</span>
                <span className="block">ZR Express</span>
                <span className="block">BaridiMob</span>
                <span className="block">Algérie Poste (CCP)</span>
              </div>
            </div>
            <div>
              <strong className="block text-black font-semibold mb-3">Support</strong>
              <div className="space-y-2 text-[#6b6b6b]">
                <a href="https://wa.me/" className="block text-black font-semibold hover:underline">WhatsApp VIP Desk</a>
                <span className="block">Algiers, Algeria 🇩🇿</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto mt-16 pt-8 border-t border-black/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs text-[#6b6b6b]">
          <span>© 2026 ViteDrop Network. All rights reserved.</span>
          <span>Cash-on-Delivery CPA Architecture for Algeria</span>
        </div>
      </footer>
    </div>
  );
}
