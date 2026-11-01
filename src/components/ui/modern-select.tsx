"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface ModernSelectOption {
  value: string;
  label: string;
  secondaryLabel?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
}

export interface ModernSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ModernSelectOption[];
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  align?: "start" | "end";
  nativeSelectTestId?: string;
  "data-testid"?: string;
  name?: string;
}

export function ModernSelect({
  value,
  onChange,
  options,
  label,
  placeholder = "Sélectionner...",
  icon,
  searchable = false,
  searchPlaceholder = "Rechercher...",
  className = "",
  triggerClassName = "",
  menuClassName = "",
  disabled = false,
  error,
  helperText,
  align = "start",
  nativeSelectTestId,
  "data-testid": testId,
  name,
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nativeSelectRef = useRef<HTMLSelectElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Close dropdown on click outside
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

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen, searchable]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.secondaryLabel && opt.secondaryLabel.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q)) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [options, searchable, search]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    if (nativeSelectRef.current) {
      nativeSelectRef.current.value = val;
      const event = new Event("change", { bubbles: true });
      nativeSelectRef.current.dispatchEvent(event);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col gap-1.5 text-start ${className}`}
    >
      {label && (
        <label className="text-xs font-semibold text-neutral-800 tracking-tight flex items-center justify-between">
          <span>{label}</span>
          {selectedOption?.badge && (
            <span className="text-[11px] font-mono text-sky-600 font-medium">
              {selectedOption.badge}
            </span>
          )}
        </label>
      )}

      {/* Hidden Native Select for Automated Testing & Form Submissions */}
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
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Modern Animated Trigger Button */}
      <motion.button
        type="button"
        data-testid={testId}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.985 }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white border text-xs sm:text-sm font-medium transition-all text-start cursor-pointer select-none shadow-2xs hover:border-black/25 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 ${
          isOpen
            ? "border-sky-500 ring-4 ring-sky-500/10 shadow-xs"
            : "border-black/10"
        } ${error ? "border-rose-400 ring-rose-500/10" : ""} ${
          disabled ? "opacity-50 cursor-not-allowed bg-neutral-50" : ""
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && (
            <div className="w-6 h-6 rounded-lg bg-neutral-50 border border-black/[0.04] flex items-center justify-center text-neutral-500 shrink-0">
              {selectedOption?.icon || icon}
            </div>
          )}

          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.badge && (
                <span
                  className={`font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                    selectedOption.badgeColor ||
                    "bg-neutral-100 text-neutral-800 border-neutral-200/60"
                  }`}
                >
                  {selectedOption.badge}
                </span>
              )}
              <span className="font-semibold text-neutral-900 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.secondaryLabel && (
                <span className="text-xs text-neutral-400 font-normal truncate hidden sm:inline">
                  ({selectedOption.secondaryLabel})
                </span>
              )}
            </div>
          ) : (
            <span className="text-neutral-400 text-xs sm:text-sm truncate">
              {placeholder}
            </span>
          )}
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
          className="shrink-0 text-neutral-400"
        >
          <ChevronDown
            className={`w-4 h-4 transition-colors ${
              isOpen ? "text-sky-600" : ""
            }`}
          />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu Popover with Apple-style Spring Physics */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
            className={`absolute top-full mt-2 z-50 min-w-[220px] max-w-[calc(100vw-2rem)] w-full bg-white rounded-2xl border border-black/[0.08] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.14)] overflow-hidden ${
              align === "end" ? "end-0" : "start-0"
            } ${menuClassName}`}
          >
            {/* Optional Instant Search Filter */}
            {searchable && (
              <div className="p-2 border-b border-black/[0.06] bg-[#fafafa]">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute start-3 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-white rounded-xl border border-black/10 py-1.5 ps-9 pe-8 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
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
            )}

            {/* Scrollable Options List */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      data-testid={testId ? `${testId}-option-${opt.value}` : undefined}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors text-start cursor-pointer group ${
                        isSelected
                          ? "bg-sky-50/90 text-sky-950 font-semibold border border-sky-100"
                          : "text-neutral-700 hover:bg-[#fafafa] hover:text-neutral-950"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {opt.icon && (
                          <div className="shrink-0 text-neutral-400 group-hover:text-neutral-600">
                            {opt.icon}
                          </div>
                        )}

                        {opt.badge && (
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md border shrink-0 ${
                              isSelected
                                ? "bg-sky-600 text-white border-sky-600 font-bold"
                                : opt.badgeColor ||
                                  "bg-neutral-100 text-neutral-600 border-neutral-200/60 group-hover:bg-neutral-200/60"
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}

                        <div className="flex items-baseline gap-1.5 truncate">
                          <span className="truncate">{opt.label}</span>
                          {opt.secondaryLabel && (
                            <span className="text-[11px] text-neutral-400 font-normal truncate">
                              ({opt.secondaryLabel})
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 ms-1" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-neutral-400">
                  Aucun résultat trouvé
                </div>
              )}
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
