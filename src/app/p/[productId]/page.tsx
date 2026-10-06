"use client";

import React, { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Truck,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Star,
  Package,
  BadgeCheck,
  ChevronRight,
  Flame,
  Globe,
  Share2,
  Copy,
} from "lucide-react";
import { CodCheckoutForm } from "@/components/checkout/cod-checkout-form";
import { formatDZD } from "@/lib/formatters";
import { apiGetPublicProduct, PublicCheckoutProduct } from "@/lib/api-client";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default function CustomerProductLandingPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.productId;
  const searchParams = useSearchParams();

  // Affiliate & Ad Tracking parameters
  const affiliateId = searchParams.get("ref") || "cdc56d60-c4dd-48ed-be17-d637bcb392ae";
  const fbclid = searchParams.get("fbclid") || undefined;
  const ttclid = searchParams.get("ttclid") || undefined;
  const utmCampaign = searchParams.get("utm_campaign") || undefined;
  const subId = searchParams.get("sub_id") || undefined;

  // Language state (Default: Arabic for highest conversion in Algeria)
  const [lang, setLang] = useState<"ar" | "fr">("ar");
  const isAr = lang === "ar";

  // Product state
  const [product, setProduct] = useState<PublicCheckoutProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery active image
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Success state after order placed
  const [completedOrder, setCompletedOrder] = useState<{
    orderId: string;
    customerName: string;
    customerPhone: string;
    wilayaName: string;
    commune: string;
    deliveryType: "home" | "desk";
    quantity: number;
    totalAmount: number;
  } | null>(null);

  // Copied order ID state
  const [copiedId, setCopiedId] = useState(false);

  // Fetch product on mount
  useEffect(() => {
    async function loadProduct() {
      try {
        setIsLoading(true);
        const data = await apiGetPublicProduct(productId);
        setProduct(data);
      } catch (err: any) {
        console.warn("Backend fetch failed or product not found, using fallback showcase data:", err);
        // Resilient fallback for preview/testing
        setProduct({
          id: productId,
          name: isAr ? "ساعة ذكية رياضية Ultra Pro المقاومة للماء" : "Montre Connectée Sport Ultra Pro Étanche",
          description: isAr 
            ? "شاشة AMOLED فائقة الوضوح، قياس نبضات القلب والأكسجين في الدم، بطارية تدوم حتى 7 أيام، متوافقة مع جميع الهواتف (Android & iOS). تصميم أنيق وهيكل متين من سبائك التيتانيوم."
            : "Écran AMOLED haute définition, suivi cardiaque et SpO2, autonomie longue durée de 7 jours, compatible avec tous les smartphones Android et iOS.",
          retailPrice: 4900,
          stock: 14,
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId, isAr]);

  // Gallery images (product or placeholder mockups)
  const productImages = [
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1000&q=80",
  ];

  const scrollToCheckout = () => {
    const el = document.getElementById("checkout-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-medium text-neutral-600">
            {isAr ? "جارٍ تجهيز صفحة المنتج..." : "Chargement de la page produit..."}
          </p>
        </div>
      </div>
    );
  }

  // SUCCESS CONFIRMATION VIEW
  if (completedOrder) {
    return (
      <div className={`min-h-screen bg-[#f8fafc] py-8 sm:py-16 px-4 ${isAr ? "rtl font-sans" : "ltr"}`}>
        <div className="max-w-xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl border border-neutral-200/80 shadow-2xl p-6 sm:p-10 text-center relative overflow-hidden"
          >
            {/* Top Confetti accent */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600" />

            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 mb-6 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3 border border-emerald-200/60">
              <Sparkles className="w-3.5 h-3.5" />
              {isAr ? "تم تسجيل طلبك بنجاح!" : "Commande enregistrée avec succès !"}
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-2">
              {isAr ? "شكراً لك على ثقتك بنا" : "Merci pour votre confiance"}
            </h1>

            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              {isAr
                ? "سيتصل بك فريق خدمة العملاء على هاتفك لتأكيد عنوان الشحن قبل تسليم الطرد للموزع."
                : "Notre service client vous appellera sous peu pour confirmer l'adresse avant remise au livreur."}
            </p>

            {/* Order Reference Badge */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between mb-6">
              <div className="text-start">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  {isAr ? "رقم الطلب المرجعي" : "N° de commande"}
                </p>
                <p className="text-sm sm:text-base font-mono font-bold text-neutral-900">
                  #{completedOrder.orderId.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyOrderId(completedOrder.orderId)}
                className="px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? "تم النسخ" : "Copié"}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{isAr ? "نسخ" : "Copier"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Summary details */}
            <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-blue-50/40 border border-blue-100 text-start text-xs sm:text-sm">
              <div className="flex items-center justify-between text-neutral-700">
                <span className="text-neutral-500">{isAr ? "العميل:" : "Client:"}</span>
                <span className="font-semibold">{completedOrder.customerName}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-700">
                <span className="text-neutral-500">{isAr ? "الهاتف:" : "Téléphone:"}</span>
                <span className="font-mono font-semibold" dir="ltr">{completedOrder.customerPhone}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-700">
                <span className="text-neutral-500">{isAr ? "الوجهة:" : "Destination:"}</span>
                <span className="font-semibold">{completedOrder.wilayaName} ({completedOrder.commune})</span>
              </div>
              <div className="flex items-center justify-between text-neutral-700">
                <span className="text-neutral-500">{isAr ? "طريقة التوصيل:" : "Mode de livraison:"}</span>
                <span className="font-semibold">
                  {completedOrder.deliveryType === "home"
                    ? (isAr ? "توصيل للمنزل" : "À Domicile")
                    : (isAr ? "استلام من المكتب" : "Stop-Desk Bureau")}
                </span>
              </div>
              <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-base font-bold text-neutral-900">
                <span>{isAr ? "المبلغ المطلوب عند الاستلام:" : "Montant à payer au livreur:"}</span>
                <span className="font-mono text-emerald-600 text-lg">
                  {formatDZD(completedOrder.totalAmount, lang)}
                </span>
              </div>
            </div>

            {/* Reassurance step guide */}
            <div className="mt-8 space-y-4 text-start">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {isAr ? "الخطوات القادمة" : "Prochaines étapes"}
              </h4>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-neutral-900">
                    {isAr ? "مكالمة التأكيد الهاتفية" : "Appel de confirmation"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {isAr
                      ? "يُرجى إبقاء هاتفك مفتوحاً. سيتصل بك فريقنا لتأكيد العنوان."
                      : "Gardez votre téléphone à portée. Notre équipe confirmera vos coordonnées."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-neutral-900">
                    {isAr ? "شحن الطرد مع شركة التوصيل" : "Expédition de votre colis"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {isAr
                      ? "يتم شحن طلبك مع Yalidine أو ZR Express في غضون 24-48 ساعة."
                      : "Colis confié au transporteur pour une livraison express sous 24-48h."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-neutral-900">
                    {isAr ? "المعاينة والدفع عند الاستلام" : "Vérification et paiement"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {isAr
                      ? "افحص طردك براحة تامة ثم ادفع للموزع نقداً."
                      : "Vérifiez votre article puis réglez en espèces au livreur."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="w-full py-3 px-4 rounded-xl border border-neutral-200 text-xs sm:text-sm font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                {isAr ? "طلب قطعة إضافية" : "Passer une autre commande"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#fafbfc] text-neutral-900 ${isAr ? "rtl font-sans" : "ltr"}`}>
      {/* 1. TOP URGENCY & TRUST BANNER */}
      <div className="bg-slate-900 text-white text-xs py-2.5 px-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-neutral-300 hidden sm:inline">
              {isAr ? "تخفيض حصري اليوم فقط" : "Offre exclusive aujourd'hui"} —
            </span>
            <span className="font-bold text-amber-300">
              {isAr ? "الدفع نقدًا عند الاستلام لـ 58 ولاية" : "Paiement à la livraison sur 58 Wilayas"}
            </span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
            <button
              type="button"
              onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
              className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {lang === "ar" ? "Français" : "العربية"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-10 pb-28 sm:pb-12">
        {/* PRODUCT HERO SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-md">
              <img
                src={productImages[activeImageIndex]}
                alt={product?.name || "Product"}
                className="w-full h-full object-cover transition-all duration-300"
              />

              <div className="absolute top-3 start-3 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow-md flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>{isAr ? "خصم 35%" : "-35% PROMO"}</span>
              </div>

              <div className="absolute bottom-3 end-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium">
                {activeImageIndex + 1} / {productImages.length}
              </div>
            </div>

            {/* Thumbnail selector */}
            <div className="flex items-center gap-3">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? "border-blue-600 ring-2 ring-blue-600/30 scale-105"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details & Urgency */}
          <div className="space-y-5">
            {/* Social Proof Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs font-semibold text-neutral-800">4.9 / 5</span>
              <span className="text-xs text-neutral-400">
                ({isAr ? "+1,420 زبون راضٍ في الجزائر" : "+1,420 avis vérifiés"})
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              {product?.name}
            </h1>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 flex items-baseline justify-between">
              <div>
                <p className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider mb-0.5">
                  {isAr ? "سعر العرض الترويجي" : "Prix promotionnel"}
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black font-mono text-blue-700">
                    {product ? formatDZD(product.retailPrice, lang) : "4,900 DZD"}
                  </span>
                  <span className="text-sm font-mono text-neutral-400 line-through">
                    {product ? formatDZD(Math.round(product.retailPrice * 1.5), lang) : "7,500 DZD"}
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                {isAr ? "الدفع عند الاستلام" : "COD"}
              </span>
            </div>

            {/* Stock Scarcity */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-900">
              <Flame className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isAr 
                  ? "سارع بالطلب: باقي 14 قطعة فقط في مستودع الجزائر العاصمة."
                  : "Dépêchez-vous : plus que 14 pièces en stock à l'entrepôt d'Alger."}
              </span>
            </div>

            {/* Description */}
            <div className="text-sm text-neutral-600 leading-relaxed space-y-2 border-t border-neutral-100 pt-4">
              <p>{product?.description}</p>
            </div>

            {/* Fast Order Trigger Button */}
            <button
              type="button"
              onClick={scrollToCheckout}
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.99]"
            >
              <span>{isAr ? "اضغط هنا للطلب الآن" : "Commander maintenant"}</span>
              <ArrowRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
            </button>

            {/* Trust Bullet Points */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{isAr ? "منتج أصلي ومضمون 100%" : "Produit certifié 100%"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{isAr ? "توصيل سريع لـ 58 ولاية" : "Livraison 58 wilayas"}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{isAr ? "حق الفحص قبل الدفع" : "Vérification au déballage"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{isAr ? "استبدال خلال 48 ساعة" : "Échange sous 48h"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. HOW IT WORKS SECTION */}
        <section className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold text-center text-neutral-900 mb-6">
            {isAr ? "كيف تعمل عملية الشراء والتوصيل؟" : "Comment se déroule la commande ?"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-900 mb-1">
                  {isAr ? "1. املأ بياناتك" : "1. Remplissez le formulaire"}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {isAr
                    ? "أدخل اسمك ورقم هاتفك والولاية في النموذج أدناه في 30 ثانية."
                    : "Entrez votre nom, téléphone et wilaya en moins de 30 secondes."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-900 mb-1">
                  {isAr ? "2. نتصل بك للتأكيد" : "2. Appel de confirmation"}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {isAr
                    ? "يتصل بك فريقنا هاتفياً لمراجعة العنوان والكمية قبل الإرسال."
                    : "Notre équipe vous contacte pour confirmer l'adresse avant expédition."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-950 mb-1">
                  {isAr ? "3. استلم وادفع نقداً" : "3. Payez à la réception"}
                </h3>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  {isAr
                    ? "يصلك الطرد لباب منزلك، تفحصه وتدفع للموزع نقداً بكل أمان."
                    : "Le livreur vous remet le colis. Vous payez en espèces après vérification."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. THE COD CHECKOUT FORM SECTION */}
        <section id="checkout-section" className="scroll-mt-16">
          <div className="text-center mb-6 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              <Package className="w-3.5 h-3.5" />
              {isAr ? "طلب فوري بدون بطاقة بنكية" : "Commande instantanée sans carte bancaire"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              {isAr ? "استمارة حجز الطلب" : "Formulaire de réservation"}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
              {isAr
                ? "املأ معلوماتك وسنتكفل بالباقي. الدفع عند الاستلام بعد معاينة المنتج."
                : "Remplissez vos coordonnées ci-dessous. Paiement à la livraison après inspection."}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {product && (
              <CodCheckoutForm
                productId={product.id}
                productName={product.name}
                retailPrice={product.retailPrice}
                stock={product.stock}
                affiliateId={affiliateId}
                fbclid={fbclid}
                ttclid={ttclid}
                utmCampaign={utmCampaign}
                subId={subId}
                lang={lang}
                onSuccess={(orderId, orderDetails) => {
                  setCompletedOrder({
                    orderId,
                    ...orderDetails,
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
          </div>
        </section>

        {/* 5. VERIFIED CUSTOMER REVIEWS */}
        <section className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-neutral-900">
                {isAr ? "آراء الزبائن وتجاربهم" : "Avis de nos clients"}
              </h3>
              <p className="text-xs text-neutral-500">
                {isAr ? "تقييمات حقيقية من زبائن استلموا طلباتهم" : "Retours authentiques vérifiés"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-sm bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200/60">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>4.9 / 5</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-900">{isAr ? "محمد. ق - الجزائر" : "Mohamed K. - Alger"}</span>
                <span className="text-[10px] text-emerald-600 font-medium">{isAr ? "مشتري موثوق" : "Achat vérifié"}</span>
              </div>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {isAr
                  ? "وصلني المنتج في أقل من 24 ساعة للبليدة. الجودة ممتازة كما في الصور تماماً والموزع احترم الموعد."
                  : "Produit reçu en moins de 24h. Conforme aux photos et livreur ponctuel."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-900">{isAr ? "ياسين. ب - وهران" : "Yacine B. - Oran"}</span>
                <span className="text-[10px] text-emerald-600 font-medium">{isAr ? "مشتري موثوق" : "Achat vérifié"}</span>
              </div>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {isAr
                  ? "اتصلوا بي بعد نصف ساعة من وضع الطلب لتأكيد العنوان، واستلمت طردي في مكتب ياليدين في وهران."
                  : "Service client très réactif. Colis retiré au stop-desk Yalidine d'Oran sans souci."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-900">{isAr ? "فاطمة. م - سطيف" : "Fatima M. - Sétif"}</span>
                <span className="text-[10px] text-emerald-600 font-medium">{isAr ? "مشتري موثوق" : "Achat vérifié"}</span>
              </div>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {isAr
                  ? "عجبني بزاف التغليف وطريقة المعاملة. فتحت الطرد شفتو قبل ما نخلص. شكراً لكم!"
                  : "Emballage soigné, j'ai pu vérifier avant de payer le livreur. Très satisfaite."}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 6. STICKY MOBILE BOTTOM BAR (Converts mobile visitors on scroll) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 p-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-neutral-500 block">
              {isAr ? "السعر عند الاستلام:" : "Prix à la livraison:"}
            </span>
            <span className="font-mono font-black text-blue-700 text-lg">
              {product ? formatDZD(product.retailPrice, lang) : "4,900 DZD"}
            </span>
          </div>

          <button
            type="button"
            onClick={scrollToCheckout}
            className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 active:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{isAr ? "اطلب الآن (الدفع عند الاستلام)" : "Commander"}</span>
            <ArrowRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
