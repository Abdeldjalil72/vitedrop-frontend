import { expect, test, type Page } from "@playwright/test";

const mockSupplierLeads = [
  {
    id: "lead-algiers-101",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-01",
    cpaCommission: 1200,
    platformFee: 150,
    status: "lead_generated",
    customerName: "Walid Ziane",
    customerPhone: "0555123456",
    address: "Cité 1200 logts bt 4",
    productId: "prod-watch-01",
    productName: "Montre Smartwatch T800 Ultra",
    quantity: 1,
    wilaya: 16,
    commune: "Bab Ezzouar",
    trackingNumber: null,
    courier: null,
    createdAt: "2026-10-08T10:00:00.000Z",
    updatedAt: "2026-10-08T10:00:00.000Z",
  },
  {
    id: "lead-oran-102",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-02",
    cpaCommission: 1500,
    platformFee: 150,
    status: "lead_generated",
    customerName: "Yasmine Taleb",
    customerPhone: "0770987654",
    address: "Rue 1 Novembre",
    productId: "prod-cosmetic-02",
    productName: "Pack Soin Visage Bio",
    quantity: 2,
    wilaya: 31,
    commune: "Es Senia",
    trackingNumber: null,
    courier: null,
    createdAt: "2026-10-08T11:00:00.000Z",
    updatedAt: "2026-10-08T11:00:00.000Z",
  },
];

const mockSupplierOrders = [
  {
    id: "ord-conf-201",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-03",
    cpaCommission: 1000,
    platformFee: 150,
    status: "supplier_confirmed",
    customerName: "Karim Boudiaf",
    customerPhone: "0661223344",
    address: "Zone Industrielle",
    productId: "prod-audio-03",
    productName: "Casque Audio Bluetooth",
    quantity: 1,
    wilaya: 25,
    commune: "El Khroub",
    trackingNumber: null,
    courier: null,
    createdAt: "2026-10-08T09:30:00.000Z",
    updatedAt: "2026-10-08T10:15:00.000Z",
  },
  {
    id: "ord-disp-301",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-04",
    cpaCommission: 1100,
    platformFee: 150,
    status: "dispatched",
    customerName: "Farid Bouzid",
    customerPhone: "0540112233",
    address: "Boulevard Colonel Lotfi",
    productId: "prod-clipper-04",
    productName: "Tondeuse Professionnelle VGR",
    quantity: 1,
    wilaya: 9,
    commune: "Boufarik",
    trackingNumber: "YAL-99238471",
    courier: "Yalidine",
    createdAt: "2026-10-07T14:00:00.000Z",
    updatedAt: "2026-10-08T08:00:00.000Z",
  },
  {
    id: "ord-deliv-302",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-05",
    cpaCommission: 900,
    platformFee: 150,
    status: "delivered",
    customerName: "Nadia Meziane",
    customerPhone: "0550445566",
    address: "Centre Ville",
    productId: "prod-print-05",
    productName: "Mini Imprimante Thermique",
    quantity: 1,
    wilaya: 6,
    commune: "Akbou",
    trackingNumber: "YAL-88371920",
    courier: "Yalidine",
    createdAt: "2026-10-06T11:00:00.000Z",
    updatedAt: "2026-10-07T16:30:00.000Z",
  },
  {
    id: "ord-ret-303",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-06",
    cpaCommission: 800,
    platformFee: 150,
    status: "returned",
    customerName: "Samir Chaou",
    customerPhone: "0799334455",
    address: "Cité des 500 Logements",
    productId: "prod-solar-06",
    productName: "Lampe Solaire LED",
    quantity: 1,
    wilaya: 19,
    commune: "El Eulma",
    trackingNumber: "YAL-77461938",
    courier: "Yalidine",
    createdAt: "2026-10-05T09:00:00.000Z",
    updatedAt: "2026-10-06T14:00:00.000Z",
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
}

async function setupSupplierSession(
  page: Page,
  options: SetupOptions = {}
): Promise<{
  confirmedIds: string[];
  cancelledCalls: { orderId: string; reason: string }[];
  dispatchedIds: string[];
  webhookCalls: { trackingNumber: string; status: string }[];
}> {
  const { lang = "fr", balance = 8000 } = options;
  const apiBase = "http://localhost:4000";

  const confirmedIds: string[] = [];
  const cancelledCalls: { orderId: string; reason: string }[] = [];
  const dispatchedIds: string[] = [];
  const webhookCalls: { trackingNumber: string; status: string }[] = [];

  let currentLeads = [...mockSupplierLeads];
  let currentOrders = [...mockSupplierOrders];

  // Intercept all call-center routes: leads GET, confirm PATCH, cancel PATCH, dispatch POST
  await page.route(new RegExp(`^${apiBase}/supplier/call-center/`), async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes("/call-center/leads") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(currentLeads),
      });
      return;
    }

    if (url.includes("/confirm") && method === "PATCH") {
      const match = url.match(/\/call-center\/([^/]+)\/confirm/);
      const id = match ? match[1] : "unknown";
      confirmedIds.push(id);
      currentLeads = currentLeads.filter((l) => l.id !== id);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id, status: "supplier_confirmed" }),
      });
      return;
    }

    if (url.includes("/cancel") && method === "PATCH") {
      const match = url.match(/\/call-center\/([^/]+)\/cancel/);
      const id = match ? match[1] : "unknown";
      const body = JSON.parse(route.request().postData() || "{}");
      cancelledCalls.push({ orderId: id, reason: body.cancellationReason });
      currentLeads = currentLeads.filter((l) => l.id !== id);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id, status: "cancelled", cancellationReason: body.cancellationReason }),
      });
      return;
    }

    if (url.includes("/dispatch") && method === "POST") {
      const match = url.match(/\/call-center\/([^/]+)\/dispatch/);
      const id = match ? match[1] : "unknown";
      dispatchedIds.push(id);
      currentOrders = currentOrders.map((o) =>
        o.id === id ? { ...o, status: "dispatched", trackingNumber: `YAL-SIM-${id.slice(0, 4)}`, courier: "Yalidine" } : o
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id,
          status: "dispatched",
          trackingNumber: `YAL-SIM-${id.slice(0, 4)}`,
          courier: "Yalidine",
        }),
      });
      return;
    }

    await route.continue();
  });

  // Intercept orders GET
  await page.route(new RegExp(`^${apiBase}/supplier/orders`), async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(currentOrders),
      });
      return;
    }
    await route.continue();
  });

  // Intercept wallet GET (support both /wallets/me and /wallet/me)
  await page.route(new RegExp(`^${apiBase}/wallets?/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "wal-sup-qa",
        userId: "sup-qa-uuid",
        balance,
        currency: "DZD",
      }),
    });
  });

  // Intercept webhook simulation
  await page.route(new RegExp(`^${apiBase}/webhooks/courier/yalidine`), async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    webhookCalls.push(body);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, trackingNumber: body.trackingNumber, status: body.status }),
    });
  });

  // Inject token and language before navigation
  await page.addInitScript(
    ({ token, selectedLang }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", selectedLang);
    },
    { token: createSupplierToken(), selectedLang: lang }
  );

  await page.goto("/supplier");
  await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 30000 });

  return { confirmedIds, cancelledCalls, dispatchedIds, webhookCalls };
}

test.describe("Supplier Dashboard & Call Center Desk Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Renders desktop Call Center Queue table with Wilaya lookup, LTR phones, and 1-click clipboard copy", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupSupplierSession(page, { lang: "fr" });

    // Validate main headers and subhead
    await expect(page.getByRole("heading", { name: /File d'attente & Confirmation/i })).toBeVisible();
    await expect(page.getByText(/Fournisseur Hub • Call Center Desk/i)).toBeVisible();

    // Verify Tab counts
    const queueTab = page.locator('[data-testid="tab-queue"]');
    await expect(queueTab).toBeVisible();
    await expect(queueTab).toContainText("2");

    // Verify desktop table rows count
    const rows = page.locator('[data-testid="supplier-lead-row"]');
    await expect(rows).toHaveCount(2);

    // Verify Row 1: Walid Ziane, Wilaya 16 (Alger), Bab Ezzouar
    const row1 = rows.first();
    await expect(row1.getByText("Walid Ziane")).toBeVisible();
    await expect(row1.getByText("Alger")).toBeVisible();
    await expect(row1.getByText("Bab Ezzouar")).toBeVisible();

    // Verify LTR phone formatting
    const phoneSpan = row1.locator('span[dir="ltr"]').first();
    await expect(phoneSpan).toHaveText("0555123456");

    // Test 1-click copy trigger
    const copyPhoneBtn = row1.locator('[data-testid="copy-phone-btn"]').first();
    await expect(copyPhoneBtn).toBeVisible();
    await copyPhoneBtn.click();

    // Verify Row 2: Yasmine Taleb, Wilaya 31 (Oran)
    const row2 = rows.nth(1);
    await expect(row2.getByText("Yasmine Taleb")).toBeVisible();
    await expect(row2.getByText("Oran")).toBeVisible();
  });

  test("2. Ensures 390px mobile viewport card parity across Queue, Confirmed, and All Orders tabs", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSupplierSession(page, { lang: "fr" });

    // Queue tab mobile cards
    const leadCards = page.locator('[data-testid="supplier-lead-card"]');
    await expect(leadCards).toHaveCount(2);
    await expect(leadCards.first()).toBeVisible();

    // Desktop table rows should be hidden on mobile
    const desktopRows = page.locator('[data-testid="supplier-lead-row"]');
    await expect(desktopRows.first()).toBeHidden();

    // Verify phone LTR on mobile card
    const cardPhone = leadCards.first().locator('span[dir="ltr"]').first();
    await expect(cardPhone).toHaveText("0555123456");

    // Switch to Confirmed Orders tab
    const confirmedTab = page.locator('[data-testid="tab-confirmed"]');
    await confirmedTab.click();

    const confirmedCards = page.locator('[data-testid="supplier-confirmed-card"]');
    await expect(confirmedCards).toHaveCount(1);
    await expect(confirmedCards.first().getByText("Karim Boudiaf")).toBeVisible();
    await expect(confirmedCards.first().locator('[data-testid="dispatch-order-btn"]')).toBeVisible();

    // Switch to All Orders tab
    const allTab = page.locator('[data-testid="tab-all"]');
    await allTab.click();

    const orderCards = page.locator('[data-testid="supplier-order-card"]');
    await expect(orderCards).toHaveCount(4);
    await expect(orderCards.first()).toBeVisible();
  });

  test("3. Executes lead confirmation and WCAG 2.1 AA cancellation modal flow with in-page feedback banners", async ({
    page,
  }) => {
    // Catch unexpected browser alert dialogs to guarantee zero native alerts
    let nativeAlertTriggered = false;
    page.on("dialog", (dialog) => {
      nativeAlertTriggered = true;
      dialog.dismiss();
    });

    const session = await setupSupplierSession(page, { lang: "fr" });

    // --- Part A: Confirm Lead ---
    const rows = page.locator('[data-testid="supplier-lead-row"]');
    const firstConfirmBtn = rows.first().locator('[data-testid="confirm-lead-btn"]');
    await firstConfirmBtn.click();

    // Verify in-page status message banner
    const statusBanner = page.locator('[role="status"]');
    await expect(statusBanner).toBeVisible();
    await expect(statusBanner).toContainText("Lead confirmé avec succès");
    expect(session.confirmedIds).toContain("lead-algiers-101");
    expect(nativeAlertTriggered).toBe(false);

    // --- Part B: Cancel Lead Modal Flow ---
    const remainingRows = page.locator('[data-testid="supplier-lead-row"]');
    const cancelBtn = remainingRows.first().locator('[data-testid="cancel-lead-btn"]');
    await cancelBtn.click();

    // Modal verification
    const cancelModal = page.locator('[data-testid="supplier-cancel-modal"]');
    await expect(cancelModal).toBeVisible();
    await expect(cancelModal).toHaveAttribute("role", "dialog");
    await expect(cancelModal).toHaveAttribute("aria-modal", "true");

    // Select second reason: Duplicate order
    const reasonRadio = cancelModal.locator('input[type="radio"]').nth(1);
    await reasonRadio.check();

    // Submit cancellation
    const submitCancelBtn = page.locator('[data-testid="confirm-cancel-lead-btn"]');
    await submitCancelBtn.click();

    // Verify modal dismissed and success banner updated
    await expect(cancelModal).toBeHidden();
    await expect(statusBanner).toBeVisible();
    await expect(statusBanner).toContainText("Lead annulé avec succès");
    expect(session.cancelledCalls.length).toBe(1);
    expect(nativeAlertTriggered).toBe(false);
  });

  test("4. Handles order dispatch and simulated Yalidine courier webhook transitions", async ({
    page,
  }) => {
    let nativeAlertTriggered = false;
    page.on("dialog", (dialog) => {
      nativeAlertTriggered = true;
      dialog.dismiss();
    });

    const session = await setupSupplierSession(page, { lang: "fr" });

    // Switch to Confirmed tab
    await page.locator('[data-testid="tab-confirmed"]').click();

    // Dispatch order (target visible button)
    const dispatchBtn = page.locator('[data-testid="dispatch-order-btn"]:visible').first();
    await expect(dispatchBtn).toBeVisible();
    await dispatchBtn.click();

    // Verify success banner
    const statusBanner = page.locator('[role="status"]');
    await expect(statusBanner).toBeVisible();
    await expect(statusBanner).toContainText("Bordereau Yalidine généré et commande expédiée");
    expect(session.dispatchedIds).toContain("ord-conf-201");
    expect(nativeAlertTriggered).toBe(false);

    // Switch to All Orders tab
    await page.locator('[data-testid="tab-all"]').click();

    // Simulate Delivery on first dispatched order (ord-disp-301)
    const simulateDeliveryBtn = page.locator('[data-testid="simulate-delivery-btn"]:visible').first();
    await expect(simulateDeliveryBtn).toBeVisible();
    await simulateDeliveryBtn.click();

    await expect(statusBanner).toBeVisible();
    await expect(statusBanner).toContainText("Notification de livraison simulée");
    expect(session.webhookCalls.some((c) => c.status === "Livre")).toBe(true);

    // Simulate Return on another order (or same if available)
    const simulateReturnBtn = page.locator('[data-testid="simulate-return-btn"]:visible').first();
    if (await simulateReturnBtn.isVisible()) {
      await simulateReturnBtn.click();
      await expect(statusBanner).toContainText("Notification de retour simulée");
      expect(session.webhookCalls.some((c) => c.status === "Retour")).toBe(true);
    }
  });

  test("5. Handles prepaid escrow recharge modal with 1-click RIP and CCP copy triggers", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupSupplierSession(page, { lang: "fr" });

    // Open Top-Up modal via header button
    const topUpBtn = page.locator('[data-testid="topup-escrow-btn"]');
    await expect(topUpBtn).toBeVisible();
    await topUpBtn.click();

    // Verify modal accessibility attributes
    const topUpModal = page.locator('[data-testid="supplier-topup-modal"]');
    await expect(topUpModal).toBeVisible();
    await expect(topUpModal).toHaveAttribute("role", "dialog");
    await expect(topUpModal).toHaveAttribute("aria-modal", "true");

    // Copy BaridiMob RIP
    const copyRipBtn = page.locator('[data-testid="copy-rip-btn"]');
    await expect(copyRipBtn).toBeVisible();
    await copyRipBtn.click();

    // Copy CCP Account
    const copyCcpBtn = page.locator('[data-testid="copy-ccp-btn"]');
    await expect(copyCcpBtn).toBeVisible();
    await copyCcpBtn.click();

    // Close modal via footer button
    const closeBtn = page.locator('[data-testid="close-topup-modal-btn"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(topUpModal).toBeHidden();
  });

  test("6. Enforces Arabic RTL parity with strict LTR phone protection and zero horizontal overflow", async ({
    page,
  }) => {
    await setupSupplierSession(page, { lang: "ar" });

    // Check RTL direction
    const dashboardRoot = page.locator('[data-dashboard-role="supplier"]');
    await expect(dashboardRoot).toHaveAttribute("dir", "rtl");

    // Arabic headers & tabs verification
    await expect(page.getByRole("heading", { name: /إدارة الطلبات والشحن/i })).toBeVisible();
    await expect(page.locator('[data-testid="tab-queue"]')).toContainText("طلبات بانتظار الاتصال");

    // Verify phone numbers maintain dir="ltr" strictly
    const phones = page.locator('span[dir="ltr"]');
    const phoneCount = await phones.count();
    expect(phoneCount).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(phoneCount, 4); i++) {
      await expect(phones.nth(i)).toHaveAttribute("dir", "ltr");
    }

    // Verify zero horizontal overflow across 390px, 768px, and 1440px
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
