"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  ProductStatusModal,
  ProductTargetStatus,
} from "@/components/admin/product-status-modal";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveAdminList } from "@/components/admin/responsive-admin-list";
import {
  apiGetAdminProducts,
  AdminProductItem,
  AdminProductQuery,
} from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import {
  Package,
  Search,
  RefreshCw,
  Eye,
  ShieldCheck,
  PauseCircle,
  Archive,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AdminProductQuery>({
    limit: 20,
    offset: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalProduct, setModalProduct] = useState<AdminProductItem | null>(null);
  const [modalTargetStatus, setModalTargetStatus] = useState<ProductTargetStatus | null>(
    null
  );

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGetAdminProducts(filters);
      setProducts(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement des produits.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openStatusModal = (
    product: AdminProductItem,
    target: ProductTargetStatus
  ) => {
    setModalProduct(product);
    setModalTargetStatus(target);
  };

  const handlePageChange = (newPage: number) => {
    const limit = filters.limit || 20;
    const newOffset = (newPage - 1) * limit;
    setFilters((prev) => ({ ...prev, offset: newOffset }));
  };

  const getProductBadge = (status: string, isArabic: boolean) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{isArabic ? "نشط" : "Actif"}</span>
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{isArabic ? "معلق" : "Suspendu"}</span>
          </span>
        );
      case "out_of_stock":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{isArabic ? "نفد المخزون" : "Rupture"}</span>
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            <span>{isArabic ? "مؤرشف" : "Archivé"}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
            {status}
          </span>
        );
    }
  };

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
  const totalPages = Math.ceil(total / (filters.limit || 20)) || 1;

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const isArabic = lang === "ar";

        const renderMobileCard = (product: AdminProductItem) => (
          <div className="space-y-2.5 text-xs text-start">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="font-bold text-neutral-900 hover:text-rose-600 text-sm line-clamp-1"
                >
                  {product.name}
                </Link>
                <div className="text-[11px] text-purple-700 font-medium">
                  {product.supplierName || product.supplierId.slice(0, 8)}
                </div>
              </div>
              <div className="shrink-0">{getProductBadge(product.status, isArabic)}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-neutral-100">
              <div>
                <span className="text-[10px] text-neutral-400 block">Prix Public</span>
                <span className="font-bold font-mono text-neutral-900">
                  {formatDZD(product.retailPrice, lang)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">CPA Brut</span>
                <span className="font-bold font-mono text-emerald-700">
                  {formatDZD(product.supplierTotalCpa, lang)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-neutral-100">
              <div className="text-[11px] font-mono">
                Stock: <span className="font-bold text-neutral-900">{product.stock}</span>{" "}
                <span className="text-neutral-400">({product.reservedStock || 0} res.)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Link href={`/admin/products/${product.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Eye className="w-3.5 h-3.5 text-neutral-500" />
                  </Button>
                </Link>

                {product.status === "active" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openStatusModal(product, "suspended")}
                    className="h-7 px-2 text-xs text-amber-700 hover:bg-amber-50"
                  >
                    <PauseCircle className="w-3.5 h-3.5 me-1" />
                    <span>{isArabic ? "تعليق" : "Suspendre"}</span>
                  </Button>
                ) : product.status === "suspended" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openStatusModal(product, "active")}
                    className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 me-1" />
                    <span>{isArabic ? "تفعيل" : "Réactiver"}</span>
                  </Button>
                ) : null}

                {product.status !== "archived" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openStatusModal(product, "archived")}
                    className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <Archive className="w-3.5 h-3.5 me-1" />
                    <span>{isArabic ? "أرشفة" : "Archiver"}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        );

        const renderDesktopTable = () => (
          <table className="w-full text-xs text-start">
            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-start">{isArabic ? "المنتج والمورد" : "Produit & Fournisseur"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "سعر التجزئة" : "Prix Public"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "العمولة الإجمالية (CPA)" : "CPA Brut"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "المخزون (متاح / محجوز)" : "Stock (Dispo / Réservé)"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "الحالة" : "Statut"}</th>
                <th className="px-4 py-3 text-end">{isArabic ? "إجراءات التحكم" : "Actions Opérationnelles"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="px-4 py-3 font-sans">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-bold text-neutral-900 hover:text-rose-600 line-clamp-1"
                    >
                      {product.name}
                    </Link>
                    <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                      {product.supplierName || product.supplierId.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-neutral-900">
                    {formatDZD(product.retailPrice, lang)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-emerald-700">
                      {formatDZD(product.supplierTotalCpa, lang)}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Net Aff: {formatDZD(product.affiliateNetPayout, lang)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span
                        className={
                          product.stock > 10 ? "text-neutral-900" : "text-amber-600"
                        }
                      >
                        {product.stock}
                      </span>
                      <span className="text-neutral-300 font-normal">/</span>
                      <span className="text-neutral-500 font-normal">
                        {product.reservedStock || 0} res.
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    {getProductBadge(product.status, isArabic)}
                  </td>
                  <td className="px-4 py-3 text-end font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title={isArabic ? "تفاصيل" : "Détails"}
                        >
                          <Eye className="w-3.5 h-3.5 text-neutral-500" />
                        </Button>
                      </Link>

                      {product.status === "active" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatusModal(product, "suspended")}
                          className="h-7 px-2 text-xs text-amber-700 hover:bg-amber-50"
                        >
                          <PauseCircle className="w-3.5 h-3.5 me-1" />
                          <span>{isArabic ? "تعليق" : "Suspendre"}</span>
                        </Button>
                      ) : product.status === "suspended" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatusModal(product, "active")}
                          className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 me-1" />
                          <span>{isArabic ? "تفعيل" : "Réactiver"}</span>
                        </Button>
                      ) : null}

                      {product.status !== "archived" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatusModal(product, "archived")}
                          className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          <Archive className="w-3.5 h-3.5 me-1" />
                          <span>{isArabic ? "أرشفة" : "Archiver"}</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Header */}
            <AdminPageHeader
              eyebrow={isArabic ? "كتالوج المنصة والرقابة" : "Catalog Supervision"}
              title={isArabic ? "إدارة وتراخيص المنتجات" : "Supervision des Produits & Stock"}
              description={
                isArabic
                  ? "التحكم في تفعيل المنتجات، حجز المخزون، والتعليق التشغيلي عند الضرورة."
                  : "Contrôle du stock réservé, suspensions opérationnelles et suivi de la couverture escrow."
              }
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchProducts}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 text-xs font-medium"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>{isArabic ? "تحديث" : "Actualiser"}</span>
                </Button>
              }
            />

            {/* Filter Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={isArabic ? "بحث بالاسم أو المعرف..." : "Rechercher par nom..."}
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      search: e.target.value || undefined,
                      offset: 0,
                    }))
                  }
                  className="w-full ps-9 pe-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all font-mono"
                />
              </div>

              <div className="sm:w-48">
                <select
                  value={filters.status || "ALL"}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: e.target.value === "ALL" ? undefined : e.target.value,
                      offset: 0,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
                >
                  <option value="ALL">{isArabic ? "جميع الحالات" : "Tous les statuts"}</option>
                  <option value="active">{isArabic ? "نشط" : "Actif"}</option>
                  <option value="suspended">{isArabic ? "معلق" : "Suspendu"}</option>
                  <option value="out_of_stock">{isArabic ? "نفد المخزون" : "Rupture de Stock"}</option>
                  <option value="archived">{isArabic ? "مؤرشف" : "Archivé"}</option>
                </select>
              </div>
            </div>

            {/* Responsive Products List */}
            <ResponsiveAdminList
              items={products}
              total={total}
              isLoading={isLoading}
              error={error}
              page={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              renderTable={renderDesktopTable}
              renderCard={renderMobileCard}
              emptyIcon={<Package className="w-8 h-8 text-neutral-300" />}
              emptyTitle={isArabic ? "لا توجد منتجات مطابقة للبحث" : "Aucun produit trouvé"}
              lang={lang}
              title={isArabic ? "الكتالوج" : "Catalogue"}
            />

            {/* Status Modal */}
            <ProductStatusModal
              product={modalProduct}
              targetStatus={modalTargetStatus}
              isOpen={!!modalProduct && !!modalTargetStatus}
              onClose={() => {
                setModalProduct(null);
                setModalTargetStatus(null);
              }}
              onSuccess={fetchProducts}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
