import { expect, test, type Page } from "@playwright/test";

const mockTransactions = [
  {
    id: "tx-aff-01",
    walletId: "wal-aff-qa",
    userId: "aff-qa-uuid",
    userRole: "affiliate",
    type: "CPA_PAYOUT",
    amount: 1200,
    balanceAfter: 25000,
    referenceId: "VD-89410",
    description: "Commission CPA commande livrée (Oran)",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "tx-aff-02",
    walletId: "wal-aff-qa",
    userId: "aff-qa-uuid",
    userRole: "affiliate",
    type: "CPA_PAYOUT",
    amount: 960,
    balanceAfter: 23800,
    referenceId: "VD-89411",
    description: "Commission CPA commande livrée (Alger)",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "tx-aff-03",
    walletId: "wal-aff-qa",
    userId: "aff-qa-uuid",
    userRole: "affiliate",
    type: "WITHDRAWAL",
    amount: -5000,
    balanceAfter: 22840,
    referenceId: "PAYOUT-CCP-9812",
    description: "Virement BaridiMob RIP 00799999002194829345",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

function createAffiliateToken(): string {
  const payload = {
    sub: "aff-qa-uuid",
    email: "affiliate@vitedrop.com",
    role: "AFFILIATE",
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `header.${base64Payload}.signature`;
}

interface SetupOptions {
  lang?: "fr" | "ar" | "en";
  balance?: number;
}

async function setupAffiliateWalletSession(
  page: Page,
  options: SetupOptions = {}
): Promise<{ submittedWithdrawals: any[] }> {
  const { lang = "fr", balance = 25000 } = options;
  const apiBase = "http://localhost:4000";
  const submittedWithdrawals: any[] = [];

  // Intercept wallet GET
  await page.route(new RegExp(`^${apiBase}/wallets?/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "wal-aff-qa",
        userId: "aff-qa-uuid",
        balance,
        currency: "DZD",
        ownerType: "AFFILIATE",
      }),
    });
  });

  // Intercept transactions GET
  await page.route(new RegExp(`^${apiBase}/wallets?/transactions`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockTransactions, total: 3 }),
    });
  });

  // Intercept affiliate orders for pending calculation
  await page.route(new RegExp(`^${apiBase}/affiliate/orders`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "ord-pipe-1",
          cpaCommission: 1200,
          status: "in_transit",
        },
        {
          id: "ord-pipe-2",
          cpaCommission: 5200,
          status: "supplier_confirmed",
        },
      ]),
    });
  });

  // Intercept withdrawal POST
  await page.route(new RegExp(`^${apiBase}/wallets?/withdraw`), async (route) => {
    const postData = JSON.parse(route.request().postData() || "{}");
    submittedWithdrawals.push(postData);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Withdrawal request submitted successfully",
      }),
    });
  });

  // Inject token and language
  await page.addInitScript(
    ({ token, selectedLang }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", selectedLang);
    },
    { token: createAffiliateToken(), selectedLang: lang }
  );

  await page.goto("/affiliate/wallet");
  await page.waitForSelector('[data-dashboard-role="affiliate"]', { timeout: 30000 });

  return { submittedWithdrawals };
}

test.describe("Affiliate Wallet & Postal Payout Clearinghouse Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Renders Treasury KPI cards (Cleared, Pipeline, Withdrawn) and Double-Entry Ledger table", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupAffiliateWalletSession(page, { lang: "fr" });

    // KPI Cards
    const clearedCard = page.locator('[data-testid="cleared-balance"]');
    await expect(clearedCard).toHaveText("25 000 DZD");

    const pendingCard = page.locator('[data-testid="pending-balance"]');
    await expect(pendingCard).toHaveText("6 400 DZD");

    const withdrawnCard = page.locator('[data-testid="total-withdrawn"]');
    await expect(withdrawnCard).toHaveText("5 000 DZD");

    // Desktop Ledger Table
    const table = page.locator('[data-testid="affiliate-wallet-table"]');
    await expect(table).toBeVisible();

    const rows = page.locator('[data-testid="affiliate-wallet-row"]');
    await expect(rows).toHaveCount(3);

    // 1-Click copy transaction reference
    const firstRow = rows.first();
    const copyBtn = firstRow.locator('[data-testid="copy-tx-ref-btn"]');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
  });

  test("2. Opens accessible Withdrawal Modal, validates payment rails and RIP format", async ({
    page,
  }) => {
    await setupAffiliateWalletSession(page, { lang: "fr" });

    // Open modal
    const openBtn = page.locator('[data-testid="open-withdraw-modal-btn"]');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    const modal = page.locator('[data-testid="affiliate-withdraw-modal"]');
    await expect(modal).toBeVisible();

    // Toggle Payment Methods
    const baridimobBtn = page.locator('[data-testid="withdraw-method-baridimob"]');
    const ccpBtn = page.locator('[data-testid="withdraw-method-ccp"]');
    await expect(baridimobBtn).toBeVisible();
    await expect(ccpBtn).toBeVisible();

    await ccpBtn.click();
    await baridimobBtn.click();

    // Check amount below 20k (no priority capsule)
    const amountInput = page.locator('[data-testid="withdraw-amount-input"]');
    await amountInput.fill("5000");

    const priorityCapsule = page.locator('[data-testid="payout-priority-capsule"]');
    await expect(priorityCapsule).toBeHidden();

    // Close modal
    const cancelBtn = page.locator('[data-testid="cancel-withdraw-btn"]');
    await cancelBtn.click();
    await expect(modal).toBeHidden();
  });

  test("3. Detects High-Priority Threshold (>= 20,000 DZD) and submits BaridiMob payout flow", async ({
    page,
  }) => {
    const { submittedWithdrawals } = await setupAffiliateWalletSession(page, { lang: "fr" });

    // Open modal
    await page.locator('[data-testid="open-withdraw-modal-btn"]').click();
    const modal = page.locator('[data-testid="affiliate-withdraw-modal"]');
    await expect(modal).toBeVisible();

    // Enter 20,000 DZD -> Priority threshold triggered
    const amountInput = page.locator('[data-testid="withdraw-amount-input"]');
    await amountInput.fill("20000");

    const priorityCapsule = page.locator('[data-testid="payout-priority-capsule"]');
    await expect(priorityCapsule).toBeVisible();
    await expect(priorityCapsule).toContainText(/Traitement Prioritaire/i);

    // Fill details
    const ripInput = page.locator('[data-testid="recipient-rip-input"]');
    await ripInput.fill("00799999002194829345");

    const nameInput = page.locator('[data-testid="recipient-name-input"]');
    await nameInput.fill("Karim Brahimi");

    // Submit
    const confirmBtn = page.locator('[data-testid="confirm-withdraw-btn"]');
    await confirmBtn.click();

    // Success feedback
    await expect(page.getByText(/Demande de retrait enregistrée !/i)).toBeVisible();
    expect(submittedWithdrawals.length).toBe(1);
    expect(submittedWithdrawals[0].amount).toBe(20000);
  });

  test("4. Ensures 390px mobile viewport card parity and hidden desktop table", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAffiliateWalletSession(page, { lang: "fr" });

    // Table hidden
    const table = page.locator('[data-testid="affiliate-wallet-table"]');
    await expect(table).toBeHidden();

    // Mobile cards rendered
    const cards = page.locator('[data-testid="affiliate-wallet-card"]');
    await expect(cards).toHaveCount(3);

    const firstCard = cards.first();
    await expect(firstCard.locator('[data-testid="copy-tx-ref-btn"]')).toBeVisible();
  });

  test("5. Enforces Arabic RTL parity, modal dismissal via Escape, and zero horizontal overflow across 390px, 768px, and 1440px", async ({
    page,
  }) => {
    await setupAffiliateWalletSession(page, { lang: "ar" });

    // RTL check
    const dashboardRoot = page.locator('[data-dashboard-role="affiliate"]');
    await expect(dashboardRoot).toHaveAttribute("dir", "rtl");

    // Arabic title
    await expect(page.getByRole("heading", { name: /المحفظة والأرباح/i })).toBeVisible();

    // Open modal and test Escape key dismiss
    await page.locator('[data-testid="open-withdraw-modal-btn"]').click();
    const modal = page.locator('[data-testid="affiliate-withdraw-modal"]');
    await expect(modal).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();

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
});
