import { describe, it, expect } from "vitest";
import {
  formatDZD,
  formatDateTime,
  formatDate,
  validateAlgerianPhone,
  calculateCpaSplit,
} from "@/lib/formatters";

describe("Formatters & Algerian Localization Helpers", () => {
  describe("formatDZD", () => {
    it("should format amounts with DZD suffix for French and English", () => {
      const resFr = formatDZD(1500, "fr");
      expect(resFr).toContain("DZD");
      expect(resFr).toContain("1");
      expect(resFr).toContain("500");

      const resEn = formatDZD(25000, "en");
      expect(resEn).toContain("DZD");
    });

    it("should format amounts with Arabic currency symbol د.ج for Arabic", () => {
      const resAr = formatDZD(1800, "ar");
      expect(resAr).toContain("د.ج");
    });

    it("should safely handle zero and null-like numbers", () => {
      expect(formatDZD(0)).toContain("0");
      expect(formatDZD(Number(null))).toContain("0");
    });
  });

  describe("calculateCpaSplit (Invisible Spread Model)", () => {
    it("should strictly split Gross CPA into 80% Affiliate Net and 20% Platform Fee", () => {
      const split1000 = calculateCpaSplit(1000);
      expect(split1000.affiliateNet).toBe(800);
      expect(split1000.platformFee).toBe(200);
      expect(split1000.affiliateNet + split1000.platformFee).toBe(1000);

      const split1500 = calculateCpaSplit(1500);
      expect(split1500.affiliateNet).toBe(1200);
      expect(split1500.platformFee).toBe(300);
      expect(split1500.affiliateNet + split1500.platformFee).toBe(1500);
    });

    it("should maintain integer sum equality without fractional loss", () => {
      const splitOdd = calculateCpaSplit(777);
      expect(splitOdd.affiliateNet + splitOdd.platformFee).toBe(777);
    });
  });

  describe("validateAlgerianPhone", () => {
    it("should accept valid Mobilis, Ooredoo, and Djezzy numbers", () => {
      expect(validateAlgerianPhone("0550123456").isValid).toBe(true); // Ooredoo
      expect(validateAlgerianPhone("0661223344").isValid).toBe(true); // Mobilis
      expect(validateAlgerianPhone("0770987654").isValid).toBe(true); // Djezzy
    });

    it("should normalize +213 and 00213 prefixes to 10-digit standard", () => {
      const withPlus = validateAlgerianPhone("+213 550 12 34 56");
      expect(withPlus.isValid).toBe(true);
      expect(withPlus.normalized).toBe("0550123456");

      const withZeros = validateAlgerianPhone("00213-661-223344");
      expect(withZeros.isValid).toBe(true);
      expect(withZeros.normalized).toBe("0661223344");
    });

    it("should reject invalid or foreign numbers", () => {
      expect(validateAlgerianPhone("021345678").isValid).toBe(false); // Landline (not mobile)
      expect(validateAlgerianPhone("0850123456").isValid).toBe(false); // Invalid prefix
      expect(validateAlgerianPhone("123456").isValid).toBe(false); // Too short
      expect(validateAlgerianPhone("+33612345678").isValid).toBe(false); // French number
    });
  });

  describe("formatDate and formatDateTime", () => {
    it("should format valid ISO strings without throwing", () => {
      const formatted = formatDate("2026-10-08T12:00:00.000Z", "fr");
      expect(formatted).not.toBe("—");
      expect(formatted.length).toBeGreaterThan(5);

      const formattedTime = formatDateTime("2026-10-08T12:00:00.000Z", "en");
      expect(formattedTime).not.toBe("—");
    });

    it("should return dash for invalid dates", () => {
      expect(formatDate("invalid-date")).toBe("—");
      expect(formatDateTime("not-a-date")).toBe("—");
    });
  });
});
