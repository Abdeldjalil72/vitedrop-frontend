import { expect, test, type Page } from "@playwright/test";

const mockWithdrawals = [
  {
    id: "wd-baridimob-standard",
    userId: "user-1",
    userEmail: "affiliate1@vitedrop.com",
    fullName: "Kamel Benali",
    amount: 800,
    method: "BARIDIMOB",
    recipientDetailsMasked: "RIP: 00799999002345678901 (Kamel Benali)",
    status: "PENDING",
    paymentReference: null,
    adminNote: null,
    createdAt: "2026-10-08T10:00:00.000Z",
  },
  {
    id: "wd-ccp-priority",
    userId: "user-2",
    userEmail: "affiliate2@vitedrop.com",
    fullName: "Amina Mansouri",
    amount: 45000,
    method: "CCP",
    recipientDetailsMasked: "CCP: 1234567 Clé 89 (Amina Mansouri)",
    status: "PENDING",
    paymentReference: null,
    adminNote: null,
    createdAt: "2026-10-08T11:00:00.000Z",
  },
  {
    id: "wd-approved-item",
    userId: "user-3",
    userEmail: "affiliate3@vitedrop.com",
    fullName: "Sofiane Dahmani",
    amount: 15000,
    method: "BARIDIMOB",
    recipientDetailsMasked: "RIP: 00788888001122334455 (Sofiane Dahmani)",
    status: "APPROVED",
    paymentReference: null,
    adminNote: "Vérifié pour lot #4",
    createdAt: "2026-10-08T09:00:00.000Z",
  },
  {
    id: "wd-paid-item",
    userId: "user-4",
    userEmail: "affiliate4@vitedrop.com",
    fullName: "Yacine Belkacem",
    amount: 25000,
    method: "CCP",
    recipientDetailsMasked: "CCP: 7654321 Clé 12 (Yacine Belkacem)",
    status: "PAID",
    paymentReference: "CCP-REC-2026-8812",
    adminNote: "Virement exécuté",
    createdAt: "2026-10-07T14:00:00.000Z",
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

async function setupAdminSession(page: Page, lang: "fr" | "ar" | "en" = "fr"): Promise<void> {
  const apiBase = "http://localhost:4000";

  // Mock API routes to avoid external server dependencies
  await page.route(`${apiBase}/admin/withdrawals*`, async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: mockWithdrawals,
          total: mockWithdrawals.length,
          limit: 20,
          offset: 0,
        }),
      });
      return;
    }

    if (method === "PATCH") {
      // Return updated withdrawal mock
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "wd-mock-updated",
          status: url.includes("/reject")
            ? "REJECTED"
            : url.includes("/paid")
            ? "PAID"
            : url.includes("/failed")
            ? "FAILED"
            : "APPROVED",
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.route(`${apiBase}/admin/stats*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ platformRevenue: 1280000, pendingDisbursements: 45000 }),
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

  await page.goto("/admin/withdrawals");
  await page.waitForSelector('[data-dashboard-role="admin"]', { timeout: 30000 });
}

test.describe("Admin Withdrawals Queue & Modal Tests", () => {
  test.describe.configure({ mode: "serial" });

  test("renders payout rails and enforces priority threshold (desktop table)", async ({ page }) => {
    await setupAdminSession(page, "fr");

    // Verify header and table presence
    await expect(page.getByRole("heading", { name: /Gestion des Retraits Affiliés/i })).toBeVisible();

    // Verify payout rail capsules
    await expect(page.locator("text=BARIDIMOB").first()).toBeVisible();
    await expect(page.locator("text=CCP ALGÉRIE POSTE").first()).toBeVisible();

    // Standard withdrawal (800 DZD) must NOT show PRIORITAIRE tag
    const standardRow = page.locator("tr", { hasText: "Kamel Benali" });
    await expect(standardRow).toBeVisible();
    await expect(standardRow.locator("text=PRIORITAIRE")).toHaveCount(0);

    // Priority withdrawal (45,000 DZD) MUST show PRIORITAIRE tag
    const priorityRow = page.locator("tr", { hasText: "Amina Mansouri" });
    await expect(priorityRow).toBeVisible();
    await expect(priorityRow.locator("text=PRIORITAIRE")).toBeVisible();
  });

  test("mobile card parity: renders priority capsule and 1-click copy at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAdminSession(page, "fr");

    // Verify priority capsule is visible on mobile card for 45,000 DZD
    const mobilePriorityCard = page.locator('[data-testid="admin-withdrawal-card"]').filter({ hasText: "Amina Mansouri" });
    await expect(mobilePriorityCard).toBeVisible();
    await expect(mobilePriorityCard.locator("text=PRIORITAIRE")).toBeVisible();

    // Standard withdrawal mobile card must NOT show priority
    const mobileStandardCard = page.locator('[data-testid="admin-withdrawal-card"]').filter({ hasText: "Kamel Benali" });
    await expect(mobileStandardCard).toBeVisible();
    await expect(mobileStandardCard.locator("text=PRIORITAIRE")).toHaveCount(0);

    // Verify copy button exists on mobile card
    const copyBtn = mobilePriorityCard.locator('button[aria-label="Copier les coordonnées"]');
    await expect(copyBtn).toBeVisible();
  });

  test("client-side validation and modal accessibility (rejection and paid flows)", async ({ page }) => {
    await setupAdminSession(page, "fr");

    // Click Rejeter on pending item
    const row = page.locator("tr", { hasText: "Kamel Benali" });
    await row.getByRole("button", { name: "Rejeter" }).click();

    // Verify accessibility attributes on modal dialog
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal.locator("#withdrawal-modal-title")).toContainText("Rejeter le Retrait");

    // Attempt to submit without reason: must be blocked by validation
    await modal.getByRole("button", { name: "Confirmer le Rejet" }).click();
    const alert = modal.locator('div[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Le motif de rejet est obligatoire");

    // Close modal via Escape key
    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);
  });

  test("Arabic RTL parity across withdrawal queue and action modal", async ({ page }) => {
    await setupAdminSession(page, "ar");

    // Verify RTL document direction
    await expect(page.locator('[dir="rtl"]')).toBeVisible();

    // Verify Arabic priority badge
    const priorityRow = page.locator("tr", { hasText: "Amina Mansouri" });
    await expect(priorityRow.locator("text=أولوية قصوى")).toBeVisible();

    // Open approval modal and verify Arabic title
    await priorityRow.getByRole("button", { name: "موافقة" }).click();
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator("#withdrawal-modal-title")).toContainText("تأكيد الموافقة على السحب");

    // Close modal
    await modal.getByRole("button", { name: "إلغاء" }).last().click();
    await expect(modal).toHaveCount(0);
  });

  test("English localization: renders English table headers, tabs, priority tag and actions", async ({ page }) => {
    await setupAdminSession(page, "en");

    // Verify English header
    await expect(page.getByRole("heading", { name: /Affiliate Withdrawals Queue/i })).toBeVisible();

    // Verify English table headers
    await expect(page.locator("th", { hasText: "Beneficiary" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Amount" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Method & Details" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Status" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Date & Reference" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Actions" })).toBeVisible();

    // Verify English priority badge
    const priorityRow = page.locator("tr", { hasText: "Amina Mansouri" });
    await expect(priorityRow.locator("text=PRIORITY")).toBeVisible();

    // Verify English action button on pending item
    const standardRow = page.locator("tr", { hasText: "Kamel Benali" });
    await expect(standardRow.getByRole("button", { name: "Approve" })).toBeVisible();
    await expect(standardRow.getByRole("button", { name: "Reject" })).toBeVisible();

    // Verify English action button on approved item
    const approvedRow = page.locator("tr", { hasText: "Sofiane Dahmani" });
    await expect(approvedRow.getByRole("button", { name: "Mark as Paid" })).toBeVisible();
  });
});
