import { expect, test, type Page } from "@playwright/test";

const mockProductsList = [
  {
    id: "prod-cosmetic-01",
    name: "Sérum Visage Éclat Bio",
    description: "Sérum hydratant à l'acide hyaluronique certifié.",
    retailPrice: 3500,
    supplierTotalCpa: 1200,
    affiliateNetPayout: 960,
    platformFee: 240,
    stock: 50,
    reservedStock: 4,
    status: "active",
    supplierId: "sup-alger-01",
    supplierName: "Laboratoire Cosmétique Alger",
    escrowCoverage: 12,
    createdAt: "2026-10-08T08:00:00.000Z",
  },
  {
    id: "prod-suspended-02",
    name: "Pack Huile d'Argan Pure",
    description: "Huile végétale 100% naturelle première pression.",
    retailPrice: 2800,
    supplierTotalCpa: 800,
    affiliateNetPayout: 640,
    platformFee: 160,
    stock: 15,
    reservedStock: 0,
    status: "suspended",
    supplierId: "sup-atlas-02",
    supplierName: "Atlas Bio DZ",
    escrowCoverage: 3,
    createdAt: "2026-10-07T14:30:00.000Z",
  },
  {
    id: "prod-stockout-03",
    name: "Montre Connectée Fitness",
    description: "Montre cardio étanche multi-sports.",
    retailPrice: 4200,
    supplierTotalCpa: 1000,
    affiliateNetPayout: 800,
    platformFee: 200,
    stock: 0,
    reservedStock: 0,
    status: "out_of_stock",
    supplierId: "sup-tech-03",
    supplierName: "Import Tech Oran",
    escrowCoverage: 8,
    createdAt: "2026-10-06T10:15:00.000Z",
  },
];

const mockProductPerformance = {
  deliveryRate: 68.5,
  deliveredOrders: 89,
  totalOrders: 130,
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

async function setupAdminProductsSession(
  page: Page,
  targetPath: string = "/admin/products",
  lang: "fr" | "ar" | "en" = "fr"
): Promise<void> {
  const apiBase = "http://localhost:4000";

  await page.route(new RegExp(`^${apiBase}/admin/products`), async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Status PATCH mutation
    if (url.includes("/status") && method === "PATCH") {
      const body = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockProductsList[0],
          status: body.status,
        }),
      });
      return;
    }

    // Performance GET
    if (url.includes("/performance")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProductPerformance),
      });
      return;
    }

    // Detail GET
    if (url.includes("prod-cosmetic-01")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProductsList[0]),
      });
      return;
    }

    // Collection GET
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: mockProductsList,
          total: mockProductsList.length,
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

  await page.route(new RegExp(`^${apiBase}/wallets?/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "wal-admin-qa",
        userId: "admin-qa-uuid",
        balance: 50000,
        currency: "DZD",
        ownerType: "ADMIN",
      }),
    });
  });

  // Inject token and language into localStorage before page initialization
  await page.addInitScript(
    ({ token, selectedLang }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", selectedLang);
    },
    { token: createAdminToken(), selectedLang: lang }
  );

  await page.goto(targetPath);
  await page.waitForSelector('[data-dashboard-role]', { timeout: 30000 });
}

test.describe("Admin Product Supervision Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("renders desktop products table with status badges, price/CPA split, and copy triggers", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupAdminProductsSession(page, "/admin/products", "fr");

    // Header validation
    await expect(page.getByRole("heading", { name: /Supervision des Produits & Stock/i })).toBeVisible();

    // Table rows
    const rows = page.locator('[data-testid="admin-product-row"]');
    await expect(rows).toHaveCount(3);

    // Verify row 1: Sérum Visage Éclat Bio
    const row1 = rows.first();
    await expect(row1).toContainText("Sérum Visage Éclat Bio");
    await expect(row1).toContainText("Laboratoire Cosmétique Alger");
    await expect(row1).toContainText("3 500 DZD");
    await expect(row1).toContainText("1 200 DZD");
    await expect(row1).toContainText("50");
    await expect(row1.locator("text=Actif")).toBeVisible();

    // Test 1-click clipboard copy on product ID
    const copyBtn = row1.locator('button[title="Copier ID"]');
    await copyBtn.click();
    await expect(row1.locator("svg.text-emerald-600")).toBeVisible();

    // Verify operational actions exist (Suspend button on active product)
    const suspendBtn = row1.getByRole("button", { name: /Suspendre/i });
    await expect(suspendBtn).toBeVisible();
  });

  test("mobile card parity at 390px viewport with copy trigger", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAdminProductsSession(page, "/admin/products", "fr");

    // Mobile cards
    const cards = page.locator('[data-testid="admin-product-card"]');
    await expect(cards).toHaveCount(3);

    const firstCard = cards.first();
    await expect(firstCard).toContainText("Sérum Visage Éclat Bio");
    await expect(firstCard).toContainText("3 500 DZD");
    await expect(firstCard).toContainText("1 200 DZD");
    await expect(firstCard).toContainText("50");
    await expect(firstCard.locator("text=Actif")).toBeVisible();

    // Verify copy button exists on mobile card
    const copyBtn = firstCard.locator('button[title="Copier ID"]');
    await expect(copyBtn).toBeVisible();
  });

  test("product detail page: performance KPIs and clean product layout without solvency card or fee subtext", async ({
    page,
  }) => {
    await setupAdminProductsSession(page, "/admin/products/prod-cosmetic-01", "fr");

    // Header & Name
    await expect(page.locator("h1")).toContainText("Sérum Visage Éclat Bio");
    await expect(page.locator("text=ACTIVE").first()).toBeVisible();

    // Performance rate with 1 decimal precision
    await expect(page.locator("text=68.5%")).toBeVisible();
    await expect(page.locator("text=89 / 130 livrées")).toBeVisible();

    // Verify Solvency Invariants Card is removed
    await expect(page.locator("text=Audit de Solvabilité Escrow & Invariants")).toHaveCount(0);

    // Verify fee subtext (Aff: / Fee:) is removed
    await expect(page.locator("text=Fee:")).toHaveCount(0);
  });

  test("operational status modal flow with WCAG accessibility and mandatory reason validation", async ({
    page,
  }) => {
    await setupAdminProductsSession(page, "/admin/products/prod-cosmetic-01", "fr");

    // Click Suspendre Produit
    await page.getByRole("button", { name: "Suspendre Produit" }).click();

    // Modal accessibility attributes
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal.locator("#product-status-modal-title")).toContainText(
      "Suspendre Opérationnellement"
    );

    // Attempt submit without reason -> must be rejected with role="alert"
    await modal.getByRole("button", { name: "Confirmer" }).click();
    const alert = modal.locator('div[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Le motif de suspension est obligatoire");

    // Dismiss modal via Escape key
    await page.keyboard.press("Escape");
    await expect(modal).toHaveCount(0);

    // Re-open modal and submit with reason
    await page.getByRole("button", { name: "Suspendre Produit" }).click();
    await modal.getByPlaceholder(/Ex: Taux de retour/i).fill("Rupture de stock fournisseur non déclarée.");
    await modal.getByRole("button", { name: "Confirmer" }).click();

    // Modal closes
    await expect(modal).toHaveCount(0);
  });

  test("Arabic RTL parity across product catalog and solvency verification", async ({
    page,
  }) => {
    await setupAdminProductsSession(page, "/admin/products", "ar");

    // RTL direction
    await expect(page.locator('[dir="rtl"]')).toBeVisible();

    // Arabic title
    await expect(
      page.getByRole("heading", { name: /إدارة وتراخيص المنتجات/i })
    ).toBeVisible();

    // Row status in Arabic
    const firstRow = page.locator('[data-testid="admin-product-row"]').first();
    await expect(firstRow.locator("text=نشط")).toBeVisible();

    // Open detail page in Arabic
    await setupAdminProductsSession(page, "/admin/products/prod-cosmetic-01", "ar");
    await expect(page.locator('[dir="rtl"]')).toBeVisible();
    await expect(page.locator("h1")).toContainText("Sérum Visage Éclat Bio");
  });

  test("viewport stability: zero horizontal overflow across 390px, 768px, and 1440px", async ({
    page,
  }) => {
    await setupAdminProductsSession(page, "/admin/products", "fr");

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

  test("admin supervision page does not contain supplier product creation button", async ({
    page,
  }) => {
    await setupAdminProductsSession(page, "/admin/products", "fr");

    const createProductBtn = page.locator('[data-testid="admin-create-product-btn"]');
    await expect(createProductBtn).toHaveCount(0);
  });

  test("admin can navigate to /supplier/products/new without security errors and with solvency backing", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await setupAdminProductsSession(page, "/supplier/products/new?from=admin", "fr");

    await expect(page.locator('[data-testid="new-product-page-container"]')).toBeVisible();

    // Confirm zero security role access denied errors
    const securityErrors = consoleErrors.filter((err) =>
      err.includes("ViteDrop CPA Network Security: Access denied")
    );
    expect(securityErrors).toHaveLength(0);

    // Verify solvency balance is rendered
    await expect(page.locator("body")).toContainText(/50\s*000|1\s*890\s*000/);
  });
});
