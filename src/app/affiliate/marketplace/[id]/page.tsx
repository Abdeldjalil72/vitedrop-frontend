"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { TrackingLinkModal } from "@/components/affiliate/tracking-link-modal";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { ALGERIA_WILAYAS } from "@/lib/algeria-locations";
import { formatDZD } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import { apiGetProductDetails } from "@/lib/api-client";
import { Product } from "@/types";
import {
  ArrowLeft,
  ArrowRight,
  Link2,
  ShieldCheck,
  Truck,
  Sparkles,
  Package,
  Layers,
  ChevronDown,
} from "lucide-react";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | undefined>(() =>
    MOCK_PRODUCTS.find((p) => p.id === resolvedParams.id)
  );
  const [selectedImage, setSelectedImage] = useState<string>(
    product?.image || ""
  );
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [showAllWilayas, setShowAllWilayas] = useState(false);

  useEffect(() => {
    async function fetchLiveProduct() {
      try {
        const live = await apiGetProductDetails(resolvedParams.id);
        if (live && live.id) {
          const mapped: Product = {
            id: live.id,
            title: live.name,
            titleAr: live.name,
            description:
              live.description ||
              "Produit physique vérifié en entrepôt avec expédition immédiate dans les 58 Wilayas.",
            supplierId: "supp-verified",
            supplierName: "Fournisseur Agréé DZ",
            retailPrice: Number(live.retailPrice) || 0,
            totalCpaBudget: 0,
            affiliateNetPayout: Number(live.affiliateNetPayout) || 0,
            platformFee: 0,
            image:
              "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80",
            gallery: [
              "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80",
            ],
            stock: live.stock ?? 100,
            category: "Électronique & Soins",
            status: "active",
            createdAt: new Date().toISOString(),
          };
          setProduct(mapped);
          setSelectedImage(mapped.image);
        }
      } catch {
        // Fallback
      }
    }
    fetchLiveProduct();
  }, [resolvedParams.id]);

  if (!product) {
    return (
      <DashboardLayout initialRole="affiliate" initialLang="fr">
        {({ lang }) => (
          <div className="py-24 text-center space-y-4">
            <h2 className="text-xl font-bold text-neutral-900">
              Produit introuvable
            </h2>
            <Link href="/affiliate/marketplace">
              <Button size="sm">Retour au catalogue</Button>
            </Link>
          </div>
        )}
      </DashboardLayout>
    );
  }

  const displayedWilayas = showAllWilayas
    ? ALGERIA_WILAYAS
    : ALGERIA_WILAYAS.slice(0, 10);

  return (
    <DashboardLayout initialRole="affiliate" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];

        return (
          <div className="space-y-8 text-start">
            {/* Top Navigation Breadcrumb */}
            <div className="flex items-center justify-between">
              <Link
                href="/affiliate/marketplace"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#6b6b6b] hover:text-black transition-colors"
              >
                {lang === "ar" ? (
                  <ArrowRight className="w-4 h-4" />
                ) : (
                  <ArrowLeft className="w-4 h-4" />
                )}
                <span>{t.marketplace.backToCatalog}</span>
              </Link>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                  {product.category}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  {product.stock} {t.marketplace.inStock}
                </span>
              </div>
            </div>

            {/* Product Hero Grid (Gallery + Buy Box) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Gallery (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl bg-neutral-100 border border-black/[0.08] shadow-xs">
                  <img
                    src={selectedImage || product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Thumbnail strip */}
                {product.gallery && product.gallery.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {product.gallery.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedImage(img)}
                        className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          selectedImage === img
                            ? "border-sky-600 ring-2 ring-sky-500/20"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Economics & Link Generator (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="p-6 sm:p-8 space-y-6">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
                      ID: {product.id}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 mt-1">
                      {lang === "ar" && product.titleAr
                        ? product.titleAr
                        : product.title}
                    </h1>
                    <p className="text-xs text-[#6b6b6b] mt-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Financial Metrics Box */}
                  <div className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-black/[0.04]">
                      <span className="text-xs text-[#6b6b6b]">
                        {t.marketplace.retailPrice}
                      </span>
                      <span className="text-base font-mono font-bold text-neutral-900">
                        {formatDZD(product.retailPrice, lang)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-emerald-800 block">
                          {t.marketplace.netPayout}
                        </span>
                        <span className="text-[10px] text-emerald-600">
                          (80% Net Affiliate Spread)
                        </span>
                      </div>
                      <span className="text-2xl font-mono font-bold text-emerald-600">
                        +{formatDZD(product.affiliateNetPayout, lang)}
                      </span>
                    </div>
                  </div>

                  {/* Escrow Guarantee Pill */}
                  <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5 text-xs text-sky-900">
                    <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <span>
                      Paiement garanti par <strong>l'Escrow Prépayé ViteDrop</strong> dès
                      confirmation de livraison par le transporteur.
                    </span>
                  </div>

                  {/* Main Action CTA */}
                  <div className="space-y-2 pt-2">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => setIsLinkModalOpen(true)}
                    >
                      <Link2 className="w-4 h-4" />
                      <span>{t.marketplace.generateLink}</span>
                    </Button>

                    <p className="text-[11px] text-center text-[#6b6b6b]">
                      Génère un lien unique compatible Meta Ads & TikTok Pixel CAPI
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Media Buyer Marketing Angles & Creative Hooks */}
            <Card className="p-6 sm:p-8 space-y-4">
              <CardHeader
                title={t.marketplace.marketingAngles}
                subtitle="Recommandations et angles d'accroche pour maximiser votre ROAS en Algérie"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.04] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Angle 1 : Économie de Temps</span>
                  </div>
                  <p className="text-xs text-[#6b6b6b] leading-relaxed">
                    Mettre en avant le gain de temps et la simplicité d'utilisation chez soi sans
                    déplacement. Vidéo UGC avant/après avec démonstration immédiate.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.04] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                    <Truck className="w-4 h-4 text-sky-500" />
                    <span>Angle 2 : Paiement à la Réception</span>
                  </div>
                  <p className="text-xs text-[#6b6b6b] leading-relaxed">
                    Rassurer le consommateur algérien : « الدفع عند الاستلام بعد المعاينة والتأكد
                    من الجودة ». Réduit le taux de refus au téléphone.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.04] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span>Angle 3 : Pack Promo 2 Unités</span>
                  </div>
                  <p className="text-xs text-[#6b6b6b] leading-relaxed">
                    Offre « 1 achetée = 2ème à -50% » ou livraison gratuite dès 2 unités pour
                    augmenter le panier moyen (AOV).
                  </p>
                </div>
              </div>
            </Card>

            {/* 58 Wilayas Shipping Rates Breakdown */}
            <Card className="p-6 sm:p-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardHeader
                  title={t.marketplace.shippingRates}
                  subtitle="Tarification officielle intégrée Yalidine Fast Express & ZR Express"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAllWilayas(!showAllWilayas)}
                >
                  <span>
                    {showAllWilayas
                      ? "Afficher les 10 premières"
                      : "Voir les 58 Wilayas"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      showAllWilayas ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code & Wilaya</TableHead>
                    <TableHead>Nom en Arabe</TableHead>
                    <TableHead>Livraison à Domicile</TableHead>
                    <TableHead>Stop-Desk (Bureau)</TableHead>
                    <TableHead className="text-end">Délai Estimé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedWilayas.map((w) => (
                    <TableRow key={w.code}>
                      <TableCell className="font-mono text-xs font-semibold">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 me-2 text-neutral-700">
                          {w.code}
                        </span>
                        <span>{w.name}</span>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-neutral-800">
                        {w.nameAr}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-neutral-900">
                        {formatDZD(w.homeDeliveryFee, lang)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-sky-700 font-semibold">
                        {formatDZD(w.deskDeliveryFee, lang)}
                      </TableCell>
                      <TableCell className="text-end text-xs text-[#6b6b6b]">
                        24h - 48h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Tracking Link Modal */}
            <TrackingLinkModal
              isOpen={isLinkModalOpen}
              onClose={() => setIsLinkModalOpen(false)}
              product={product}
              lang={lang}
            />
          </div>
        );
      }}
    </DashboardLayout>
  );
}
