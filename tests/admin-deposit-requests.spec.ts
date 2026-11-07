import { expect, test, type Page } from "@playwright/test";

const mockDepositRequests = [
  {
    id: "req-dep-uuid-01",
    supplierId: "usr-supplier-uuid-02",
    supplierName: "Fayçal Mansouri",
    supplierEmail: "faycal.supplier@atlasbio.dz",
    supplierPhone: "+213 661 98 76 54",
    amount: 60000,
    paymentRail: "BARIDIMOB",
    referenceNote: "BM-8839210-ALGIERS",
    receiptUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%237e22ce'/><text x='50' y='150' fill='white' font-size='20'>Bordereau BaridiMob 60,000 DA</text></svg>",
    status: "PENDING",
    rejectionReason: null,
    processedBy: null,
    processedAt: null,
    walletTransactionId: null,
    createdAt: "2026-10-12T09:30:00.000Z",
    updatedAt: "2026-10-12T09:30:00.000Z",
  },
  {
    id: "req-dep-uuid-02",
    supplierId: "usr-supplier-uuid-03",
    supplierName: "Yacine Terki",
    supplierEmail: "yacine@dz-dropship.com",
    supplierPhone: "+213 550 44 33 22",
    amount: 15000,
    paymentRail: "CCP",
    referenceNote: "CCP-992104-ORAN",
    receiptUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23d97706'/><text x='50' y='150' fill='white' font-size='20'>Bordereau CCP 15,000 DA</text></svg>",
    status: "PENDING",
    rejectionReason: null,
    processedBy: null,
    processedAt: null,
    walletTransactionId: null,
    createdAt: "2026-10-12T10:15:00.000Z",
    updatedAt: "2026-10-12T10:15:00.000Z",
  },
  {
    id: "req-dep-uuid-03",
    supplierId: "usr-supplier-uuid-04",
    supplierName: "Amina Cosmétiques DZ",
    supplierEmail: "amina@cosmetics.dz",
    supplierPhone: "+213 770 11 22 33",
    amount: 30000,
    paymentRail: "BNA",
    referenceNote: "BNA-00100234-SETIF",
    receiptUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%231d4ed8'/><text x='50' y='150' fill='white' font-size='20'>Bordereau BNA 30,000 DA</text></svg>",
    status: "APPROVED",
    rejectionReason: null,
    processedBy: "admin-qa-uuid",
    processedAt: "2026-10-12T11:00:00.000Z",
    walletTransactionId: "tx-dep-valid-01",
    createdAt: "2026-10-12T08:00:00.000Z",
    updatedAt: "2026-10-12T11:00:00.000Z",
  },
  {
    id: "req-dep-uuid-04",
    supplierId: "usr-supplier-uuid-05",
    supplierName: "Reda Electronics",
    supplierEmail: "reda@electro.dz",
    supplierPhone: "+213 661 00 99 88",
    amount: 8000,
    paymentRail: "BARIDIMOB",
    referenceNote: "BM-FAKE-001",
    receiptUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23b91c1c'/><text x='50' y='150' fill='white' font-size='20'>Reçu Rejeté</text></svg>",
    status: "REJECTED",
    rejectionReason: "Virement introuvable sur l'extrait bancaire BaridiMob",
    processedBy: "admin-qa-uuid",
    processedAt: "2026-10-12T11:30:00.000Z",
    walletTransactionId: null,
    createdAt: "2026-10-12T07:45:00.000Z",
    updatedAt: "2026-10-12T11:30:00.000Z",
  },
];

const mockUsersList = [
  {
    id: "usr-supplier-uuid-02",
    email: "faycal.supplier@atlasbio.dz",
    fullName: "Fayçal Mansouri",
    phone: "+213 661 98 76 54",
    role: "SUPPLIER",
    isActive: true,
    balance: 320000,
    walletId: "wal-sup-02",
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

interface SetupOptions {
  lang?: "fr" | "ar" | "en";
  initialRequests?: typeof mockDepositRequests;
}

async function setupAdminDepositSession(
  page: Page,
  options: SetupOptions = {}
): Promise<{
  getApprovedCalls: () => any[];
  getRejectedCalls: () => any[];
}> {
  const { lang = "fr", initialRequests = mockDepositRequests } = options;
  const apiBase = "http://localhost:4000";
  const approvedCalls: any[] = [];
  const rejectedCalls: any[] = [];
  let currentRequests = JSON.parse(JSON.stringify(initialRequests));

  // Intercept Admin Deposit Requests list
  await page.route(new RegExp(`^${apiBase}/admin/deposit-requests`), async (route) => {
    const url = new URL(route.request().url());
    const status = url.searchParams.get("status");

    let filtered = currentRequests;
    if (status && status !== "ALL") {
      filtered = currentRequests.filter((r: any) => r.status === status);
    }

    const pendingCount = currentRequests.filter((r: any) => r.status === "PENDING").length;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: filtered,
        total: filtered.length,
        pendingCount,
        limit: 50,
        offset: 0,
      }),
    });
  });

  // Intercept Approve PATCH
  await page.route(
    new RegExp(`^${apiBase}/admin/deposit-requests/[^/]+/approve$`),
    async (route) => {
      const url = route.request().url();
      const id = url.split("/")[5];
      const body = route.request().postDataJSON() || {};
      approvedCalls.push({ id, body });

      const item = currentRequests.find((r: any) => r.id === id);
      if (item) {
        item.status = "APPROVED";
        if (body.verifiedAmount) {
          item.amount = Number(body.verifiedAmount);
        }
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          newBalance: 380000,
          depositRequest: item,
        }),
      });
    }
  );

  // Intercept Reject PATCH
  await page.route(
    new RegExp(`^${apiBase}/admin/deposit-requests/[^/]+/reject$`),
    async (route) => {
      const url = route.request().url();
      const id = url.split("/")[5];
      const body = route.request().postDataJSON() || {};
      rejectedCalls.push({ id, body });

      const item = currentRequests.find((r: any) => r.id === id);
      if (item) {
        item.status = "REJECTED";
        item.rejectionReason = body.reason;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          depositRequest: item,
        }),
      });
    }
  );

  // Mock Admin Users
  await page.route(new RegExp(`^${apiBase}/admin/users`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockUsersList),
    });
  });

  // Mock Stats API
  await page.route(`${apiBase}/admin/stats*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ platformRevenue: 1280000, pendingDisbursements: 45000 }),
    });
  });

  // Mock Wallets Me API
  await page.route(`${apiBase}/wallets/me*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "wal-adm-01", balance: 1500000, ownerType: "ADMIN" }),
    });
  });

  // Mock Notifications API to prevent 401 unauthorized redirect
  await page.route(new RegExp(`^${apiBase}/notifications/`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count: 0, data: [], unreadCount: 0 }),
    });
  });

  // Inject Auth Token
  const token = createAdminToken();
  await page.addInitScript(
    ({ t, l }) => {
      window.localStorage.setItem("vitedrop_token", t);
      window.localStorage.setItem("vitedrop_lang", l);
      document.cookie = `token=${t}; path=/; max-age=86400`;
    },
    { t: token, l: lang }
  );

  await page.goto("/admin/deposit-requests");
  await page.waitForSelector('[data-dashboard-role="admin"]', { timeout: 30000 });

  return {
    getApprovedCalls: () => approvedCalls,
    getRejectedCalls: () => rejectedCalls,
  };
}

test.describe("Admin Inbound Supplier Deposit Requests Clearinghouse", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("1. Renders Desktop Inbound Deposit Slips desk with High-Value badge, rail capsules, and Space Mono amounts", async ({
    page,
  }) => {
    await setupAdminDepositSession(page, { lang: "fr" });

    // Header verification
    await expect(page.getByRole("heading", { name: /Dépôts & Rechargements Fournisseurs/i })).toBeVisible();
    await expect(page.getByText(/Vérification des bordereaux de versement/i)).toBeVisible();

    // KPI cards verification
    await expect(page.getByText(/Total en Attente/i)).toBeVisible();
    await expect(page.getByText(/Bordereaux à Traiter/i)).toBeVisible();
    await expect(page.getByText(/Validés & Crédités/i)).toBeVisible();

    // Default tab is PENDING (2 pending requests)
    const rows = page.locator('[data-testid="admin-deposit-row"]');
    await expect(rows).toHaveCount(2);

    // Row 1 check: Fayçal Mansouri (60,000 DZD - High Value)
    const row1 = rows.first();
    await expect(row1.getByText("Fayçal Mansouri")).toBeVisible();
    await expect(row1.getByText("faycal.supplier@atlasbio.dz")).toBeVisible();
    await expect(row1.getByText("+213 661 98 76 54")).toBeVisible();
    await expect(row1.getByText("60 000 DZD")).toBeVisible();
    await expect(row1.locator('[data-testid="priority-deposit-badge"]')).toBeVisible();
    await expect(row1.getByText("BaridiMob")).toBeVisible();
    await expect(row1.getByText("BM-8839210-ALGIERS")).toBeVisible();
    await expect(row1.locator('[data-testid="approve-deposit-btn"]')).toBeVisible();
    await expect(row1.locator('[data-testid="reject-deposit-btn"]')).toBeVisible();

    // Row 2 check: Yacine Terki (15,000 DZD - CCP)
    const row2 = rows.nth(1);
    await expect(row2.getByText("Yacine Terki")).toBeVisible();
    await expect(row2.getByText("15 000 DZD")).toBeVisible();
    await expect(row2.getByText(/Algérie Poste CCP/i)).toBeVisible();
  });

  test("2. Opens Lightbox Slip Preview modal and verifies receipt image inspection", async ({
    page,
  }) => {
    await setupAdminDepositSession(page, { lang: "fr" });

    // Click preview button on first table row
    const previewBtn = page.locator('table [data-testid="preview-slip-btn"]').first();
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();

    // Lightbox modal verification
    const modal = page.locator('[data-testid="receipt-slip-preview-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");

    // Image rendered
    const img = page.locator('[data-testid="preview-slip-img"]');
    await expect(img).toBeVisible();

    // Close preview
    const closeBtn = page.locator('[data-testid="close-slip-preview-btn"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(modal).toBeHidden();
  });

  test("3. Executes double-entry deposit approval flow with custom verified amount", async ({
    page,
  }) => {
    const { getApprovedCalls } = await setupAdminDepositSession(page, { lang: "fr" });

    // Click Valider & Créditer on Row 1 (table)
    const approveBtn = page.locator('table [data-testid="approve-deposit-btn"]').first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Approval modal verification
    const modal = page.locator('[data-testid="approve-deposit-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal.getByText(/Double-Écriture Comptable/i)).toBeVisible();

    // Pre-filled amount (60000)
    const amountInput = page.locator('[data-testid="verified-amount-input"]');
    await expect(amountInput).toHaveValue("60000");

    // Add internal note
    const noteInput = page.locator('[data-testid="approval-note-input"]');
    await noteInput.fill("Extrait BaridiMob #TX-883921 OK");

    // Confirm approval
    const confirmBtn = page.locator('[data-testid="confirm-approve-deposit-btn"]');
    await confirmBtn.click();

    // Banner verification
    await expect(page.locator('[data-testid="admin-deposits-success-banner"]')).toBeVisible();

    // Verify API call payload
    const calls = getApprovedCalls();
    expect(calls.length).toBe(1);
    expect(calls[0].id).toBe("req-dep-uuid-01");
    expect(calls[0].body.verifiedAmount).toBe(60000);
    expect(calls[0].body.adminNote).toBe("Extrait BaridiMob #TX-883921 OK");
  });

  test("4. Executes deposit rejection flow with mandatory reason", async ({
    page,
  }) => {
    const { getRejectedCalls } = await setupAdminDepositSession(page, { lang: "fr" });

    // Click Rejeter on Row 2 (table)
    const rejectBtn = page.locator('table [data-testid="reject-deposit-btn"]').first();
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // Rejection modal verification
    const modal = page.locator('[data-testid="reject-deposit-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("role", "dialog");

    // Disabled submit button while reason is empty
    const confirmBtn = page.locator('[data-testid="confirm-reject-deposit-btn"]');
    await expect(confirmBtn).toBeDisabled();

    // Type rejection reason
    const reasonInput = page.locator('[data-testid="rejection-reason-input"]');
    await reasonInput.fill("Extrait bancaire sans trace de ce versement CCP");
    await expect(confirmBtn).toBeEnabled();

    // Confirm rejection
    await confirmBtn.click();

    // Banner feedback
    await expect(page.locator('[data-testid="admin-deposits-success-banner"]')).toBeVisible();

    // Verify API call payload
    const calls = getRejectedCalls();
    expect(calls.length).toBe(1);
    expect(calls[0].body.reason).toBe("Extrait bancaire sans trace de ce versement CCP");
  });

  test("5. Ensures 390px mobile viewport card parity and hidden desktop table", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAdminDepositSession(page, { lang: "fr" });

    // Mobile cards should be visible
    const mobileCards = page.locator('[data-testid="admin-deposit-card"]');
    await expect(mobileCards).toHaveCount(2);
    await expect(mobileCards.first()).toBeVisible();

    // Desktop table rows should be hidden
    const desktopRows = page.locator('[data-testid="admin-deposit-row"]');
    await expect(desktopRows.first()).toBeHidden();

    // First card verification
    const card1 = mobileCards.first();
    await expect(card1.getByText("Fayçal Mansouri")).toBeVisible();
    await expect(card1.getByText("60 000 DZD")).toBeVisible();
    await expect(card1.getByText("BaridiMob")).toBeVisible();
    await expect(card1.locator('[data-testid="approve-deposit-btn"]')).toBeVisible();
    await expect(card1.locator('[data-testid="reject-deposit-btn"]')).toBeVisible();
  });

  test("6. Enforces Arabic RTL parity with strict LTR phone isolation and zero horizontal overflow", async ({
    page,
  }) => {
    await setupAdminDepositSession(page, { lang: "ar" });

    // Arabic title
    await expect(page.getByRole("heading", { name: /إيداعات وشحن أرصدة الموردين/i })).toBeVisible();

    // Verify LTR protection on phone numbers
    const ltrSpans = page.locator('span[dir="ltr"]');
    const spanCount = await ltrSpans.count();
    expect(spanCount).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(spanCount, 3); i++) {
      await expect(ltrSpans.nth(i)).toHaveAttribute("dir", "ltr");
    }

    // Zero horizontal overflow across viewports
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

  test("7. Enforces trilingual language parity on the Approve Modal and high-contrast confirmation button", async ({
    page,
  }) => {
    // 1. Test English Modal
    await setupAdminDepositSession(page, { lang: "en" });
    const approveBtnEn = page.locator('table [data-testid="approve-deposit-btn"]').first();
    await approveBtnEn.click();

    const modalEn = page.locator('[data-testid="approve-deposit-modal"]');
    await expect(modalEn).toBeVisible();
    await expect(modalEn.getByRole("heading", { name: "Approve & Credit Escrow Balance" })).toBeVisible();
    await expect(modalEn.getByText("Double-Entry Accounting:")).toBeVisible();
    await expect(modalEn.getByText("Verified Amount Received (DZD):")).toBeVisible();

    const confirmBtnEn = page.locator('[data-testid="confirm-approve-deposit-btn"]');
    await expect(confirmBtnEn).toBeVisible();
    await expect(confirmBtnEn).toContainText("Confirm & Credit");

    // Verify emerald background and white text styling (never white on white)
    const btnClasses = await confirmBtnEn.getAttribute("class");
    expect(btnClasses).toContain("bg-emerald-600");
    expect(btnClasses).toContain("text-white");
    expect(btnClasses).not.toContain("bg-white");

    // Close English modal
    await page.locator('[data-testid="close-approve-modal-btn"]').click();
    await expect(modalEn).toBeHidden();

    // 2. Test Arabic Modal
    await setupAdminDepositSession(page, { lang: "ar" });
    const approveBtnAr = page.locator('table [data-testid="approve-deposit-btn"]').first();
    await approveBtnAr.click();

    const modalAr = page.locator('[data-testid="approve-deposit-modal"]');
    await expect(modalAr).toBeVisible();
    await expect(modalAr.locator('[dir="rtl"]')).toBeVisible();
    await expect(modalAr.getByRole("heading", { name: "تأكيد وشحن رصيد الضمان المالي (Escrow)" })).toBeVisible();
    await expect(modalAr.getByText("القيد المحاسبي المزدوج:")).toBeVisible();
    await expect(modalAr.getByText("المبلغ الفعلي المستلم (دج):")).toBeVisible();

    const confirmBtnAr = page.locator('[data-testid="confirm-approve-deposit-btn"]');
    await expect(confirmBtnAr).toBeVisible();
    await expect(confirmBtnAr).toContainText("تأكيد وشحن الرصيد");
  });
});

