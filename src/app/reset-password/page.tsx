"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiResetPassword } from "@/lib/api-client";
import { getLocalizedAuthError } from "@/lib/locales";
import { Lock, CheckCircle2, AlertCircle, KeyRound, ArrowRight } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") || "";

  const [token, setToken] = useState(urlToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("Le jeton de réinitialisation est requis.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      await apiResetPassword(token.trim(), newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err?.message ||
          "Ce lien de réinitialisation est invalide ou a expiré. Veuillez refaire une demande."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard initialLang="fr">
      {({ lang }) => {
        const isAr = lang === "ar";

        return (
          <div className="space-y-6 text-start">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                {isAr ? "تعيين كلمة مرور جديدة" : "Nouveau mot de passe"}
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-1.5">
                {isAr
                  ? "أدخل كلمة المرور الجديدة لتأمين حسابك والوصول إلى لوحة التحكم."
                  : "Choisissez un mot de passe sécurisé pour accéder à votre espace ViteDrop."}
              </p>
            </div>

            {isSuccess ? (
              <div data-testid="reset-success-view" className="space-y-5 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900">
                    {isAr ? "تم تحديث كلمة المرور بنجاح" : "Mot de passe mis à jour !"}
                  </h4>
                  <p className="text-xs text-[#6b6b6b] mt-1 leading-relaxed max-w-xs mx-auto">
                    {isAr
                      ? "يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة."
                      : "Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter."}
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/login">
                    <Button data-testid="reset-login-btn" size="md" className="w-full">
                      <span>{isAr ? "تسجيل الدخول" : "Se connecter"}</span>
                      <ArrowRight className="w-4 h-4 ml-1.5 rtl:rotate-180" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div
                    data-testid="reset-error-alert"
                    className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{getLocalizedAuthError(error, lang)}</span>
                  </div>
                )}

                {/* Show token input only if not provided in URL */}
                {!urlToken && (
                  <Input
                    data-testid="reset-token-input"
                    label={isAr ? "رمز التحقق (Token)" : "Jeton de réinitialisation"}
                    type="text"
                    placeholder="Collez le jeton reçu"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    startIcon={<KeyRound className="w-4 h-4" />}
                    required
                  />
                )}

                <Input
                  data-testid="reset-new-password-input"
                  label={isAr ? "كلمة المرور الجديدة" : "Nouveau mot de passe"}
                  type="password"
                  placeholder="Min. 6 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  startIcon={<Lock className="w-4 h-4" />}
                  required
                />

                <Input
                  data-testid="reset-confirm-password-input"
                  label={isAr ? "تأكيد كلمة المرور" : "Confirmez le mot de passe"}
                  type="password"
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  startIcon={<Lock className="w-4 h-4" />}
                  required
                />

                <div className="pt-2">
                  <Button
                    data-testid="reset-submit-btn"
                    type="submit"
                    size="md"
                    isLoading={isLoading}
                    className="w-full"
                  >
                    {isAr ? "حفظ كلمة المرور" : "Enregistrer le mot de passe"}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b6b6b] hover:text-neutral-900 transition-colors"
                  >
                    <span>{isAr ? "العودة لتسجيل الدخول" : "Retour à la connexion"}</span>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
