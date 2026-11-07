import { expect, test, type Page } from "@playwright/test";

const mockSupplierWallet = {
  id: "wal-sup-qa",
  userId: "sup-qa-uuid",
  balance: 8500,
  currency: "DZD",
  ownerType: "SUPPLIER",
};

const mockSupplierTransactions = [
  {
    id: "tx-dep-101",
    walletId: "wal-sup-qa",
    type: "DEPOSIT",
    amount: 10000,
    balanceAfter: 10000,
    reference: "Recharge BaridiMob #BM-883921",
    createdAt: "2026-10-05T09:00:00.000Z",
  },
  {
    id: "tx-deb-201",
    walletId: "wal-sup-qa",
    type: "SUPPLIER_DEBIT",
    amount: -1200,
    balanceAfter: 8800,
    reference: "Livraison Confirmée #ORD-ALGIERS-101",
    createdAt: "2026-10-06T14:30:00.000Z",
  },
  {
    id: "tx-deb-202",
    walletId: "wal-sup-qa",
    type: "SUPPLIER_DEBIT",
    amount: -1500,
    balanceAfter: 7300,
    reference: "Livraison Confirmée #ORD-ORAN-102",
    createdAt: "2026-10-07T11:15:00.000Z",
  },
  {
    id: "tx-dep-102",
    walletId: "wal-sup-qa",
    type: "DEPOSIT",
    amount: 5000,
    balanceAfter: 12300,
    reference: "Recharge CCP #CCP-449102",
    createdAt: "2026-10-07T16:00:00.000Z",
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

interface SetupOptions {
  lang?: "fr" | "ar" | "en";
  balance?: number;
  transactions?: typeof mockSupplierTransactions;
}

async function setupSupplierWalletSession(
  page: Page,
  options: SetupOptions = {}
): Promise<void> {
  const {
    lang = "fr",
    balance = 8500,
    transactions = mockSupplierTransactions,
  } = options;
  const apiBase = "http://localhost:4000";

  // Intercept wallet GET (support both /wallets/me and /wallet/me)
  await page.route(new RegExp(`^${apiBase}/wallets?/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...mockSupplierWallet,
        balance,
      }),
    });
  });

  // Intercept transactions GET
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

  // Intercept supplier orders GET for in-transit liability calculation
  await page.route(new RegExp(`^${apiBase}/supplier/orders`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // Intercept deposit requests and notifications
  await page.route(new RegExp(`^${apiBase}/wallets?/deposit-requests/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(new RegExp(`^${apiBase}/notifications`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // Inject token & language
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

test.describe("Supplier Escrow Wallet & Transaction Ledger Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Renders desktop Escrow status cards, Double-Entry ledger table, and 1-click Reference copy", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupSupplierWalletSession(page, { lang: "fr" });

    // Header and Role Capsule
    await expect(page.getByRole("heading", { name: /Portefeuille & Grand Livre/i })).toBeVisible();
    await expect(page.getByText(/Compte Escrow & Trésorerie/i)).toBeVisible();

    // Status Cards: Current Escrow Balance (8 500 DZD), Cumulative Deposits (15 000 DZD), Debits (2 700 DZD)
    await expect(page.getByText(/Solde Escrow Actuel/i).first()).toBeVisible();
    await expect(page.getByRole("main").getByText("8 500 DZD").first()).toBeVisible();
    await expect(page.getByText(/Couverture suffisante pour les expéditions/i)).toBeVisible();

    await expect(page.getByText(/Total Dépôts Prépayés/i)).toBeVisible();
    await expect(page.getByText("15 000 DZD")).toBeVisible();

    await expect(page.getByText(/Débits Livraisons Confirmées/i)).toBeVisible();
    await expect(page.getByText("2 700 DZD")).toBeVisible();
    await expect(page.getByText(/0 DZD de frais en cas de retour/i)).toBeVisible();

    // Desktop Table Rows count (4 transactions)
    const rows = page.locator('[data-testid="supplier-wallet-tx-row"]');
    await expect(rows).toHaveCount(4);

    // Row 1: Deposit (#TX-DEP-1)
    const row1 = rows.first();
    await expect(row1.getByText("#TX-DEP-1")).toBeVisible();
    await expect(row1.getByText(/Dépôt \(Crédit\)/i)).toBeVisible();
    await expect(row1.getByText(/Recharge BaridiMob/i)).toBeVisible();
    await expect(row1.getByText("+10 000 DZD")).toBeVisible();

    // Row 2: Debit (#TX-DEB-2)
    const row2 = rows.nth(1);
    await expect(row2.getByText("#TX-DEB-2")).toBeVisible();
    await expect(row2.getByText(/Débit Livraison/i)).toBeVisible();
    await expect(row2.getByText(/Livraison Confirmée/i)).toBeVisible();
    await expect(row2.getByText("1 200 DZD")).toBeVisible();

    // 1-Click Reference Copy on desktop row
    const copyBtn = row1.locator('[data-testid="copy-tx-ref-btn"]').first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Search filter test: Filter by "CCP"
    const searchInput = page.locator('[data-testid="tx-search-input"]');
    await searchInput.fill("CCP");
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByText(/Recharge CCP/i)).toBeVisible();

    // Clear search
    await searchInput.fill("");
    await expect(rows).toHaveCount(4);

    // Type filter test: DEPOSITS
    const filterDepositsBtn = page.locator('[data-testid="filter-deposits-btn"]');
    await filterDepositsBtn.click();
    await expect(rows).toHaveCount(2);

    // Type filter test: DEBITS
    const filterDebitsBtn = page.locator('[data-testid="filter-debits-btn"]');
    await filterDebitsBtn.click();
    await expect(rows).toHaveCount(2);

    // Reset filter: ALL
    const filterAllBtn = page.locator('[data-testid="filter-all-btn"]');
    await filterAllBtn.click();
    await expect(rows).toHaveCount(4);
  });

  test("2. Displays low balance alert when Escrow reserve is below 3,000 DZD buffer", async ({
    page,
  }) => {
    // Setup with only 1,500 DZD balance (< 3,000 DZD buffer)
    await setupSupplierWalletSession(page, { lang: "fr", balance: 1500 });

    // Balance display
    await expect(page.getByRole("main").getByText("1 500 DZD", { exact: true }).first()).toBeVisible();

    // Low balance alert warning
    await expect(
      page.getByText(/Attention: solde inférieur au tampon minimum \(3 000 DZD\)/i)
    ).toBeVisible();
  });

  test("3. Ensures 390px mobile viewport card parity and hidden desktop table", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSupplierWalletSession(page, { lang: "fr" });

    // Mobile transaction cards should be visible
    const mobileCards = page.locator('[data-testid="supplier-wallet-tx-card"]');
    await expect(mobileCards).toHaveCount(4);
    await expect(mobileCards.first()).toBeVisible();

    // Desktop table rows should be hidden
    const desktopRows = page.locator('[data-testid="supplier-wallet-tx-row"]');
    await expect(desktopRows.first()).toBeHidden();

    // Card 1 check
    const card1 = mobileCards.first();
    await expect(card1.getByText("#TX-DEP-1")).toBeVisible();
    await expect(card1.getByText(/Dépôt \(Crédit\)/i)).toBeVisible();
    await expect(card1.getByText("+10 000 DZD")).toBeVisible();

    // 1-Click copy trigger on mobile card
    const cardCopyBtn = card1.locator('[data-testid="copy-tx-ref-btn"]').first();
    await expect(cardCopyBtn).toBeVisible();
    await cardCopyBtn.click();
  });

  test("4. Opens accessible Escrow Top-Up modal with 1-click RIP and CCP copy triggers", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupSupplierWalletSession(page, { lang: "fr" });

    // Click Top-Up button in header
    const topUpBtn = page.locator('[data-testid="supplier-wallet-topup-btn"]');
    await expect(topUpBtn).toBeVisible();
    await topUpBtn.click();

    // Modal verification
    const modal = page.locator('[data-testid="supplier-topup-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");

    // Copy BaridiMob RIP
    const copyRipBtn = page.locator('[data-testid="copy-rip-btn"]');
    await expect(copyRipBtn).toBeVisible();
    await copyRipBtn.click();

    // Copy Postal CCP
    const copyCcpBtn = page.locator('[data-testid="copy-ccp-btn"]');
    await expect(copyCcpBtn).toBeVisible();
    await copyCcpBtn.click();

    // Close modal via close button
    const closeBtn = page.locator('[data-testid="close-topup-modal-btn"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(modal).toBeHidden();
  });

  test("5. Enforces Arabic RTL parity and zero horizontal overflow across 390px, 768px, and 1440px", async ({
    page,
  }) => {
    await setupSupplierWalletSession(page, { lang: "ar", balance: 8500 });

    // RTL verification
    const dashboardRoot = page.locator('[data-dashboard-role="supplier"]');
    await expect(dashboardRoot).toHaveAttribute("dir", "rtl");

    // Arabic title & badges
    await expect(page.getByRole("heading", { name: /المحفظة وسجل المعاملات/i })).toBeVisible();
    await expect(page.getByText(/حساب الضمان المالي Escrow/i)).toBeVisible();
    await expect(page.getByText(/الرصيد المتاح حالياً/i).first()).toBeVisible();
    await expect(page.getByText(/إجمالي الإيداعات/i)).toBeVisible();
    await expect(page.getByText(/عمولات التسليم المقتطعة/i)).toBeVisible();

    // Verify LTR protection on transaction references
    const refs = page.locator('span[dir="ltr"]');
    const refCount = await refs.count();
    expect(refCount).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(refCount, 4); i++) {
      await expect(refs.nth(i)).toHaveAttribute("dir", "ltr");
    }

    // Zero horizontal overflow across all viewports
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
