"use client";

import React, { useState, useEffect, useRef } from "react";
import { Language } from "@/lib/locales";
import {
  Building2,
  Copy,
  Check,
  X,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiSubmitDepositRequest, DepositPaymentRail } from "@/lib/api-client";
import { formatDZD } from "@/lib/formatters";

interface SupplierTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onSuccess?: () => void;
}

const topUpTranslations = {
  fr: {
    title: "Rechargement du Solde Escrow",
    subtitle: "Compte Séquestre & Garantie des Commissions",
    desc: "Effectuez votre virement vers l'un des comptes officiels ci-dessous puis transmettez le reçu pour validation et crédit immédiat :",
    ccpLabel: "Compte CCP Postal :",
    ccpVal: "0021948293 Clé 45",
    ripLabel: "BaridiMob RIP :",
    ripVal: "00799999002194829345",
    bankLabel: "Banque Nationale (BNA) :",
    bankVal: "00100 02103 0000123456 78",
    holderLabel: "Titulaire :",
    holderVal: "SARL ViteDrop Logistics DZ",
    instructionsTitle: "Validation & Crédit Instantané :",
    instructionsDesc:
      "Envoyez la capture d'écran du transfert sur WhatsApp à votre gestionnaire de compte ou via ce formulaire pour validation sous 15–30 min.",
    uploadSlipTitle: "Transmettre un Reçu de Versement",
    uploadSlipDesc: "Téléversez votre capture BaridiMob ou bordereau CCP/BNA pour validation sous 30 min.",
    uploadSlipPlaceholder: "N° de virement ou note (Optionnel)...",
    uploadSlipBtn: "Sélectionner le reçu (Image ou PDF)",
    uploadSlipSubmit: "Transmettre le Reçu",
    uploadSlipSubmitting: "Envoi en cours...",
    uploadSlipSuccess:
      "Votre bordereau a été transmis avec succès au service financier. Votre solde séquestre sera crédité sous 15 à 30 minutes après rapprochement bancaire.",
    successTitle: "Demande de Rechargement Transmise",
    amountLabel: "Montant déposé (DZD) :",
    minAmount: "Min. 1 000 DZD",
    railLabel: "Canal utilisé :",
    declaredAmount: "Montant déclaré :",
    pendingReview: "En attente de validation",
    changeFile: "Changer de fichier",
    removeFile: "Supprimer",
    close: "Compris",
  },
  en: {
    title: "Prepaid Escrow Recharge",
    subtitle: "Escrow Reserve & CPA Guarantee",
    desc: "Transfer your deposit to one of the official accounts below and transmit your payment proof for instant credit:",
    ccpLabel: "Postal CCP Account:",
    ccpVal: "0021948293 Clé 45",
    ripLabel: "BaridiMob RIP:",
    ripVal: "00799999002194829345",
    bankLabel: "National Bank (BNA):",
    bankVal: "00100 02103 0000123456 78",
    holderLabel: "Account Holder:",
    holderVal: "SARL ViteDrop Logistics DZ",
    instructionsTitle: "Instant Verification & Credit:",
    instructionsDesc:
      "Forward the transfer receipt via WhatsApp to your account manager or submit it through this form for validation within 15–30 min.",
    uploadSlipTitle: "Submit Deposit Slip Receipt",
    uploadSlipDesc: "Upload your BaridiMob screenshot or CCP/BNA slip for 30-min validation.",
    uploadSlipPlaceholder: "Transfer ref. or note (Optional)...",
    uploadSlipBtn: "Select receipt file (Image or PDF)",
    uploadSlipSubmit: "Transmit Receipt",
    uploadSlipSubmitting: "Transmitting...",
    uploadSlipSuccess:
      "Your receipt has been submitted successfully to finance. Your escrow balance will be credited within 15–30 minutes following banking clearing.",
    successTitle: "Deposit Request Transmitted",
    amountLabel: "Deposited Amount (DZD):",
    minAmount: "Min. 1,000 DZD",
    railLabel: "Payment Rail Used:",
    declaredAmount: "Declared Amount:",
    pendingReview: "Pending Verification",
    changeFile: "Change file",
    removeFile: "Remove",
    close: "Understood",
  },
  ar: {
    title: "شحن رصيد الضمان المالي (Escrow)",
    subtitle: "حساب الضمان وتغطية عمولات المسوقين",
    desc: "قم بتحويل مبلغ الضمان إلى أحد الحسابات الرسمية أدناه ثم أرسل وصل التحويل للتفعيل الفوري:",
    ccpLabel: "حساب البريد الجاري (CCP):",
    ccpVal: "0021948293 مفتاح 45",
    ripLabel: "معرف بريدي موب (RIP):",
    ripVal: "00799999002194829345",
    bankLabel: "الحساب البنكي (BNA):",
    bankVal: "00100 02103 0000123456 78",
    holderLabel: "صاحب الحساب:",
    holderVal: "SARL ViteDrop Logistics DZ",
    instructionsTitle: "التفعيل والتحقق الفوري:",
    instructionsDesc:
      "أرسل صورة وصل التحويل عبر واتساب لمشرف حسابك أو من خلال هذا النموذج لشحن الرصيد خلال 15-30 دقيقة.",
    uploadSlipTitle: "إرسال وصل التحويل المالي",
    uploadSlipDesc: "ارفع صورة وصل بريدي موب أو وصل CCP للتحقق السريع وإضافة الرصيد خلال 30 دقيقة.",
    uploadSlipPlaceholder: "رقم التحويل أو ملاحظة (اختياري)...",
    uploadSlipBtn: "اختيار صورة الوصل (صورة أو PDF)",
    uploadSlipSubmit: "إرسال الوصل",
    uploadSlipSubmitting: "جار الإرسال...",
    uploadSlipSuccess:
      "تم إرسال وصل التحويل بنجاح إلى قسم المحاسبة. سيتم شحن رصيد الضمان المالي الخاص بك خلال 15 إلى 30 دقيقة بعد التأكيد البنكي.",
    successTitle: "تم استلام طلب الشحن بنجاح",
    amountLabel: "المبلغ المودع (دج):",
    minAmount: "الحد الأدنى 1,000 دج",
    railLabel: "القناة المستخدمة للتحويل:",
    declaredAmount: "المبلغ المصرح:",
    pendingReview: "قيد المراجعة والتحقق",
    changeFile: "تغيير الملف",
    removeFile: "إزالة",
    close: "حسناً، فهمت",
  },
};

/**
 * Client-side image processor: compresses large smartphone camera photos
 * down to max 1600px width/height and 0.85 JPEG quality (~150-250KB),
 * while preserving crystal-clear readability for receipts.
 */
async function processReceiptFile(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const maxDim = 1600;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  });
}

export function SupplierTopUpModal({
  isOpen,
  onClose,
  lang = "fr",
  onSuccess,
}: SupplierTopUpModalProps) {
  const t = topUpTranslations[lang] || topUpTranslations.fr;
  const isArabic = lang === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("10000");
  const [paymentRail, setPaymentRail] = useState<DepositPaymentRail>("BARIDIMOB");
  const [slipRef, setSlipRef] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Manage file thumbnail
  useEffect(() => {
    if (!selectedFile) {
      setPreviewThumbnail(null);
      return;
    }
    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewThumbnail(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewThumbnail(null);
    }
  }, [selectedFile]);

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewThumbnail(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1000) {
      setUploadError(
        isArabic
          ? "الحد الأدنى لمبلغ الإيداع هو 1,000 دج"
          : lang === "en"
          ? "Minimum deposit amount is 1,000 DZD"
          : "Le montant minimum de dépôt est de 1 000 DZD"
      );
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const base64Data = await processReceiptFile(selectedFile);

      await apiSubmitDepositRequest({
        amount: numAmount,
        paymentRail,
        referenceNote: slipRef.trim() || undefined,
        receiptUrl: base64Data,
      });

      setUploadSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de transmission du reçu";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewThumbnail(null);
      setAmount("10000");
      setPaymentRail("BARIDIMOB");
      setSlipRef("");
      setIsUploading(false);
      setUploadSuccess(false);
      setUploadError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="supplier-topup-modal-title"
          data-testid="supplier-topup-modal"
          dir={isArabic ? "rtl" : "ltr"}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs [overscroll-behavior:contain]"
            aria-hidden="true"
          />

          {/* Modal Card Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200/90 overflow-hidden text-start flex flex-col max-h-[90vh] [overscroll-behavior:contain] my-auto"
          >
            {/* Pinned Header */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="supplier-topup-modal-title"
                    className="text-sm font-bold text-neutral-900 tracking-tight truncate"
                  >
                    {t.title}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{t.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors shrink-0"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body Container with min-h-0 to guarantee correct flex overflow behavior */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5 space-y-4 text-xs leading-relaxed">
              {uploadSuccess ? (
                /* Dedicated High-Clarity Success Screen */
                <div
                  className="py-4 px-2 sm:px-4 text-center space-y-4"
                  data-testid="receipt-slip-success-banner"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-950 tracking-tight">
                      {t.successTitle}
                    </h3>
                    <p className="text-xs text-neutral-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
                      {t.uploadSlipSuccess}
                    </p>
                  </div>

                  {/* Summary Details Card */}
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 max-w-sm mx-auto text-xs space-y-2.5 text-start font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 font-sans text-[11px]">{t.declaredAmount}</span>
                      <span className="font-bold text-neutral-900 text-sm">
                        {formatDZD(Number(amount), lang)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60">
                      <span className="text-neutral-500 font-sans text-[11px]">{t.railLabel}</span>
                      <span className="font-semibold text-neutral-800 text-xs">{paymentRail}</span>
                    </div>
                    {slipRef && (
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60">
                        <span className="text-neutral-500 font-sans text-[11px]">
                          {isArabic ? "ملاحظة / مرجع:" : lang === "en" ? "Ref / Note:" : "Réf / Note :"}
                        </span>
                        <span className="text-neutral-700 text-xs truncate max-w-[180px]">{slipRef}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 font-sans">
                      <span className="text-neutral-500 text-[11px]">
                        {isArabic ? "الحالة:" : lang === "en" ? "Status:" : "Statut :"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {t.pendingReview}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular Top-Up Details & Submission Form */
                <>
                  <p className="text-neutral-600 leading-normal">{t.desc}</p>

                  {/* Account Details Box */}
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-3 font-mono">
                    {/* BaridiMob RIP */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                      <span className="text-neutral-500 font-sans text-[11px] shrink-0">
                        {t.ripLabel}
                      </span>
                      <div className="flex items-center justify-between sm:justify-end gap-1.5 min-w-0">
                        <span dir="ltr" className="font-bold text-neutral-900 text-xs truncate">
                          00799999002194829345
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy("00799999002194829345", "rip")}
                          className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-200/60 transition-colors shrink-0 cursor-pointer"
                          data-testid="copy-rip-btn"
                          aria-label="Copier RIP"
                        >
                          {copiedKey === "rip" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CCP Account */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 pt-2.5 border-t border-neutral-200/60">
                      <span className="text-neutral-500 font-sans text-[11px] shrink-0">
                        {t.ccpLabel}
                      </span>
                      <div className="flex items-center justify-between sm:justify-end gap-1.5 min-w-0">
                        <span dir="ltr" className="font-bold text-neutral-900 text-xs truncate">
                          0021948293 Clé 45
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy("0021948293 Clé 45", "ccp")}
                          className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-200/60 transition-colors shrink-0 cursor-pointer"
                          data-testid="copy-ccp-btn"
                          aria-label="Copier CCP"
                        >
                          {copiedKey === "ccp" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* BNA Bank */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 pt-2.5 border-t border-neutral-200/60">
                      <span className="text-neutral-500 font-sans text-[11px] shrink-0">
                        {t.bankLabel}
                      </span>
                      <span dir="ltr" className="font-bold text-neutral-900 text-xs truncate">
                        00100 02103 0000123456 78
                      </span>
                    </div>

                    {/* Holder */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 pt-2.5 border-t border-neutral-200/60 font-sans">
                      <span className="text-neutral-500 text-[11px] shrink-0">
                        {t.holderLabel}
                      </span>
                      <span className="font-semibold text-neutral-900 text-xs truncate">
                        {t.holderVal}
                      </span>
                    </div>
                  </div>

                  {/* Verification note */}
                  <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-xl text-purple-900 text-[11px] flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="font-semibold">{t.instructionsTitle}</strong>{" "}
                      {t.instructionsDesc}
                    </div>
                  </div>

                  {/* Receipt Slip Uploader Card */}
                  <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-200/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-purple-700 shrink-0" />
                      <span className="font-bold text-neutral-900 text-xs">
                        {t.uploadSlipTitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 leading-normal">
                      {t.uploadSlipDesc}
                    </p>

                    {uploadError && (
                      <div
                        role="alert"
                        className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2"
                        data-testid="receipt-slip-error-banner"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {/* Amount & Quick Chips */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-neutral-700">
                          {t.amountLabel}
                        </label>
                        <span className="text-[10px] text-neutral-400 font-mono">{t.minAmount}</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                          data-testid="receipt-slip-amount-input"
                          className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-neutral-200 bg-white placeholder:text-neutral-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                          placeholder="10000"
                        />
                        <span className="absolute end-3 top-2 text-[10px] font-bold text-neutral-400 font-mono pointer-events-none">
                          DZD
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {["5000", "10000", "25000", "50000"].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAmount(preset)}
                            data-testid={`preset-amount-${preset}`}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                              amount === preset
                                ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                            }`}
                          >
                            {Number(preset).toLocaleString()} DA
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Rail Selector */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-700">
                        {t.railLabel}
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: "BARIDIMOB" as DepositPaymentRail, label: "BaridiMob" },
                          { id: "CCP" as DepositPaymentRail, label: "CCP Postal" },
                          { id: "BNA" as DepositPaymentRail, label: "BNA Banque" },
                        ].map((rail) => (
                          <button
                            key={rail.id}
                            type="button"
                            onClick={() => setPaymentRail(rail.id)}
                            className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                              paymentRail === rail.id
                                ? "bg-purple-100/80 text-purple-900 border-purple-400 font-bold shadow-2xs"
                                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                            }`}
                          >
                            {rail.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      data-testid="receipt-slip-file-input"
                      onChange={handleFileChange}
                    />

                    {/* File Picker & Thumbnail Preview Box */}
                    {selectedFile ? (
                      <div className="p-3 bg-white border border-purple-300 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {previewThumbnail ? (
                            <img
                              src={previewThumbnail}
                              alt="Receipt preview"
                              className="w-12 h-12 rounded-lg object-cover border border-purple-200 shrink-0 bg-neutral-100"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-neutral-900 truncate block">
                              {selectedFile.name}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">
                              {(selectedFile.size / 1024).toFixed(0)} KB •{" "}
                              <span className="text-emerald-700 font-medium">
                                {isArabic ? "جاهز للإرسال" : lang === "en" ? "Ready to transmit" : "Prêt pour transmission"}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2 py-1 rounded-lg text-[11px] font-medium text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                          >
                            {t.changeFile}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={t.removeFile}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-3.5 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl bg-white hover:bg-purple-50/50 transition-all text-center text-xs text-purple-800 font-medium cursor-pointer flex flex-col items-center justify-center gap-1 group shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-purple-900 group-hover:scale-102 transition-transform">
                          <UploadCloud className="w-4 h-4 text-purple-600" />
                          <span>{t.uploadSlipBtn}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-normal">
                          BaridiMob, CCP, BNA (JPG, PNG, PDF ≤ 10 MB)
                        </span>
                      </button>
                    )}

                    {/* Reference / Note Input */}
                    <input
                      type="text"
                      value={slipRef}
                      onChange={(e) => setSlipRef(e.target.value)}
                      placeholder={t.uploadSlipPlaceholder}
                      data-testid="receipt-slip-ref-input"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-200 bg-white placeholder:text-neutral-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                    />

                    {/* High-Visibility Submit Button (NEVER white-on-white) */}
                    <button
                      type="button"
                      disabled={!selectedFile || isUploading || Number(amount) < 1000}
                      onClick={handleUpload}
                      data-testid="submit-receipt-slip-btn"
                      className="w-full min-h-[42px] px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-700 hover:bg-purple-800 active:scale-[0.98] transition-all shadow-md shadow-purple-700/25 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>{t.uploadSlipSubmitting}</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-white" />
                          <span>{t.uploadSlipSubmit}</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Pinned Footer (Always Grounded at Modal Bottom) */}
            <div className="shrink-0 p-3.5 sm:p-4 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                data-testid="close-topup-modal-btn"
                className="min-h-[38px] px-5 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-200/90 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
