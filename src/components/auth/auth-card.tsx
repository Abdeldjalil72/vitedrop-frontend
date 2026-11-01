"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Language, isRTL } from "@/lib/locales";

interface AuthCardProps {
  children: (props: { lang: Language; setLang: (l: Language) => void }) => React.ReactNode;
  initialLang?: Language;
}

export function AuthCard({ children, initialLang = "fr" }: AuthCardProps) {
  const [lang, setLang] = useState<Language>(initialLang);
  const rtl = isRTL(lang);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("vitedrop_lang") as Language;
        if (saved && (saved === "fr" || saved === "ar" || saved === "en")) {
          setLang(saved);
        }
      } catch {}
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem("vitedrop_lang", newLang);
    } catch {}
  };

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f8f7f4] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-sky-500 selection:text-white"
    >
      {/* Top Bar: Back to Home + Language Selector */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#6b6b6b] hover:text-black transition-colors"
        >
          {rtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>
            {lang === "ar"
              ? "العودة للرئيسية"
              : lang === "en"
              ? "Back to home"
              : "Retour à l'accueil"}
          </span>
        </Link>

        {/* Language Switcher */}
        <div className="inline-flex items-center p-1 bg-[#f4f4f4] rounded-full text-xs font-semibold border border-black/[0.04]">
          {(["fr", "ar", "en"] as Language[]).map((l) => (
            <button
              key={l}
              data-testid={`auth-lang-${l}`}
              onClick={() => handleLangChange(l)}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                lang === l
                  ? "bg-white text-black shadow-xs font-bold"
                  : "text-[#6b6b6b] hover:text-black"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Auth Container */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        {/* Brand Logo Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#2563eb] flex items-center justify-center text-white font-bold text-base shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform">
              VD
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif-luxury text-2xl sm:text-3xl font-semibold italic tracking-[-0.08em] text-neutral-950">
                ViteDrop
              </span>
              <sup className="text-xs font-semibold text-neutral-950 -top-2">®</sup>
            </div>
          </Link>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
          className="bg-white rounded-3xl border border-[#e7e5df] p-6 sm:p-8 shadow-xl shadow-neutral-900/5"
        >
          {children({ lang, setLang: handleLangChange })}
        </motion.div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-500 font-mono text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {lang === "ar"
              ? "محمي بمحرك القيد المزدوج لمنصة ViteDrop · شبكة 58 ولاية"
              : lang === "en"
              ? "Secured by ViteDrop Double-Entry Escrow Engine · DZ-58 Network"
              : "Sécurisé par le moteur double-entrée ViteDrop · Réseau DZ-58"}
          </span>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} ViteDrop Algeria. All rights reserved.
      </div>
    </div>
  );
}
