import { describe, it, expect } from "vitest";
import {
  ALGERIA_WILAYAS,
  getWilayaDeliveryIntelligence,
} from "@/lib/algeria-locations";

describe("Algeria Locations & Wilaya Mapping", () => {
  it("should contain all 58 Algerian Wilayas exactly", () => {
    expect(ALGERIA_WILAYAS).toHaveLength(58);
  });

  it("should have valid 2-digit sequential string codes from 01 to 58", () => {
    ALGERIA_WILAYAS.forEach((wilaya, index) => {
      const expectedCode = String(index + 1).padStart(2, "0");
      expect(wilaya.code).toBe(expectedCode);
      expect(wilaya.name).toBeTruthy();
      expect(wilaya.nameAr).toBeTruthy();
    });
  });

  it("should enforce positive delivery fees with home delivery exceeding desk delivery", () => {
    ALGERIA_WILAYAS.forEach((wilaya) => {
      expect(wilaya.homeDeliveryFee).toBeGreaterThan(0);
      expect(wilaya.deskDeliveryFee).toBeGreaterThan(0);
      expect(wilaya.homeDeliveryFee).toBeGreaterThanOrEqual(wilaya.deskDeliveryFee);
    });
  });

  it("should provide at least one commune for every single Wilaya", () => {
    ALGERIA_WILAYAS.forEach((wilaya) => {
      expect(Array.isArray(wilaya.communes)).toBe(true);
      expect(wilaya.communes.length).toBeGreaterThan(0);
      wilaya.communes.forEach((commune) => {
        expect(typeof commune).toBe("string");
        expect(commune.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it("should identify high-density wilayas with high delivery success intel", () => {
    const highDensityCodes = ["16", "09", "31", "42", "35"]; // Alger, Blida, Oran, Tipaza, Boumerdes
    highDensityCodes.forEach((wilayaCode) => {
      const intel = getWilayaDeliveryIntelligence(wilayaCode);
      expect(intel.tier).toBe("high_density");
      expect(intel.successRate).toBe(94);
      expect(intel.recommendedModality).toBe("domicile");
    });
  });

  it("should identify remote wilayas recommending stop-desk agency pickup", () => {
    const remoteCodes = ["01", "11", "30", "33", "37"]; // Adrar, Tamanrasset, Ouargla, Illizi, Tindouf
    remoteCodes.forEach((wilayaCode) => {
      const intel = getWilayaDeliveryIntelligence(wilayaCode);
      expect(intel.tier).toBe("stop_desk_recommended");
      expect(intel.recommendedModality).toBe("stop_desk");
      expect(intel.successRate).toBe(68);
    });
  });

  it("should safely handle numeric codes or string codes in intelligence helper", () => {
    const intelFromNumber = getWilayaDeliveryIntelligence(16);
    const intelFromString = getWilayaDeliveryIntelligence("16");
    expect(intelFromNumber.tier).toBe("high_density");
    expect(intelFromString.tier).toBe("high_density");
  });
});
