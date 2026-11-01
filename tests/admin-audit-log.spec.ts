import { expect, test, type Page } from "@playwright/test";

const mockAuditLogs = [
  {
    id: "log-uuid-001",
    adminId: "admin-qa-uuid",
    adminEmail: "admin@vitedrop.com",
    action: "WITHDRAWAL_APPROVE",
    entityType: "Withdrawal",
    entityId: "wth-test-uuid-99",
    beforeState: { status: "PENDING", amount: 65000 },
    afterState: { status: "APPROVED", amount: 65000, reviewedBy: "admin@vitedrop.com" },
    reason: "Paiement CCP conforme et pièces jointes vérifiées",
    ipAddress: "197.200.45.12",
    createdAt: "2026-10-08T14:32:00.000Z",
  },
  {
    id: "log-uuid-002",
    adminId: "admin-qa-uuid",
    adminEmail: "admin@vitedrop.com",
    action: "USER_STATUS_CHANGE",
    entityType: "User",
    entityId: "usr-affiliate-01",
    beforeState: { isActive: true },
    afterState: { isActive: false },
    reason: "Suspicion de faux leads sur Wilaya 16",
    ipAddress: "197.200.45.12",
    createdAt: "2026-10-08T13:15:00.000Z",
  },
  {
    id: "log-uuid-003",
    adminId: "admin-qa-uuid",
    adminEmail: "admin@vitedrop.com",
    action: "PRODUCT_STATUS_CHANGE",
    entityType: "Product",
    entityId: "prod-cosmetic-01",
    beforeState: { status: "active" },
    afterState: { status: "suspended" },
    reason: "Rupture de stock fournisseur",
    ipAddress: "197.200.45.12",
    createdAt: "2026-10-08T11:00:00.000Z",
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

async function setupAdminAuditLogSession(
  page: Page,
  lang: "fr" | "ar" | "en" = "fr"
): Promise<void> {
  const apiBase = "http://localhost:4000";

  await page.route(new RegExp(`^${apiBase}/admin/audit-logs`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: mockAuditLogs,
        total: mockAuditLogs.length,
        limit: 25,
        offset: 0,
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

  await page.goto("/admin/audit-log", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
}

test.describe("Admin Immutable Audit Trail Suite", () => {
  test("renders desktop audit log table with action badges, operators, and reasons", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupAdminAuditLogSession(page, "fr");

    // Title verification
    await expect(page.locator("h1")).toContainText("Journal d'Audit");

    // Table rows
    const rows = page.locator('[data-testid="admin-audit-row"]');
    await expect(rows).toHaveCount(3);

    // Verify first row
    const firstRow = rows.first();
    await expect(firstRow).toContainText("WITHDRAWAL_APPROVE");
    await expect(firstRow).toContainText("admin@vitedrop.com");
    await expect(firstRow).toContainText("Withdrawal");
    await expect(firstRow).toContainText("Paiement CCP conforme");

    // Verify second row
    const secondRow = rows.nth(1);
    await expect(secondRow).toContainText("USER_STATUS_CHANGE");
    await expect(secondRow).toContainText("Suspicion de faux leads");
  });

  test("mobile card parity at 390px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAdminAuditLogSession(page, "fr");

    // Table hidden, cards visible
    await expect(page.locator("table")).toBeHidden();
    const cards = page.locator('[data-testid="admin-audit-card"]');
    await expect(cards).toHaveCount(3);

    // First card verification
    const firstCard = cards.first();
    await expect(firstCard).toContainText("WITHDRAWAL_APPROVE");
    await expect(firstCard).toContainText("Withdrawal");
    await expect(firstCard).toContainText("admin@vitedrop.com");
  });

  test("diff inspector modal flow reveals side-by-side state mutations", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupAdminAuditLogSession(page, "fr");

    const rows = page.locator('[data-testid="admin-audit-row"]');
    const firstRow = rows.first();

    // Click Diff button
    const diffBtn = firstRow.locator('[data-testid="view-diff-btn"]');
    await expect(diffBtn).toBeVisible();
    await diffBtn.click();

    // Modal opens
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Inspection du Changement d'État");
    await expect(modal).toContainText("WITHDRAWAL_APPROVE");
    await expect(modal).toContainText("PENDING");
    await expect(modal).toContainText("APPROVED");

    // Close modal via close button
    const closeBtn = modal.locator('button[aria-label="Close"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await expect(modal).toBeHidden();
  });

  test("Arabic RTL parity across audit trail", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupAdminAuditLogSession(page, "ar");

    // Arabic title
    await expect(page.locator("h1")).toContainText("سجل تدقيق العمليات الإدارية");

    // Badges and action rows
    const rows = page.locator('[data-testid="admin-audit-row"]');
    await expect(rows).toHaveCount(3);
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
      await setupAdminAuditLogSession(page, "fr");

      const hasHorizontalScrollbar = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });
      expect(hasHorizontalScrollbar).toBeFalsy();
    }
  });
});
