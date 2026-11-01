import { expect, test, type Page } from "@playwright/test";

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

async function setupEnglishSession(page: Page, path: string) {
  const apiBase = "http://localhost:4000";

  // Mock wallet balance
  await page.route(new RegExp(`^${apiBase}/wallets?/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "wal-sup-qa",
        userId: "sup-qa-uuid",
        balance: 12500,
        currency: "DZD",
        ownerType: "SUPPLIER",
      }),
    });
  });

  // Mock leads
  await page.route(new RegExp(`^${apiBase}/supplier/call-center/leads`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "lead-en-101",
          customerName: "Amina Benali",
          customerPhone: "0555112233",
          wilaya: 16,
          commune: "Bab El Oued",
          address: "Rue Didouche",
          productName: "Casque Bluetooth Pro",
          quantity: 1,
          totalPrice: 4500,
          status: "pending_call",
          createdAt: new Date().toISOString(),
        },
      ]),
    });
  });

  // Mock orders
  await page.route(new RegExp(`^${apiBase}/supplier/orders`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "ord-en-201",
          supplierId: "sup-qa-uuid",
          affiliateId: "aff-dz-01",
          cpaCommission: 1000,
          platformFee: 250,
          status: "supplier_confirmed",
          customerName: "Samir Kaci",
          customerPhone: "0661223344",
          address: "Zone Industrielle",
          productId: "prod-01",
          productName: "Tondeuse VGR",
          quantity: 1,
          wilaya: 31,
          commune: "Es Senia",
          trackingNumber: null,
          courier: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: "ord-en-202",
          supplierId: "sup-qa-uuid",
          affiliateId: "aff-dz-02",
          cpaCommission: 1200,
          platformFee: 300,
          status: "dispatched",
          customerName: "Yasmine Belkacem",
          customerPhone: "0770334455",
          address: "Cité 1000 Logts",
          productId: "prod-02",
          productName: "Mini Imprimante",
          quantity: 1,
          wilaya: 25,
          commune: "Ali Mendjeli",
          trackingNumber: "YAL-EN-778899",
          courier: "YALIDINE",
          createdAt: new Date().toISOString(),
        },
      ]),
    });
  });

  // Mock products
  await page.route(new RegExp(`^${apiBase}/supplier/products`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "prod-en-01",
          name: "Smart Watch Pulse",
          stock: 45,
          retailPrice: 5500,
          supplierTotalCpa: 1200,
          status: "active",
        },
      ]),
    });
  });

  // Mock transactions
  await page.route(new RegExp(`^${apiBase}/wallets?/transactions`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "tx-en-01",
            walletId: "wal-sup-qa",
            type: "DEPOSIT",
            amount: 15000,
            reference: "BaridiMob Recharge #EN-001",
            createdAt: new Date().toISOString(),
          },
          {
            id: "tx-en-02",
            walletId: "wal-sup-qa",
            type: "SUPPLIER_DEBIT",
            amount: -1250,
            reference: "Delivery CPA #ORD-EN-202",
            createdAt: new Date().toISOString(),
          },
        ],
        total: 2,
        limit: 100,
        offset: 0,
      }),
    });
  });

  // Inject English language preference and token
  await page.addInitScript(
    ({ token }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", "en");
    },
    { token: createSupplierToken() }
  );

  await page.goto(path);
  await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 30000 });
}

test.describe("Supplier Portal English Language Switcher Verification", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Renders Supplier Dashboard in clean English with zero French fallback", async ({ page }) => {
    await setupEnglishSession(page, "/supplier");

    // Header badge & title
    await expect(page.getByText("Supplier Hub • Call Center Desk")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Order Queue & Confirmation" })).toBeVisible();

    // Escrow banner
    await expect(page.getByText("ViteDrop Prepaid Escrow Model")).toBeVisible();
    await expect(page.getByRole("button", { name: /Top-up Escrow Balance/i })).toBeVisible();

    // Tabs
    await expect(page.locator('[data-testid="tab-queue"]')).toContainText("Call Center Queue");
    await expect(page.locator('[data-testid="tab-confirmed"]')).toContainText("To Dispatch (Waybills)");
    await expect(page.locator('[data-testid="tab-all"]')).toContainText("All Orders & Tracking");

    // Queue table headers
    await expect(page.getByRole("columnheader", { name: "Lead Ref." })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Customer & Phone" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Destination & Address" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Quantity & Total" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Call Center Actions" })).toBeVisible();

    // Action button
    await expect(page.getByRole("button", { name: /Confirm Order/i }).first()).toBeVisible();
  });

  test("2. Renders Supplier Orders & Logistics page in clean English with zero French fallback", async ({ page }) => {
    await setupEnglishSession(page, "/supplier/orders");

    // Header badge & subtitle
    await expect(page.getByText("Logistics & Shipping")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Waybill & Shipping" })).toBeVisible();
    await expect(
      page.getByText("Issue waybills for delivery carriers (Yalidine / ZR Express) and track parcels")
    ).toBeVisible();

    // Search placeholder
    const searchInput = page.locator('[data-testid="supplier-order-search"]');
    await expect(searchInput).toHaveAttribute(
      "placeholder",
      "Search by order ID, customer, phone, or tracking..."
    );

    // Wilayas dropdown default
    await expect(page.locator('[data-testid="supplier-wilaya-select"]')).toContainText("All wilayas (58)");

    // Status filter tabs
    await expect(page.locator('[data-testid="supplier-status-tab-all"]')).toHaveText("All");
    await expect(page.locator('[data-testid="supplier-status-tab-supplier_confirmed"]')).toHaveText("To Dispatch");
    await expect(page.locator('[data-testid="supplier-status-tab-dispatched"]')).toHaveText("Waybill Generated");
    await expect(page.locator('[data-testid="supplier-status-tab-in_transit"]')).toHaveText("In Transit");
    await expect(page.locator('[data-testid="supplier-status-tab-delivered"]')).toHaveText("Delivered");
    await expect(page.locator('[data-testid="supplier-status-tab-rto_in_transit"]')).toHaveText("RTO Returns");

    // Table columns
    await expect(page.getByRole("columnheader", { name: "Order Ref." })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Recipient" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Waybill / Tracking" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "CPA Cost" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();

    // Table action buttons
    await expect(page.locator('[data-testid="dispatch-order-btn"]')).toContainText("Yalidine Waybill");
    await expect(page.locator('[data-testid="simulate-delivery-btn"]')).toContainText("Simulate Delivered");
  });

  test("3. Renders Supplier Products Catalog in clean English with zero French fallback", async ({ page }) => {
    await setupEnglishSession(page, "/supplier/products");

    // Header badge & title
    await expect(page.getByText("Supplier Catalog • Solvency")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Catalog & Product Management" })).toBeVisible();
    await expect(
      page.getByText("Set CPA budgets, manage inventory, and monitor escrow coverage")
    ).toBeVisible();

    // Buttons & Actions
    await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Top-up" })).toBeVisible();
    await expect(page.locator('[data-testid="new-product-page-btn"]')).toContainText("New Product");
    await expect(page.locator('[data-testid="add-product-btn"]')).toBeVisible();

    // Search placeholder
    const searchInput = page.locator('[data-testid="product-search-input"]');
    await expect(searchInput).toHaveAttribute("placeholder", "Search by name or ref...");

    // Status filter tabs
    await expect(page.locator('[data-testid="filter-all-btn"]')).toContainText("All");
    await expect(page.locator('[data-testid="filter-active-btn"]')).toHaveText("Active");
    await expect(page.locator('[data-testid="filter-out-of-stock-btn"]')).toHaveText("Out of Stock");

    // Table columns
    await expect(page.getByRole("columnheader", { name: "Product & Ref." })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Current Stock" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Retail Price" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Gross CPA Budget" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Net Affiliate" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();

    // Units label
    await expect(page.getByText("units").first()).toBeVisible();
  });

  test("4. Renders Supplier Wallet & Ledger in clean English with zero French fallback", async ({ page }) => {
    await setupEnglishSession(page, "/supplier/wallet");

    // Header badge & title
    await expect(page.getByText("Escrow Account & Treasury")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Wallet & General Ledger" })).toBeVisible();
    await expect(
      page.getByText("Manage your prepaid reserve and full audit trail of deposits and debits")
    ).toBeVisible();

    // Action buttons
    await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Top-up My Balance" })).toBeVisible();

    // Status cards
    await expect(page.getByText("Current Escrow Balance")).toBeVisible();
    await expect(page.getByText("Sufficient coverage for current shipments")).toBeVisible();
    await expect(page.getByText("Total Prepaid Deposits")).toBeVisible();
    await expect(page.getByText("Funds credited via BaridiMob & CCP transfers")).toBeVisible();
    await expect(page.getByText("Confirmed Delivery Debits")).toBeVisible();
    await expect(page.getByText("0 DZD fees on return (RTO)")).toBeVisible();

    // Search and filter pills
    await expect(page.locator('[data-testid="tx-search-input"]')).toHaveAttribute(
      "placeholder",
      "Search by ref. or description..."
    );
    await expect(page.locator('[data-testid="filter-all-btn"]')).toContainText("All");
    await expect(page.locator('[data-testid="filter-deposits-btn"]')).toHaveText("Deposits");
    await expect(page.locator('[data-testid="filter-debits-btn"]')).toHaveText("Debits");

    // Table headers
    await expect(page.getByRole("columnheader", { name: "Transaction Ref." })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Type" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Description / Details" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Date & Time" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Amount" })).toBeVisible();

    // Badges in ledger rows
    const rows = page.locator('[data-testid="supplier-wallet-tx-row"]');
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText("Deposit (Credit)");
    await expect(rows.nth(1)).toContainText("Delivery Debit");
  });
});
