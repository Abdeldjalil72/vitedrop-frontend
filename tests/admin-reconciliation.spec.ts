import { expect, test, type Page } from "@playwright/test";

const mockSummary = {
  totalWalletsChecked: 42,
  walletVariancesCount: 1,
  totalVarianceAmount: 1200,
  totalOrdersChecked: 158,
  orderAnomaliesCount: 1,
  ordersWithDuplicateTransactions: 0,
  lastRun: { createdAt: "2026-10-08T15:30:00.000Z" },
};

const mockWallets = [
  {
    walletId: "wallet-uuid-001",
    ownerId: "user-affiliate-01",
    ownerType: "AFFILIATE",
    cachedBalance: 24000,
    ledgerSum: 22800,
    variance: 1200,
  },
];

const mockOrders = [
  {
    orderId: "order-cpa-anomaly-01",
    orderStatus: "delivered",
    trackingNumber: "YAL-DZ-998812",
    expectedCpa: 1600,
    supplierDebitSum: 1600,
    affiliatePayoutSum: 0,
    platformFeeSum: 0,
    issue: "Écriture de commission affilié manquante dans le grand livre",
  },
];

const mockRuns = [
  {
    id: "run-cycle-uuid-001",
    createdAt: "2026-10-08T15:30:00.000Z",
    walletsAudited: 42,
    walletsWithVariance: 1,
    ordersAudited: 158,
    ordersWithAnomalies: 1,
    status: "COMPLETED",
  },
];

function createAdminToken(): string {
  const payload = {
    sub: "admin-qa-uuid",
    email: "admin@vitedrop.com",
    role: "ADMIN",
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `header.${base64Payload}.signature`;
}

async function setupReconciliationSession(
  page: Page,
  lang: "fr" | "ar" | "en" = "fr"
): Promise<void> {
  const apiBase = "http://localhost:4000";

  await page.route(`${apiBase}/admin/reconciliation/summary*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockSummary),
    });
  });

  await page.route(`${apiBase}/admin/reconciliation/wallets*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockWallets),
    });
  });

  await page.route(`${apiBase}/admin/reconciliation/orders*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockOrders),
    });
  });

  await page.route(`${apiBase}/admin/reconciliation/runs*`, async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          run: {
            id: "run-cycle-new-002",
            createdAt: "2026-10-08T18:00:00.000Z",
            walletsAudited: 42,
            walletsWithVariance: 0,
            status: "SUCCESS",
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockRuns),
    });
  });

  await page.route(`${apiBase}/admin/stats*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ platformRevenue: 1280000, pendingDisbursements: 45000 }),
    });
  });

  await page.route(`${apiBase}/admin/users*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(`${apiBase}/notifications*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(`${apiBase}/wallets/me*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ balance: 0, pendingBalance: 0, paidOutTotal: 0 }),
    });
  });

  // Inject token and language into localStorage before page scripts execute
  await page.addInitScript(
    ({ token, selectedLang }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", selectedLang);
    },
    { token: createAdminToken(), selectedLang: lang }
  );

  await page.goto("/admin/reconciliation");
  await page.waitForSelector('[data-dashboard-role="admin"]', { timeout: 30000 });
}

test.describe("Admin Escrow Reconciliation Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("renders Swiss Treasury summary cards, audit posture, and wallet variance table", async ({
    page,
  }) => {
    await setupReconciliationSession(page, "fr");

    // Header & Eyebrow
    await expect(page.getByRole("heading", { name: /Réconciliation Financière/i })).toBeVisible();

    // Summary Cards (4 Cards)
    await expect(page.locator("text=Portefeuilles Audités").first()).toBeVisible();
    await expect(page.locator("text=Écart Total (Variance)").first()).toBeVisible();
    await expect(page.locator("text=Commandes Livrées").first()).toBeVisible();
    await expect(page.locator("text=Dernier Audit Automatisé").first()).toBeVisible();

    // Posture status line
    await expect(page.locator("text=Anomalies détectées requérant révision")).toBeVisible();

    // Wallet discrepancy row
    const walletRow = page.locator("tr", { hasText: "wallet-u" });
    await expect(walletRow).toBeVisible();
    await expect(walletRow.locator("text=+1 200 DZD")).toBeVisible();
    await expect(walletRow.locator("text=Anomalie Détectée")).toBeVisible();
  });

  test("mobile card parity at 390px (wallets and order anomalies)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupReconciliationSession(page, "fr");

    // Verify wallet card on mobile viewport
    const mobileWalletCard = page
      .locator('[data-testid="reconciliation-wallet-card"]')
      .first();
    await expect(mobileWalletCard).toBeVisible();
    await expect(mobileWalletCard.locator("text=+1 200 DZD")).toBeVisible();

    // Switch to Orders tab
    await page.getByRole("button", { name: /Anomalies Commandes/i }).click();

    // Verify order anomaly mobile card
    const mobileOrderCard = page
      .locator('[data-testid="reconciliation-order-card"]')
      .first();
    await expect(mobileOrderCard).toBeVisible();
    await expect(
      mobileOrderCard.locator("text=Écriture de commission affilié manquante")
    ).toBeVisible();
    await expect(mobileOrderCard.getByRole("button", { name: "Inspecter" })).toBeVisible();
  });

  test("audit run confirmation modal flow and execution feedback", async ({ page }) => {
    await setupReconciliationSession(page, "fr");

    // Click primary Racing Green trigger
    await page.getByRole("button", { name: "Lancer un Cycle d'Audit" }).click();

    // Confirmation modal should be visible
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator("#confirm-run-title")).toContainText(
      "Lancer le Cycle de Réconciliation ?"
    );

    // Press Escape to test dismissal
    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);

    // Re-open modal and confirm execution
    await page.getByRole("button", { name: "Lancer un Cycle d'Audit" }).click();
    await modal.getByRole("button", { name: "Exécuter l'Audit" }).click();

    // Modal closes and success feedback is displayed
    await expect(modal).toHaveCount(0);
    const successAlert = page.locator('div[role="status"]');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText("Cycle d'audit #run-cycl exécuté avec succès");
  });

  test("Arabic RTL parity across reconciliation dashboard", async ({ page }) => {
    await setupReconciliationSession(page, "ar");

    // RTL direction
    await expect(page.locator('[dir="rtl"]')).toBeVisible();

    // Arabic title
    await expect(
      page.getByRole("heading", { name: /مطابقة القيود وسلامة الحسابات المالية/i })
    ).toBeVisible();

    // Arabic tabs
    await expect(page.getByRole("button", { name: /فروقات المحافظ/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /شذوذ تسوية الطلبيات/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /سجل دورات التدقيق/i })).toBeVisible();

    // Arabic discrepancy badge
    const walletRow = page.locator("tr", { hasText: "wallet-u" });
    await expect(walletRow.locator("text=فارق محاسبي")).toBeVisible();
  });

  test("English history evidence supports copy feedback and remains within each required viewport", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupReconciliationSession(page, "en");

    await expect(
      page.getByRole("heading", { name: "Financial Escrow Reconciliation" })
    ).toBeVisible();
    await page.getByRole("button", { name: /Audit Run History/i }).click();

    const historyRow = page.locator("tr", { hasText: "run-cycl" });
    await expect(historyRow).toBeVisible();
    await expect(historyRow.getByText("42", { exact: true })).toBeVisible();
    await historyRow.getByRole("button", { name: "Copy" }).click();
    await expect(historyRow.locator("svg.text-emerald-600")).toBeVisible();

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
          )
        )
        .toBe(true);
    }
  });

  test("a failed audit run preserves loaded evidence and restores the controls", async ({ page }) => {
    await setupReconciliationSession(page, "en");
    const apiBase = "http://localhost:4000";

    await page.unroute(`${apiBase}/admin/reconciliation/runs*`);
    await page.route(`${apiBase}/admin/reconciliation/runs*`, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Audit service unavailable" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockRuns),
      });
    });

    await page.getByRole("button", { name: "Run Audit Cycle" }).click();
    const modal = page.getByRole("dialog");
    await modal.getByRole("button", { name: "Execute Audit" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Audit service unavailable" })
    ).toBeVisible();
    await expect(page.locator("tr", { hasText: "wallet-u" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Run Audit Cycle" })).toBeEnabled();
  });
});
