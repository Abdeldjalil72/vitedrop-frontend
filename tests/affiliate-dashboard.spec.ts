import { expect, test, type Page } from "@playwright/test";

const mockOrders = [
  {
    id: "ord-dash-01",
    affiliateId: "aff-qa-uuid",
    cpaCommission: 1200,
    status: "delivered",
    customerName: "Amine Meziani",
    customerPhone: "0661987654",
    address: "Cité 1000 Logements",
    productId: "prod-watch-02",
    quantity: 1,
    wilaya: 31,
    commune: "Oran",
    trackingNumber: "YAL-1791039550527",
    courier: "YALIDINE",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord-dash-02",
    affiliateId: "aff-qa-uuid",
    cpaCommission: 960,
    status: "in_transit",
    customerName: "Karim Brahimi",
    customerPhone: "0550123456",
    address: "12 Rue Didouche Mourad",
    productId: "prod-earbuds-01",
    quantity: 1,
    wilaya: 16,
    commune: "Alger Centre",
    trackingNumber: "ZR-849201948",
    courier: "ZR_EXPRESS",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord-dash-03",
    affiliateId: "aff-qa-uuid",
    cpaCommission: 1500,
    status: "supplier_confirmed",
    customerName: "Yassine Mansouri",
    customerPhone: "0770334455",
    address: "Rue Colonel Lotfi",
    productId: "prod-bag-03",
    quantity: 1,
    wilaya: 19,
    commune: "Sétif",
    trackingNumber: null,
    courier: null,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord-dash-04",
    affiliateId: "aff-qa-uuid",
    cpaCommission: 800,
    status: "canceled",
    customerName: "Omar Hamidi",
    customerPhone: "0550998877",
    address: "Boulevard Zighoud Youcef",
    productId: "prod-cable-04",
    quantity: 1,
    wilaya: 25,
    commune: "Constantine",
    trackingNumber: null,
    courier: null,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function createAffiliateToken(): string {
  const payload = {
    sub: "aff-qa-uuid",
    email: "affiliate@vitedrop.com",
    role: "AFFILIATE",
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `header.${base64Payload}.signature`;
}

interface SetupOptions {
  lang?: "fr" | "ar" | "en";
  balance?: number;
}

async function setupAffiliateDashboardSession(
  page: Page,
  options: SetupOptions = {}
): Promise<void> {
  const { lang = "fr", balance = 35000 } = options;
  const apiBase = "http://localhost:4000";

  // Intercept wallet GET
  await page.route(new RegExp(`^${apiBase}/wallets?/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "wal-aff-qa",
        userId: "aff-qa-uuid",
        balance,
        currency: "DZD",
        ownerType: "AFFILIATE",
      }),
    });
  });

  // Intercept affiliate orders GET
  await page.route(new RegExp(`^${apiBase}/affiliate/orders`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockOrders),
    });
  });

  // Inject token and language
  await page.addInitScript(
    ({ token, selectedLang }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", selectedLang);
    },
    { token: createAffiliateToken(), selectedLang: lang }
  );

  await page.goto("/affiliate");
  await page.waitForSelector('[data-dashboard-role="affiliate"]', { timeout: 30000 });
}

test.describe("Affiliate Command Center Overview Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Renders Executive KPI Cards with Space Mono formatting and Net CPA badges", async ({
    page,
  }) => {
    await setupAffiliateDashboardSession(page, { balance: 35000 });

    const totalEarningsEl = page.locator('[data-testid="stat-total-earnings"]');
    await expect(totalEarningsEl).toBeVisible();
    await expect(totalEarningsEl).toContainText("35 000");

    const deliveredOrdersEl = page.locator('[data-testid="stat-delivered-orders"]');
    await expect(deliveredOrdersEl).toBeVisible();
    await expect(deliveredOrdersEl).toContainText("1");

    const deliveryRateEl = page.locator('[data-testid="stat-delivery-rate"]');
    await expect(deliveryRateEl).toBeVisible();
    // 1 delivered out of 2 terminal orders (1 delivered, 1 canceled) = 50%
    await expect(deliveryRateEl).toContainText("50%");

    const pendingCommEl = page.locator('[data-testid="stat-pending-commissions"]');
    await expect(pendingCommEl).toBeVisible();
    // 960 (in_transit) + 1500 (supplier_confirmed) = 2460 DZD
    await expect(pendingCommEl).toContainText("2 460");

    // Net CPA badge
    await expect(page.getByText("100% CPA Net")).toBeVisible();
  });

  test("2. Renders Quick Action Ribbon with navigation links to Marketplace and Tracking Links", async ({
    page,
  }) => {
    await setupAffiliateDashboardSession(page);

    const marketplaceBtn = page.locator('[data-testid="quick-marketplace-btn"]');
    await expect(marketplaceBtn).toBeVisible();

    const linksBtn = page.locator('[data-testid="quick-links-btn"]');
    await expect(linksBtn).toBeVisible();

    // Verify marketplace button points to /affiliate/marketplace
    const marketplaceLink = marketplaceBtn.locator("..");
    await expect(marketplaceLink).toHaveAttribute("href", "/affiliate/marketplace");

    // Verify tracking links button points to /affiliate/links
    const linksLink = linksBtn.locator("..");
    await expect(linksLink).toHaveAttribute("href", "/affiliate/links");
  });

  test("3. Renders Recent Orders desktop table with Space Mono Net CPA and StatusBadges", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await setupAffiliateDashboardSession(page);

    const recentTable = page.locator('[data-testid="affiliate-recent-orders-table"]');
    await expect(recentTable).toBeVisible();

    const rows = page.locator('[data-testid="affiliate-recent-order-row"]');
    await expect(rows).toHaveCount(4);

    // Verify delivered order has green CPA payout in Space Mono
    const firstRow = rows.first();
    await expect(firstRow).toContainText("Amine Meziani");
    await expect(firstRow).toContainText("1 200 DZD");
    await expect(firstRow).toContainText("Oran");
  });

  test("4. Ensures 390px mobile viewport card parity and hidden desktop table", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAffiliateDashboardSession(page);

    // Desktop table must be hidden
    const recentTable = page.locator('[data-testid="affiliate-recent-orders-table"]');
    await expect(recentTable).not.toBeVisible();

    // Mobile cards must be rendered
    const mobileCards = page.locator('[data-testid="affiliate-recent-order-card"]');
    await expect(mobileCards).toHaveCount(4);

    const firstCard = mobileCards.first();
    await expect(firstCard).toContainText("Amine Meziani");
    await expect(firstCard).toContainText("1 200 DZD");
  });

  test("5. Enforces Arabic RTL parity and zero horizontal overflow across 390px, 768px, and 1440px", async ({
    page,
  }) => {
    await setupAffiliateDashboardSession(page, { lang: "ar" });

    // RTL verification
    const dashboardRoot = page.locator('[data-dashboard-role="affiliate"]');
    await expect(dashboardRoot).toHaveAttribute("dir", "rtl");

    // Verify Arabic KPI text
    await expect(page.locator('[data-testid="stat-total-earnings"]')).toBeVisible();

    const viewports = [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await expect
        .poll(
          async () => {
            return await page.evaluate(() => {
              return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
            });
          },
          {
            message: `Detected horizontal overflow on Arabic view at ${vp.width}px`,
            timeout: 5000,
          }
        )
        .toBe(true);
    }
  });
});
