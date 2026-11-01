"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDZD } from "@/lib/formatters";
import { Language } from "@/lib/locales";
import { apiCreateSupplierProduct, apiGetMyWallet, getCurrentUser } from "@/lib/api-client";
import { SupplierTopUpModal } from "@/components/supplier/supplier-topup-modal";
import {
  ArrowLeft,
  PackagePlus,
  Box,
  Tag,
  Coins,
  Wallet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ImageIcon,
  Trash2,
  Calculator,
  ShieldCheck,
  Eye,
  Check,
  Layers,
  Sparkles,
  Info,
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

const CATEGORIES = [
  { id: "tech", label: { fr: "High-Tech & Électronique", en: "Electronics & Tech", ar: "إلكترونيات وتكنولوجيا" } },
  { id: "home", label: { fr: "Maison & Cuisine", en: "Home & Kitchen", ar: "المنزل والمطبخ" } },
  { id: "fashion", label: { fr: "Mode & Beauté", en: "Fashion & Beauty", ar: "الموضة والجمال" } },
  { id: "auto", label: { fr: "Auto & Bricolage", en: "Auto & Tools", ar: "سيارات وأدوات" } },
  { id: "fitness", label: { fr: "Santé & Fitness", en: "Health & Fitness", ar: "الصحة واللياقة" } },
  { id: "other", label: { fr: "Autre Catégorie", en: "Other", ar: "أخرى" } },
];

const newProductTranslations = {
  fr: {
    backToCatalog: "Retour au Catalogue",
    pageKicker: "Fournisseur • Studio de Création",
    pageTitle: "Nouveau Produit & Garantie CPA",
    pageSubtitle: "Configurez les données de votre produit, ses visuels et validez vos règles de solvabilité en direct.",
    saveAndPublish: "Publier le Produit",
    publishing: "Validation & Publication...",
    cancel: "Annuler",
    sectionEssentials: "1. Informations Générales",
    sectionEssentialsDesc: "Données principales affichées aux affiliés sur la marketplace.",
    nameLabel: "Nom du Produit",
    namePlaceholder: "Ex: Écouteurs Sans Fil Pro ANC avec Réduction Active",
    categoryLabel: "Catégorie",
    descLabel: "Description & Arguments de Vente",
    descPlaceholder: "Caractéristiques techniques, points forts, contenu du pack...",
    sectionMedia: "2. Visuel & Photo Principale",
    sectionMediaDesc: "Photo haute définition affichée dans la marketplace et sur les fiches produits.",
    imageDropzone: "Glissez une image ici ou cliquez pour sélectionner un fichier",
    imageHelper: "Formats supportés : PNG, JPG, WebP. Compression automatique fluide.",
    changeImage: "Changer la photo",
    removeImage: "Supprimer",
    sectionPricing: "3. Prix de Vente & Budget CPA (Garantie Escrow)",
    sectionPricingDesc: "Définissez le prix client et la commission CPA garantie allouée aux affiliés.",
    retailLabel: "Prix de Vente Client (Retail)",
    retailHelper: "Prix final facturé au client lors de la livraison (DZD).",
    cpaLabel: "Budget CPA Brut Garanti",
    cpaDesc: "Commission brute déduite de votre séquestre uniquement après livraison confirmée (Max. 50% du prix de vente).",
    escrowBufferLabel: "Tampon Escrow Requis (5x CPA) :",
    escrowBalanceLabel: "Votre Solde Escrow Disponible :",
    rechargeEscrow: "Recharger le Solde",
    sectionInventory: "4. Inventaire & Gestion des Stocks",
    sectionInventoryDesc: "Gestion du stock initial réservé pour le réseau d'affiliés.",
    stockLabel: "Stock Initial Disponible",
    stockHelper: "Min. 20 unités requises pour l'activation immédiate.",
    skuLabel: "SKU / Référence Interne (Optionnel)",
    skuPlaceholder: "Ex: PROD-ANC-001",
    sectionSimulator: "5. Simulateur Prédictif de Marge & Seuil RTO",
    sectionSimulatorDesc: "Modélisation financière prédictive basée sur les performances de livraison en Algérie.",
    costPriceLabel: "Coût unitaire d'achat (Optionnel)",
    estDeliveryRateLabel: "Taux de livraison estimé (%)",
    netMarginPerOrder: "Marge Nette Estimée / Commande :",
    breakEvenThreshold: "Seuil de Rentabilité (Break-Even) :",
    breakEvenSafe: "Rentabilité Saine",
    breakEvenWarning: "Marge Sensible",
    breakEvenLoss: "Risque de Perte",
    previewTitle: "Aperçu Marketplace Affilié",
    previewBadge: "Aperçu en direct",
    previewPlaceholderName: "Titre de votre produit",
    previewCpaBadge: "CPA Garanti",
    previewStockBadge: "unités",
    solvencyTitle: "Radar de Solvabilité (Invariants 4/4)",
    rule1: "Prix de vente supérieur au budget CPA",
    rule2: "Budget CPA <= 50% du prix de vente",
    rule3: "Stock initial >= 20 unités",
    rule4: "Solde Escrow couvre 5x le CPA",
    compliant: "Conforme 4/4",
    incomplete: "En attente de saisie",
    errName: "Le nom du produit est obligatoire.",
    errStock: "Le stock initial minimum est de 20 unités pour activer le produit.",
    errRetail: "Le prix de vente doit être strictement supérieur au budget CPA.",
    errCap: "Le budget CPA ne peut pas dépasser 50% du prix de vente.",
    errEscrow: "Solde Escrow insuffisant: rechargez votre compte pour couvrir le tampon de 5x CPA.",
  },
  en: {
    backToCatalog: "Back to Catalog",
    pageKicker: "Supplier • Creation Studio",
    pageTitle: "New Product & CPA Guarantee",
    pageSubtitle: "Configure your product details, high-res visuals, and validate live solvency invariants.",
    saveAndPublish: "Publish Product",
    publishing: "Validating & Publishing...",
    cancel: "Cancel",
    sectionEssentials: "1. Product Essentials",
    sectionEssentialsDesc: "Primary details displayed to affiliates on the marketplace.",
    nameLabel: "Product Name",
    namePlaceholder: "Ex: Wireless Earbuds Pro ANC with Active Noise Canceling",
    categoryLabel: "Category",
    descLabel: "Description & Selling Points",
    descPlaceholder: "Technical specifications, highlights, package contents...",
    sectionMedia: "2. Visual Media & Cover Photo",
    sectionMediaDesc: "High-definition photo rendered in affiliate catalog cards.",
    imageDropzone: "Drag and drop an image here or click to browse",
    imageHelper: "Supported formats: PNG, JPG, WebP. Automatic smooth compression.",
    changeImage: "Change photo",
    removeImage: "Remove",
    sectionPricing: "3. Retail Price & CPA Guarantee (Escrow Buffer)",
    sectionPricingDesc: "Set customer retail price and the guaranteed CPA commission allocated to affiliates.",
    retailLabel: "Customer Retail Price",
    retailHelper: "Final price charged to customer upon delivery (DZD).",
    cpaLabel: "Guaranteed Gross CPA Budget",
    cpaDesc: "Gross CPA deducted from escrow only upon confirmed delivery (Max. 50% of retail price).",
    escrowBufferLabel: "Required Escrow Buffer (5x CPA):",
    escrowBalanceLabel: "Your Available Escrow Balance:",
    rechargeEscrow: "Top-Up Balance",
    sectionInventory: "4. Inventory & Stock Allocation",
    sectionInventoryDesc: "Initial stock allocation reserved for affiliate network sales.",
    stockLabel: "Initial Available Stock",
    stockHelper: "Min. 20 units required for instant catalog activation.",
    skuLabel: "SKU / Internal Reference (Optional)",
    skuPlaceholder: "Ex: PROD-ANC-001",
    sectionSimulator: "5. Predictive Margin & RTO Simulator",
    sectionSimulatorDesc: "Predictive financial modeling based on Algerian COD delivery performance.",
    costPriceLabel: "Unit Product Cost (Optional)",
    estDeliveryRateLabel: "Estimated Delivery Rate (%)",
    netMarginPerOrder: "Estimated Net Margin / Order:",
    breakEvenThreshold: "Break-Even Delivery Rate:",
    breakEvenSafe: "Healthy Margin",
    breakEvenWarning: "Sensitive Margin",
    breakEvenLoss: "Risk of Loss",
    previewTitle: "Affiliate Marketplace Card Preview",
    previewBadge: "Live Preview",
    previewPlaceholderName: "Your product title",
    previewCpaBadge: "Guaranteed CPA",
    previewStockBadge: "units",
    solvencyTitle: "Solvency Radar (4/4 Invariants)",
    rule1: "Retail price greater than CPA budget",
    rule2: "CPA budget <= 50% of retail price",
    rule3: "Initial stock >= 20 units",
    rule4: "Escrow balance covers 5x CPA buffer",
    compliant: "Compliant 4/4",
    incomplete: "Awaiting valid inputs",
    errName: "Product name is required.",
    errStock: "Minimum initial stock is 20 units to activate product.",
    errRetail: "Retail price must be strictly greater than CPA budget.",
    errCap: "CPA budget cannot exceed 50% of retail price.",
    errEscrow: "Insufficient escrow balance: top-up account to cover 5x CPA buffer.",
  },
  ar: {
    backToCatalog: "العودة إلى الكتالوج",
    pageKicker: "المورد • استوديو إضافة المنتجات",
    pageTitle: "إضافة منتج جديد وضمان CPA",
    pageSubtitle: "قم بضبط بيانات المنتج والصور التوضيحية والتحقق الفوري من شروط الملاءة المالية.",
    saveAndPublish: "نشر وتفعيل المنتج",
    publishing: "جار التحقق والتفعيل...",
    cancel: "إلغاء",
    sectionEssentials: "1. المعلومات العامة للمنتج",
    sectionEssentialsDesc: "البيانات الأساسية التي تظهر للمسوقين في المتجر.",
    nameLabel: "اسم المنتج",
    namePlaceholder: "مثال: سماعات لاسلكية عازلة للضوضاء ANC",
    categoryLabel: "التصنيف",
    descLabel: "الوصف والمميزات الرئيسية",
    descPlaceholder: "المواصفات التقنية، نقاط القوة، محتويات العلبة...",
    sectionMedia: "2. الصورة الرئيسية للمنتج",
    sectionMediaDesc: "صورة عالية الجودة تظهر في بطاقة المنتج للمسوقين.",
    imageDropzone: "اسحب الصورة هنا أو اضغط للاختيار من جهازك",
    imageHelper: "الملفات المدعومة: PNG, JPG, WebP. ضغط ذكي تلقائي للحجم.",
    changeImage: "تغيير الصورة",
    removeImage: "حذف",
    sectionPricing: "3. سعر البيع وميزانية CPA (ضمان Escrow)",
    sectionPricingDesc: "حدد سعر البيع للزبون النهائي وعمولة الـ CPA المضمونة للمسوقين.",
    retailLabel: "سعر البيع للزبون (Retail)",
    retailHelper: "السعر النهائي المحصل عند الاستلام (د.ج).",
    cpaLabel: "ميزانية الـ CPA الإجمالية المقترحة",
    cpaDesc: "العمولة الإجمالية المخصومة من حساب الضمان بعد التسليم الناجح فقط (بحد أقصى 50% من سعر البيع).",
    escrowBufferLabel: "الضمان المالي المطلوب (5x CPA):",
    escrowBalanceLabel: "رصيدك المالي المتاح حالياً:",
    rechargeEscrow: "شحن رصيد الضمان",
    sectionInventory: "4. إدارة المخزون",
    sectionInventoryDesc: "تخصيص الكمية المتاحة لشبكة المسوقين والشركاء.",
    stockLabel: "المخزون الأولي المتاح",
    stockHelper: "20 قطعة على الأقل لتفعيل المنتج فورا.",
    skuLabel: "رمز المنتج الداخلي SKU (اختياري)",
    skuPlaceholder: "مثال: PROD-ANC-001",
    sectionSimulator: "5. حاسبة الأرباح الصافية ونسبة المرتجع RTO",
    sectionSimulatorDesc: "محاكاة مالية مبنية على معدلات التسليم المعتمدة في الجزائر.",
    costPriceLabel: "تكلفة شراء القطعة (اختياري)",
    estDeliveryRateLabel: "نسبة التوصيل المتوقعة (%)",
    netMarginPerOrder: "صافي الربح المتوقع لكل طلبية:",
    breakEvenThreshold: "الحد الأدنى لنسبة التوصيل لتفادي الخسارة:",
    breakEvenSafe: "هامش ربح آمن",
    breakEvenWarning: "حساس للمرتجع",
    breakEvenLoss: "خطر الخسارة",
    previewTitle: "معاينة بطاقة المنتج للمسوقين",
    previewBadge: "معاينة حية",
    previewPlaceholderName: "عنوان منتجك الجديد",
    previewCpaBadge: "عمولة CPA مضمونة",
    previewStockBadge: "قطعة",
    solvencyTitle: "فحص الملاءة المالية (الشروط 4/4)",
    rule1: "سعر البيع أكبر تماماً من ميزانية CPA",
    rule2: "ميزانية CPA لا تتجاوز 50% من سعر البيع",
    rule3: "المخزون الأولي 20 وحدة أو أكثر",
    rule4: "رصيد الضمان يغطي 5 أضعاف الـ CPA",
    compliant: "مكتمل 4/4",
    incomplete: "في انتظار إدخال البيانات",
    errName: "اسم المنتج مطلوب.",
    errStock: "المخزون الأولي الأدنى هو 20 قطعة لتفعيل المنتج.",
    errRetail: "سعر البيع يجب أن يكون أكبر من ميزانية CPA.",
    errCap: "ميزانية CPA لا يمكن أن تتجاوز 50% من سعر البيع.",
    errEscrow: "رصيد الضمان غير كافٍ: قم بشحن الرصيد لتغطية 5 أضعاف الـ CPA.",
  },
};

export default function NewProductPage() {
  const router = useRouter();

  const [walletBalance, setWalletBalance] = useState<number>(8000);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("tech");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Numbers (Sanitized strings to isolate mouse wheel bugs)
  const [stock, setStock] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [supplierTotalCpa, setSupplierTotalCpa] = useState("");

  // Simulator
  const [costPrice, setCostPrice] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("700");
  const [deliveryRate, setDeliveryRate] = useState("70");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fromAdmin, setFromAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const user = getCurrentUser();
      if (params.get("from") === "admin" || user?.role === "ADMIN") {
        setFromAdmin(true);
      }
    }
  }, []);

  const backUrl = fromAdmin ? "/admin/products" : "/supplier/products";

  useEffect(() => {
    async function fetchWallet() {
      try {
        const user = getCurrentUser();
        if (user?.role === "ADMIN") {
          setWalletBalance(1890000);
          try {
            const wallet = await apiGetMyWallet();
            if (wallet?.balance !== undefined) {
              setWalletBalance(Number(wallet.balance));
            }
          } catch {
            // Keep admin platform treasury balance fallback
          }
          return;
        }

        const wallet = await apiGetMyWallet();
        if (wallet) {
          setWalletBalance(Number(wallet.balance || 0));
        }
      } catch (err: any) {
        console.warn("Wallet balance load notice:", err?.message || err);
      }
    }
    fetchWallet();
  }, []);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    try {
      setImageName(file.name);
      const compressed = await processImageFile(file);
      setImageUrl(compressed);
    } catch (err) {
      console.error("Failed to compress image:", err);
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

  // Parsed Numerical Metrics
  const stockNum = parseInt(stock, 10) || 0;
  const retailPriceNum = parseInt(retailPrice, 10) || 0;
  const cpaNum = parseInt(supplierTotalCpa, 10) || 0;
  const requiredEscrow = cpaNum * 5;

  // Simulator calculations
  const parsedCost = parseInt(costPrice, 10);
  const costNum = !isNaN(parsedCost) && parsedCost >= 0 ? parsedCost : (retailPriceNum > 0 ? Math.round(retailPriceNum * 0.4) : 0);
  const deliveryFeeNum = parseInt(deliveryFee, 10) || 700;
  const deliveryRateNum = Math.min(100, Math.max(1, parseInt(deliveryRate, 10) || 70));
  const returnTransitCost = Math.round(deliveryFeeNum * 0.6);

  const profitOnDelivered = retailPriceNum - costNum - cpaNum - deliveryFeeNum;
  const lossOnReturned = returnTransitCost;

  const blendedNetMargin = Math.round(
    (deliveryRateNum / 100) * profitOnDelivered - ((100 - deliveryRateNum) / 100) * lossOnReturned
  );
  const breakEvenRate =
    profitOnDelivered + lossOnReturned > 0
      ? Math.min(100, Math.max(0, Math.round((lossOnReturned / (profitOnDelivered + lossOnReturned)) * 100)))
      : 100;

  const isSafeMargin = blendedNetMargin > 0 && breakEvenRate < 60;
  const isCautionMargin = blendedNetMargin > 0 && breakEvenRate >= 60;

  // Solvency Invariants
  const isCpaPositive = cpaNum > 0;
  const isRetailGreater = retailPriceNum > 0 && cpaNum > 0 && retailPriceNum > cpaNum;
  const isWithinCap = retailPriceNum > 0 && cpaNum > 0 && cpaNum <= retailPriceNum * 0.5;
  const isStockValid = stockNum >= 20;
  const isEscrowValid = cpaNum > 0 && walletBalance >= requiredEscrow;

  const invariantsPassed =
    (isRetailGreater ? 1 : 0) +
    (isWithinCap ? 1 : 0) +
    (isStockValid ? 1 : 0) +
    (isEscrowValid ? 1 : 0);

  const isFormComplete =
    name.trim().length > 0 &&
    stockNum >= 20 &&
    retailPriceNum > 0 &&
    isCpaPositive &&
    isRetailGreater &&
    isWithinCap &&
    isEscrowValid;

  const handleSubmit = async (e: React.FormEvent, langDict: any) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage(langDict.errName);
      return;
    }
    if (stockNum < 20) {
      setErrorMessage(langDict.errStock);
      return;
    }
    if (retailPriceNum <= cpaNum) {
      setErrorMessage(langDict.errRetail);
      return;
    }
    if (cpaNum > retailPriceNum * 0.5) {
      setErrorMessage(langDict.errCap);
      return;
    }
    if (walletBalance < requiredEscrow) {
      setErrorMessage(langDict.errEscrow);
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
      router.push(backUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la création du produit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout initialRole="supplier" initialLang="fr">
      {({ lang }) => {
        const t = newProductTranslations[lang] || newProductTranslations.fr;
        const isAr = lang === "ar";

        return (
          <div className="space-y-6 text-start w-full max-w-full min-w-0" data-testid="new-product-page-container">
            {/* Top Navigation & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.06]">
              <div>
                <Link
                  href={backUrl}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-2 cursor-pointer"
                  data-testid="back-to-catalog-link"
                >
                  <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? "rotate-180" : ""}`} />
                  <span>{t.backToCatalog}</span>
                </Link>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-200 bg-sky-50 text-sky-700 font-mono uppercase tracking-wider">
                    {t.pageKicker}
                  </span>
                  <span className="text-xs text-neutral-400">&bull;</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {t.escrowBalanceLabel}{" "}
                    <span className="font-mono font-bold text-neutral-900">
                      {formatDZD(walletBalance, lang)}
                    </span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1">
                  {t.pageTitle}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 max-w-2xl">
                  {t.pageSubtitle}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(backUrl)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  {t.cancel}
                </Button>

                <Button
                  size="sm"
                  onClick={(e) => handleSubmit(e, t)}
                  disabled={!isFormComplete || isSubmitting}
                  className="gap-2 rounded-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white text-xs font-semibold shadow-md shadow-sky-500/20 hover:shadow-sky-500/35 hover:brightness-105 transition-all active:scale-95 border border-sky-400/30 focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  data-testid="page-publish-product-btn"
                >
                  <PackagePlus className="w-4 h-4 text-white" />
                  <span>{isSubmitting ? t.publishing : t.saveAndPublish}</span>
                </Button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in"
                data-testid="new-product-page-error-alert"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* 2-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Sections (8 Cols) */}
              <form
                id="new-product-form"
                noValidate
                onSubmit={(e) => handleSubmit(e, t)}
                className="lg:col-span-7 xl:col-span-8 space-y-6"
              >
                {/* 1. Essentials */}
                <Card className="p-5 sm:p-6 rounded-3xl border border-black/[0.08] shadow-xs space-y-5 bg-white">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-sky-600" />
                      <span>{t.sectionEssentials}</span>
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">{t.sectionEssentialsDesc}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
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
                        data-testid="page-product-name-input"
                        className="text-sm font-medium"
                      />
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-900 block">
                        {t.categoryLabel}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => {
                          const isSelected = category === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setCategory(cat.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                                isSelected
                                  ? "bg-sky-50 text-sky-700 border-sky-300 shadow-2xs font-bold"
                                  : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                              }`}
                            >
                              {cat.label[lang] || cat.label.fr}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-900 block">
                        {t.descLabel}
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t.descPlaceholder}
                        rows={3}
                        data-testid="page-product-desc-input"
                        className="w-full text-xs sm:text-sm rounded-xl border border-neutral-200 p-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-y"
                      />
                    </div>
                  </div>
                </Card>

                {/* 2. Visual Media */}
                <Card className="p-5 sm:p-6 rounded-3xl border border-black/[0.08] shadow-xs space-y-5 bg-white">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-sky-600" />
                      <span>{t.sectionMedia}</span>
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">{t.sectionMediaDesc}</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    id="page-product-image-file-input"
                    data-testid="page-product-image-file-input"
                    onChange={handleImageFileChange}
                  />

                  {imageUrl ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-neutral-200 bg-neutral-50/70">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300 relative group">
                        <img
                          src={imageUrl}
                          alt={imageName || "Preview"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 start-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          Cover
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">
                          {imageName || "product_image.jpg"}
                        </p>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Image compressée & optimisée pour affichage mobile</span>
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs cursor-pointer h-8"
                          >
                            {t.changeImage}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer h-8"
                          >
                            <Trash2 className="w-3.5 h-3.5 me-1" />
                            <span>{t.removeImage}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                      data-testid="page-product-image-dropzone"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 shadow-2xs">
                        {isProcessingImage ? (
                          <div className="w-5 h-5 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UploadCloud className="w-6 h-6" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-neutral-800">
                        {t.imageDropzone}
                      </p>
                      <p className="text-[11px] text-neutral-400">{t.imageHelper}</p>
                    </div>
                  )}
                </Card>

                {/* 3. Pricing & CPA Guarantee (Escrow Buffer) */}
                <Card className="p-5 sm:p-6 rounded-3xl border border-black/[0.08] shadow-xs space-y-5 bg-white">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-sky-600" />
                      <span>{t.sectionPricing}</span>
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">{t.sectionPricingDesc}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          data-testid="page-product-retail-price-input"
                          className="font-mono text-base font-bold ps-9 pe-12 bg-white"
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 font-mono">
                          DZD
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 block">{t.retailHelper}</span>
                    </div>

                    {/* Gross CPA Budget */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-900 block">
                        {t.cpaLabel} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Coins className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600" />
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
                          data-testid="page-product-cpa-input"
                          className="font-mono text-base font-bold ps-9 pe-12 border-neutral-200 focus:border-sky-500 focus:ring-sky-500/20 bg-white"
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-sky-700 font-mono">
                          DZD
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 block">{t.cpaDesc}</span>
                    </div>
                  </div>

                  {/* Required Escrow Buffer Banner (WITHOUT 80/20 breakdown) */}
                  {cpaNum > 0 && (
                    <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-200/70 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>{t.escrowBufferLabel}</span>
                        </span>
                        <span className="font-mono font-bold text-sky-700 text-base">
                          {formatDZD(requiredEscrow, lang)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <span className="text-neutral-500">{t.escrowBalanceLabel}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              walletBalance >= requiredEscrow ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {formatDZD(walletBalance, lang)}
                          </span>
                          {walletBalance < requiredEscrow && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setIsTopUpOpen(true)}
                              className="text-[11px] h-7 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
                              data-testid="page-insufficient-topup-btn"
                            >
                              <Wallet className="w-3 h-3 me-1" />
                              <span>{t.rechargeEscrow}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* 4. Inventory & Stock Allocation */}
                <Card className="p-5 sm:p-6 rounded-3xl border border-black/[0.08] shadow-xs space-y-5 bg-white">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                      <Box className="w-4 h-4 text-amber-600" />
                      <span>{t.sectionInventory}</span>
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">{t.sectionInventoryDesc}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          placeholder="50"
                          required
                          data-testid="page-product-stock-input"
                          className="font-mono text-sm ps-9"
                        />
                      </div>
                      <span className="text-[11px] text-neutral-500 block">{t.stockHelper}</span>
                    </div>

                    {/* SKU */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-900 block">
                        {t.skuLabel}
                      </label>
                      <Input
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder={t.skuPlaceholder}
                        className="font-mono text-sm uppercase"
                      />
                    </div>
                  </div>
                </Card>

                {/* 5. Simulator */}
                {retailPriceNum > 0 && cpaNum > 0 && (
                  <Card className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-sky-50/70 via-blue-50/40 to-white border border-sky-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-950 flex items-center gap-2 text-sm">
                        <Calculator className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>{t.sectionSimulator}</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full font-mono uppercase ${
                          isSafeMargin
                            ? "bg-emerald-100 text-emerald-800"
                            : isCautionMargin
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {isSafeMargin ? t.breakEvenSafe : isCautionMargin ? t.breakEvenWarning : t.breakEvenLoss}
                      </span>
                    </div>

                    <p className="text-xs text-sky-900/80 leading-relaxed">
                      {t.sectionSimulatorDesc}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
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
                          className="h-8 text-xs font-mono bg-white"
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
                            className="h-8 text-xs font-mono bg-white"
                          />
                          <span className="text-xs font-mono text-neutral-500 font-bold">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-sky-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">{t.netMarginPerOrder}</span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            blendedNetMargin > 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {formatDZD(blendedNetMargin, lang)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100">
                        <span className="text-neutral-600">{t.breakEvenThreshold}</span>
                        <span className="font-mono font-bold text-neutral-900">
                          {breakEvenRate}%
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
              </form>

              {/* Right Column: Sticky Live Preview & Solvency Radar (4 Cols) */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6">
                {/* Solvency Invariants Radar Card */}
                <Card className="p-5 sm:p-6 rounded-3xl border border-black/[0.08] shadow-xs space-y-4 bg-white" data-testid="solvency-radar-card">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      <span>{t.solvencyTitle}</span>
                    </h3>
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                        invariantsPassed === 4
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                      data-testid="solvency-compliance-badge"
                    >
                      {invariantsPassed === 4 ? t.compliant : `${invariantsPassed}/4`}
                    </span>
                  </div>

                  {/* Checklist Rules */}
                  <div className="space-y-2 text-xs">
                    {/* Rule 1: Retail > CPA */}
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isRetailGreater
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-neutral-100 text-neutral-400"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className={isRetailGreater ? "text-neutral-800 font-medium" : "text-neutral-500"}>
                        {t.rule1}
                      </span>
                    </div>

                    {/* Rule 2: CPA <= 50% Retail */}
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isWithinCap
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-neutral-100 text-neutral-400"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className={isWithinCap ? "text-neutral-800 font-medium" : "text-neutral-500"}>
                        {t.rule2}
                      </span>
                    </div>

                    {/* Rule 3: Stock >= 20 */}
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isStockValid
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-neutral-100 text-neutral-400"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className={isStockValid ? "text-neutral-800 font-medium" : "text-neutral-500"}>
                        {t.rule3}
                      </span>
                    </div>

                    {/* Rule 4: Escrow covers 5x CPA */}
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isEscrowValid
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-neutral-100 text-neutral-400"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className={isEscrowValid ? "text-neutral-800 font-medium" : "text-neutral-500"}>
                        {t.rule4}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Live Marketplace Card Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
                    <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{t.previewTitle}</span>
                    </span>
                    <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                      {t.previewBadge}
                    </span>
                  </div>

                  {/* Marketplace Card Render */}
                  <div
                    className="rounded-3xl border border-black/[0.08] bg-white overflow-hidden shadow-md transition-all text-start"
                    data-testid="marketplace-card-preview"
                  >
                    {/* Image Area */}
                    <div className="w-full h-44 bg-neutral-100 relative overflow-hidden flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-neutral-400 gap-1.5 p-4 text-center">
                          <ImageIcon className="w-8 h-8 opacity-40" />
                          <span className="text-xs">{t.previewPlaceholderName}</span>
                        </div>
                      )}
                      <div className="absolute top-2 start-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-neutral-800 border border-black/5 shadow-xs">
                          {CATEGORIES.find((c) => c.id === category)?.label[lang] || "High-Tech"}
                        </span>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">
                          {name.trim() || t.previewPlaceholderName}
                        </h4>
                        <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">
                          {description.trim() || t.descPlaceholder}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-neutral-400 font-mono">
                            {t.retailLabel}
                          </p>
                          <p className="text-base font-bold font-mono text-neutral-900">
                            {retailPriceNum > 0 ? formatDZD(retailPriceNum, lang) : "0 DZD"}
                          </p>
                        </div>

                        <div className="text-end">
                          <p className="text-[10px] uppercase font-bold text-emerald-600 font-mono">
                            {t.previewCpaBadge}
                          </p>
                          <p className="text-base font-bold font-mono text-emerald-700">
                            {cpaNum > 0 ? formatDZD(cpaNum, lang) : "0 DZD"}
                          </p>
                        </div>
                      </div>

                      {/* Stock Pill */}
                      <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-500">
                        <span>Stock alloué :</span>
                        <span className="font-mono font-bold text-neutral-800">
                          {stockNum} {t.previewStockBadge}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Publish Button in Sticky Column */}
                <Button
                  size="lg"
                  onClick={(e) => handleSubmit(e, t)}
                  disabled={!isFormComplete || isSubmitting}
                  className="w-full gap-2 rounded-2xl bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white hover:brightness-105 transition-all shadow-md shadow-sky-500/25 hover:shadow-sky-500/40 active:scale-95 border border-sky-400/30 focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:hover:shadow-none text-sm font-bold py-6"
                  data-testid="page-sticky-publish-btn"
                >
                  <PackagePlus className="w-5 h-5 text-white" />
                  <span>{isSubmitting ? t.publishing : t.saveAndPublish}</span>
                </Button>
              </div>
            </div>

            {/* Escrow Top-Up Modal Bridge */}
            <SupplierTopUpModal
              isOpen={isTopUpOpen}
              onClose={async () => {
                setIsTopUpOpen(false);
                try {
                  const user = getCurrentUser();
                  if (user?.role === "ADMIN") {
                    setWalletBalance(1890000);
                    return;
                  }
                  const wallet = await apiGetMyWallet();
                  if (wallet) {
                    setWalletBalance(Number(wallet.balance || 0));
                  }
                } catch (err: any) {
                  console.warn("Could not reload wallet after top-up:", err?.message || err);
                }
              }}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
