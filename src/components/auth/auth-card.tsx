"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, ShieldCheck, Globe } from "lucide-react";
import { Language, isRTL, translations } from "@/lib/locales";

interface AuthCardProps {
  children: (props: { lang: Language; setLang: (l: Language) => void }) => React.ReactNode;
  initialLang?: Language;
}

export function AuthCard({ children, initialLang = "fr" }: AuthCardProps) {
  const [lang, setLang] = useState<Language>(initialLang);
  const rtl = isRTL(lang);
  const t = translations[lang];

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="min-h-screen bg-[#fafafa] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-sky-500 selection:text-white"
    >
      {/* Top Bar: Back to Home + Language Selector */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#6b6b6b] hover:text-black transition-colors"
        >
          {rtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{lang === "ar" ? "العودة للرئيسية" : "Retour à l'accueil"}</span>
        </Link>

        {/* Language Switcher */}
        <div className="inline-flex items-center p-1 bg-[#f4f4f4] rounded-full text-xs font-semibold border border-black/[0.04]">
          {(["fr", "ar", "en"] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
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
            <span className="font-bold text-2xl tracking-tight text-neutral-900">
              ViteDrop
            </span>
          </Link>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
          className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)]"
        >
          {children({ lang, setLang })}
        </motion.div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#6b6b6b]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {lang === "ar"
              ? "نظام مشفر ومحمي بروتوكولياً 100%"
              : "Connexion sécurisée SSL 256-bit • Réseau ViteDrop Algérie"}
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
