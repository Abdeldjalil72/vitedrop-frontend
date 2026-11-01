"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/api-client";
import { Language, isRTL } from "@/lib/locales";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const errorI18n = {
  fr: {
    badge: "Erreur Système",
    title: "Une anomalie s&apos;est produite",
    description: "Une erreur inattendue est survenue lors de l&apos;exécution. Les données financières et le journal d&apos;escrow restent entièrement sécurisés.",
    retry: "Réessayer",
    home: "Retour au tableau de bord",
    errorDetails: "Détails techniques :",
  },
  en: {
    badge: "System Error",
    title: "Something went wrong",
    description: "An unexpected error occurred during execution. Financial ledgers and escrow data remain completely secure.",
    retry: "Try Again",
    home: "Return to Dashboard",
    errorDetails: "Technical details:",
  },
  ar: {
    badge: "خطأ في النظام",
    title: "حدث خطأ غير متوقع",
    description: "حدث خطأ أثناء معالجة الطلب. سجلات المحفظة والضمان المالي (Escrow) آمنة ومحمية بالكامل.",
    retry: "إعادة المحاولة",
    home: "العودة للوحة التحكم",
    errorDetails: "التفاصيل التقنية:",
  },
};

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const [lang, setLang] = useState<Language>("fr");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Log the error to an error reporting service or console
    console.error("ViteDrop Client Runtime Exception:", error);

    const savedLang = (localStorage.getItem("vitedrop_lang") as Language) || "fr";
    if (savedLang === "ar" || savedLang === "en" || savedLang === "fr") {
      setLang(savedLang);
    }
    const user = getCurrentUser();
    if (user?.role) {
      setRole(user.role.toLowerCase());
    }
  }, [error]);

  const t = errorI18n[lang] || errorI18n.fr;
  const rtl = isRTL(lang);

  const homeHref =
    role === "admin"
      ? "/admin"
      : role === "supplier"
      ? "/supplier"
      : role === "affiliate"
      ? "/affiliate"
      : "/";

  return (
    <div
      className={`min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 selection:bg-black selection:text-white ${
        rtl ? "rtl text-right" : "ltr text-left"
      }`}
      dir={rtl ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-lg bg-white border border-neutral-200/90 rounded-2xl p-8 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200/60 rounded-full mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          {t.badge}
        </span>

        <h1
          className="text-2xl font-bold text-neutral-900 tracking-tight mb-2"
          dangerouslySetInnerHTML={{ __html: t.title }}
        />

        <p
          className="text-sm text-neutral-600 mb-6 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: t.description }}
        />

        {error.message && process.env.NODE_ENV !== "production" && (
          <div className="mb-6 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-start text-xs font-mono text-neutral-700 overflow-x-auto max-h-32">
            <div className="font-semibold text-neutral-500 mb-1">{t.errorDetails}</div>
            <div>{error.message}</div>
            {error.digest && (
              <div className="text-neutral-400 mt-1">Digest: {error.digest}</div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={() => reset()}
            className="gap-2 justify-center"
          >
            <RefreshCw className="w-4 h-4" />
            {t.retry}
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
        ViteDrop&reg; &bull; Immutable Ledger Protection
      </div>
    </div>
  );
}
