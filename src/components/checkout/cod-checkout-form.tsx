"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Phone, 
  User, 
  MapPin, 
  Truck, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Loader2, 
  Sparkles,
  ShoppingBag,
  HelpCircle
} from "lucide-react";
import { WilayaSelect } from "@/components/ui/wilaya-select";
import { getWilayaByCode, ALGERIA_WILAYAS } from "@/lib/algeria-locations";
import { formatDZD, validateAlgerianPhone, formatAlgerianPhoneInput, getAlgerianCarrier } from "@/lib/formatters";
import { apiCreateCheckoutLead } from "@/lib/api-client";

export interface CodCheckoutFormProps {
  productId: string;
  productName: string;
  retailPrice: number;
  stock?: number;
  affiliateId?: string;
  fbclid?: string;
  ttclid?: string;
  utmSource?: string;
  utmCampaign?: string;
  subId?: string;
  lang?: "ar" | "fr";
  onSuccess: (orderId: string, orderDetails: {
    customerName: string;
    customerPhone: string;
    wilayaName: string;
    commune: string;
    deliveryType: "home" | "desk";
    quantity: number;
    totalAmount: number;
  }) => void;
}

export function CodCheckoutForm({
  productId,
  productName,
  retailPrice,
  stock = 10,
  affiliateId = "00000000-0000-0000-0000-000000000000",
  fbclid,
  ttclid,
  utmSource,
  utmCampaign,
  subId,
  lang = "ar",
  onSuccess,
}: CodCheckoutFormProps) {
  const isAr = lang === "ar";

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [wilayaCode, setWilayaCode] = useState("16"); // Default: Alger
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "desk">("home");
  const [quantity, setQuantity] = useState(1);

  // Validation & Submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Selected Wilaya & Communes
  const currentWilaya = useMemo(() => {
    return getWilayaByCode(wilayaCode) || ALGERIA_WILAYAS[15]; // Default Alger
  }, [wilayaCode]);

  // Phone validation status
  const phoneValidation = useMemo(() => {
    if (!customerPhone) return null;
    return validateAlgerianPhone(customerPhone);
  }, [customerPhone]);

  const carrier = useMemo(() => {
    if (!customerPhone) return null;
    return getAlgerianCarrier(customerPhone);
  }, [customerPhone]);

  // Delivery fee calculation
  const deliveryFee = useMemo(() => {
    if (!currentWilaya) return 500;
    return deliveryType === "home" ? currentWilaya.homeDeliveryFee : currentWilaya.deskDeliveryFee;
  }, [currentWilaya, deliveryType]);

  const itemsTotal = retailPrice * quantity;
  const grandTotal = itemsTotal + deliveryFee;

  // Handle Wilaya change
  const handleWilayaChange = (code: string) => {
    setWilayaCode(code);
    setCommune(""); // Reset commune when wilaya changes
    if (errors.wilaya) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.wilaya;
        return next;
      });
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const newErrors: Record<string, string> = {};

    if (!customerName.trim() || customerName.trim().length < 3) {
      newErrors.customerName = isAr
        ? "يرجى كتابة الاسم واللقب بشكل صحيح"
        : "Veuillez entrer votre nom complet (min. 3 caractères)";
    }

    const phoneCheck = validateAlgerianPhone(customerPhone);
    if (!phoneCheck.isValid) {
      newErrors.customerPhone = isAr
        ? "رقم الهاتف غير صالح. يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكون من 10 أرقام"
        : "Numéro de téléphone invalide (05/06/07 suivi de 8 chiffres)";
    }

    if (!wilayaCode) {
      newErrors.wilaya = isAr ? "يرجى تحديد ولايتك" : "Veuillez sélectionner votre wilaya";
    }

    if (!commune.trim()) {
      newErrors.commune = isAr ? "يرجى تحديد البلدية" : "Veuillez préciser la commune";
    }

    if (!address.trim() || address.trim().length < 4) {
      newErrors.address = isAr
        ? "يرجى إدخال العنوان بالتفصيل (الحي، الشارع، أو نقطة دالة)"
        : "Veuillez préciser votre adresse (rue, quartier ou point de repère)";
    }

    if (stock <= 0) {
      setApiError(
        isAr
          ? "عذراً، هذا المنتج غير متوفر حالياً بسبب نفاد المخزون."
          : "Désolé, ce produit n'est plus disponible en stock."
      );
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Backend expects wilaya as a number 1-58
      const wilayaNumber = parseInt(wilayaCode, 10);

      const res = await apiCreateCheckoutLead({
        customerName: customerName.trim(),
        customerPhone: phoneCheck.normalized,
        wilaya: wilayaNumber,
        commune: commune.trim(),
        address: `${deliveryType === "desk" ? "[STOP-DESK] " : ""}${address.trim()}`,
        productId,
        quantity,
        affiliateId,
        fbclid,
        ttclid,
        utmSource,
        utm_source: utmSource,
        utmCampaign,
        utm_campaign: utmCampaign,
        subId,
        sub_id: subId,
      });

      if (res && res.success && res.orderId) {
        onSuccess(res.orderId, {
          customerName: customerName.trim(),
          customerPhone: phoneCheck.normalized,
          wilayaName: isAr ? currentWilaya.nameAr : currentWilaya.name,
          commune: commune.trim(),
          deliveryType,
          quantity,
          totalAmount: grandTotal,
        });
      } else {
        throw new Error(isAr ? "تعذر تأكيد الطلب، يرجى المحاولة ثانية" : "Échec de confirmation de commande");
      }
    } catch (err: any) {
      console.error("Checkout order lead error:", err);
      const isRateLimited =
        err?.message?.includes("429") ||
        err?.message?.toLowerCase().includes("trop de requêtes") ||
        err?.message?.toLowerCase().includes("too many requests");
      const isStockConflict =
        err?.message?.includes("409") ||
        err?.message?.toLowerCase().includes("stock") ||
        err?.message?.toLowerCase().includes("épuisé");

      if (isRateLimited) {
        setApiError(
          isAr
            ? "لقد تجاوزت الحد المسموح به من الطلبات. يُرجى الانتظار بضع دقائق قبل تكرار المحاولة."
            : "Trop de tentatives de commande. Veuillez patienter quelques minutes avant de renouveler votre tentative."
        );
      } else if (isStockConflict) {
        setApiError(
          isAr
            ? "عذراً، نفد المخزون المتاح لهذا المنتج أثناء معالجة طلبك."
            : "Désolé, le stock disponible pour ce produit a été épuisé."
        );
      } else {
        setApiError(
          err.message || (isAr ? "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى" : "Une erreur est survenue lors de l'enregistrement de votre commande")
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full bg-white rounded-3xl border border-neutral-200/80 shadow-xl overflow-hidden ${isAr ? "rtl" : "ltr"}`}>
      {/* Form Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-5 sm:p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase text-blue-50 mb-2 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {isAr ? "الدفع عند الاستلام 100%" : "Paiement à la livraison 100%"}
          </span>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
            {isAr ? "املأ استمارة الطلب الآن" : "Formulaire de commande express"}
          </h3>
          <p className="text-xs sm:text-sm text-blue-100 max-w-md">
            {isAr 
              ? "الدفع نقدًا عند استلام طلبك ومراجعته. التوصيل متوفر لجميع ولايات الجزائر."
              : "Payez en espèces à la livraison après vérification. Expédition sur 58 wilayas."}
          </p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6">
        {stock <= 0 && (
          <div
            data-testid="checkout-out-of-stock-alert"
            className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{isAr ? "المنتج غير متوفر حالياً" : "Rupture de stock"}</p>
              <p className="text-xs text-amber-800 mt-0.5">
                {isAr
                  ? "عذراً، نفد المخزون المخصص لهذا العرض الترويجي. لا يمكن تسجيل طلبات جديدة في الوقت الحالي."
                  : "Désolé, tout le stock disponible a été réservé. Les commandes sont temporairement suspendues."}
              </p>
            </div>
          </div>
        )}

        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="checkout-api-error"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{isAr ? "تنبيه" : "Erreur"}</p>
              <p>{apiError}</p>
            </div>
          </motion.div>
        )}

        {/* 1. Customer Name */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>{isAr ? "الاسم واللقب بالكامل *" : "Nom et prénom complet *"}</span>
          </label>
          <input
            type="text"
            required
            data-testid="checkout-customer-name"
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: "" }));
            }}
            placeholder={isAr ? "مثال: كريم براهيمي" : "Ex: Karim Brahimi"}
            className={`w-full min-h-[48px] px-4 py-3 rounded-2xl border text-sm transition-all focus:outline-none focus:ring-4 ${
              errors.customerName
                ? "border-rose-400 focus:ring-rose-500/10"
                : "border-neutral-200 focus:border-blue-600 focus:ring-blue-600/10"
            }`}
          />
          {errors.customerName && (
            <p data-testid="checkout-error-name" className="text-xs text-rose-600 font-medium">
              {errors.customerName}
            </p>
          )}
        </div>

        {/* 2. Customer Phone */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>{isAr ? "رقم الهاتف للتأكيد *" : "Numéro de téléphone *"}</span>
            </label>
            <div className="flex items-center gap-1.5">
              {carrier && (
                <span
                  data-testid="checkout-carrier-badge"
                  className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full transition-all ${
                    carrier === "Mobilis"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : carrier === "Djezzy"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-red-100 text-red-800 border border-red-300"
                  }`}
                >
                  {carrier}
                </span>
              )}
              {phoneValidation && (
                <span
                  className={`text-xs font-mono font-medium flex items-center gap-1 ${
                    phoneValidation.isValid ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {phoneValidation.isValid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isAr ? "رقم صحيح" : "Format valide"}</span>
                    </>
                  ) : (
                    <span>{isAr ? "مثال: 0550 12 34 56" : "Ex: 0550 12 34 56"}</span>
                  )}
                </span>
              )}
            </div>
          </div>
          <input
            type="tel"
            required
            dir="ltr"
            data-testid="checkout-customer-phone"
            value={customerPhone}
            onChange={(e) => {
              const formatted = formatAlgerianPhoneInput(e.target.value);
              setCustomerPhone(formatted);
              if (errors.customerPhone) setErrors((prev) => ({ ...prev, customerPhone: "" }));
            }}
            placeholder="05 / 06 / 07 XX XX XX XX"
            className={`w-full min-h-[48px] px-4 py-3 rounded-2xl border text-sm sm:text-base font-mono tracking-wider transition-all focus:outline-none focus:ring-4 ${
              errors.customerPhone
                ? "border-rose-400 focus:ring-rose-500/10"
                : phoneValidation?.isValid
                ? "border-emerald-500 focus:ring-emerald-500/10 bg-emerald-50/20"
                : "border-neutral-200 focus:border-blue-600 focus:ring-blue-600/10"
            }`}
          />
          {errors.customerPhone ? (
            <p data-testid="checkout-error-phone" className="text-xs text-rose-600 font-medium">{errors.customerPhone}</p>
          ) : (
            <p className="text-[11px] text-neutral-500">
              {isAr 
                ? "سنتصل بك على هذا الرقم لتأكيد عنوانك وموعد التوصيل قبل إرسال الطرد."
                : "Notre service client vous appellera sur ce numéro pour confirmer l'expédition."}
            </p>
          )}
        </div>

        {/* 3. Wilaya Selection */}
        <div className="space-y-1.5">
          <WilayaSelect
            value={wilayaCode}
            onChange={handleWilayaChange}
            lang={lang}
            label={isAr ? "الولاية (58 ولاية) *" : "Wilaya de livraison (58 Wilayas) *"}
            error={errors.wilaya}
            showDeliveryFees={true}
            data-testid="checkout-wilaya-select"
          />
        </div>

        {/* 4. Commune Selection */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>{isAr ? "البلدية *" : "Commune *"}</span>
          </label>
          {currentWilaya.communes && currentWilaya.communes.length > 0 ? (
            <div className="relative">
              <select
                data-testid="checkout-commune-select"
                value={commune}
                onChange={(e) => {
                  setCommune(e.target.value);
                  if (errors.commune) setErrors((prev) => ({ ...prev, commune: "" }));
                }}
                className={`w-full min-h-[48px] px-4 py-3 rounded-2xl border text-sm bg-white transition-all appearance-none focus:outline-none focus:ring-4 ${
                  errors.commune
                    ? "border-rose-400 focus:ring-rose-500/10"
                    : "border-neutral-200 focus:border-blue-600 focus:ring-blue-600/10"
                }`}
              >
                <option value="">{isAr ? "اختر بلديتك..." : "Sélectionner votre commune..."}</option>
                {currentWilaya.communes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Autre">{isAr ? "بلدية أخرى (اكتبها في العنوان)" : "Autre commune (préciser dans l'adresse)"}</option>
              </select>
            </div>
          ) : (
            <input
              type="text"
              required
              data-testid="checkout-commune-input"
              value={commune}
              onChange={(e) => {
                setCommune(e.target.value);
                if (errors.commune) setErrors((prev) => ({ ...prev, commune: "" }));
              }}
              placeholder={isAr ? "اكتب اسم بلديتك" : "Nom de votre commune"}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            />
          )}
          {errors.commune && <p data-testid="checkout-error-commune" className="text-xs text-rose-600 font-medium">{errors.commune}</p>}
        </div>

        {/* 5. Delivery Type Selector: Home vs Stop-Desk */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>{isAr ? "طريقة التوصيل المفضلة" : "Mode de livraison"}</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Home Delivery */}
            <button
              type="button"
              data-testid="delivery-type-home"
              onClick={() => setDeliveryType("home")}
              className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                deliveryType === "home"
                  ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20"
                  : "border-neutral-200 hover:border-neutral-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  deliveryType === "home" ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-600"
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-neutral-900">
                    {isAr ? "توصيل للمنزل" : "À Domicile"}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {isAr ? "إلى باب منزلك أو مكان عملك" : "Jusqu'à votre porte"}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-lg">
                {formatDZD(currentWilaya.homeDeliveryFee, lang)}
              </span>
            </button>

            {/* Stop-Desk Pickup */}
            <button
              type="button"
              data-testid="delivery-type-desk"
              onClick={() => setDeliveryType("desk")}
              className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                deliveryType === "desk"
                  ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20"
                  : "border-neutral-200 hover:border-neutral-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  deliveryType === "desk" ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-600"
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-neutral-900">
                    {isAr ? "استلام من المكتب (Stop-Desk)" : "Bureau Stop-Desk"}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {isAr ? "توفير في سعر الشحن" : "Tarif réduit en agence"}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-lg">
                {formatDZD(currentWilaya.deskDeliveryFee, lang)}
              </span>
            </button>
          </div>
        </div>

        {/* 6. Exact Address */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{isAr ? "العنوان بالتفصيل *" : "Adresse exacte ou point de repère *"}</span>
          </label>
          <input
            type="text"
            required
            data-testid="checkout-address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (errors.address) setErrors((prev) => ({ ...prev, address: "" }));
            }}
            placeholder={
              isAr
                ? "الحي، رقم الشارع، أو أقرب مكان معروف (مثال: حي النصر قرب المسجد)"
                : "Quartier, numéro de rue ou repère connu"
            }
            className={`w-full min-h-[48px] px-4 py-3 rounded-2xl border text-sm transition-all focus:outline-none focus:ring-4 ${
              errors.address
                ? "border-rose-400 focus:ring-rose-500/10"
                : "border-neutral-200 focus:border-blue-600 focus:ring-blue-600/10"
            }`}
          />
          {errors.address && (
            <p data-testid="checkout-error-address" className="text-xs text-rose-600 font-medium">
              {errors.address}
            </p>
          )}
        </div>

        {/* 7. Quantity Selector */}
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>{isAr ? "الكمية المطلوبة" : "Quantité"}</span>
            </label>
            <span className="text-xs text-neutral-500 font-medium">
              {isAr ? "سعر القطعة:" : "Prix unitaire:"}{" "}
              <strong className="text-neutral-900 font-mono">{formatDZD(retailPrice, lang)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map((qty) => (
              <button
                key={qty}
                type="button"
                data-testid={`checkout-quantity-${qty}`}
                onClick={() => setQuantity(qty)}
                className={`py-2.5 px-3 rounded-2xl border font-semibold text-xs sm:text-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 relative ${
                  quantity === qty
                    ? "border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-600/20"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                }`}
              >
                {qty === 2 && (
                  <span className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold shadow-xs">
                    {isAr ? "الأكثر طلباً" : "Populaire"}
                  </span>
                )}
                <span>
                  {qty} {isAr ? (qty === 1 ? "قطعة" : qty === 2 ? "قطعتان" : "قطع") : "pièce(s)"}
                </span>
                <span className="font-mono text-[11px] text-neutral-500 font-normal">
                  {formatDZD(retailPrice * qty, lang)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 8. Live Financial Summary Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>{isAr ? "سعر المنتجات:" : "Total produits:"}</span>
            <span className="font-mono font-medium">{formatDZD(itemsTotal, lang)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span className="flex items-center gap-1.5">
              <span>{isAr ? "رسوم التوصيل:" : "Frais de livraison:"}</span>
              <span className="text-[10px] text-neutral-400">
                ({isAr ? currentWilaya.nameAr : currentWilaya.name} -{" "}
                {deliveryType === "home" ? (isAr ? "للمنزل" : "Domicile") : "Bureau"})
              </span>
            </span>
            <span data-testid="checkout-delivery-fee" className="font-mono font-medium text-blue-700">
              {formatDZD(deliveryFee, lang)}
            </span>
          </div>

          <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-sm sm:text-base font-bold text-neutral-900">
            <span>{isAr ? "المبلغ الإجمالي عند الاستلام:" : "Montant total à payer au livreur:"}</span>
            <span data-testid="checkout-grand-total" className="font-mono text-lg text-emerald-600">
              {formatDZD(grandTotal, lang)}
            </span>
          </div>
        </div>

        {/* 9. High-Converting Submit CTA Button */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            data-testid="checkout-submit-btn"
            disabled={isSubmitting || stock <= 0}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg text-white shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${
              isSubmitting || stock <= 0
                ? "bg-neutral-400 cursor-not-allowed shadow-none"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99] cursor-pointer shadow-blue-600/25"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isAr ? "جارٍ تسجيل طلبك..." : "Validation de votre commande..."}</span>
              </>
            ) : stock <= 0 ? (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>{isAr ? "عذراً، نفد المخزون حالياً" : "Actuellement en rupture de stock"}</span>
              </>
            ) : (
              <>
                <span>{isAr ? "تأكيد الطلب الآن (الدفع عند الاستلام)" : "Commander maintenant (Paiement à la livraison)"}</span>
                <span className="font-mono text-sm px-2 py-0.5 rounded-lg bg-white/20">
                  {formatDZD(grandTotal, lang)}
                </span>
              </>
            )}
          </button>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-neutral-500 text-center">
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-neutral-50 border border-neutral-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isAr ? "معاينة المنتج قبل الدفع" : "Inspection avant paiement"}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-neutral-50 border border-neutral-100">
              <Truck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{isAr ? "توصيل سريع 24-48 ساعة" : "Livraison en 24-48h"}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-neutral-50 border border-neutral-100">
              <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{isAr ? "تأكيد هاتفي فوري" : "Confirmation par appel"}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
