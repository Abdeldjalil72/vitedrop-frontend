import { expect, test } from "@playwright/test";

const mockProduct = {
  id: "prod-smartwatch-01",
  name: "ساعة ذكية رياضية Ultra Pro المقاومة للماء",
  retailPrice: 4900,
  stock: 14,
};

const mockAnalytics = {
  totalClicks: 240,
  totalLeads: 24,
  totalDelivered: 18,
  totalCanceled: 3,
  inPipeline: 3,
  totalEarnings: 21600,
  pendingEarnings: 3600,
  conversionRate: 10.0,
  deliveryRate: 75.0,
  epc: 90.0,
};

test.describe("Phase 2: Ad Attribution, S2S Telemetry & Real Analytics", () => {
  test("2.1 records non-blocking click telemetry with UTM parameters on landing page load", async ({ page }) => {
    const apiBase = "http://localhost:4000";
    let capturedClickPayload: any = null;

    await page.route(new RegExp(`^${apiBase}/checkout/product/`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProduct),
      });
    });

    await page.route(new RegExp(`^${apiBase}/tracking/click`), async (route) => {
      capturedClickPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          recorded: true,
          deduplicated: false,
          clickId: "clk-uuid-9988",
        }),
      });
    });

    await page.goto(
      "/p/prod-smartwatch-01?ref=aff-qa-uuid&utm_source=facebook&utm_campaign=winter_promo&sub_id=adset_12"
    );

    // Verify product rendered
    await expect(page.locator("h1")).toContainText(/ساعة ذكية|Smartwatch/);

    // Verify click was captured asynchronously
    expect(capturedClickPayload).not.toBeNull();
    expect(capturedClickPayload.productId).toBe("prod-smartwatch-01");
    expect(capturedClickPayload.affiliateId).toBe("aff-qa-uuid");
    expect(capturedClickPayload.utmSource).toBe("facebook");
    expect(capturedClickPayload.utmCampaign).toBe("winter_promo");
    expect(capturedClickPayload.subId).toBe("adset_12");
  });

  test("2.2 renders live CAPI & Telemetry analytics cards on affiliate dashboard", async ({ page }) => {
    const apiBase = "http://localhost:4000";

    // Mock affiliate authentication token
    await page.addInitScript(() => {
      const fakeToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
        btoa(
          JSON.stringify({
            sub: "aff-qa-uuid",
            email: "affiliate@vitedrop.dz",
            role: "AFFILIATE",
            exp: Math.floor(Date.now() / 1000) + 86400,
          })
        ) +
        ".signature";
      localStorage.setItem("vitedrop_token", fakeToken);
    });

    // Mock analytics endpoint
    await page.route(new RegExp(`^${apiBase}/affiliate/analytics`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockAnalytics),
      });
    });

    // Mock affiliate orders
    await page.route(new RegExp(`^${apiBase}/affiliate/orders`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // Mock wallet
    await page.route(new RegExp(`^${apiBase}/wallets/me`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "wal-aff", balance: 21600, ownerType: "AFFILIATE" }),
      });
    });

    await page.goto("/affiliate");

    // Verify telemetry cards render live values
    const clicksCard = page.locator('[data-testid="stat-total-clicks"]');
    await expect(clicksCard).toBeVisible();
    await expect(clicksCard).toHaveText("240");

    const crCard = page.locator('[data-testid="stat-conversion-rate"]');
    await expect(crCard).toBeVisible();
    await expect(crCard).toContainText("10");

    const epcCard = page.locator('[data-testid="stat-epc"]');
    await expect(epcCard).toBeVisible();
    await expect(epcCard).toContainText("90");
  });
});
