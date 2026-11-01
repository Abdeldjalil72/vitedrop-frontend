import { expect, test, type Page } from "@playwright/test";

function createMockToken(role: "AFFILIATE" | "SUPPLIER" = "AFFILIATE"): string {
  const payload = {
    sub: role === "AFFILIATE" ? "aff-qa-uuid" : "sup-qa-uuid",
    email: role === "AFFILIATE" ? "affiliate@vitedrop.com" : "supplier@vitedrop.com",
    role,
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `header.${base64Payload}.signature`;
}

async function setupOnboardingRoutes(
  page: Page,
  options: {
    affiliateError?: string;
    supplierError?: string;
  } = {}
) {
  const apiBase = "http://localhost:4000";
  const { affiliateError, supplierError } = options;

  // Intercept affiliate registration
  await page.route(new RegExp(`^${apiBase}/auth/register/affiliate`), async (route) => {
    if (route.request().method() === "POST") {
      if (affiliateError) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: affiliateError }),
        });
      } else {
        const token = createMockToken("AFFILIATE");
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: token,
            user: {
              id: "aff-qa-uuid",
              email: "affiliate@vitedrop.com",
              role: "AFFILIATE",
            },
          }),
        });
      }
    } else {
      await route.fallback();
    }
  });

  // Intercept supplier registration
  await page.route(new RegExp(`^${apiBase}/auth/register/supplier`), async (route) => {
    if (route.request().method() === "POST") {
      if (supplierError) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: supplierError }),
        });
      } else {
        const token = createMockToken("SUPPLIER");
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: token,
            user: {
              id: "sup-qa-uuid",
              email: "supplier@vitedrop.com",
              role: "SUPPLIER",
            },
          }),
        });
      }
    } else {
      await route.fallback();
    }
  });

  // Mock post-registration dashboard routes to prevent navigation stalls
  await page.route(new RegExp(`^${apiBase}/affiliate/`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(new RegExp(`^${apiBase}/supplier/`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}

test.describe("Public Marketing & Registration Onboarding Funnel", () => {
  test("renders homepage hero, audience ecosystem switcher, and multilingual dropdown", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify Hero title is visible
    const heroTitle = page.locator('[data-testid="hero-title"]');
    await expect(heroTitle).toBeVisible();

    // Verify CTA Explore button
    const exploreBtn = page.locator('[data-testid="hero-explore-btn"]');
    await expect(exploreBtn).toBeVisible();

    // Verify audience ecosystem switcher tabs (Buyer vs Supplier)
    const buyerTab = page.locator('[data-testid="audience-tab-buyer"]');
    const supplierTab = page.locator('[data-testid="audience-tab-supplier"]');

    await expect(buyerTab).toBeVisible();
    await expect(supplierTab).toBeVisible();

    // Toggle to Supplier tab
    await supplierTab.click();
    await expect(supplierTab).toHaveClass(/text-white/);

    // Toggle back to Buyer tab
    await buyerTab.click();
    await expect(buyerTab).toHaveClass(/text-white/);

    // Multilingual dropdown testing: Switch from English to French to Arabic
    const langBtn = page.locator('[data-testid="nav-lang-btn"]');
    await expect(langBtn).toBeVisible();
    await expect(langBtn).toContainText("EN");

    // Click French
    await langBtn.click();
    const frOption = page.locator('[data-testid="lang-option-fr"]');
    await frOption.click();
    await expect(langBtn).toContainText("FR");

    // Click Arabic
    await langBtn.click();
    const arOption = page.locator('[data-testid="lang-option-ar"]');
    await arOption.click();
    await expect(langBtn).toContainText("AR");
    await expect(page.locator("div[dir='rtl']").first()).toBeVisible();

    // Reset to English
    await langBtn.click();
    const enOption = page.locator('[data-testid="lang-option-en"]');
    await enOption.click();
    await expect(langBtn).toContainText("EN");

    // Auth links in navbar
    const loginLink = page.locator('[data-testid="nav-login-link"]');
    const registerLink = page.locator('[data-testid="nav-register-link"]');
    await expect(loginLink).toBeVisible();
    await expect(registerLink).toBeVisible();
  });

  test("validates required fields, phone format, and executes affiliate registration flow", async ({
    page,
  }) => {
    // Ensure zero native browser alerts
    let dialogTriggered = false;
    page.on("dialog", (d) => {
      dialogTriggered = true;
      d.dismiss();
    });

    await setupOnboardingRoutes(page);
    await page.goto("/register");

    // Form defaults to Affiliate role
    const affiliateTab = page.locator('[data-testid="tab-affiliate"]');
    await expect(affiliateTab).toBeVisible();

    // Click submit empty form
    const submitBtn = page.locator('[data-testid="register-submit-btn"]');
    await submitBtn.click();

    expect(dialogTriggered).toBe(false);

    // Inline error banner is displayed
    const errorBanner = page.locator('[data-testid="register-error-banner"]');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText("Veuillez remplir tous les champs");

    // Fill invalid phone (not starting with 05/06/07)
    await page.locator('[data-testid="register-name-input"]').fill("Yacine Belkacem");
    await page.locator('[data-testid="register-email-input"]').fill("yacine@media-dz.com");
    await page.locator('[data-testid="register-phone-input"]').fill("0123456789");
    await page.locator('[data-testid="register-password-input"]').fill("Password123!");
    await submitBtn.click();

    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/Format algérien invalide|Numéro invalide/);

    // Fix phone with valid Algerian format (0550...)
    await page.locator('[data-testid="register-phone-input"]').fill("0550112233");
    await submitBtn.click();

    // Success banner is displayed
    const successBanner = page.locator('[data-testid="register-success-banner"]');
    await expect(successBanner).toBeVisible();

    // Verify redirected to /affiliate
    await page.waitForURL(/\/affiliate/, { timeout: 7000 });
    expect(page.url()).toContain("/affiliate");
  });

  test("validates supplier company requirement and executes supplier registration flow", async ({
    page,
  }) => {
    await setupOnboardingRoutes(page);
    await page.goto("/register");

    // Switch to Supplier tab
    const supplierTab = page.locator('[data-testid="tab-supplier"]');
    await supplierTab.click();

    // Supplier profile inputs are now visible
    const companyInput = page.locator('[data-testid="register-company-input"]');
    const wilayaSelect = page.locator('[data-testid="register-wilaya-select"]');

    await expect(companyInput).toBeVisible();
    await expect(wilayaSelect).toBeVisible();

    // Fill common credentials but leave company empty
    await page.locator('[data-testid="register-name-input"]').fill("Samir Ouali");
    await page.locator('[data-testid="register-email-input"]').fill("samir@dz-logistics.com");
    await page.locator('[data-testid="register-phone-input"]').fill("0661223344");
    await page.locator('[data-testid="register-password-input"]').fill("SupplierPass123!");

    const submitBtn = page.locator('[data-testid="register-submit-btn"]');
    await submitBtn.click();

    // Error banner indicates company requirement
    const errorBanner = page.locator('[data-testid="register-error-banner"]');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/entreprise|marque/);

    // Fill company name
    await companyInput.fill("Atlas Logistics SARL");
    await submitBtn.click();

    // Success banner is displayed
    const successBanner = page.locator('[data-testid="register-success-banner"]');
    await expect(successBanner).toBeVisible();

    // Verify redirected to /supplier
    await page.waitForURL(/\/supplier/, { timeout: 7000 });
    expect(page.url()).toContain("/supplier");
  });

  test("executes forgot password recovery flow with success confirmation and login return", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    const emailInput = page.locator('[data-testid="forgot-email-input"]');
    const submitBtn = page.locator('[data-testid="forgot-submit-btn"]');

    await expect(emailInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Submit email
    await emailInput.fill("recovery@vitedrop.com");
    await submitBtn.click();

    // Success screen appears
    const successView = page.locator('[data-testid="forgot-success-view"]');
    await expect(successView).toBeVisible();

    // Back to login button
    const backBtn = page.locator('[data-testid="back-to-login-btn"]');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Verify arrived on /login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("supports 390px mobile viewport across all marketing & auth routes with zero overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const routes = ["/", "/register", "/forgot-password"];

    for (const route of routes) {
      await page.goto(route);

      // Verify page is rendered
      await expect(page.locator("body")).toBeVisible();

      // Check zero horizontal layout overflow
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalOverflow, `Horizontal overflow detected on ${route}`).toBe(false);
    }
  });

  test("guarantees Arabic RTL parity across marketing and authentication pages with LTR phone protection", async ({
    page,
  }) => {
    // 1. Homepage RTL toggle
    await page.goto("/");
    await page.locator('[data-testid="nav-lang-btn"]').click();
    const arOption = page.locator('[data-testid="lang-option-ar"]');
    await arOption.click();

    const homeRtl = page.locator("div[dir='rtl']").first();
    await expect(homeRtl).toBeVisible();

    // 2. Register Page RTL
    await page.goto("/register");
    const authArBtn = page.locator('[data-testid="auth-lang-ar"]');
    await authArBtn.click();

    const registerRtl = page.locator("div[dir='rtl']").first();
    await expect(registerRtl).toBeVisible();

    // Phone input MUST retain dir="ltr" to protect Algerian phone numbers
    const phoneInput = page.locator('[data-testid="register-phone-input"]');
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveAttribute("dir", "ltr");

    // 3. Forgot Password RTL
    await page.goto("/forgot-password");
    const forgotArBtn = page.locator('[data-testid="auth-lang-ar"]');
    await forgotArBtn.click();

    const forgotRtl = page.locator("div[dir='rtl']").first();
    await expect(forgotRtl).toBeVisible();
  });
});
