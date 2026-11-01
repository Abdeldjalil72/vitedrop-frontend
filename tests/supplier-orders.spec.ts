import { expect, test, type Page } from "@playwright/test";

const mockOrders = [
  {
    id: "ord-conf-201",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-03",
    cpaCommission: 1000,
    platformFee: 250,
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
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "ord-disp-301",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-04",
    cpaCommission: 1100,
    platformFee: 275,
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
    courier: "YALIDINE",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "ord-deliv-302",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-05",
    cpaCommission: 900,
    platformFee: 225,
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
    courier: "YALIDINE",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "ord-rto-303",
    supplierId: "sup-qa-uuid",
    affiliateId: "aff-dz-06",
    cpaCommission: 800,
    platformFee: 200,
    status: "rto_in_transit",
    customerName: "Samir Chaou",
    customerPhone: "0799334455",
    address: "Cité des 500 Logements",
    productId: "prod-solar-06",
    productName: "Lampe Solaire LED",
    quantity: 1,
    wilaya: 19,
    commune: "El Eulma",
    trackingNumber: "YAL-77461938",
    courier: "YALIDINE",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
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
}

async function setupSupplierOrdersSession(
  page: Page,
  options: SetupOptions = {}
): Promise<{ dispatchedIds: string[]; webhookSimulations: any[] }> {
  const { lang = "fr" } = options;
  const apiBase = "http://localhost:4000";
  const dispatchedIds: string[] = [];
  const webhookSimulations: any[] = [];

  let ordersState = JSON.parse(JSON.stringify(mockOrders));

  // Intercept supplier orders GET
  await page.route(new RegExp(`^${apiBase}/supplier/orders`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ordersState),
    });
  });

  // Intercept dispatch order POST
  await page.route(new RegExp(`^${apiBase}/supplier/call-center/([^/]+)/dispatch`), async (route) => {
    const match = route.request().url().match(/call-center\/([^/]+)\/dispatch/);
    const orderId = match ? match[1] : "unknown";
    dispatchedIds.push(orderId);

    // Update in-memory state
    ordersState = ordersState.map((o: any) =>
      o.id === orderId
        ? {
            ...o,
            status: "dispatched",
            trackingNumber: "YAL-DISPATCHED-001",
            courier: "YALIDINE",
          }
        : o
    );

    const updatedOrder = ordersState.find((o: any) => o.id === orderId);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        updatedOrder || {
          id: orderId,
          success: true,
          orderId,
          trackingNumber: "YAL-DISPATCHED-001",
        }
      ),
    });
  });

  // Intercept webhook simulation POST
  await page.route(new RegExp(`^${apiBase}/webhooks/courier/yalidine`), async (route) => {
    const postData = JSON.parse(route.request().postData() || "{}");
    webhookSimulations.push(postData);

    const trackingNumber = postData.trackingNumber;
    const status = postData.status === "Livre" ? "delivered" : "rto_in_transit";

    ordersState = ordersState.map((o: any) =>
      o.trackingNumber === trackingNumber ? { ...o, status } : o
    );

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        trackingNumber,
        status,
      }),
    });
  });

  // Intercept wallet GET (support both /wallets/me and /wallet/me for Topbar)
  await page.route(new RegExp(`^${apiBase}/wallets?/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "wal-sup-qa",
        userId: "sup-qa-uuid",
        balance: 8000,
        currency: "DZD",
        ownerType: "SUPPLIER",
      }),
    });
  });

  // Inject token and language
  await page.addInitScript(
    ({ token, selectedLang }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", selectedLang);
    },
    { token: createSupplierToken(), selectedLang: lang }
  );

  await page.goto("/supplier/orders");
  await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 30000 });

  return { dispatchedIds, webhookSimulations };
}

test.describe("Supplier Dedicated Orders & Logistics Supervision Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Renders desktop Orders table with Space Mono CPA costs, StatusBadges, and 1-click clipboard triggers", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 1280, height: 800 });
    await setupSupplierOrdersSession(page);

    const table = page.locator('[data-testid="supplier-orders-table"]');
    await expect(table).toBeVisible();

    const rows = page.locator('[data-testid="supplier-orders-row"]');
    await expect(rows).toHaveCount(4);

    // Verify first row contains customer name, phone in dir="ltr", and Wilaya
    const firstRow = rows.first();
    await expect(firstRow).toContainText("Karim Boudiaf");
    await expect(firstRow).toContainText("0661223344");
    await expect(firstRow).toContainText("Constantine");

    // Verify Space Mono CPA formatting
    await expect(firstRow).toContainText("1 250 DZD");

    // Test clipboard copy trigger on dispatched order row
    const dispatchedRow = rows.filter({ hasText: "Farid Bouzid" });
    await expect(dispatchedRow).toBeVisible();
    const copyBtn = dispatchedRow.locator('[data-testid="copy-tracking-btn"]');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Check visual confirmation mark
    await expect(dispatchedRow.locator("text=✓")).toBeVisible();
  });

  test("2. Filters orders by search query, 58 Wilayas dropdown, and status tabs", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await setupSupplierOrdersSession(page);

    // Search filter
    const searchInput = page.locator('[data-testid="supplier-order-search"]');
    await searchInput.fill("Nadia");
    let rows = page.locator('[data-testid="supplier-orders-row"]');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Nadia Meziane");

    await searchInput.clear();
    await expect(page.locator('[data-testid="supplier-orders-row"]')).toHaveCount(4);

    // Wilaya filter
    const wilayaSelect = page.locator('[data-testid="supplier-wilaya-select"]');
    await wilayaSelect.selectOption("25"); // Constantine
    rows = page.locator('[data-testid="supplier-orders-row"]');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Karim Boudiaf");

    await wilayaSelect.selectOption("all");
    await expect(page.locator('[data-testid="supplier-orders-row"]')).toHaveCount(4);

    // Status tab filter
    const deliveredTab = page.locator('[data-testid="supplier-status-tab-delivered"]');
    await deliveredTab.click();
    rows = page.locator('[data-testid="supplier-orders-row"]');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Nadia Meziane");
  });

  test("3. Dispatches confirmed order and verifies in-page success feedback banner with zero native alerts", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const { dispatchedIds } = await setupSupplierOrdersSession(page);

    let nativeAlertFired = false;
    page.on("dialog", (dialog) => {
      nativeAlertFired = true;
      dialog.dismiss();
    });

    const confirmedRow = page
      .locator('[data-testid="supplier-orders-row"]')
      .filter({ hasText: "Karim Boudiaf" });
    const dispatchBtn = confirmedRow.locator('[data-testid="dispatch-order-btn"]');
    await expect(dispatchBtn).toBeVisible();
    await dispatchBtn.click();

    // Verify in-page feedback banner appears
    const banner = page.locator('[data-testid="supplier-action-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Bordereau Yalidine généré avec succès");

    // Zero native alerts
    expect(nativeAlertFired).toBe(false);
    expect(dispatchedIds).toContain("ord-conf-201");
  });

  test("4. Simulates courier delivery webhook and verifies status update and in-page feedback banner", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const { webhookSimulations } = await setupSupplierOrdersSession(page);

    const dispatchedRow = page
      .locator('[data-testid="supplier-orders-row"]')
      .filter({ hasText: "Farid Bouzid" });
    const simulateBtn = dispatchedRow.locator('[data-testid="simulate-delivery-btn"]');
    await expect(simulateBtn).toBeVisible();
    await simulateBtn.click();

    // Verify in-page feedback banner
    const banner = page.locator('[data-testid="supplier-action-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Webhook de livraison simulé avec succès");

    expect(webhookSimulations.length).toBeGreaterThan(0);
    expect(webhookSimulations[0].status).toBe("Livre");
  });

  test("5. Ensures 390px mobile viewport card parity with mobile copy trigger and dispatch button", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSupplierOrdersSession(page);

    // Desktop table must be hidden
    const table = page.locator('[data-testid="supplier-orders-table"]');
    await expect(table).not.toBeVisible();

    // Mobile cards must be visible
    const cards = page.locator('[data-testid="supplier-orders-card"]');
    await expect(cards).toHaveCount(4);

    const firstCard = cards.first();
    await expect(firstCard).toContainText("Karim Boudiaf");
    await expect(firstCard).toContainText("1 250 DZD");
    await expect(firstCard.locator('[data-testid="dispatch-order-btn-mobile"]')).toBeVisible();

    // Check dispatched card has copy trigger
    const dispatchedCard = cards.filter({ hasText: "Farid Bouzid" });
    await expect(dispatchedCard).toBeVisible();
    await expect(
      dispatchedCard.locator('[data-testid="copy-tracking-btn-mobile"]')
    ).toBeVisible();
    await expect(
      dispatchedCard.locator('[data-testid="simulate-delivery-btn-mobile"]')
    ).toBeVisible();
  });

  test("6. Enforces Arabic RTL parity, phone LTR protection, and zero horizontal overflow across 390px, 768px, and 1440px", async ({
    page,
  }) => {
    await setupSupplierOrdersSession(page, { lang: "ar" });

    // RTL verification
    const dashboardRoot = page.locator('[data-dashboard-role="supplier"]');
    await expect(dashboardRoot).toHaveAttribute("dir", "rtl");

    // Phone numbers strictly in dir="ltr"
    const ltrPhone = page.locator('[dir="ltr"]').first();
    await expect(ltrPhone).toBeVisible();

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

  test("7. Simulates courier RTO (Retour) webhook and verifies status transition and in-page feedback banner", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const { webhookSimulations } = await setupSupplierOrdersSession(page);

    const dispatchedRow = page
      .locator('[data-testid="supplier-orders-row"]')
      .filter({ hasText: "Farid Bouzid" });
    const returnBtn = dispatchedRow.locator('[data-testid="simulate-return-btn"]');
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();

    // Verify in-page feedback banner
    const banner = page.locator('[data-testid="supplier-action-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Simulation de retour (RTO) enregistrée avec succès");

    expect(webhookSimulations.length).toBeGreaterThan(0);
    const lastSimulation = webhookSimulations[webhookSimulations.length - 1];
    expect(lastSimulation.status).toBe("Retour");
    expect(lastSimulation.trackingNumber).toBe("YAL-99238471");
  });

  test("8. Opens realistic waybill document modal, checks tracking barcode, COD amount, and recipient data", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await setupSupplierOrdersSession(page);

    const deliveredRow = page
      .locator('[data-testid="supplier-orders-row"]')
      .filter({ hasText: "Nadia Meziane" });
    const waybillBtn = deliveredRow.locator('[data-testid="view-waybill-btn"]');
    await expect(waybillBtn).toBeVisible();
    await waybillBtn.click();

    // Verify Waybill modal opens
    const modal = page.locator('[data-testid="order-waybill-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("YAL-88371920");
    await expect(modal).toContainText("Nadia Meziane");
    await expect(modal).toContainText("Akbou");
    await expect(modal).toContainText("Paiement à la Livraison (COD)");

    // Print button is present
    await expect(modal.locator('[data-testid="waybill-print-btn"]')).toBeVisible();

    // Close modal via Escape key
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });
});

