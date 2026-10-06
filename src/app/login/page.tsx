"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { translations } from "@/lib/locales";
import { apiLogin } from "@/lib/api-client";
import { Mail, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"affiliate" | "supplier">("affiliate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setIsLoading(true);

    try {
      const { user } = await apiLogin({ email, password });
      setIsLoading(false);
      setSuccess(true);

      setTimeout(() => {
        if (user?.role === "SUPPLIER") {
          router.push("/supplier");
        } else if (user?.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/affiliate");
        }
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "Échec de connexion au serveur.");
    }
  };

  return (
    <AuthCard initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];

        const roleTabs = [
          { id: "affiliate" as const, label: t.auth.affiliateRole },
          { id: "supplier" as const, label: t.auth.supplierRole },
        ];

        return (
          <div className="space-y-6 text-start">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                {t.auth.loginTitle}
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-1.5">
                {t.auth.loginSubtitle}
              </p>
            </div>

            {/* Role Picker Segmented Control */}
            <div className="flex justify-center">
              <Tabs
                tabs={roleTabs}
                activeTab={role}
                onChange={(r) => setRole(r as "affiliate" | "supplier")}
                layoutId="login-role-pill"
              />
            </div>

            {/* Error / Success Banners */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t.auth.loginSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t.auth.email}
                type="email"
                placeholder="votre.nom@domaine.dz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label={t.auth.password}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                startIcon={<Lock className="w-4 h-4" />}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-neutral-600 focus:outline-none focus:text-neutral-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-600 hover:text-black">
                  <input
                    type="checkbox"
                    className="rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>{t.auth.rememberMe}</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="font-medium text-sky-600 hover:text-sky-700 hover:underline"
                >
                  {t.auth.forgotPasswordLink}
                </Link>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  isLoading={isLoading}
                  className="w-full"
                >
                  {t.auth.loginBtn}
                </Button>
              </div>
            </form>

            {/* Registration link */}
            <div className="text-center pt-2 border-t border-black/[0.06] text-xs text-[#6b6b6b]">
              <span>{t.auth.dontHaveAccount} </span>
              <Link
                href="/register"
                className="font-semibold text-neutral-900 hover:text-sky-600 transition-colors"
              >
                {t.auth.registerBtn}
              </Link>
            </div>
          </div>
        );
      }}
    </AuthCard>
  );
}
