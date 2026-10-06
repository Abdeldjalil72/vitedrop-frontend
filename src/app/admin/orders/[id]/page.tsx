"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderStatusTimeline } from "@/components/admin/order-status-timeline";
import { FinancialBreakdown } from "@/components/admin/financial-breakdown";
import {
  apiGetAdminOrder,
  apiAddAdminOrderNote,
  apiReprocessOrderWebhook,
  apiReconcileOrderSettlement,
  AdminOrderDetail,
} from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import { OrderStatus } from "@/types";
import {
  ArrowLeft,
  Truck,
  User,
  Phone,
  MapPin,
  Package,
  Layers,
  MessageSquare,
  ShieldAlert,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notes state
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Operational action states
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGetAdminOrder(id);
      setOrder(data);
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement de la commande.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmittingNote(true);
    setActionMessage(null);
    try {
      await apiAddAdminOrderNote(id, newNote.trim());
      setNewNote("");
      await fetchOrder();
      setActionMessage({
        type: "success",
        text: "Note administrative ajoutée avec succès.",
      });
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err?.message || "Échec de l'ajout de la note.",
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleReprocessWebhook = async () => {
    setIsReprocessing(true);
    setActionMessage(null);
    try {
      const res = await apiReprocessOrderWebhook(id);
      setActionMessage({
        type: "success",
        text: res.message || "Webhook re-traité avec succès.",
      });
      await fetchOrder();
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err?.message || "Échec du re-traitement webhook.",
      });
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleReconcileSettlement = async () => {
    setIsReconciling(true);
    setActionMessage(null);
    try {
      const res = await apiReconcileOrderSettlement(id);
      setActionMessage({
        type: "success",
        text: res.message || "Régularisation financière effectuée.",
      });
      await fetchOrder();
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err?.message || "Échec de la régularisation financière.",
      });
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const isArabic = lang === "ar";

        if (isLoading) {
          return (
            <div className="space-y-6">
              <div className="h-8 bg-neutral-200 rounded-lg w-48 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-64 bg-neutral-100 rounded-xl animate-pulse md:col-span-2" />
                <div className="h-64 bg-neutral-100 rounded-xl animate-pulse" />
              </div>
            </div>
          );
        }

        if (error || !order) {
          return (
            <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 space-y-4">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <h2 className="text-lg font-bold text-neutral-900">
                {isArabic ? "تعذر تحميل الطلبية" : "Commande introuvable"}
              </h2>
              <p className="text-xs text-neutral-500">{error}</p>
              <Link href="/admin/orders">
                <Button variant="secondary" size="sm">
                  {isArabic ? "العودة لقائمة الطلبيات" : "Retour aux commandes"}
                </Button>
              </Link>
            </div>
          );
        }

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Top Navigation & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-mono">
                      #{order.id}
                    </h1>
                    <StatusBadge status={order.status as OrderStatus} lang={lang} />
                  </div>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">
                    {isArabic ? "تاريخ الإنشاء:" : "Créée le:"}{" "}
                    {formatDateTime(order.createdAt, lang)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReprocessWebhook}
                  disabled={isReprocessing || !order.trackingNumber}
                  className="min-h-[40px] sm:min-h-0 text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReprocessing ? "animate-spin" : ""}`} />
                  {isArabic ? "إعادة معالجة الويب هوك" : "Rejouer Webhook"}
                </Button>

                {order.status === "delivered" && (order.transactions || []).length < 3 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleReconcileSettlement}
                    disabled={isReconciling}
                    className="min-h-[40px] sm:min-h-0 text-xs bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-1.5 text-white w-full sm:w-auto"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {isArabic ? "تسوية القيود المالية" : "Régulariser Grand Livre"}
                  </Button>
                )}
              </div>
            </div>

            {/* Notification alert */}
            {actionMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                  actionMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {actionMessage.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Column (2 Cols): Details & Financials */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Customer & Delivery Card */}
                <div className="bg-white rounded-xl border border-neutral-200/80 p-3.5 sm:p-5 lg:p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
                    {isArabic ? "بيانات العميل والشحن" : "Détails Client & Expédition"}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span className="font-semibold text-neutral-800">{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-600 font-mono">
                        <Phone className="w-4 h-4 text-neutral-400" />
                        <span>{order.customerPhone}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-neutral-600">
                        <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                        <span>
                          Wilaya {order.wilaya < 10 ? `0${order.wilaya}` : order.wilaya} &bull;{" "}
                          {order.commune}
                          <br />
                          <span className="text-neutral-400">{order.address}</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 bg-neutral-50 p-3.5 rounded-lg border border-neutral-200">
                      <div className="text-xs font-semibold text-neutral-700">
                        {isArabic ? "معلومات شركة التوصيل" : "Logistique Yalidine"}
                      </div>
                      <div className="text-xs text-neutral-600 flex items-center justify-between">
                        <span>{isArabic ? "شركة التوصيل:" : "Transporteur:"}</span>
                        <span className="font-medium">{order.courier || "Yalidine"}</span>
                      </div>
                      <div className="text-xs text-neutral-600 flex items-center justify-between">
                        <span>{isArabic ? "رقم التتبع:" : "N° de Suivi:"}</span>
                        <span className="font-mono font-bold text-neutral-900">
                          {order.trackingNumber || (isArabic ? "غير مخصص" : "Non assigné")}
                        </span>
                      </div>
                      {order.cancellationReason && (
                        <div className="text-xs text-rose-600 pt-1 border-t border-rose-100">
                          <strong>{isArabic ? "سبب الإلغاء:" : "Motif d'annulation:"}</strong>{" "}
                          {order.cancellationReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown Component */}
                <FinancialBreakdown
                  grossCpa={Number(order.cpaCommission)}
                  affiliatePayout={Number(order.cpaCommission) * 0.8}
                  platformFee={Number(order.platformFee)}
                  status={order.status}
                  transactions={order.transactions}
                  lang={lang}
                />

                {/* Inventory Movements */}
                {order.inventoryMovements && order.inventoryMovements.length > 0 && (
                  <div className="bg-white rounded-xl border border-neutral-200/80 p-3.5 sm:p-5 lg:p-6 space-y-3">
                    <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-neutral-500" />
                      {isArabic ? "حركات المخزون المرتبطة" : "Mouvements de Stock Associés"}
                    </h3>
                    <div className="divide-y divide-neutral-100 text-xs font-mono">
                      {order.inventoryMovements.map((mov) => (
                        <div key={mov.id} className="py-2 flex items-center justify-between">
                          <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 font-sans font-medium text-neutral-700">
                            {mov.movementType}
                          </span>
                          <span className="font-bold text-neutral-800">
                            {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} unités
                          </span>
                          <span className="text-neutral-400 text-[11px]">
                            {formatDateTime(mov.createdAt, lang)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attribution & Tracking Metadata */}
                {(order.utm_source || order.click_id || order.fbclid || order.ttclid) && (
                  <div className="bg-white rounded-xl border border-neutral-200/80 p-3.5 sm:p-5 lg:p-6 space-y-3">
                    <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-neutral-500" />
                      {isArabic ? "بيانات التتبع والإحالة" : "Métadonnées d'Attribution Marketing"}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      {order.utm_source && (
                        <div className="p-2.5 bg-neutral-50 rounded border border-neutral-200">
                          <span className="text-[10px] text-neutral-400 block font-sans">Source</span>
                          <span className="font-semibold text-neutral-800">{order.utm_source}</span>
                        </div>
                      )}
                      {order.utm_campaign && (
                        <div className="p-2.5 bg-neutral-50 rounded border border-neutral-200">
                          <span className="text-[10px] text-neutral-400 block font-sans">Campagne</span>
                          <span className="font-semibold text-neutral-800">{order.utm_campaign}</span>
                        </div>
                      )}
                      {order.click_id && (
                        <div className="p-2.5 bg-neutral-50 rounded border border-neutral-200">
                          <span className="text-[10px] text-neutral-400 block font-sans">Click ID</span>
                          <span className="font-semibold text-neutral-800 truncate block">
                            {order.click_id}
                          </span>
                        </div>
                      )}
                      {order.sub_id && (
                        <div className="p-2.5 bg-neutral-50 rounded border border-neutral-200">
                          <span className="text-[10px] text-neutral-400 block font-sans">Sub ID</span>
                          <span className="font-semibold text-neutral-800">{order.sub_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Timeline & Notes */}
              <div className="space-y-4 sm:space-y-6">
                {/* State History Timeline */}
                <div className="bg-white rounded-xl border border-neutral-200/80 p-3.5 sm:p-5 lg:p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
                    {isArabic ? "مسار وتاريخ الحالات" : "Historique des Transitions"}
                  </h3>
                  <OrderStatusTimeline events={order.events || []} lang={lang} />
                </div>

                {/* Admin Notes Card */}
                <div className="bg-white rounded-xl border border-neutral-200/80 p-3.5 sm:p-5 lg:p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-2">
                    <MessageSquare className="w-4 h-4 text-neutral-500" />
                    {isArabic ? "الملاحظات الإدارية" : "Notes Administratives"}
                  </h3>

                  {/* Existing Notes */}
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {(!order.notes || order.notes.length === 0) ? (
                      <p className="text-xs text-neutral-400 italic py-2">
                        {isArabic ? "لا توجد ملاحظات مسجلة." : "Aucune note administrative."}
                      </p>
                    ) : (
                      order.notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-700 space-y-1"
                        >
                          <p>{note.note}</p>
                          <div className="text-[10px] text-neutral-400 font-mono text-end">
                            {formatDateTime(note.createdAt, lang)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-neutral-100">
                    <textarea
                      rows={2}
                      placeholder={
                        isArabic ? "أضف ملاحظة إدارية..." : "Ajouter une note d'audit..."
                      }
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full p-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isSubmittingNote || !newNote.trim()}
                        className="min-h-[40px] sm:min-h-0 text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
                      >
                        <Send className="w-3 h-3" />
                        {isArabic ? "إضافة ملاحظة" : "Ajouter"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
