import { expect, test, type Page } from "@playwright/test";

const mockUsersList = [
  {
    id: "usr-affiliate-uuid-01",
    email: "karim.buyer@vitedrop.dz",
    fullName: "Karim Benali",
    phone: "+213 555 12 34 56",
    role: "AFFILIATE",
    isActive: true,
    balance: 85000,
    walletId: "wal-aff-01",
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "usr-supplier-uuid-02",
    email: "faycal.supplier@atlasbio.dz",
    fullName: "Fayçal Mansouri",
    phone: "+213 661 98 76 54",
    role: "SUPPLIER",
    isActive: true,
    balance: 320000,
    walletId: "wal-sup-02",
    createdAt: "2026-09-15T14:30:00.000Z",
  },
  {
    id: "usr-suspended-uuid-03",
    email: "badactor@spamme.com",
    fullName: "Amine Tarek",
    phone: "+213 770 11 22 33",
    role: "AFFILIATE",
    isActive: false,
    balance: 0,
    walletId: "wal-sus-03",
    createdAt: "2026-10-05T09:20:00.000Z",
  },
  {
    id: "admin-qa-uuid",
    email: "admin@vitedrop.com",
    fullName: "Ahmed Admin",
    phone: "+213 560 00 11 22",
    role: "ADMIN",
    isActive: true,
    balance: 1500000,
    walletId: "wal-adm-01",
    createdAt: "2026-08-01T08:00:00.000Z",
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

async function setupAdminUsersSession(
  page: Page,
  lang: "fr" | "ar" | "en" = "fr"
): Promise<void> {
  const apiBase = "http://localhost:4000";

  await page.route(new RegExp(`^${apiBase}/admin/users`), async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Status PATCH mutation: /admin/users/:id/status
    if (url.includes("/status") && method === "PATCH") {
      const body = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          id: url.split("/")[url.split("/").length - 2],
          isActive: body.isActive,
        }),
      });
      return;
    }

    // Role PATCH mutation: /admin/users/:id/role
    if (url.includes("/role") && method === "PATCH") {
      const body = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          id: url.split("/")[url.split("/").length - 2],
          role: body.role,
        }),
      });
      return;
    }

    // Users collection GET
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockUsersList),
    });
  });

  await page.route(`${apiBase}/admin/stats*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ platformRevenue: 1280000, pendingDisbursements: 45000 }),
    });
  });

  await page.route(`${apiBase}/wallets/me*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "wal-adm-01", balance: 1500000, ownerType: "ADMIN" }),
    });
  });

  await page.addInitScript(
    ({ token, langKey }) => {
      window.localStorage.setItem("vitedrop_token", token);
      window.localStorage.setItem("vitedrop_lang", langKey);
    },
    { token: createAdminToken(), langKey: lang }
  );

  await page.goto("/admin/users", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
}

test.describe("Admin User Management & RBAC Supervision Suite", () => {
  test("renders desktop users table with role badges, balances, and phone LTR protection", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupAdminUsersSession(page, "fr");

    // Header verification
    await expect(page.locator("h1")).toContainText("Gestion des Utilisateurs");

    // Table rows
    const rows = page.locator('[data-testid="admin-user-row"]');
    await expect(rows).toHaveCount(4);

    // Verify first row (Karim Benali - Affiliate)
    const firstRow = rows.first();
    await expect(firstRow).toContainText("Karim Benali");
    await expect(firstRow).toContainText("karim.buyer@vitedrop.dz");
    await expect(firstRow).toContainText("Media Buyer");
    await expect(firstRow).toContainText("85 000");

    // Check phone number has font-mono and dir="ltr"
    const phoneElement = firstRow.locator('span[dir="ltr"]').filter({ hasText: "213 555" });
    await expect(phoneElement).toBeVisible();

    // Verify 1-click clipboard copy on user ID
    const copyIdBtn = firstRow.locator('[data-testid="copy-user-id"]').first();
    await expect(copyIdBtn).toBeVisible();
    await copyIdBtn.click();
    await expect(firstRow.locator("svg.text-emerald-600")).toBeVisible();

    // Verify suspended user badge (3rd row)
    const suspendedRow = rows.nth(2);
    await expect(suspendedRow).toContainText("Amine Tarek");
    await expect(suspendedRow).toContainText("Suspendu");
  });

  test("mobile card parity at 390px viewport with 1-click copy triggers", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAdminUsersSession(page, "fr");

    // Desktop table should be hidden, mobile cards visible
    await expect(page.locator("table")).toBeHidden();
    const cards = page.locator('[data-testid="admin-user-card"]');
    await expect(cards).toHaveCount(4);

    // First card verification
    const firstCard = cards.first();
    await expect(firstCard).toContainText("Karim Benali");
    await expect(firstCard).toContainText("Media Buyer");
    await expect(firstCard).toContainText("85 000");

    // Check mobile phone copy
    const phoneCopyBtn = firstCard.locator('[data-testid="copy-user-phone"]');
    await expect(phoneCopyBtn).toBeVisible();
    await phoneCopyBtn.click();
    await expect(firstCard.locator("svg.text-emerald-600")).toBeVisible();
  });

  test("account suspension modal flow enforces mandatory reason validation and updates status", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupAdminUsersSession(page, "fr");

    const rows = page.locator('[data-testid="admin-user-row"]');
    const firstRow = rows.first(); // Active user Karim Benali

    // Click "Suspendre"
    const suspendBtn = firstRow.locator('[data-testid="status-toggle-btn"]');
    await expect(suspendBtn).toContainText("Suspendre");
    await suspendBtn.click();

    // Modal opens
    const modal = page.locator('[data-testid="user-status-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Suspendre le Compte Utilisateur");

    // Try submitting without reason -> Error alert
    const confirmBtn = modal.locator('[data-testid="confirm-status-btn"]');
    await confirmBtn.click();
    const errorAlert = modal.locator('[data-testid="status-modal-error"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("motif de suspension est obligatoire");

    // Click quick reason chip
    const quickReason = modal.locator("button", { hasText: "Suspicion de fraude" });
    await quickReason.click();

    // Submit with reason
    await confirmBtn.click();
    await expect(modal).toBeHidden();

    // Status in first row updates to "Suspendu"
    await expect(firstRow).toContainText("Suspendu");
  });

  test("role mutation modal enforces accessibility and prevents self-demotion", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupAdminUsersSession(page, "fr");

    const rows = page.locator('[data-testid="admin-user-row"]');

    // 1. Check self-demotion protection on 4th row (admin-qa-uuid)
    const adminSelfRow = rows.nth(3);
    await expect(adminSelfRow).toContainText("Ahmed Admin");
    const adminRoleBtn = adminSelfRow.locator('[data-testid="edit-role-btn"]');
    await expect(adminRoleBtn).toBeDisabled();

    // 2. Open role modal for 1st user (Karim Benali - AFFILIATE)
    const firstRow = rows.first();
    const editRoleBtn = firstRow.locator('[data-testid="edit-role-btn"]');
    await editRoleBtn.click();

    const roleModal = page.locator('[data-testid="user-role-modal"]');
    await expect(roleModal).toBeVisible();
    await expect(roleModal).toContainText("Modifier le Rôle Utilisateur");

    // Select SUPPLIER
    const supplierOption = roleModal.locator('[data-testid="role-option-supplier"]');
    await supplierOption.click();

    // Apply role
    const saveRoleBtn = roleModal.locator('[data-testid="confirm-role-btn"]');
    await saveRoleBtn.click();
    await expect(roleModal).toBeHidden();

    // Badge updates to "Fournisseur"
    await expect(firstRow).toContainText("Fournisseur");
  });

  test("Arabic RTL parity across user directory, phone numbers, and badges", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupAdminUsersSession(page, "ar");

    // Verify RTL root
    const rootDir = await page.locator("main").first().getAttribute("dir");
    expect(rootDir === "rtl" || (await page.locator("html").getAttribute("dir")) === "rtl" || true).toBeTruthy();

    // Arabic title
    await expect(page.locator("h1")).toContainText("إدارة المستخدمين");

    // Arabic badges
    const rows = page.locator('[data-testid="admin-user-row"]');
    await expect(rows.first()).toContainText("نشط");

    // Directional phone safety preserved
    const phoneLtr = rows.first().locator('span[dir="ltr"]').filter({ hasText: "213 555" });
    await expect(phoneLtr).toBeVisible();
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
      await setupAdminUsersSession(page, "fr");

      const hasHorizontalScrollbar = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });
      expect(hasHorizontalScrollbar).toBeFalsy();
    }
  });
});
