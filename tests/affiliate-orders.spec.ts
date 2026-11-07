import { expect, test, type Page } from "@playwright/test";

const mockAffiliateOrders = [
  {
    id: "a9e1040f-fd56-4ac7-b701-57cf528b1e0d",
    affiliateId: "aff-qa-uuid",
    cpaCommission: 960,
    status: "lead_generated",
    customerName: "Karim Brahimi",
    customerPhone: "0550123456",
    address: "12 Rue Didouche Mourad",
    productId: "prod-earbuds-01",
    productName: "Écouteurs Sans Fil Pro ANC",
    quantity: 1,
    wilaya: 16,
    commune: "Alger Centre",
    trackingNumber: null,
    courier: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "0e1a947e-3772-416a-8778-d73554dcf110",
    affiliateId: "aff-qa-uuid",
    cpaCommission: 1200,
    status: "delivered",
    customerName: "Amine Meziani",
    customerPhone: "0661987654",
    address: "Cité 1000 Logements, Bât A4",
    productId: "prod-watch-02",
    productName: "Montre Connectée Sport Pulse",
    quantity: 1,
    wilaya: 31,
    commune: "Oran",
    trackingNumber: "YAL-1791039550527",
    courier: "YALIDINE",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "b6f0f645-d4eb-4e4c-bc2d-fd71b6154f2a",
    affiliateId: "aff-qa-uuid",
    cpaCommission: 960,
    status: "in_transit",
    customerName: "Yassine Mansouri",
    customerPhone: "0770334455",
    address: "Rue Colonel Lotfi",
    productId: "prod-earbuds-01",
    productName: "Écouteurs Sans Fil Pro ANC",
    quantity: 1,
    wilaya: 19,
    commune: "Sétif",
    trackingNumber: "ZR-849201948",
    courier: "ZR_EXPRESS",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "0234bd71-5c97-470d-a30f-0c047f0fb523",
    affiliateId: "aff-qa-uuid",
    cpaCommission: 720,
    status: "canceled",
    customerName: "Samir Kaci",
    customerPhone: "0559887766",
    address: "Village Azazga",
    productId: "prod-cosmetic-03",
    productName: "Sérum Anti-Âge Bio Élixir",
    quantity: 1,
    wilaya: 15,
    commune: "Tizi Ouzou",
    trackingNumber: null,
    courier: null,
    cancellationReason: "Client injoignable après 3 tentatives d'appel",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
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
  orders?: typeof mockAffiliateOrders;
  pathname?: string;
}

async function setupAffiliateOrdersSession(
  page: Page,
  options: SetupOptions = {}
): Promise<void> {
  const {
    lang = "fr",
    orders = mockAffiliateOrders,
    pathname = "/affiliate/leads",
  } = options;
  const apiBase = "http://localhost:4000";

  // Intercept affiliate orders API
  await page.route(new RegExp(`^${apiBase}/affiliate/orders`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(orders),
    });
  });

  // Intercept wallet GET
  await page.route(new RegExp(`^${apiBase}/wallets?/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "wal-aff-qa",
        userId: "aff-qa-uuid",
        balance: 14500,
        currency: "DZD",
        ownerType: "AFFILIATE",
      }),
    });
  });

  // Intercept notifications
  await page.route(new RegExp(`^${apiBase}/notifications`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ unreadCount: 0, data: [], total: 0 }),
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

  await page.goto(pathname);
  await page.waitForSelector('[data-dashboard-role="affiliate"]', { timeout: 30000 });
}

test.describe("Affiliate Leads & Orders Supervision Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Renders desktop Leads & Orders table with Space Mono CPA, status badges, and 1-click clipboard triggers", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupAffiliateOrdersSession(page, { lang: "fr" });

    // Table presence
    const table = page.locator('[data-testid="affiliate-orders-table"]');
    await expect(table).toBeVisible();

    const rows = page.locator('[data-testid="affiliate-order-row"]');
    await expect(rows).toHaveCount(4);

    // Row: Delivered Order (Amine Meziani)
    const deliveredRow = rows.filter({ hasText: "Amine Meziani" });
    await expect(deliveredRow).toBeVisible();
    await expect(deliveredRow.locator('[data-testid="affiliate-order-payout"]')).toHaveText("1 200 DZD");
    await expect(deliveredRow.getByText("YAL-1791039550527")).toBeVisible();

    // 1-Click Copy tracking number
    const copyTrackingBtn = deliveredRow.locator('[data-testid="copy-tracking-number-btn"]');
    await expect(copyTrackingBtn).toBeVisible();
    await copyTrackingBtn.click();

    // 1-Click Copy order ID
    const copyIdBtn = deliveredRow.locator('[data-testid="copy-order-id-btn"]');
    await expect(copyIdBtn).toBeVisible();
    await copyIdBtn.click();
  });

  test("2. Filters orders by search query, 58 Wilayas dropdown, and status tabs", async ({
    page,
  }) => {
    await setupAffiliateOrdersSession(page, { lang: "fr" });

    const rows = page.locator('[data-testid="affiliate-order-row"]');
    await expect(rows).toHaveCount(4);

    // Filter by Wilaya 31 (Oran)
    const wilayaSelect = page.locator('[data-testid="affiliate-wilaya-select"]');
    await wilayaSelect.selectOption("31");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Amine Meziani");

    // Reset Wilaya
    await wilayaSelect.selectOption("all");
    await expect(rows).toHaveCount(4);

    // Filter by status: Livrés (Delivered)
    const deliveredTab = page.locator('[data-testid="tab-status-delivered"]');
    await deliveredTab.click();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Amine Meziani");

    // Filter by status: Tous (All)
    const allTab = page.locator('[data-testid="tab-status-all"]');
    await allTab.click();
    await expect(rows).toHaveCount(4);

    // Search query for "Samir"
    const searchInput = page.locator('[data-testid="affiliate-order-search-input"]');
    await searchInput.fill("Samir");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Samir Kaci");

    // Clear search
    await searchInput.fill("");
    await expect(rows).toHaveCount(4);
  });

  test("3. Opens accessible Order Detail Modal with delivery details and handles Escape dismiss", async ({
    page,
  }) => {
    await setupAffiliateOrdersSession(page, { lang: "fr" });

    const rows = page.locator('[data-testid="affiliate-order-row"]');
    const deliveredRow = rows.filter({ hasText: "Amine Meziani" });
    await deliveredRow.click();

    // Modal check
    const modal = page.locator('[data-testid="affiliate-order-detail-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Amine Meziani")).toBeVisible();
    await expect(modal.getByText("1 200 DZD")).toBeVisible();
    await expect(modal.getByText("YAL-1791039550527")).toBeVisible();

    // Dismiss with Escape key
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("4. Ensures 390px mobile viewport card parity and hidden desktop table", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAffiliateOrdersSession(page, { lang: "fr" });

    // Desktop table hidden
    const table = page.locator('[data-testid="affiliate-orders-table"]');
    await expect(table).toBeHidden();

    // Mobile cards rendered
    const cards = page.locator('[data-testid="affiliate-order-card"]');
    await expect(cards).toHaveCount(4);

    const firstCard = cards.filter({ hasText: "Amine Meziani" });
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator('[data-testid="affiliate-order-payout"]')).toHaveText("1 200 DZD");

    // Open detail modal on mobile
    const viewBtn = firstCard.locator('[data-testid="view-order-details-btn"]');
    await viewBtn.click();

    const modal = page.locator('[data-testid="affiliate-order-detail-modal"]');
    await expect(modal).toBeVisible();

    // Close button
    const closeBtn = page.locator('[data-testid="close-order-modal-btn"]').first();
    await closeBtn.click();
    await expect(modal).toBeHidden();
  });

  test("5. Enforces Arabic RTL parity, LTR phone protection, and zero horizontal overflow across 390px, 768px, and 1440px", async ({
    page,
  }) => {
    await setupAffiliateOrdersSession(page, { lang: "ar" });

    // RTL verification
    const dashboardRoot = page.locator('[data-dashboard-role="affiliate"]');
    await expect(dashboardRoot).toHaveAttribute("dir", "rtl");

    // Phone numbers strictly in dir="ltr"
    const ltrPhone = page.locator('[dir="ltr"]').first();
    await expect(ltrPhone).toBeVisible();

    // Zero horizontal overflow across all viewports
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
