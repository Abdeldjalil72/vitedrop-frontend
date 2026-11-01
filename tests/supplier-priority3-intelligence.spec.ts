import { expect, test, type Page } from "@playwright/test";

function createSupplierToken(): string {
  const payload = {
    sub: "sup-qa-uuid",
    email: "supplier@vitedrop.com",
    role: "SUPPLIER",
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `header.${base64Payload}.signature`;
}

const mockSupplierProducts = [
  {
    id: "prod-earbuds-01",
    name: "Écouteurs Sans Fil Pro ANC",
    description: "Écouteurs sans fil avec réduction active du bruit",
    stock: 85,
    retailPrice: 4500,
    supplierTotalCpa: 1200,
    status: "active",
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "prod-watch-02",
    name: "Montre Connectée Sport Pulse",
    description: "Montre cardio étanche IP68",
    stock: 12,
    retailPrice: 6200,
    supplierTotalCpa: 1500,
    status: "out_of_stock",
    createdAt: "2026-10-02T12:00:00.000Z",
  },
  {
    id: "prod-speaker-03",
    name: "Enceinte Nomade BassBox",
    description: "Son 360 stéréo waterproof",
    stock: 45,
    retailPrice: 3800,
    supplierTotalCpa: 900,
    status: "active",
    createdAt: "2026-10-03T14:00:00.000Z",
  },
];

const mockLeadsQueue = [
  {
    id: "lead-alger-101",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-01",
    cpaCommission: 1200,
    platformFee: 300,
    status: "pending",
    customerName: "Amine Benali",
    customerPhone: "0555123456",
    address: "Rue Didouche Mourad",
    productId: "prod-earbuds-01",
    productName: "Écouteurs Sans Fil Pro ANC",
    quantity: 1,
    wilaya: 16, // Alger -> High Density hub (94% Succès)
    commune: "Sidi M'Hamed",
    trackingNumber: null,
    courier: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-ghardaia-102",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-02",
    cpaCommission: 1500,
    platformFee: 375,
    status: "pending",
    customerName: "Mourad Belkacem",
    customerPhone: "0666789012",
    address: "Avenue Ksar El Atteuf",
    productId: "prod-watch-02",
    productName: "Montre Connectée Sport Pulse",
    quantity: 1,
    wilaya: 47, // Ghardaïa -> Stop-Desk Recommended (68%)
    commune: "El Atteuf",
    trackingNumber: null,
    courier: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lead-setif-103",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-03",
    cpaCommission: 900,
    platformFee: 225,
    status: "pending",
    customerName: "Yacine Mansouri",
    customerPhone: "0777456789",
    address: "Cité 1006 Logements",
    productId: "prod-speaker-03",
    productName: "Enceinte Nomade BassBox",
    quantity: 1,
    wilaya: 19, // Sétif -> Standard hub (86% Succès)
    commune: "El Eulma",
    trackingNumber: null,
    courier: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function setupPriority3Session(page: Page, path: string, options: { lang?: "fr" | "ar" | "en"; balance?: number } = {}) {
  const { lang = "fr", balance = 12000 } = options;
  const apiBase = "http://localhost:4000";

  await page.route(new RegExp(`^${apiBase}/supplier/products`), async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSupplierProducts),
      });
      return;
    }
    await route.continue();
  });

  await page.route(new RegExp(`^${apiBase}/supplier/(call-center/)?leads`), async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockLeadsQueue),
      });
      return;
    }
    await route.continue();
  });

  await page.route(new RegExp(`^${apiBase}/supplier/orders`), async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockLeadsQueue),
      });
      return;
    }
    await route.continue();
  });

  await page.route(new RegExp(`^${apiBase}/wallets?/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "wal-sup-qa",
        userId: "sup-qa-uuid",
        balance,
        currency: "DZD",
        ownerType: "SUPPLIER",
      }),
    });
  });

  await page.route(new RegExp(`^${apiBase}/wallets?/transactions`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        total: 0,
        limit: 100,
        offset: 0,
      }),
    });
  });

  await page.route(new RegExp(`^${apiBase}/wallets/deposit-requests$`), async (route) => {
    if (route.request().method() === "POST") {
      const payload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "dep-qa-created-01",
          supplierId: "sup-qa-uuid",
          supplierName: "Comptoir Électronique DZ",
          amount: payload.amount || 10000,
          paymentRail: payload.paymentRail || "BARIDIMOB",
          referenceNote: payload.referenceNote || "TX-DZ-2026-99482",
          receiptUrl: payload.receiptUrl || "data:image/png;base64,mock",
          status: "PENDING",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
      return;
    }
    await route.continue();
  });

  await page.addInitScript(
    ({ token, selectedLang }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", selectedLang);
    },
    { token: createSupplierToken(), selectedLang: lang }
  );

  await page.goto(path);
  await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 30000 });
}

test.describe("Supplier Priority 3: Product Profitability Simulator, RTO Health & Wilaya Delivery Intelligence Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Product Profitability & Break-Even Simulator in Add Product Modal", async ({ page }) => {
    await setupPriority3Session(page, "/supplier/products", { lang: "fr" });

    // Open Add Product modal
    await page.locator('[data-testid="add-product-btn"]').click();
    const modal = page.locator('[data-testid="supplier-product-modal"]');
    await expect(modal).toBeVisible();

    // Fill Retail price and CPA to trigger simulator
    await page.locator('[data-testid="product-name-input"]').fill("Smartwatch Ultra GPS");
    await page.locator('[data-testid="product-stock-input"]').fill("40");
    await page.locator('[data-testid="product-retail-price-input"]').fill("5000");
    await page.locator('[data-testid="product-cpa-input"]').fill("1200");

    // Simulator card should appear
    const simulator = page.locator('[data-testid="product-profitability-simulator"]');
    await expect(simulator).toBeVisible();

    // Verify Break-Even telemetry
    await expect(page.locator('[data-testid="simulator-status-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="simulator-net-margin"]')).toBeVisible();
    const breakevenTag = page.locator('[data-testid="simulator-breakeven-rate"]');
    await expect(breakevenTag).toBeVisible();
    await expect(breakevenTag).toContainText("%");

    // Interactively adjust cost price
    const costInput = page.locator('[data-testid="simulator-cost-price-input"]');
    await costInput.fill("2000");
    await expect(page.locator('[data-testid="simulator-net-margin"]')).toBeVisible();

    // Close modal
    await page.locator('[data-testid="close-product-modal-btn"]').click();
    await expect(modal).toBeHidden();
  });

  test("2. Product Catalog displays Delivery Rate and RTO Performance micro-metrics on Desktop and Mobile", async ({ page }) => {
    await setupPriority3Session(page, "/supplier/products", { lang: "fr" });

    // Desktop table header includes Performance & RTO
    await expect(page.getByRole("columnheader", { name: /Performance & RTO|Taux & Performance/i })).toBeVisible();

    // Product rows display Delivery Rate and RTO Rate badges
    const deliveryRates = page.locator('[data-testid="product-delivery-rate"]');
    await expect(deliveryRates.first()).toBeVisible();
    await expect(deliveryRates.first()).toContainText("%");

    const rtoRates = page.locator('[data-testid="product-rto-rate"]');
    await expect(rtoRates.first()).toBeVisible();
    await expect(rtoRates.first()).toContainText("RTO");

    // Verify 390px Mobile view parity
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileDeliveryRates = page.locator('[data-testid="mobile-product-delivery-rate"]');
    await expect(mobileDeliveryRates.first()).toBeVisible();
    const mobileRtoRates = page.locator('[data-testid="mobile-product-rto-rate"]');
    await expect(mobileRtoRates.first()).toBeVisible();
  });

  test("3. Wilaya Delivery Intelligence on Supplier Call Queue and Speed-Dial Hero Panel", async ({ page }) => {
    await setupPriority3Session(page, "/supplier", { lang: "fr" });

    // Desktop Queue table displays delivery intelligence pills
    const algerIntel = page.locator('[data-testid="queue-wilaya-intel-lead-alger-101"]');
    await expect(algerIntel).toBeVisible();
    // Alger is high-density hub (94% Succès)
    await expect(algerIntel).toContainText("Domicile (94% Succès)");

    const ghardaiaIntel = page.locator('[data-testid="queue-wilaya-intel-lead-ghardaia-102"]');
    await expect(ghardaiaIntel).toBeVisible();
    // Ghardaïa is remote Sahara hub (Stop-Desk Recommandé)
    await expect(ghardaiaIntel).toContainText("Stop-Desk Recommandé");

    // Toggle Speed-Dial Mode to inspect hero panel advice
    await page.locator('[data-testid="toggle-focus-mode-btn"]').click();
    const speedDialPanel = page.locator('[data-testid="speed-dial-panel"]');
    await expect(speedDialPanel).toBeVisible();

    // Hero panel displays Wilaya Intel Badge with detailed advice
    const heroIntelBadge = page.locator('[data-testid="focus-wilaya-intel-badge"]');
    await expect(heroIntelBadge).toBeVisible();
    await expect(page.locator('[data-testid="focus-wilaya-intel-badge-advice"]')).toBeVisible();

    // Navigate to lead 2 (Ghardaïa) in focus mode
    await page.locator('[data-testid="focus-next-btn"]').click();
    await expect(heroIntelBadge).toContainText("Stop-Desk Recommandé");
  });

  test("4. Wilaya Delivery Intelligence on Supplier Orders & Logistics Supervision", async ({ page }) => {
    await setupPriority3Session(page, "/supplier/orders", { lang: "fr" });

    // Desktop Orders table shows Wilaya Intel Badge
    const orderIntel = page.locator('[data-testid^="order-wilaya-intel-"]').first();
    await expect(orderIntel).toBeVisible();

    // Mobile Viewport (390px) shows Wilaya Intel Badge on order cards
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileOrderIntel = page.locator('[data-testid^="mobile-order-wilaya-intel-"]').first();
    await expect(mobileOrderIntel).toBeVisible();
  });

  test("5. Escrow Top-Up Postal Receipt Slip Uploader with Success Feedback Banner", async ({ page }) => {
    await setupPriority3Session(page, "/supplier/products", { lang: "fr" });

    // Open Top-Up modal
    await page.locator('[data-testid="supplier-products-topup-btn"]').click();
    const modal = page.locator('[data-testid="supplier-topup-modal"]');
    await expect(modal).toBeVisible();

    // Receipt uploader section is visible
    const fileInput = page.locator('[data-testid="receipt-slip-file-input"]');
    await expect(fileInput).toBeAttached();

    // Upload mock receipt slip buffer
    await fileInput.setInputFiles({
      name: "recu_baridimob_15000dzd.png",
      mimeType: "image/png",
      buffer: Buffer.from("mock-binary-receipt-data"),
    });

    // Reference note input
    const refInput = page.locator('[data-testid="receipt-slip-ref-input"]');
    await refInput.fill("TX-DZ-2026-99482");

    // Transmit receipt
    const submitBtn = page.locator('[data-testid="submit-receipt-slip-btn"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Success banner appears
    const successBanner = page.locator('[data-testid="receipt-slip-success-banner"]');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText(/transmis avec succès/i);

    // Close modal
    await page.locator('[data-testid="close-topup-modal-btn"]').click();
    await expect(modal).toBeHidden();
  });
});
