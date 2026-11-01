"use client";

import React from "react";
import { Language } from "@/lib/locales";
import { getWilayaDeliveryIntelligence } from "@/lib/algeria-locations";
import { Building, Truck, Info } from "lucide-react";

interface WilayaDeliveryIntelBadgeProps {
  wilaya: string | number;
  lang?: Language;
  showAdvice?: boolean;
  className?: string;
  testId?: string;
}

export function WilayaDeliveryIntelBadge({
  wilaya,
  lang = "fr",
  showAdvice = false,
  className = "",
  testId = "wilaya-delivery-intel-badge",
}: WilayaDeliveryIntelBadgeProps) {
  const intel = getWilayaDeliveryIntelligence(wilaya);
  const isAr = lang === "ar";
  const label = isAr ? intel.labelAr : lang === "en" ? intel.labelEn : intel.labelFr;
  const advice = isAr ? intel.adviceAr : lang === "en" ? intel.adviceEn : intel.adviceFr;

  const colorStyles =
    intel.tier === "high_density"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200/70"
      : intel.tier === "stop_desk_recommended"
      ? "bg-amber-50 text-amber-900 border-amber-200/80"
      : "bg-sky-50 text-sky-800 border-sky-200/60";

  const IconComponent = intel.tier === "stop_desk_recommended" ? Building : Truck;

  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      <span
        data-testid={testId}
        title={advice}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border font-mono tracking-tight shrink-0 transition-colors ${colorStyles}`}
      >
        <IconComponent className="w-2.5 h-2.5 shrink-0" />
        <span>{label}</span>
      </span>
      {showAdvice && (
        <span
          data-testid={`${testId}-advice`}
          className="text-[10px] text-neutral-500 font-sans italic flex items-center gap-1 mt-0.5"
        >
          <Info className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
          <span>{advice}</span>
        </span>
      )}
    </div>
  );
}
