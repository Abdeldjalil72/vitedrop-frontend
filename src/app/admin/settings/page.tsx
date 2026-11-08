"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  apiGetAdminPlatformSettings,
  apiUpdateAdminPlatformSettings,
  AdminPlatformSettings,
} from "@/lib/api-client";
import { Language, isRTL } from "@/lib/locales";
import {
  ShieldCheck,
  Scale,
  Receipt,
  Radio,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Percent,
  Coins,
  ShieldAlert,
} from "lucide-react";

const adminSettingsI18n = {
  fr: {
    eyebrow: "Gouvernance & Réseau",
    title: "Paramètres de la Plateforme",
    subtitle: "Configuration des règles d'escrow, des seuils de trésorerie et de la sécurité des webhooks.",
    saveSuccess: "Paramètres de gouvernance mis à jour avec succès !",
    saveError: "Erreur lors de la mise à jour des paramètres.",
    escrowSection: "Modèle Financier & Trésorerie Escrow",
    feeLabel: "Commission Plateforme Invisible (Part ViteDrop sur CPA livré)",
    feeSubtext: "Modèle standard : 80% Net pour l'affilié / 20% pour la plateforme. L'affilié ne voit que son montant net.",
    thresholdLabel: "Seuil de Retrait Haute Priorité (DZD)",
    thresholdSubtext: "Les retraits dépassant ce seuil sont signalés avec un badge ambré lumineux dans la file de compensation.",
    minTopupLabel: "Montant Minimum de Dépôt Fournisseur (DZD)",
    logisticsSection: "Logistique COD & Protection RTO",
    defaultShippingLabel: "Tarif d'expédition de référence (DZD)",
    rtoPolicyLabel: "Politique de pénalité de retour (RTO)",
    rtoLockedText: "0 DZD - Verrouillé par les règles du réseau ViteDrop. Les fournisseurs règlent directement leur transporteur privé pour les bordereaux perdus.",
    webhookSection: "Sécurité des Signatures & Webhooks Transporteurs",
    replayLabel: "Fenêtre anti-rejeu des Webhooks (secondes)",
    replaySubtext: "Délai maximal accepté entre l'horodatage de la requête du transporteur et l'heure serveur actuelle.",
    hmacLabel: "Vérification de signature HMAC SHA-256",
    hmacActive: "Active et appliquée sur les endpoints Yalidine et ZR Express",
    saveBtn: "Enregistrer les Règles de Gouvernance",
    loadingText: "Chargement des paramètres de la plateforme...",
    immutableBadge: "RÈGLE IMMUABLE",
    enforcedBadge: "APPLIQUÉ",
    splitBadge: (fee: number) => `${fee}% Plateforme / ${100 - fee}% Net Affilié`,
  },
  en: {
    eyebrow: "Governance & Network",
    title: "Platform Parameters",
    subtitle: "Global escrow parameters, treasury thresholds, and courier webhook security configuration.",
    saveSuccess: "Governance parameters updated successfully!",
    saveError: "Error updating parameters.",
    escrowSection: "Escrow & Treasury Economics",
    feeLabel: "Invisible Platform Fee Cut (% on delivered CPA)",
    feeSubtext: "Standard model: 80% Net Affiliate payout / 20% ViteDrop Platform fee. Affiliates only see their net payout.",
    thresholdLabel: "High-Priority Withdrawal Threshold (DZD)",
    thresholdSubtext: "Withdrawals at or above this threshold trigger the glowing amber high-priority badge in the clearinghouse.",
    minTopupLabel: "Minimum Supplier Escrow Deposit (DZD)",
    logisticsSection: "COD Logistics & RTO Invariants",
    defaultShippingLabel: "Standard Benchmark Shipping Fee (DZD)",
    rtoPolicyLabel: "Return to Origin (RTO) Platform Penalty Policy",
    rtoLockedText: "0 DZD - Locked by ViteDrop Invariants. Suppliers are billed directly by their private courier; zero platform fee deducted on RTO.",
    webhookSection: "Courier Webhook Verification & Replay Protection",
    replayLabel: "Replay Protection Window (seconds)",
    replaySubtext: "Maximum allowed timestamp delta between incoming courier webhook and Algiers node time.",
    hmacLabel: "HMAC SHA-256 Signature Verification",
    hmacActive: "Active and enforced across Yalidine and ZR Express listeners",
    saveBtn: "Save Governance Rules",
    loadingText: "Loading platform parameters...",
    immutableBadge: "IMMUTABLE RULE",
    enforcedBadge: "ENFORCED",
    splitBadge: (fee: number) => `${fee}% Platform / ${100 - fee}% Net Affiliate`,
  },
  ar: {
    eyebrow: "الحوكمة والشبكة",
    title: "إعدادات المنصة العامة",
    subtitle: "تهيئة القواعد المالية للضمان (Escrow)، حدود الخزينة وحماية إشعارات شركات التوصيل.",
    saveSuccess: "تم تحديث إعدادات الحوكمة بنجاح!",
    saveError: "حدث خطأ أثناء حفظ الإعدادات.",
    escrowSection: "النموذج المالي والضمان (Escrow)",
    feeLabel: "نسبة عمولة المنصة غير المرئية (% من الـ CPA عند التوصيل)",
    feeSubtext: "النموذج القياسي: 80% للمسوق و20% للمنصة. المسوق يشاهد فقط ربحه الصافي دون اقتطاع إضافي.",
    thresholdLabel: "حد طلبات السحب ذات الأولوية العالية (د.ج)",
    thresholdSubtext: "الطلبات التي تبلغ هذا الحد أو تتجاوزه تميز بشارة عنبرية مضيئة في لوحة التدقيق المالي.",
    minTopupLabel: "الحد الأدنى لشحن رصيد المورّد (د.ج)",
    logisticsSection: "اللوجستيات وقواعد الطرود المرتجعة (Retour)",
    defaultShippingLabel: "سعر الشحن المرجعي الافتراضي (د.ج)",
    rtoPolicyLabel: "سياسة غرامات الطرود المرتجعة (Retour)",
    rtoLockedText: "0 د.ج - مقفل بقوانين منصة ViteDrop. المورد يدفع تكلفة الشحن لشركة التوصيل مباشرة، ولا تطبق المنصة أي غرامة إضافية.",
    webhookSection: "أمان إشعارات شركات التوصيل والتحقق",
    replayLabel: "نافذة الحماية من إعادة الإرسال (بالثواني)",
    replaySubtext: "أقصى فارق زمني مسموح به بين وقت إرسال الإشعار ووقت خادم المنصة بالجزائر.",
    hmacLabel: "التحقق من التوقيع الرقمي HMAC SHA-256",
    hmacActive: "مفعل ومطبق بشكل إلزامي على Yalidine وZR Express",
    saveBtn: "حفظ قواعد الحوكمة",
    loadingText: "جاري تحميل إعدادات المنصة...",
    immutableBadge: "قاعدة ثابتة",
    enforcedBadge: "مفعل إلزامياً",
    splitBadge: (fee: number) => `${fee}% المنصة / ${100 - fee}% صافي المسوق`,
  },
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [settings, setSettings] = useState<AdminPlatformSettings>({
    platformFeePercent: 20,
    highPriorityWithdrawalThreshold: 20000,
    minimumTopUpAmount: 5000,
    defaultShippingFee: 800,
    rtoPenaltyAllowed: false,
    webhookReplayWindowSeconds: 300,
    courierWebhookSecretConfigured: true,
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await apiGetAdminPlatformSettings();
        setSettings(data);
      } catch {
        setErrorMsg("Failed to load platform parameters");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent, t: (typeof adminSettingsI18n)["fr"]) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setErrorMsg(null);

    try {
      const updated = await apiUpdateAdminPlatformSettings(settings);
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setErrorMsg(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }: { lang: Language }) => {
        const t = adminSettingsI18n[lang as "en" | "fr" | "ar"] || adminSettingsI18n.fr;
        const rtl = isRTL(lang);

        return (
          <div
            className={`space-y-6 max-w-4xl mx-auto pb-12 ${
              rtl ? "rtl text-right" : "ltr text-left"
            }`}
            dir={rtl ? "rtl" : "ltr"}
          >
            {/* Header */}
            <AdminPageHeader
              badge={t.eyebrow}
              badgeVariant="emerald"
              title={t.title}
              description={t.subtitle}
            />

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
              <Card className="p-8 text-center bg-white border border-[#e7e5df]">
                <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-neutral-500 font-mono">{t.loadingText}</p>
              </Card>
            ) : (
              <form onSubmit={(e) => handleSave(e, t)} className="space-y-6">
                {/* 1. Escrow & Double-Entry Economics */}
                <Card className="p-4 sm:p-6 bg-white border border-[#e7e5df] rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">
                        {t.escrowSection}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                          {t.feeLabel}
                        </label>
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          {t.splitBadge(settings.platformFeePercent)}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          min={5}
                          max={50}
                          required
                          value={settings.platformFeePercent}
                          onWheel={(e) => (e.target as HTMLElement).blur()}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              platformFeePercent: Number(e.target.value),
                            })
                          }
                          className="w-full font-mono text-left"
                        />
                        <Percent className="w-4 h-4 text-neutral-400 absolute end-3 top-3 pointer-events-none" />
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">{t.feeSubtext}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                          {t.thresholdLabel}
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1000}
                            step={1000}
                            required
                            value={settings.highPriorityWithdrawalThreshold}
                            onWheel={(e) => (e.target as HTMLElement).blur()}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                highPriorityWithdrawalThreshold: Number(
                                  e.target.value
                                ),
                              })
                            }
                            className="w-full font-mono text-left"
                          />
                          <Coins className="w-4 h-4 text-neutral-400 absolute end-3 top-3 pointer-events-none" />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          {t.thresholdSubtext}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                          {t.minTopupLabel}
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1000}
                            step={1000}
                            required
                            value={settings.minimumTopUpAmount}
                            onWheel={(e) => (e.target as HTMLElement).blur()}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                minimumTopUpAmount: Number(e.target.value),
                              })
                            }
                            className="w-full font-mono text-left"
                          />
                          <Receipt className="w-4 h-4 text-neutral-400 absolute end-3 top-3 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 2. Logistics & RTO Invariants */}
                <Card className="p-4 sm:p-6 bg-white border border-[#e7e5df] rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">
                        {t.logisticsSection}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                        {t.defaultShippingLabel}
                      </label>
                      <Input
                        type="number"
                        min={300}
                        step={50}
                        required
                        value={settings.defaultShippingFee}
                        onWheel={(e) => (e.target as HTMLElement).blur()}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            defaultShippingFee: Number(e.target.value),
                          })
                        }
                        className="w-full font-mono text-left"
                      />
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          {t.rtoPolicyLabel}
                        </span>
                        <span className="font-mono text-xs font-bold text-neutral-800 bg-white px-2 py-0.5 rounded border border-neutral-200 shrink-0">
                          {t.immutableBadge}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {t.rtoLockedText}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* 3. Courier Webhooks */}
                <Card className="p-4 sm:p-6 bg-white border border-[#e7e5df] rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200/80 flex items-center justify-center shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-neutral-900">
                        {t.webhookSection}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                        {t.replayLabel}
                      </label>
                      <Input
                        type="number"
                        min={60}
                        max={3600}
                        step={30}
                        required
                        value={settings.webhookReplayWindowSeconds}
                        onWheel={(e) => (e.target as HTMLElement).blur()}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            webhookReplayWindowSeconds: Number(e.target.value),
                          })
                        }
                        className="w-full font-mono text-left"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        {t.replaySubtext}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-200/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ShieldAlert className="w-4 h-4 text-cyan-700 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-cyan-900">
                            {t.hmacLabel}
                          </div>
                          <div className="text-xs text-cyan-700/80">
                            {t.hmacActive}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-100/80 px-2 py-0.5 rounded shrink-0">
                        {t.enforcedBadge}
                      </span>
                    </div>
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
