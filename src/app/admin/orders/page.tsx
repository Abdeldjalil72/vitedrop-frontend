"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderFilters } from "@/components/admin/order-filters";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveAdminList } from "@/components/admin/responsive-admin-list";
import { OrderWaybillModal } from "@/components/admin/order-waybill-modal";
import {
  apiGetAdminOrders,
  AdminOrderListItem,
  AdminOrderQuery,
} from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { getWilayaByCode } from "@/lib/algeria-locations";
import { translations } from "@/lib/locales";
import { OrderStatus } from "@/types";
import {
  ShoppingBag,
  RefreshCw,
  Truck,
  Eye,
  Copy,
  Check,
  Phone,
  Store,
  TrendingUp,
  FileText,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AdminOrderQuery>({
    limit: 20,
    offset: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clipboard copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Waybill modal state
  const [waybillOrder, setWaybillOrder] = useState<AdminOrderListItem | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGetAdminOrders(filters);
      setOrders(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement des commandes.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePageChange = (newPage: number) => {
    const limit = filters.limit || 20;
    const newOffset = (newPage - 1) * limit;
    setFilters((prev) => ({ ...prev, offset: newOffset }));
  };

  const handleReset = () => {
    setFilters({ limit: 20, offset: 0 });
  };

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
  const totalPages = Math.ceil(total / (filters.limit || 20)) || 1;

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const isArabic = lang === "ar";
        const isEnglish = lang === "en";

        const renderMobileCard = (order: AdminOrderListItem) => {
          const wilayaCode = String(order.wilaya).padStart(2, "0");
          const wilayaInfo = getWilayaByCode(wilayaCode);
          const wilayaDisplay = wilayaInfo
            ? isArabic
              ? `${wilayaCode} - ${wilayaInfo.nameAr}`
              : `${wilayaCode} - ${wilayaInfo.name}`
            : `W.${order.wilaya}`;

          const isDispatchedOrBeyond =
            order.status === "dispatched" ||
            order.status === "in_transit" ||
            order.status === "delivered" ||
            order.status === "rto_in_transit" ||
            order.status === "returned_to_supplier" ||
            !!order.trackingNumber;

          return (
            <div
              data-testid="admin-order-card"
              className="space-y-2.5 text-xs text-start"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-bold text-neutral-900 hover:text-rose-600 font-mono text-xs truncate"
                  >
                    #{order.id.slice(0, 8)}...
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleCopy(`mob-id-${order.id}`, order.id)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
                    title={isArabic ? "نسخ المعرف" : isEnglish ? "Copy ID" : "Copier ID"}
                  >
                    {copiedId === `mob-id-${order.id}` ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                    {formatDateTime(order.createdAt, lang)}
                  </span>
                </div>
                <StatusBadge status={order.status as OrderStatus} lang={lang} size="sm" />
              </div>

              {/* Customer & Location */}
              <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-neutral-100">
                <div className="min-w-0 space-y-0.5">
                  <div className="font-semibold text-neutral-900 truncate">
                    {order.customerName}
                  </div>
                  <div className="text-[11px] text-neutral-600 flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span dir="ltr">{order.customerPhone}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    {wilayaDisplay} &bull; {order.commune}
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <div className="font-bold text-neutral-900 font-mono">
                    {formatDZD(order.cpaCommission, lang)}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    Fee: {formatDZD(order.platformFee, lang)}
                  </div>
                </div>
              </div>

              {/* Identities (Supplier & Affiliate) */}
              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-neutral-100 text-[11px]">
                <div className="p-1.5 rounded-lg bg-purple-50/70 border border-purple-100 text-purple-900 truncate">
                  <span className="text-[9px] uppercase font-bold text-purple-600 block">
                    {isArabic ? "المورد" : isEnglish ? "Supplier" : "Fournisseur"}
                  </span>
                  <span className="font-semibold truncate block">
                    {order.supplierName || order.supplierId.slice(0, 8)}
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-sky-50/70 border border-sky-100 text-sky-900 truncate">
                  <span className="text-[9px] uppercase font-bold text-sky-600 block">
                    {isArabic ? "المسوق" : isEnglish ? "Affiliate" : "Affilié"}
                  </span>
                  <span className="font-semibold truncate block">
                    {order.affiliateName || order.affiliateId.slice(0, 8)}
                  </span>
                </div>
              </div>

              {/* Tracking & Actions */}
              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-neutral-100 text-[11px]">
                <div className="min-w-0">
                  {order.trackingNumber ? (
                    <div className="flex items-center gap-1 font-mono text-neutral-700">
                      <Truck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{order.trackingNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`mob-track-${order.id}`, order.trackingNumber!)}
                        className="p-1 text-neutral-400 hover:text-neutral-700"
                      >
                        {copiedId === `mob-track-${order.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-neutral-400 italic">
                      {isArabic ? "بدون تتبع" : isEnglish ? "No Tracking" : "Sans suivi"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isDispatchedOrBeyond && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setWaybillOrder(order)}
                      className="h-7 px-2 text-xs flex items-center gap-1 text-purple-700 hover:bg-purple-50"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{isArabic ? "بوليصة" : isEnglish ? "Waybill" : "Bordereau"}</span>
                    </Button>
                  )}
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button variant="secondary" size="sm" className="h-7 px-2 text-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{isArabic ? "تفاصيل" : isEnglish ? "Details" : "Détails"}</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        };

        const renderDesktopTable = () => (
          <table className="w-full text-xs text-start">
            <thead className="bg-[#fbfbfb] text-[#6b6b6b] font-bold uppercase tracking-wider text-[11px] border-b border-black/[0.06]">
              <tr>
                <th className="px-4 py-3.5 text-start">
                  {isArabic ? "المعرف / التاريخ" : isEnglish ? "ID & Date" : "ID & Date"}
                </th>
                <th className="px-4 py-3.5 text-start">
                  {isArabic ? "العميل والوجهة" : isEnglish ? "Customer & Destination" : "Client & Destination"}
                </th>
                <th className="px-4 py-3.5 text-start">
                  {isArabic ? "المنتج والكمية" : isEnglish ? "Product & Qty" : "Produit & Qte"}
                </th>
                <th className="px-4 py-3.5 text-start">
                  {isArabic ? "الأطراف (مورد / مسوق)" : isEnglish ? "Supplier / Affiliate" : "Fournisseur / Affilié"}
                </th>
                <th className="px-4 py-3.5 text-start">
                  {isArabic ? "الحالة والتتبع" : isEnglish ? "Status & Tracking" : "Statut & Suivi"}
                </th>
                <th className="px-4 py-3.5 text-start">
                  {isArabic ? "العمولة (CPA)" : isEnglish ? "CPA & Fee" : "CPA & Frais"}
                </th>
                <th className="px-4 py-3.5 text-end">
                  {isArabic ? "الإجراءات" : isEnglish ? "Actions" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {orders.map((order) => {
                const wilayaCode = String(order.wilaya).padStart(2, "0");
                const wilayaInfo = getWilayaByCode(wilayaCode);
                const wilayaDisplay = wilayaInfo
                  ? isArabic
                    ? `${wilayaCode} - ${wilayaInfo.nameAr}`
                    : `${wilayaCode} - ${wilayaInfo.name}`
                  : `Wilaya ${order.wilaya}`;

                const isDispatchedOrBeyond =
                  order.status === "dispatched" ||
                  order.status === "in_transit" ||
                  order.status === "delivered" ||
                  order.status === "rto_in_transit" ||
                  order.status === "returned_to_supplier" ||
                  !!order.trackingNumber;

                return (
                  <tr
                    key={order.id}
                    data-testid="admin-order-row"
                    className="hover:bg-neutral-50/70 transition-colors"
                  >
                    {/* ID & Date */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-bold text-neutral-900 hover:text-rose-600 underline decoration-neutral-300 underline-offset-2"
                        >
                          {order.id.slice(0, 8)}...
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopy(`table-id-${order.id}`, order.id)}
                          className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                          title={isArabic ? "نسخ معرف الطلبية" : isEnglish ? "Copy Order ID" : "Copier ID de la commande"}
                          aria-label="Copier ID"
                        >
                          {copiedId === `table-id-${order.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {formatDateTime(order.createdAt, lang)}
                      </div>
                    </td>

                    {/* Customer & Location */}
                    <td className="px-4 py-3.5 font-sans">
                      <div className="font-semibold text-neutral-900">
                        {order.customerName}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-mono mt-0.5">
                        <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span dir="ltr">{order.customerPhone}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(`table-phone-${order.id}`, order.customerPhone)}
                          className="p-0.5 text-neutral-400 hover:text-neutral-700"
                          title={isArabic ? "نسخ الهاتف" : isEnglish ? "Copy Phone" : "Copier le numéro"}
                        >
                          {copiedId === `table-phone-${order.id}` ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        {wilayaDisplay} &bull; {order.commune}
                      </div>
                    </td>

                    {/* Product & Quantity */}
                    <td className="px-4 py-3.5 font-sans">
                      <div className="font-medium text-neutral-900 line-clamp-1 max-w-[170px]">
                        {order.productName || order.productId.slice(0, 8)}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        {order.quantity} {isArabic ? "قطعة" : isEnglish ? "unit(s)" : "unité(s)"}
                      </div>
                    </td>

                    {/* Supplier & Affiliate Dual Identity */}
                    <td className="px-4 py-3.5 font-sans">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 text-[11px] font-medium">
                        <Store className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[130px]">
                          {order.supplierName || order.supplierId.slice(0, 8)}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/80 text-[11px] font-medium mt-1">
                        <TrendingUp className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[130px]">
                          {order.affiliateName || order.affiliateId.slice(0, 8)}
                        </span>
                      </div>
                    </td>

                    {/* Status & Tracking */}
                    <td className="px-4 py-3.5 font-sans">
                      <StatusBadge status={order.status as OrderStatus} lang={lang} size="sm" />
                      {order.trackingNumber ? (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-700 mt-1">
                          <Truck className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>{order.trackingNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(`table-track-${order.id}`, order.trackingNumber!)}
                            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                            title={isArabic ? "نسخ رقم التتبع" : isEnglish ? "Copy Tracking #" : "Copier le numéro de suivi"}
                          >
                            {copiedId === `table-track-${order.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-neutral-400 mt-1 italic">
                          {isArabic ? "بدون تتبع" : isEnglish ? "Unassigned" : "Non assigné"}
                        </div>
                      )}
                    </td>

                    {/* Financial CPA Split */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-neutral-900">
                        {formatDZD(order.cpaCommission, lang)}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Fee: {formatDZD(order.platformFee, lang)}
                      </div>
                    </td>

                    {/* Operational Actions */}
                    <td className="px-4 py-3.5 text-end font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        {isDispatchedOrBeyond && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setWaybillOrder(order)}
                            className="h-7 px-2 text-xs flex items-center gap-1 text-purple-700 hover:bg-purple-50"
                            title={isArabic ? "معاينة بوليصة الشحن" : isEnglish ? "Yalidine Waybill" : "Bordereau Yalidine"}
                          >
                            <FileText className="w-3 h-3" />
                            <span>{isArabic ? "بوليصة" : isEnglish ? "Waybill" : "Bordereau"}</span>
                          </Button>
                        )}
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2.5 text-xs flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isArabic ? "تفاصيل" : isEnglish ? "Details" : "Détails"}</span>
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Standardized Header */}
            <AdminPageHeader
              eyebrow={isArabic ? "سجل طلبيات المنظومة" : isEnglish ? "Order Operations" : "Global Order Operations"}
              title={
                isArabic
                  ? "إدارة الطلبيات والمتابعة اللوجستية"
                  : isEnglish
                  ? "Order Supervision & Tracking"
                  : "Gestion & Suivi des Commandes"
              }
              description={
                isArabic
                  ? "مراقبة مسار طلبيات الدفع عند الاستلام وحالات شركات التوصيل وحساب العمولات."
                  : isEnglish
                  ? "Real-time COD order tracking, courier delivery statuses, and financial commissions."
                  : "Suivi en temps réel des flux COD, statuts de livraison et décomptes financiers."
              }
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchOrders}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 text-xs font-medium"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>{isArabic ? "تحديث" : isEnglish ? "Refresh" : "Actualiser"}</span>
                </Button>
              }
            />

            {/* Filters Bar */}
            <OrderFilters
              filters={filters}
              onChange={(newFilters) => setFilters({ ...newFilters, offset: 0 })}
              onReset={handleReset}
              lang={lang}
            />

            {/* Responsive Order List */}
            <ResponsiveAdminList
              items={orders}
              total={total}
              isLoading={isLoading}
              error={error}
              page={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              renderTable={renderDesktopTable}
              renderCard={renderMobileCard}
              emptyIcon={<ShoppingBag className="w-8 h-8 text-neutral-300" />}
              emptyTitle={
                isArabic
                  ? "لم يتم العثور على أي طلبيات"
                  : isEnglish
                  ? "No orders found"
                  : "Aucune commande trouvée"
              }
              emptyDescription={
                isArabic
                  ? "جرب تعديل خيارات البحث أو إعادة التعيين."
                  : isEnglish
                  ? "Try modifying your search filters or resetting."
                  : "Essayez de modifier vos filtres de recherche."
              }
              lang={lang}
              title={isArabic ? "قائمة الطلبيات" : isEnglish ? "Orders List" : "Commandes"}
            />

            {/* Waybill (Bordereau) Modal */}
            <OrderWaybillModal
              order={waybillOrder}
              isOpen={!!waybillOrder}
              onClose={() => setWaybillOrder(null)}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
