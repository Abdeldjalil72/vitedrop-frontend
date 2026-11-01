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

test.describe("Supplier Priority 2: Multi-Lead Batch Actions & Speed-Dial Suite", () => {
  test("1. Multi-lead selection on Desktop queue table and floating drawer appearance", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSupplierSession(page, "fr");
    await page.goto("/supplier");
    await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 20000 });

    // Drawer should initially not be visible
    const drawer = page.locator('[data-testid="supplier-batch-drawer"]');
    await expect(drawer).not.toBeVisible();

    // Check "Select All"
    const selectAllCheckbox = page.locator('[data-testid="select-all-leads-checkbox"]');
    await expect(selectAllCheckbox).toBeVisible();
    await selectAllCheckbox.click();

    // Drawer should appear with count 2 and total CPA
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("2");
    await expect(drawer.locator('[data-testid="batch-confirm-btn"]')).toBeVisible();

    // Deselect all
    const deselectBtn = page.locator('[data-testid="batch-deselect-btn"]');
    await deselectBtn.click();
    await expect(drawer).not.toBeVisible();

    // Select single lead
    const singleLeadCheckbox = page.locator('[data-testid="lead-select-checkbox-lead-algiers-101"]');
    await singleLeadCheckbox.click();
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("1");
  });

  test("2. Executes batch confirmation flow and dismisses drawer with in-page alert", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSupplierSession(page, "fr");
    await page.goto("/supplier");
    await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 20000 });

    // Select all leads
    await page.locator('[data-testid="select-all-leads-checkbox"]').click();
    const batchConfirmBtn = page.locator('[data-testid="batch-confirm-btn"]');
    await expect(batchConfirmBtn).toBeVisible();

    // Click batch confirm
    await batchConfirmBtn.click();

    // Should display in-page success alert
    const alert = page.locator('[data-testid="supplier-action-alert"]');
    await expect(alert).toBeVisible();

    // Drawer should disappear after confirmation
    const drawer = page.locator('[data-testid="supplier-batch-drawer"]');
    await expect(drawer).not.toBeVisible();
  });

  test("3. Executes batch unanswered (+1 call attempt) action across selected leads", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSupplierSession(page, "fr");
    await page.goto("/supplier");
    await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 20000 });

    // Verify initial count is 0/3 on visible rows
    const attemptBtns = page.locator('tbody [data-testid="call-attempt-btn"]');
    await expect(attemptBtns.first()).toContainText("0/3");
    await expect(attemptBtns.nth(1)).toContainText("0/3");

    // Select all leads
    await page.locator('[data-testid="select-all-leads-checkbox"]').click();

    // Click batch unanswered attempt
    const batchAttemptBtn = page.locator('[data-testid="batch-attempt-btn"]');
    await expect(batchAttemptBtn).toBeVisible();
    await batchAttemptBtn.click();

    // Both attempt counters should now read 1/3
    await expect(attemptBtns.first()).toContainText("1/3");
    await expect(attemptBtns.nth(1)).toContainText("1/3");
  });

  test("4. Speed-Dial / Focus Mode: Opens hero panel, displays customer details, and navigates leads", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSupplierSession(page, "fr");
    await page.goto("/supplier");
    await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 20000 });

    // Click Speed-Dial button
    const toggleFocusBtn = page.locator('[data-testid="toggle-focus-mode-btn"]');
    await expect(toggleFocusBtn).toBeVisible();
    await toggleFocusBtn.click();

    // Speed-Dial hero panel should be visible
    const speedDialPanel = page.locator('[data-testid="speed-dial-panel"]');
    await expect(speedDialPanel).toBeVisible();

    // Should display first lead details: Walid Ziane, Alger, Bab Ezzouar
    await expect(speedDialPanel).toContainText("Walid Ziane");
    await expect(speedDialPanel).toContainText("Alger");
    await expect(speedDialPanel).toContainText("Bab Ezzouar");

    // Phone link and WhatsApp trigger
    await expect(speedDialPanel.locator('[data-testid="focus-phone-link"]')).toContainText("0555123456");
    await expect(speedDialPanel.locator('[data-testid="focus-whatsapp-btn"]')).toBeVisible();

    // Click Next lead
    const nextBtn = page.locator('[data-testid="focus-next-btn"]');
    await nextBtn.click();
    await expect(speedDialPanel).toContainText("Yasmine Taleb");
    await expect(speedDialPanel).toContainText("Oran");

    // Click Prev lead
    const prevBtn = page.locator('[data-testid="focus-prev-btn"]');
    await prevBtn.click();
    await expect(speedDialPanel).toContainText("Walid Ziane");

    // Exit Speed-Dial
    const closeBtn = page.locator('[data-testid="focus-close-btn"]');
    await closeBtn.click();
    await expect(speedDialPanel).not.toBeVisible();
  });

  test("5. Mobile Viewport (390px) card checkbox selection and responsive batch drawer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSupplierSession(page, "fr");
    await page.goto("/supplier");
    await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 20000 });

    const mobileCards = page.locator('[data-testid="supplier-lead-card"]');
    await expect(mobileCards.first()).toBeVisible();

    // Check first mobile lead card checkbox
    const mobileCheckbox = page.locator('[data-testid="lead-select-checkbox-mobile-lead-algiers-101"]');
    await expect(mobileCheckbox).toBeVisible();
    await mobileCheckbox.click();

    // Mobile batch drawer should appear
    const drawer = page.locator('[data-testid="supplier-batch-drawer"]');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("1");
  });
});
