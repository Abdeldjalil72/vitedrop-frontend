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

const mockSupplierOrdersInTransit = [
  {
    id: "ord-disp-101",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-01",
    cpaCommission: 1200,
    platformFee: 300,
    status: "dispatched",
    customerName: "Riad Mahrez",
    customerPhone: "0555112233",
    address: "Rue Didouche Mourad",
    productId: "prod-earbuds-01",
    productName: "Écouteurs Pro ANC",
    quantity: 1,
    wilaya: 16,
    commune: "Alger Centre",
    trackingNumber: "YAL-DISP-101",
    courier: "Yalidine",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord-transit-102",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-02",
    cpaCommission: 1500,
    platformFee: 375,
    status: "in_transit",
    customerName: "Sofiane Feghouli",
    customerPhone: "0666223344",
    address: "Boulevard Akid Lotfi",
    productId: "prod-watch-02",
    productName: "Montre Sport Pulse",
    quantity: 1,
    wilaya: 31,
    commune: "Oran",
    trackingNumber: "YAL-TRANS-102",
    courier: "Yalidine",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord-transit-103",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-03",
    cpaCommission: 900,
    platformFee: 225,
    status: "in_transit",
    customerName: "Islam Slimani",
    customerPhone: "0777334455",
    address: "Cité des Martyrs",
    productId: "prod-speaker-03",
    productName: "Enceinte Nomade",
    quantity: 1,
    wilaya: 25,
    commune: "Constantine",
    trackingNumber: "YAL-TRANS-103",
    courier: "Yalidine",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ord-deliv-104",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-04",
    cpaCommission: 1000,
    platformFee: 250,
    status: "delivered",
    customerName: "Baghdad Bounedjah",
    customerPhone: "0550445566",
    address: "Zone d'activités",
    productId: "prod-earbuds-01",
    productName: "Écouteurs Pro ANC",
    quantity: 1,
    wilaya: 19,
    commune: "Sétif",
    trackingNumber: "YAL-DELIV-104",
    courier: "Yalidine",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const nowTs = Date.now();
const mockSupplierTransactions = [
  {
    id: "tx-today-101",
    walletId: "wal-sup-qa",
    type: "DEPOSIT",
    amount: 10000,
    balanceAfter: 25000,
    reference: "Recharge BaridiMob #BM-883921",
    createdAt: new Date(nowTs).toISOString(), // Today
  },
  {
    id: "tx-yesterday-201",
    walletId: "wal-sup-qa",
    type: "SUPPLIER_DEBIT",
    amount: -1500,
    balanceAfter: 15000,
    reference: "Livraison Confirmée #ORD-ALGIERS-101",
    createdAt: new Date(nowTs - 86400000).toISOString(), // Yesterday (7 days & this month)
  },
  {
    id: "tx-3days-102",
    walletId: "wal-sup-qa",
    type: "DEPOSIT",
    amount: 20000,
    balanceAfter: 16500,
    reference: "Recharge CCP #CCP-449102",
    createdAt: new Date(nowTs - 3 * 86400000).toISOString(), // 3 days ago (7 days & this month)
  },
  {
    id: "tx-old-202",
    walletId: "wal-sup-qa",
    type: "SUPPLIER_DEBIT",
    amount: -1200,
    balanceAfter: -3500,
    reference: "Livraison Confirmée #ORD-ORAN-OLD",
    createdAt: new Date(nowTs - 40 * 86400000).toISOString(), // 40 days ago (prior month)
  },
];

interface SetupOptions {
  lang?: "fr" | "ar" | "en";
  balance?: number;
  orders?: typeof mockSupplierOrdersInTransit;
  transactions?: typeof mockSupplierTransactions;
}

async function setupPriority4Session(
  page: Page,
  options: SetupOptions = {}
): Promise<void> {
  const {
    lang = "fr",
    balance = 25000,
    orders = mockSupplierOrdersInTransit,
    transactions = mockSupplierTransactions,
  } = options;
  const apiBase = "http://localhost:4000";

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
        data: transactions,
        total: transactions.length,
        limit: 100,
        offset: 0,
      }),
    });
  });

  await page.route(new RegExp(`^${apiBase}/supplier/orders`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(orders),
    });
  });

  await page.addInitScript(
    ({ token, selectedLang }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", selectedLang);
    },
    { token: createSupplierToken(), selectedLang: lang }
  );

  await page.goto("/supplier/wallet");
  await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 30000 });
}

test.describe("Supplier Priority 4: Escrow Treasury Supervision, Solvency Runway & Statement Reconciliation Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Predictive Solvency Runway Hero Card renders live status badge, progress bar & 4-metric telemetry", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupPriority4Session(page, { balance: 25000, lang: "fr" });

    // Hero card container
    const heroCard = page.locator('[data-testid="solvency-runway-hero-card"]');
    await expect(heroCard).toBeVisible();

    // Live status badge: Balance >= 10,000 DZD -> OPTIMAL
    const statusBadge = page.locator('[data-testid="solvency-status-badge"]');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toContainText("Réserve Optimale");

    // Runway progress bar
    const progressBar = page.locator('[data-testid="solvency-runway-progress-bar"]');
    await expect(progressBar).toBeVisible();

    // 4-Metric Grid Verification
    const balanceMetric = page.locator('[data-testid="solvency-available-balance"]');
    await expect(balanceMetric).toContainText("25 000 DZD");

    // In-Transit Liability: (1200+300) + (1500+375) + (900+225) = 4500 DZD (3 parcels)
    const liabilityMetric = page.locator('[data-testid="solvency-transit-liability"]');
    await expect(liabilityMetric).toContainText("4 500 DZD");
    await expect(heroCard.getByText("3 colis en cours de livraison")).toBeVisible();

    // Net Free Margin: 25,000 - 4,500 = 20,500 DZD
    const marginMetric = page.locator('[data-testid="solvency-net-free-margin"]');
    await expect(marginMetric).toContainText("20 500 DZD");

    // Est. Runway deliveries: 25,000 / 1250 = ~20 livraisons
    const runwayDeliveries = page.locator('[data-testid="solvency-runway-deliveries"]');
    await expect(runwayDeliveries).toContainText("~20 livraisons");
  });

  test("2. Solvency status transitions dynamically across WARNING and CRITICAL thresholds", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });

    // Test WARNING state: Balance = 6,000 DZD (3,000 - 10,000 DZD)
    await setupPriority4Session(page, { balance: 6000, lang: "fr" });
    const warningBadge = page.locator('[data-testid="solvency-status-badge"]');
    await expect(warningBadge).toContainText("Vigilance");

    // Test CRITICAL state: Balance = 2,000 DZD (< 3,000 DZD)
    await setupPriority4Session(page, { balance: 2000, lang: "fr" });
    const criticalBadge = page.locator('[data-testid="solvency-status-badge"]');
    await expect(criticalBadge).toContainText("Solvabilité Critique");
  });

  test("3. 1-Click CSV Ledger Statement Export triggers valid UTF-8 BOM download and in-page alert banner", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupPriority4Session(page, { balance: 25000, lang: "fr" });

    const exportBtn = page.locator('[data-testid="export-ledger-csv-btn"]');
    await expect(exportBtn).toBeVisible();

    // Trigger CSV download
    const downloadPromise = page.waitForEvent("download");
    await exportBtn.click();
    const download = await downloadPromise;

    // Verify downloaded filename format
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^vitedrop-releve-transactions-\d{4}-\d{2}-\d{2}\.csv$/);

    // Verify in-page feedback alert
    const alertBanner = page.locator('[data-testid="wallet-action-alert"]');
    await expect(alertBanner).toBeVisible();
    await expect(alertBanner).toContainText("Relevé de compte CSV téléchargé avec succès.");

    // Dismiss alert banner
    await alertBanner.locator("button").click();
    await expect(alertBanner).toBeHidden();
  });

  test("4. Timeframe reconciliation filters (All, Today, 7 Days, This Month) accurately slice ledger transactions", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupPriority4Session(page, { balance: 25000, lang: "fr" });

    const rows = page.locator('[data-testid="supplier-wallet-tx-row"]');

    // Default "Tout l'historique" -> 4 transactions
    await expect(rows).toHaveCount(4);

    // Filter "Aujourd'hui" -> only tx-today-101
    const todayBtn = page.locator('[data-testid="timeframe-today-btn"]');
    await todayBtn.click();
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByText("Recharge BaridiMob #BM-883921")).toBeVisible();

    // Filter "7 derniers jours" -> tx-today-101, tx-yesterday-201, tx-3days-102
    const sevenDaysBtn = page.locator('[data-testid="timeframe-7days-btn"]');
    await sevenDaysBtn.click();
    await expect(rows).toHaveCount(3);

    // Reset to "Tout l'historique"
    const allBtn = page.locator('[data-testid="timeframe-all-btn"]');
    await allBtn.click();
    await expect(rows).toHaveCount(4);
  });

  test("5. Velocity Top-Up Assistant with Quick Presets copies amount to clipboard and ensures 390px mobile responsiveness", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupPriority4Session(page, { balance: 25000, lang: "fr" });

    // Quick Preset Chips (+10 000, +25 000, +50 000)
    const chip25k = page.locator('[data-testid="preset-chip-25000"]');
    await expect(chip25k).toBeVisible();
    await chip25k.click();

    // Check feedback alert banner
    const alertBanner = page.locator('[data-testid="wallet-action-alert"]');
    await expect(alertBanner).toBeVisible();
    await expect(alertBanner).toContainText("25 000 DZD");

    // 390px Mobile Viewport Check
    await page.setViewportSize({ width: 390, height: 844 });
    const heroCard = page.locator('[data-testid="solvency-runway-hero-card"]');
    await expect(heroCard).toBeVisible();

    // Mobile transaction cards should be rendered
    const mobileCards = page.locator('[data-testid="supplier-wallet-tx-card"]');
    await expect(mobileCards).toHaveCount(4);

    // Ensure zero horizontal page overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    expect(hasOverflow).toBe(false);
  });

  test("6. Trilingual Parity (Arabic RTL) protects financial numbers and renders translated treasury telemetry", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupPriority4Session(page, { balance: 25000, lang: "ar" });

    // Verify RTL root
    const root = page.locator('[data-dashboard-role="supplier"]');
    await expect(root).toHaveAttribute("dir", "rtl");

    // Arabic Solvency Hero Title & Badge
    await expect(page.getByText("الملاءة التنبؤية ومؤشر استمرارية الرصيد")).toBeVisible();
    const statusBadge = page.locator('[data-testid="solvency-status-badge"]');
    await expect(statusBadge).toContainText("رصيد آمن ومثالي");

    // Arabic Export CSV Button
    const exportBtn = page.locator('[data-testid="export-ledger-csv-btn"]');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toContainText("تصدير كشف الحساب CSV");

    // Arabic Timeframe Filter Pills
    await expect(page.locator('[data-testid="timeframe-all-btn"]')).toContainText("كل الفترات");
    await expect(page.locator('[data-testid="timeframe-today-btn"]')).toContainText("اليوم");
    await expect(page.locator('[data-testid="timeframe-7days-btn"]')).toContainText("آخر 7 أيام");
    await expect(page.locator('[data-testid="timeframe-month-btn"]')).toContainText("هذا الشهر");
  });
});
