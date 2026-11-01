"use client";

import React from "react";
import { AdminProductItem } from "@/lib/api-client";
import { formatDZD } from "@/lib/formatters";
import { Language } from "@/lib/locales";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Scale,
  Percent,
  TrendingUp,
  PackageCheck,
} from "lucide-react";

interface ProductSolvencyCardProps {
  product: AdminProductItem;
  lang: Language;
}

export function ProductSolvencyCard({ product, lang }: ProductSolvencyCardProps) {
  const isArabic = lang === "ar";

  // Invariant 1: Escrow Solvency Buffer (Wallet balance covers >= 5x CPA)
  const bufferRequired = product.supplierTotalCpa * 5;
  const isEscrowBufferValid =
    product.escrowCoverage !== undefined ? product.escrowCoverage >= 5 : true;

  // Invariant 2: CPA Floor >= 500 DZD
  const isCpaFloorValid = product.supplierTotalCpa >= 500;

  // Invariant 3: CPA Margin Cap <= 50% of retail price
  const marginRatio =
    product.retailPrice > 0
      ? (product.supplierTotalCpa / product.retailPrice) * 100
      : 100;
  const isMarginValid = product.supplierTotalCpa <= product.retailPrice * 0.5;

  // Invariant 4: Retail price strictly greater than CPA
  const isRetailIntegrityValid = product.retailPrice > product.supplierTotalCpa;

  // Invariant 5: Initial inventory threshold >= 20 units
  const isStockThresholdValid = product.stock >= 20;

  const validCount = [
    isEscrowBufferValid,
    isCpaFloorValid,
    isMarginValid,
    isRetailIntegrityValid,
    isStockThresholdValid,
  ].filter(Boolean).length;

  const allPassed = validCount === 5;

  return (
    <div className="bg-white rounded-2xl border border-[#e7e5df] p-4 sm:p-5 lg:p-6 shadow-xs text-start space-y-4">
      {/* Header & Overall Posture */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#064e3b]" />
            <span>
              {isArabic
                ? "تدقيق معايير الملاءة والضمان (5 Invariants d'Escrow)"
                : "Audit de Solvabilité Escrow & Invariants (5 Règles)"}
            </span>
          </h3>
          <p className="text-xs text-[#6b6b6b] mt-0.5">
            {isArabic
              ? "التحقق التلقائي من أهلية المنتج للتداول وفق شروط شبكة ViteDrop COD"
              : "Vérification automatisée de solvabilité financière et de couverture de stock"}
          </p>
        </div>

        <div>
          {allPassed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {isArabic
                  ? "معايير الضمان مستوفاة (5/5)"
                  : "Solvabilité Validée (5/5 Invariants)"}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {isArabic
                  ? `تنبيه ملاءة (${validCount}/5 مستوفاة)`
                  : `Alerte Invariant (${validCount}/5 conformes)`}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Grid of the 5 Solvency Invariants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Invariant 1: Escrow Buffer (5x CPA) */}
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-neutral-500" />
              <span>{isArabic ? "1. احتياطي الضمان (5x CPA)" : "1. Buffer Escrow (5x CPA)"}</span>
            </span>
            {isEscrowBufferValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
          </div>
          <div className="font-mono text-neutral-900 font-bold">
            Min: {formatDZD(bufferRequired, lang)}
          </div>
          <p className="text-[11px] text-neutral-500">
            {isArabic
              ? "رصيد المورد يغطي 5 أضعاف عمولة CPA مسبقاً"
              : "Le solde prépayé du fournisseur couvre au moins 5x le CPA"}
          </p>
        </div>

        {/* Invariant 2: CPA Floor >= 500 DZD */}
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-neutral-500" />
              <span>{isArabic ? "2. الحد الأدنى للعمولة (Floor)" : "2. Plancher CPA (≥ 500 DZD)"}</span>
            </span>
            {isCpaFloorValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
          </div>
          <div className="font-mono text-neutral-900 font-bold">
            Actuel: {formatDZD(product.supplierTotalCpa, lang)} (≥ 500 DZD)
          </div>
          <p className="text-[11px] text-neutral-500">
            {isArabic
              ? "الحد الأدنى الإجباري لعمولة CPA هو 500 دج"
              : "Le CPA brut minimum garanti aux affiliés est de 500 DZD"}
          </p>
        </div>

        {/* Invariant 3: CPA Margin Cap <= 50% */}
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-neutral-500" />
              <span>{isArabic ? "3. سقف هامش CPA (≤ 50%)" : "3. Plafond Marge CPA (≤ 50%)"}</span>
            </span>
            {isMarginValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
          </div>
          <div className="font-mono text-neutral-900 font-bold">
            Ratio: {marginRatio.toFixed(1)}% / 50.0% max
          </div>
          <p className="text-[11px] text-neutral-500">
            {isArabic
              ? "ميزانية CPA لا يمكن أن تتجاوز 50% من سعر بيع المنتج"
              : "Le budget CPA ne peut excéder 50% du prix de vente public"}
          </p>
        </div>

        {/* Invariant 4: Retail Price > CPA */}
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-neutral-500" />
              <span>{isArabic ? "4. سلامة سعر التجزئة" : "4. Intégrité Prix Public (> CPA)"}</span>
            </span>
            {isRetailIntegrityValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
          </div>
          <div className="font-mono text-neutral-900 font-bold">
            {formatDZD(product.retailPrice, lang)} &gt; {formatDZD(product.supplierTotalCpa, lang)}
          </div>
          <p className="text-[11px] text-neutral-500">
            {isArabic
              ? "سعر البيع للجمهور أعلى دائماً من عمولة التسويق"
              : "Le prix public dépasse strictement la commission allouée"}
          </p>
        </div>

        {/* Invariant 5: Inventory Minimum Buffer >= 20 units */}
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-neutral-500" />
              <span>{isArabic ? "5. عتبة المخزون الأولي (≥ 20)" : "5. Stock Initial (≥ 20 unités)"}</span>
            </span>
            {isStockThresholdValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
          </div>
          <div className="font-mono text-neutral-900 font-bold">
            Stock: {product.stock} unités (seuil: 20)
          </div>
          <p className="text-[11px] text-neutral-500">
            {isArabic
              ? "مخزون لا يقل عن 20 قطعة لضمان استمرارية حملات المسوقين"
              : "Minimum de 20 unités physiques pour absorber le volume des médias buyers"}
          </p>
        </div>
      </div>
    </div>
  );
}
