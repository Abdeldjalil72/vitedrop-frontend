import { expect, test, type Page } from "@playwright/test";

const mockPayoutSettings = {
  payoutMethod: "BARIDIMOB",
  payoutRip: "00799999002345678901",
  payoutCcpNumber: "",
  payoutCcpKey: "",
  payoutFullName: "Karim Affiliate DZ",
};

const mockProduct = {
  id: "prod-smartwatch-01",
  name: "ساعة ذكية رياضية Ultra Pro المقاومة للماء",
  retailPrice: 4900,
  stock: 14,
};

test.describe("Phase 1: Security, Payout Persistence & Password Reset", () => {
  test.describe("1.1 Rate Limiting Graceful Handling", () => {
    test("displays in-page localized rate limit alert on HTTP 429 without native popup", async ({ page }) => {
      const apiBase = "http://localhost:4000";

      await page.route(new RegExp(`^${apiBase}/checkout/product/`), async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockProduct),
        });
      });

      // Simulate 429 Too Many Requests from Throttler
      await page.route(new RegExp(`^${apiBase}/checkout$`), async (route) => {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            statusCode: 429,
            error: "Too Many Requests",
            message: "Trop de requêtes effectuées. Veuillez patienter avant de renouveler votre tentative.",
          }),
        });
      });

      await page.goto("/p/prod-smartwatch-01");

      // Fill checkout form
      await page.locator('[data-testid="checkout-customer-name"]').fill("Amine Meziani");
      await page.locator('[data-testid="checkout-customer-phone"]').fill("0661987654");
      await page.locator('[data-testid="checkout-commune-select"]').selectOption("Bab El Oued");
      await page.locator('[data-testid="checkout-address"]').fill("Rue de la Liberté");

      // Submit
      await page.locator('[data-testid="checkout-submit-btn"]').click();

      // Verify inline rate limit banner renders gracefully
      const errorAlert = page.locator('[data-testid="checkout-api-error"]');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/الحد المسموح|Trop de tentatives/);
    });
  });

  test.describe("1.2 Affiliate Payout Settings Persistence", () => {
    test("loads server payout settings, saves updates via API, and pre-fills wallet withdrawal modal", async ({ page }) => {
      const apiBase = "http://localhost:4000";
      let capturedPatchPayload: any = null;

      // Mock user auth token
      await page.addInitScript(() => {
        const fakeToken =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
          btoa(
            JSON.stringify({
              sub: "aff-qa-uuid",
              email: "affiliate@vitedrop.dz",
              role: "AFFILIATE",
              exp: Math.floor(Date.now() / 1000) + 86400,
            })
          ) +
          ".signature";
        localStorage.setItem("vitedrop_token", fakeToken);
      });

      // Mock GET /users/payout-settings
      await page.route(new RegExp(`^${apiBase}/users/payout-settings`), async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockPayoutSettings),
          });
        } else if (route.request().method() === "PATCH") {
          capturedPatchPayload = route.request().postDataJSON();
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              success: true,
              ...capturedPatchPayload,
            }),
          });
        }
      });

      // Mock wallet & orders for wallet page
      await page.route(new RegExp(`^${apiBase}/wallets/me`), async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "wal-aff", balance: 25000, ownerType: "AFFILIATE" }),
        });
      });

      await page.route(new RegExp(`^${apiBase}/wallets/transactions`), async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [], total: 0 }),
        });
      });

      await page.route(new RegExp(`^${apiBase}/affiliate/orders`), async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      // 1. Visit Affiliate Settings Page
      await page.goto("/affiliate/settings");

      // Verify form is populated from server
      const accountInput = page.locator('[data-testid="payout-account-input"]');
      await expect(accountInput).toBeVisible();
      await expect(accountInput).toHaveValue(mockPayoutSettings.payoutRip);

      // Edit account details
      await accountInput.fill("00799999009988776655");
      await page.locator('[data-testid="payout-save-btn"]').click();

      // Verify PATCH was called and success alert appears
      await expect(page.locator('[data-testid="payout-success-alert"]')).toBeVisible();
      expect(capturedPatchPayload).not.toBeNull();
      expect(capturedPatchPayload.payoutRip).toBe("00799999009988776655");

      // 2. Navigate to Wallet and verify withdrawal modal pre-populates
      await page.goto("/affiliate/wallet");

      const withdrawBtn = page.locator('[data-testid="open-withdraw-modal-btn"]');
      await expect(withdrawBtn).toBeVisible();
      await withdrawBtn.click();

      // Verify modal has opened
      await expect(page.locator('[data-testid="affiliate-withdraw-modal"]')).toBeVisible();

      // Verify recipient RIP is pre-filled from settings
      const ripField = page.locator('[data-testid="recipient-rip-input"]');
      await expect(ripField).toBeVisible();
      const val = await ripField.inputValue();
      expect(val.length).toBeGreaterThan(0);
    });
  });

  test.describe("1.3 Password Reset Engine", () => {
    test("handles forgot-password submission and completes reset-password flow", async ({ page }) => {
      const apiBase = "http://localhost:4000";
      let capturedForgotEmail = "";
      let capturedResetPayload: any = null;

      // Mock forgot password
      await page.route(new RegExp(`^${apiBase}/auth/forgot-password`), async (route) => {
        const body = route.request().postDataJSON();
        capturedForgotEmail = body.email;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Si cette adresse existe, un lien a été envoyé.",
            debugToken: "test-reset-token-9988",
          }),
        });
      });

      // Mock reset password
      await page.route(new RegExp(`^${apiBase}/auth/reset-password`), async (route) => {
        capturedResetPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Votre mot de passe a été mis à jour avec succès.",
          }),
        });
      });

      // 1. Visit /forgot-password
      await page.goto("/forgot-password");

      await page.locator('[data-testid="forgot-email-input"]').fill("affiliate@vitedrop.dz");
      await page.locator('[data-testid="forgot-submit-btn"]').click();

      // Verify success screen
      await expect(page.locator('[data-testid="forgot-success-view"]')).toBeVisible();
      expect(capturedForgotEmail).toBe("affiliate@vitedrop.dz");

      // 2. Visit /reset-password with token in URL
      await page.goto("/reset-password?token=test-reset-token-9988");

      // Verify token input is hidden when passed in URL
      await expect(page.locator('[data-testid="reset-token-input"]')).toHaveCount(0);

      // Try mismatched passwords first
      await page.locator('[data-testid="reset-new-password-input"]').fill("NewSecret123!");
      await page.locator('[data-testid="reset-confirm-password-input"]').fill("Different123!");
      await page.locator('[data-testid="reset-submit-btn"]').click();

      // Expect validation alert
      await expect(page.locator('[data-testid="reset-error-alert"]')).toBeVisible();
      await expect(page.locator('[data-testid="reset-error-alert"]')).toContainText("ne correspondent pas");

      // Fix confirm password
      await page.locator('[data-testid="reset-confirm-password-input"]').fill("NewSecret123!");
      await page.locator('[data-testid="reset-submit-btn"]').click();

      // Verify success screen and login button
      await expect(page.locator('[data-testid="reset-success-view"]')).toBeVisible();
      await expect(page.locator('[data-testid="reset-login-btn"]')).toBeVisible();

      expect(capturedResetPayload).not.toBeNull();
      expect(capturedResetPayload.token).toBe("test-reset-token-9988");
      expect(capturedResetPayload.newPassword).toBe("NewSecret123!");
    });
  });
});
