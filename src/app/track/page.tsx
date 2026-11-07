"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  Share2,
  Copy,
  ExternalLink,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  Building2,
  ChevronRight,
  RotateCcw,
  XCircle,
  X,
} from "lucide-react";
import { apiTrackOrder, apiCreateReturnRequest, PublicOrderTracking } from "@/lib/api-client";
import { formatDZD } from "@/lib/formatters";
import { getWilayaByCode } from "@/lib/algeria-locations";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || searchParams.get("tracking") || "";

  const [query, setQuery] = useState(initialId);
  const [trackingData, setTrackingData] = useState<PublicOrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<"ar" | "fr">("ar");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Return guarantee states
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnPhone, setReturnPhone] = useState("");
  const [returnReason, setReturnReason] = useState("Produit endommagé ou défectueux");
  const [returnNotes, setReturnNotes] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSuccessMessage, setReturnSuccessMessage] = useState<string | null>(null);
  const [returnErrorMessage, setReturnErrorMessage] = useState<string | null>(null);

  const isAr = lang === "ar";

  const fetchTracking = async (ref: string) => {
    if (!ref.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiTrackOrder(ref.trim());
      setTrackingData(data);
    } catch (err: any) {
      setTrackingData(null);
      setError(
        err?.message ||
          (isAr
            ? "تعذر العثور على الطلب. يرجى التأكد من رقم الطلب أو رقم التتبع وإعادة المحاولة."
            : "Commande introuvable. Veuillez vérifier votre référence ou numéro de suivi.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      fetchTracking(initialId);
    }
  }, [initialId]);

  useEffect(() => {
    const syncLang = () => {
      try {
        const saved = localStorage.getItem("vitedrop_lang");
        if (saved === "fr" || saved === "en") {
          setLang("fr");
        } else if (saved === "ar") {
          setLang("ar");
        }
      } catch {}
    };

    syncLang();
    window.addEventListener("vitedrop_lang_changed", syncLang);
    window.addEventListener("storage", syncLang);
    return () => {
      window.removeEventListener("vitedrop_lang_changed", syncLang);
      window.removeEventListener("storage", syncLang);
    };
  }, []);

  const handleLangToggle = () => {
    const nextLang = lang === "ar" ? "fr" : "ar";
    setLang(nextLang);
    try {
      localStorage.setItem("vitedrop_lang", nextLang);
      window.dispatchEvent(new Event("vitedrop_lang_changed"));
    } catch {}
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      fetchTracking(query.trim());
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/track?id=${trackingData?.id || query}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyTrackingNum = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleSubmitReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingData) return;
    setIsSubmittingReturn(true);
    setReturnErrorMessage(null);
    setReturnSuccessMessage(null);

    try {
      const res = await apiCreateReturnRequest({
        reference: trackingData.reference || trackingData.id,
        phone: returnPhone.trim(),
        reason: returnReason,
        notes: returnNotes.trim() || undefined,
      });

      setReturnSuccessMessage(
        res.message ||
          (isAr
            ? "تم تسجيل طلب الإرجاع بنجاح. سيتصل بك فريق الدعم خلال 24 ساعة لتأكيد الاسترجاع."
            : "Votre demande de retour a été enregistrée avec succès. Notre équipe vous contactera sous 24h.")
      );

      // Update local tracking state
      setTrackingData((prev) =>
        prev
          ? {
              ...prev,
              status: "return_requested",
              isReturnRequested: true,
              canRequestReturn: false,
              returnReason: returnReason,
              returnNotes: returnNotes.trim() || undefined,
            }
          : null
      );

      setTimeout(() => {
        setIsReturnModalOpen(false);
      }, 2000);
    } catch (err: any) {
      setReturnErrorMessage(
        err?.message ||
          (isAr
            ? "تعذر تقديم طلب الإرجاع. يرجى التحقق من صحة رقم الهاتف."
            : "Impossible de valider la demande de retour. Veuillez vérifier votre numéro de téléphone.")
      );
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Wilaya formatting
  const wilayaInfo = trackingData
    ? getWilayaByCode(String(trackingData.wilaya).padStart(2, "0"))
    : null;

  // Stepper logic
  const steps = [
    {
      key: "lead_generated",
      labelAr: "تم تسجيل الطلب",
      labelFr: "Commande enregistrée",
      descAr: "في انتظار اتصال مركز الاتصال",
      descFr: "En attente d'appel de confirmation",
    },
    {
      key: "supplier_confirmed",
      labelAr: "مؤكدة هاتفياً",
      labelFr: "Confirmée par téléphone",
      descAr: "تم تأكيد العنوان مع العميل",
      descFr: "Coordonnées validées",
    },
    {
      key: "dispatched",
      labelAr: "تم الشحن",
      labelFr: "Expédiée",
      descAr: "تم تجهيز البوليصة وتسليمها للناقل",
      descFr: "Remis au transporteur",
    },
    {
      key: "in_transit",
      labelAr: "في الطريق إليك",
      labelFr: "En cours de livraison",
      descAr: "مع الموزع في ولايتك",
      descFr: "En cours d'acheminement local",
    },
    {
      key: "delivered",
      labelAr: "تم التوصيل بنجاح",
      labelFr: "Livrée avec succès",
      descAr: "تم تسليم الطرد وقبض المبلغ",
      descFr: "Colis remis et encaissé",
    },
  ];

  const getActiveStepIndex = (status: string) => {
    switch (status) {
      case "lead_generated":
        return 0;
      case "supplier_confirmed":
        return 1;
      case "dispatched":
        return 2;
      case "in_transit":
        return 3;
      case "delivered":
        return 4;
      default:
        return 0;
    }
  };

  const isAbnormalStatus =
    trackingData &&
    ["canceled", "rto_in_transit", "returned_to_supplier"].includes(trackingData.status);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`min-h-screen bg-[#f8fafc] text-neutral-900 ${isAr ? "rtl font-sans" : "ltr"}`}
    >
      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              V
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-neutral-900">
                ViteDrop
              </span>
              <span className="text-[10px] text-blue-600 font-bold block -mt-1 tracking-wider uppercase">
                {isAr ? "خدمة التتبع المباشر" : "Suivi en Direct"}
              </span>
            </div>
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={handleLangToggle}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            {isAr ? "Français" : "العربية"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Search Header Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60">
            <Truck className="w-3.5 h-3.5" />
            {isAr ? "تتبع حالة شحنتك لحظة بلحظة" : "Suivi des colis en temps réel"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            {isAr ? "أين وصل طلبي؟" : "Où se trouve ma commande ?"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            {isAr
              ? "أدخل رقم الطلب المرجعي أو رقم التتبع الخاص بـ Yalidine / ZR Express"
              : "Saisissez votre référence de commande ou votre numéro de bordereau transporteur."}
          </p>

          {/* Search Bar Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto mt-6 flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isAr
                    ? "مثال: 948F2A10 أو YAL-84920492"
                    : "Ex: 948F2A10 ou YAL-84920492"
                }
                dir="ltr"
                data-testid="track-search-input"
                className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-300 rounded-2xl text-sm font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              data-testid="track-submit-btn"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 text-white font-semibold text-sm rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isAr ? "جارٍ البحث..." : "Recherche..."}</span>
                </>
              ) : (
                <>
                  <span>{isAr ? "تتبع" : "Suivre"}</span>
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="track-error-alert"
            className="max-w-xl mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-semibold">{isAr ? "تعذر العثور على الطلب" : "Commande introuvable"}</p>
              <p className="mt-0.5 text-rose-700/90">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Tracking Details View */}
        {trackingData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="tracking-details-card"
            className="space-y-6"
          >
            {/* Top Status Card */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xl overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                {/* Header with Reference & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        {isAr ? "رقم الطلب المرجعي" : "Référence Commande"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-[11px] font-mono font-bold text-neutral-700">
                        #{trackingData.reference}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
                      {trackingData.productName}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid="copy-tracking-link-btn"
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{isAr ? "تم نسخ الرابط" : "Lien copié"}</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 text-neutral-500" />
                          <span>{isAr ? "مشاركة الرابط" : "Partager le lien"}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => fetchTracking(trackingData.id)}
                      className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 transition-colors cursor-pointer"
                      title={isAr ? "تحديث الحالة" : "Actualiser"}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Return Requested Banner */}
                {(trackingData.isReturnRequested || trackingData.status === "return_requested") && (
                  <div
                    data-testid="return-requested-banner"
                    className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          {isAr ? "طلب إرجاع قيد المراجعة" : "Retour en attente de validation"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-neutral-900 mt-1">
                        {trackingData.returnReason || (isAr ? "طلب إرجاع مسجل" : "Demande de retour enregistrée")}
                      </p>
                      {trackingData.returnNotes && (
                        <p className="text-xs text-neutral-600 bg-white/70 p-2.5 rounded-xl border border-amber-200/60 mt-1">
                          {trackingData.returnNotes}
                        </p>
                      )}
                      <p className="text-xs text-amber-800 mt-1">
                        {isAr
                          ? "تم إخطار المورد وفريق خدمة العملاء. سيتم التنسيق لاستلام الطرد واسترجاع مستحقاتك."
                          : "Le fournisseur et le service client examinent votre demande pour organiser l'enlèvement du colis."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Abnormal Status Banner (Canceled / RTO) */}
                {isAbnormalStatus && (
                  <div
                    data-testid="abnormal-status-banner"
                    className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3"
                  >
                    {trackingData.status === "canceled" ? (
                      <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <RotateCcw className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-neutral-900">
                        {trackingData.status === "canceled"
                          ? isAr
                            ? "تم إلغاء هذا الطلب"
                            : "Cette commande a été annulée"
                          : isAr
                          ? "طرد راجع في طريق العودة (RTO)"
                          : "Colis en cours de retour à l'expéditeur"}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        {trackingData.status === "canceled"
                          ? isAr
                            ? "تم إلغاء الطلب من قِبل العميل أو تعذر التأكيد الهاتفي."
                            : "La commande a été annulée suite à un refus ou une indisponibilité téléphonique."
                          : isAr
                          ? "تعذر على موزع الشحن تسليم الطرد بعد المحاولات المقررة."
                          : "La livraison n'a pas pu aboutir après tentatives de livraison du transporteur."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Stepper (Only active if normal flow) */}
                {!isAbnormalStatus && (
                  <div className="py-4">
                    <div className="relative">
                      {/* Connecting line */}
                      <div className="hidden sm:block absolute top-5 inset-x-8 h-0.5 bg-neutral-200 -z-0" />

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                        {steps.map((s, idx) => {
                          const activeIdx = getActiveStepIndex(trackingData.status);
                          const isDone = idx <= activeIdx;
                          const isCurrent = idx === activeIdx;

                          return (
                            <div
                              key={s.key}
                              data-testid={`stepper-item-${s.key}`}
                              className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2"
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                                  isDone
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-50"
                                    : "bg-neutral-100 text-neutral-400 border border-neutral-200"
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <span>{idx + 1}</span>
                                )}
                              </div>

                              <div className="text-start sm:text-center">
                                <p
                                  className={`text-xs font-bold ${
                                    isCurrent
                                      ? "text-blue-600 font-extrabold"
                                      : isDone
                                      ? "text-neutral-900"
                                      : "text-neutral-400"
                                  }`}
                                >
                                  {isAr ? s.labelAr : s.labelFr}
                                </p>
                                <p className="text-[10px] text-neutral-400 hidden sm:block mt-0.5">
                                  {isAr ? s.descAr : s.descFr}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Courier Waybill Card */}
                {trackingData.trackingNumber && (
                  <div
                    data-testid="courier-waybill-card"
                    className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-white text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                          {trackingData.courier || "Yalidine Express"}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <p
                            dir="ltr"
                            data-testid="tracking-number-badge"
                            className="font-mono font-bold text-sm sm:text-base text-neutral-900"
                          >
                            {trackingData.trackingNumber}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopyTrackingNum(trackingData.trackingNumber!)}
                            className="p-1 rounded hover:bg-blue-100 text-blue-700 cursor-pointer"
                            title={isAr ? "نسخ رقم التتبع" : "Copier le numéro"}
                          >
                            {copiedTracking ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {trackingData.courier?.toLowerCase().includes("yalidine") && (
                      <a
                        href={`https://yalidine.com/tracking/?tracking=${trackingData.trackingNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <span>{isAr ? "تتبع على موقع Yalidine" : "Suivre sur Yalidine"}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Order Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Delivery Location */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
                      <MapPin className="w-4 h-4 text-neutral-500" />
                      <span>{isAr ? "عنوان التوصيل" : "Destination"}</span>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {wilayaInfo ? (isAr ? wilayaInfo.nameAr : wilayaInfo.name) : `Wilaya ${trackingData.wilaya}`}
                      {trackingData.commune ? ` - ${trackingData.commune}` : ""}
                    </p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-neutral-400" />
                      <span dir="ltr" className="font-mono">{trackingData.maskedPhone}</span>
                    </p>
                  </div>

                  {/* Financial & COD Summary */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? "الدفع عند الاستلام (COD)" : "Paiement à la livraison"}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-neutral-500">
                        {isAr ? `الكمية: ${trackingData.quantity}` : `Quantité: ${trackingData.quantity}`}
                      </span>
                      <span
                        data-testid="track-total-price"
                        className="text-base font-extrabold text-neutral-900 font-mono"
                      >
                        {formatDZD(trackingData.totalPrice, lang)}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      {isAr
                        ? "الدفع نقداً للموزع بعد معاينة واستلام الطرد"
                        : "Paiement en espèces au livreur après réception"}
                    </p>
                  </div>
                </div>

                {/* Return Guarantee Section */}
                {(trackingData.canRequestReturn ||
                  (trackingData.status === "delivered" && !trackingData.isReturnRequested)) && (
                  <div
                    data-testid="return-guarantee-section"
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">
                          {isAr ? "ضمان الاستبدال والاسترجاع (7 أيام)" : "Garantie Retour & Remboursement (7 Jours)"}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {isAr
                            ? "هل وصلك منتج تالف أو غير مطابق؟ يمكنك تقديم طلب إرجاع مباشرة."
                            : "Produit endommagé ou non conforme ? Déposez une réclamation directement en ligne."}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid="request-return-btn"
                      onClick={() => {
                        setReturnErrorMessage(null);
                        setReturnSuccessMessage(null);
                        setIsReturnModalOpen(true);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{isAr ? "تقديم طلب إرجاع" : "Demander un retour"}</span>
                    </button>
                  </div>
                )}

                {/* Timeline Events History */}
                <div className="pt-4 border-t border-neutral-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
                    {isAr ? "سجل تحركات الطرد" : "Historique des événements"}
                  </h3>

                  <div className="space-y-4">
                    {trackingData.timeline && trackingData.timeline.length > 0 ? (
                      trackingData.timeline.map((ev, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0 ring-4 ring-blue-50" />
                          <div className="text-xs flex-1">
                            <p className="font-semibold text-neutral-900">{ev.reason || ev.status}</p>
                            <p className="text-neutral-400 font-mono text-[10px] mt-0.5">
                              {new Date(ev.date).toLocaleString(isAr ? "ar-DZ" : "fr-FR", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-400">
                        {isAr ? "لا توجد تحديثات إضافية حتى الآن." : "Aucun événement supplémentaire pour le moment."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Support CTA */}
                <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-neutral-500">
                    {isAr ? "هل لديك استفسار أو مشكلة مع طلبك؟" : "Une question concernant votre commande ?"}
                  </span>
                  <a
                    href={`https://wa.me/213550000000?text=${encodeURIComponent(
                      isAr
                        ? `مرحباً، أود الاستفسار عن طلبي رقم #${trackingData.reference}`
                        : `Bonjour, je souhaite des informations sur ma commande #${trackingData.reference}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="contact-support-whatsapp-btn"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{isAr ? "تواصل معنا عبر واتساب" : "Contacter le support WhatsApp"}</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Return Request Modal */}
        <AnimatePresence>
          {isReturnModalOpen && (
            <div
              data-testid="return-request-modal"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200/80 space-y-5"
                dir={isAr ? "rtl" : "ltr"}
              >
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-neutral-900">
                        {isAr ? "طلب إرجاع المنتج" : "Demande de Retour Produit"}
                      </h3>
                      <p className="text-xs text-neutral-400">#{trackingData?.reference}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {returnSuccessMessage && (
                  <div
                    data-testid="return-request-success-banner"
                    className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{isAr ? "تم تسجيل طلبك" : "Demande envoyée"}</p>
                      <p className="mt-0.5">{returnSuccessMessage}</p>
                    </div>
                  </div>
                )}

                {returnErrorMessage && (
                  <div
                    data-testid="return-request-error-banner"
                    className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <p>{returnErrorMessage}</p>
                  </div>
                )}

                {!returnSuccessMessage && (
                  <form onSubmit={handleSubmitReturnRequest} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                        {isAr ? "رقم الهاتف المسجل بالطلب للتحقق *" : "Numéro de téléphone de la commande (Vérification) *"}
                      </label>
                      <input
                        type="tel"
                        required
                        dir="ltr"
                        value={returnPhone}
                        onChange={(e) => setReturnPhone(e.target.value)}
                        placeholder="Ex: 0555123456"
                        data-testid="return-phone-input"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <p className="text-[11px] text-neutral-400 mt-1">
                        {isAr
                          ? "يجب أن يتطابق الرقم مع رقم استلام الطلب لحماية أمان حسابك."
                          : "Le numéro doit correspondre au destinataire de la commande."}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                        {isAr ? "سبب الإرجاع *" : "Motif du retour *"}
                      </label>
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        data-testid="return-reason-select"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                      >
                        <option value="Produit endommagé ou défectueux">
                          {isAr ? "المنتج تالف أو به عيب مصنعي" : "Produit endommagé ou défectueux"}
                        </option>
                        <option value="Produit non conforme à la commande">
                          {isAr ? "المنتج غير مطابق للمواصفات المطلوبة" : "Produit non conforme à la commande"}
                        </option>
                        <option value="Article manquant">
                          {isAr ? "قطعة ناقصة في الطرد" : "Article ou accessoire manquant"}
                        </option>
                        <option value="Autre réclamation">
                          {isAr ? "سبب آخر" : "Autre réclamation"}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                        {isAr ? "تفاصيل إضافية / وصف العيب" : "Détails / Description du problème"}
                      </label>
                      <textarea
                        rows={3}
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        placeholder={
                          isAr
                            ? "يرجى ذكر المشكلة بدقة لتسريع معالجة الاستبدال أو الإرجاع..."
                            : "Décrivez l'anomalie constatée pour accélérer le traitement..."
                        }
                        data-testid="return-notes-input"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsReturnModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                      >
                        {isAr ? "إلغاء" : "Annuler"}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReturn || !returnPhone.trim()}
                        data-testid="submit-return-request-btn"
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
                      >
                        {isSubmittingReturn ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{isAr ? "جارٍ الإرسال..." : "Envoi en cours..."}</span>
                          </>
                        ) : (
                          <span>{isAr ? "تأكيد طلب الإرجاع" : "Confirmer la demande"}</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
