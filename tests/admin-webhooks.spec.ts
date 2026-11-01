import { expect, test, type Page } from "@playwright/test";

const mockWebhooksList = [
  {
    id: "evt-01",
    provider: "Yalidine",
    providerEventId: "yal-ev-9001",
    trackingNumber: "YAL-ALG-987123",
    receivedStatus: "Livré",
    normalizedStatus: "delivered",
    processingStatus: "PROCESSED",
    errorMessage: null,
    rawPayload: JSON.stringify({
      tracking: "YAL-ALG-987123",
      status: "Livré",
      centre: "Alger Centre",
      timestamp: "2026-10-08T12:00:00Z",
    }),
    createdAt: "2026-10-08T12:00:00.000Z",
    updatedAt: "2026-10-08T12:00:02.000Z",
  },
  {
    id: "evt-02",
    provider: "Yalidine",
    providerEventId: "yal-ev-9002",
    trackingNumber: "YAL-ORN-445566",
    receivedStatus: "Échoué",
    normalizedStatus: "failed",
    processingStatus: "FAILED",
    errorMessage: "Signature HMAC invalide ou rejetée",
    rawPayload: JSON.stringify({
      tracking: "YAL-ORN-445566",
      status: "Échoué",
      error: "HMAC mismatch",
    }),
    createdAt: "2026-10-08T11:30:00.000Z",
    updatedAt: "2026-10-08T11:30:01.000Z",
  },
  {
    id: "evt-03",
    provider: "ZR Express",
    providerEventId: "zr-ev-3001",
    trackingNumber: "ZR-CST-889900",
    receivedStatus: "En transit",
    normalizedStatus: "in_transit",
    processingStatus: "IGNORED",
    errorMessage: null,
    rawPayload: JSON.stringify({
      tracking: "ZR-CST-889900",
      status: "En transit",
      hub: "Constantine Hub",
    }),
    createdAt: "2026-10-08T10:15:00.000Z",
    updatedAt: "2026-10-08T10:15:01.000Z",
  },
  {
    id: "evt-04",
    provider: "Yalidine",
    providerEventId: "yal-ev-9003",
    trackingNumber: "YAL-BLD-112233",
    receivedStatus: "Retourné",
    normalizedStatus: "returned",
    processingStatus: "PROCESSED",
    errorMessage: null,
    rawPayload: JSON.stringify({
      tracking: "YAL-BLD-112233",
      status: "Retourné",
      reason: "Client injoignable",
    }),
    createdAt: "2026-10-08T09:45:00.000Z",
    updatedAt: "2026-10-08T09:45:02.000Z",
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

async function setupAdminWebhooksSession(
  page: Page,
  lang: "fr" | "ar" | "en" = "fr"
): Promise<void> {
  const apiBase = "http://localhost:4000";

  await page.route(new RegExp(`^${apiBase}/admin/webhooks`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockWebhooksList),
    });
  });

  await page.route(new RegExp(`^${apiBase}/webhooks/courier`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Webhook simulé avec succès",
      }),
    });
  });

  await page.addInitScript(
    ({ token, langKey }) => {
      window.localStorage.setItem("vitedrop_token", token);
      window.localStorage.setItem("vitedrop_lang", langKey);
    },
    { token: createAdminToken(), langKey: lang }
  );

  await page.goto("/admin/webhooks", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
}

test.describe("Admin Courier Telemetry & Webhooks Suite", () => {
  test("renders desktop webhooks table with carrier badges, tracking numbers, and copy triggers", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupAdminWebhooksSession(page, "fr");

    // Header check
    await expect(page.locator("h1")).toContainText("Surveillance des Webhooks");

    // Table rows
    const rows = page.locator('[data-testid="admin-webhook-row"]');
    await expect(rows).toHaveCount(4);

    // Verify first row: Yalidine, YAL-ALG-987123, PROCESSED
    const firstRow = rows.first();
    await expect(firstRow).toContainText("Yalidine");
    await expect(firstRow).toContainText("YAL-ALG-987123");
    await expect(firstRow).toContainText("PROCESSED");

    // Check phone/tracking dir="ltr"
    const trackingLtr = firstRow.locator('span[dir="ltr"]').filter({ hasText: "YAL-ALG-987123" });
    await expect(trackingLtr).toBeVisible();

    // Verify 1-click clipboard copy on tracking number
    const copyTrackingBtn = firstRow.locator('[data-testid="copy-tracking-btn"]');
    await expect(copyTrackingBtn).toBeVisible();
    await copyTrackingBtn.click();
    await expect(firstRow.locator("svg.text-emerald-600")).toBeVisible();

    // Verify FAILED event with error message (2nd row)
    const failedRow = rows.nth(1);
    await expect(failedRow).toContainText("FAILED");
    await expect(failedRow).toContainText("Signature HMAC invalide");
  });

  test("mobile card parity at 390px viewport with 1-click copy triggers", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAdminWebhooksSession(page, "fr");

    // Desktop table should be hidden, mobile cards visible
    await expect(page.locator("table")).toBeHidden();
    const cards = page.locator('[data-testid="admin-webhook-card"]');
    await expect(cards).toHaveCount(4);

    // First card verification
    const firstCard = cards.first();
    await expect(firstCard).toContainText("Yalidine");
    await expect(firstCard).toContainText("YAL-ALG-987123");
    await expect(firstCard).toContainText("PROCESSED");

    // Check mobile tracking copy
    const copyBtn = firstCard.locator('[data-testid="copy-tracking-btn"]');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(firstCard.locator("svg.text-emerald-600")).toBeVisible();
  });

  test("raw JSON payload inspector modal flow with formatted code and 1-click copy", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupAdminWebhooksSession(page, "fr");

    const rows = page.locator('[data-testid="admin-webhook-row"]');
    const firstRow = rows.first();

    // Click JSON button
    const viewJsonBtn = firstRow.locator('[data-testid="view-payload-btn"]');
    await expect(viewJsonBtn).toBeVisible();
    await viewJsonBtn.click();

    // Payload modal opens
    const modal = page.locator('[data-testid="webhook-payload-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Payload Brut du Webhook");
    await expect(modal).toContainText("Alger Centre");

    // Click copy JSON button
    const copyJsonBtn = modal.locator('[data-testid="copy-payload-btn"]');
    await expect(copyJsonBtn).toBeVisible();
    await copyJsonBtn.click();
    await expect(modal.locator("svg.text-emerald-600")).toBeVisible();

    // Close modal via Escape
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("courier webhook simulation flow validates tracking and dispatches mock signal", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupAdminWebhooksSession(page, "fr");

    // Open simulation modal
    const openSimBtn = page.locator('[data-testid="simulate-webhook-modal-btn"]');
    await expect(openSimBtn).toBeVisible();
    await openSimBtn.click();

    const simModal = page.locator('[data-testid="simulate-webhook-modal"]');
    await expect(simModal).toBeVisible();
    await expect(simModal).toContainText("Simuler un Webhook Transporteur");

    // Try submitting without tracking -> Error
    const confirmBtn = simModal.locator('[data-testid="confirm-simulation-btn"]');
    await confirmBtn.click();
    const errorAlert = simModal.locator('[data-testid="simulate-error-alert"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("numéro de suivi est requis");

    // Fill tracking and select Delivered
    const trackingInput = simModal.locator('[data-testid="simulate-tracking-input"]');
    await trackingInput.fill("YAL-SIM-999000");

    const deliveredOption = simModal.locator('[data-testid="simulate-status-delivered"]');
    await deliveredOption.click();

    // Submit simulation
    await confirmBtn.click();
    await expect(simModal).toBeHidden();

    // Banner should confirm simulation
    await expect(page.locator("main")).toContainText("simulée avec succès pour YAL-SIM-999000");
  });

  test("Arabic RTL parity across webhook telemetry dashboard", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupAdminWebhooksSession(page, "ar");

    // Arabic title
    await expect(page.locator("h1")).toContainText("سجل إشعارات التوصيل");

    // Telemetry metric cards
    await expect(page.locator("main")).toContainText("معالجة بنجاح");
    await expect(page.locator("main")).toContainText("فشل المعالجة");

    // Tracking numbers remain LTR
    const rows = page.locator('[data-testid="admin-webhook-row"]');
    const trackingLtr = rows.first().locator('span[dir="ltr"]').first();
    await expect(trackingLtr).toBeVisible();
  });

  test("viewport stability: zero horizontal overflow across 390px, 768px, and 1440px", async ({
    page,
  }) => {
    const viewports = [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await setupAdminWebhooksSession(page, "fr");

      const hasHorizontalScrollbar = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });
      expect(hasHorizontalScrollbar).toBeFalsy();
    }
  });
});
