import { expect, test } from "@playwright/test";

const mockDeliveredOrder = {
  id: "ord-delivered-qa-01",
  reference: "DELIV-QA-01",
  productName: "ساعة ذكية رياضية Ultra Pro",
  quantity: 1,
  totalPrice: 4800,
  wilaya: 16,
  commune: "Alger Centre",
  maskedPhone: "05*****456",
  status: "delivered",
  trackingNumber: "YAL-DZ-11223344",
  courier: "Yalidine Express",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  timeline: [
    { status: "lead_generated", date: new Date(Date.now() - 86400000 * 3).toISOString(), reason: "Commande créée" },
    { status: "dispatched", date: new Date(Date.now() - 86400000 * 2).toISOString(), reason: "Colis expédié" },
    { status: "delivered", date: new Date(Date.now() - 86400000 * 1).toISOString(), reason: "Colis livré et encaissé" },
  ],
  canRequestReturn: true,
  isReturnRequested: false,
};

const mockReturnRequestedOrder = {
  ...mockDeliveredOrder,
  status: "return_requested",
  canRequestReturn: false,
  isReturnRequested: true,
  returnReason: "Produit endommagé ou défectueux",
  returnNotes: "L'écran ne s'allume pas après charge complète.",
};

const mockSupplierRtoOrder = {
  id: "ord-rto-qa-01",
  supplierId: "sup-qa-uuid",
  affiliateId: "aff-qa-uuid",
  cpaCommission: 1200,
  platformFee: 300,
  status: "returned_to_supplier",
  customerName: "Samir Khelifi",
  customerPhone: "0770112233",
  address: "Boulevard Colonel Amirouche, Bejaia",
  productId: "prod-smartwatch-01",
  productName: "ساعة ذكية رياضية Ultra Pro",
  quantity: 1,
  wilaya: 6,
  commune: "Bejaia",
  trackingNumber: "YAL-RTO-998877",
  courier: "YALIDINE",
  courierLabelUrl: null,
  returnReason: "Refus client - Colis endommagé lors du transport",
  returnNotes: "Boîte écrasée constatée par le livreur",
  restockStatus: "PENDING",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockSupplierRestockedOrder = {
  ...mockSupplierRtoOrder,
  restockStatus: "RESTOCKED",
};

const mockSupplierDamagedOrder = {
  ...mockSupplierRtoOrder,
  id: "ord-rto-qa-02",
  customerName: "Nadia Meziane",
  restockStatus: "DAMAGED",
};

test.describe("Phase 4: Customer Return Portal & Supplier RTO Inventory Flow", () => {
  test("4.1 Customer can initiate return request on delivered order via /track", async ({ page }) => {
    const apiBase = "http://localhost:4000";
    let returnRequestPayload: any = null;

    // Track order API mock
    let trackingFetchCount = 0;
    await page.route(new RegExp(`^${apiBase}/orders/track/`), async (route) => {
      trackingFetchCount++;
      const data = trackingFetchCount > 1 ? mockReturnRequestedOrder : mockDeliveredOrder;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    });

    // Return request submission mock
    await page.route(new RegExp(`^${apiBase}/orders/return-request`), async (route) => {
      returnRequestPayload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Demande de retour enregistrée avec succès. Notre équipe vous contactera sous 24h.",
          order: mockReturnRequestedOrder,
        }),
      });
    });

    await page.goto("/track?id=ord-delivered-qa-01");

    // Order details and guarantee CTA should be visible
    await expect(page.locator('[data-testid="tracking-details-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="return-guarantee-section"]')).toBeVisible();

    // Click request return button
    const requestBtn = page.locator('[data-testid="request-return-btn"]');
    await expect(requestBtn).toBeVisible();
    await requestBtn.click();

    // Modal should appear
    const modal = page.locator('[data-testid="return-request-modal"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.locator('[data-testid="return-phone-input"]').fill("0555123456");
    await page.locator('[data-testid="return-reason-select"]').selectOption("Produit endommagé ou défectueux");
    await page.locator('[data-testid="return-notes-input"]').fill("L'écran ne s'allume pas après charge complète.");

    // Submit
    const submitBtn = page.locator('[data-testid="submit-return-request-btn"]');
    await submitBtn.click();

    // Success banner in modal
    await expect(page.locator('[data-testid="return-request-success-banner"]')).toBeVisible();
    expect(returnRequestPayload).toEqual({
      reference: "DELIV-QA-01",
      phone: "0555123456",
      reason: "Produit endommagé ou défectueux",
      notes: "L'écran ne s'allume pas après charge complète.",
    });

    // Tracking card updates with return-requested-banner
    await expect(page.locator('[data-testid="return-requested-banner"]')).toBeVisible({ timeout: 5000 });
  });

  test("4.2 Supplier can restock intact RTO order into inventory (+1 available stock)", async ({ page }) => {
    const apiBase = "http://localhost:4000";
    let restockPayload: any = null;

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

    let fetchCount = 0;
    await page.route(new RegExp(`^${apiBase}/supplier/orders$`), async (route) => {
      fetchCount++;
      const data = fetchCount > 1 ? [mockSupplierRestockedOrder] : [mockSupplierRtoOrder];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    });

    // Restock endpoint
    await page.route(new RegExp(`^${apiBase}/supplier/orders/${mockSupplierRtoOrder.id}/rto-restock`), async (route) => {
      restockPayload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Produit réintégré au stock avec succès.",
          order: mockSupplierRestockedOrder,
        }),
      });
    });

    await page.goto("/supplier/orders");

    // Verify RTO order is visible with restock button
    await expect(page.locator('[data-testid="supplier-orders-table"]')).toBeVisible();
    const restockBtn = page.locator('[data-testid="rto-restock-btn"]');
    await expect(restockBtn).toBeVisible();

    // Click Restock
    await restockBtn.click();

    // Verify payload and success badge
    await expect(page.locator('[data-testid="supplier-action-banner"]')).toBeVisible();
    expect(restockPayload).toEqual({ condition: "INTACT" });

    // Badge indicates restocked
    await expect(page.locator(`[data-testid="restock-badge-restocked-${mockSupplierRtoOrder.id}"]`)).toBeVisible();
  });

  test("4.3 Supplier can write-off damaged RTO item without restocking available inventory", async ({ page }) => {
    const apiBase = "http://localhost:4000";
    let restockPayload: any = null;

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

    let fetchCount = 0;
    const initialOrder = { ...mockSupplierRtoOrder, id: "ord-rto-qa-02" };
    await page.route(new RegExp(`^${apiBase}/supplier/orders$`), async (route) => {
      fetchCount++;
      const data = fetchCount > 1 ? [mockSupplierDamagedOrder] : [initialOrder];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    });

    // Damage write-off endpoint
    await page.route(new RegExp(`^${apiBase}/supplier/orders/${initialOrder.id}/rto-restock`), async (route) => {
      restockPayload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Le produit a été classé comme défectueux (perte comptabilisée).",
          order: mockSupplierDamagedOrder,
        }),
      });
    });

    await page.goto("/supplier/orders");

    // Click "Défectueux"
    const damageBtn = page.locator('[data-testid="rto-damage-btn"]');
    await expect(damageBtn).toBeVisible();
    await damageBtn.click();

    // Verify payload and damaged badge
    await expect(page.locator('[data-testid="supplier-action-banner"]')).toBeVisible();
    expect(restockPayload).toEqual({ condition: "DAMAGED" });
    await expect(page.locator(`[data-testid="restock-badge-damaged-${initialOrder.id}"]`)).toBeVisible();
  });
});
