"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { WebhookEventTable } from "@/components/admin/webhook-event-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMetricGrid, AdminMetricCard } from "@/components/admin/admin-metric-grid";
import { apiGetWebhookEvents, WebhookEventItem } from "@/lib/api-client";
import { translations } from "@/lib/locales";
import {
  Radio,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
} from "lucide-react";

export default function AdminWebhooksPage() {
  const [events, setEvents] = useState<WebhookEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGetWebhookEvents(100);
      setEvents(data || []);
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement des webhooks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const processedCount = events.filter((e) => e.processingStatus === "PROCESSED").length;
  const failedCount = events.filter((e) => e.processingStatus === "FAILED").length;
  const ignoredCount = events.filter((e) => e.processingStatus === "IGNORED").length;

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const isArabic = lang === "ar";

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Header */}
            <AdminPageHeader
              badge={isArabic ? "مراقبة الاتصال الخارجي" : "Courier Telemetry"}
              badgeVariant="rose"
              title={isArabic ? "سجل إشعارات التوصيل (Webhooks)" : "Surveillance des Webhooks"}
              description={
                isArabic
                  ? "سجل إشارات التوصيل الواردة من شركات الشحن (Yalidine) والتحقق من التوقيع الرقمي."
                  : "Flux des événements logistiques entrants, vérification HMAC et intégrité des transitions."
              }
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadEvents}
                  disabled={isLoading}
                  className="min-h-[40px] sm:min-h-0 text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  {isArabic ? "تحديث" : "Actualiser"}
                </Button>
              }
            />

            {/* Quick KPIs */}
            <AdminMetricGrid columns={3}>
              <AdminMetricCard
                label={isArabic ? "معالجة بنجاح" : "Traités avec Succès"}
                value={processedCount}
                variant="emerald"
                icon={CheckCircle2}
              />
              <AdminMetricCard
                label={isArabic ? "فشل المعالجة" : "Échecs de Traitement"}
                value={failedCount}
                variant="rose"
                icon={XCircle}
              />
              <AdminMetricCard
                label={isArabic ? "حالات وسيطة متجاهلة" : "Statuts Intermédiaires"}
                value={ignoredCount}
                variant="default"
                icon={SlidersHorizontal}
              />
            </AdminMetricGrid>

            {/* Error state */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={loadEvents} className="text-xs text-rose-800">
                  {isArabic ? "إعادة المحاولة" : "Réessayer"}
                </Button>
              </div>
            )}

            {/* Webhooks Table Card */}
            <div className="bg-white rounded-xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs font-semibold text-neutral-800">
                    {isArabic ? "آخر 100 إشعار مستلم" : "100 Derniers Événements Reçus"}
                  </span>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  {events.length} {isArabic ? "حدث" : "événements"}
                </span>
              </div>

              {isLoading ? (
                <div className="p-8 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 bg-neutral-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 space-y-2">
                  <Radio className="w-8 h-8 mx-auto text-neutral-300" />
                  <p className="text-sm font-medium">
                    {isArabic ? "لا توجد أي إشعارات مستلمة بعد" : "Aucun événement reçu."}
                  </p>
                </div>
              ) : (
                <WebhookEventTable events={events} lang={lang} />
              )}
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
