"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDZD } from "@/lib/formatters";
import { translations } from "@/lib/locales";
import { PackagePlus, X, Box, Tag, Coins, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiGetSupplierProducts, apiCreateSupplierProduct, apiGetMyWallet } from "@/lib/api-client";

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [wallet, setWallet] = useState<{ id: string; balance: number; ownerType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [supplierTotalCpa, setSupplierTotalCpa] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsData, walletData] = await Promise.all([
        apiGetSupplierProducts(),
        apiGetMyWallet(),
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setWallet(walletData);
    } catch (err) {
      console.warn("Failed to load supplier products or wallet", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const stockNum = parseInt(stock, 10);
    const retailPriceNum = parseInt(retailPrice, 10);
    const cpaNum = parseInt(supplierTotalCpa, 10);

    // Frontend validations
    if (cpaNum < 500) {
      setErrorMessage("Le budget CPA minimum requis est de 500 DZD.");
      return;
    }

    if (retailPriceNum <= cpaNum) {
      setErrorMessage("Le prix de vente doit être strictement supérieur au budget CPA.");
      return;
    }

    if (cpaNum > retailPriceNum * 0.5) {
      setErrorMessage("Le budget CPA ne peut pas dépasser 50% du prix de vente.");
      return;
    }

    if (stockNum < 20) {
      setErrorMessage("Le stock initial minimum est de 20 unités pour activer le produit.");
      return;
    }

    const requiredEscrow = cpaNum * 5;
    const currentBalance = Number(wallet?.balance || 0);
    if (currentBalance < requiredEscrow) {
      setErrorMessage(
        `Solde Escrow insuffisant: Il vous faut au moins ${requiredEscrow} DZD (tampon de 5x CPA) dans votre portefeuille pour activer ce produit. Votre solde actuel est de ${currentBalance} DZD.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await apiCreateSupplierProduct({
        name,
        description,
        stock: stockNum,
        retailPrice: retailPriceNum,
        supplierTotalCpa: cpaNum,
      });
      setIsModalOpen(false);
      // Reset form
      setName("");
      setDescription("");
      setStock("");
      setRetailPrice("");
      setSupplierTotalCpa("");
      setErrorMessage(null);
      // Reload
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de la création du produit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout initialRole="supplier" initialLang="fr">
      {({ lang }) => {
        const t = translations[lang];
        const isAr = lang === "ar";

        const cpaValue = parseInt(supplierTotalCpa, 10) || 0;
        const affiliateShare = cpaValue * 0.8;
        const platformShare = cpaValue * 0.2;

        return (
          <div className="space-y-6 text-start relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                  {isAr ? "كتالوج المنتجات" : "Catalogue Produits"}
                </h1>
                <p className="text-sm text-[#6b6b6b] mt-1">
                  {isAr
                    ? "إدارة مخزونك وأسعار المنتجات التي تتيحها للمسوقين."
                    : "Gérez votre stock et définissez le budget CPA pour les affiliés."}
                </p>
              </div>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="gap-2 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white shadow-md shadow-sky-500/20"
              >
                <PackagePlus className="w-4 h-4" />
                <span>{isAr ? "إضافة منتج جديد" : "Ajouter un Produit"}</span>
              </Button>
            </div>

            {/* Products Table */}
            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "المنتج" : "Produit"}</TableHead>
                    <TableHead>{isAr ? "المخزون" : "Stock (Qté)"}</TableHead>
                    <TableHead>{isAr ? "سعر البيع" : "Prix de Vente"}</TableHead>
                    <TableHead>{isAr ? "ميزانية الـ CPA" : "Budget CPA"}</TableHead>
                    <TableHead className="text-end">{isAr ? "الحالة" : "Statut"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                        {isAr ? "جاري التحميل..." : "Chargement..."}
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-neutral-500">
                        {isAr ? "لم تقم بإضافة أي منتجات بعد" : "Aucun produit dans votre catalogue"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 border border-sky-100">
                              <Box className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-neutral-900 text-sm">
                                {p.name}
                              </span>
                              {p.description && (
                                <span className="text-xs text-[#6b6b6b] truncate max-w-[200px]">
                                  {p.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-neutral-900">
                          {p.stock}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-blue-600">
                          {formatDZD(p.retailPrice, lang)}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-emerald-600">
                          {formatDZD(p.supplierTotalCpa, lang)}
                        </TableCell>
                        <TableCell className="text-end">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            Actif
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>

            {/* Modal Overlay */}
            {isModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)} />
                <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full">
                  <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between bg-[#fbfbfb]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                        <PackagePlus className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-neutral-900">
                          {isAr ? "إضافة منتج جديد (اعتماد فوري)" : "Créer un Produit (Validation Immédiate)"}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-[#6b6b6b] flex items-center gap-1 font-mono">
                            <Wallet className="w-3 h-3 text-emerald-600" />
                            {isAr ? "رصيد الضمان الحالي:" : "Solde Escrow Actuel:"}{" "}
                            <strong className="text-emerald-700">{formatDZD(wallet?.balance || 0, lang)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => !isSubmitting && setIsModalOpen(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 transition-colors"
                    >
                      <X className="w-4 h-4 text-neutral-500" />
                    </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto">
                    {/* Error message alert */}
                    {errorMessage && (
                      <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{errorMessage}</span>
                      </div>
                    )}

                    <form id="create-product-form" onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-neutral-900">
                          {isAr ? "اسم المنتج" : "Nom du Produit"} <span className="text-rose-500">*</span>
                        </label>
                        <Input 
                          placeholder={isAr ? "مثال: مكنسة كهربائية لاسلكية" : "Ex: Aspirateur Sans Fil"} 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-neutral-900">
                          {isAr ? "وصف قصير" : "Description (Optionnel)"}
                        </label>
                        <Input 
                          placeholder="Ex: 220V, Garantie 1 an" 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-neutral-900">
                            {isAr ? "المخزون الأولي (الحد الأدنى 20)" : "Stock Initial (Min. 20)"} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <Input 
                              type="number" 
                              min="20" 
                              className="pl-9 font-mono" 
                              placeholder="20" 
                              value={stock}
                              onChange={(e) => setStock(e.target.value)}
                              required
                            />
                          </div>
                          <span className="text-[10px] text-neutral-400">
                            {isAr ? "20 قطعة على الأقل لتفعيل المنتج" : "Min. 20 unités requises"}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-neutral-900">
                            {isAr ? "سعر البيع للزبون" : "Prix de Vente (Retail)"} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <Input 
                              type="number" 
                              min="0" 
                              className="pl-9 font-mono" 
                              placeholder="5000" 
                              value={retailPrice}
                              onChange={(e) => setRetailPrice(e.target.value)}
                              required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">DZD</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="p-4 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50/50 space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                              <Coins className="w-4 h-4 text-emerald-600" />
                              {isAr ? "ميزانية الـ CPA المقترحة (الحد الأدنى 500 دج)" : "Budget CPA Total proposé (Min. 500 DZD)"} <span className="text-rose-500">*</span>
                            </label>
                            <p className="text-[11px] text-emerald-700/80 leading-relaxed">
                              {isAr 
                                ? "المبلغ الإجمالي المخصص لكل طلبية ناجحة (الحد الأقصى 50% من سعر البيع)."
                                : "Commission totale par commande livrée (ne peut pas dépasser 50% du prix de vente)."}
                            </p>
                            <div className="relative mt-2">
                              <Input 
                                type="number" 
                                min="500" 
                                className="font-mono text-lg font-bold border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500" 
                                placeholder="1500" 
                                value={supplierTotalCpa}
                                onChange={(e) => setSupplierTotalCpa(e.target.value)}
                                required
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">DZD</span>
                            </div>
                          </div>

                          {/* Invisible Spread & Escrow Breakdown */}
                          {cpaValue > 0 && (
                            <div className="pt-3 mt-3 border-t border-emerald-200/50 flex flex-col gap-2">
                              <div className="flex justify-between items-center text-xs font-medium text-emerald-800">
                                <span>Part Affilié (80%) :</span>
                                <span className="font-mono font-bold text-emerald-600">{formatDZD(affiliateShare, lang)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-medium text-emerald-800">
                                <span>Frais Plateforme ViteDrop (20%) :</span>
                                <span className="font-mono font-bold text-emerald-600">{formatDZD(platformShare, lang)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-semibold text-emerald-900 pt-1 border-t border-emerald-200/40">
                                <span>Tampon Escrow Requis (5x CPA) :</span>
                                <span className="font-mono font-bold text-neutral-900">{formatDZD(cpaValue * 5, lang)}</span>
                              </div>

                              {/* Solvency Warning */}
                              {wallet && Number(wallet.balance) < cpaValue * 5 && (
                                <div className="mt-1 p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 text-[11px] font-medium leading-relaxed">
                                  ⚠️ Votre solde escrow ({formatDZD(wallet.balance, lang)}) est inférieur au tampon de 5x CPA requis ({formatDZD(cpaValue * 5, lang)}). Veuillez recharger votre portefeuille pour activer ce produit.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="px-6 py-4 border-t border-black/[0.06] bg-[#fbfbfb] flex items-center justify-end gap-3 rounded-b-3xl shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      {isAr ? "إلغاء" : "Annuler"}
                    </Button>
                    <Button
                      type="submit"
                      form="create-product-form"
                      disabled={
                        isSubmitting ||
                        !name ||
                        !stock ||
                        !retailPrice ||
                        !supplierTotalCpa ||
                        parseInt(stock, 10) < 20 ||
                        parseInt(supplierTotalCpa, 10) < 500 ||
                        (wallet !== null && Number(wallet.balance) < parseInt(supplierTotalCpa, 10) * 5)
                      }
                      className="bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/20"
                    >
                      {isSubmitting ? (isAr ? "جاري الاعتماد والتحقق..." : "Vérification & Activation...") : (isAr ? "نشر وتفعيل المنتج" : "Publier et Activer")}
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        );
      }}
    </DashboardLayout>
  );
}
