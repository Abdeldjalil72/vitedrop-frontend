"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/types";
import { Language, translations } from "@/lib/locales";
import { getCurrentUser } from "@/lib/api-client";
import { Copy, Check, ExternalLink, Link2, Sparkles } from "lucide-react";

export interface TrackingLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  lang?: Language;
}

export function TrackingLinkModal({
  isOpen,
  onClose,
  product,
  lang = "fr",
}: TrackingLinkModalProps) {
  const t = translations[lang];
  const [campaign, setCampaign] = useState("tiktok_broad_dz");
  const [subId, setSubId] = useState("hook_v1");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://vitedrop.dz");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!product) return null;

  const currentUser = getCurrentUser();
  const affiliateId = currentUser?.sub || "aff-101";

  const searchParams = new URLSearchParams();
  searchParams.set("aff", affiliateId);
  if (campaign.trim()) searchParams.set("utm_campaign", campaign.trim());
  if (subId.trim()) searchParams.set("sub_id", subId.trim());

  const trackingUrl = `${origin}/p/${product.id}?${searchParams.toString()}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.marketplace.linkModalTitle}
      description={t.marketplace.linkModalDesc}
      maxWidth="md"
    >
      <div className="space-y-5 text-start">
        {/* Product summary card */}
        <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-200 shrink-0">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-neutral-900 truncate">
                {product.title}
              </h4>
              <p className="text-[11px] text-[#6b6b6b]">
                {t.marketplace.netPayout}:{" "}
                <strong className="text-emerald-700 font-mono">
                  {product.affiliateNetPayout} DZD
                </strong>
              </p>
            </div>
          </div>

          <div className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[10px] font-semibold shrink-0">
            80% Net Payout
          </div>
        </div>

        {/* Link builder inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label={t.marketplace.campaignName}
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="fb_summer_sale"
          />

          <Input
            label={t.marketplace.subId}
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            placeholder="video_hook_2"
          />
        </div>

        {/* Output tracking URL with copy button */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-800 tracking-tight">
            {t.marketplace.generatedUrl}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={trackingUrl}
              className="w-full font-mono text-xs bg-[#fafafa] border border-black/10 rounded-2xl px-3.5 py-2.5 text-neutral-800 focus:outline-none"
            />
            <Button
              type="button"
              variant={copied ? "primary" : "secondary"}
              size="md"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>{t.common.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t.common.copy}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Server-Side Pixel Note */}
        <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5 text-[11px] text-sky-900 leading-relaxed">
          <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <span>
            Ce lien capture automatiquement{" "}
            <code className="bg-white/80 px-1 py-0.5 rounded font-mono">click_id</code>,{" "}
            <code className="bg-white/80 px-1 py-0.5 rounded font-mono">fbclid</code> et{" "}
            <code className="bg-white/80 px-1 py-0.5 rounded font-mono">ttclid</code>. Les
            événements de conversion (CAPI) sont expédiés en tâche de fond dès validation.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-black/[0.06]">
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700"
          >
            <span>Tester la page client</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <Button variant="secondary" size="sm" onClick={onClose}>
            {t.common.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
