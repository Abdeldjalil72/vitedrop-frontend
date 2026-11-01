"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/api-client";
import { Language, isRTL } from "@/lib/locales";
import { Compass, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const notFoundI18n = {
  fr: {
    badge: "Erreur 404",
    title: "Page introuvable",
    description: "La page que vous recherchez n&apos;existe pas, a été déplacée ou son URL est incorrecte.",
    back: "Retour",
    home: "Accueil / Tableau de bord",
  },
  en: {
    badge: "Error 404",
    title: "Page Not Found",
    description: "The page you are looking for does not exist, has been moved, or the URL is incorrect.",
    back: "Go Back",
    home: "Home / Dashboard",
  },
  ar: {
    badge: "خطأ 404",
    title: "الصفحة غير موجودة",
    description: "الصفحة التي تبحث عنها غير موجودة، تم نقلها، أو أن الرابط غير صحيح.",
    back: "رجوع",
    home: "الرئيسية / لوحة التحكم",
  },
};

export default function NotFound() {
  const [lang, setLang] = useState<Language>("fr");
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = (localStorage.getItem("vitedrop_lang") as Language) || "fr";
    if (savedLang === "ar" || savedLang === "en" || savedLang === "fr") {
      setLang(savedLang);
    }
    const user = getCurrentUser();
    if (user?.role) {
      setRole(user.role.toLowerCase());
    }
  }, []);

  const t = notFoundI18n[lang] || notFoundI18n.fr;
  const rtl = isRTL(lang);

  const homeHref =
    role === "admin"
      ? "/admin"
      : role === "supplier"
      ? "/supplier"
      : role === "affiliate"
      ? "/affiliate"
      : "/";

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 selection:bg-black selection:text-white ${
        rtl ? "rtl text-right" : "ltr text-left"
      }`}
      dir={rtl ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md bg-white border border-neutral-200/90 rounded-2xl p-8 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Compass className="w-7 h-7" />
        </div>

        <span className="inline-block px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/60 rounded-full mb-3">
          {t.badge}
        </span>

        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mb-2">
          {t.title}
        </h1>

        <p
          className="text-sm text-neutral-600 mb-6 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: t.description }}
        />

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            className="gap-2 justify-center"
          >
            <ArrowLeft className={`w-4 h-4 ${rtl ? "rotate-180" : ""}`} />
            {t.back}
          </Button>

          <Link href={homeHref} className="inline-block w-full sm:w-auto">
            <Button variant="primary" className="w-full gap-2 justify-center">
              <Home className="w-4 h-4" />
              {t.home}
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 text-xs font-mono text-neutral-400">
        ViteDrop&reg; &bull; Algerian COD CPA Network
      </div>
    </div>
  );
}
