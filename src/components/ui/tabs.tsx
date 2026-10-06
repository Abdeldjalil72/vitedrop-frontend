"use client";

import React from "react";
import { motion } from "motion/react";

export interface TabOption<T extends string = string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps<T extends string = string> {
  tabs: TabOption<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  layoutId?: string;
  className?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  layoutId = "segmented-tab-pill",
  className = "",
}: TabsProps<T>) {
  return (
    <div
      className={`inline-flex items-center p-1.5 bg-[#f4f4f4] rounded-full border border-black/[0.04] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative px-4 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 z-10 cursor-pointer ${
              isActive ? "text-neutral-900" : "text-[#6b6b6b] hover:text-black"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                className="absolute inset-0 bg-white rounded-full shadow-sm z-[-1]"
              />
            )}
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ms-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive
                    ? "bg-neutral-100 text-neutral-800"
                    : "bg-black/[0.06] text-neutral-600"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
