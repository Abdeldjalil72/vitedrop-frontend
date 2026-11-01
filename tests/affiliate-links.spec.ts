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
}

async function setupAffiliateLinksSession(
  page: Page,
  options: SetupOptions = {}
): Promise<void> {
  const { lang = "fr", products = mockMarketplaceProducts } = options;
  const apiBase = "http://localhost:4000";

  // Intercept marketplace products list GET on port 4000
  await page.route(new RegExp(`^${apiBase}/affiliate/marketplace`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(products),
    });
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

  await page.goto("/affiliate/links");
  await page.waitForSelector('[data-dashboard-role="affiliate"]', { timeout: 30000 });
}

test.describe("Affiliate Tracking Links & S2S Campaigns Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Renders Campaign Link Builder with traffic presets, dynamic URL assembly, and 1-click clipboard copy", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await setupAffiliateLinksSession(page, { lang: "fr" });

    // Header check
    await expect(page.getByRole("heading", { name: /Générateur de Liens & Campagnes S2S/i })).toBeVisible();
    await expect(page.getByText(/Tracking & S2S Campaigns/i)).toBeVisible();

    // Verify affiliate ID pill
    await expect(page.getByText("aff=aff-qa-uuid", { exact: true })).toBeVisible();

    // Verify product dropdown
    const productSelect = page.locator('[data-testid="product-select"]');
    await expect(productSelect).toBeVisible();

    // Select second product (Montre Connectée)
    await productSelect.selectOption("prod-watch-02");

    // Click TikTok Ads preset chip
    const tiktokPreset = page.locator('[data-testid="preset-tiktok"]');
    await expect(tiktokPreset).toBeVisible();
    await tiktokPreset.click();

    // Verify inputs updated
    const sourceInput = page.locator('[data-testid="link-source-input"]');
    await expect(sourceInput).toHaveValue("tiktok");

    // Fill campaign and sub-id
    const campaignInput = page.locator('[data-testid="link-campaign-input"]');
    await campaignInput.fill("tiktok_alger_ugc_01");

    const subIdInput = page.locator('[data-testid="link-subid-input"]');
    await subIdInput.fill("hook_fast_delivery");

    // Verify dynamic URL preview
    const linkDisplay = page.locator('[data-testid="generated-link-display"]');
    await expect(linkDisplay).toContainText("/p/prod-watch-02");
    await expect(linkDisplay).toContainText("aff=aff-qa-uuid");
    await expect(linkDisplay).toContainText("utm_source=tiktok");
    await expect(linkDisplay).toContainText("utm_campaign=tiktok_alger_ugc_01");
    await expect(linkDisplay).toContainText("sub_id=hook_fast_delivery");

    // 1-Click Clipboard Copy
    const copyBtn = page.locator('[data-testid="copy-generated-link-btn"]');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(copyBtn).toContainText(/Copié !/i);
  });

  test("2. Renders Quick Catalog Links table with Space Mono Net CPA and zero native alert dialogs on copy", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });

    // Track whether any native dialog is invoked (strictly forbidden)
    let dialogTriggered = false;
    page.on("dialog", (dialog) => {
      dialogTriggered = true;
      dialog.dismiss();
    });

    await setupAffiliateLinksSession(page, { lang: "fr" });

    // Table presence
    const table = page.locator('[data-testid="affiliate-links-table"]');
    await expect(table).toBeVisible();

    const rows = page.locator('[data-testid="affiliate-link-row"]');
    await expect(rows).toHaveCount(3);

    // Verify Space Mono Net CPA formatting
    const firstRow = rows.first();
    await expect(firstRow.getByText("Écouteurs Sans Fil Pro ANC")).toBeVisible();
    await expect(firstRow.locator('[data-testid="affiliate-net-payout"]')).toHaveText("960 DZD");

    // Click direct copy button
    const copyBtn = firstRow.locator('[data-testid="copy-product-link-btn"]');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Verify inline feedback (and no native window alert dialog)
    await expect(copyBtn).toContainText(/Copié !/i);
    expect(dialogTriggered).toBe(false);
  });

  test("3. Ensures 390px mobile viewport card parity for quick links and generator", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-write"], { origin: "http://localhost:3000" });
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAffiliateLinksSession(page, { lang: "fr" });

    // Desktop table should be hidden on mobile
    const table = page.locator('[data-testid="affiliate-links-table"]');
    await expect(table).toBeHidden();

    // Mobile cards should be rendered
    const cards = page.locator('[data-testid="affiliate-link-card"]');
    await expect(cards).toHaveCount(3);

    const firstCard = cards.first();
    await expect(firstCard.getByText("Écouteurs Sans Fil Pro ANC")).toBeVisible();
    await expect(firstCard.locator('[data-testid="affiliate-net-payout"]')).toHaveText("960 DZD");
    await expect(firstCard.getByText("CPA Net", { exact: true })).toBeVisible();

    // Mobile copy button
    const mobileCopyBtn = firstCard.locator('[data-testid="copy-product-link-btn"]');
    await expect(mobileCopyBtn).toBeVisible();
    await mobileCopyBtn.click();
    await expect(mobileCopyBtn).toContainText(/Lien copié !/i);
  });

  test("4. Displays S2S CAPI Telemetry architectural guide with 3 postback phases", async ({
    page,
  }) => {
    await setupAffiliateLinksSession(page, { lang: "fr" });

    const telemetryCard = page.locator('[data-testid="s2s-telemetry-card"]');
    await expect(telemetryCard).toBeVisible();

    // Phase 1: Click ID
    await expect(telemetryCard.getByText(/Capture du Clic Initial/i)).toBeVisible();
    // Phase 2: Lead Sealing
    await expect(telemetryCard.getByText(/Attribution du Lead COD/i)).toBeVisible();
    // Phase 3: Postback
    await expect(telemetryCard.getByText(/CAPI Post-Livraison/i)).toBeVisible();
  });

  test("5. Enforces Arabic RTL parity and zero horizontal overflow across 390px, 768px, and 1440px", async ({
    page,
  }) => {
    await setupAffiliateLinksSession(page, { lang: "ar" });

    // RTL verification
    const dashboardRoot = page.locator('[data-dashboard-role="affiliate"]');
    await expect(dashboardRoot).toHaveAttribute("dir", "rtl");

    // Arabic title & eyebrow
    await expect(page.getByRole("heading", { name: /مولد الروابط وحملات التتبع/i })).toBeVisible();
    await expect(page.getByText(/تتبع الروابط والإعلانات S2S/i)).toBeVisible();

    // Presets in Arabic
    await expect(page.getByRole("button", { name: /TikTok Ads/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Facebook \/ Meta/i })).toBeVisible();

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
