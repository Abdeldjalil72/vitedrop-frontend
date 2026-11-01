"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getCurrentUser, apiGetMarketplaceProducts } from "@/lib/api-client";
import { formatDZD } from "@/lib/formatters";
import {
  Link2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Tag,
  Share2,
  ShieldCheck,
  Zap,
  Layers,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface TrafficPreset {
  id: string;
  label: string;
  source: string;
  medium: string;
}

const TRAFFIC_PRESETS: TrafficPreset[] = [
  { id: "facebook", label: "Facebook / Meta", source: "facebook", medium: "paid_social" },
  { id: "tiktok", label: "TikTok Ads", source: "tiktok", medium: "spark_ad" },
  { id: "snapchat", label: "Snapchat Ads", source: "snapchat", medium: "story_ad" },
  { id: "google", label: "Google Ads", source: "google", medium: "cpc" },
];

const linksI18n = {
  fr: {
    badgeEyebrow: "Tracking & S2S Campaigns",
    telemetryEyebrow: "Pixel & CAPI Telemetry",
    title: "Générateur de Liens & Campagnes S2S",
    description: "Créez des liens trackés avec tags UTM et sous-identifiants pour vos campagnes Meta, TikTok, Snapchat et Google Ads.",
    configTitle: "Configuration du Lien de Campagne",
    trafficSource: "Source de Trafic Prédéfinie",
    selectedProduct: "Produit Sélectionné",
    loadingProducts: "Chargement...",
    sourceUtm: "Source UTM (utm_source)",
    campaignUtm: "Campagne UTM (utm_campaign)",
    subId: "Sub-ID / AdSet (sub_id)",
    generatedBoxEyebrow: "Lien de Tracking Généré (Prêt à l'emploi)",
    selectProductPrompt: "Sélectionnez un produit",
    copyBtn: "Copier le Lien",
    copiedBtn: "Copié !",
    s2sTitle: "Architecture de Tracking S2S (Server-to-Server Conversions API)",
    s2sDesc: "Le moteur ViteDrop assure la capture des signaux de conversion et le postback vers vos comptes publicitaires Meta & TikTok sans perte de signal due aux ad-blockers.",
    step1Title: "Capture du Clic Initial",
    step1Desc: "Génération automatique d'un identifiant click_id scellé avec fbclid et ttclid.",
    step2Title: "Attribution du Lead COD",
    step2Desc: "Attachement immuable des métadonnées publicitaires à la commande client.",
    step3Title: "CAPI Post-Livraison",
    step3Desc: "Dès validation de la livraison physique par le livreur, l'événement Purchase est émis.",
    catalogTitle: "Catalogue des Liens Rapides",
    catalogDesc: "Liens par défaut prêts pour partage direct sans tags personnalisés.",
    productsCount: "produits",
    colProduct: "Produit",
    colPayout: "Payout Net Affilié",
    colLink: "Lien Direct Produit",
    colAction: "Action",
    emptyCatalog: "Aucun produit disponible",
    copyShort: "Copier",
    copiedShort: "Copié !",
    generalCategory: "Général",
    yourNetCpa: "Votre CPA Net:",
    copiedLinkFull: "Lien copié !",
  },
  en: {
    badgeEyebrow: "Tracking & S2S Campaigns",
    telemetryEyebrow: "Pixel & CAPI Telemetry",
    title: "Link Generator & S2S Campaigns",
    description: "Create tracked links with UTM tags and Sub-IDs for your Meta, TikTok, Snapchat, and Google Ads campaigns.",
    configTitle: "Campaign Link Configuration",
    trafficSource: "Pre-configured Traffic Source",
    selectedProduct: "Selected Product",
    loadingProducts: "Loading products...",
    sourceUtm: "Source UTM (utm_source)",
    campaignUtm: "Campaign UTM (utm_campaign)",
    subId: "Sub-ID / AdSet (sub_id)",
    generatedBoxEyebrow: "Generated Tracking Link (Ready to use)",
    selectProductPrompt: "Select a product",
    copyBtn: "Copy Link",
    copiedBtn: "Copied!",
    s2sTitle: "Server-to-Server Tracking Architecture (CAPI Telemetry)",
    s2sDesc: "The ViteDrop engine captures conversion signals and delivers postbacks to your Meta & TikTok ad accounts without signal degradation from ad blockers.",
    step1Title: "Initial Click Capture",
    step1Desc: "Automatic generation of an immutable click_id sealed with fbclid and ttclid parameters.",
    step2Title: "COD Lead Attribution",
    step2Desc: "Immutable attachment of campaign metadata to customer Cash-on-Delivery orders.",
    step3Title: "Post-Delivery CAPI",
    step3Desc: "As soon as physical delivery and cash collection are confirmed by courier, the Purchase event is emitted.",
    catalogTitle: "Quick Links Catalog",
    catalogDesc: "Default direct links ready for one-click sharing without custom tags.",
    productsCount: "products",
    colProduct: "Product",
    colPayout: "Affiliate Net Payout",
    colLink: "Direct Product Link",
    colAction: "Action",
    emptyCatalog: "No products available currently",
    copyShort: "Copy",
    copiedShort: "Copied!",
    generalCategory: "General",
    yourNetCpa: "Your Net CPA:",
    copiedLinkFull: "Link copied!",
  },
  ar: {
    badgeEyebrow: "تتبع الروابط والإعلانات S2S",
    telemetryEyebrow: "نسبة نقرات دقيقة 100%",
    title: "مولد الروابط وحملات التتبع",
    description: "أنشئ روابط تتبع مخصصة مع معلمات UTM ومعرفات الإعلانات الفرعية لضمان احتساب عمولات الدفع عند الاستلام تلقائياً.",
    configTitle: "إعداد رابط الحملة الجديد",
    trafficSource: "منصة الإعلانات (Traffic Preset)",
    selectedProduct: "المنتج المستهدف",
    loadingProducts: "جاري تحميل المنتجات...",
    sourceUtm: "المصدر (utm_source)",
    campaignUtm: "اسم الحملة (utm_campaign)",
    subId: "Sub-ID / AdSet (sub_id)",
    generatedBoxEyebrow: "رابط التتبع الجاهز للنشر",
    selectProductPrompt: "يرجى اختيار منتج",
    copyBtn: "نسخ الرابط",
    copiedBtn: "تم النسخ بنجاح!",
    s2sTitle: "بنية التتبع من الخادم إلى الخادم (S2S CAPI Telemetry)",
    s2sDesc: "يضمن نظام فايت دروب تتبع كل نقرة وطلب بدون فقدان للبيانات نتيجة حظر الكوكيز أو التحديثات الأمنية للمتصفحات.",
    step1Title: "التقاط النقرة (Click ID)",
    step1Desc: "تسجيل معلمات fbclid و ttclid و aff في جلسة المشاهدة فور دخول المتجر.",
    step2Title: "تثبيت الطلب (Lead Sealing)",
    step2Desc: "ربط الطلب ومقاطعة الشحن بحساب المسوق تلقائياً دون أي تلاعب.",
    step3Title: "تحصيل العمولة فور التسليم",
    step3Desc: "عند تسليم الطرد من قبل شركة التوصيل وقبض المبلغ نقداً، يتم إرسال حدث الشراء للبيكسل.",
    catalogTitle: "روابط المنتجات المباشرة في السوق",
    catalogDesc: "انسخ الروابط الافتراضية المباشرة لمنتجات الكتالوج بضغطة واحدة.",
    productsCount: "منتج",
    colProduct: "المنتج",
    colPayout: "عمولة CPA الصافية",
    colLink: "الرابط الافتراضي",
    colAction: "الإجراء",
    emptyCatalog: "لا توجد منتجات متاحة حالياً",
    copyShort: "نسخ",
    copiedShort: "تم النسخ!",
    generalCategory: "عام",
    yourNetCpa: "عمولة CPA:",
    copiedLinkFull: "تم النسخ في الحافظة!",
  },
};

export default function AffiliateLinksPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>("facebook");
  const [utmSource, setUtmSource] = useState("facebook");
  const [utmMedium, setUtmMedium] = useState("paid_social");
  const [utmCampaign, setUtmCampaign] = useState("alger_broad_conversion");
  const [subId, setSubId] = useState("adset_v1");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadProducts = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await apiGetMarketplaceProducts();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
        setSelectedProductId(data[0].id);
      } else {
        setProducts([]);
        setSelectedProductId("");
        setLoadError("Aucun produit actif disponible dans le catalogue.");
      }
    } catch (err: any) {
      console.error("Failed to load live products for link generator:", err);
      setProducts([]);
      setSelectedProductId("");
      setLoadError("Impossible de charger les produits du catalogue. Veuillez vérifier votre connexion et réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    loadProducts();
  }, []);

  const affiliateId = currentUser?.sub || "aff-qa-uuid";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://vitedrop.dz";

  const generatedLink = selectedProductId
    ? `${baseUrl}/p/${selectedProductId}?aff=${affiliateId}&utm_source=${encodeURIComponent(
        utmSource
      )}&utm_medium=${encodeURIComponent(utmMedium)}&utm_campaign=${encodeURIComponent(
        utmCampaign
      )}&sub_id=${encodeURIComponent(subId)}`
    : "";

  const handleApplyPreset = (preset: TrafficPreset) => {
    setActivePreset(preset.id);
    setUtmSource(preset.source);
    setUtmMedium(preset.medium);
  };

  const handleCopyGenerated = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyDirect = (productId: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedProductId(productId);
    setTimeout(() => setCopiedProductId(null), 2000);
  };

  return (
    <DashboardLayout initialRole="affiliate" initialLang="fr">
      {({ lang }) => {
        const dict = linksI18n[lang as "en" | "fr" | "ar"] || linksI18n.fr;
        const isAr = lang === "ar";

        return (
          <div className="space-y-8 text-start w-full max-w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs ${isAr ? "" : "font-mono uppercase tracking-wider"} text-sky-700 font-semibold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200`}>
                    {dict.badgeEyebrow}
                  </span>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {dict.telemetryEyebrow}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight mt-1">
                  {dict.title}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl">
                  {dict.description}
                </p>
              </div>
            </div>

            {/* Campaign Link Builder Card */}
            <Card className="p-6 sm:p-8 space-y-6 bg-white border border-black/[0.08] shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-600" />
                  <span>{dict.configTitle}</span>
                </h2>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-semibold">
                  aff={affiliateId}
                </span>
              </div>

              {/* Traffic Source Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700">
                  {dict.trafficSource}
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRAFFIC_PRESETS.map((p) => {
                    const isSelected = activePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        data-testid={`preset-${p.id}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-sky-600 text-white shadow-xs"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Configuration Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Error Banner & Retry */}
                {loadError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{loadError}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={loadProducts}
                      className="h-7 px-2 text-xs border-rose-200 text-rose-700 hover:bg-rose-100 shrink-0"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      {lang === "ar" ? "إعادة المحاولة" : "Réessayer"}
                    </Button>
                  </div>
                )}

                {/* Product Selection */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    {dict.selectedProduct}
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    data-testid="product-select"
                    disabled={isLoading || Boolean(loadError)}
                    className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2.5 text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <option value="">{dict.loadingProducts}</option>
                    ) : loadError ? (
                      <option value="">{lang === "ar" ? "تعذر تحميل المنتجات" : "Erreur de chargement"}</option>
                    ) : products.length === 0 ? (
                      <option value="">{lang === "ar" ? "لا توجد منتجات متاحة" : "Aucun produit disponible"}</option>
                    ) : (
                      products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name || p.title} ({p.affiliateNetPayout ? formatDZD(p.affiliateNetPayout, lang) : "CPA"})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Source UTM */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    {dict.sourceUtm}
                  </label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => {
                      setUtmSource(e.target.value);
                      setActivePreset("");
                    }}
                    placeholder="facebook, tiktok, snapchat..."
                    data-testid="link-source-input"
                    className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2.5 font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Campaign UTM */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    {dict.campaignUtm}
                  </label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="nom_campagne_01"
                    data-testid="link-campaign-input"
                    className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2.5 font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Sub ID */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    {dict.subId}
                  </label>
                  <input
                    type="text"
                    value={subId}
                    onChange={(e) => setSubId(e.target.value)}
                    placeholder="adset_v1, video_hook_2..."
                    data-testid="link-subid-input"
                    className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2.5 font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Generated Tracking Link Output Box */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                      {dict.generatedBoxEyebrow}
                    </span>
                    <span
                      data-testid="generated-link-display"
                      className="text-xs font-mono font-semibold text-neutral-900 truncate"
                    >
                      {generatedLink || dict.selectProductPrompt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={handleCopyGenerated}
                    disabled={!generatedLink}
                    size="sm"
                    data-testid="copy-generated-link-btn"
                    className="text-xs px-4 py-2 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white shadow-xs"
                  >
                    {copiedLink ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedLink ? dict.copiedBtn : dict.copyBtn}</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* S2S Conversions API & Postback Telemetry Card */}
            <Card
              className="p-6 sm:p-8 bg-linear-to-br from-sky-50/60 via-white to-blue-50/40 border border-sky-200/70 shadow-xs space-y-4"
              data-testid="s2s-telemetry-card"
            >
              <div className="flex items-center gap-2 text-sky-800">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm sm:text-base font-bold">
                  {dict.s2sTitle}
                </h3>
              </div>
              <p className="text-xs text-[#6b6b6b] leading-relaxed">
                {dict.s2sDesc}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-white border border-sky-100 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs font-mono font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold text-neutral-900">
                      {dict.step1Title}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-normal">
                    {dict.step1Desc}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-sky-100 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs font-mono font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-bold text-neutral-900">
                      {dict.step2Title}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-normal">
                    {dict.step2Desc}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-sky-100 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-mono font-bold flex items-center justify-center">
                      3
                    </span>
                    <span className="text-xs font-bold text-neutral-900">
                      {dict.step3Title}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-normal">
                    {dict.step3Desc}
                  </p>
                </div>
              </div>
            </Card>

            {/* Existing Active Products (Dual-Rendering Desktop Table + Mobile Cards) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                    {dict.catalogTitle}
                  </h2>
                  <p className="text-xs text-[#6b6b6b]">
                    {dict.catalogDesc}
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60">
                  {products.length} {dict.productsCount}
                </span>
              </div>

              {/* Desktop Table View (>= 640px) */}
              <div className="hidden sm:block">
                <Table data-testid="affiliate-links-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{dict.colProduct}</TableHead>
                      <TableHead>{dict.colPayout}</TableHead>
                      <TableHead>{dict.colLink}</TableHead>
                      <TableHead className="text-end">{dict.colAction}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-neutral-500 text-xs">
                          {dict.emptyCatalog}
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((p) => {
                        const directLink = `${baseUrl}/p/${p.id}?aff=${affiliateId}`;
                        const isCopied = copiedProductId === p.id;
                        return (
                          <TableRow key={p.id} data-testid="affiliate-link-row">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm text-neutral-900 tracking-tight leading-snug">
                                  {p.name || p.title}
                                </span>
                                <span className="text-xs text-neutral-500 mt-0.5">
                                  {p.category || dict.generalCategory}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className="font-mono text-xs font-bold text-emerald-600 tracking-tight"
                                data-testid="affiliate-net-payout"
                              >
                                {p.affiliateNetPayout ? formatDZD(p.affiliateNetPayout, lang) : "—"}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-neutral-500 max-w-xs truncate">
                              {directLink}
                            </TableCell>
                            <TableCell className="text-end">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleCopyDirect(p.id, directLink)}
                                data-testid="copy-product-link-btn"
                                className={`text-xs px-3 py-1 transition-all ${
                                  isCopied ? "border-emerald-500 text-emerald-700 bg-emerald-50/50" : ""
                                }`}
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>{isCopied ? dict.copiedShort : dict.copyShort}</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View (< 640px) */}
              <div className="sm:hidden flex flex-col gap-3">
                {products.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500 bg-white rounded-2xl border border-black/[0.08]">
                    {dict.emptyCatalog}
                  </div>
                ) : (
                  products.map((p) => {
                    const directLink = `${baseUrl}/p/${p.id}?aff=${affiliateId}`;
                    const isCopied = copiedProductId === p.id;
                    return (
                      <div
                        key={p.id}
                        data-testid="affiliate-link-card"
                        className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm text-neutral-900 tracking-tight leading-snug">
                              {p.name || p.title}
                            </h3>
                            <span className="text-xs text-neutral-500 mt-0.5">
                              {p.category || dict.generalCategory}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-200/50 shrink-0">
                            CPA Net
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-neutral-50">
                          <span className="text-neutral-500 text-[11px]">
                            {dict.yourNetCpa}
                          </span>
                          <span
                            className="font-mono font-bold text-emerald-600"
                            data-testid="affiliate-net-payout"
                          >
                            {p.affiliateNetPayout ? formatDZD(p.affiliateNetPayout, lang) : "—"}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-neutral-100/70 font-mono text-[11px] text-neutral-600 truncate">
                          {directLink}
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopyDirect(p.id, directLink)}
                          data-testid="copy-product-link-btn"
                          className={`w-full text-xs py-2 transition-all ${
                            isCopied ? "border-emerald-500 text-emerald-700 bg-emerald-50/50" : ""
                          }`}
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{isCopied ? dict.copiedLinkFull : dict.copyBtn}</span>
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
