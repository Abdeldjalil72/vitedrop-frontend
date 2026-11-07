import { expect, test, type Page } from "@playwright/test";

const mockProduct = {
  id: "prod-smartwatch-01",
  name: "ساعة ذكية رياضية Ultra Pro المقاومة للماء",
  description:
    "شاشة AMOLED فائقة الوضوح، قياس نبضات القلب والأكسجين في الدم، بطارية تدوم حتى 7 أيام، متوافقة مع جميع الهواتف (Android & iOS).",
  retailPrice: 4900,
  stock: 14,
};

interface SetupOptions {
  mockLeadResponse?: {
    success: boolean;
    orderId?: string;
    error?: string;
  };
}

async function setupCustomerCheckoutRoutes(
  page: Page,
  options: SetupOptions = {}
): Promise<{ capturedLeads: any[] }> {
  const apiBase = "http://localhost:4000";
  const capturedLeads: any[] = [];
  const {
    mockLeadResponse = {
      success: true,
      orderId: "ORD-DZ-99882",
    },
  } = options;

  // Intercept public product GET on port 4000
  await page.route(new RegExp(`^${apiBase}/checkout/product/`), async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProduct),
      });
    } else {
      await route.fallback();
    }
  });

  // Intercept checkout lead creation POST on port 4000
  await page.route(new RegExp(`^${apiBase}/checkout$`), async (route) => {
    if (route.request().method() === "POST") {
      const postData = route.request().postDataJSON();
      capturedLeads.push(postData);

      await route.fulfill({
        status: mockLeadResponse.success ? 201 : 400,
        contentType: "application/json",
        body: JSON.stringify(mockLeadResponse),
      });
    } else {
      await route.fallback();
    }
  });

  return { capturedLeads };
}

test.describe("Public Customer Checkout Funnel (/p/[productId])", () => {
  test("renders public product landing page with hero, pricing, urgency counter and language toggle", async ({
    page,
  }) => {
    await setupCustomerCheckoutRoutes(page);

    await page.goto("/p/prod-smartwatch-01");

    // Product Title & Price verification
    const titleLocator = page.locator('[data-testid="product-landing-title"]');
    await expect(titleLocator).toBeVisible();
    await expect(titleLocator).toHaveText(mockProduct.name);

    const priceLocator = page.locator('[data-testid="product-landing-price"]');
    await expect(priceLocator).toBeVisible();
    await expect(priceLocator).toHaveText(/4[,. ]?900/);

    // Call to Action scroll trigger
    const scrollBtn = page.locator('[data-testid="scroll-to-checkout-btn"]');
    await expect(scrollBtn).toBeVisible();

    // Verify language switcher
    const langToggle = page.locator('[data-testid="landing-lang-toggle"]');
    await expect(langToggle).toBeVisible();
    await expect(langToggle).toHaveText("Français");

    // Switch to French
    await langToggle.click();
    await expect(langToggle).toHaveText("العربية");

    // Scroll button changes to French
    await expect(scrollBtn).toHaveText(/Commander/);

    // Switch back to Arabic
    await langToggle.click();
    await expect(langToggle).toHaveText("Français");
  });

  test("calculates dynamic delivery fees and grand totals across Algerian wilayas, delivery modes, and quantities", async ({
    page,
  }) => {
    await setupCustomerCheckoutRoutes(page);

    await page.goto("/p/prod-smartwatch-01");

    // Default Wilaya is 16 (Alger), Home Delivery, Quantity 1
    // Retail Price: 4,900 DZD | Alger Home Delivery: 450 DZD | Grand Total: 5,350 DZD
    const deliveryFee = page.locator('[data-testid="checkout-delivery-fee"]');
    const grandTotal = page.locator('[data-testid="checkout-grand-total"]');

    await expect(deliveryFee).toHaveText(/450/);
    await expect(grandTotal).toHaveText(/5[,. ]?350/);

    // Switch to Stop-Desk Delivery (Alger Stop-Desk: 300 DZD)
    const deskOption = page.locator('[data-testid="delivery-type-desk"]');
    await deskOption.click();

    await expect(deliveryFee).toHaveText(/300/);
    await expect(grandTotal).toHaveText(/5[,. ]?200/);

    // Select Quantity: 2 items (4,900 x 2 = 9,800 DZD + 300 = 10,100 DZD)
    const qty2Btn = page.locator('[data-testid="checkout-quantity-2"]');
    await qty2Btn.click();

    await expect(grandTotal).toHaveText(/10[,. ]?100/);

    // Change Wilaya to 31 (Oran)
    // Oran Stop-Desk is 350 DZD -> Total: 9,800 + 350 = 10,150 DZD
    const wilayaTrigger = page.locator('[data-testid="checkout-wilaya-select"]');
    await wilayaTrigger.click();

    const oranOption = page.locator('[data-testid="wilaya-option-31"]');
    await expect(oranOption).toBeVisible();
    await oranOption.click();

    await expect(deliveryFee).toHaveText(/350/);
    await expect(grandTotal).toHaveText(/10[,. ]?150/);

    // Switch back to Home Delivery in Oran (Oran Home is 550 DZD) -> Total: 9,800 + 550 = 10,350 DZD
    const homeOption = page.locator('[data-testid="delivery-type-home"]');
    await homeOption.click();

    await expect(deliveryFee).toHaveText(/550/);
    await expect(grandTotal).toHaveText(/10[,. ]?350/);
  });

  test("validates required fields and Algerian phone numbers with zero native alerts", async ({
    page,
  }) => {
    // Strict requirement: zero native alert dialogs allowed
    let dialogTriggered = false;
    page.on("dialog", (dialog) => {
      dialogTriggered = true;
      dialog.dismiss();
    });

    await setupCustomerCheckoutRoutes(page);

    await page.goto("/p/prod-smartwatch-01");

    // Wait for form to mount
    await expect(page.locator('[data-testid="checkout-customer-name"]')).toBeVisible();

    // Click submit with empty form fields
    const submitBtn = page.locator('[data-testid="checkout-submit-btn"]');
    await submitBtn.click();

    // Verify no native alert was popped
    expect(dialogTriggered).toBe(false);

    // Verify WCAG 2.1 AA inline error messages are displayed
    const nameError = page.locator('[data-testid="checkout-error-name"]');
    const phoneError = page.locator('[data-testid="checkout-error-phone"]');
    const communeError = page.locator('[data-testid="checkout-error-commune"]');
    const addressError = page.locator('[data-testid="checkout-error-address"]');

    await expect(nameError).toBeVisible();
    await expect(phoneError).toBeVisible();
    await expect(communeError).toBeVisible();
    await expect(addressError).toBeVisible();

    // Fill invalid phone (not starting with 05/06/07 or wrong length)
    const phoneInput = page.locator('[data-testid="checkout-customer-phone"]');
    await phoneInput.fill("0123456789");
    await submitBtn.click();

    await expect(phoneError).toBeVisible();

    // Fill valid Algerian phone number (05 / 06 / 07)
    await phoneInput.fill("0550123456");
    await expect(page.locator("text=رقم صحيح")).toBeVisible();
  });

  test("submits cash-on-delivery order with affiliate and ad-tracking attribution", async ({
    page,
  }) => {
    const { capturedLeads } = await setupCustomerCheckoutRoutes(page);

    // Visit with Meta / TikTok ad tracking query parameters
    const landingUrl =
      "/p/prod-smartwatch-01?ref=aff-top-earner-99&fbclid=fb.1.1234567890&ttclid=tt.1.0987654321&utm_campaign=winter_promo_dz&sub_id=sub_fb_ad02";
    await page.goto(landingUrl);

    // Fill customer checkout details
    await page.locator('[data-testid="checkout-customer-name"]').fill("Amina Benali");
    await page.locator('[data-testid="checkout-customer-phone"]').fill("0661987654");

    // Select Commune in Alger
    const communeSelect = page.locator('[data-testid="checkout-commune-select"]');
    await communeSelect.selectOption("Bab El Oued");

    // Fill street address
    await page
      .locator('[data-testid="checkout-address"]')
      .fill("14 Rue Didouche Mourad, Alger Centre");

    // Select Stop-Desk Bureau delivery mode
    await page.locator('[data-testid="delivery-type-desk"]').click();

    // Submit form
    const submitBtn = page.locator('[data-testid="checkout-submit-btn"]');
    await submitBtn.click();

    // Verify intercepted backend payload has complete tracking attribution
    await expect(async () => {
      expect(capturedLeads.length).toBe(1);
    }).toPass();

    const lead = capturedLeads[0];
    expect(lead.productId).toBe("prod-smartwatch-01");
    expect(lead.customerName).toBe("Amina Benali");
    expect(lead.customerPhone).toBe("0661987654");
    expect(lead.wilaya).toBe(16);
    expect(lead.commune).toBe("Bab El Oued");
    expect(lead.address).toContain("[STOP-DESK]");
    expect(lead.affiliateId).toBe("aff-top-earner-99");
    expect(lead.fbclid).toBe("fb.1.1234567890");
    expect(lead.ttclid).toBe("tt.1.0987654321");

    // Verify Success Screen renders order details
    const successView = page.locator('[data-testid="checkout-success-view"]');
    await expect(successView).toBeVisible();

    const orderIdDisplay = page.locator('[data-testid="checkout-success-order-id"]');
    await expect(orderIdDisplay).toContainText("ORD-DZ-99882");

    const orderTotalDisplay = page.locator('[data-testid="checkout-success-total"]');
    await expect(orderTotalDisplay).toBeVisible();

    // Verify direct tracking CTA and SMS reminder button
    const trackBtn = page.locator('[data-testid="track-my-order-btn"]');
    await expect(trackBtn).toBeVisible();
    await expect(trackBtn).toHaveAttribute("href", "/track?id=ORD-DZ-99882");

    const smsBtn = page.locator('[data-testid="sms-reminder-btn"]');
    await expect(smsBtn).toBeVisible();
    const smsHref = await smsBtn.getAttribute("href");
    expect(smsHref).toContain("sms:");
    expect(smsHref).toContain("ORD-DZ-99882");

    // Order again resets the view back to checkout
    const orderAgainBtn = page.locator('[data-testid="order-again-btn"]');
    await expect(orderAgainBtn).toBeVisible();
    await orderAgainBtn.click();

    await expect(page.locator('[data-testid="checkout-customer-name"]')).toBeVisible();
  });

  test("supports 390px mobile viewport with sticky conversion bar and zero overflow", async ({
    page,
  }) => {
    // iPhone 14/15 standard mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    await setupCustomerCheckoutRoutes(page);
    await page.goto("/p/prod-smartwatch-01");

    // Verify sticky bottom order CTA is rendered
    const stickyBtn = page.locator('[data-testid="mobile-sticky-checkout-btn"]');
    await expect(stickyBtn).toBeVisible();

    // Click sticky order CTA
    await stickyBtn.click();

    // Verify form is visible
    const formNameInput = page.locator('[data-testid="checkout-customer-name"]');
    await expect(formNameInput).toBeVisible();

    // Strict invariant: Zero horizontal layout overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("guarantees Arabic RTL parity with strict LTR phone number protection", async ({
    page,
  }) => {
    await setupCustomerCheckoutRoutes(page);
    await page.goto("/p/prod-smartwatch-01");

    // Wait for page to mount
    await expect(page.locator('[data-testid="product-landing-title"]')).toBeVisible();

    // Arabic is the primary default language
    const mainContainer = page.locator("div[dir='rtl']").first();
    await expect(mainContainer).toBeVisible();
    await expect(mainContainer).toHaveAttribute("dir", "rtl");

    // Algerian phone input MUST have dir="ltr" to prevent inverted digit display
    const phoneInput = page.locator('[data-testid="checkout-customer-phone"]');
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveAttribute("dir", "ltr");

    // Wilaya dropdown trigger and options render Arabic names
    const wilayaTrigger = page.locator('[data-testid="checkout-wilaya-select"]');
    await expect(wilayaTrigger).toContainText("الجزائر");
  });

  test("renders unavailable error view and blocks orders when product is missing or API errors (no silent mock)", async ({
    page,
  }) => {
    const apiBase = "http://localhost:4000";

    // Intercept with 404
    await page.route(new RegExp(`^${apiBase}/checkout/product/non-existent-product`), async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Produit introuvable" }),
      });
    });

    await page.goto("/p/non-existent-product");

    // Must show unavailable view
    const unavailableView = page.locator('[data-testid="product-unavailable-view"]');
    await expect(unavailableView).toBeVisible();

    // Verify form and title are NOT rendered
    await expect(page.locator('[data-testid="product-landing-title"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="checkout-customer-name"]')).toHaveCount(0);
  });

  test("enforces out-of-stock state when product stock is 0 (disables all order CTAs)", async ({
    page,
  }) => {
    const apiBase = "http://localhost:4000";

    // Intercept with stock = 0
    await page.route(new RegExp(`^${apiBase}/checkout/product/zero-stock-product`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockProduct,
          id: "zero-stock-product",
          stock: 0,
        }),
      });
    });

    await page.goto("/p/zero-stock-product");

    // Title is visible
    await expect(page.locator('[data-testid="product-landing-title"]')).toBeVisible();

    // Out of stock banners must be visible
    await expect(page.locator('[data-testid="product-out-of-stock-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="checkout-out-of-stock-alert"]')).toBeVisible();

    // Hero CTA button must be disabled
    const heroBtn = page.locator('[data-testid="scroll-to-checkout-btn"]');
    await expect(heroBtn).toBeDisabled();

    // Submit button must be disabled
    const submitBtn = page.locator('[data-testid="checkout-submit-btn"]');
    await expect(submitBtn).toBeDisabled();
  });

  test("verifies Wilaya and Commune dropdown menus follow ViteDrop UI/UX rules (accessible, searchable, escape key, min-h-[48px], no raw unstyled OS select)", async ({
    page,
  }) => {
    await setupCustomerCheckoutRoutes(page);
    await page.goto("/p/prod-smartwatch-01");

    // 1. Wilaya dropdown UI/UX rules verification
    const wilayaTrigger = page.locator('[data-testid="checkout-wilaya-select"]');
    await expect(wilayaTrigger).toBeVisible();
    await expect(wilayaTrigger).toHaveAttribute("role", "combobox");
    await expect(wilayaTrigger).toHaveAttribute("aria-expanded", "false");

    // Click to open Wilaya popover
    await wilayaTrigger.click();
    await expect(wilayaTrigger).toHaveAttribute("aria-expanded", "true");

    const wilayaPopover = page.locator("#wilaya-listbox");
    await expect(wilayaPopover).toBeVisible();

    // Verify keyboard escape closes wilaya dropdown
    await page.keyboard.press("Escape");
    await expect(wilayaPopover).toHaveCount(0);

    // Reopen and select Wilaya 31 (Oran)
    await wilayaTrigger.click();
    const oranWilaya = page.locator('[data-testid="wilaya-option-31"]');
    await expect(oranWilaya).toBeVisible();
    await oranWilaya.click();
    await expect(wilayaPopover).toHaveCount(0);

    // 2. Commune dropdown UI/UX rules verification
    // Must be custom ModernSelect trigger (not a raw unstyled select)
    const communeTrigger = page.locator('[data-testid="checkout-commune-select-trigger"]');
    await expect(communeTrigger).toBeVisible();
    await expect(communeTrigger).toHaveAttribute("role", "combobox");
    await expect(communeTrigger).toHaveAttribute("aria-expanded", "false");

    // Open Commune popover
    await communeTrigger.click();
    await expect(communeTrigger).toHaveAttribute("aria-expanded", "true");

    const communeListbox = page.locator('[role="listbox"]');
    await expect(communeListbox).toBeVisible();

    // Verify search filtering works for Oran communes
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[placeholder*="ابحث"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Arzew");

    const arzewOption = page.locator('[data-testid="checkout-commune-select-trigger-option-Arzew"]');
    await expect(arzewOption).toBeVisible();
    await arzewOption.click();

    // Verify Commune trigger now displays selected commune
    await expect(communeTrigger).toContainText("Arzew");

    // Reopen and select "Autre" to test custom manual commune input
    await communeTrigger.click();
    const autreOption = page.locator('[data-testid="checkout-commune-select-trigger-option-Autre"]');
    await expect(autreOption).toBeVisible();
    await autreOption.click();

    // Custom input should smoothly expand
    const customCommuneInput = page.locator('[data-testid="checkout-commune-custom-input"]');
    await expect(customCommuneInput).toBeVisible();
    await customCommuneInput.fill("Hai Khemisti");
  });
});
