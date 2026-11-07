"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translations, getLocalizedAuthError } from "@/lib/locales";
import { apiForgotPassword } from "@/lib/api-client";
import { Mail, CheckCircle2, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      await apiForgotPassword(email.trim());
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue lors de l'envoi du lien.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];

        return (
          <div className="space-y-6 text-start">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                {t.auth.forgotTitle}
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-1.5">
                {t.auth.forgotSubtitle}
              </p>
            </div>

            {isSubmitted ? (
              <div data-testid="forgot-success-view" className="space-y-5 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900">
                    {lang === "ar" ? "تفقد بريدك الإلكتروني" : "Vérifiez vos e-mails"}
                  </h4>
                  <p className="text-xs text-[#6b6b6b] mt-1 leading-relaxed max-w-xs mx-auto">
                    {t.auth.resetSuccess}
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/login">
                    <Button data-testid="back-to-login-btn" variant="secondary" size="sm" className="w-full">
                      {t.auth.backToLogin}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div data-testid="forgot-error-alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{getLocalizedAuthError(error, lang)}</span>
                  </div>
                )}

                <Input
                  data-testid="forgot-email-input"
                  label={t.auth.email}
                  type="email"
                  placeholder="votre.email@domaine.dz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <div className="pt-2">
                  <Button
                    data-testid="forgot-submit-btn"
                    type="submit"
                    size="md"
                    isLoading={isLoading}
                    className="w-full"
                  >
                    {t.auth.sendResetBtn}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <Link
                    data-testid="forgot-login-link"
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b6b6b] hover:text-neutral-900 transition-colors"
                  >
                    <span>{t.auth.backToLogin}</span>
                  </Link>
                </div>
              </form>
            )}
          </div>
        );
      }}
    </AuthCard>
  );
}
