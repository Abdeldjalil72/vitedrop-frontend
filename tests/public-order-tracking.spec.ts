import { expect, test, type Page } from "@playwright/test";

const mockTrackingDispatched = {
  id: "245b1c8e-3fa1-4198-8db9-4672e8bc1a02",
  reference: "245B1C8E",
  trackingNumber: "YAL-948201",
  courier: "Yalidine Express",
  status: "dispatched",
  customerName: "A***",
  maskedPhone: "0661***344",
  wilaya: 16,
  commune: "Cheraga",
  productName: "ساعة ذكية رياضية Ultra Pro المقاومة للماء",
  quantity: 2,
  unitPrice: 4900,
  totalPrice: 9800,
  createdAt: "2026-10-18T10:00:00.000Z",
  updatedAt: "2026-10-18T14:30:00.000Z",
  timeline: [
    {
      status: "lead_generated",
      date: "2026-10-18T10:00:00.000Z",
      reason: "Lead généré via formulaire checkout affilié",
    },
    {
      status: "supplier_confirmed",
      date: "2026-10-18T11:15:00.000Z",
      reason: "Lead confirmé par téléphone par le call center fournisseur",
    },
    {
      status: "dispatched",
      date: "2026-10-18T14:30:00.000Z",
      reason: "Bordereau transporteur Yalidine généré (YAL-948201)",
    },
  ],
};

const mockTrackingDelivered = {
  ...mockTrackingDispatched,
  status: "delivered",
  timeline: [
    ...mockTrackingDispatched.timeline,
    {
      status: "in_transit",
      date: "2026-10-18T16:00:00.000Z",
      reason: "Sorti en livraison avec le livreur",
    },
    {
      status: "delivered",
      date: "2026-10-19T09:20:00.000Z",
      reason: "Colis livré et encaissé au client",
    },
  ],
};

const mockTrackingCanceled = {
  ...mockTrackingDispatched,
  status: "canceled",
  timeline: [
    ...mockTrackingDispatched.timeline.slice(0, 1),
    {
      status: "canceled",
      date: "2026-10-18T11:00:00.000Z",
      reason: "Client injoignable après 3 tentatives",
    },
  ],
};

async function setupTrackingRoutes(page: Page) {
  const apiBase = "http://localhost:4000";

  await page.route(new RegExp(`^${apiBase}/orders/track/`), async (route) => {
    const url = route.request().url();
    const ref = decodeURIComponent(url.split("/orders/track/")[1] || "");

    if (ref === "notfound" || ref === "INVALID-REF") {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 404,
          message: "Commande introuvable avec cette référence ou ce numéro de suivi",
        }),
      });
    } else if (ref === "canceled" || ref === "ORD-CANCELED") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTrackingCanceled),
      });
    } else if (ref === "delivered" || ref === "ORD-DELIVERED") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTrackingDelivered),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTrackingDispatched),
      });
    }
  });
}

test.describe("Phase 6: Public Customer Order Tracking", () => {
  test("renders public tracking page with search input and allows manual lookup", async ({ page }) => {
    await setupTrackingRoutes(page);
    await page.goto("/track");

    await expect(page.locator("h1")).toContainText("أين وصل طلبي؟");
    const input = page.locator("[data-testid='track-search-input']");
    await expect(input).toBeVisible();

    // Type reference and submit
    await input.fill("YAL-948201");
    await page.locator("[data-testid='track-submit-btn']").click();

    // Verify tracking card renders
    await expect(page.locator("[data-testid='tracking-details-card']")).toBeVisible();
    await expect(page.locator("[data-testid='tracking-number-badge']")).toContainText("YAL-948201");
    await expect(page.locator("[data-testid='track-total-price']")).toHaveText(/9[., ]?800/);
  });

  test("automatically loads order details when reference is passed in query string", async ({ page }) => {
    await setupTrackingRoutes(page);
    await page.goto("/track?id=245B1C8E");

    await expect(page.locator("[data-testid='tracking-details-card']")).toBeVisible();
    await expect(page.locator("[data-testid='tracking-number-badge']")).toContainText("YAL-948201");
    await expect(page.locator("[data-testid='stepper-item-dispatched']")).toBeVisible();
  });

  test("displays delivered status and full stepper progression for delivered order", async ({ page }) => {
    await setupTrackingRoutes(page);
    await page.goto("/track?id=delivered");

    await expect(page.locator("[data-testid='tracking-details-card']")).toBeVisible();
    await expect(page.locator("[data-testid='stepper-item-delivered']")).toBeVisible();
    await expect(page.locator("[data-testid='courier-waybill-card']")).toBeVisible();
  });

  test("displays in-page error message when order is not found without native alert", async ({ page }) => {
    await setupTrackingRoutes(page);
    await page.goto("/track");

    const input = page.locator("[data-testid='track-search-input']");
    await input.fill("INVALID-REF");
    await page.locator("[data-testid='track-submit-btn']").click();

    const alert = page.locator("[data-testid='track-error-alert']");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("تعذر العثور على الطلب");
  });

  test("displays abnormal status banner when order is canceled", async ({ page }) => {
    await setupTrackingRoutes(page);
    await page.goto("/track?id=canceled");

    await expect(page.locator("[data-testid='abnormal-status-banner']")).toBeVisible();
    await expect(page.locator("[data-testid='abnormal-status-banner']")).toContainText("تم إلغاء هذا الطلب");
  });

  test("WhatsApp support button contains prefilled order reference", async ({ page }) => {
    await setupTrackingRoutes(page);
    await page.goto("/track?id=245B1C8E");

    const waBtn = page.locator("[data-testid='contact-support-whatsapp-btn']");
    await expect(waBtn).toBeVisible();
    const href = await waBtn.getAttribute("href");
    expect(href).toContain("245B1C8E");
  });

  test("order lookup redirect page /order/[orderId] forwards to /track?id=[orderId]", async ({ page }) => {
    await setupTrackingRoutes(page);
    await page.goto("/order/245B1C8E");

    await page.waitForURL(/\/track\?id=245B1C8E/);
    await expect(page.locator("[data-testid='tracking-details-card']")).toBeVisible();
  });
});
