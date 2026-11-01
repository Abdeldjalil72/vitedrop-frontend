import { expect, test, type Page } from "@playwright/test";

const mockOrdersList = [
  {
    id: "ord-delivered-uuid-001",
    customerName: "Yacine Rahmani",
    customerPhone: "0555123456",
    wilaya: 16,
    commune: "Bab El Oued",
    address: "12 Rue Didouche Mourad",
    productId: "prod-cosmetic-01",
    productName: "Sérum Visage Éclat Bio",
    quantity: 2,
    supplierId: "sup-alger-distrib",
    supplierName: "Laboratoire Cosmétique Alger",
    affiliateId: "aff-dz-media-01",
    affiliateName: "DZ Performance Ads",
    status: "delivered",
    trackingNumber: "YAL-ALG-88392",
    courier: "Yalidine Express",
    cpaCommission: 1200,
    platformFee: 300,
    createdAt: "2026-10-08T09:30:00.000Z",
    updatedAt: "2026-10-08T14:15:00.000Z",
  },
  {
    id: "ord-intransit-uuid-002",
    customerName: "Samir Bouzid",
    customerPhone: "0661987654",
    wilaya: 31,
    commune: "Bir El Djir",
    address: "Cité USTO Bâtiment 4",
    productId: "prod-gadget-02",
    productName: "Écouteurs Sans Fil Pro",
    quantity: 1,
    supplierId: "sup-oran-tech",
    supplierName: "Oran Tech Import",
    affiliateId: "aff-west-buyer",
    affiliateName: "Wahran Media Buyer",
    status: "in_transit",
    trackingNumber: "YAL-ORN-12345",
    courier: "Yalidine Express",
    cpaCommission: 1500,
    platformFee: 375,
    createdAt: "2026-10-08T10:00:00.000Z",
    updatedAt: "2026-10-08T11:30:00.000Z",
  },
  {
    id: "ord-lead-uuid-003",
    customerName: "Meriem Ziani",
    customerPhone: "0770334455",
    wilaya: 9,
    commune: "Boufarik",
    address: "Rue de la Gare N° 8",
    productId: "prod-kitchen-03",
    productName: "Hachoir Électrique Multifonction",
    quantity: 1,
    supplierId: "sup-blida-appliances",
    supplierName: "Mitidja Électroménager",
    affiliateId: "aff-dz-media-01",
    affiliateName: "DZ Performance Ads",
    status: "lead_generated",
    trackingNumber: null,
    courier: null,
    cpaCommission: 1000,
    platformFee: 250,
    createdAt: "2026-10-08T11:45:00.000Z",
    updatedAt: "2026-10-08T11:45:00.000Z",
  },
];

const mockOrderDetail = {
  ...mockOrdersList[0],
  cancellationReason: null,
  utm_source: "facebook",
  utm_campaign: "cpa_skincare_alger_q4",
  click_id: "clk-fb-dz-9912048",
  fbclid: "fb.1.1728389123.AbCdEf123",
  events: [
    {
      id: "evt-01",
      fromStatus: null,
      toStatus: "lead_generated",
      triggerSource: "affiliate",
      reason: "Formulaire validé",
      metadata: { ip: "105.101.42.12" },
      createdAt: "2026-10-08T09:30:00.000Z",
    },
    {
      id: "evt-02",
      fromStatus: "lead_generated",
      toStatus: "supplier_confirmed",
      triggerSource: "supplier",
      reason: "Client confirmé par téléphone",
      metadata: { agent: "Amina Call Center" },
      createdAt: "2026-10-08T10:15:00.000Z",
    },
    {
      id: "evt-03",
      fromStatus: "supplier_confirmed",
      toStatus: "dispatched",
      triggerSource: "yalidine",
      reason: "Bordereau Yalidine généré",
      metadata: { tracking: "YAL-ALG-88392" },
      createdAt: "2026-10-08T11:00:00.000Z",
    },
    {
      id: "evt-04",
      fromStatus: "dispatched",
      toStatus: "delivered",
      triggerSource: "yalidine",
      reason: "Livraison effectuée et fonds encaissés",
      metadata: { cashCollected: 2400 },
      createdAt: "2026-10-08T14:15:00.000Z",
    },
  ],
  notes: [
    {
      id: "note-01",
      adminId: "admin-qa-uuid",
      note: "Commande prioritaire vérifiée conforme au stock.",
      createdAt: "2026-10-08T12:00:00.000Z",
    },
  ],
  transactions: [
    {
      id: "tx-sup-debit-01",
      walletId: "wal-sup-01",
      type: "SUPPLIER_DEBIT",
      amount: -1200,
      balanceAfter: 48800,
      createdAt: "2026-10-08T14:15:00.000Z",
    },
    {
      id: "tx-aff-credit-02",
      walletId: "wal-aff-01",
      type: "CPA_PAYOUT",
      amount: 960,
      balanceAfter: 24960,
      createdAt: "2026-10-08T14:15:00.000Z",
    },
    {
      id: "tx-plat-fee-03",
      walletId: "wal-plat-01",
      type: "PLATFORM_FEE",
      amount: 240,
      balanceAfter: 1280240,
      createdAt: "2026-10-08T14:15:00.000Z",
    },
  ],
  inventoryMovements: [
    {
      id: "inv-mov-01",
      movementType: "OUTBOUND_DISPATCH",
      quantity: -2,
      reference: "ord-delivered-uuid-001",
      createdAt: "2026-10-08T11:00:00.000Z",
    },
  ],
};

function createAdminToken(): string {
  const payload = {
    sub: "admin-qa-uuid",
    email: "admin@vitedrop.com",
    role: "ADMIN",
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `header.${base64Payload}.signature`;
}

async function setupAdminOrdersSession(
  page: Page,
  targetPath: string = "/admin/orders",
  lang: "fr" | "ar" | "en" = "fr"
): Promise<void> {
  const apiBase = "http://localhost:4000";

  await page.route(new RegExp(`^${apiBase}/admin/orders`), async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Check detail routes first
    if (url.includes("/notes") && method === "POST") {
      const body = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          note: {
            id: "note-new-uuid",
            adminId: "admin-qa-uuid",
            note: body.note,
            createdAt: new Date().toISOString(),
          },
        }),
      });
      return;
    }

    if (url.includes("/reprocess-webhook") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Webhook Yalidine rejoué avec succès.",
        }),
      });
      return;
    }

    if (url.includes("/reconcile-settlement") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Écritures comptables régularisées.",
        }),
      });
      return;
    }

    // Detail page request
    if (url.includes("ord-delivered-uuid-001")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockOrderDetail),
      });
      return;
    }

    // Collection GET
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: mockOrdersList,
          total: mockOrdersList.length,
          page: 1,
          limit: 20,
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.route(`${apiBase}/admin/stats*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ platformRevenue: 1280000, totalOrders: 158 }),
    });
  });

  // Inject token and language into localStorage before scripts run
  await page.addInitScript(
    ({ token, selectedLang }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", selectedLang);
    },
    { token: createAdminToken(), selectedLang: lang }
  );

  await page.goto(targetPath);
  await page.waitForSelector('[data-dashboard-role="admin"]', { timeout: 30000 });
}

test.describe("Admin Order Supervision Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("renders desktop orders table with official Wilaya lookup, LTR phones, and dual identities", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupAdminOrdersSession(page, "/admin/orders", "fr");

    // Header validation
    await expect(page.getByRole("heading", { name: /Gestion & Suivi des Commandes/i })).toBeVisible();

    // Verify row counts and test-ids
    const rows = page.locator('[data-testid="admin-order-row"]');
    await expect(rows).toHaveCount(3);

    // Verify 1st row: Yacine Rahmani in Wilaya 16 (Alger)
    const row1 = rows.first();
    await expect(row1).toContainText("Yacine Rahmani");
    await expect(row1).toContainText("16 - Alger");
    await expect(row1).toContainText("Bab El Oued");

    // Verify customer phone in LTR
    const phoneElement = row1.locator('span[dir="ltr"]');
    await expect(phoneElement).toBeVisible();
    await expect(phoneElement).toContainText("0555123456");

    // Verify dual identity capsules
    await expect(row1.locator("text=Laboratoire Cosmétique Alger")).toBeVisible();
    await expect(row1.locator("text=DZ Performance Ads")).toBeVisible();

    // Verify tracking number and 1-click clipboard copy
    await expect(row1.locator("text=YAL-ALG-88392")).toBeVisible();
    const copyTrackingBtn = row1.locator('button[title="Copier le numéro de suivi"]');
    await copyTrackingBtn.click();
    await expect(row1.locator("svg.text-emerald-600")).toBeVisible();

    // Verify Bordereau button opens waybill modal
    const bordereauBtn = row1.getByRole("button", { name: /Bordereau/i });
    await expect(bordereauBtn).toBeVisible();
    await bordereauBtn.click();

    // Modal verification
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal.locator("#waybill-modal-title")).toContainText("Bordereau d'Expédition Officiel");
    await expect(modal.locator("text=YAL-ALG-88392")).toBeVisible();
    await expect(modal.locator("text=Yalidine Express").first()).toBeVisible();

    // Close modal via Escape
    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);
  });

  test("mobile card parity at 390px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAdminOrdersSession(page, "/admin/orders", "fr");

    // Mobile cards should be rendered
    const cards = page.locator('[data-testid="admin-order-card"]');
    await expect(cards).toHaveCount(3);

    const firstCard = cards.first();
    await expect(firstCard).toContainText("Yacine Rahmani");
    await expect(firstCard).toContainText("16 - Alger");
    await expect(firstCard.locator('span[dir="ltr"]')).toContainText("0555123456");
    await expect(firstCard.locator("text=Laboratoire Cosmétique Alger")).toBeVisible();
    await expect(firstCard.locator("text=DZ Performance Ads")).toBeVisible();
    await expect(firstCard.locator("text=YAL-ALG-88392")).toBeVisible();

    // Check Bordereau button on mobile
    const bordereauBtn = firstCard.getByRole("button", { name: /Bordereau/i });
    await expect(bordereauBtn).toBeVisible();
    await bordereauBtn.click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await modal.getByRole("button", { name: "Fermer" }).last().click();
    await expect(modal).toHaveCount(0);
  });

  test("order detail page: dual identities, financial ledger breakdown, waybill, and operational notes", async ({
    page,
  }) => {
    await setupAdminOrdersSession(page, "/admin/orders/ord-delivered-uuid-001", "fr");

    // Title & Status
    await expect(page.locator("h1")).toContainText("#ord-delivered-uuid-001");
    await expect(page.locator("text=LIVRÉ").first()).toBeVisible();

    // Customer & Logistics details
    await expect(page.locator("text=16 - Alger")).toBeVisible();
    await expect(page.locator('span[dir="ltr"]').first()).toContainText("0555123456");
    await expect(page.locator("text=YAL-ALG-88392").first()).toBeVisible();

    // Dual identities
    await expect(page.locator("text=Laboratoire Cosmétique Alger")).toBeVisible();
    await expect(page.locator("text=DZ Performance Ads")).toBeVisible();

    // Double-entry financial breakdown
    await expect(page.locator("text=Débit Fournisseur (Brut)")).toBeVisible();
    await expect(page.locator("text=Gain Affilié (Net)")).toBeVisible();
    await expect(page.locator("text=Frais Plateforme (ViteDrop)")).toBeVisible();
    await expect(page.locator("table").locator("text=SUPPLIER_DEBIT")).toBeVisible();
    await expect(page.locator("table").locator("text=CPA_PAYOUT")).toBeVisible();
    await expect(page.locator("table").locator("text=PLATFORM_FEE")).toBeVisible();

    // Add administrative note
    const noteInput = page.getByPlaceholder(/Ajouter une note/i);
    await noteInput.fill("Audit vérifié: livraison confirmée par Yalidine Hub Alger.");
    await page.getByRole("button", { name: "Ajouter" }).click();

    // Success feedback
    await expect(page.locator('div[role="status"]')).toContainText(
      "Note administrative ajoutée avec succès"
    );

    // Replay Webhook button
    await page.getByRole("button", { name: "Rejouer Webhook" }).click();
    await expect(page.locator('div[role="status"]')).toContainText(
      "Webhook Yalidine rejoué avec succès"
    );

    // Open Waybill Modal from Detail page
    await page.getByRole("button", { name: /Bordereau Yalidine/i }).click();
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator("text=Yalidine Express").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);
  });

  test("Arabic RTL parity across orders list, phone LTR security, and waybill modal", async ({
    page,
  }) => {
    await setupAdminOrdersSession(page, "/admin/orders", "ar");

    // RTL direction
    await expect(page.locator('[dir="rtl"]')).toBeVisible();

    // Arabic title
    await expect(
      page.getByRole("heading", { name: /إدارة الطلبيات والمتابعة اللوجستية/i })
    ).toBeVisible();

    // Wilaya in Arabic
    const firstRow = page.locator('[data-testid="admin-order-row"]').first();
    await expect(firstRow).toContainText("16 - الجزائر");

    // Phone number MUST remain LTR inside Arabic UI
    const phoneSpan = firstRow.locator('span[dir="ltr"]');
    await expect(phoneSpan).toBeVisible();
    await expect(phoneSpan).toContainText("0555123456");

    // Open Arabic Waybill modal
    await firstRow.getByRole("button", { name: "بوليصة" }).click();
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator("#waybill-modal-title")).toContainText("بوليصة الشحن الرسمية");
    await expect(modal.locator("text=الجزائر")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);
  });

  test("viewport stability: zero horizontal overflow across 390px, 768px, and 1440px", async ({
    page,
  }) => {
    await setupAdminOrdersSession(page, "/admin/orders", "fr");

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
          )
        )
        .toBe(true);
    }
  });

  test("modern animated dropdowns: status selection with semantic badge and quick dismissal chip", async ({
    page,
  }) => {
    await setupAdminOrdersSession(page, "/admin/orders", "fr");

    // Locate status dropdown trigger
    const statusSelect = page.locator('[data-testid="admin-orders-status-select"]');
    await expect(statusSelect).toBeVisible();
    await expect(statusSelect).toContainText("Tous les statuts");

    // Open dropdown
    await statusSelect.click();

    // Verify option list with badges
    const inTransitOption = page.locator(
      '[data-testid="admin-orders-status-select-option-in_transit"]'
    );
    await expect(inTransitOption).toBeVisible();
    await expect(inTransitOption).toContainText("En Transit (Yalidine)");

    // Select in_transit
    await inTransitOption.click();

    // Verify trigger updated with badge and text
    await expect(statusSelect).toContainText("TRANSIT");
    await expect(statusSelect).toContainText("En Transit (Yalidine)");

    // Verify active filter chip appeared
    const statusChip = page.locator('[data-testid="chip-status"]');
    await expect(statusChip).toBeVisible();
    await expect(statusChip).toContainText("En Transit (Yalidine)");

    // Verify active count badge
    const countBadge = page.locator('[data-testid="active-filters-count-badge"]');
    await expect(countBadge).toBeVisible();
    await expect(countBadge).toContainText("1 filtre actif");

    // Dismiss chip via its X button
    await statusChip.locator("button").click();
    await expect(statusChip).toHaveCount(0);
    await expect(statusSelect).toContainText("Tous les statuts");
  });

  test("modern searchable wilaya dropdown: searches by code/name, selects option, and resets via header action", async ({
    page,
  }) => {
    await setupAdminOrdersSession(page, "/admin/orders", "fr");

    // Locate wilaya dropdown trigger
    const wilayaSelect = page.locator('[data-testid="admin-orders-wilaya-select"]');
    await expect(wilayaSelect).toBeVisible();
    await expect(wilayaSelect).toContainText("Toutes les wilayas (58)");

    // Open dropdown
    await wilayaSelect.click();

    // Search input should be present inside the dropdown popover
    const searchInput = page.getByPlaceholder(/Rechercher wilaya/i);
    await expect(searchInput).toBeVisible();

    // Search for "16" (Alger)
    await searchInput.fill("16");

    // Option for Alger should be visible
    const algerOption = page.locator(
      '[data-testid="admin-orders-wilaya-select-option-16"]'
    );
    await expect(algerOption).toBeVisible();
    await expect(algerOption).toContainText("16 - Alger");

    // Select Alger
    await algerOption.click();

    // Verify trigger updated with #16 badge
    await expect(wilayaSelect).toContainText("#16");
    await expect(wilayaSelect).toContainText("16 - Alger");

    // Verify active filter chip
    const wilayaChip = page.locator('[data-testid="chip-wilaya"]');
    await expect(wilayaChip).toBeVisible();
    await expect(wilayaChip).toContainText("16 - Alger");

    // Reset via header reset button
    const resetBtn = page.locator('[data-testid="reset-order-filters-btn"]');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Verify filters are reset
    await expect(wilayaSelect).toContainText("Toutes les wilayas (58)");
    await expect(wilayaChip).toHaveCount(0);
  });
});

