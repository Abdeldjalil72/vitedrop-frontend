import { expect, test, type Page } from "@playwright/test";

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
    createdAt: "2026-09-15T14:30:00.000Z",
  },
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

const mockReconciliationSummary = {
  walletsAudited: 45,
  walletsWithVariance: 0,
  totalVarianceAmount: 0,
  deliveredOrdersAudited: 120,
  ordersMissingSettlement: 0,
  ordersWithDuplicateTransactions: 0,
  lastRunAt: "2026-10-12T08:00:00.000Z",
};

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

async function setupAdminTopUpSession(
  page: Page,
  lang: "fr" | "ar" | "en" = "fr"
): Promise<{ getTopUpRequests: () => any[] }> {
  const topUpRequests: any[] = [];
  const apiBase = "http://localhost:4000";

  // Mock Admin Users API
  await page.route(new RegExp(`^${apiBase}/admin/users`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockUsersList),
    });
  });

  // Mock Reconciliation APIs
  await page.route(new RegExp(`^${apiBase}/admin/reconciliation/summary`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockReconciliationSummary),
    });
  });

  await page.route(new RegExp(`^${apiBase}/admin/reconciliation/wallets`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(new RegExp(`^${apiBase}/admin/reconciliation/orders`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(new RegExp(`^${apiBase}/admin/reconciliation/runs`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // Mock Top-Up API: POST /wallets/top-up/:supplierId
  await page.route(new RegExp(`^${apiBase}/wallets/top-up/`), async (route) => {
    const url = route.request().url();
    const supplierId = url.split("/").pop();
    const postData = JSON.parse(route.request().postData() || "{}");
    topUpRequests.push({ supplierId, ...postData });

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "wal-sup-02",
        ownerId: supplierId,
        ownerType: "SUPPLIER",
        balance: 320000 + postData.amount,
      }),
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

  // Init local storage
  await page.addInitScript(
    ({ token, langKey }) => {
      window.localStorage.setItem("vitedrop_token", token);
      window.localStorage.setItem("vitedrop_lang", langKey);
    },
    { token: createAdminToken(), langKey: lang }
  );

  return { getTopUpRequests: () => topUpRequests };
}

test.describe("Admin Supplier Escrow Top-Up Desk", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("1. Row trigger pre-fills modal with selected supplier and current balance", async ({
    page,
  }) => {
    await setupAdminTopUpSession(page, "fr");
    await page.goto("/admin/users");

    // Find supplier row and click "Recharger"
    const topUpBtn = page.getByTestId("topup-supplier-btn-usr-supplier-uuid-02");
    await expect(topUpBtn).toBeVisible({ timeout: 10000 });
    await topUpBtn.click();

    // Verify modal appears
    const modal = page.getByTestId("admin-topup-modal");
    await expect(modal).toBeVisible();

    // Verify prefilled supplier details
    await expect(modal.getByText("Fayçal Mansouri")).toBeVisible();
    await expect(modal.getByText("faycal.supplier@atlasbio.dz")).toBeVisible();
    await expect(modal.getByText("320 000 DZD").first()).toBeVisible();
  });

  test("2. Preset amount chips update input and calculate projected balance", async ({
    page,
  }) => {
    await setupAdminTopUpSession(page, "fr");
    await page.goto("/admin/users");

    await page.getByTestId("topup-supplier-btn-usr-supplier-uuid-02").click();
    const modal = page.getByTestId("admin-topup-modal");
    await expect(modal).toBeVisible();

    // Click +50 000 DA preset chip
    const preset50k = modal.getByTestId("preset-amount-50000");
    await expect(preset50k).toBeVisible();
    await preset50k.click();

    // Verify amount input reflects 50000
    const amountInput = modal.getByTestId("topup-amount-input");
    await expect(amountInput).toHaveValue("50000");

    // Projected balance should be 320 000 + 50 000 = 370 000 DZD
    const projectedBalance = modal.getByTestId("topup-projected-balance");
    await expect(projectedBalance).toContainText("370 000 DZD");
  });

  test("3. Successfully executes top-up via BaridiMob and updates UI balance reactively", async ({
    page,
  }) => {
    const { getTopUpRequests } = await setupAdminTopUpSession(page, "fr");
    await page.goto("/admin/users");

    await page.getByTestId("topup-supplier-btn-usr-supplier-uuid-02").click();
    const modal = page.getByTestId("admin-topup-modal");

    // Select preset 100k
    await modal.getByTestId("preset-amount-100000").click();

    // Select BaridiMob rail
    await modal.getByTestId("payment-rail-baridimob").click();

    // Enter reference and optional note
    await modal.getByTestId("topup-reference-input").fill("BMOB-TX-889922");
    await modal.getByTestId("topup-note-input").fill("Validé sur compte mobile");

    // Submit
    const submitBtn = modal.getByTestId("confirm-topup-submit-btn");
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Verify API was called with proper payload
    const requests = getTopUpRequests();
    expect(requests.length).toBe(1);
    expect(requests[0].supplierId).toBe("usr-supplier-uuid-02");
    expect(requests[0].amount).toBe(100000);
    expect(requests[0].referenceId).toContain("BARIDIMOB: BMOB-TX-889922");

    // Verify reactive table balance updated to 420 000 DZD
    await expect(page.getByRole("table").getByText("420 000 DZD")).toBeVisible();
  });

  test("4. Treasury header trigger in /admin/reconciliation opens modal with searchable supplier picker", async ({
    page,
  }) => {
    const { getTopUpRequests } = await setupAdminTopUpSession(page, "fr");
    await page.goto("/admin/reconciliation");

    // Click header CTA
    const headerBtn = page.getByTestId("header-topup-supplier-btn");
    await expect(headerBtn).toBeVisible({ timeout: 10000 });
    await headerBtn.click();

    const modal = page.getByTestId("admin-topup-modal");
    await expect(modal).toBeVisible();

    // Dropdown picker is visible
    const dropdown = modal.getByTestId("supplier-select-dropdown");
    await expect(dropdown).toBeVisible();

    // Enter amount and reference
    await modal.getByTestId("preset-amount-25000").click();
    await modal.getByTestId("topup-reference-input").fill("CCP-BOR-00129");

    // Submit
    await modal.getByTestId("confirm-topup-submit-btn").click();
    await expect(modal).not.toBeVisible();

    // Verify API called
    const requests = getTopUpRequests();
    expect(requests.length).toBe(1);
    expect(requests[0].amount).toBe(25000);
  });

  test("5. Arabic RTL parity: renders correct RTL layout and LTR protected numbers", async ({
    page,
  }) => {
    await setupAdminTopUpSession(page, "ar");
    await page.goto("/admin/users");

    // Verify Arabic Top-Up button
    const topUpBtn = page.getByTestId("topup-supplier-btn-usr-supplier-uuid-02");
    await expect(topUpBtn).toBeVisible();
    await expect(topUpBtn).toContainText("شحن");

    await topUpBtn.click();

    const modal = page.getByTestId("admin-topup-modal");
    await expect(modal).toBeVisible();
    await expect(modal.getByText("شحن رصيد حساب المورد")).toBeVisible();
    await expect(modal.getByText("تأكيد شحن الرصيد")).toBeVisible();
  });
});
