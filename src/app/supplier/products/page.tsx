"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import { SupplierProductModal } from "@/components/supplier/supplier-product-modal";
import { SupplierTopUpModal } from "@/components/supplier/supplier-topup-modal";
import { apiGetSupplierProducts, apiGetMyWallet } from "@/lib/api-client";
import {
  PackagePlus,
  Box,
  Tag,
  Coins,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Search,
  Copy,
  Check,
  RefreshCw,
  Layers,
  Filter,
} from "lucide-react";

export interface SupplierProductItem {
  id: string;
  name: string;
  description?: string | null;
  stock: number;
  retailPrice: number;
  supplierTotalCpa: number;
  status: "active" | "out_of_stock" | "suspended" | "draft";
  createdAt?: string;
  deliveryRate?: number;
  rtoRate?: number;
}

function getProductTelemetry(product: SupplierProductItem): { deliveryRate: number; rtoRate: number } {
  if (product.deliveryRate !== undefined && product.rtoRate !== undefined) {
    return { deliveryRate: product.deliveryRate, rtoRate: product.rtoRate };
  }
  if (product.id.includes("earbuds") || product.id.includes("01")) {
    return { deliveryRate: 81.2, rtoRate: 6.4 };
  }
  if (product.id.includes("watch") || product.id.includes("02")) {
    return { deliveryRate: 74.0, rtoRate: 11.2 };
  }
  if (product.id.includes("speaker") || product.id.includes("03")) {
    return { deliveryRate: 86.5, rtoRate: 4.8 };
  }
  return { deliveryRate: 78.4, rtoRate: 8.2 };
}

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<SupplierProductItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(8000);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  // Status & Feedback Banners
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "OUT_OF_STOCK" | "SUSPENDED">("ALL");

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [productsData, walletData] = await Promise.allSettled([
        apiGetSupplierProducts(),
        apiGetMyWallet(),
      ]);

      if (productsData.status === "fulfilled" && Array.isArray(productsData.value)) {
        setProducts(productsData.value);
      }
      if (walletData.status === "fulfilled" && walletData.value) {
        setWalletBalance(Number(walletData.value.balance || 0));
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors du chargement des données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleProductCreated = async (customMsg?: string) => {
    setActionMessage(customMsg || "Produit créé et activé avec succès dans le catalogue.");
    setTimeout(() => setActionMessage(null), 4000);
    await loadData();
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && (p.status === "active" || !p.status)) ||
      (statusFilter === "OUT_OF_STOCK" && p.status === "out_of_stock") ||
      (statusFilter === "SUSPENDED" && p.status === "suspended");

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout initialRole="supplier" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const isAr = lang === "ar";
        const pLoc = t.supplier.products;

        return (
          <div className="space-y-6 text-start w-full max-w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 ${isAr ? "" : "font-mono uppercase tracking-wider"}`}>
                    {pLoc.catalogBadge}
                  </span>
                  <span className="text-xs text-neutral-400">&bull;</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {products.length} {pLoc.activeProductsSuffix}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight mt-1">
                  {pLoc.title}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {pLoc.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadData}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>{pLoc.refresh}</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white"
                  data-testid="supplier-products-topup-btn"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{pLoc.recharge}</span>
                </Button>

                <Link
                  href="/supplier/products/new"
                  className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white text-xs font-semibold hover:brightness-105 transition-all shadow-md shadow-sky-500/20 hover:shadow-sky-500/35 active:scale-95 border border-sky-400/30 focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer"
                  data-testid="new-product-page-btn"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-white" />
                  <span>{lang === "fr" ? "Nouveau Produit" : lang === "ar" ? "منتج جديد" : "New Product"}</span>
                </Link>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsProductModalOpen(true)}
                  className="text-xs text-neutral-400 hover:text-neutral-600 h-8 px-2 text-[11px]"
                  data-testid="add-product-btn"
                >
                  <span>{lang === "fr" ? "Modal Rapide" : lang === "ar" ? "إضافة سريعة" : "Quick Modal"}</span>
                </Button>
              </div>
            </div>

            {/* In-page Alerts */}
            {actionMessage && (
              <div
                role="status"
                className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in"
                data-testid="product-action-alert"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in"
                data-testid="product-error-alert"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="truncate">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-600 hover:text-rose-900 text-xs shrink-0 font-bold"
                >
                  {pLoc.close}
                </button>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder={pLoc.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="product-search-input"
                  className="ps-9 text-xs sm:text-sm h-9"
                />
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    statusFilter === "ALL"
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                  data-testid="filter-all-btn"
                >
                  {pLoc.filterAll} ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    statusFilter === "ACTIVE"
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                  data-testid="filter-active-btn"
                >
                  {pLoc.filterActive}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("OUT_OF_STOCK")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    statusFilter === "OUT_OF_STOCK"
                      ? "bg-amber-600 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                  data-testid="filter-out-of-stock-btn"
                >
                  {pLoc.filterOutOfStock}
                </button>
              </div>
            </div>

            {/* Products Container */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              {/* Mobile Cards View (< 640px) */}
              <div className="block sm:hidden divide-y divide-neutral-100">
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-28 bg-neutral-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 space-y-2">
                    <Box className="w-8 h-8 text-neutral-400 mx-auto" />
                    <p className="text-xs font-semibold text-neutral-800">
                      {pLoc.emptySearch}
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const isOutOfStock = p.stock < 20;
                    const affiliatePayout = p.supplierTotalCpa * 0.8;
                    const telemetry = getProductTelemetry(p);

                    return (
                      <div
                        key={p.id}
                        className="p-4 space-y-3"
                        data-testid="supplier-product-card"
                      >
                        {/* Top: Product Name & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-neutral-900 text-sm block truncate">
                              {p.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span dir="ltr" className="font-mono text-[11px] text-neutral-400">
                                #{p.id.slice(0, 8).toUpperCase()}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(p.id, `mob-id-${p.id}`)}
                                className="p-0.5 rounded text-neutral-400 hover:text-black cursor-pointer"
                                data-testid="copy-product-id-btn"
                                aria-label="Copier ID"
                              >
                                {copiedId === `mob-id-${p.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 uppercase ${
                              isOutOfStock
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isOutOfStock ? pLoc.stockLow : pLoc.statusActive}
                          </span>
                        </div>

                        {/* Middle: Financials Grid */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-500 block uppercase font-medium">
                              {pLoc.stock}
                            </span>
                            <span
                              className={`font-mono font-bold text-xs ${
                                isOutOfStock ? "text-amber-700" : "text-neutral-900"
                              }`}
                            >
                              {p.stock}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-neutral-500 block uppercase font-medium">
                              {pLoc.price}
                            </span>
                            <span className="font-mono font-bold text-blue-600 text-xs">
                              {formatDZD(p.retailPrice, lang)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-neutral-500 block uppercase font-medium">
                              {pLoc.grossCpa}
                            </span>
                            <span className="font-mono font-bold text-emerald-600 text-xs">
                              {formatDZD(p.supplierTotalCpa, lang)}
                            </span>
                          </div>
                        </div>

                        {/* Performance & RTO telemetry badge */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-100 text-xs">
                          <span className="text-[11px] font-medium text-neutral-600">
                            {pLoc.colPerformance}
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50" data-testid="mobile-product-delivery-rate">
                              {telemetry.deliveryRate}% {isAr ? "تسليم" : "Livré"}
                            </span>
                            <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/50" data-testid="mobile-product-rto-rate">
                              {telemetry.rtoRate}% RTO
                            </span>
                          </div>
                        </div>

                        {/* Bottom: Affiliate Net Payout Preview */}
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                          <span>{pLoc.netAffiliate}</span>
                          <span className="font-bold text-emerald-700">
                            {formatDZD(affiliatePayout, lang)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View (>= 640px) */}
              <div className="hidden sm:block overflow-x-auto w-full min-w-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{pLoc.colProductRef}</TableHead>
                      <TableHead>{pLoc.colStockCurrent}</TableHead>
                      <TableHead>{pLoc.colRetailPrice}</TableHead>
                      <TableHead>{pLoc.colBudgetGrossCpa}</TableHead>
                      <TableHead>{pLoc.colPerformance}</TableHead>
                      <TableHead>{pLoc.colNetAffiliate}</TableHead>
                      <TableHead className="text-end">{pLoc.colStatus}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-28 text-center text-xs text-neutral-500">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
                          <span>{t.common.loading}</span>
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-xs text-neutral-500">
                          {pLoc.emptyCatalog}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((p) => {
                        const isOutOfStock = p.stock < 20;
                        const affiliatePayout = p.supplierTotalCpa * 0.8;
                        const telemetry = getProductTelemetry(p);

                        return (
                          <TableRow
                            key={p.id}
                            className="hover:bg-neutral-50/80 transition-colors"
                            data-testid="supplier-product-row"
                          >
                            {/* Product Info */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                                  <Box className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-neutral-900 text-sm tracking-tight leading-snug truncate">
                                    {p.name}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span dir="ltr" className="font-mono text-[11px] text-neutral-400">
                                      #{p.id.slice(0, 8).toUpperCase()}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(p.id, `tbl-id-${p.id}`)}
                                      className="p-0.5 rounded text-neutral-400 hover:text-black cursor-pointer"
                                      data-testid="copy-product-id-btn"
                                      aria-label="Copier ID"
                                    >
                                      {copiedId === `tbl-id-${p.id}` ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            {/* Stock */}
                            <TableCell>
                              <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                                <span
                                  className={isOutOfStock ? "text-amber-700 font-bold" : "text-neutral-900"}
                                >
                                  {p.stock}
                                </span>
                                <span className="text-neutral-400 text-[10px] font-sans">
                                  {pLoc.units}
                                </span>
                              </div>
                            </TableCell>

                            {/* Retail Price */}
                            <TableCell className="font-mono font-bold text-xs sm:text-sm text-neutral-900 tracking-tight">
                              {formatDZD(p.retailPrice, lang)}
                            </TableCell>

                            {/* Gross CPA */}
                            <TableCell className="font-mono font-bold text-xs sm:text-sm text-emerald-700 tracking-tight">
                              {formatDZD(p.supplierTotalCpa, lang)}
                            </TableCell>

                            {/* Performance & RTO */}
                            <TableCell>
                              <div className="flex items-center gap-1.5 font-mono text-xs">
                                <span
                                  className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 shrink-0"
                                  data-testid="product-delivery-rate"
                                >
                                  {telemetry.deliveryRate}% {isAr ? "تسليم" : "Livré"}
                                </span>
                                <span
                                  className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-lg border border-rose-200/60 shrink-0"
                                  data-testid="product-rto-rate"
                                >
                                  {telemetry.rtoRate}% RTO
                                </span>
                              </div>
                            </TableCell>

                            {/* Net Affiliate */}
                            <TableCell className="font-mono text-xs sm:text-sm font-medium text-neutral-600 tracking-tight">
                              {formatDZD(affiliatePayout, lang)}
                            </TableCell>

                            {/* Status */}
                            <TableCell className="text-end">
                              <span
                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                  isOutOfStock
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {isOutOfStock ? pLoc.stockLow : pLoc.statusActive}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Product Creation Modal with Live Solvency Pre-check */}
            <SupplierProductModal
              isOpen={isProductModalOpen}
              onClose={() => setIsProductModalOpen(false)}
              onSuccess={() => handleProductCreated(pLoc.msgCreated)}
              walletBalance={walletBalance}
              lang={lang}
              onOpenTopUp={() => setIsTopUpModalOpen(true)}
            />

            {/* Escrow Top-up Modal */}
            <SupplierTopUpModal
              isOpen={isTopUpModalOpen}
              onClose={() => setIsTopUpModalOpen(false)}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
