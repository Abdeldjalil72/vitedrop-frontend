"use client";

import React from "react";
import { AdminOrderEvent } from "@/lib/api-client";
import { Language, translations } from "@/lib/locales";
import { formatDateTime } from "@/lib/formatters";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderStatus } from "@/types";
import { Clock, Shield, Truck, UserCheck, AlertCircle } from "lucide-react";

interface OrderStatusTimelineProps {
  events: AdminOrderEvent[];
  lang: Language;
}

export function OrderStatusTimeline({ events, lang }: OrderStatusTimelineProps) {
  const isArabic = lang === "ar";

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-neutral-400">
        {isArabic ? "لا يوجد سجل حركات لهذه الطلبية" : "Aucun événement enregistré."}
      </div>
    );
  }

  // Sort events chronologically descending
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case "yalidine":
      case "courier":
        return <Truck className="w-3.5 h-3.5 text-blue-500" />;
      case "admin":
        return <Shield className="w-3.5 h-3.5 text-rose-500" />;
      case "supplier":
        return <UserCheck className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="relative ps-6 space-y-6 before:absolute before:top-2 before:bottom-2 before:start-2.5 before:w-0.5 before:bg-neutral-200">
      {sortedEvents.map((event) => (
        <div key={event.id} className="relative group">
          {/* Timeline Dot */}
          <div className="absolute -start-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-neutral-300 flex items-center justify-center group-hover:border-neutral-900 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
          </div>

          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/70 hover:border-neutral-300 transition-all text-start">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <StatusBadge status={event.toStatus as OrderStatus} lang={lang} size="sm" />
                {event.fromStatus && (
                  <span className="text-[10px] text-neutral-400 font-mono">
                    ({event.fromStatus} &rarr; {event.toStatus})
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-neutral-500">
                {formatDateTime(event.createdAt, lang)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-600 mt-1">
              <span className="flex items-center gap-1 font-medium text-neutral-700">
                {getSourceIcon(event.triggerSource)}
                <span className="capitalize">{event.triggerSource}</span>
              </span>
              {event.reason && (
                <span className="text-neutral-500 ms-2 italic">
                  &mdash; &ldquo;{event.reason}&rdquo;
                </span>
              )}
            </div>

            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="mt-2 p-2 bg-white rounded border border-neutral-100 font-mono text-[10px] text-neutral-500 overflow-x-auto">
                <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
