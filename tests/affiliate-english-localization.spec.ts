import { expect, test, type Page } from "@playwright/test";

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

async function setupEnglishSession(page: Page, path: string): Promise<void> {
  const apiBase = "http://localhost:4000";

  await page.route(new RegExp(`^${apiBase}/wallets?/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "wal-aff-qa",
        userId: "aff-qa-uuid",
        balance: 1200,
        currency: "DZD",
        ownerType: "AFFILIATE",
      }),
    });
  });

  await page.route(new RegExp(`^${apiBase}/wallets?/transactions`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "tx-aff-01",
            walletId: "wal-aff-qa",
            userId: "aff-qa-uuid",
            userRole: "affiliate",
            type: "CPA_PAYOUT",
            amount: 1200,
            referenceId: "VD-89410",
            description: "Commission CPA commande livrée",
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
      }),
    });
  });

  await page.route(new RegExp(`^${apiBase}/affiliate/marketplace`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "prod-earbuds-01",
          name: "Écouteurs Sans Fil Pro ANC",
          affiliateNetPayout: 960,
          category: "Electronics",
        },
      ]),
    });
  });

  await page.route(new RegExp(`^${apiBase}/affiliate/orders`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "ord-test-en-01",
          affiliateId: "aff-qa-uuid",
          cpaCommission: 1200,
          status: "delivered",
          customerName: "Amine Meziani",
          customerPhone: "0661987654",
          address: "Cité 1000 Logements",
          productId: "prod-watch-02",
          quantity: 1,
          wilaya: 31,
          commune: "Oran",
          trackingNumber: "YAL-1791039550527",
          courier: "YALIDINE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]),
    });
  });

  await page.route(new RegExp(`^${apiBase}/notifications`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ unreadCount: 0, data: [], total: 0 }),
    });
  });

  await page.addInitScript(
    ({ token }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", "en");
    },
    { token: createAffiliateToken() }
  );

  await page.goto(path);
  await page.waitForSelector('[data-dashboard-role="affiliate"]', { timeout: 30000 });
}

test.describe("Affiliate Portal Full English Localization Suite", () => {
  test("1. Affiliate Performance page renders English quick action ribbon and KPIs", async ({ page }) => {
    await setupEnglishSession(page, "/affiliate");

    // Quick action ribbon in English
    await expect(page.getByText("Maximize Your Earnings")).toBeVisible();
    await expect(page.getByText("Ready to scale your ad campaigns?")).toBeVisible();
    await expect(page.getByText(/Select high-potential products with up to 3,500 DZD net CPA/i)).toBeVisible();

    // Buttons
    await expect(page.getByText("Product Catalog")).toBeVisible();
    await expect(page.getByText("S2S Links")).toBeVisible();

    // KPI cards notes in English
    await expect(page.getByText("100% Net CPA")).toBeVisible();
    await expect(page.getByText("Confirmed via Yalidine/ZR Webhook")).toBeVisible();
    await expect(page.getByText("Effective clearance rate")).toBeVisible();
    await expect(page.getByText("Pending Commissions")).toBeVisible();
  });

  test("2. Tracking Links page renders English builder, telemetry, and catalog", async ({ page }) => {
    await setupEnglishSession(page, "/affiliate/links");

    // Header and builder in English
    await expect(page.getByRole("heading", { name: "Link Generator & S2S Campaigns" })).toBeVisible();
    await expect(page.getByText("Campaign Link Configuration")).toBeVisible();
    await expect(page.getByText("Pre-configured Traffic Source")).toBeVisible();
    await expect(page.getByText("Selected Product")).toBeVisible();
    await expect(page.getByText("Generated Tracking Link (Ready to use)")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Link" })).toBeVisible();

    // S2S card in English
    await expect(page.getByText("Server-to-Server Tracking Architecture (CAPI Telemetry)")).toBeVisible();
    await expect(page.getByText("Initial Click Capture")).toBeVisible();
    await expect(page.getByText("COD Lead Attribution")).toBeVisible();
    await expect(page.getByText("Post-Delivery CAPI")).toBeVisible();

    // Catalog in English
    await expect(page.getByRole("heading", { name: "Quick Links Catalog" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Product", exact: true })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Affiliate Net Payout" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Direct Product Link" })).toBeVisible();
  });

  test("3. Leads & Orders page renders English filters, tabs, table, and details modal", async ({ page }) => {
    await setupEnglishSession(page, "/affiliate/leads");

    // KPI Cards in English
    await expect(page.getByText("Cleared Earnings (Delivered)")).toBeVisible();
    await expect(page.getByText("Commissions In Pipeline")).toBeVisible();
    await expect(page.getByText("Total Prospects")).toBeVisible();
    await expect(page.getByText("Delivery Rate")).toBeVisible();

    // Search and Wilayas
    await expect(page.getByPlaceholder("Search by order ID, customer name, phone, or tracking...")).toBeVisible();
    await expect(page.locator('[data-testid="affiliate-wilaya-select"]')).toContainText("All wilayas (58)");

    // Status filter tabs in English
    await expect(page.locator('[data-testid="tab-status-all"]')).toContainText("All");
    await expect(page.locator('[data-testid="tab-status-lead_generated"]')).toContainText("New Leads");
    await expect(page.locator('[data-testid="tab-status-in_pipeline"]')).toContainText("In Transit / Dispatched");
    await expect(page.locator('[data-testid="tab-status-delivered"]')).toContainText("Delivered");
    await expect(page.locator('[data-testid="tab-status-returned_canceled"]')).toContainText("Canceled / Returns");

    // Table headers in English
    await expect(page.locator("th", { hasText: "Order Ref." })).toBeVisible();
    await expect(page.locator("th", { hasText: "Customer & Destination" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Carrier & Tracking" })).toBeVisible();
    await expect(page.locator("th", { hasText: "Net Commission" })).toBeVisible();

    // Modal in English
    const orderRow = page.locator('[data-testid="affiliate-order-row"]').first();
    await orderRow.click();
    const modal = page.locator('[data-testid="affiliate-order-detail-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Order & Delivery Details")).toBeVisible();
    await expect(modal.getByText("Current status")).toBeVisible();
    await expect(modal.getByText("Customer Information")).toBeVisible();
    await modal.getByRole("button", { name: "Close" }).click();
    await expect(modal).toHaveCount(0);
  });

  test("4. Settings page renders English profile and payout preferences", async ({ page }) => {
    await setupEnglishSession(page, "/affiliate/settings");

    await expect(page.getByText("Profile Settings")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Profile & Payment Details" })).toBeVisible();
    await expect(page.getByText("Personal Information")).toBeVisible();
    await expect(page.getByText("Email Address")).toBeVisible();
    await expect(page.getByText("Affiliate ID")).toBeVisible();
    await expect(page.getByText("Default Payout Details")).toBeVisible();
    await expect(page.getByText("Payment Method")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save Changes" })).toBeVisible();
  });

  test("5. Wallet page renders English overview cards, banner, and ledger", async ({ page }) => {
    await setupEnglishSession(page, "/affiliate/wallet");

    await expect(page.getByRole("heading", { name: "Wallet & Payouts" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Request Payout" })).toBeVisible();
    await expect(page.getByText("Available Balance (Withdrawable)")).toBeVisible();
    await expect(page.getByText("100% cleared & verified")).toBeVisible();
    await expect(page.getByText("Pending In-Transit Commissions")).toBeVisible();
    await expect(page.getByText("Total Already Withdrawn")).toBeVisible();

    // Payment channels banner
    await expect(page.getByText("Fast & Fee-Free Payment Channels")).toBeVisible();
    await expect(page.getByRole("button", { name: "Withdraw Earnings" })).toBeVisible();

    // Transaction history
    await expect(page.getByText("Transaction History (Double-Entry Ledger)")).toBeVisible();
    await expect(page.locator("th", { hasText: "Transaction Ref." })).toBeVisible();
    await expect(page.locator("th", { hasText: "Details / Reference" })).toBeVisible();
  });
});
