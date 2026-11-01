import { describe, it, expect } from "vitest";
import { parseJwt } from "@/lib/api-client";

describe("API Client JWT Parsing Utilities", () => {
  it("should successfully parse valid JWT tokens", () => {
    const payload = {
      sub: "user-123",
      email: "supplier@vitedrop.com",
      role: "SUPPLIER",
      exp: 1893456000,
    };
    const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const token = `header.${base64}.signature`;

    const decoded = parseJwt(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe("user-123");
    expect(decoded?.email).toBe("supplier@vitedrop.com");
    expect(decoded?.role).toBe("SUPPLIER");
  });

  it("should safely return null for invalid or corrupted tokens", () => {
    expect(parseJwt("")).toBeNull();
    expect(parseJwt("not-a-token")).toBeNull();
    expect(parseJwt("header.invalid-base64.signature")).toBeNull();
  });
});
