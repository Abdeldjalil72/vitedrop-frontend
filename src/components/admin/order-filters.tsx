"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Language } from "@/lib/locales";
import {
  Search,
  Filter,
  RotateCcw,
  MapPin,
  Truck,
  Layers,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { AdminOrderQuery } from "@/lib/api-client";
import { ALGERIA_WILAYAS } from "@/lib/algeria-locations";
import { ModernSelect, ModernSelectOption } from "@/components/ui/modern-select";

interface OrderFiltersProps {
  filters: AdminOrderQuery;
  onChange: (filters: AdminOrderQuery) => void;
  onReset: () => void;
  lang: Language;
}

const filterTranslations = {
  fr: {
    title: "Filtres Opérationnels",
    activeFilters: (n: number) => `${n} ${n > 1 ? "filtres actifs" : "filtre actif"}`,
    reset: "Réinitialiser",
    searchLabel: "Recherche Client / Tél / ID",
    searchPlaceholder: "Client, tél, ID...",
    statusLabel: "Statut de la Commande",
    statusPlaceholder: "Filtrer par statut...",
    trackingLabel: "N° de Suivi Yalidine",
    trackingPlaceholder: "ex: YAL-849204",
    wilayaLabel: "Wilaya de Livraison",
    wilayaPlaceholder: "Sélectionner une wilaya...",
    wilayaSearchPlaceholder: "Rechercher wilaya (ex: 16, Alger)...",
    allStatuses: "Tous les statuts",
    allWilayas: "Toutes les wilayas (58)",
    activeFiltersLabel: "Filtres Appliqués :",
  },
  en: {
    title: "Operational Filters",
    activeFilters: (n: number) => `${n} active ${n > 1 ? "filters" : "filter"}`,
    reset: "Reset Filters",
    searchLabel: "Search Customer / Phone / ID",
    searchPlaceholder: "Customer, phone, ID...",
    statusLabel: "Order Lifecycle Status",
    statusPlaceholder: "Filter by status...",
    trackingLabel: "Yalidine Tracking #",
    trackingPlaceholder: "e.g. YAL-849204",
    wilayaLabel: "Delivery Wilaya",
    wilayaPlaceholder: "Select wilaya...",
    wilayaSearchPlaceholder: "Search wilaya (e.g. 16, Algiers)...",
    allStatuses: "All Statuses",
    allWilayas: "All Wilayas (58)",
    activeFiltersLabel: "Active Filters:",
  },
  ar: {
    title: "فلاتر العمليات",
    activeFilters: (n: number) => `${n} ${n > 1 ? "فلاتر نشطة" : "فلتر نشط"}`,
    reset: "إعادة تعيين",
    searchLabel: "البحث (العميل، الهاتف، المعرف)",
    searchPlaceholder: "العميل، الهاتف، المعرف...",
    statusLabel: "حالة الطلبية",
    statusPlaceholder: "تصفية بالحالة...",
    trackingLabel: "رقم التتبع (Yalidine)",
    trackingPlaceholder: "مثلاً: YAL-849204",
    wilayaLabel: "ولاية التوصيل",
    wilayaPlaceholder: "اختر الولاية...",
    wilayaSearchPlaceholder: "ابحث بالاسم أو الرقم (16، الجزائر)...",
    allStatuses: "جميع الحالات",
    allWilayas: "جميع الولايات (58)",
    activeFiltersLabel: "الفلاتر النشطة:",
  },
};

export function OrderFilters({ filters, onChange, onReset, lang }: OrderFiltersProps) {
  const isArabic = lang === "ar";
  const isEnglish = lang === "en";
  const currentLang = (lang === "ar" || lang === "en" || lang === "fr") ? lang : "fr";
  const t = filterTranslations[currentLang] || filterTranslations.fr;

  const handleInputChange = (field: keyof AdminOrderQuery, value: any) => {
    onChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const handleStatusChange = (val: string) => {
    handleInputChange("status", val === "ALL" ? undefined : val);
  };

  const handleWilayaChange = (val: string) => {
    handleInputChange("wilaya", val === "ALL" || !val ? undefined : Number(val));
  };

  // Status options formatted for ModernSelect
  const statusOptions: ModernSelectOption[] = useMemo(
    () => [
      {
        value: "ALL",
        label: t.allStatuses,
        badge: "ALL",
        badgeColor: "bg-neutral-100 text-neutral-700 border-neutral-200 font-mono",
        icon: <Layers className="w-3.5 h-3.5 text-neutral-500" />,
      },
      {
        value: "lead_generated",
        label: isArabic ? "طلب جديد (Lead)" : isEnglish ? "Lead Generated" : "Lead Généré",
        badge: "LEAD",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200 font-mono",
        icon: <div className="w-2 h-2 rounded-full bg-amber-500" />,
      },
      {
        value: "supplier_confirmed",
        label: isArabic ? "مؤكد من المورد" : isEnglish ? "Supplier Confirmed" : "Confirmé Fournisseur",
        badge: isArabic ? "مؤكد" : "CONFIRMED",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200 font-mono",
        icon: <div className="w-2 h-2 rounded-full bg-blue-500" />,
      },
      {
        value: "dispatched",
        label: isArabic ? "تم الشحن" : isEnglish ? "Dispatched" : "Expédié (Dispatched)",
        badge: isArabic ? "مشحون" : "EXPÉDIÉ",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200 font-mono",
        icon: <Truck className="w-3 h-3 text-purple-600" />,
      },
      {
        value: "in_transit",
        label: isArabic ? "قيد التوصيل (Yalidine)" : isEnglish ? "In Transit (Yalidine)" : "En Transit (Yalidine)",
        badge: isArabic ? "توصيل" : "TRANSIT",
        badgeColor: "bg-sky-50 text-sky-700 border-sky-200 font-mono",
        icon: <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />,
      },
      {
        value: "delivered",
        label: isArabic ? "تم التسليم (Delivered)" : isEnglish ? "Delivered" : "Livré (Delivered)",
        badge: isArabic ? "مستلم" : "DELIVERED",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 font-mono",
        icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
      },
      {
        value: "rto_in_transit",
        label: isArabic ? "مرتجع في الطريق (RTO)" : isEnglish ? "RTO In Transit" : "Retour en Transit (RTO)",
        badge: isArabic ? "مرتجع" : "RETOUR",
        badgeColor: "bg-orange-50 text-orange-700 border-orange-200 font-mono",
        icon: <div className="w-2 h-2 rounded-full bg-orange-500" />,
      },
      {
        value: "returned_to_supplier",
        label: isArabic ? "مسترجع للمورد" : isEnglish ? "Returned to Supplier" : "Retourné au Fournisseur",
        badge: isArabic ? "مسترجع" : "RESTITUÉ",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200 font-mono",
        icon: <div className="w-2 h-2 rounded-full bg-rose-500" />,
      },
      {
        value: "canceled",
        label: isArabic ? "ملغى (Canceled)" : isEnglish ? "Canceled" : "Annulé (Canceled)",
        badge: isArabic ? "ملغى" : "ANNULÉ",
        badgeColor: "bg-neutral-100 text-neutral-600 border-neutral-300 font-mono",
        icon: <XCircle className="w-3 h-3 text-neutral-400" />,
      },
    ],
    [isArabic, isEnglish, t.allStatuses]
  );

  // Wilaya options formatted for ModernSelect
  const wilayaOptions: ModernSelectOption[] = useMemo(
    () => [
      {
        value: "ALL",
        label: t.allWilayas,
        badge: "58",
        badgeColor: "bg-sky-50 text-sky-700 border-sky-200/80 font-mono",
        icon: <MapPin className="w-3.5 h-3.5 text-sky-600" />,
      },
      ...ALGERIA_WILAYAS.map((w) => ({
        value: String(parseInt(w.code, 10)),
        label: isArabic ? `${w.code} - ${w.nameAr}` : `${w.code} - ${w.name}`,
        secondaryLabel: isArabic ? w.name : w.nameAr,
        badge: `#${w.code}`,
        badgeColor: "bg-neutral-100 text-neutral-800 border-neutral-200/80 font-mono",
        icon: <MapPin className="w-3.5 h-3.5 text-neutral-400" />,
      })),
    ],
    [isArabic, t.allWilayas]
  );

  // Calculate active filters count
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.search && filters.search.trim()) count++;
    if (filters.status && filters.status !== "ALL") count++;
    if (filters.trackingNumber && filters.trackingNumber.trim()) count++;
    if (filters.wilaya) count++;
    return count;
  }, [filters]);

  // Selected wilaya display helper
  const selectedWilayaObj = useMemo(() => {
    if (!filters.wilaya) return null;
    return ALGERIA_WILAYAS.find((w) => parseInt(w.code, 10) === filters.wilaya);
  }, [filters.wilaya]);

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/[0.08] shadow-xs space-y-4 text-start">
      {/* Header bar: title, active count pill, reset button */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-black/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-black/[0.04] flex items-center justify-center text-neutral-600 shrink-0">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-neutral-900 tracking-tight">
            {t.title}
          </span>
          {activeCount > 0 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200"
              data-testid="active-filters-count-badge"
            >
              {t.activeFilters(activeCount)}
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-neutral-500 hover:text-rose-600 hover:bg-rose-50 h-8 px-2.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            data-testid="reset-order-filters-btn"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t.reset}</span>
          </Button>
        )}
      </div>

      {/* Grid of 4 Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Search */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-800 tracking-tight flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span>{t.searchLabel}</span>
          </label>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute start-3 pointer-events-none" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={filters.search || ""}
              onChange={(e) => handleInputChange("search", e.target.value)}
              className="w-full h-10 ps-9 pe-8 py-2 text-xs sm:text-sm bg-white border border-black/10 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 hover:border-black/25 transition-all font-mono"
              data-testid="admin-orders-search-input"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => handleInputChange("search", undefined)}
                className="absolute end-2.5 p-1 text-neutral-400 hover:text-black rounded-full cursor-pointer"
                title={t.reset}
                data-testid="clear-search-filter-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Modern Status Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-800 tracking-tight flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span>{t.statusLabel}</span>
          </label>
          <ModernSelect
            value={filters.status || "ALL"}
            onChange={handleStatusChange}
            options={statusOptions}
            placeholder={t.statusPlaceholder}
            icon={<Filter className="w-3.5 h-3.5 text-neutral-500" />}
            triggerClassName="h-10 px-3.5 rounded-xl bg-white hover:bg-neutral-50/50 border-black/10 text-xs sm:text-sm font-medium shadow-2xs"
            menuClassName="min-w-[260px]"
            align="start"
            data-testid="admin-orders-status-select"
            nativeSelectTestId="admin-orders-status-native-select"
          />
        </div>

        {/* 3. Tracking Number */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-800 tracking-tight flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-neutral-400" />
            <span>{t.trackingLabel}</span>
          </label>
          <div className="relative flex items-center">
            <Truck className="w-4 h-4 text-neutral-400 absolute start-3 pointer-events-none" />
            <input
              type="text"
              placeholder={t.trackingPlaceholder}
              value={filters.trackingNumber || ""}
              onChange={(e) => handleInputChange("trackingNumber", e.target.value)}
              className="w-full h-10 ps-9 pe-8 py-2 text-xs sm:text-sm bg-white border border-black/10 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 hover:border-black/25 transition-all font-mono uppercase"
              data-testid="admin-orders-tracking-input"
            />
            {filters.trackingNumber && (
              <button
                type="button"
                onClick={() => handleInputChange("trackingNumber", undefined)}
                className="absolute end-2.5 p-1 text-neutral-400 hover:text-black rounded-full cursor-pointer"
                title={t.reset}
                data-testid="clear-tracking-filter-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4. Modern Searchable Wilaya Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-800 tracking-tight flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>{t.wilayaLabel}</span>
          </label>
          <ModernSelect
            value={filters.wilaya ? String(filters.wilaya) : "ALL"}
            onChange={handleWilayaChange}
            options={wilayaOptions}
            placeholder={t.wilayaPlaceholder}
            searchable={true}
            searchPlaceholder={t.wilayaSearchPlaceholder}
            icon={<MapPin className="w-3.5 h-3.5 text-sky-600" />}
            triggerClassName="h-10 px-3.5 rounded-xl bg-white hover:bg-neutral-50/50 border-black/10 text-xs sm:text-sm font-medium shadow-2xs font-mono"
            menuClassName="min-w-[280px]"
            align="end"
            data-testid="admin-orders-wilaya-select"
            nativeSelectTestId="admin-orders-wilaya-native-select"
          />
        </div>
      </div>

      {/* Active Filter Chips with Quick Dismissal */}
      {activeCount > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/[0.04]"
          data-testid="admin-orders-active-chips"
        >
          <span className="text-[11px] font-semibold text-neutral-500">
            {t.activeFiltersLabel}
          </span>

          {/* Search chip */}
          {filters.search && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200"
              data-testid="chip-search"
            >
              <Search className="w-3 h-3 text-neutral-400" />
              <span>"{filters.search}"</span>
              <button
                type="button"
                onClick={() => handleInputChange("search", undefined)}
                className="text-neutral-400 hover:text-black cursor-pointer"
                aria-label="Supprimer filtre recherche"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Status chip */}
          {filters.status && filters.status !== "ALL" && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200/80"
              data-testid="chip-status"
            >
              <Layers className="w-3 h-3 text-purple-500" />
              <span>
                {statusOptions.find((o) => o.value === filters.status)?.label || filters.status}
              </span>
              <button
                type="button"
                onClick={() => handleStatusChange("ALL")}
                className="text-purple-400 hover:text-purple-900 cursor-pointer"
                aria-label="Supprimer filtre statut"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Tracking chip */}
          {filters.trackingNumber && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-sky-50 text-sky-800 border border-sky-200/80"
              data-testid="chip-tracking"
            >
              <Truck className="w-3 h-3 text-sky-500" />
              <span>{filters.trackingNumber}</span>
              <button
                type="button"
                onClick={() => handleInputChange("trackingNumber", undefined)}
                className="text-sky-400 hover:text-sky-900 cursor-pointer"
                aria-label="Supprimer filtre suivi"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Wilaya chip */}
          {selectedWilayaObj && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200/80"
              data-testid="chip-wilaya"
            >
              <MapPin className="w-3 h-3 text-amber-600" />
              <span>
                {selectedWilayaObj.code} -{" "}
                {isArabic ? selectedWilayaObj.nameAr : selectedWilayaObj.name}
              </span>
              <button
                type="button"
                onClick={() => handleWilayaChange("ALL")}
                className="text-amber-500 hover:text-amber-900 cursor-pointer"
                aria-label="Supprimer filtre wilaya"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold underline ms-1 cursor-pointer"
          >
            {t.reset}
          </button>
        </div>
      )}
    </div>
  );
}
