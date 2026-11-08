"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WebhookEventTable } from "@/components/admin/webhook-event-table";
import { WebhookPayloadModal } from "@/components/admin/webhook-payload-modal";
import { WebhookSimulationModal } from "@/components/admin/webhook-simulation-modal";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMetricGrid, AdminMetricCard } from "@/components/admin/admin-metric-grid";
import { apiGetWebhookEvents, WebhookEventItem } from "@/lib/api-client";
import {
  Radio,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Search,
  PlusCircle,
  Truck,
} from "lucide-react";

export default function AdminWebhooksPage() {
  const [events, setEvents] = useState<WebhookEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [providerFilter, setProviderFilter] = useState<string>("ALL");

  // Modals
  const [selectedEventForPayload, setSelectedEventForPayload] =
    useState<WebhookEventItem | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

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

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        evt.trackingNumber.toLowerCase().includes(query) ||
        (evt.providerEventId &&
          evt.providerEventId.toLowerCase().includes(query)) ||
        evt.provider.toLowerCase().includes(query) ||
        evt.receivedStatus.toLowerCase().includes(query) ||
        evt.normalizedStatus.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || evt.processingStatus === statusFilter;

      const matchesProvider =
        providerFilter === "ALL" ||
        evt.provider.toLowerCase().includes(providerFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [events, searchQuery, statusFilter, providerFilter]);

  const processedCount = events.filter((e) => e.processingStatus === "PROCESSED").length;
  const failedCount = events.filter((e) => e.processingStatus === "FAILED").length;
  const ignoredCount = events.filter((e) => e.processingStatus === "IGNORED").length;

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const isArabic = lang === "ar";
        const isEnglish = lang === "en";

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Header */}
            <AdminPageHeader
              badge={isArabic ? "مراقبة الاتصال الخارجي" : isEnglish ? "Courier Telemetry" : "Courier Telemetry"}
              badgeVariant="rose"
              title={
                isArabic
                  ? "سجل إشعارات التوصيل (Webhooks)"
                  : isEnglish
                  ? "Courier Webhooks Telemetry"
                  : "Surveillance des Webhooks"
              }
              description={
                isArabic
                  ? "سجل إشارات التوصيل الواردة من شركات الشحن (Yalidine, ZR Express) والتحقق من التوقيع الرقمي."
                  : isEnglish
                  ? "Inbound courier logistics signal stream, HMAC signature validation, and state machine integrity."
                  : "Flux des événements logistiques entrants, vérification HMAC et intégrité des transitions."
              }
              actions={
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsSimulateModalOpen(true)}
                    className="min-h-[40px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#064e3b] hover:bg-[#085a44] border border-[#0a5e47] text-amber-200 text-xs font-semibold shadow-xs active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-amber-300 w-full sm:w-auto cursor-pointer"
                    data-testid="simulate-webhook-modal-btn"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                    <span>{isArabic ? "محاكاة إشعار شحن" : isEnglish ? "Simulate Webhook" : "Simuler un Webhook"}</span>
                  </button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={loadEvents}
                    disabled={isLoading}
                    className="min-h-[40px] sm:min-h-0 text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    <span>{isArabic ? "تحديث" : "Actualiser"}</span>
                  </Button>
                </div>
              }
            />

            {/* Notification alert */}
            {notification && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{notification}</span>
              </div>
            )}

            {/* Quick KPIs */}
            <AdminMetricGrid columns={3}>
              <AdminMetricCard
                label={isArabic ? "معالجة بنجاح" : isEnglish ? "Processed Successfully" : "Traités avec Succès"}
                value={processedCount}
                variant="emerald"
                icon={CheckCircle2}
              />
              <AdminMetricCard
                label={isArabic ? "فشل المعالجة" : isEnglish ? "Processing Failures" : "Échecs de Traitement"}
                value={failedCount}
                variant="rose"
                icon={XCircle}
              />
              <AdminMetricCard
                label={isArabic ? "حالات وسيطة متجاهلة" : isEnglish ? "Intermediate Ignored" : "Statuts Intermédiaires"}
                value={ignoredCount}
                variant="default"
                icon={SlidersHorizontal}
              />
            </AdminMetricGrid>

            {/* Filter and Search Bar */}
            <div className="p-3.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-[#e7e5df] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder={
                    isArabic
                      ? "البحث برقم التتبع، المزود، أو الحالة..."
                      : isEnglish
                      ? "Search by tracking #, status, or courier..."
                      : "Rechercher par numéro de suivi, statut ou transporteur..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-h-[40px] ps-9 pe-3 text-xs"
                  data-testid="search-webhooks-input"
                />
              </div>

              {/* Status and Provider Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Toggle */}
                <div className="inline-flex p-1 bg-[#f4f4f4] rounded-full text-xs font-semibold overflow-x-auto max-w-full">
                  {[
                    { id: "ALL", label: isArabic ? "كل الحالات" : isEnglish ? "All Statuses" : "Tous Statuts" },
                    { id: "PROCESSED", label: isArabic ? "معالجة" : isEnglish ? "Processed" : "Traités" },
                    { id: "FAILED", label: isArabic ? "فشل" : isEnglish ? "Failed" : "Échecs" },
                    { id: "IGNORED", label: isArabic ? "متجاهلة" : isEnglish ? "Ignored" : "Ignorés" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setStatusFilter(st.id)}
                      className={`min-h-[32px] px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === st.id
                          ? "bg-white text-black shadow-xs font-bold"
                          : "text-[#6b6b6b] hover:text-black"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Provider Tabs */}
                <div className="inline-flex p-1 bg-[#f4f4f4] rounded-full text-xs font-semibold">
                  {[
                    { id: "ALL", label: isArabic ? "كل الناقلين" : isEnglish ? "All Couriers" : "Tous" },
                    { id: "yalidine", label: "Yalidine" },
                    { id: "zr", label: "ZR Express" },
                  ].map((pr) => (
                    <button
                      key={pr.id}
                      onClick={() => setProviderFilter(pr.id)}
                      className={`min-h-[32px] px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                        providerFilter === pr.id
                          ? "bg-white text-black shadow-xs font-bold"
                          : "text-[#6b6b6b] hover:text-black"
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={loadEvents} className="text-xs text-rose-800">
                  {isArabic ? "إعادة المحاولة" : isEnglish ? "Retry" : "Réessayer"}
                </Button>
              </div>
            )}

            {/* Webhooks Table Card */}
            <div className="bg-white rounded-2xl border border-[#e7e5df] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs font-semibold text-neutral-800">
                    {isArabic ? "إشعارات الشبكة اللوجستية" : isEnglish ? "Telemetry Events" : "Événements Télémesure"}
                  </span>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  {filteredEvents.length} / {events.length}{" "}
                  {isArabic ? "حدث" : isEnglish ? "events" : "événements"}
                </span>
              </div>

              {isLoading ? (
                <div className="p-8 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 bg-neutral-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 space-y-2">
                  <Radio className="w-8 h-8 mx-auto text-neutral-300" />
                  <p className="text-sm font-medium">
                    {isArabic
                      ? "لا توجد أي إشعارات مطابقة لمعايير البحث"
                      : isEnglish
                      ? "No webhook events match the current filters."
                      : "Aucun événement correspondant aux critères."}
                  </p>
                </div>
              ) : (
                <WebhookEventTable
                  events={filteredEvents}
                  lang={lang}
                  onViewPayload={(evt) => setSelectedEventForPayload(evt)}
                />
              )}
            </div>

            {/* Raw JSON Payload Modal */}
            <WebhookPayloadModal
              event={selectedEventForPayload}
              isOpen={!!selectedEventForPayload}
              onClose={() => setSelectedEventForPayload(null)}
              lang={lang}
            />

            {/* Webhook Simulation Modal */}
            <WebhookSimulationModal
              isOpen={isSimulateModalOpen}
              onClose={() => setIsSimulateModalOpen(false)}
              onSuccess={(trackingNumber, status) => {
                setNotification(
                  isArabic
                    ? `تم إرسال إشعار المحاكاة بنجاح (${status}) لرقم التتبع ${trackingNumber}`
                    : isEnglish
                    ? `Mock signal ${status} sent successfully for tracking ${trackingNumber}`
                    : `Notification ${status} simulée avec succès pour ${trackingNumber}`
                );
                loadEvents();
                setTimeout(() => setNotification(null), 4000);
              }}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
