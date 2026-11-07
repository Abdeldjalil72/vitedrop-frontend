/**
 * Resolves the public application base URL dynamically.
 * Prioritizes explicit NEXT_PUBLIC_APP_URL environment variable if set,
 * otherwise dynamically adapts to the current browser origin (window.location.origin)
 * so generated tracking links work automatically across local, preview, and production domains.
 */
export function getAppBaseUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://vitedrop.dz";
}

/**
 * Builds a dynamic tracked product link for an affiliate campaign.
 */
export function buildAffiliateProductUrl(params: {
  productId: string;
  affiliateId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  subId?: string;
}): string {
  const base = getAppBaseUrl();
  const searchParams = new URLSearchParams();

  if (params.affiliateId) {
    searchParams.set("ref", params.affiliateId);
    searchParams.set("aff", params.affiliateId);
  }
  if (params.utmSource?.trim()) {
    searchParams.set("utm_source", params.utmSource.trim());
  }
  if (params.utmMedium?.trim()) {
    searchParams.set("utm_medium", params.utmMedium.trim());
  }
  if (params.utmCampaign?.trim()) {
    searchParams.set("utm_campaign", params.utmCampaign.trim());
  }
  if (params.subId?.trim()) {
    searchParams.set("sub_id", params.subId.trim());
  }

  const query = searchParams.toString();
  return `${base}/p/${params.productId}${query ? `?${query}` : ""}`;
}

