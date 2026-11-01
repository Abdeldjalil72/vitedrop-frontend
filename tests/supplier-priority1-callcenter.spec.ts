import { expect, test, type Page } from "@playwright/test";

const mockSupplierLeads = [
  {
    id: "lead-algiers-101",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-01",
    cpaCommission: 1200,
    platformFee: 150,
    status: "lead_generated",
    customerName: "Walid Ziane",
    customerPhone: "0555123456",
    address: "Cité 1200 logts bt 4",
    productId: "prod-watch-01",
    productName: "Montre Smartwatch T800 Ultra",
    quantity: 1,
    wilaya: 16,
    commune: "Bab Ezzouar",
    trackingNumber: null,
    courier: null,
    createdAt: "2026-10-08T10:00:00.000Z",
    updatedAt: "2026-10-08T10:00:00.000Z",
  },
  {
    id: "lead-oran-102",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-02",
    cpaCommission: 1500,
    platformFee: 150,
    status: "lead_generated",
    customerName: "Yasmine Taleb",
    customerPhone: "0770987654",
    address: "Rue 1 Novembre",
    productId: "prod-cosmetic-02",
    productName: "Pack Soin Visage Bio",
    quantity: 2,
    wilaya: 31,
    commune: "Es Senia",
    trackingNumber: null,
    courier: null,
    createdAt: "2026-10-08T11:00:00.000Z",
    updatedAt: "2026-10-08T11:00:00.000Z",
  },
];

const mockSupplierOrders = [
  {
    id: "ord-conf-201",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-03",
    cpaCommission: 1000,
    platformFee: 150,
    status: "supplier_confirmed",
    customerName: "Karim Boudiaf",
    customerPhone: "0661223344",
    address: "Zone Industrielle",
    productId: "prod-audio-03",
    productName: "Casque Audio Bluetooth",
    quantity: 1,
    wilaya: 25,
    commune: "El Khroub",
    trackingNumber: null,
    courier: null,
    createdAt: "2026-10-08T12:00:00.000Z",
    updatedAt: "2026-10-08T12:00:00.000Z",
  },
];

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

async function setupSupplierSession(page: Page, lang: "fr" | "en" | "ar" = "fr", balance = 8000) {
  const apiBase = "http://localhost:4000";

  await page.route(new RegExp(`^${apiBase}/supplier/call-center/`), async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes("/call-center/leads") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSupplierLeads),
      });
      return;
    }

    if (url.includes("/confirm") && method === "PATCH") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "supplier_confirmed" }),
      });
      return;
    }

    if (url.includes("/cancel") && method === "PATCH") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "cancelled" }),
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
        body: JSON.stringify(mockSupplierOrders),
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

  await page.addInitScript(
    ({ token, selectedLang }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", selectedLang);
    },
    { token: createSupplierToken(), selectedLang: lang }
  );
}

test.describe("Supplier Priority 1: Call Center Ergonomics & Quick Wins Suite", () => {
  test("1. WhatsApp 1-Click Trigger with Algerian +213 deep link and pre-filled confirmation text", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSupplierSession(page, "fr");
    await page.goto("/supplier");
    await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 20000 });

    // On desktop, find the visible button in table body
    const waButton = page.locator('tbody [data-testid="whatsapp-lead-btn"]').first();
    await expect(waButton).toBeVisible();

    const firstHref = await waButton.getAttribute("href");
    expect(firstHref).not.toBeNull();
    // Phone was 0555123456 -> should be 213555123456 without leading zero
    expect(firstHref).toContain("https://wa.me/213555123456?text=");
    // Should have customer name and product name encoded
    expect(decodeURIComponent(firstHref!)).toContain("Walid Ziane");
    expect(decodeURIComponent(firstHref!)).toContain("Montre Smartwatch T800 Ultra");
    // Target blank
    expect(await waButton.getAttribute("target")).toBe("_blank");
  });

  test("2. Call Attempt Counter (3-Strike Counter) with cycling and localStorage persistence", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSupplierSession(page, "fr");
    await page.goto("/supplier");
    await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 20000 });

    const attemptBtn = page.locator('tbody [data-testid="call-attempt-btn"]').first();
    await expect(attemptBtn).toBeVisible();
    await expect(attemptBtn).toContainText("0/3");

    // Click 1: becomes 1/3
    await attemptBtn.click();
    await expect(attemptBtn).toContainText("1/3");

    // Click 2: becomes 2/3
    await attemptBtn.click();
    await expect(attemptBtn).toContainText("2/3");

    // Click 3: becomes 3/3 (Max warning)
    await attemptBtn.click();
    await expect(attemptBtn).toContainText("3/3");

    // Reload page and verify localStorage persistence
    await page.reload();
    await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 20000 });
    const reloadedAttemptBtn = page.locator('tbody [data-testid="call-attempt-btn"]').first();
    await expect(reloadedAttemptBtn).toContainText("3/3");

    // Click 4: cycles back to 0/3
    await reloadedAttemptBtn.click();
    await expect(reloadedAttemptBtn).toContainText("0/3");
  });

  test("3. Dynamic Escrow Solvency Runway Telemetry in Health Banner and Wallet", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSupplierSession(page, "fr");
    await page.goto("/supplier");
    await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 20000 });

    // Verify Solvency runway badge in Escrow banner
    const banner = page.locator("text=/Couverture estimée : ~|Est. runway: ~/i");
    await expect(banner).toBeVisible();

    // Verify supplier wallet page runway gauge
    await page.goto("/supplier/wallet");
    await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 20000 });
    const walletRunway = page.locator("text=/Couverture : ~|Est. runway: ~/i");
    await expect(walletRunway).toBeVisible();
  });

  test("4. Operator Hotkeys: Legend visible and [R] Refresh / [X] Cancel modal trigger", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSupplierSession(page, "fr");
    await page.goto("/supplier");
    await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 20000 });

    // Verify Hotkeys legend is rendered on desktop
    const legend = page.locator('[data-testid="operator-hotkeys-legend"]');
    await expect(legend).toBeVisible();
    await expect(legend).toContainText("C");
    await expect(legend).toContainText("X");
    await expect(legend).toContainText("R");

    // Trigger [X] hotkey to open cancel modal for the first lead
    await page.keyboard.press("x");
    await expect(page.locator('[data-testid="supplier-cancel-modal"]')).toBeVisible();

    // Trigger [Escape] to close modal
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="supplier-cancel-modal"]')).not.toBeVisible();
  });

  test("5. Mobile Viewport (390px) parity for WhatsApp quick ping and Call attempt counter", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSupplierSession(page, "fr");
    await page.goto("/supplier");
    await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 20000 });

    const mobileCards = page.locator('[data-testid="supplier-lead-card"]');
    await expect(mobileCards.first()).toBeVisible();

    const mobileWaBtn = mobileCards.first().locator('[data-testid="whatsapp-lead-btn"]');
    await expect(mobileWaBtn).toBeVisible();
    const href = await mobileWaBtn.getAttribute("href");
    expect(href).toContain("https://wa.me/213555123456");

    const mobileAttemptBtn = mobileCards.first().locator('[data-testid="call-attempt-btn"]');
    await expect(mobileAttemptBtn).toBeVisible();
    await expect(mobileAttemptBtn).toContainText("0/3");
    await mobileAttemptBtn.click();
    await expect(mobileAttemptBtn).toContainText("1/3");
  });
});
