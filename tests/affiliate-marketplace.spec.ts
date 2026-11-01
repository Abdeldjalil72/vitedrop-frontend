import { expect, test, type Page } from "@playwright/test";

const mockMarketplaceProducts = [
  {
    id: "prod-earbuds-01",
    name: "Écouteurs Sans Fil Pro ANC",
    description: "Écouteurs sans fil avec réduction active du bruit et autonomie 36h",
    retailPrice: 4500,
    affiliateNetPayout: 960,
    stock: 85,
    category: "Électronique & Soins",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80",
    status: "active",
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "prod-watch-02",
    name: "Montre Connectée Sport Pulse",
    description: "Montre cardio étanche IP68 avec suivi GPS pour athlètes",
    retailPrice: 6200,
    affiliateNetPayout: 1200,
    stock: 40,
    category: "Électronique & Soins",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80",
    status: "active",
    createdAt: "2026-10-02T12:00:00.000Z",
  },
  {
    id: "prod-cosmetic-03",
    name: "Sérum Anti-Âge Bio Élixir",
    description: "Soin visage revitalisant formulé aux huiles précieuses naturelles",
    retailPrice: 3800,
    affiliateNetPayout: 720,
    stock: 120,
    category: "Beauté & Santé",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80",
    status: "active",
    createdAt: "2026-10-03T14:00:00.000Z",
  },
];

function createAffiliateToken(): string {
  const payload = {
    sub: "aff-qa-uuid",
    email: "affiliate@vitedrop.com",
    role: "AFFILIATE",
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `header.${base64Payload}.signature`;
}

interface SetupOptions {
  lang?: "fr" | "ar" | "en";
  products?: typeof mockMarketplaceProducts;
  pathname?: string;
}

async function setupAffiliateMarketplaceSession(
  page: Page,
  options: SetupOptions = {}
): Promise<void> {
  const {
    lang = "fr",
    products = mockMarketplaceProducts,
    pathname = "/affiliate/marketplace",
  } = options;
  const apiBase = "http://localhost:4000";

  // Intercept marketplace products list & detail GET
  await page.route(new RegExp(`^${apiBase}/affiliate/marketplace`), async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/affiliate/marketplace" || url.pathname === "/affiliate/marketplace/") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(products),
      });
    } else {
      const match = url.pathname.match(/\/affiliate\/marketplace\/([^/?]+)/);
      const id = match ? match[1] : "";
      const found = products.find((p) => p.id === id) || products[0];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(found),
      });
    }
  });

  // Intercept wallet GET
  await page.route(new RegExp(`^${apiBase}/wallets?/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "wal-aff-qa",
        userId: "aff-qa-uuid",
        balance: 14500,
        currency: "DZD",
        ownerType: "AFFILIATE",
      }),
    });
  });

  // Inject token and language
  await page.addInitScript(
    ({ token, selectedLang }) => {
      localStorage.setItem("vitedrop_token", token);
      localStorage.setItem("vitedrop_lang", selectedLang);
    },
    { token: createAffiliateToken(), selectedLang: lang }
  );

  await page.goto(pathname);
  await page.waitForSelector('[data-dashboard-role="affiliate"]', { timeout: 30000 });
}

test.describe("Affiliate Marketplace & Offer Discovery Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Renders desktop Offer Grid with Net CPA payouts, Space Mono prices, and action buttons", async ({
    page,
  }) => {
    await setupAffiliateMarketplaceSession(page, { lang: "fr" });

    // Header & Counter
    await expect(page.getByRole("heading", { name: /Catalogue Produits Gagnants COD/i })).toBeVisible();
    await expect(page.getByText(/3 produits disponibles/i)).toBeVisible();

    // Product cards count
    const cards = page.locator('[data-testid="marketplace-product-card"]');
    await expect(cards).toHaveCount(3);

    // Card 1: Écouteurs Sans Fil Pro ANC
    const earbudsCard = cards.filter({ hasText: "Écouteurs Sans Fil Pro ANC" });
    await expect(earbudsCard.getByText("Écouteurs Sans Fil Pro ANC")).toBeVisible();
    await expect(earbudsCard.getByText("4 500 DZD")).toBeVisible();
    await expect(earbudsCard.getByText("+960 DZD")).toBeVisible();
    await expect(earbudsCard.getByText(/85/)).toBeVisible();

    // Action buttons on card
    await expect(earbudsCard.locator('[data-testid="view-product-details-btn"]')).toBeVisible();
    await expect(earbudsCard.locator('[data-testid="generate-link-btn"]')).toBeVisible();

    // Card 2: Montre Connectée Sport Pulse
    const watchCard = cards.filter({ hasText: "Montre Connectée Sport Pulse" });
    await expect(watchCard.getByText("Montre Connectée Sport Pulse")).toBeVisible();
    await expect(watchCard.getByText("+1 200 DZD")).toBeVisible();

    // Card 3: Sérum Anti-Âge Bio Élixir
    const serumCard = cards.filter({ hasText: "Sérum Anti-Âge Bio Élixir" });
    await expect(serumCard.getByText("Sérum Anti-Âge Bio Élixir")).toBeVisible();
    await expect(serumCard.getByText("+720 DZD")).toBeVisible();
  });

  test("2. Filters products by search query, sorting order, and category tabs", async ({
    page,
  }) => {
    await setupAffiliateMarketplaceSession(page, { lang: "fr" });

    const cards = page.locator('[data-testid="marketplace-product-card"]');
    await expect(cards).toHaveCount(3);

    // Search for "Sérum"
    const searchInput = page.locator('[data-testid="marketplace-search-input"]');
    await searchInput.fill("Sérum");
    await expect(cards).toHaveCount(1);
    await expect(cards.first().getByText("Sérum Anti-Âge Bio Élixir")).toBeVisible();

    // Clear search
    await searchInput.fill("");
    await expect(cards).toHaveCount(3);

    // Sort by Price Ascending
    const sortSelect = page.locator('[data-testid="marketplace-sort-select"]');
    await sortSelect.selectOption("price-asc");
    // Lowest price is Sérum (3 800 DZD)
    await expect(cards.first().getByText("Sérum Anti-Âge Bio Élixir")).toBeVisible();

    // Sort by CPA Highest
    await sortSelect.selectOption("cpa");
    // Highest CPA is Montre (1 200 DZD)
    await expect(cards.first().getByText("Montre Connectée Sport Pulse")).toBeVisible();
  });

  test("3. Ensures 390px mobile viewport card responsiveness and access to actions", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAffiliateMarketplaceSession(page, { lang: "fr" });

    const cards = page.locator('[data-testid="marketplace-product-card"]');
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toBeVisible();

    // Verify actions visible on mobile
    const card1 = cards.first();
    await expect(card1.locator('[data-testid="view-product-details-btn"]')).toBeVisible();
    await expect(card1.locator('[data-testid="generate-link-btn"]')).toBeVisible();
  });

  test("4. Opens accessible Tracking Link Generator modal with custom tags and 1-click clipboard copy", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupAffiliateMarketplaceSession(page, { lang: "fr" });

    // Click "Générer un Lien" on Écouteurs card
    const earbudsCard = page.locator('[data-testid="marketplace-product-card"]').filter({ hasText: "Écouteurs Sans Fil Pro ANC" });
    const genLinkBtn = earbudsCard.locator('[data-testid="generate-link-btn"]');
    await genLinkBtn.click();

    // Modal check
    const modal = page.locator('[data-testid="tracking-link-modal"]');
    await expect(modal).toBeVisible();

    // Verify Net CPA highlighted inside modal
    await expect(modal.getByText(/Net CPA/i)).toBeVisible();
    await expect(modal.getByText("960 DZD")).toBeVisible();

    // Fill campaign and sub-id
    const campaignInput = page.locator('[data-testid="tracking-campaign-input"]');
    await campaignInput.fill("tiktok_algiers_test");

    const subIdInput = page.locator('[data-testid="tracking-subid-input"]');
    await subIdInput.fill("adset_v1");

    // Verify generated URL updates dynamically
    const linkInput = page.locator('[data-testid="generated-link-input"]');
    await expect(linkInput).toHaveValue(/utm_campaign=tiktok_algiers_test/);
    await expect(linkInput).toHaveValue(/sub_id=adset_v1/);
    await expect(linkInput).toHaveValue(/aff=aff-qa-uuid/);

    // 1-Click Copy
    const copyBtn = page.locator('[data-testid="copy-tracking-link-btn"]');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(copyBtn).toContainText(/Copié/i);

    // Close modal
    const closeBtn = page.locator('[data-testid="close-link-modal-btn"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(modal).toBeHidden();
  });

  test("5. Explores Product Offer Detail page with Wilayas shipping rates table and modal CTA", async ({
    page,
  }) => {
    await setupAffiliateMarketplaceSession(page, {
      lang: "fr",
      pathname: "/affiliate/marketplace/prod-earbuds-01",
    });

    // Hero section
    const hero = page.locator('[data-testid="product-detail-hero"]');
    await expect(hero).toBeVisible();
    await expect(hero.getByText("Écouteurs Sans Fil Pro ANC")).toBeVisible();
    await expect(hero.getByText("4 500 DZD")).toBeVisible();
    await expect(hero.getByText("+960 DZD")).toBeVisible();

    // Verify shipping rates table is removed
    await expect(page.locator('[data-testid="wilaya-shipping-table"]')).toHaveCount(0);

    // Open link generator modal from detail page
    const detailGenLinkBtn = page.locator('[data-testid="detail-generate-link-btn"]');
    await expect(detailGenLinkBtn).toBeVisible();
    await detailGenLinkBtn.click();

    const modal = page.locator('[data-testid="tracking-link-modal"]');
    await expect(modal).toBeVisible();
    await page.locator('[data-testid="close-link-modal-btn"]').click();
    await expect(modal).toBeHidden();

    // Breadcrumb navigation back to catalog
    const backLink = page.locator('[data-testid="back-to-catalog-link"]');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/affiliate\/marketplace$/);
  });

  test("6. Enforces Arabic RTL parity and zero horizontal overflow across 390px, 768px, and 1440px", async ({
    page,
  }) => {
    await setupAffiliateMarketplaceSession(page, { lang: "ar" });

    // RTL verification
    const dashboardRoot = page.locator('[data-dashboard-role="affiliate"]');
    await expect(dashboardRoot).toHaveAttribute("dir", "rtl");

    // Arabic title & counter badge
    await expect(page.getByRole("heading", { name: /سوق المنتجات الرابحة COD/i })).toBeVisible();
    await expect(page.getByText(/3 منتج رابح/i)).toBeVisible();

    // Open modal in Arabic
    const genLinkBtn = page.locator('[data-testid="generate-link-btn"]').first();
    await genLinkBtn.click();

    const modal = page.locator('[data-testid="tracking-link-modal"]');
    await expect(modal).toBeVisible();
    await page.locator('[data-testid="close-link-modal-btn"]').click();
    await expect(modal).toBeHidden();

    // Zero horizontal overflow across all viewports
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
