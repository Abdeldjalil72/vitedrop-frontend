import { expect, test } from "@playwright/test";

const mockLeadOrder = {
  id: "ord-lead-qa-01",
  supplierId: "sup-qa-uuid",
  affiliateId: "aff-qa-uuid",
  cpaCommission: 1200,
  platformFee: 300,
  status: "lead_generated",
  customerName: "Mohamed Benali",
  customerPhone: "0555112233",
  address: "Rue Didouche Mourad, Alger",
  productId: "prod-smartwatch-01",
  productName: "ساعة ذكية رياضية Ultra Pro",
  quantity: 1,
  wilaya: 16,
  commune: "Alger Centre",
  trackingNumber: null,
  courier: null,
  courierLabelUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockConfirmedOrder = {
  ...mockLeadOrder,
  status: "supplier_confirmed",
};

const mockDepositRequest = {
  id: "req-dep-qa-01",
  supplierId: "sup-qa-uuid",
  supplierName: "Fournisseur QA",
  supplierEmail: "supplier@vitedrop.dz",
  supplierPhone: "+213 555 12 34 56",
  amount: 50000,
  paymentRail: "BARIDIMOB",
  referenceNote: "BM-998877-ALGER",
  receiptUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%237e22ce'/><text x='50' y='150' fill='white'>Bordereau BaridiMob 50,000 DA</text></svg>",
  status: "PENDING",
  rejectionReason: null,
  processedBy: null,
  processedAt: null,
  walletTransactionId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test.describe("Phase 5: Supplier Escrow Balance Pre-funding & Dynamic Confirmation Lock", () => {
  test("5.1 Call center blocks lead confirmation when supplier escrow balance is insufficient", async ({ page }) => {
    const apiBase = "http://localhost:4000";

    await page.addInitScript(() => {
      const fakeToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
        btoa(
          JSON.stringify({
            sub: "sup-qa-uuid",
            email: "supplier@vitedrop.dz",
            role: "SUPPLIER",
            exp: Math.floor(Date.now() / 1000) + 86400,
          })
        ) +
        ".signature";
      localStorage.setItem("vitedrop_token", fakeToken);
      localStorage.setItem("vitedrop_user", JSON.stringify({ id: "sup-qa-uuid", role: "SUPPLIER", email: "supplier@vitedrop.dz" }));
    });

    // Supplier wallet has low balance (500 DZD < 1,500 DZD required Gross CPA)
    await page.route(new RegExp(`^${apiBase}/wallets/me$`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "wal-sup-01", balance: 500, ownerType: "SUPPLIER" }),
      });
    });

    // Leads endpoint returns our unconfirmed lead
    await page.route(new RegExp(`^${apiBase}/supplier/call-center/leads$`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockLeadOrder]),
      });
    });

    await page.route(new RegExp(`^${apiBase}/supplier/orders$`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockLeadOrder]),
      });
    });

    // Confirm endpoint rejects due to insufficient escrow balance
    let confirmAttempted = false;
    await page.route(new RegExp(`^${apiBase}/supplier/call-center/${mockLeadOrder.id}/confirm$`), async (route) => {
      confirmAttempted = true;
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 400,
          message: "Solde prépayé insuffisant (500 DZD). Il vous faut au moins 1500 DZD pour couvrir le CPA brut de cette commande. Veuillez recharger votre portefeuille séquestre.",
          error: "Bad Request",
        }),
      });
    });

    await page.goto("/supplier");

    // Verify lead is visible in queue
    await expect(page.locator("body")).toContainText("Mohamed Benali");

    // Click confirm button
    const confirmBtn = page.locator('[data-testid="confirm-lead-btn"]:visible').first();
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    expect(confirmAttempted).toBe(true);

    // Error alert must be visible with message and direct 1-click top-up button
    const errorAlert = page.locator('[data-testid="supplier-error-alert"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Solde prépayé insuffisant");

    const topUpPromptBtn = page.locator('[data-testid="insufficient-escrow-topup-btn"]');
    await expect(topUpPromptBtn).toBeVisible();

    // Clicking top-up prompt opens SupplierTopUpModal
    await topUpPromptBtn.click();
    const modal = page.locator('[data-testid="supplier-topup-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("00799999002194829345"); // BaridiMob RIP
  });

  test("5.2 Supplier transmits deposit slip and tracks verification in Treasury hub", async ({ page }) => {
    const apiBase = "http://localhost:4000";
    let submittedDepositPayload: any = null;

    await page.addInitScript(() => {
      const fakeToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
        btoa(
          JSON.stringify({
            sub: "sup-qa-uuid",
            email: "supplier@vitedrop.dz",
            role: "SUPPLIER",
            exp: Math.floor(Date.now() / 1000) + 86400,
          })
        ) +
        ".signature";
      localStorage.setItem("vitedrop_token", fakeToken);
      localStorage.setItem("vitedrop_user", JSON.stringify({ id: "sup-qa-uuid", role: "SUPPLIER", email: "supplier@vitedrop.dz" }));
    });

    await page.route(new RegExp(`^${apiBase}/wallets/me$`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "wal-sup-01", balance: 500, ownerType: "SUPPLIER" }),
      });
    });

    await page.route(new RegExp(`^${apiBase}/wallets/transactions`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route(new RegExp(`^${apiBase}/supplier/orders`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // Mock deposit requests: initially empty, then returns submitted slip
    let depositQueryCount = 0;
    await page.route(new RegExp(`^${apiBase}/wallets/deposit-requests/me$`), async (route) => {
      depositQueryCount++;
      const data = depositQueryCount > 1 ? [mockDepositRequest] : [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    });

    // Mock deposit submission
    await page.route(new RegExp(`^${apiBase}/wallets/deposit-requests$`), async (route) => {
      submittedDepositPayload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(mockDepositRequest),
      });
    });

    await page.goto("/supplier/wallet");

    // Open Top-up modal from Treasury header
    const topUpBtn = page.locator('[data-testid="supplier-wallet-topup-btn"]');
    await expect(topUpBtn).toBeVisible();
    await topUpBtn.click();

    const modal = page.locator('[data-testid="supplier-topup-modal"]');
    await expect(modal).toBeVisible();

    // Select BaridiMob preset (50,000 DA)
    await page.locator('[data-testid="preset-amount-50000"]').click();

    // Attach mock receipt file
    await page.locator('[data-testid="receipt-slip-file-input"]').setInputFiles({
      name: "recu-baridimob.png",
      mimeType: "image/png",
      buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"),
    });

    // Enter reference note
    await page.locator('[data-testid="receipt-slip-ref-input"]').fill("BM-998877-ALGER");

    // Submit slip
    const submitBtn = page.locator('[data-testid="submit-receipt-slip-btn"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Close modal
    await page.locator('[data-testid="close-topup-modal-btn"]').click();
    await expect(modal).not.toBeVisible();

    // Verify submitted payload
    expect(submittedDepositPayload.amount).toBe(50000);
    expect(submittedDepositPayload.paymentRail).toBe("BARIDIMOB");
    expect(submittedDepositPayload.referenceNote).toBe("BM-998877-ALGER");

    // Treasury page now renders the recent deposit request section
    const depositSection = page.locator('[data-testid="supplier-deposit-requests-section"]');
    await expect(depositSection).toBeVisible();
    await expect(page.locator(`[data-testid="deposit-status-badge-${mockDepositRequest.id}"]`)).toContainText("En cours de validation");
  });

  test("5.3 Lead confirmation succeeds once escrow balance is funded", async ({ page }) => {
    const apiBase = "http://localhost:4000";
    let confirmCalled = false;

    await page.addInitScript(() => {
      const fakeToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
        btoa(
          JSON.stringify({
            sub: "sup-qa-uuid",
            email: "supplier@vitedrop.dz",
            role: "SUPPLIER",
            exp: Math.floor(Date.now() / 1000) + 86400,
          })
        ) +
        ".signature";
      localStorage.setItem("vitedrop_token", fakeToken);
      localStorage.setItem("vitedrop_user", JSON.stringify({ id: "sup-qa-uuid", role: "SUPPLIER", email: "supplier@vitedrop.dz" }));
    });

    // Supplier now has funded escrow balance (50,500 DZD >= 1,500 DZD)
    await page.route(new RegExp(`^${apiBase}/wallets/me$`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "wal-sup-01", balance: 50500, ownerType: "SUPPLIER" }),
      });
    });

    let fetchCount = 0;
    await page.route(new RegExp(`^${apiBase}/supplier/call-center/leads$`), async (route) => {
      fetchCount++;
      const data = fetchCount > 1 ? [] : [mockLeadOrder];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    });

    await page.route(new RegExp(`^${apiBase}/supplier/orders$`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockConfirmedOrder]),
      });
    });

    // Confirm endpoint now succeeds
    await page.route(new RegExp(`^${apiBase}/supplier/call-center/${mockLeadOrder.id}/confirm$`), async (route) => {
      confirmCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockConfirmedOrder),
      });
    });

    await page.goto("/supplier");

    // Click confirm button
    const confirmBtn = page.locator('[data-testid="confirm-lead-btn"]:visible').first();
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    expect(confirmCalled).toBe(true);

    // In-page success notification appears
    await expect(page.locator('[data-testid="supplier-action-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="supplier-action-alert"]')).toContainText("confirmé avec succès");
  });
});
