"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getCurrentUser, apiGetMarketplaceProducts } from "@/lib/api-client";
import { translations } from "@/lib/locales";
import {
  Link2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  QrCode,
  Tag,
  Share2,
} from "lucide-react";

export default function AffiliateLinksPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [utmSource, setUtmSource] = useState("facebook");
  const [utmCampaign, setUtmCampaign] = useState("ramadan_special");
  const [subId, setSubId] = useState("adset_01");
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const load = async () => {
      try {
        const data = await apiGetMarketplaceProducts();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          setSelectedProductId(data[0].id);
        }
      } catch (err) {
        console.warn("Could not load products for link generator", err);
      }
    };
    load();
  }, []);

  const affiliateId = currentUser?.sub || "affiliate_user";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://vitedrop.dz";
  
  const generatedLink = selectedProductId
    ? `${baseUrl}/p/${selectedProductId}?aff=${affiliateId}&utm_source=${encodeURIComponent(utmSource)}&utm_campaign=${encodeURIComponent(utmCampaign)}&sub_id=${encodeURIComponent(subId)}`
    : "";

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <DashboardLayout initialRole="affiliate" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];

        return (
          <div className="space-y-8 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-sky-700 font-bold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                  {lang === "ar" ? "تتبع الروابط والإعلانات" : "Tracking & S2S Campaigns"}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1">
                  {lang === "ar" ? "مولد الروابط التتبعية" : "Générateur de Liens Affilié"}
                </h1>
                <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1">
                  {lang === "ar"
                    ? "أنشئ روابط مخصصة لحملاتك على فيسبوك وتيك توك مع معلمات التتبع المتقدمة."
                    : "Créez des liens avec tags UTM et sous-identifiants pour vos campagnes Meta & TikTok."}
                </p>
              </div>
            </div>

            {/* Generator Card */}
            <Card className="p-6">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>{lang === "ar" ? "إعداد الرابط الجديد" : "Configuration du Lien"}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    {lang === "ar" ? "المنتج المستهدف" : "Produit"}
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {products.length === 0 ? (
                      <option value="">{lang === "ar" ? "جاري تحميل المنتجات..." : "Chargement..."}</option>
                    ) : (
                      products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Source UTM (Traffic Source)
                  </label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="facebook, tiktok, snapchat..."
                    className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Campagne UTM
                  </label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="nom_campagne_01"
                    className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Sub ID (AdSet / Créa)
                  </label>
                  <input
                    type="text"
                    value={subId}
                    onChange={(e) => setSubId(e.target.value)}
                    placeholder="video_hook_2"
                    className="w-full text-xs rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Generated Link Box */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                      {lang === "ar" ? "رابط الهبوط المشفر" : "Lien de redirection sécurisé"}
                    </span>
                    <span className="text-xs font-mono font-semibold text-neutral-900 truncate">
                      {generatedLink || "Sélectionnez un produit"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={handleCopy}
                    disabled={!generatedLink}
                    size="sm"
                    className="text-xs px-4 py-2 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white"
                  >
                    {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? (lang === "ar" ? "تم النسخ!" : "Copié !") : (lang === "ar" ? "نسخ الرابط" : "Copier le Lien")}</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Existing Active Products Table */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-neutral-900">
                {lang === "ar" ? "روابط المنتجات المتاحة في السوق" : "Liens Rapides du Catalogue"}
              </h2>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{lang === "ar" ? "المنتج" : "Produit"}</TableHead>
                    <TableHead>{lang === "ar" ? "عمولة CPA" : "Payout Net Affilié"}</TableHead>
                    <TableHead>{lang === "ar" ? "الرابط الافتراضي" : "Lien Produit"}</TableHead>
                    <TableHead className="text-end">{lang === "ar" ? "الإجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-neutral-500 text-xs">
                        {lang === "ar" ? "لا توجد منتجات متاحة حالياً" : "Aucun produit disponible"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((p) => {
                      const directLink = `${baseUrl}/p/${p.id}?aff=${affiliateId}`;
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <span className="font-semibold text-xs text-neutral-900">{p.name}</span>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-emerald-600">
                            {p.affiliateNetPayout ? `${p.affiliateNetPayout} DZD` : "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-neutral-500 max-w-xs truncate">
                            {directLink}
                          </TableCell>
                          <TableCell className="text-end">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                navigator.clipboard.writeText(directLink);
                                alert(lang === "ar" ? "تم نسخ الرابط" : "Lien copié dans le presse-papiers");
                              }}
                              className="text-xs px-2.5 py-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{lang === "ar" ? "نسخ" : "Copier"}</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
