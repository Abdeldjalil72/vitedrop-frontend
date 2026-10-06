"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { TrackingLinkModal } from "@/components/affiliate/tracking-link-modal";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
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
} from "lucide-react";

export default function AffiliateMarketplacePage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"cpa" | "price-asc" | "price-desc" | "newest">("cpa");
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function loadBackendProducts() {
      try {
        const liveProducts = await apiGetMarketplaceProducts();
        if (Array.isArray(liveProducts) && liveProducts.length > 0) {
          const mapped: Product[] = liveProducts.map((p) => ({
            id: p.id,
            title: p.name,
            titleAr: p.name,
            description:
              p.description ||
              "Produit physique vérifié en entrepôt avec expédition immédiate dans les 58 Wilayas.",
            supplierId: "supp-verified",
            supplierName: "Fournisseur Agréé DZ",
            retailPrice: Number(p.retailPrice) || 0,
            totalCpaBudget: 0,
            affiliateNetPayout: Number(p.affiliateNetPayout) || 0,
            platformFee: 0,
            image:
              "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80",
            gallery: [
              "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80",
            ],
            stock: p.stock ?? 100,
            category: "Électronique & Soins",
            status: "active",
            createdAt: new Date().toISOString(),
          }));

          setProducts((prev) => {
            const existingIds = new Set(prev.map((x) => x.id));
            const newOnes = mapped.filter((x) => !existingIds.has(x.id));
            return [...newOnes, ...prev];
          });
        }
      } catch {
        // Fallback to MOCK_PRODUCTS
      }
    }
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
          <div className="space-y-8 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-sky-600 font-bold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                    Sourced Stock DZ
                  </span>
                  <span className="text-xs text-[#6b6b6b]">
                    58 Wilayas COD
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                  {t.marketplace.title}
                </h1>
                <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1 max-w-2xl">
                  {t.marketplace.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold border border-emerald-200/60">
                  {filteredProducts.length} {lang === "ar" ? "منتج رابح" : "produits disponibles"}
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
                    className="w-full bg-[#fafafa] rounded-2xl border border-black/10 py-2.5 ps-10 pe-4 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  />
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 shrink-0">
                  <ArrowUpDown className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-700">
                    {t.marketplace.sortBy}:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[#fafafa] border border-black/10 rounded-2xl py-2 px-3 text-xs font-medium text-neutral-900 focus:outline-none focus:border-sky-500"
                  >
                    <option value="cpa">{t.marketplace.sortHighestCpa}</option>
                    <option value="price-asc">{t.marketplace.sortLowestPrice}</option>
                    <option value="price-desc">{t.marketplace.sortHighestPrice}</option>
                    <option value="newest">{t.marketplace.sortNewest}</option>
                  </select>
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

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <Card
                  key={p.id}
                  enableHover
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
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            p.stock > 50
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

                      {/* Affiliate Net CPA (80%) */}
                      <div className="text-end">
                        <span className="text-[11px] text-[#6b6b6b] block">
                          {t.marketplace.netPayout}
                        </span>
                        <span className="text-lg font-mono font-bold text-emerald-600">
                          +{formatDZD(p.affiliateNetPayout, lang)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link href={`/affiliate/marketplace/${p.id}`} className="w-full">
                        <Button variant="secondary" size="sm" className="w-full text-xs">
                          {t.marketplace.viewDetails}
                        </Button>
                      </Link>

                      <Button
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setActiveModalProduct(p)}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{t.marketplace.generateLink}</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-black/10">
                <Package className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-neutral-800">
                  {lang === "ar" ? "لا توجد منتجات مطابقة" : "Aucun produit trouvé"}
                </h4>
                <p className="text-xs text-[#6b6b6b] mt-1 max-w-sm mx-auto">
                  {lang === "ar"
                    ? "جرب استخدام كلمات بحث أخرى أو اختر صنفاً مختلفاً."
                    : "Essayez de modifier vos filtres de recherche ou sélectionnez une autre catégorie."}
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
