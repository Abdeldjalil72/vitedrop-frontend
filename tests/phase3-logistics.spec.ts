import { expect, test } from "@playwright/test";

const mockConfirmedOrder = {
  id: "ord-qa-yalidine-01",
  supplierId: "sup-qa-uuid",
  affiliateId: "aff-qa-uuid",
  cpaCommission: 1200,
  platformFee: 300,
  status: "supplier_confirmed",
  customerName: "Amina Bouzid",
  customerPhone: "0555123456",
  address: "Rue Didouche Mourad, Alger Centre",
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

const mockDispatchedYalidineOrder = {
  ...mockConfirmedOrder,
  status: "dispatched",
  trackingNumber: "YAL-DZ-88776655",
  courier: "YALIDINE",
  courierLabelUrl: "https://api.yalidine.app/v1/parcels/labels/YAL-DZ-88776655.pdf",
};

const mockLead = {
  id: "lead-call-qa-01",
  supplierId: "sup-qa-uuid",
  affiliateId: "aff-qa-uuid",
  cpaCommission: 1200,
  platformFee: 300,
  status: "lead_generated",
  customerName: "Karim Ziani",
  customerPhone: "0666987654",
  address: "Cite 1000 Logements, Oran",
  productId: "prod-smartwatch-01",
  productName: "ساعة ذكية رياضية Ultra Pro",
  quantity: 2,
  wilaya: 31,
  commune: "Oran",
  trackingNumber: null,
  courier: null,
  courierLabelUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test.describe("Phase 3: Logistics & Yalidine Automation", () => {
  test("3.1 1-click Yalidine API booking dispatches parcel and generates tracking & label", async ({ page }) => {
    const apiBase = "http://localhost:4000";
    let yalidineDispatched = false;

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

    // Initial fetch returns confirmed order, subsequent returns dispatched
    let fetchCount = 0;
    await page.route(new RegExp(`^${apiBase}/supplier/orders$`), async (route) => {
      fetchCount++;
      const data = fetchCount > 1 ? [mockDispatchedYalidineOrder] : [mockConfirmedOrder];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    });

    // Intercept Yalidine dispatch endpoint
    await page.route(new RegExp(`^${apiBase}/supplier/call-center/${mockConfirmedOrder.id}/dispatch-yalidine`), async (route) => {
      yalidineDispatched = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockDispatchedYalidineOrder),
      });
    });

    await page.goto("/supplier/orders");

    // Check confirmed order is listed
    await expect(page.locator("body")).toContainText("Amina Bouzid");

    // Click 1-Click Yalidine API dispatch button
    const yalidineBtn = page.locator('[data-testid="dispatch-yalidine-btn"]').first();
    await expect(yalidineBtn).toBeVisible();
    await yalidineBtn.click();

    // Verify API called
    expect(yalidineDispatched).toBe(true);

    // Verify waybill modal opened with official Yalidine label link
    const waybillModal = page.locator('[data-testid="order-waybill-modal"]');
    await expect(waybillModal).toBeVisible();
    await expect(waybillModal).toContainText("YAL-DZ-88776655");

    const pdfLink = waybillModal.locator('[data-testid="official-courier-pdf-link"]');
    await expect(pdfLink).toBeVisible();
    await expect(pdfLink).toHaveAttribute("href", "https://api.yalidine.app/v1/parcels/labels/YAL-DZ-88776655.pdf");
  });

  test("3.2 surfaces official carrier PDF link on dispatched orders", async ({ page }) => {
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
    });

    await page.route(new RegExp(`^${apiBase}/supplier/orders$`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockDispatchedYalidineOrder]),
      });
    });

    await page.goto("/supplier/orders");

    // Table row should display official courier PDF link
    const pdfTableLink = page.locator('[data-testid="official-courier-pdf-link"]').first();
    await expect(pdfTableLink).toBeVisible();
    await expect(pdfTableLink).toHaveAttribute("href", "https://api.yalidine.app/v1/parcels/labels/YAL-DZ-88776655.pdf");
  });

  test("3.3 records call attempts to shared backend note and timeline", async ({ page }) => {
    const apiBase = "http://localhost:4000";
    let recordedAttemptPayload: any = null;

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
      localStorage.removeItem("vitedrop_call_attempts");
    });

    await page.route(new RegExp(`^${apiBase}/supplier/call-center/leads$`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockLead]),
      });
    });

    await page.route(new RegExp(`^${apiBase}/supplier/orders$`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route(new RegExp(`^${apiBase}/wallets/my$`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ balance: 50000 }),
      });
    });

    // Intercept call attempt endpoint
    await page.route(new RegExp(`^${apiBase}/supplier/call-center/${mockLead.id}/call-attempt`), async (route) => {
      recordedAttemptPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, attempt: 1, reason: "Injoignable / Pas de réponse" }),
      });
    });

    await page.goto("/supplier");

    // Locate the call attempt button on the desktop lead row
    const leadRow = page.locator('[data-testid="supplier-lead-row"]').first();
    await expect(leadRow).toBeVisible();
    const attemptBtn = leadRow.locator('[data-testid="call-attempt-btn"]');
    await expect(attemptBtn).toBeVisible();
    await attemptBtn.click();

    // Verify backend persistence was called with attempt #1
    expect(recordedAttemptPayload).not.toBeNull();
    expect(recordedAttemptPayload.attempt).toBe(1);
    expect(recordedAttemptPayload.reason).toBe("Injoignable / Pas de réponse");
  });
});
