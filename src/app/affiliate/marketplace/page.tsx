"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { ModernSelect } from "@/components/ui/modern-select";
import { TrackingLinkModal } from "@/components/affiliate/tracking-link-modal";
import { apiGetMarketplaceProducts } from "@/lib/api-client";
import { Product } from "@/types";
import { formatDZD } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import {
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  Link2,
  Package,
  ArrowUpRight,
  ShieldCheck,
  Check,
  RefreshCw,
} from "lucide-react";

export default function AffiliateMarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"cpa" | "price-asc" | "price-desc" | "newest">("cpa");
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);

  const loadBackendProducts = async () => {
    setIsLoading(true);
    try {
      const liveProducts = await apiGetMarketplaceProducts();
      if (Array.isArray(liveProducts)) {
        const mapped: Product[] = liveProducts.map((p) => ({
          id: p.id,
          title: p.name,
          titleAr: p.name,
          description:
            p.description ||
            "Produit physique vérifié en entrepôt avec expédition immédiate dans les 58 Wilayas.",
          supplierId: p.supplierId || "supp-verified",
          supplierName: "Fournisseur Agréé DZ",
          retailPrice: Number(p.retailPrice) || 0,
          totalCpaBudget: 0,
          affiliateNetPayout: Number(p.affiliateNetPayout) || 0,
          platformFee: 0,
          image:
            p.imageUrl ||
            p.image ||
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80",
          gallery: [
            p.imageUrl ||
            p.image ||
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80",
          ],
          stock: p.stock ?? 0,
          category: p.category || "Général",
          status: p.status || "active",
          createdAt: p.createdAt || new Date().toISOString(),
        }));

        setProducts(mapped);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.warn("Failed to load live marketplace products from backend:", err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackendProducts();
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === "all" || p.category === selectedCategory;
        const q = search.toLowerCase().trim();
        const matchesSearch =
          !q ||
          p.title.toLowerCase().includes(q) ||
          (p.titleAr && p.titleAr.includes(q)) ||
          p.description.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "cpa") return b.affiliateNetPayout - a.affiliateNetPayout;
        if (sortBy === "price-asc") return a.retailPrice - b.retailPrice;
        if (sortBy === "price-desc") return b.retailPrice - a.retailPrice;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, search, selectedCategory, sortBy]);

  return (
    <DashboardLayout initialRole="affiliate" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];

        const categoryTabs = categories.map((c) => ({
          id: c,
          label: c === "all" ? t.marketplace.allCategories : c,
        }));

        return (
          <div className="space-y-8 text-start w-full max-w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs ${lang === "ar" ? "" : "font-mono uppercase tracking-wider"} text-sky-700 font-semibold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100`}>
                    Sourced Stock DZ
                  </span>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    58 Wilayas COD
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight mt-1">
                  {t.marketplace.title}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl">
                  {t.marketplace.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold border border-emerald-200/60">
                  {filteredProducts.length} {lang === "ar" ? "منتج رابح" : lang === "en" ? "products available" : "produits disponibles"}
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-3xl border border-black/[0.08] shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t.marketplace.searchPlaceholder}
                    data-testid="marketplace-search-input"
                    className="w-full bg-[#fafafa] rounded-2xl border border-black/10 py-2.5 ps-10 pe-4 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  />
                </div>

                {/* Modern Animated Sort Selector */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-neutral-600 hidden sm:inline">
                    {t.marketplace.sortBy}:
                  </span>
                  <div className="w-full sm:min-w-[190px]">
                    <ModernSelect
                      value={sortBy}
                      onChange={(val) => setSortBy(val as any)}
                      options={[
                        {
                          value: "cpa",
                          label: t.marketplace.sortHighestCpa,
                          badge: "Top CPA",
                          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                        },
                        {
                          value: "price-asc",
                          label: t.marketplace.sortLowestPrice,
                          badge: "DZD ↑",
                        },
                        {
                          value: "price-desc",
                          label: t.marketplace.sortHighestPrice,
                          badge: "DZD ↓",
                        },
                        {
                          value: "newest",
                          label: t.marketplace.sortNewest,
                          badge: "New",
                          badgeColor: "bg-sky-50 text-sky-700 border-sky-200/60",
                        },
                      ]}
                      icon={<ArrowUpDown className="w-3.5 h-3.5 text-sky-600" />}
                      nativeSelectTestId="marketplace-sort-select"
                      data-testid="marketplace-sort-dropdown"
                      triggerClassName="w-full py-2 px-3 rounded-2xl bg-[#fafafa] hover:bg-white text-xs border-black/10"
                      menuClassName="min-w-[220px]"
                      align="end"
                    />
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div className="overflow-x-auto pb-1 pt-1">
                <Tabs
                  tabs={categoryTabs}
                  activeTab={selectedCategory}
                  onChange={setSelectedCategory}
                  layoutId="marketplace-cat-pill"
                />
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
                <p className="text-xs font-medium text-neutral-500">
                  {lang === "ar"
                    ? "جاري تحميل المنتجات من قاعدة البيانات..."
                    : lang === "en"
                    ? "Loading real-time catalog..."
                    : "Chargement du catalogue en direct..."}
                </p>
              </div>
            )}

            {/* Product Cards Grid */}
            {!isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((p) => (
                  <Card
                    key={p.id}
                    enableHover
                    data-testid="marketplace-product-card"
                    className="overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Area */}
                      <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100 rounded-2xl">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 start-3">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 backdrop-blur-xs text-neutral-800 shadow-xs border border-black/[0.04]">
                            {p.category}
                          </span>
                        </div>
                        <div className="absolute top-3 end-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${p.stock > 50
                                ? "bg-emerald-500/90 text-white"
                                : "bg-amber-500/90 text-white"
                              }`}
                          >
                            {p.stock} {t.marketplace.inStock}
                          </span>
                        </div>
                      </div>

                      {/* Product Meta */}
                      <div className="p-6 pb-2 space-y-2">
                        <h3 className="font-bold text-base text-neutral-900 tracking-tight leading-snug line-clamp-2">
                          {lang === "ar" && p.titleAr ? p.titleAr : p.title}
                        </h3>
                        <p className="text-xs text-[#6b6b6b] line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    </div>

                    {/* Financial Metrics & Actions Footer */}
                    <div className="p-6 pt-4 border-t border-black/[0.06] space-y-4">
                      <div className="flex items-center justify-between">
                        {/* Retail Price */}
                        <div>
                          <span className="text-[11px] text-[#6b6b6b] block">
                            {t.marketplace.retailPrice}
                          </span>
                          <span className="text-sm font-mono font-semibold text-neutral-800">
                            {formatDZD(p.retailPrice, lang)}
                          </span>
                        </div>

                        {/* Affiliate Net CPA */}
                        <div className="text-end">
                          <span className="text-lg font-mono font-bold text-emerald-600 tracking-tight block">
                            +{formatDZD(p.affiliateNetPayout, lang)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Link href={`/affiliate/marketplace/${p.id}`} className="w-full">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full min-h-[40px] text-xs flex items-center justify-center"
                            data-testid="view-product-details-btn"
                          >
                            {t.marketplace.viewDetails}
                          </Button>
                        </Link>

                        <Button
                          size="sm"
                          className="w-full min-h-[40px] text-xs"
                          onClick={() => setActiveModalProduct(p)}
                          data-testid="generate-link-btn"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>{t.marketplace.generateLink}</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredProducts.length === 0 && (
              <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-black/10">
                <Package className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-neutral-800">
                  {lang === "ar" ? "لا توجد منتجات متاحة حالياً" : lang === "en" ? "No products available" : "Aucun produit disponible"}
                </h4>
                <p className="text-xs text-[#6b6b6b] mt-1 max-w-sm mx-auto">
                  {lang === "ar"
                    ? "لم يتم العثور على منتجات في قاعدة البيانات."
                    : lang === "en"
                    ? "No active products found in the catalog right now."
                    : "Aucun produit actif n'a été trouvé dans la base de données pour le moment."}
                </p>
              </div>
            )}

            {/* Tracking Link Generator Modal */}
            <TrackingLinkModal
              isOpen={!!activeModalProduct}
              onClose={() => setActiveModalProduct(null)}
              product={activeModalProduct}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
