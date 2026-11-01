import { expect, test, type Page } from "@playwright/test";

const mockSupplierProducts = [
  {
    id: "prod-earbuds-01",
    name: "Écouteurs Sans Fil Pro ANC",
    description: "Écouteurs sans fil avec réduction active du bruit",
    stock: 85,
    retailPrice: 4500,
    supplierTotalCpa: 1200,
    status: "active",
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "prod-watch-02",
    name: "Montre Connectée Sport Pulse",
    description: "Montre cardio étanche IP68",
    stock: 12, // < 20 => out of stock / stock faible
    retailPrice: 6200,
    supplierTotalCpa: 1500,
    status: "out_of_stock",
    createdAt: "2026-10-02T12:00:00.000Z",
  },
  {
    id: "prod-speaker-03",
    name: "Enceinte Nomade BassBox",
    description: "Son 360 stéréo waterproof",
    stock: 45,
    retailPrice: 3800,
    supplierTotalCpa: 900,
    status: "active",
    createdAt: "2026-10-03T14:00:00.000Z",
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
  initialProducts?: typeof mockSupplierProducts;
}

async function setupSupplierProductsSession(
  page: Page,
  options: SetupOptions = {}
): Promise<{
  createdProducts: any[];
}> {
  const { lang = "fr", balance = 8000, initialProducts = mockSupplierProducts } = options;
  const apiBase = "http://localhost:4000";

  const createdProducts: any[] = [];
  let currentProducts = [...initialProducts];

  // Intercept supplier products GET & POST
  await page.route(new RegExp(`^${apiBase}/supplier/products`), async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(currentProducts),
      });
      return;
    }

    if (method === "POST") {
      const body = JSON.parse(route.request().postData() || "{}");
      const newProd = {
        id: `prod-new-${Date.now()}`,
        name: body.name,
        description: body.description || null,
        stock: Number(body.stock),
        retailPrice: Number(body.retailPrice),
        supplierTotalCpa: Number(body.supplierTotalCpa),
        status: "active",
        createdAt: new Date().toISOString(),
      };
      createdProducts.push(newProd);
      currentProducts.push(newProd);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(newProd),
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
        ownerType: "SUPPLIER",
      }),
    });
  });

  // Inject supplier auth token and preferred language
  await page.addInitScript(
    ({ token, selectedLang }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", selectedLang);
    },
    { token: createSupplierToken(), selectedLang: lang }
  );

  await page.goto("/supplier/products");
  await page.waitForSelector('[data-dashboard-role="supplier"]', { timeout: 30000 });

  return { createdProducts };
}

test.describe("Supplier Product Catalog & Live Solvency Pre-check Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Renders desktop Product Catalog table with Space Mono prices, status badges, search/status filters, and 1-click Product ID copy", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupSupplierProductsSession(page, { lang: "fr" });

    // Header and Solvency Badge
    await expect(page.getByRole("heading", { name: /Catalogue & Gestion des Produits/i })).toBeVisible();
    await expect(page.getByText(/Catalogue Fournisseur • Solvabilité/i)).toBeVisible();

    // Table rows count (3 products)
    const rows = page.locator('[data-testid="supplier-product-row"]');
    await expect(rows).toHaveCount(3);

    // Row 1: Écouteurs Sans Fil Pro ANC, Active status, Space Mono pricing
    const row1 = rows.first();
    await expect(row1.getByText("Écouteurs Sans Fil Pro ANC")).toBeVisible();
    await expect(row1.getByText("85")).toBeVisible();
    await expect(row1.locator(".font-mono").first()).toBeVisible();
    await expect(row1.getByText("Actif")).toBeVisible();

    // Row 2: Montre Connectée Sport Pulse, Stock Faible badge (< 20 stock)
    const row2 = rows.nth(1);
    await expect(row2.getByText("Montre Connectée Sport Pulse")).toBeVisible();
    await expect(row2.getByText("12")).toBeVisible();
    await expect(row2.getByText("Stock Faible")).toBeVisible();

    // 1-Click Product ID copy
    const copyIdBtn = row1.locator('[data-testid="copy-product-id-btn"]').first();
    await expect(copyIdBtn).toBeVisible();
    await copyIdBtn.click();

    // Search filter test: Filter by "Montre"
    const searchInput = page.locator('[data-testid="product-search-input"]');
    await searchInput.fill("Montre");
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByText("Montre Connectée Sport Pulse")).toBeVisible();

    // Clear search
    await searchInput.fill("");
    await expect(rows).toHaveCount(3);

    // Status filter test: OUT_OF_STOCK
    const filterOutOfStockBtn = page.locator('[data-testid="filter-out-of-stock-btn"]');
    await filterOutOfStockBtn.click();
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByText("Montre Connectée Sport Pulse")).toBeVisible();

    // Status filter test: ACTIVE
    const filterActiveBtn = page.locator('[data-testid="filter-active-btn"]');
    await filterActiveBtn.click();
    await expect(rows).toHaveCount(2);

    // Reset filter: ALL
    const filterAllBtn = page.locator('[data-testid="filter-all-btn"]');
    await filterAllBtn.click();
    await expect(rows).toHaveCount(3);
  });

  test("2. Ensures 390px mobile viewport card parity and hidden desktop table rows", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSupplierProductsSession(page, { lang: "fr" });

    // Mobile product cards should be visible
    const mobileCards = page.locator('[data-testid="supplier-product-card"]');
    await expect(mobileCards).toHaveCount(3);
    await expect(mobileCards.first()).toBeVisible();

    // Desktop table rows should be hidden
    const desktopRows = page.locator('[data-testid="supplier-product-row"]');
    await expect(desktopRows.first()).toBeHidden();

    // Verify first mobile card contents
    const card1 = mobileCards.first();
    await expect(card1.getByText("Écouteurs Sans Fil Pro ANC")).toBeVisible();
    await expect(card1.getByText("85")).toBeVisible();
    await expect(card1.getByText("Actif")).toBeVisible();

    // 1-Click ID Copy on mobile card
    const cardCopyBtn = card1.locator('[data-testid="copy-product-id-btn"]').first();
    await expect(cardCopyBtn).toBeVisible();
    await cardCopyBtn.click();
  });

  test("3. Enforces Solvency Invariants in real-time and verifies strict removal of the 500 DZD floor rule", async ({
    page,
  }) => {
    await setupSupplierProductsSession(page, { lang: "fr", balance: 8000 });

    // Open Product Modal
    const addProductBtn = page.locator('[data-testid="add-product-btn"]');
    await addProductBtn.click();

    const modal = page.locator('[data-testid="supplier-product-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");

    const nameInput = page.locator('[data-testid="product-name-input"]');
    const stockInput = page.locator('[data-testid="product-stock-input"]');
    const retailInput = page.locator('[data-testid="product-retail-price-input"]');
    const cpaInput = page.locator('[data-testid="product-cpa-input"]');
    const submitBtn = page.locator('[data-testid="product-submit-btn"]');

    // Submit should initially be disabled
    await expect(submitBtn).toBeDisabled();

    // Case A: CPA > 50% Retail Price (Retail = 1000, CPA = 600 > 500)
    await nameInput.fill("Support Téléphone Magnétique");
    await stockInput.fill("50");
    await retailInput.fill("1000");
    await cpaInput.fill("600");
    await expect(submitBtn).toBeDisabled();
    await expect(page.getByText(/Budget CPA <= 50% du prix de vente/i)).toBeVisible();

    // Case B: Stock < 20 units (Stock = 15)
    await cpaInput.fill("400"); // Valid CPA (40% of 1000)
    await stockInput.fill("15"); // Invalid stock (< 20)
    await expect(submitBtn).toBeDisabled();

    // Case C: Escrow buffer check when required > balance
    // With CPA = 2000, required escrow = 5 * 2000 = 10,000 > balance 8,000
    await stockInput.fill("30");
    await retailInput.fill("5000");
    await cpaInput.fill("2000");
    await expect(submitBtn).toBeDisabled();
    await expect(page.getByText(/Solde Escrow couvre 5x le CPA/i)).toBeVisible();

    // Case D: STRICT VERIFICATION OF USER MANDATE -> NO 500 DZD FLOOR RULE!
    // Set CPA = 350 DZD (< 500 DZD floor rule that was deleted)
    // Retail = 1000 DZD (350 <= 50% = 500)
    // Stock = 25 (>= 20)
    // Required Escrow = 5 * 350 = 1,750 DZD (<= 8,000 balance)
    await stockInput.fill("25");
    await retailInput.fill("1000");
    await cpaInput.fill("350");

    // VERIFY: All 4 rules pass! Submit button is ENABLED!
    await expect(page.getByText(/Conforme 4\/4/i)).toBeVisible();
    await expect(submitBtn).toBeEnabled();

    // Close modal
    await page.locator('[data-testid="close-product-modal-btn"]').click();
    await expect(modal).toBeHidden();
  });

  test("4. Executes product creation flow with escrow buffer (no 80/20 platform/affiliate fees shown), in-page status banner, and zero native alerts", async ({
    page,
  }) => {
    let nativeAlertTriggered = false;
    page.on("dialog", (dialog) => {
      nativeAlertTriggered = true;
      dialog.dismiss();
    });

    const session = await setupSupplierProductsSession(page, { lang: "fr", balance: 15000 });

    // Open modal
    await page.locator('[data-testid="add-product-btn"]').click();
    const modal = page.locator('[data-testid="supplier-product-modal"]');
    await expect(modal).toBeVisible();

    // Fill valid product form
    await page.locator('[data-testid="product-name-input"]').fill("Chargeur Rapide 65W GaN");
    await page.locator('[data-testid="product-desc-input"]').fill("Chargeur universel USB-C haute performance");
    await page.locator('[data-testid="product-stock-input"]').fill("50");
    await page.locator('[data-testid="product-retail-price-input"]').fill("4800");
    await page.locator('[data-testid="product-cpa-input"]').fill("1000");

    // VERIFY Invisible Spread Rule: 80% and 20% platform/affiliate shares MUST NOT be shown!
    await expect(modal.getByText(/Part Affilié/i)).toBeHidden();
    await expect(modal.getByText(/Commission Plateforme/i)).toBeHidden();

    // Required escrow buffer (5x CPA = 5,000 DZD) MUST be shown!
    await expect(modal.getByText(/Tampon Escrow Requis/i)).toBeVisible();
    await expect(modal.getByText(/^5\s?000/)).toBeVisible();

    // Submit product
    const submitBtn = page.locator('[data-testid="product-submit-btn"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify modal dismissed
    await expect(modal).toBeHidden();

    // In-page success banner
    const statusBanner = page.locator('[role="status"]');
    await expect(statusBanner).toBeVisible();
    await expect(statusBanner).toContainText("Produit créé et activé avec succès dans le catalogue");

    // Verify created in session and table displays new product
    expect(session.createdProducts.length).toBe(1);
    expect(session.createdProducts[0].name).toBe("Chargeur Rapide 65W GaN");
    await expect(page.locator('[data-testid="supplier-product-row"]').getByText("Chargeur Rapide 65W GaN")).toBeVisible();

    // Zero native alert confirmation
    expect(nativeAlertTriggered).toBe(false);
  });

  test("5. Triggers direct Escrow Top-Up bridge when balance is insufficient for CPA budget", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    // Setup with only 2,000 DZD balance
    await setupSupplierProductsSession(page, { lang: "fr", balance: 2000 });

    // Open product modal
    await page.locator('[data-testid="add-product-btn"]').click();
    const productModal = page.locator('[data-testid="supplier-product-modal"]');
    await expect(productModal).toBeVisible();

    // Enter CPA = 800 (5 * 800 = 4,000 DZD required escrow > 2,000 DZD current balance)
    await page.locator('[data-testid="product-name-input"]').fill("Trépied Ring Light Pro");
    await page.locator('[data-testid="product-stock-input"]').fill("40");
    await page.locator('[data-testid="product-retail-price-input"]').fill("3500");
    await page.locator('[data-testid="product-cpa-input"]').fill("800");

    // Verify insufficient balance alert and top-up trigger button
    await expect(page.getByText(/Votre solde actuel est insuffisant pour ce budget CPA/i)).toBeVisible();
    const openTopUpBtn = page.locator('[data-testid="open-topup-from-product-btn"]');
    await expect(openTopUpBtn).toBeVisible();

    // Click Top-Up button inside product modal
    await openTopUpBtn.click();

    // Product modal closes and Escrow Top-Up modal opens
    await expect(productModal).toBeHidden();
    const topUpModal = page.locator('[data-testid="supplier-topup-modal"]');
    await expect(topUpModal).toBeVisible();
    await expect(topUpModal).toHaveAttribute("role", "dialog");

    // Verify copy buttons inside topup modal
    const copyRipBtn = page.locator('[data-testid="copy-rip-btn"]');
    await expect(copyRipBtn).toBeVisible();
    await copyRipBtn.click();

    // Close topup modal
    await page.locator('[data-testid="close-topup-modal-btn"]').click();
    await expect(topUpModal).toBeHidden();
  });

  test("6. Enforces Arabic RTL parity and zero horizontal overflow across 390px, 768px, and 1440px", async ({
    page,
  }) => {
    await setupSupplierProductsSession(page, { lang: "ar", balance: 8000 });

    // RTL verification
    const dashboardRoot = page.locator('[data-dashboard-role="supplier"]');
    await expect(dashboardRoot).toHaveAttribute("dir", "rtl");

    // Arabic title & badges
    await expect(page.getByRole("heading", { name: /كتالوج المنتجات والأسعار/i })).toBeVisible();
    await expect(page.getByText(/كتالوج المورد • الملاءة الآلية/i)).toBeVisible();

    // Open modal in Arabic
    const addProductBtn = page.locator('[data-testid="add-product-btn"]');
    await addProductBtn.click();

    const modal = page.locator('[data-testid="supplier-product-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("heading", { name: /إضافة منتج جديد/i })).toBeVisible();
    await expect(page.getByText(/فحص الملاءة المالية الفوري/i)).toBeVisible();

    // Close modal
    await page.locator('[data-testid="close-product-modal-btn"]').click();
    await expect(modal).toBeHidden();

    // Zero horizontal overflow across all breakpoints
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

  test("7. Ensures numeric inputs are isolated from mouse-wheel mutations (prevents 1600 -> 1591 and 400 -> 391 glitches)", async ({
    page,
  }) => {
    await setupSupplierProductsSession(page, { lang: "fr", balance: 15000 });

    await page.locator('[data-testid="add-product-btn"]').click();
    const modal = page.locator('[data-testid="supplier-product-modal"]');
    await expect(modal).toBeVisible();

    const retailInput = page.locator('[data-testid="product-retail-price-input"]');
    const cpaInput = page.locator('[data-testid="product-cpa-input"]');

    // Fill 1600 into retail price and 400 into CPA
    await retailInput.fill("1600");
    await cpaInput.fill("400");

    // Dispatch mouse wheel scroll ticks on retail input
    await retailInput.hover();
    await page.mouse.wheel(0, 500);

    // Assert that retailPrice remains strictly 1600
    await expect(retailInput).toHaveValue("1600");

    // Dispatch mouse wheel scroll ticks on CPA input
    await cpaInput.hover();
    await page.mouse.wheel(0, 500);

    // Assert that CPA remains strictly 400
    await expect(cpaInput).toHaveValue("400");

    // Close modal
    await page.locator('[data-testid="close-product-modal-btn"]').click();
    await expect(modal).toBeHidden();
  });

  test("8. Navigates to dedicated /supplier/products/new studio, renders live marketplace preview card, and publishes product", async ({
    page,
  }) => {
    const session = await setupSupplierProductsSession(page, { lang: "fr", balance: 25000 });

    // Click Studio Complet button in catalog header
    const studioBtn = page.locator('[data-testid="new-product-page-btn"]');
    await expect(studioBtn).toBeVisible();
    await studioBtn.click();

    // Verify navigation to /supplier/products/new
    await expect(page).toHaveURL(/\/supplier\/products\/new/);
    const container = page.locator('[data-testid="new-product-page-container"]');
    await expect(container).toBeVisible();

    // Verify radar card & live marketplace preview
    await expect(page.locator('[data-testid="solvency-radar-card"]')).toBeVisible();
    const livePreview = page.locator('[data-testid="marketplace-card-preview"]');
    await expect(livePreview).toBeVisible();

    // Fill new product form
    const nameInput = page.locator('[data-testid="page-product-name-input"]');
    const descInput = page.locator('[data-testid="page-product-desc-input"]');
    const stockInput = page.locator('[data-testid="page-product-stock-input"]');
    const retailInput = page.locator('[data-testid="page-product-retail-price-input"]');
    const cpaInput = page.locator('[data-testid="page-product-cpa-input"]');

    await nameInput.fill("Station Météo Sans Fil Pro");
    await descInput.fill("Capteurs extérieurs étanches et écran tactile couleur");
    await stockInput.fill("60");
    await retailInput.fill("7500");
    await cpaInput.fill("1800");

    // Verify live preview updates dynamically
    await expect(livePreview.getByText("Station Météo Sans Fil Pro")).toBeVisible();
    await expect(livePreview.getByText(/7\s?500/)).toBeVisible();
    await expect(livePreview.getByText(/1\s?800/)).toBeVisible();

    // Verify radar invariants pass 4/4
    const complianceBadge = page.locator('[data-testid="solvency-compliance-badge"]');
    await expect(complianceBadge).toContainText(/Conforme 4\/4/i);

    // Publish product
    const publishBtn = page.locator('[data-testid="page-sticky-publish-btn"]');
    await expect(publishBtn).toBeEnabled();
    await publishBtn.click();

    // Verify redirected back to /supplier/products
    await expect(page).toHaveURL(/\/supplier\/products$/);
  });
});
