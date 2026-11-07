import { describe, it, expect } from "vitest";
import {
  validateBaridiMobRip,
  validateCcpAccount,
  validateBankRib,
} from "@/lib/algerian-banking";

describe("Algerian Banking & Postal Rail Validators", () => {
  describe("validateBaridiMobRip", () => {
    it("validates valid 20-digit Algérie Poste BaridiMob RIP", () => {
      const res = validateBaridiMobRip("00799999002194829345");
      expect(res.isValid).toBe(true);
      expect(res.isPosteRip).toBe(true);
      expect(res.cleaned).toBe("00799999002194829345");
      expect(res.formatted).toBe("007 99999 0021948293 45");
      expect(res.error).toBeUndefined();
    });

    it("sanitizes spaces and hyphens from user input", () => {
      const res = validateBaridiMobRip("007 99999 0021948293 45");
      expect(res.isValid).toBe(true);
      expect(res.cleaned).toBe("00799999002194829345");
    });

    it("rejects non-numeric characters", () => {
      const res = validateBaridiMobRip("0079999900ABCD829345");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("chiffres");
    });

    it("rejects input with invalid length", () => {
      const res = validateBaridiMobRip("0079999900123");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("20 chiffres");
    });

    it("handles commercial bank 20-digit RIB (not starting with 00799999)", () => {
      const res = validateBaridiMobRip("00100123000000123456");
      expect(res.isValid).toBe(true);
      expect(res.isPosteRip).toBe(false);
      expect(res.cleaned).toBe("00100123000000123456");
    });
  });

  describe("validateCcpAccount", () => {
    it("validates standard account and 2-digit key", () => {
      const res = validateCcpAccount("12345678 99");
      expect(res.isValid).toBe(true);
      expect(res.accountNumber).toBe("12345678");
      expect(res.key).toBe("99");
      expect(res.formatted).toBe("12345678 Clé 99");
      expect(res.error).toBeUndefined();
    });

    it("handles 'Clé' text in user input", () => {
      const res = validateCcpAccount("12345678 Clé 05");
      expect(res.isValid).toBe(true);
      expect(res.accountNumber).toBe("12345678");
      expect(res.key).toBe("05");
      expect(res.formatted).toBe("12345678 Clé 05");
    });

    it("handles single-digit key and pads it", () => {
      const res = validateCcpAccount("12345678 7");
      expect(res.isValid).toBe(true);
      expect(res.key).toBe("07");
      expect(res.formatted).toBe("12345678 Clé 07");
    });

    it("extracts key from contiguous input when length >= 7", () => {
      const res = validateCcpAccount("1234567890");
      expect(res.isValid).toBe(true);
      expect(res.accountNumber).toBe("12345678");
      expect(res.key).toBe("90");
    });

    it("rejects empty or invalid inputs", () => {
      expect(validateCcpAccount("").isValid).toBe(false);
      expect(validateCcpAccount("123").isValid).toBe(false);
    });
  });

  describe("validateBankRib", () => {
    it("validates 20-digit RIB", () => {
      const res = validateBankRib("00200123000000123456");
      expect(res.isValid).toBe(true);
      expect(res.cleaned).toBe("00200123000000123456");
    });
  });
});

