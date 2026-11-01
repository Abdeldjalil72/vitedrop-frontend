"use client";

import React, { useEffect, useState } from "react";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { getWilayaByCode } from "@/lib/algeria-locations";
import { Language } from "@/lib/locales";
import { Button } from "@/components/ui/button";
import {
  X,
  Printer,
  Copy,
  Check,
  Truck,
  Package,
  Phone,
  MapPin,
  QrCode,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export interface WaybillOrderData {
  id: string;
  customerName: string;
  customerPhone: string;
  wilaya: number;
  commune: string;
  address: string;
  productName?: string;
  productId: string;
  quantity: number;
  trackingNumber: string | null;
  courier: string | null;
  courierLabelUrl?: string | null;
  supplierName?: string;
  supplierId: string;
  cpaCommission?: number;
  totalAmount?: number;
  retailPrice?: number;
  createdAt: string;
}

interface OrderWaybillModalProps {
  order: WaybillOrderData | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export function OrderWaybillModal({
  order,
  isOpen,
  onClose,
  lang,
}: OrderWaybillModalProps) {
  const [copiedTracking, setCopiedTracking] = useState(false);
  const isArabic = lang === "ar";

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const wilayaCode = String(order.wilaya || 16).padStart(2, "0");
  const wilayaInfo = getWilayaByCode(wilayaCode);
  const wilayaName = wilayaInfo
    ? isArabic
      ? wilayaInfo.nameAr
      : wilayaInfo.name
    : `Wilaya ${order.wilaya || 16}`;

  const courierName = order.courier || "Yalidine Express";
  const orderIdSafe = order.id || "ORD-0000";
  const trackingNumber =
    order.trackingNumber || `YAL-DZ-${orderIdSafe.slice(0, 8).toUpperCase()}`;

  const isStopDesk =
    order.address?.toUpperCase().includes("[STOP-DESK]") ||
    order.address?.toUpperCase().includes("STOP-DESK");
  const deliveryFee = isStopDesk
    ? (wilayaInfo?.deskDeliveryFee ?? 300)
    : (wilayaInfo?.homeDeliveryFee ?? 450);

  const finalCollectionAmount =
    order.totalAmount ??
    (order.retailPrice
      ? order.retailPrice * order.quantity + deliveryFee
      : (order.cpaCommission ? Math.round(order.cpaCommission * 3.5) : 4900));

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="waybill-modal-title"
        data-testid="order-waybill-modal"
        className="bg-white rounded-3xl border border-black/10 shadow-2xl max-w-2xl w-full max-h-[min(94vh,calc(100dvh-2rem))] overflow-y-auto p-5 sm:p-7 text-start relative animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h2
                id="waybill-modal-title"
                className="text-base sm:text-lg font-bold text-neutral-900"
              >
                {isArabic
                  ? "بوليصة الشحن الرسمية (Bordereau)"
                  : "Bordereau d'Expédition Officiel"}
              </h2>
              <p className="text-xs text-neutral-500 font-mono">
                {courierName} Master API &bull; ViteDrop Central Logistics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {order.courierLabelUrl && (
              <a
                href={order.courierLabelUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="official-courier-pdf-link"
                className="h-8 px-2.5 text-xs inline-flex items-center gap-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors print:hidden shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isArabic ? "Étiquette PDF" : "Étiquette PDF"}</span>
              </a>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              data-testid="waybill-print-btn"
              className="h-8 px-2.5 text-xs flex items-center gap-1 print:hidden"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isArabic ? "طباعة" : "Imprimer"}</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label={isArabic ? "إغلاق" : "Fermer"}
              className="p-1.5 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Waybill Document Card */}
        <div className="mt-4 p-5 sm:p-6 rounded-2xl border-2 border-neutral-800 bg-white space-y-5 font-sans print:border-black print:p-0">
          {/* Top Banner: Courier & Barcode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-dashed border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-lg sm:text-xl text-neutral-950 tracking-wider uppercase">
                  {courierName}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  COD MASTER
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                ViteDrop Escrow Network &bull; Réf: #{order.id.slice(0, 8).toUpperCase()}
              </div>
            </div>

            {/* Barcode & Tracking */}
            <div className="flex flex-col items-start sm:items-end">
              <div className="h-10 flex items-center gap-0.5 px-2 py-1 bg-neutral-900 text-white rounded">
                {/* Simulated Barcode Stripes */}
                <div className="flex items-stretch h-7 gap-[2px] bg-white px-2 py-1 rounded-xs">
                  <span className="w-[3px] bg-black" />
                  <span className="w-[1px] bg-black" />
                  <span className="w-[2px] bg-black" />
                  <span className="w-[4px] bg-black" />
                  <span className="w-[1px] bg-black" />
                  <span className="w-[3px] bg-black" />
                  <span className="w-[2px] bg-black" />
                  <span className="w-[1px] bg-black" />
                  <span className="w-[3px] bg-black" />
                  <span className="w-[1px] bg-black" />
                  <span className="w-[4px] bg-black" />
                  <span className="w-[2px] bg-black" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-mono text-xs font-bold text-neutral-900">
                  {trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTracking}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                  title={isArabic ? "نسخ رقم التتبع" : "Copier le numéro de suivi"}
                >
                  {copiedTracking ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Grid: Expediteur & Destinataire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sender / Expéditeur */}
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                {isArabic ? "المرسل (Expéditeur)" : "Expéditeur (Fournisseur)"}
              </span>
              <div className="font-bold text-neutral-900">
                {order.supplierName || "Fournisseur ViteDrop"}
              </div>
              <div className="text-[11px] text-neutral-600">
                Hub Logistique Centralisé ViteDrop
              </div>
              <div className="text-[11px] text-neutral-500 font-mono">
                Alger (Wilaya 16) &bull; Code: VTD-ALGER-01
              </div>
            </div>

            {/* Recipient / Destinataire */}
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                {isArabic ? "المرسل إليه (Destinataire)" : "Destinataire (Client Final)"}
              </span>
              <div className="font-bold text-neutral-900 text-sm">
                {order.customerName}
              </div>
              <div className="flex items-center gap-1.5 text-neutral-800 font-mono font-medium">
                <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                <span dir="ltr">{order.customerPhone}</span>
              </div>
              <div className="flex items-start gap-1.5 text-neutral-600">
                <MapPin className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
                <span>
                  <strong>
                    {wilayaCode} - {wilayaName}
                  </strong>{" "}
                  &bull; {order.commune}
                  <br />
                  <span className="text-neutral-500">{order.address}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Package & Product Specifications */}
          <div className="p-3.5 rounded-xl border border-neutral-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-neutral-600 border-b border-neutral-100 pb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Package className="w-4 h-4 text-neutral-400" />
                <span>{order.productName || `Produit #${order.productId.slice(0, 8)}`}</span>
              </span>
              <span className="font-mono font-bold text-neutral-900">
                Quantité: {order.quantity}
              </span>
            </div>

            {/* COD Cash Collection Directive */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  {isArabic ? "طريقة الدفع والتسليم" : "Mode de Règlement"}
                </span>
                <span className="text-xs font-semibold text-neutral-800">
                  {isArabic ? "الدفع نقداً عند الاستلام (COD)" : "Paiement à la Livraison (COD)"}
                </span>
              </div>
              <div className="text-end">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  {isArabic ? "المبلغ المطلوب تحصيله" : "Montant à Encaisser"}
                </span>
                <span className="font-mono text-base font-black text-emerald-700">
                  {formatDZD(finalCollectionAmount, lang)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-2 border-t border-dashed border-neutral-200">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Garantie Escrow ViteDrop &bull; 58 Wilayas</span>
            </span>
            <span>Date: {formatDateTime(order.createdAt, lang)}</span>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="text-xs px-4"
          >
            {isArabic ? "إغلاق النافذة" : "Fermer"}
          </Button>
          {order.courierLabelUrl && (
            <a
              href={order.courierLabelUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="official-courier-pdf-footer-btn"
              className="h-9 px-3.5 text-xs inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isArabic ? "تحميل بوليصة ياليدين (PDF)" : "Télécharger Étiquette Yalidine (PDF)"}</span>
            </a>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="text-xs px-4 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isArabic ? "طباعة البوليصة" : "Imprimer le Bordereau"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
