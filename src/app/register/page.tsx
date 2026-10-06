"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WilayaSelect } from "@/components/ui/wilaya-select";
import { Tabs } from "@/components/ui/tabs";
import { translations } from "@/lib/locales";
import { validateAlgerianPhone } from "@/lib/formatters";
import { ALGERIA_WILAYAS } from "@/lib/algeria-locations";
import { apiRegisterAffiliate, apiRegisterSupplier } from "@/lib/api-client";
import { User, Mail, Lock, Phone, Building2, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"affiliate" | "supplier">("affiliate");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [wilaya, setWilaya] = useState("16");
  const [phoneError, setPhoneError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (val.length >= 4) {
      const check = validateAlgerianPhone(val);
      if (!check.isValid && val.length >= 10) {
        setPhoneError("Numéro invalide (doit commencer par 05, 06 ou 07)");
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName || !email || !phone || !password) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const phoneCheck = validateAlgerianPhone(phone);
    if (!phoneCheck.isValid) {
      setPhoneError("Format algérien invalide (ex: 0550123456)");
      return;
    }

    if (role === "supplier" && !company) {
      setError("Le nom de l'entreprise ou marque est obligatoire pour les fournisseurs.");
      return;
    }

    setIsLoading(true);

    try {
      if (role === "affiliate") {
        await apiRegisterAffiliate({
          email,
          password,
          fullName,
          phone: phoneCheck.normalized,
        });
      } else {
        await apiRegisterSupplier({
          email,
          password,
          fullName: `${fullName} (${company})`,
          phone: phoneCheck.normalized,
        });
      }

      setIsLoading(false);
      setSuccess(true);

      setTimeout(() => {
        if (role === "affiliate") {
          router.push("/affiliate");
        } else {
          router.push("/supplier");
        }
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "Échec de l'inscription auprès du serveur.");
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
                {t.auth.registerTitle}
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-1.5">
                {t.auth.registerSubtitle}
              </p>
            </div>

            {/* Role Picker Segmented Control */}
            <div className="flex justify-center">
              <Tabs
                tabs={roleTabs}
                activeTab={role}
                onChange={(r) => setRole(r as "affiliate" | "supplier")}
                layoutId="register-role-pill"
              />
            </div>

            {/* Error / Success */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t.auth.registerSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input
                label={t.auth.fullName}
                type="text"
                placeholder="Karim Mansouri"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                startIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label={t.auth.email}
                type="email"
                placeholder="karim@exemple.dz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label={t.auth.phone}
                type="tel"
                placeholder="0550 12 34 56"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                error={phoneError}
                helperText={t.auth.phoneHint}
                startIcon={<Phone className="w-4 h-4" />}
                required
              />

              <Input
                label={t.auth.password}
                type="password"
                placeholder="Minimum 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                startIcon={<Lock className="w-4 h-4" />}
                required
              />

              {/* Extra fields for Supplier */}
              {role === "supplier" && (
                <div className="space-y-3.5 pt-2 border-t border-black/[0.06] animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-800">
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Profil Fournisseur & Entrepôt</span>
                  </div>

                  <Input
                    label={t.auth.company}
                    type="text"
                    placeholder="Atlas Distribution SARL"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    startIcon={<Building2 className="w-4 h-4" />}
                    required
                  />

                  <WilayaSelect
                    label={t.auth.wilaya}
                    value={wilaya}
                    onChange={(code) => setWilaya(code)}
                    lang={lang}
                  />
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  isLoading={isLoading}
                  className="w-full"
                >
                  {t.auth.registerBtn}
                </Button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-black/[0.06] text-xs text-[#6b6b6b]">
              <span>{t.auth.alreadyHaveAccount} </span>
              <Link
                href="/login"
                className="font-semibold text-neutral-900 hover:text-sky-600 transition-colors"
              >
                {t.auth.loginBtn}
              </Link>
            </div>
          </div>
        );
      }}
    </AuthCard>
  );
}
