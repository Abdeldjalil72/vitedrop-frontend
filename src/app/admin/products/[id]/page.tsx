"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  ProductStatusModal,
  ProductTargetStatus,
} from "@/components/admin/product-status-modal";
import {
  apiGetAdminProduct,
  apiGetProductPerformance,
  AdminProductItem,
} from "@/lib/api-client";
import { formatDZD, formatDateTime } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import {
  ArrowLeft,
  Package,
  Layers,
  Store,
  PauseCircle,
  ShieldCheck,
  Archive,
  AlertTriangle,
  TrendingUp,
  Percent,
  CheckCircle2,
} from "lucide-react";

export default function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<AdminProductItem | null>(null);
  const [performance, setPerformance] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status modal
  const [modalTargetStatus, setModalTargetStatus] = useState<ProductTargetStatus | null>(
    null
  );

  const fetchProduct = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodData, perfData] = await Promise.all([
        apiGetAdminProduct(id),
        apiGetProductPerformance(id).catch(() => null),
      ]);
      setProduct(prodData);
      setPerformance(perfData);
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement du produit.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  return (
    <DashboardLayout initialRole="admin" initialLang="fr">
      {({ lang }) => {
        const isArabic = lang === "ar";

        if (isLoading) {
          return (
            <div className="space-y-6">
              <div className="h-8 bg-neutral-200 rounded-lg w-48 animate-pulse" />
              <div className="h-64 bg-neutral-100 rounded-xl animate-pulse" />
            </div>
          );
        }

        if (error || !product) {
          return (
            <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 space-y-4">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <h2 className="text-lg font-bold text-neutral-900">
                {isArabic ? "المنتج غير موجود" : "Produit introuvable"}
              </h2>
              <p className="text-xs text-neutral-500">{error}</p>
              <Link href="/admin/products">
                <Button variant="secondary" size="sm">
                  {isArabic ? "العودة لقائمة المنتجات" : "Retour aux produits"}
                </Button>
              </Link>
            </div>
          );
        }

        return (
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <Link href="/admin/products">
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 truncate">
                      {product.name}
                    </h1>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        product.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : product.status === "suspended"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {product.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">ID: {product.id}</p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {product.status === "active" ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setModalTargetStatus("suspended")}
                    className="min-h-[40px] sm:min-h-0 text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    {isArabic ? "تعليق تشغيلي" : "Suspendre Produit"}
                  </Button>
                ) : product.status === "suspended" ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setModalTargetStatus("active")}
                    className="min-h-[40px] sm:min-h-0 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isArabic ? "إعادة تفعيل" : "Réactiver Produit"}
                  </Button>
                ) : null}

                {product.status !== "archived" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setModalTargetStatus("archived")}
                    className="min-h-[40px] sm:min-h-0 text-xs text-rose-700 hover:bg-rose-50 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    {isArabic ? "أرشفة" : "Archiver"}
                  </Button>
                )}
              </div>
            </div>

            {/* Performance KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-xl border border-neutral-200/80 shadow-xs">
                <span className="text-xs font-semibold text-neutral-500 block mb-1">
                  {isArabic ? "سعر التجزئة للجمهور" : "Prix Public"}
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">
                  {formatDZD(product.retailPrice, lang)}
                </span>
              </div>

              <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-xl border border-neutral-200/80 shadow-xs">
                <span className="text-xs font-semibold text-neutral-500 block mb-1">
                  {isArabic ? "العمولة الإجمالية (CPA)" : "CPA Brut Fournisseur"}
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-700">
                  {formatDZD(product.supplierTotalCpa, lang)}
                </span>
                <div className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-1 truncate">
                  Aff: {formatDZD(product.affiliateNetPayout, lang)} &bull; Fee:{" "}
                  {formatDZD(product.platformFee, lang)}
                </div>
              </div>

              <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-xl border border-neutral-200/80 shadow-xs">
                <span className="text-xs font-semibold text-neutral-500 block mb-1">
                  {isArabic ? "المخزون المتوفر" : "Stock Disponible"}
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">
                  {product.stock}
                </span>
                <div className="text-[10px] sm:text-[11px] text-neutral-500 font-mono mt-1">
                  {product.reservedStock || 0} {isArabic ? "محجوز للطلبيات" : "unités réservées"}
                </div>
              </div>

              <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-xl border border-neutral-200/80 shadow-xs">
                <span className="text-xs font-semibold text-neutral-500 block mb-1">
                  {isArabic ? "معدل التسليم" : "Taux de Livraison"}
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-sky-700">
                  {performance?.deliveryRate !== undefined
                    ? `${performance.deliveryRate.toFixed(1)}%`
                    : "—"}
                </span>
                <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1">
                  {performance?.deliveredOrders || 0} / {performance?.totalOrders || 0}{" "}
                  {isArabic ? "تم تسليمها" : "livrées"}
                </div>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="bg-white rounded-xl border border-neutral-200/80 p-3.5 sm:p-5 lg:p-6 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
                {isArabic ? "معلومات المنتج والمورد" : "Détails du Produit & Fournisseur"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-neutral-500 font-medium">
                      {isArabic ? "الوصف:" : "Description:"}
                    </span>
                    <p className="text-neutral-800 mt-1">
                      {product.description || (isArabic ? "لا يوجد وصف" : "Aucune description")}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-medium">
                      {isArabic ? "تاريخ الإضافة:" : "Date de création:"}
                    </span>
                    <p className="font-mono text-neutral-800 mt-1">
                      {formatDateTime(product.createdAt, lang)}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-purple-800">
                    <Store className="w-4 h-4" />
                    <span>{isArabic ? "المورد المسؤول" : "Fournisseur Titulaire"}</span>
                  </div>
                  <div className="font-mono text-neutral-600">
                    ID: {product.supplierId}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {isArabic
                      ? "رصيد الضمان يغطي الالتزامات المالية للطلبيات الصادرة لهذا المنتج."
                      : "Le solde escrow du fournisseur garantit le règlement des commissions CPA."}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Modal */}
            <ProductStatusModal
              product={product}
              targetStatus={modalTargetStatus}
              isOpen={!!modalTargetStatus}
              onClose={() => setModalTargetStatus(null)}
              onSuccess={fetchProduct}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
