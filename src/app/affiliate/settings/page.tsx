"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser, apiGetPayoutSettings, apiUpdatePayoutSettings } from "@/lib/api-client";
import { translations } from "@/lib/locales";
import { validateBaridiMobRip, validateCcpAccount } from "@/lib/algerian-banking";
import {
  Settings,
  User,
  CreditCard,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Bell,
  Building2,
  Landmark,
} from "lucide-react";
import { ModernSelect } from "@/components/ui/modern-select";

const settingsI18n = {
  fr: {
    eyebrow: "Paramètres du Profil",
    title: "Profil & Coordonnées Bancaires",
    subtitle: "Configurez vos coordonnées BaridiMob ou CCP pour recevoir vos gains sans délai.",
    successMsg: "Paramètres enregistrés avec succès !",
    accountInfo: "Informations Personnelles",
    emailLabel: "Adresse Email",
    affiliateIdLabel: "ID Affilié",
    payoutInfo: "Coordonnées de Retrait par Défaut",
    methodLabel: "Mode de Paiement",
    methods: {
      baridimob: "BaridiMob (RIP 20 chiffres)",
      ccp: "Compte CCP (Numéro + Clé)",
      bank: "Virement Bancaire (RIB)",
    },
    ripBaridimob: "Numéro RIP BaridiMob (20 chiffres)",
    ccpNumKey: "Numéro Compte CCP + Clé (ex: 12345678 Clé 99)",
    bankRib: "RIB Bancaire",
    saveBtn: "Enregistrer les Préférences",
  },
  en: {
    eyebrow: "Profile Settings",
    title: "Profile & Payment Details",
    subtitle: "Configure your BaridiMob or CCP details to receive payouts without delay.",
    successMsg: "Settings saved successfully!",
    accountInfo: "Personal Information",
    emailLabel: "Email Address",
    affiliateIdLabel: "Affiliate ID",
    payoutInfo: "Default Payout Details",
    methodLabel: "Payment Method",
    methods: {
      baridimob: "BaridiMob (20-digit RIP)",
      ccp: "CCP Account (Number + Key)",
      bank: "Bank Transfer (RIB)",
    },
    ripBaridimob: "BaridiMob RIP Number (20 digits)",
    ccpNumKey: "CCP Account Number + Key (e.g. 12345678 Key 99)",
    bankRib: "Bank RIB",
    saveBtn: "Save Changes",
  },
  ar: {
    eyebrow: "إعدادات الحساب",
    title: "الملف الشخصي وطرق الدفع",
    subtitle: "قم بإعداد حسابك البنكي أو البريدي لتسريع عمليات سحب الأرباح تلقائياً.",
    successMsg: "تم حفظ تفاصيل الدفع بنجاح!",
    accountInfo: "معلومات الحساب",
    emailLabel: "البريد الإلكتروني",
    affiliateIdLabel: "معرف المسوق (ID)",
    payoutInfo: "طريقة استلام الأرباح الافتراضية",
    methodLabel: "طريقة التحويل",
    methods: {
      baridimob: "بريدي موب (RIP 20 رقم)",
      ccp: "حساب CCP (رقم + مفتاح)",
      bank: "تحويل بنكي (RIB)",
    },
    ripBaridimob: "رقم RIP الخاص بـ BaridiMob (20 رقم)",
    ccpNumKey: "رقم حساب CCP مع المفتاح (مثال: 12345678 Clé 99)",
    bankRib: "رقم الحساب البنكي RIB",
    saveBtn: "حفظ التغييرات",
  },
};

export default function AffiliateSettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [method, setMethod] = useState("BARIDIMOB");
  const [ripOrCcp, setRipOrCcp] = useState("");
  const [fullName, setFullName] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setFullName(user.email.split("@")[0] || "");
    }

    // Load from server database first, with fallback to local cache
    async function loadSettings() {
      try {
        const data = await apiGetPayoutSettings();
        if (data) {
          if (data.payoutMethod) setMethod(data.payoutMethod);
          if (data.payoutRip) setRipOrCcp(data.payoutRip);
          else if (data.payoutCcpNumber) {
            setRipOrCcp(`${data.payoutCcpNumber} ${data.payoutCcpKey || ""}`.trim());
          }
          if (data.payoutFullName) setFullName(data.payoutFullName);
        }
      } catch {
        // Fallback to localStorage if offline
        const savedMethod = localStorage.getItem("vitedrop_default_payout_method");
        const savedAccount = localStorage.getItem("vitedrop_default_payout_account");
        if (savedMethod) setMethod(savedMethod);
        if (savedAccount) setRipOrCcp(savedAccount);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      // Validate banking format
      if (method === "BARIDIMOB") {
        const ripCheck = validateBaridiMobRip(ripOrCcp);
        if (!ripCheck.isValid) {
          setSaveError(ripCheck.error || "Numéro RIP BaridiMob invalide.");
          setIsSaving(false);
          return;
        }
      } else if (method === "CCP") {
        const ccpCheck = validateCcpAccount(ripOrCcp);
        if (!ccpCheck.isValid) {
          setSaveError(ccpCheck.error || "Numéro de compte CCP ou clé invalide.");
          setIsSaving(false);
          return;
        }
      }

      // Parse CCP vs RIP
      const isCcp = method === "CCP";
      const ccpParts = ripOrCcp.trim().split(/\s+/);
      const ccpNumber = isCcp ? ccpParts[0] || "" : "";
      const ccpKey = isCcp ? ccpParts[1] || "" : "";
      const cleanRip = !isCcp ? ripOrCcp.replace(/[\s\-_.]/g, "") : "";

      await apiUpdatePayoutSettings({
        payoutMethod: method,
        payoutRip: cleanRip,
        payoutCcpNumber: ccpNumber,
        payoutCcpKey: ccpKey,
        payoutFullName: fullName.trim(),
      });

      // Synchronize local cache as well
      localStorage.setItem("vitedrop_default_payout_method", method);
      localStorage.setItem("vitedrop_default_payout_account", ripOrCcp.trim());

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message || "Erreur lors de l'enregistrement des coordonnées bancaires");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout initialRole="affiliate" initialLang="fr">
      {({ lang }) => {
        const dict = settingsI18n[lang as "en" | "fr" | "ar"] || settingsI18n.fr;
        const isAr = lang === "ar";

        return (
          <div className="space-y-8 text-start max-w-4xl mx-auto">
            {/* Header */}
            <div>
              <span className={`text-xs ${isAr ? "" : "font-mono uppercase tracking-wider"} text-sky-700 font-semibold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200`}>
                {dict.eyebrow}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight mt-1">
                {dict.title}
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                {dict.subtitle}
              </p>
            </div>

            {savedSuccess && (
              <div data-testid="payout-success-alert" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{dict.successMsg}</span>
              </div>
            )}

            {saveError && (
              <div data-testid="payout-error-alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Account Information */}
              <Card className="p-6 space-y-4">
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-600" />
                  <span>{dict.accountInfo}</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      {dict.emailLabel}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser?.email || ""}
                      className="w-full text-xs rounded-xl border border-black/10 bg-neutral-100 px-3 py-2 font-mono text-neutral-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      {dict.affiliateIdLabel}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser?.sub || ""}
                      className="w-full text-xs rounded-xl border border-black/10 bg-neutral-100 px-3 py-2 font-mono text-neutral-600 cursor-not-allowed"
                    />
                  </div>
                </div>
              </Card>

              {/* Payout Information */}
              <Card className="p-6 space-y-4">
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>{dict.payoutInfo}</span>
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      {dict.methodLabel}
                    </label>
                    <ModernSelect
                      value={method}
                      onChange={(val) => setMethod(val)}
                      options={[
                        {
                          value: "BARIDIMOB",
                          label: dict.methods.baridimob,
                          badge: "RIP 20",
                          badgeColor: "bg-cyan-50 text-cyan-800 border-cyan-200/80 font-bold",
                          icon: <CreditCard className="w-4 h-4 text-cyan-600" />,
                        },
                        {
                          value: "CCP",
                          label: dict.methods.ccp,
                          badge: "CCP",
                          badgeColor: "bg-amber-50 text-amber-800 border-amber-200/80 font-bold",
                          icon: <Building2 className="w-4 h-4 text-amber-600" />,
                        },
                        {
                          value: "BANK_TRANSFER",
                          label: dict.methods.bank,
                          badge: "RIB",
                          badgeColor: "bg-purple-50 text-purple-800 border-purple-200/80 font-bold",
                          icon: <Landmark className="w-4 h-4 text-purple-600" />,
                        },
                      ]}
                      icon={
                        method === "BARIDIMOB" ? (
                          <CreditCard className="w-4 h-4 text-cyan-600" />
                        ) : method === "CCP" ? (
                          <Building2 className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Landmark className="w-4 h-4 text-purple-600" />
                        )
                      }
                      name="payoutMethod"
                      nativeSelectTestId="payout-method-select"
                      data-testid="payout-method-dropdown"
                      triggerClassName="py-2.5 px-3.5 rounded-xl bg-white hover:bg-neutral-50/80 border-black/10 text-xs sm:text-sm"
                      menuClassName="min-w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      {method === "BARIDIMOB"
                        ? dict.ripBaridimob
                        : method === "CCP"
                        ? dict.ccpNumKey
                        : dict.bankRib}
                    </label>
                    <input
                      type="text"
                      required
                      data-testid="payout-account-input"
                      value={ripOrCcp}
                      onChange={(e) => setRipOrCcp(e.target.value)}
                      placeholder={method === "BARIDIMOB" ? "00799999002345678901" : "12345678 99"}
                      className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    {method === "BARIDIMOB" && ripOrCcp.replace(/[\s-]/g, "").length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 pt-1">
                        {validateBaridiMobRip(ripOrCcp).isValid ? (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Format valide: {validateBaridiMobRip(ripOrCcp).formatted}
                          </span>
                        ) : (
                          <span className="text-amber-600">
                            {ripOrCcp.replace(/[\s-]/g, "").length}/20 chiffres (BaridiMob Algérie Poste)
                          </span>
                        )}
                      </div>
                    )}
                    {method === "CCP" && ripOrCcp.trim().length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 pt-1">
                        {validateCcpAccount(ripOrCcp).isValid ? (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {validateCcpAccount(ripOrCcp).formatted}
                          </span>
                        ) : (
                          <span className="text-neutral-400">Format: N° Compte + Clé (ex: 12345678 99)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Submit */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  data-testid="payout-save-btn"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white text-xs font-semibold"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Enregistrement..." : dict.saveBtn}</span>
                </Button>
              </div>
            </form>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
