"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WilayaSelect } from "@/components/ui/wilaya-select";
import { ModernSelect, type ModernSelectOption } from "@/components/ui/modern-select";
import { Tabs } from "@/components/ui/tabs";
import { translations } from "@/lib/locales";
import { validateAlgerianPhone } from "@/lib/formatters";
import { apiRegisterAffiliate, apiRegisterSupplier } from "@/lib/api-client";
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Send,
  Share2,
  Award,
  Briefcase,
  Headphones,
  BarChart3,
} from "lucide-react";

const getTrafficSourceOptions = (isAr: boolean): ModernSelectOption[] => [
  {
    value: "FACEBOOK_INSTAGRAM",
    label: isAr ? "إعلانات فيسبوك وإنستغرام" : "Facebook & Instagram Ads",
    secondaryLabel: isAr ? "Meta Ads" : "Meta Ads, Reels & Stories",
    badge: "Meta",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "TIKTOK_ADS",
    label: isAr ? "إعلانات تيك توك" : "TikTok Ads",
    secondaryLabel: isAr ? "TikTok Business" : "Spark Ads & Vidéos courtes",
    badge: "TikTok",
    badgeColor: "bg-neutral-900 text-white border-neutral-800",
  },
  {
    value: "GOOGLE_ADS",
    label: isAr ? "إعلانات غوغل ويوتيوب" : "Google Ads / YouTube",
    secondaryLabel: isAr ? "Search & YouTube" : "Search, Shopping & Vidéo",
    badge: "Google",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "SNAPCHAT_ADS",
    label: isAr ? "إعلانات سناب شات" : "Snapchat Ads",
    secondaryLabel: isAr ? "Snap Ads" : "Stories & Spotlight",
    badge: "Snap",
    badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
  },
  {
    value: "INFLUENCE_COMMUNITY",
    label: isAr ? "صناع المحتوى والمجموعات" : "Influence & Communautés",
    secondaryLabel: isAr ? "Organic & Pages" : "Pages & Groupes thématiques",
    badge: "Social",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    value: "OTHER",
    label: isAr ? "مصادر أخرى / قنوات متعددة" : "Autre source / Multi-canaux",
    secondaryLabel: isAr ? "قنوات متنوعة" : "Réseaux mixtes & SEO",
    badge: "Mixte",
    badgeColor: "bg-stone-50 text-stone-700 border-stone-200",
  },
];

const getExperienceLevelOptions = (isAr: boolean): ModernSelectOption[] => [
  {
    value: "BEGINNER",
    label: isAr ? "مبتدئ" : "Débutant",
    secondaryLabel: isAr ? "أقل من 10 طلبيات / يوم" : "Moins de 10 commandes / jour",
    badge: "< 10/j",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "INTERMEDIATE",
    label: isAr ? "متوسط" : "Intermédiaire",
    secondaryLabel: isAr ? "10 إلى 50 طلبية / يوم" : "10 à 50 commandes / jour",
    badge: "10-50/j",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    value: "ADVANCED",
    label: isAr ? "محترف / سكيل" : "Confirmé / Scale",
    secondaryLabel: isAr ? "أكثر من 50 طلبية / يوم" : "+ de 50 commandes / jour",
    badge: "50+/j",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

const getBusinessTypeOptions = (isAr: boolean): ModernSelectOption[] => [
  {
    value: "IMPORTER",
    label: isAr ? "مستورد مباشر" : "Importateur direct",
    secondaryLabel: isAr ? "حاويات واستيراد مباشر" : "Stock conteneurs & gros volumes",
    badge: "Import",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "MANUFACTURER",
    label: isAr ? "مصنع / منتج محلي" : "Fabricant / Producteur local",
    secondaryLabel: isAr ? "صناعة وإنتاج وطني جزائري" : "Production locale certifiée DZ",
    badge: "DZ Fabrique",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    value: "WHOLESALER",
    label: isAr ? "تاجر جملة / موزع" : "Grossiste / Distributeur",
    secondaryLabel: isAr ? "توزيع ومخازن جملة" : "Dépôt régional & distribution",
    badge: "Grossiste",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "ECOMMERCE_BRAND",
    label: isAr ? "علامة تجارية إلكترونية" : "Marque E-commerce / D2C",
    secondaryLabel: isAr ? "براند خاص وتصاميم حصرية" : "Produits exclusifs & branding",
    badge: "Brand",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

const getCallCenterPreferenceOptions = (isAr: boolean): ModernSelectOption[] => [
  {
    value: "VITEDROP_MANAGED",
    label: isAr ? "مركز اتصال فايت دروب" : "Call Center ViteDrop",
    secondaryLabel: isAr ? "تغطية 58 ولاية بلهجة محلية" : "58 Wilayas certifié, dialecte DZ",
    badge: isAr ? "موصى به" : "Recommandé",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
  },
  {
    value: "IN_HOUSE",
    label: isAr ? "مركز اتصال داخلي" : "Call Center interne",
    secondaryLabel: isAr ? "فريق تأكيد خاص بك" : "Géré par votre propre équipe",
    badge: "Interne",
    badgeColor: "bg-stone-50 text-stone-700 border-stone-200",
  },
  {
    value: "HYBRID",
    label: isAr ? "مختلط / حسب المنتجات" : "Mixte / Selon les produits",
    secondaryLabel: isAr ? "توزيع مرن للاتصالات" : "Gestion hybride flexible",
    badge: "Mixte",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
  },
];

const getMonthlyVolumeOptions = (isAr: boolean): ModernSelectOption[] => [
  {
    value: "UNDER_100",
    label: isAr ? "أقل من 100 طلبية / شهر" : "Moins de 100 commandes / mois",
    secondaryLabel: isAr ? "بداية النشاط" : "Phase de lancement & test",
    badge: "< 100",
    badgeColor: "bg-neutral-100 text-neutral-700 border-neutral-200",
  },
  {
    value: "100_500",
    label: isAr ? "100 إلى 500 طلبية / شهر" : "100 à 500 commandes / mois",
    secondaryLabel: isAr ? "نشاط مستقر" : "Croissance régulière",
    badge: "100-500",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    value: "500_2000",
    label: isAr ? "500 إلى 2,000 طلبية / شهر" : "500 à 2 000 commandes / mois",
    secondaryLabel: isAr ? "حجم كبير" : "Volume soutenu",
    badge: "500-2K",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "OVER_2000",
    label: isAr ? "أكثر من 2,000 طلبية / شهر" : "Plus de 2 000 commandes / mois",
    secondaryLabel: isAr ? "سعة ضخمة / شاحنات" : "Grand compte / Haute cadence",
    badge: "2K+",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200 font-bold",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"affiliate" | "supplier">("affiliate");

  // Common Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Affiliate Fields (Option 1)
  const [affiliateWilaya, setAffiliateWilaya] = useState("16"); // Alger default
  const [trafficSource, setTrafficSource] = useState("FACEBOOK_INSTAGRAM");
  const [experienceLevel, setExperienceLevel] = useState("BEGINNER");
  const [telegramHandle, setTelegramHandle] = useState("");

  // Supplier Fields (Option 1)
  const [company, setCompany] = useState("");
  const [warehouseWilaya, setWarehouseWilaya] = useState("16");
  const [warehouseCommune, setWarehouseCommune] = useState("");
  const [businessType, setBusinessType] = useState("IMPORTER");
  const [callCenterPreference, setCallCenterPreference] = useState("VITEDROP_MANAGED");
  const [monthlyVolume, setMonthlyVolume] = useState("100_500");

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

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    const phoneCheck = validateAlgerianPhone(phone);
    if (!phoneCheck.isValid) {
      const msg = "Format algérien invalide (ex: 0550123456 ou 0661000000)";
      setPhoneError(msg);
      setError(msg);
      return;
    }

    if (role === "supplier") {
      if (!company.trim()) {
        setError("Le nom de l'entreprise ou marque est obligatoire pour les fournisseurs.");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (role === "affiliate") {
        await apiRegisterAffiliate({
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim(),
          phone: phoneCheck.normalized,
          trafficSource,
          experienceLevel,
          wilaya: parseInt(affiliateWilaya, 10),
          telegramHandle: telegramHandle.trim() || undefined,
        });
      } else {
        await apiRegisterSupplier({
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim(),
          phone: phoneCheck.normalized,
          company: company.trim(),
          warehouseWilaya: parseInt(warehouseWilaya, 10),
          warehouseCommune: warehouseCommune.trim() || undefined,
          businessType,
          callCenterPreference,
          monthlyVolume,
        });
      }

      setIsLoading(false);
      setSuccess(true);

      // Redirect directly to verification page
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&role=${role}`);
      }, 600);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "Échec de l'inscription auprès du serveur.");
    }
  };

  return (
    <AuthCard initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const isAr = lang === "ar";

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
                {isAr
                  ? "انضم إلى شبكة الأفلييت والتجارة الإلكترونية الأولى في الجزائر"
                  : "Rejoignez le réseau d'affiliation CPA & Dropshipping COD n°1 en Algérie"}
              </p>
            </div>

            {/* Role Picker Segmented Control */}
            <div className="flex justify-center">
              <Tabs
                tabs={roleTabs}
                activeTab={role}
                onChange={(r) => {
                  setRole(r as "affiliate" | "supplier");
                  setError("");
                }}
                layoutId="register-role-pill"
              />
            </div>

            {/* Error / Success */}
            {error && (
              <div data-testid="register-error-banner" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div data-testid="register-success-banner" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Compte créé ! Redirection vers la vérification par e-mail...</span>
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              {/* Base User Account Information */}
              <div className="space-y-3.5">
                <Input
                  data-testid="register-name-input"
                  label={t.auth.fullName}
                  type="text"
                  placeholder="Karim Mansouri"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  startIcon={<User className="w-4 h-4" />}
                  required
                />

                <Input
                  data-testid="register-email-input"
                  label={t.auth.email}
                  type="email"
                  placeholder="karim@exemple.dz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Input
                  data-testid="register-phone-input"
                  dir="ltr"
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
                  data-testid="register-password-input"
                  label={t.auth.password}
                  type="password"
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  startIcon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              {/* Affiliate Specific Fields */}
              {role === "affiliate" && (
                <div className="space-y-3.5 pt-3 border-t border-black/[0.06] animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? "معلومات المسوق (Affilié)" : "Profil Affilié & Canaux"}</span>
                  </div>

                  <ModernSelect
                    label={isAr ? "مصدر الزيارات الرئيسي (Traffic Source)" : "Source de trafic principale"}
                    value={trafficSource}
                    onChange={(val) => setTrafficSource(val)}
                    options={getTrafficSourceOptions(isAr)}
                    icon={<Share2 className="w-3.5 h-3.5 text-emerald-600" />}
                    data-testid="register-traffic-source-trigger"
                    nativeSelectTestId="register-traffic-source-select"
                  />

                  <ModernSelect
                    label={isAr ? "الخبرة في التجارة الإلكترونية والدفع عند الاستلام" : "Expérience en E-commerce / COD"}
                    value={experienceLevel}
                    onChange={(val) => setExperienceLevel(val)}
                    options={getExperienceLevelOptions(isAr)}
                    icon={<Award className="w-3.5 h-3.5 text-emerald-600" />}
                    data-testid="register-experience-level-trigger"
                    nativeSelectTestId="register-experience-level-select"
                  />

                  <WilayaSelect
                    label={isAr ? "ولاية الإقامة" : "Wilaya de résidence"}
                    value={affiliateWilaya}
                    onChange={(code) => setAffiliateWilaya(code)}
                    lang={lang}
                  />

                  <Input
                    label={isAr ? "حساب تيليغرام أو واتساب (اختياري)" : "Pseudo Telegram ou WhatsApp (optionnel)"}
                    type="text"
                    placeholder="@karim_marketing ou 0550123456"
                    value={telegramHandle}
                    onChange={(e) => setTelegramHandle(e.target.value)}
                    helperText={isAr ? "للتواصل المباشر مع مدير حسابك" : "Permet à votre Account Manager de vous contacter rapidement"}
                    startIcon={<Send className="w-4 h-4 text-neutral-400" />}
                  />
                </div>
              )}

              {/* Supplier Specific Fields */}
              {role === "supplier" && (
                <div className="space-y-3.5 pt-3 border-t border-black/[0.06] animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-800">
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>{isAr ? "معلومات المورد والمستودع" : "Profil Fournisseur & Entrepôt"}</span>
                  </div>

                  <Input
                    data-testid="register-company-input"
                    label={t.auth.company}
                    type="text"
                    placeholder="Atlas Distribution SARL"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    startIcon={<Building2 className="w-4 h-4" />}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <WilayaSelect
                      label={isAr ? "ولاية المستودع الرئيسي" : "Wilaya de l'entrepôt"}
                      value={warehouseWilaya}
                      onChange={(code) => setWarehouseWilaya(code)}
                      lang={lang}
                      data-testid="register-wilaya-select"
                    />

                    <Input
                      label={isAr ? "بلدية المستودع (اختياري)" : "Commune de l'entrepôt (optionnel)"}
                      type="text"
                      placeholder="Ex: Boufarik, Oued Smar..."
                      value={warehouseCommune}
                      onChange={(e) => setWarehouseCommune(e.target.value)}
                      startIcon={<MapPin className="w-4 h-4" />}
                    />
                  </div>

                  <ModernSelect
                    label={isAr ? "نوع النشاط التجاري" : "Type d'activité commerciale"}
                    value={businessType}
                    onChange={(val) => setBusinessType(val)}
                    options={getBusinessTypeOptions(isAr)}
                    icon={<Briefcase className="w-3.5 h-3.5 text-sky-600" />}
                    data-testid="register-business-type-trigger"
                    nativeSelectTestId="register-business-type-select"
                  />

                  <ModernSelect
                    label={isAr ? "تأكيد الطلبيات (Call Center)" : "Gestion de la confirmation des commandes"}
                    value={callCenterPreference}
                    onChange={(val) => setCallCenterPreference(val)}
                    options={getCallCenterPreferenceOptions(isAr)}
                    icon={<Headphones className="w-3.5 h-3.5 text-sky-600" />}
                    data-testid="register-call-center-trigger"
                    nativeSelectTestId="register-call-center-select"
                  />

                  <ModernSelect
                    label={isAr ? "الحجم الشهري المتوقع للطلبات" : "Volume de commandes estimé / mois"}
                    value={monthlyVolume}
                    onChange={(val) => setMonthlyVolume(val)}
                    options={getMonthlyVolumeOptions(isAr)}
                    icon={<BarChart3 className="w-3.5 h-3.5 text-sky-600" />}
                    data-testid="register-monthly-volume-trigger"
                    nativeSelectTestId="register-monthly-volume-select"
                  />
                </div>
              )}

              <div className="pt-2">
                <Button
                  data-testid="register-submit-btn"
                  type="submit"
                  size="md"
                  isLoading={isLoading}
                  className="w-full"
                >
                  {isAr ? "إنشاء حساب ومتابعة التأكيد" : "Créer mon compte et recevoir le code"}
                </Button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-black/[0.06] text-xs text-[#6b6b6b]">
              <span>{t.auth.alreadyHaveAccount} </span>
              <Link
                data-testid="register-login-link"
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
