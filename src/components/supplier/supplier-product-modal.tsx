"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Language } from "@/lib/locales";
import { formatDZD } from "@/lib/formatters";
import { apiCreateSupplierProduct } from "@/lib/api-client";
import {
  PackagePlus,
  X,
  Box,
  Tag,
  Coins,
  Wallet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calculator,
  UploadCloud,
  ImageIcon,
  Trash2,
} from "lucide-react";

async function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface SupplierProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  walletBalance: number;
  lang: Language;
  onOpenTopUp: () => void;
}

const modalTranslations = {
  fr: {
    title: "Nouveau Produit (Activation Immédiate)",
    subtitle: "Validation automatisée par invariants de solvabilité",
    nameLabel: "Nom du Produit",
    namePlaceholder: "Ex: Écouteurs Sans Fil Pro ANC",
    descLabel: "Description (Optionnelle)",
    descPlaceholder: "Spécifications, caractéristiques techniques...",
    imageLabel: "Photo du Produit",
    imageDropzone: "Glissez une photo ici ou cliquez pour parcourir",
    imageHelper: "PNG, JPG ou WebP",
    changeImage: "Changer",
    removeImage: "Supprimer",
    stockLabel: "Stock Initial",
    stockHelper: "Min. 20 unités requises",
    retailLabel: "Prix de Vente (Retail)",
    cpaLabel: "Budget CPA Total proposé",
    cpaDesc: "Commission brute déduite de votre séquestre uniquement après livraison confirmée (Max. 50% du prix de vente).",
    solvencyTitle: "Contrôle de Solvabilité en Temps Réel",
    requiredEscrow: "Tampon Escrow Requis (5x CPA) :",
    currentBalance: "Votre Solde Escrow Actuel :",
    rechargeBtn: "Recharger le Solde",
    rule1: "Prix de vente supérieur au budget CPA",
    rule2: "Budget CPA <= 50% du prix de vente",
    rule3: "Stock initial >= 20 unités",
    rule4: "Solde Escrow couvre 5x le CPA",
    simulatorTitle: "Simulateur de Rentabilité & Seuil RTO",
    simulatorDesc: "Simulation prédictive de votre rentabilité nette (Taux de livraison standard DZ 70%)",
    costPriceLabel: "Coût unitaire d'achat (Optionnel)",
    estDeliveryRateLabel: "Taux de livraison estimé (%)",
    netMarginPerOrder: "Marge Nette Estimée / Commande :",
    breakEvenThreshold: "Seuil de Rentabilité (Break-Even) :",
    breakEvenSafe: "Rentabilité Saine",
    breakEvenWarning: "Marge Sensible",
    breakEvenLoss: "Risque de Perte",
    cancel: "Annuler",
    submit: "Publier et Activer",
    submitting: "Validation & Activation...",
    errName: "Le nom du produit est obligatoire.",
    errStock: "Le stock initial minimum est de 20 unités pour activer le produit.",
    errRetail: "Le prix de vente doit être strictement supérieur au budget CPA.",
    errCap: "Le budget CPA ne peut pas dépasser 50% du prix de vente.",
    errEscrow: "Solde Escrow insuffisant: rechargez votre compte pour couvrir le tampon de 5x CPA.",
  },
  en: {
    title: "New Product (Instant Activation)",
    subtitle: "Automated validation via solvency invariants",
    nameLabel: "Product Name",
    namePlaceholder: "Ex: Wireless Earbuds Pro ANC",
    descLabel: "Description (Optional)",
    descPlaceholder: "Specifications, technical details...",
    imageLabel: "Product Photo",
    imageDropzone: "Drag & drop a photo here or click to browse",
    imageHelper: "PNG, JPG or WebP",
    changeImage: "Change",
    removeImage: "Remove",
    stockLabel: "Initial Stock",
    stockHelper: "Min. 20 units required",
    retailLabel: "Retail Price",
    cpaLabel: "Total Gross CPA Budget",
    cpaDesc: "Gross CPA deducted from escrow only upon confirmed delivery (Max. 50% of retail price).",
    solvencyTitle: "Real-Time Solvency Pre-check",
    requiredEscrow: "Required Escrow Buffer (5x CPA):",
    currentBalance: "Your Current Escrow Balance:",
    rechargeBtn: "Top-Up Balance",
    rule1: "Retail price greater than CPA budget",
    rule2: "CPA budget <= 50% of retail price",
    rule3: "Initial stock >= 20 units",
    rule4: "Escrow balance covers 5x CPA buffer",
    simulatorTitle: "Profitability & RTO Break-Even Simulator",
    simulatorDesc: "Predictive simulation of net margins based on Algerian delivery performance (70% standard)",
    costPriceLabel: "Unit Product Cost (Optional)",
    estDeliveryRateLabel: "Estimated Delivery Rate (%)",
    netMarginPerOrder: "Estimated Net Margin / Order:",
    breakEvenThreshold: "Break-Even Delivery Rate:",
    breakEvenSafe: "Healthy Margin",
    breakEvenWarning: "Sensitive Margin",
    breakEvenLoss: "Risk of Loss",
    cancel: "Cancel",
    submit: "Publish & Activate",
    submitting: "Validating & Publishing...",
    errName: "Product name is required.",
    errStock: "Minimum initial stock is 20 units to activate product.",
    errRetail: "Retail price must be strictly greater than CPA budget.",
    errCap: "CPA budget cannot exceed 50% of retail price.",
    errEscrow: "Insufficient escrow balance: top-up account to cover 5x CPA buffer.",
  },
  ar: {
    title: "إضافة منتج جديد (اعتماد وتفعيل فوري)",
    subtitle: "التحقق الآلي من شروط الملاءة المالية والضمان",
    nameLabel: "اسم المنتج",
    namePlaceholder: "مثال: سماعات لاسلكية عازلة للضوضاء",
    descLabel: "الوصف (اختياري)",
    descPlaceholder: "المواصفات، الميزات التقنية...",
    imageLabel: "صورة المنتج",
    imageDropzone: "اسحب الصورة هنا أو اضغط للاختيار",
    imageHelper: "PNG, JPG أو WebP",
    changeImage: "تغيير",
    removeImage: "حذف",
    stockLabel: "المخزون الأولي",
    stockHelper: "20 قطعة على الأقل لتفعيل المنتج",
    retailLabel: "سعر البيع للزبون (Retail)",
    cpaLabel: "ميزانية الـ CPA المقترحة",
    cpaDesc: "العمولة الإجمالية المخصومة من حساب الضمان بعد التسليم الناجح فقط (بحد أقصى 50% من سعر البيع).",
    solvencyTitle: "فحص الملاءة المالية الفوري (Live Solvency Pre-check)",
    requiredEscrow: "الضمان المالي المطلوب (5x CPA):",
    currentBalance: "رصيدك المالي المتاح حالياً:",
    rechargeBtn: "شحن رصيد الضمان",
    rule1: "سعر البيع أكبر تماماً من ميزانية CPA",
    rule2: "ميزانية CPA لا تتجاوز 50% من سعر البيع",
    rule3: "المخزون الأولي 20 وحدة أو أكثر",
    rule4: "رصيد الضمان يغطي 5 أضعاف الـ CPA",
    simulatorTitle: "حاسبة الربحية وهامش الأمان للمرتجع",
    simulatorDesc: "محاكاة تقديرية للأرباح الصافية مع احتساب نسبة التوصيل في الجزائر (70% متوسط)",
    costPriceLabel: "تكلفة القطعة (اختياري)",
    estDeliveryRateLabel: "نسبة التوصيل المتوقعة (%)",
    netMarginPerOrder: "صافي الربح المتوقع لكل طلبية:",
    breakEvenThreshold: "الحد الأدنى لنسبة التوصيل لتفادي الخسارة:",
    breakEvenSafe: "هامش ربح آمن",
    breakEvenWarning: "حساس للمرتجع",
    breakEvenLoss: "خطر الخسارة",
    cancel: "إلغاء",
    submit: "نشر وتفعيل المنتج",
    submitting: "جار التحقق والتفعيل...",
    errName: "اسم المنتج مطلوب.",
    errStock: "المخزون الأولي الأدنى هو 20 قطعة لتفعيل المنتج.",
    errRetail: "سعر البيع يجب أن يكون أكبر من ميزانية CPA.",
    errCap: "ميزانية CPA لا يمكن أن تتجاوز 50% من سعر البيع.",
    errEscrow: "رصيد الضمان غير كافٍ: قم بشحن الرصيد لتغطية 5 أضعاف الـ CPA.",
  },
};

export function SupplierProductModal({
  isOpen,
  onClose,
  onSuccess,
  walletBalance,
  lang = "fr",
  onOpenTopUp,
}: SupplierProductModalProps) {
  const t = modalTranslations[lang] || modalTranslations.fr;
  const isAr = lang === "ar";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [stock, setStock] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [supplierTotalCpa, setSupplierTotalCpa] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("700");
  const [deliveryRate, setDeliveryRate] = useState("70");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setImageUrl("");
      setImageName("");
      setIsProcessingImage(false);
      setStock("");
      setRetailPrice("");
      setSupplierTotalCpa("");
      setCostPrice("");
      setDeliveryFee("700");
      setDeliveryRate("70");
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    try {
      setImageName(file.name);
      const compressed = await processImageFile(file);
      setImageUrl(compressed);
    } catch (err) {
      console.error("Failed to process image:", err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImageName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  // Real-time Solvency Metrics
  const stockNum = parseInt(stock, 10) || 0;
  const retailPriceNum = parseInt(retailPrice, 10) || 0;
  const cpaNum = parseInt(supplierTotalCpa, 10) || 0;
  const requiredEscrow = cpaNum * 5;

  // Unit Economics Simulation
  const parsedCost = parseInt(costPrice, 10);
  const costNum = !isNaN(parsedCost) && parsedCost >= 0 ? parsedCost : (retailPriceNum > 0 ? Math.round(retailPriceNum * 0.4) : 0);
  const deliveryFeeNum = parseInt(deliveryFee, 10) || 700;
  const deliveryRateNum = Math.min(100, Math.max(1, parseInt(deliveryRate, 10) || 70));
  const returnTransitCost = Math.round(deliveryFeeNum * 0.6); // ~420 DZD return fee

  const profitOnDelivered = retailPriceNum - costNum - cpaNum - deliveryFeeNum;
  const lossOnReturned = returnTransitCost;

  const blendedNetMargin = Math.round(
    (deliveryRateNum / 100) * profitOnDelivered - ((100 - deliveryRateNum) / 100) * lossOnReturned
  );
  const netMarginPercent =
    retailPriceNum > 0 ? ((blendedNetMargin / retailPriceNum) * 100).toFixed(1) : "0";

  const breakEvenRate =
    profitOnDelivered + lossOnReturned > 0
      ? Math.min(100, Math.max(0, Math.round((lossOnReturned / (profitOnDelivered + lossOnReturned)) * 100)))
      : 100;

  const isSafeMargin = blendedNetMargin > 0 && breakEvenRate < 60;
  const isCautionMargin = blendedNetMargin > 0 && breakEvenRate >= 60;

  // Validation rules evaluation (No 500 DZD floor rule!)
  const isCpaPositive = cpaNum > 0;
  const isRetailGreater = retailPriceNum > 0 && cpaNum > 0 && retailPriceNum > cpaNum;
  const isWithinCap = retailPriceNum > 0 && cpaNum > 0 && cpaNum <= retailPriceNum * 0.5;
  const isStockValid = stockNum >= 20;
  const isEscrowValid = cpaNum > 0 && walletBalance >= requiredEscrow;

  const isFormComplete =
    name.trim().length > 0 &&
    stockNum >= 20 &&
    retailPriceNum > 0 &&
    isCpaPositive &&
    isRetailGreater &&
    isWithinCap &&
    isEscrowValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage(t.errName);
      return;
    }

    if (stockNum < 20) {
      setErrorMessage(t.errStock);
      return;
    }

    if (retailPriceNum <= cpaNum) {
      setErrorMessage(t.errRetail);
      return;
    }

    if (cpaNum > retailPriceNum * 0.5) {
      setErrorMessage(t.errCap);
      return;
    }

    if (walletBalance < requiredEscrow) {
      setErrorMessage(
        `${t.errEscrow} (${formatDZD(walletBalance, lang)} / ${formatDZD(requiredEscrow, lang)})`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await apiCreateSupplierProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        stock: stockNum,
        retailPrice: retailPriceNum,
        supplierTotalCpa: cpaNum,
        imageUrl: imageUrl || undefined,
      });
      await onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la création du produit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supplier-product-modal-title"
      data-testid="supplier-product-modal"
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-black/[0.08] overflow-hidden flex flex-col max-h-[92vh] text-start animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="supplier-product-modal-title"
                className="text-base font-bold text-neutral-900 tracking-tight"
              >
                {t.title}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">{t.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Fermer"
            data-testid="close-product-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Error Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in"
              data-testid="product-modal-error-alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form id="supplier-product-form" noValidate onSubmit={handleSubmit} className="space-y-4">
            {/* Product Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-900 block">
                {t.nameLabel} <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={t.namePlaceholder}
                required
                data-testid="product-name-input"
                className="text-xs sm:text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-900 block">
                {t.descLabel}
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descPlaceholder}
                data-testid="product-desc-input"
                className="text-xs sm:text-sm"
              />
            </div>

            {/* Product Image Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-900 block">
                {t.imageLabel}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                id="supplier-product-modal-image-input"
                data-testid="product-image-file-input"
                onChange={handleImageFileChange}
              />
              {imageUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 bg-neutral-50/70">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300">
                    <img
                      src={imageUrl}
                      alt={imageName || "Preview"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-800 truncate">
                      {imageName || "image.jpg"}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                      ✓ Optimisé & compressé
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
                      >
                        {t.changeImage}
                      </button>
                      <span className="text-neutral-300">|</span>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        {t.removeImage}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                  data-testid="product-image-dropzone"
                >
                  <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                    {isProcessingImage ? (
                      <div className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-neutral-700">
                    {t.imageDropzone}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {t.imageHelper}
                  </p>
                </div>
              )}
            </div>

            {/* Stock & Retail Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Stock */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-900 block">
                  {t.stockLabel} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Box className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={stock}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setStock(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onWheel={(e) => (e.target as HTMLElement).blur()}
                    placeholder="20"
                    required
                    data-testid="product-stock-input"
                    className="font-mono text-xs sm:text-sm ps-9"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 block">{t.stockHelper}</span>
              </div>

              {/* Retail Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-900 block">
                  {t.retailLabel} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={retailPrice}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setRetailPrice(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onWheel={(e) => (e.target as HTMLElement).blur()}
                    placeholder="4500"
                    required
                    data-testid="product-retail-price-input"
                    className="font-mono text-xs sm:text-sm ps-9 pe-12"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 font-mono">
                    DZD
                  </span>
                </div>
              </div>
            </div>

            {/* CPA Budget Input */}
            <div className="p-4 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50/40 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.cpaLabel}</span>
                  <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-emerald-800/80 leading-relaxed">{t.cpaDesc}</p>
                <div className="relative pt-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={supplierTotalCpa}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setSupplierTotalCpa(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onWheel={(e) => (e.target as HTMLElement).blur()}
                    placeholder="1000"
                    required
                    data-testid="product-cpa-input"
                    className="font-mono text-base font-bold border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 pe-12 bg-white"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 font-mono">
                    DZD
                  </span>
                </div>
              </div>

              {/* Dynamic Solvency Escrow Buffer & 80/20 CPA Breakdown */}
              {cpaNum > 0 && (
                <div className="pt-3 border-t border-emerald-200/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[11px] text-neutral-600">
                    <span>{isAr ? "عمولة المسوق الصافية (80%):" : "Gain Net Affilié (80%):"}</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatDZD(Math.round(cpaNum * 0.8), lang)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-neutral-600">
                    <span>{isAr ? "رسوم المنصة (20%):" : "Frais Plateforme ViteDrop (20%):"}</span>
                    <span className="font-mono font-bold text-neutral-700">
                      {formatDZD(Math.round(cpaNum * 0.2), lang)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-emerald-100">
                    <span className="font-semibold text-neutral-900">{t.requiredEscrow}</span>
                    <span className="font-mono font-bold text-neutral-950 text-sm">
                      {formatDZD(requiredEscrow, lang)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Real-time Profitability & Break-Even Simulator */}
            {retailPriceNum > 0 && cpaNum > 0 && (
              <div
                className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-sky-50/50 to-white border border-indigo-200/70 space-y-3.5 text-xs animate-in fade-in"
                data-testid="product-profitability-simulator"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                    <Calculator className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{t.simulatorTitle}</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${
                      isSafeMargin
                        ? "bg-emerald-100 text-emerald-800"
                        : isCautionMargin
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                    data-testid="simulator-status-badge"
                  >
                    {isSafeMargin ? t.breakEvenSafe : isCautionMargin ? t.breakEvenWarning : t.breakEvenLoss}
                  </span>
                </div>

                <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                  {t.simulatorDesc}
                </p>

                {/* Optional inputs row for fine-tuning */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 block mb-1">
                      {t.costPriceLabel}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      placeholder={`~${costNum} DZD`}
                      data-testid="simulator-cost-price-input"
                      className="h-7 text-xs font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 block mb-1">
                      {t.estDeliveryRateLabel}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="10"
                        max="100"
                        value={deliveryRate}
                        onChange={(e) => setDeliveryRate(e.target.value)}
                        onWheel={(e) => (e.target as HTMLElement).blur()}
                        placeholder="70"
                        data-testid="simulator-delivery-rate-input"
                        className="h-7 text-xs font-mono bg-white"
                      />
                      <span className="text-xs font-mono text-neutral-500 font-bold">%</span>
                    </div>
                  </div>
                </div>

                {/* Real-time simulation outputs */}
                <div className="p-3 rounded-xl bg-white/95 border border-indigo-100/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">{t.netMarginPerOrder}</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        blendedNetMargin > 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                      data-testid="simulator-net-margin"
                    >
                      {blendedNetMargin > 0 ? `+${formatDZD(blendedNetMargin, lang)}` : formatDZD(blendedNetMargin, lang)}{" "}
                      <span className="text-[11px] font-sans font-medium text-neutral-500">
                        ({netMarginPercent}%)
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100">
                    <span className="text-neutral-600">{t.breakEvenThreshold}</span>
                    <span
                      className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md"
                      data-testid="simulator-breakeven-rate"
                    >
                      ~{breakEvenRate}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Solvency Invariants Live Checklist */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{t.solvencyTitle}</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${
                    isFormComplete
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isFormComplete
                    ? isAr
                      ? "جاهز للتفعيل"
                      : "Conforme 4/4"
                    : isAr
                    ? "بانتظار استيفاء الشروط"
                    : "Pré-requis en attente"}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                {/* Rule 1: Retail > CPA */}
                <div className="flex items-center gap-2">
                  {isRetailGreater ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0" />
                  )}
                  <span className={isRetailGreater ? "text-neutral-900 font-medium" : "text-neutral-500"}>
                    {t.rule1}
                  </span>
                </div>

                {/* Rule 2: CPA <= 50% Retail */}
                <div className="flex items-center gap-2">
                  {isWithinCap ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0" />
                  )}
                  <span className={isWithinCap ? "text-neutral-900 font-medium" : "text-neutral-500"}>
                    {t.rule2}
                  </span>
                </div>

                {/* Rule 3: Stock >= 20 */}
                <div className="flex items-center gap-2">
                  {isStockValid ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0" />
                  )}
                  <span className={isStockValid ? "text-neutral-900 font-medium" : "text-neutral-500"}>
                    {t.rule3}
                  </span>
                </div>

                {/* Rule 4: Escrow covers 5x CPA */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200/60">
                  <div className="flex items-center gap-2">
                    {isEscrowValid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className={isEscrowValid ? "text-neutral-900 font-medium" : "text-amber-800 font-medium"}>
                      {t.rule4}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">
                    ({formatDZD(walletBalance, lang)})
                  </span>
                </div>
              </div>

              {/* Insufficient Escrow Top-Up Trigger */}
              {cpaNum > 0 && !isEscrowValid && (
                <div className="pt-2">
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between gap-2">
                    <span>
                      {isAr
                        ? "الرصيد لا يغطي الضمان المطلوب. اشحن محفظتك لإتمام النشر."
                        : "Votre solde actuel est insuffisant pour ce budget CPA."}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onOpenTopUp();
                      }}
                      className="text-[11px] h-7 px-2.5 bg-amber-600 hover:bg-amber-700 text-white shrink-0 gap-1"
                      data-testid="open-topup-from-product-btn"
                    >
                      <Wallet className="w-3 h-3" />
                      <span>{t.rechargeBtn}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between gap-2.5 shrink-0">
          <Link
            href="/supplier/products/new"
            onClick={onClose}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 cursor-pointer"
            data-testid="modal-to-full-studio-link"
          >
            <span>{isAr ? "فتح الاستوديو الكامل" : lang === "en" ? "Open Full Studio" : "Ouvrir l'éditeur complet"} &rarr;</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              form="supplier-product-form"
              size="sm"
              disabled={isSubmitting || !isFormComplete}
              className="gap-1.5 rounded-full bg-[#064e3b] text-amber-200 text-xs font-semibold hover:bg-[#085a44] transition-all shadow-xs active:scale-95 border border-[#0a5e47] focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#064e3b]"
              data-testid="product-submit-btn"
            >
              <PackagePlus className="w-3.5 h-3.5 text-amber-300" />
              <span>{isSubmitting ? t.submitting : t.submit}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
