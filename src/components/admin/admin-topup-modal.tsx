"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModernSelect } from "@/components/ui/modern-select";
import { Language } from "@/lib/locales";
import { formatDZD } from "@/lib/formatters";
import { apiAdminTopUpSupplier } from "@/lib/api-client";
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  FileText,
  DollarSign,
  User,
  Sparkles,
} from "lucide-react";

export interface AdminTopUpSupplierInfo {
  id: string;
  fullName?: string | null;
  email: string;
  phone?: string | null;
  balance?: number;
}

interface AdminTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number, supplierId: string) => void;
  supplier?: AdminTopUpSupplierInfo | null;
  suppliersList?: AdminTopUpSupplierInfo[];
  lang?: Language;
}

const PRESET_AMOUNTS = [10000, 25000, 50000, 100000];

const modalTranslations = {
  fr: {
    title: "Recharger le Compte Fournisseur",
    subtitle: "Séquestre Prépayé & Trésorerie ViteDrop",
    desc: "Créditez le compte séquestre après vérification du reçu bancaire ou postal (CCP / BaridiMob).",
    selectSupplierLabel: "Sélectionner le Fournisseur :",
    selectSupplierPlaceholder: "Rechercher un fournisseur...",
    noSupplierSelected: "Veuillez sélectionner un fournisseur",
    currentBalanceLabel: "Solde Actuel :",
    projectedBalanceLabel: "Solde Projeté :",
    amountLabel: "Montant à créditer (DZD) :",
    amountPlaceholder: "Ex: 50 000",
    minAmountNotice: "Montant minimum : 1 000 DZD",
    presetAmountsLabel: "Montants Fréquents :",
    paymentRailLabel: "Canal de Paiement :",
    rails: {
      CCP: "CCP Algérie Poste",
      BARIDIMOB: "BaridiMob (RIP)",
      BNA: "Virement Bancaire (BNA)",
    },
    refLabel: "N° de Référence / Bordereau :",
    refPlaceholder: "Ex: CCP-REC-948210 ou BMOB-00821",
    noteLabel: "Note d'Audit Interne (Optionnelle) :",
    notePlaceholder: "Ex: Reçu visé au bureau de poste Didouche Mourad",
    summaryTitle: "Aperçu de la Transaction :",
    summaryCredit: "Crédit au compte :",
    summaryNewBalance: "Nouveau solde disponible :",
    btnCancel: "Annuler",
    btnSubmit: "Valider le Rechargement",
    submitting: "Crédit en cours...",
    errSupplierRequired: "Veuillez sélectionner un fournisseur valide",
    errAmountInvalid: "Le montant minimum de rechargement est de 1 000 DZD",
    errRefRequired: "La référence du versement ou bordereau est obligatoire",
    errGeneric: "Une erreur est survenue lors du rechargement",
  },
  en: {
    title: "Top-Up Supplier Account",
    subtitle: "Prepaid Escrow & ViteDrop Treasury",
    desc: "Credit the supplier prepaid escrow reserve after verifying wire receipt (CCP / BaridiMob / Bank).",
    selectSupplierLabel: "Select Supplier:",
    selectSupplierPlaceholder: "Search for a supplier...",
    noSupplierSelected: "Please select a supplier",
    currentBalanceLabel: "Current Balance:",
    projectedBalanceLabel: "Projected Balance:",
    amountLabel: "Amount to credit (DZD):",
    amountPlaceholder: "e.g. 50,000",
    minAmountNotice: "Minimum deposit: 1,000 DZD",
    presetAmountsLabel: "Quick Presets:",
    paymentRailLabel: "Payment Rail:",
    rails: {
      CCP: "Algeria Post CCP",
      BARIDIMOB: "BaridiMob (RIP)",
      BNA: "Bank Wire (BNA)",
    },
    refLabel: "Payment Reference / Receipt ID:",
    refPlaceholder: "e.g. CCP-REC-948210 or BMOB-00821",
    noteLabel: "Internal Audit Memo (Optional):",
    notePlaceholder: "e.g. Wire slip verified at Didouche Mourad branch",
    summaryTitle: "Transaction Preview:",
    summaryCredit: "Credit to reserve:",
    summaryNewBalance: "Projected new balance:",
    btnCancel: "Cancel",
    btnSubmit: "Confirm Top-Up",
    submitting: "Processing deposit...",
    errSupplierRequired: "Please select a valid supplier",
    errAmountInvalid: "Minimum top-up amount is 1,000 DZD",
    errRefRequired: "Payment reference / deposit slip ID is required",
    errGeneric: "An error occurred while processing the top-up",
  },
  ar: {
    title: "شحن رصيد حساب المورد",
    subtitle: "حساب الضمان المالي المسبق وخزينة فايت دروب",
    desc: "إضافة رصيد إلى حساب الضمان المالي للمورد بعد التحقق من وصل الدفع البريدي أو البنكي.",
    selectSupplierLabel: "اختر المورد:",
    selectSupplierPlaceholder: "البحث عن مورد...",
    noSupplierSelected: "يرجى اختيار مورد",
    currentBalanceLabel: "الرصيد الحالي:",
    projectedBalanceLabel: "الرصيد بعد الشحن:",
    amountLabel: "المبلغ المراد شحنه (د.ج):",
    amountPlaceholder: "مثال: 50000",
    minAmountNotice: "الحد الأدنى للشحن: 1,000 د.ج",
    presetAmountsLabel: "مبالغ شائعة:",
    paymentRailLabel: "قناة الدفع:",
    rails: {
      CCP: "بريد الجزائر (CCP)",
      BARIDIMOB: "بريدي موب (RIP)",
      BNA: "تحويل بنكي (BNA)",
    },
    refLabel: "رقم وصل التحويل / المرجع:",
    refPlaceholder: "مثال: CCP-REC-948210 أو BMOB-00821",
    noteLabel: "ملاحظة تدقيق داخلية (اختياري):",
    notePlaceholder: "مثال: تم التأكد من الوصل في مكتب بريد ديدوش مراد",
    summaryTitle: "ملخص العملية:",
    summaryCredit: "المبلغ المضاف:",
    summaryNewBalance: "الرصيد الجديد المتوقع:",
    btnCancel: "إلغاء",
    btnSubmit: "تأكيد شحن الرصيد",
    submitting: "جارٍ الشحن...",
    errSupplierRequired: "يرجى اختيار مورد صالح",
    errAmountInvalid: "الحد الأدنى للشحن هو 1,000 د.ج",
    errRefRequired: "رقم مرجع التحويل أو وصل الدفع إلزامي",
    errGeneric: "حدث خطأ أثناء تنفيذ عملية الشحن",
  },
};

export function AdminTopUpModal({
  isOpen,
  onClose,
  onSuccess,
  supplier = null,
  suppliersList = [],
  lang = "fr",
}: AdminTopUpModalProps) {
  const currentLang = lang === "ar" || lang === "en" || lang === "fr" ? lang : "fr";
  const tr = modalTranslations[currentLang];
  const isAr = currentLang === "ar";

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentRail, setPaymentRail] = useState<"CCP" | "BARIDIMOB" | "BNA">("CCP");
  const [referenceId, setReferenceId] = useState<string>("");
  const [adminNote, setAdminNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const wasOpenRef = useRef(false);

  // Reset inputs ONLY when modal first transitions from closed to open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setAmount("");
      setReferenceId("");
      setAdminNote("");
      setError(null);
      if (supplier) {
        setSelectedSupplierId(supplier.id);
      } else if (suppliersList.length > 0) {
        setSelectedSupplierId(suppliersList[0].id);
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Synchronize selected supplier safely without resetting user-typed inputs
  useEffect(() => {
    if (supplier) {
      setSelectedSupplierId(supplier.id);
    } else if (suppliersList.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(suppliersList[0].id);
    }
  }, [supplier, suppliersList, selectedSupplierId]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Find active supplier details
  const activeSupplier = useMemo(() => {
    if (supplier) return supplier;
    return suppliersList.find((s) => s.id === selectedSupplierId) || null;
  }, [supplier, suppliersList, selectedSupplierId]);

  const currentBalance = activeSupplier?.balance ?? 0;
  const parsedAmount = Math.max(0, parseInt(amount.replace(/\D/g, ""), 10) || 0);
  const projectedBalance = currentBalance + parsedAmount;

  // Options for ModernSelect if in picker mode
  const supplierSelectOptions = useMemo(() => {
    return suppliersList.map((s) => ({
      value: s.id,
      label: s.fullName || s.email,
      secondaryLabel: s.email,
      badge: formatDZD(s.balance ?? 0, lang),
      badgeColor: "bg-purple-100 text-purple-800",
    }));
  }, [suppliersList, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetSupplierId = activeSupplier?.id;
    if (!targetSupplierId) {
      setError(tr.errSupplierRequired);
      return;
    }

    if (parsedAmount < 1000) {
      setError(tr.errAmountInvalid);
      return;
    }

    if (!referenceId.trim()) {
      setError(tr.errRefRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      const fullReference = adminNote.trim()
        ? `${paymentRail}: ${referenceId.trim()} (${adminNote.trim()})`
        : `${paymentRail}: ${referenceId.trim()}`;

      const res = await apiAdminTopUpSupplier(
        targetSupplierId,
        parsedAmount,
        fullReference
      );

      onSuccess(res.balance, targetSupplierId);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tr.errGeneric;
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 [overscroll-behavior:contain]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !isSubmitting && onClose()}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs [overscroll-behavior:contain]"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-topup-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
            className="relative z-10 w-full max-w-lg bg-[#f8f7f4] border border-[#e7e5df] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[min(92vh,calc(100dvh-2rem))] [overscroll-behavior:contain]"
            data-testid="admin-topup-modal"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-white border-b border-[#e7e5df] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-700 shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2
                      id="admin-topup-title"
                      className="text-base font-semibold text-neutral-900 truncate"
                    >
                      {tr.title}
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      <Sparkles className="w-2.5 h-2.5" />
                      Treasury
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 truncate">{tr.subtitle}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors shrink-0"
                aria-label={tr.btnCancel}
                data-testid="close-topup-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Error Banner */}
              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"
                  data-testid="topup-error-banner"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{error}</span>
                </div>
              )}

              {/* Supplier Selection or Locked Card */}
              {supplier ? (
                <div className="p-3.5 rounded-xl bg-white border border-[#e7e5df] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      <span>{isAr ? "المورد المحدد" : lang === "en" ? "Selected Supplier" : "Fournisseur sélectionné"}</span>
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">
                      ID: <span dir="ltr">{supplier.id.slice(0, 8)}...</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-neutral-900">
                        {supplier.fullName || supplier.email}
                      </div>
                      <div className="text-xs text-neutral-500 font-mono" dir="ltr">
                        {supplier.email}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                        {tr.currentBalanceLabel}
                      </div>
                      <div className="font-mono text-sm font-bold text-purple-700">
                        {formatDZD(currentBalance, lang)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-800">
                    {tr.selectSupplierLabel}
                  </label>
                  <ModernSelect
                    value={selectedSupplierId}
                    onChange={(val) => setSelectedSupplierId(val)}
                    options={supplierSelectOptions}
                    placeholder={tr.selectSupplierPlaceholder}
                    searchable={true}
                    data-testid="supplier-select-dropdown"
                  />
                  {activeSupplier && (
                    <div className="mt-1 text-xs text-neutral-500 flex items-center justify-between px-1">
                      <span>{tr.currentBalanceLabel}</span>
                      <span className="font-mono font-bold text-neutral-900">
                        {formatDZD(currentBalance, lang)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Amount Input & Preset Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="topup-amount"
                    className="block text-xs font-semibold text-neutral-800"
                  >
                    {tr.amountLabel}
                  </label>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {tr.minAmountNotice}
                  </span>
                </div>

                <div className="relative">
                  <Input
                    id="topup-amount"
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setAmount(val);
                    }}
                    placeholder={tr.amountPlaceholder}
                    className="h-11 text-base font-mono font-semibold pl-3 pr-16 bg-white border-[#dcdad4] focus:border-purple-600 focus:ring-purple-600/20"
                    data-testid="topup-amount-input"
                    autoComplete="off"
                    required
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-xs font-bold text-neutral-400 font-mono">
                    DZD
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-[11px] text-neutral-500 font-medium mr-1">
                    {tr.presetAmountsLabel}
                  </span>
                  {PRESET_AMOUNTS.map((amt) => {
                    const isSelected = parsedAmount === amt;
                    return (
                      <motion.button
                        key={amt}
                        type="button"
                        whileTap={{ scale: 0.985 }}
                        onClick={() => setAmount(String(amt))}
                        className={`text-xs px-2.5 py-1 rounded-lg font-mono font-semibold transition-all border ${
                          isSelected
                            ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                            : "bg-white text-neutral-700 border-[#e7e5df] hover:border-purple-300 hover:bg-purple-50/50"
                        }`}
                        data-testid={`preset-amount-${amt}`}
                      >
                        +{amt.toLocaleString("fr-FR")} DA
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Rail Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-800">
                  {tr.paymentRailLabel}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: "CCP", label: tr.rails.CCP, tag: "Algérie Poste" },
                      { key: "BARIDIMOB", label: tr.rails.BARIDIMOB, tag: "Instantané" },
                      { key: "BNA", label: tr.rails.BNA, tag: "Virement" },
                    ] as const
                  ).map((rail) => {
                    const isSelected = paymentRail === rail.key;
                    return (
                      <button
                        key={rail.key}
                        type="button"
                        onClick={() => setPaymentRail(rail.key)}
                        className={`p-2.5 rounded-xl border text-start transition-all ${
                          isSelected
                            ? "bg-white border-purple-600 ring-2 ring-purple-600/10 shadow-2xs"
                            : "bg-white/80 border-[#e7e5df] hover:border-neutral-300"
                        }`}
                        data-testid={`payment-rail-${rail.key.toLowerCase()}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                              isSelected
                                ? "bg-purple-100 text-purple-700"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {rail.key}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-neutral-900 truncate">
                          {rail.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Reference ID (Required) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="topup-reference"
                    className="block text-xs font-semibold text-neutral-800"
                  >
                    {tr.refLabel}
                  </label>
                  <span className="text-[10px] font-semibold text-rose-600 uppercase">
                    {isAr ? "إلزامي" : "Requis"}
                  </span>
                </div>
                <Input
                  id="topup-reference"
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder={tr.refPlaceholder}
                  className="h-10 text-xs font-mono bg-white border-[#dcdad4] focus:border-purple-600 focus:ring-purple-600/20"
                  data-testid="topup-reference-input"
                  required
                />
              </div>

              {/* Internal Audit Note (Optional) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="topup-note"
                  className="block text-xs font-semibold text-neutral-800"
                >
                  {tr.noteLabel}
                </label>
                <Input
                  id="topup-note"
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={tr.notePlaceholder}
                  className="h-10 text-xs bg-white border-[#dcdad4] focus:border-purple-600 focus:ring-purple-600/20"
                  data-testid="topup-note-input"
                />
              </div>

              {/* Summary / Projected Solvency Callout */}
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-purple-900 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                    <span>{tr.summaryTitle}</span>
                  </span>
                  <span className="text-[11px] font-mono text-purple-700">
                    +{formatDZD(parsedAmount, lang)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-purple-200/50 text-xs">
                  <div>
                    <span className="text-[11px] text-purple-700/80 block">
                      {tr.currentBalanceLabel}
                    </span>
                    <span className="font-mono font-semibold text-neutral-700">
                      {formatDZD(currentBalance, lang)}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="text-[11px] text-purple-700/80 block">
                      {tr.summaryNewBalance}
                    </span>
                    <span
                      className="font-mono font-bold text-sm text-purple-900"
                      data-testid="topup-projected-balance"
                    >
                      {formatDZD(projectedBalance, lang)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="text-xs h-9 px-4 rounded-xl font-medium"
                >
                  {tr.btnCancel}
                </Button>

                <motion.div whileTap={{ scale: 0.985 }}>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || parsedAmount < 1000 || !referenceId.trim()}
                    className="text-xs h-9 px-4 rounded-xl font-semibold bg-purple-700 hover:bg-purple-800 text-white shadow-2xs flex items-center gap-1.5"
                    data-testid="confirm-topup-submit-btn"
                  >
                    {isSubmitting ? (
                      <span>{tr.submitting}</span>
                    ) : (
                      <>
                        <Wallet className="w-3.5 h-3.5" />
                        <span>{tr.btnSubmit}</span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
