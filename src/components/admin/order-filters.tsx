"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Language } from "@/lib/locales";
import { Search, Filter, RotateCcw } from "lucide-react";
import { AdminOrderQuery } from "@/lib/api-client";

interface OrderFiltersProps {
  filters: AdminOrderQuery;
  onChange: (filters: AdminOrderQuery) => void;
  onReset: () => void;
  lang: Language;
}

export function OrderFilters({ filters, onChange, onReset, lang }: OrderFiltersProps) {
  const isArabic = lang === "ar";

  const handleInputChange = (field: keyof AdminOrderQuery, value: any) => {
    onChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/80 shadow-xs space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            {isArabic ? "بحث (الاسم، الهاتف، المعرف)" : "Recherche (Client, Tél, ID)"}
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={isArabic ? "بحث..." : "Rechercher..."}
              value={filters.search || ""}
              onChange={(e) => handleInputChange("search", e.target.value)}
              className="w-full ps-9 pe-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all font-mono"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            {isArabic ? "الحالة" : "Statut"}
          </label>
          <select
            value={filters.status || "ALL"}
            onChange={(e) => handleInputChange("status", e.target.value === "ALL" ? undefined : e.target.value)}
            className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
          >
            <option value="ALL">{isArabic ? "جميع الحالات" : "Tous les statuts"}</option>
            <option value="lead_generated">{isArabic ? "طلب جديد (Lead)" : "Lead Généré"}</option>
            <option value="supplier_confirmed">{isArabic ? "مؤكد من المورد" : "Confirmé Fournisseur"}</option>
            <option value="dispatched">{isArabic ? "تم الشحن" : "Expédié (Dispatched)"}</option>
            <option value="in_transit">{isArabic ? "قيد التوصيل" : "En Transit (Yalidine)"}</option>
            <option value="delivered">{isArabic ? "تم التسليم (Delivered)" : "Livré (Delivered)"}</option>
            <option value="rto_in_transit">{isArabic ? "مرتجع في الطريق" : "Retour en Transit (RTO)"}</option>
            <option value="returned_to_supplier">{isArabic ? "مسترجع للمورد" : "Retourné au Fournisseur"}</option>
            <option value="canceled">{isArabic ? "ملغى" : "Annulé (Canceled)"}</option>
          </select>
        </div>

        {/* Tracking Number */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            {isArabic ? "رقم التتبع (Yalidine)" : "N° de Suivi Yalidine"}
          </label>
          <input
            type="text"
            placeholder="e.g. YAL-849204"
            value={filters.trackingNumber || ""}
            onChange={(e) => handleInputChange("trackingNumber", e.target.value)}
            className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all font-mono"
          />
        </div>

        {/* Wilaya */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            {isArabic ? "الولاية (1 - 58)" : "Wilaya (1 - 58)"}
          </label>
          <select
            value={filters.wilaya || ""}
            onChange={(e) => handleInputChange("wilaya", e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all font-mono"
          >
            <option value="">{isArabic ? "جميع الولايات" : "Toutes les wilayas"}</option>
            {Array.from({ length: 58 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                {w < 10 ? `0${w}` : w}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {isArabic ? "إعادة تعيين" : "Réinitialiser"}
        </Button>
      </div>
    </div>
  );
}
