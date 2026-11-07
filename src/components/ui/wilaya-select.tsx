"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, ChevronDown, Check, Search, X } from "lucide-react";
import { ALGERIA_WILAYAS, Wilaya } from "@/lib/algeria-locations";
import { formatDZD } from "@/lib/formatters";
import { Language } from "@/lib/locales";

export interface WilayaSelectProps {
  value: string;
  onChange: (code: string) => void;
  lang?: Language;
  label?: string;
  error?: string;
  helperText?: string;
  showDeliveryFees?: boolean;
  className?: string;
  triggerClassName?: string;
  colorScheme?: "sky" | "blue";
  placeholder?: string;
  name?: string;
  nativeSelectTestId?: string;
  "data-testid"?: string;
}

export function WilayaSelect({
  value,
  onChange,
  lang = "fr",
  label,
  error,
  helperText,
  showDeliveryFees = false,
  className = "",
  triggerClassName = "",
  colorScheme = "sky",
  placeholder,
  name,
  nativeSelectTestId,
  "data-testid": testId = "wilaya-select-trigger",
}: WilayaSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nativeSelectRef = useRef<HTMLSelectElement>(null);

  const selectedWilaya = useMemo(
    () => ALGERIA_WILAYAS.find((w) => w.code === value),
    [value]
  );

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  // Filter wilayas by code, French name, or Arabic name
  const filteredWilayas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALGERIA_WILAYAS;
    return ALGERIA_WILAYAS.filter(
      (w) =>
        w.code.includes(q) ||
        w.name.toLowerCase().includes(q) ||
        w.nameAr.includes(q)
    );
  }, [search]);

  const defaultPlaceholder =
    lang === "ar" ? "اختر الولاية (58 ولاية)..." : "Sélectionner la wilaya...";

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    if (nativeSelectRef.current) {
      nativeSelectRef.current.value = code;
      const event = new Event("change", { bubbles: true });
      nativeSelectRef.current.dispatchEvent(event);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col gap-1.5 text-start relative ${
        isOpen ? "z-30" : ""
      } ${className}`}
    >
      {label && (
        <label className="text-xs font-semibold text-neutral-800 tracking-tight flex items-center justify-between">
          <span>{label}</span>
          {selectedWilaya && (
            <span
              className={`text-[11px] font-mono font-medium ${
                colorScheme === "blue" ? "text-blue-600" : "text-sky-600"
              }`}
            >
              #{selectedWilaya.code}
            </span>
          )}
        </label>
      )}

      {/* Hidden Native Select for Automated Testing & Accessibility */}
      <select
        ref={nativeSelectRef}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={nativeSelectTestId}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        {ALGERIA_WILAYAS.map((w) => (
          <option key={w.code} value={w.code}>
            {w.code} - {w.name} ({w.nameAr})
          </option>
        ))}
      </select>

      {/* Modern Animated Trigger Button */}
      <motion.button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="wilaya-listbox"
        data-testid={testId}
        whileTap={{ scale: 0.985 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[48px] flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-white border text-sm transition-all text-start cursor-pointer select-none hover:border-black/25 focus:outline-none ${
          colorScheme === "blue"
            ? `focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 ${
                isOpen
                  ? "border-blue-600 ring-4 ring-blue-600/10 shadow-xs"
                  : "border-neutral-200"
              }`
            : `focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 ${
                isOpen
                  ? "border-sky-500 ring-4 ring-sky-500/10 shadow-xs"
                  : "border-black/10"
              }`
        } ${error ? "border-rose-400 ring-rose-500/10" : ""} ${triggerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-neutral-50 border border-black/[0.04] flex items-center justify-center text-neutral-500 shrink-0">
            <MapPin
              className={`w-3.5 h-3.5 ${
                colorScheme === "blue" ? "text-blue-600" : "text-sky-600"
              }`}
            />
          </div>

          {selectedWilaya ? (
            <div className="flex items-center gap-2 truncate">
              <span
                className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded-md border ${
                  colorScheme === "blue"
                    ? "bg-blue-50 text-blue-800 border-blue-200/60"
                    : "bg-neutral-100 text-neutral-800 border-neutral-200/60"
                }`}
              >
                {selectedWilaya.code}
              </span>
              <span className="font-semibold text-neutral-900 truncate">
                {lang === "ar" ? selectedWilaya.nameAr : selectedWilaya.name}
              </span>
              <span className="text-xs text-neutral-400 font-normal hidden sm:inline">
                ({lang === "ar" ? selectedWilaya.name : selectedWilaya.nameAr})
              </span>
            </div>
          ) : (
            <span className="text-neutral-400 text-sm">
              {placeholder || defaultPlaceholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showDeliveryFees && selectedWilaya && (
            <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              {formatDZD(selectedWilaya.homeDeliveryFee, lang)}
            </span>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
            className="text-neutral-400"
          >
            <ChevronDown
              className={`w-4 h-4 transition-colors ${
                isOpen
                  ? colorScheme === "blue"
                    ? "text-blue-600"
                    : "text-sky-600"
                  : ""
              }`}
            />
          </motion.div>
        </div>
      </motion.button>

      {/* Modern Popover Dropdown with Apple-style Spring Physics */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
            className="absolute top-full start-0 end-0 mt-2 z-50 bg-white rounded-2xl border border-black/[0.08] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12)] overflow-hidden"
          >
            {/* Search Input Bar */}
            <div className="p-2.5 border-b border-black/[0.06] bg-[#fafafa]">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute start-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    lang === "ar"
                      ? "ابحث بالاسم أو الرقم (مثلاً: 16، وهران)..."
                      : "Rechercher par nom ou code (ex: 16, Oran)..."
                  }
                  className={`w-full bg-white rounded-xl border border-black/10 py-1.5 ps-9 pe-8 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none ${
                    colorScheme === "blue"
                      ? "focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                      : "focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                  }`}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute end-2.5 p-0.5 text-neutral-400 hover:text-black rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Wilayas Scrollable List */}
            <div
              id="wilaya-listbox"
              role="listbox"
              className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-black/[0.02]"
            >
              {filteredWilayas.length > 0 ? (
                filteredWilayas.map((w) => {
                  const isSelected = w.code === value;
                  return (
                    <button
                      key={w.code}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-testid={`wilaya-option-${w.code}`}
                      onClick={() => handleSelect(w.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-start cursor-pointer group ${
                        isSelected
                          ? colorScheme === "blue"
                            ? "bg-blue-50/90 text-blue-900 font-semibold border border-blue-100"
                            : "bg-sky-50/80 text-sky-900 font-semibold border border-sky-100"
                          : "text-neutral-700 hover:bg-[#fafafa] hover:text-neutral-950"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md border ${
                            isSelected
                              ? colorScheme === "blue"
                                ? "bg-blue-600 text-white border-blue-600 font-bold"
                                : "bg-sky-600 text-white border-sky-600 font-bold"
                              : "bg-neutral-100 text-neutral-600 border-neutral-200/60 group-hover:bg-neutral-200/60"
                          }`}
                        >
                          {w.code}
                        </span>

                        <div className="flex items-baseline gap-1.5 truncate">
                          <span className="font-medium truncate">
                            {lang === "ar" ? w.nameAr : w.name}
                          </span>
                          <span className="text-[11px] text-[#6b6b6b] font-normal truncate">
                            ({lang === "ar" ? w.name : w.nameAr})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {showDeliveryFees && (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono">
                            <span className="text-neutral-500">
                              {formatDZD(w.homeDeliveryFee, lang)}
                            </span>
                            <span className="text-neutral-300">|</span>
                            <span
                              className={
                                colorScheme === "blue"
                                  ? "text-blue-600 font-medium"
                                  : "text-sky-600"
                              }
                            >
                              {formatDZD(w.deskDeliveryFee, lang)}
                            </span>
                          </div>
                        )}

                        {isSelected && (
                          <Check
                            className={`w-4 h-4 shrink-0 ${
                              colorScheme === "blue"
                                ? "text-blue-600"
                                : "text-sky-600"
                            }`}
                          />
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-neutral-400">
                  {lang === "ar"
                    ? "لم يتم العثور على أي ولاية مطابقة"
                    : "Aucune wilaya trouvée."}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="px-3 py-2 bg-[#fbfbfb] border-t border-black/[0.04] flex items-center justify-between text-[10px] text-[#6b6b6b] font-mono">
              <span>58 Wilayas d&apos;Algérie</span>
              <span>Yalidine & ZR Express Coverage</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}
