"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderFilters } from "@/components/admin/order-filters";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveAdminList } from "@/components/admin/responsive-admin-list";
import {
  apiGetAdminOrders,
  AdminOrderListItem,
  AdminOrderQuery,
} from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import { OrderStatus } from "@/types";
import {
  ShoppingBag,
  RefreshCw,
  Truck,
  Eye,
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

        const renderMobileCard = (order: AdminOrderListItem) => (
          <div className="space-y-2 text-xs text-start">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-bold text-neutral-900 hover:text-rose-600 font-mono text-xs truncate"
                >
                  #{order.id.slice(0, 8)}...
                </Link>
                <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                  {formatDateTime(order.createdAt, lang)}
                </span>
              </div>
              <StatusBadge status={order.status as OrderStatus} lang={lang} size="sm" />
            </div>

            <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-neutral-100">
              <div className="min-w-0">
                <div className="font-semibold text-neutral-900 truncate">
                  {order.customerName}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  W{order.wilaya < 10 ? `0${order.wilaya}` : order.wilaya} &bull; {order.commune}
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

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-neutral-100 text-[11px]">
              <div className="min-w-0 flex items-center gap-1.5 text-neutral-600 truncate">
                <span className="font-medium text-neutral-800 truncate">
                  {order.productName || order.productId.slice(0, 8)}
                </span>
                <span className="text-neutral-400 font-mono shrink-0">x{order.quantity}</span>
              </div>
              <Link href={`/admin/orders/${order.id}`} className="shrink-0">
                <Button variant="secondary" size="sm" className="h-7 px-2 text-xs flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{isArabic ? "تفاصيل" : "Détails"}</span>
                </Button>
              </Link>
            </div>
          </div>
        );

        const renderDesktopTable = () => (
          <table className="w-full text-xs text-start">
            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-start">{isArabic ? "المعرف / التاريخ" : "ID & Date"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "العميل والولاية" : "Client & Wilaya"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "المنتج والكمية" : "Produit & Qte"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "الأطراف" : "Fournisseur / Affilié"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "الحالة والتتبع" : "Statut & Suivi"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "العمولة (CPA)" : "CPA & Frais"}</th>
                <th className="px-4 py-3 text-end">{isArabic ? "إجراء" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-bold text-neutral-900 hover:text-rose-600 underline decoration-neutral-300 underline-offset-2"
                    >
                      {order.id.slice(0, 8)}...
                    </Link>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      {formatDateTime(order.createdAt, lang)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <div className="font-semibold text-neutral-800">
                      {order.customerName}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      Wilaya {order.wilaya < 10 ? `0${order.wilaya}` : order.wilaya} &bull; {order.commune}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <div className="font-medium text-neutral-900 line-clamp-1 max-w-[180px]">
                      {order.productName || order.productId.slice(0, 8)}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {order.quantity} {isArabic ? "قطعة" : "unité(s)"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <div className="text-[11px] text-purple-700 font-medium">
                      S: {order.supplierName || order.supplierId.slice(0, 8)}
                    </div>
                    <div className="text-[11px] text-sky-700 font-medium mt-0.5">
                      A: {order.affiliateName || order.affiliateId.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <StatusBadge status={order.status as OrderStatus} lang={lang} size="sm" />
                    {order.trackingNumber ? (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-600 mt-1">
                        <Truck className="w-3 h-3 text-neutral-400" />
                        <span>{order.trackingNumber}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-400 mt-1 italic">
                        {isArabic ? "بدون تتبع" : "Non assigné"}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-neutral-900">
                      {formatDZD(order.cpaCommission, lang)}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Fee: {formatDZD(order.platformFee, lang)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-end font-sans">
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button variant="secondary" size="sm" className="h-7 px-2.5 text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{isArabic ? "تفاصيل" : "Détails"}</span>
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Standardized Header */}
            <AdminPageHeader
              eyebrow={isArabic ? "سجل طلبيات المنظومة" : "Global Order Operations"}
              title={isArabic ? "إدارة الطلبيات والمتابعة اللوجستية" : "Gestion & Suivi des Commandes"}
              description={
                isArabic
                  ? "مراقبة مسار طلبيات الدفع عند الاستلام وحالات شركات التوصيل وحساب العمولات."
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
                  <span>{isArabic ? "تحديث" : "Actualiser"}</span>
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
              emptyTitle={isArabic ? "لم يتم العثور على أي طلبيات" : "Aucune commande trouvée"}
              emptyDescription={
                isArabic
                  ? "جرب تعديل خيارات البحث أو إعادة التعيين."
                  : "Essayez de modifier vos filtres de recherche."
              }
              lang={lang}
              title={isArabic ? "قائمة الطلبيات" : "Commandes"}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
