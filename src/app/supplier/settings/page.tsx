"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  apiGetSupplierSettings,
  apiUpdateSupplierSettings,
  SupplierSettings,
} from "@/lib/api-client";
import { ALGERIA_WILAYAS } from "@/lib/algeria-locations";
import { Language, isRTL } from "@/lib/locales";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Truck,
  MessageSquare,
  Save,
  CheckCircle2,
  AlertCircle,
  Bell,
  Sparkles,
} from "lucide-react";

function getCommunes(wilayaCode: number | string): string[] {
  const codeStr = String(wilayaCode).padStart(2, "0");
  const found = ALGERIA_WILAYAS.find((w) => w.code === codeStr);
  return found ? found.communes : [];
}

const supplierSettingsI18n = {
  fr: {
    eyebrow: "Paramètres Fournisseur",
    title: "Boutique & Expédition",
    subtitle: "Configurez l'identité de votre boutique, votre centre logistique et vos modèles WhatsApp.",
    saveSuccess: "Paramètres enregistrés avec succès !",
    saveError: "Erreur lors de l'enregistrement des paramètres.",
    storeSection: "Identité de la Boutique",
    storeNameLabel: "Nom commercial du Fournisseur",
    phoneLabel: "Numéro de contact WhatsApp / Appel",
    emailLabel: "Email pour les notifications",
    hubSection: "Entrepôt & Origine d'Expédition",
    wilayaLabel: "Wilaya de l'Entrepôt (Départ colis)",
    communeLabel: "Commune de ramassage",
    courierSection: "Préférences Transporteurs",
    courierLabel: "Transporteur par défaut",
    couriers: {
      auto: "Automatique (Optimisation selon Wilaya)",
      yalidine: "Yalidine Express uniquement",
      zr: "ZR Express uniquement",
      noest: "Noest Express uniquement",
      ecotrack: "Ecotrack uniquement",
      maystro: "Maystro Delivery uniquement",
      guepex: "Guepex uniquement",
    },
    loadingParams: "Chargement des paramètres...",
    dynamicTagInjection: "Injection dynamique de balises",
    whatsappSection: "Modèle de Confirmation WhatsApp (Speed-Dial)",
    whatsappSubtitle: "Ce texte pré-rempli s'ouvre automatiquement lors du clic sur le bouton WhatsApp du centre d'appels.",
    templateLabel: "Message de confirmation",
    tagsInfo: "Variables disponibles : {customer_name}, {product_name}, {wilaya}, {quantity}",
    notificationsSection: "Alertes Opérationnelles",
    enableCallsLabel: "Activer les notifications de nouvelles commandes à confirmer",
    enableStockLabel: "M'alerter lorsque le stock d'un produit tombe sous 10 unités",
    saveBtn: "Enregistrer les modifications",
  },
  en: {
    eyebrow: "Supplier Settings",
    title: "Store & Logistics Settings",
    subtitle: "Configure your store identity, dispatch warehouse hub, and call-center WhatsApp scripts.",
    saveSuccess: "Settings saved successfully!",
    saveError: "Error saving settings.",
    storeSection: "Store Profile",
    storeNameLabel: "Supplier / Brand Name",
    phoneLabel: "WhatsApp / Call-Center Phone",
    emailLabel: "Operational Email",
    hubSection: "Warehouse & Dispatch Hub",
    wilayaLabel: "Dispatch Wilaya (Pickup Origin)",
    communeLabel: "Pickup Commune",
    courierSection: "Courier Preferences",
    courierLabel: "Default Courier Dispatch",
    couriers: {
      auto: "Automated (Optimal routing by Wilaya)",
      yalidine: "Yalidine Express Only",
      zr: "ZR Express Only",
      noest: "Noest Express Only",
      ecotrack: "Ecotrack Only",
      maystro: "Maystro Delivery Only",
      guepex: "Guepex Only",
    },
    loadingParams: "Loading store parameters...",
    dynamicTagInjection: "Dynamic Tag Injection",
    whatsappSection: "Call-Center WhatsApp Confirmation Script",
    whatsappSubtitle: "This pre-filled message opens in 1 click from the call-center speed-dial queue.",
    templateLabel: "Confirmation Script Template",
    tagsInfo: "Available variables: {customer_name}, {product_name}, {wilaya}, {quantity}",
    notificationsSection: "Operational Alerts",
    enableCallsLabel: "Enable instant alerts for incoming leads requiring call confirmation",
    enableStockLabel: "Alert me when product inventory falls below 10 units",
    saveBtn: "Save Settings",
  },
  ar: {
    eyebrow: "إعدادات المورّد",
    title: "إعدادات المتجر والشحن",
    subtitle: "قم بتهيئة بيانات متجرك، مستودع الانطلاق للشحن، ونماذج رسائل التأكيد عبر واتساب.",
    saveSuccess: "تم حفظ الإعدادات بنجاح!",
    saveError: "حدث خطأ أثناء حفظ الإعدادات.",
    storeSection: "بيانات المتجر والاتصال",
    storeNameLabel: "اسم المتجر أو العلامة التجارية",
    phoneLabel: "رقم هاتف مركز الاتصال / واتساب",
    emailLabel: "البريد الإلكتروني للإشعارات",
    hubSection: "المستودع وموقع انطلاق الطرود",
    wilayaLabel: "ولاية المستودع (مكان الاستلام)",
    communeLabel: "بلدية الشحن",
    courierSection: "تفضيلات شركات التوصيل",
    courierLabel: "شركة الشحن الافتراضية",
    couriers: {
      auto: "تلقائي (توجيه ذكي حسب الولاية)",
      yalidine: "ياليدين إكسبريس فقط (Yalidine)",
      zr: "زد آر إكسبريس فقط (ZR Express)",
      noest: "نوست إكسبريس فقط (Noest)",
      ecotrack: "إيكوتراك فقط (Ecotrack)",
      maystro: "مايسترو ديليفري فقط (Maystro)",
      guepex: "غيبكس فقط (Guepex)",
    },
    loadingParams: "جاري تحميل إعدادات المتجر...",
    dynamicTagInjection: "إدراج الوسوم التلقائي",
    whatsappSection: "نموذج رسالة التأكيد عبر واتساب",
    whatsappSubtitle: "يتم فتح هذه الرسالة الجاهزة بنقرة واحدة عند الاتصال بالزبون عبر واتساب.",
    templateLabel: "نص رسالة التأكيد",
    tagsInfo: "المتغيرات المتاحة: {customer_name}, {product_name}, {wilaya}, {quantity}",
    notificationsSection: "التنبيهات التشغيلية",
    enableCallsLabel: "تفعيل إشعارات الطلبات الجديدة للتأكيد الفوري",
    enableStockLabel: "تنبيهي عندما ينخفض المخزون عن 10 قطع",
    saveBtn: "حفظ الإعدادات",
  },
};

export default function SupplierSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [settings, setSettings] = useState<SupplierSettings>({
    storeName: "",
    phone: "",
    notificationEmail: "",
    warehouseWilaya: 16,
    warehouseCommune: "Bab Ezzouar",
    courierPreference: "AUTO",
    whatsappTemplate: "",
    enableCallCenterNotifications: true,
    enableStockAlerts: true,
  });

  const [availableCommunes, setAvailableCommunes] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await apiGetSupplierSettings();
        setSettings(data);
        const communes = getCommunes(data.warehouseWilaya);
        setAvailableCommunes(communes);
      } catch {
        setErrorMsg("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleWilayaChange = (wilayaCode: number) => {
    const communes = getCommunes(wilayaCode);
    setAvailableCommunes(communes);
    setSettings((prev) => ({
      ...prev,
      warehouseWilaya: wilayaCode,
      warehouseCommune: communes[0] || "",
    }));
  };

  const handleSave = async (e: React.FormEvent, t: (typeof supplierSettingsI18n)["fr"]) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setErrorMsg(null);

    try {
      const updated = await apiUpdateSupplierSettings(settings);
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setErrorMsg(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    setSettings((prev) => ({
      ...prev,
      whatsappTemplate: prev.whatsappTemplate + " " + variable,
    }));
  };

  return (
    <DashboardLayout initialRole="supplier" initialLang="fr">
      {({ lang }: { lang: Language }) => {
        const t = supplierSettingsI18n[lang as "en" | "fr" | "ar"] || supplierSettingsI18n.fr;
        const rtl = isRTL(lang);

        return (
          <div
            className={`space-y-6 max-w-4xl mx-auto pb-12 ${
              rtl ? "rtl text-right" : "ltr text-left"
            }`}
            dir={rtl ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div>
              <span className="font-mono text-xs uppercase tracking-wider font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/80 inline-block mb-2">
                {t.eyebrow}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                {t.title}
              </h1>
              <p className="text-sm text-neutral-600 mt-1">{t.subtitle}</p>
            </div>

            {/* Feedback Banners */}
            {success && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{t.saveSuccess}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {loading ? (
              <Card className="p-8 text-center bg-white border border-neutral-200">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-neutral-500 font-mono">{t.loadingParams}</p>
              </Card>
            ) : (
              <form onSubmit={(e) => handleSave(e, t)} className="space-y-6">
                {/* 1. Store Identity */}
                <Card className="p-6 bg-white border border-neutral-200/90 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">
                        {t.storeSection}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                        {t.storeNameLabel}
                      </label>
                      <Input
                        type="text"
                        required
                        value={settings.storeName}
                        onChange={(e) =>
                          setSettings({ ...settings, storeName: e.target.value })
                        }
                        className="w-full"
                        placeholder="e.g. DZ Electro Direct"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                        {t.phoneLabel}
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          required
                          dir="ltr"
                          value={settings.phone}
                          onChange={(e) =>
                            setSettings({ ...settings, phone: e.target.value })
                          }
                          className="w-full font-mono text-left pr-9"
                          placeholder="0550123456"
                        />
                        <Phone className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                        {t.emailLabel}
                      </label>
                      <div className="relative">
                        <Input
                          type="email"
                          required
                          dir="ltr"
                          value={settings.notificationEmail}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notificationEmail: e.target.value,
                            })
                          }
                          className="w-full font-mono text-left pr-9"
                          placeholder="supplier@vitedrop.com"
                        />
                        <Mail className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 2. Warehouse Hub */}
                <Card className="p-6 bg-white border border-neutral-200/90 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/80 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">
                        {t.hubSection}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                        {t.wilayaLabel}
                      </label>
                      <select
                        value={settings.warehouseWilaya}
                        onChange={(e) => handleWilayaChange(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer"
                      >
                        {ALGERIA_WILAYAS.map((w) => (
                          <option key={w.code} value={Number(w.code)}>
                            {w.code} - {w.name} ({w.nameAr})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                        {t.communeLabel}
                      </label>
                      <select
                        value={settings.warehouseCommune}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            warehouseCommune: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer"
                      >
                        {availableCommunes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Card>

                {/* 3. Courier Preferences */}
                <Card className="p-6 bg-white border border-neutral-200/90 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">
                        {t.courierSection}
                      </h2>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                      {t.courierLabel}
                    </label>
                    <select
                      value={settings.courierPreference}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          courierPreference: e.target
                            .value as SupplierSettings["courierPreference"],
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer"
                    >
                      <option value="AUTO">{t.couriers.auto}</option>
                      <option value="YALIDINE">{t.couriers.yalidine}</option>
                      <option value="ZR_EXPRESS">{t.couriers.zr}</option>
                      <option value="NOEST">{t.couriers.noest}</option>
                      <option value="ECOTRACK">{t.couriers.ecotrack}</option>
                      <option value="MAYSTRO">{t.couriers.maystro}</option>
                      <option value="GUEPEX">{t.couriers.guepex}</option>
                    </select>
                  </div>
                </Card>

                {/* 4. WhatsApp Confirmation Template */}
                <Card className="p-6 bg-white border border-neutral-200/90 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">
                        {t.whatsappSection}
                      </h2>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {t.whatsappSubtitle}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        {t.templateLabel}
                      </label>
                      <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" /> {t.dynamicTagInjection}
                      </span>
                    </div>
                    <Textarea
                      rows={4}
                      value={settings.whatsappTemplate}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          whatsappTemplate: e.target.value,
                        })
                      }
                      className="w-full text-sm leading-relaxed"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["{customer_name}", "{product_name}", "{wilaya}", "{quantity}"].map(
                        (tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => insertVariable(tag)}
                            className="px-2.5 py-1 text-xs font-mono bg-neutral-100 hover:bg-purple-100 text-neutral-700 hover:text-purple-700 border border-neutral-200 rounded-md transition-colors cursor-pointer"
                          >
                            + {tag}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </Card>

                {/* 5. Notifications */}
                <Card className="p-6 bg-white border border-neutral-200/90 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">
                        {t.notificationsSection}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableCallCenterNotifications}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            enableCallCenterNotifications: e.target.checked,
                          })
                        }
                        className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-sm text-neutral-700">
                        {t.enableCallsLabel}
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableStockAlerts}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            enableStockAlerts: e.target.checked,
                          })
                        }
                        className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-sm text-neutral-700">
                        {t.enableStockLabel}
                      </span>
                    </label>
                  </div>
                </Card>

                {/* Submit Action */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={saving}
                    className="w-full sm:w-auto px-8 gap-2 justify-center"
                  >
                    <Save className="w-4 h-4" />
                    {t.saveBtn}
                  </Button>
                </div>
              </form>
            )}
          </div>
        );
      }}
    </DashboardLayout>
  );
}
