import { Language } from "./locales";

export function formatDZD(amount: number, lang: Language = "fr"): string {
  const safeAmount = Number(amount) || 0;
  if (lang === "ar") {
    return `${safeAmount.toLocaleString("ar-DZ")} د.ج`;
  }
  return `${safeAmount.toLocaleString("fr-DZ")} DZD`;
}

export function formatDateTime(value: string | Date, lang: Language = "fr"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (!date || isNaN(date.getTime())) return "—";

  const locale = lang === "ar" ? "ar-DZ" : lang === "en" ? "en-DZ" : "fr-DZ";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(value: string | Date, lang: Language = "fr"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (!date || isNaN(date.getTime())) return "—";

  const locale = lang === "ar" ? "ar-DZ" : lang === "en" ? "en-DZ" : "fr-DZ";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function validateAlgerianPhone(input: string): { isValid: boolean; normalized: string } {
  let cleaned = input.replace(/[\s\-\(\)\.]/g, "");

  // Replace +213 or 00213 with 0
  if (cleaned.startsWith("+213")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("00213")) {
    cleaned = "0" + cleaned.slice(5);
  } else if (cleaned.startsWith("213")) {
    cleaned = "0" + cleaned.slice(3);
  }

  // Algerian mobile format: 05, 06, or 07 followed by 8 digits (10 digits total)
  const isValid = /^0(5|6|7)[0-9]{8}$/.test(cleaned);

  return {
    isValid,
    normalized: cleaned,
  };
}

export function formatAlgerianPhoneInput(input: string): string {
  let cleaned = input.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+213")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("00213")) {
    cleaned = "0" + cleaned.slice(5);
  }
  cleaned = cleaned.replace(/\D/g, "").slice(0, 10);

  if (cleaned.length <= 4) {
    return cleaned;
  }
  if (cleaned.length <= 6) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
  }
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
}

export function getAlgerianCarrier(phone: string): "Ooredoo" | "Mobilis" | "Djezzy" | null {
  const norm = phone.replace(/\D/g, "");
  if (norm.startsWith("05")) return "Ooredoo";
  if (norm.startsWith("06")) return "Mobilis";
  if (norm.startsWith("07")) return "Djezzy";
  return null;
}

export function calculateCpaSplit(grossCpa: number): {
  affiliateNet: number;
  platformFee: number;
} {
  const affiliateNet = Math.round(grossCpa * 0.8);
  const platformFee = grossCpa - affiliateNet; // Exactly 20%
  return { affiliateNet, platformFee };
}
