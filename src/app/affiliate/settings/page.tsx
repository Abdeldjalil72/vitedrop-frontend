"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/api-client";
import { translations } from "@/lib/locales";
import {
  Settings,
  User,
  CreditCard,
  Shield,
  Save,
  CheckCircle2,
  Bell,
} from "lucide-react";

export default function AffiliateSettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [method, setMethod] = useState("BARIDIMOB");
  const [ripOrCcp, setRipOrCcp] = useState("");
  const [fullName, setFullName] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setFullName(user.email.split("@")[0] || "");
    }
    const savedMethod = localStorage.getItem("vitedrop_default_payout_method");
    const savedAccount = localStorage.getItem("vitedrop_default_payout_account");
    if (savedMethod) setMethod(savedMethod);
    if (savedAccount) setRipOrCcp(savedAccount);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("vitedrop_default_payout_method", method);
    localStorage.setItem("vitedrop_default_payout_account", ripOrCcp);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <DashboardLayout initialRole="affiliate" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];

        return (
          <div className="space-y-8 text-start max-w-4xl mx-auto">
            {/* Header */}
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-sky-700 font-bold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                {lang === "ar" ? "إعدادات الحساب" : "Paramètres du Profil"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1">
                {lang === "ar" ? "الملف الشخصي وطرق الدفع" : "Profil & Coordonnées Bancaires"}
              </h1>
              <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1">
                {lang === "ar"
                  ? "قم بإعداد حسابك البنكي أو البريدي لتسريع عمليات سحب الأرباح تلقائياً."
                  : "Configurez vos coordonnées BaridiMob ou CCP pour recevoir vos gains sans délai."}
              </p>
            </div>

            {savedSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {lang === "ar"
                    ? "تم حفظ تفاصيل الدفع بنجاح!"
                    : "Paramètres enregistrés avec succès !"}
                </span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Account Information */}
              <Card className="p-6 space-y-4">
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-600" />
                  <span>{lang === "ar" ? "معلومات الحساب" : "Informations Personnelles"}</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      {lang === "ar" ? "البريد الإلكتروني" : "Adresse Email"}
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
                      {lang === "ar" ? "معرف المسوق (ID)" : "ID Affilié"}
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
                  <span>{lang === "ar" ? "طريقة استلام الأرباح الافتراضية" : "Coordonnées de Retrait par Défaut"}</span>
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      {lang === "ar" ? "طريقة التحويل" : "Mode de Paiement"}
                    </label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="BARIDIMOB">BaridiMob (RIP 20 chiffres)</option>
                      <option value="CCP">Compte CCP (Numéro + Clé)</option>
                      <option value="BANK_TRANSFER">Virement Bancaire (RIB)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      {method === "BARIDIMOB"
                        ? (lang === "ar" ? "رقم RIP الخاص بـ BaridiMob (20 رقم)" : "Numéro RIP BaridiMob (20 chiffres)")
                        : method === "CCP"
                        ? (lang === "ar" ? "رقم حساب CCP مع المفتاح (مثال: 12345678 Clé 99)" : "Numéro Compte CCP + Clé (ex: 12345678 Clé 99)")
                        : (lang === "ar" ? "رقم الحساب البنكي RIB" : "RIB Bancaire")}
                    </label>
                    <input
                      type="text"
                      required
                      value={ripOrCcp}
                      onChange={(e) => setRipOrCcp(e.target.value)}
                      placeholder={method === "BARIDIMOB" ? "00799999002345678901" : "12345678 99"}
                      className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </Card>

              {/* Submit */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white text-xs font-semibold"
                >
                  <Save className="w-4 h-4" />
                  <span>{lang === "ar" ? "حفظ التغييرات" : "Enregistrer les Préférences"}</span>
                </Button>
              </div>
            </form>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
