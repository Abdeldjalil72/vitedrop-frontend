import { expect, test } from "@playwright/test";

function createMockToken(role: "AFFILIATE" | "SUPPLIER" | "ADMIN" = "AFFILIATE"): string {
  const payload = {
    sub: "user-qa-uuid",
    email: role === "AFFILIATE" ? "buyer@vitedrop.com" : role === "SUPPLIER" ? "supplier@vitedrop.com" : "admin@vitedrop.com",
    role,
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `header.${base64Payload}.signature`;
}

test.describe("Homepage Mobile Navigation & Sliding Drawer Audit Parity", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies & storage
    await page.context().clearCookies();
  });

  test("displays mobile navbar Sign In shortcut on mobile viewport (390x844)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Mobile Sign In shortcut in navbar must be visible
    const mobileNavLogin = page.locator('[data-testid="mobile-nav-login-btn"]');
    await expect(mobileNavLogin).toBeVisible();
    await expect(mobileNavLogin).toHaveAttribute("href", "/login");

    // Desktop nav links container should be hidden on mobile
    const desktopLogin = page.locator('[data-testid="nav-login-link"]');
    await expect(desktopLogin).toBeHidden();
  });

  test("opens sliding side drawer on mobile with full authentication options and fast links", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Click menu toggle button
    const menuToggle = page.locator('[data-testid="nav-menu-toggle-btn"]');
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    // Verify sliding drawer opens with close button
    const drawerClose = page.locator('[data-testid="drawer-close-btn"]');
    await expect(drawerClose).toBeVisible();

    // Verify unauthenticated drawer provides both Sign In and Register buttons
    const drawerLogin = page.locator('[data-testid="drawer-login-btn"]');
    const drawerRegister = page.locator('[data-testid="drawer-register-btn"]');
    await expect(drawerLogin).toBeVisible();
    await expect(drawerRegister).toBeVisible();
    await expect(drawerLogin).toHaveAttribute("href", "/login");
    await expect(drawerRegister).toHaveAttribute("href", "/register");

    // Verify track order link exists in drawer
    const trackOrderLink = page.locator('a[href="/track"]');
    await expect(trackOrderLink).toBeVisible();

    // Close drawer via close button
    await drawerClose.click();
    await expect(drawerClose).toBeHidden();
  });

  test("displays role-aware dashboard button in navbar and drawer when logged in", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Seed mock token in localStorage before navigation
    const mockToken = createMockToken("AFFILIATE");
    await page.addInitScript((token) => {
      localStorage.setItem("vitedrop_token", token);
    }, mockToken);

    await page.goto("/");

    // Verify mobile navbar displays Dashboard pill with active pulse
    const mobileDashboardBtn = page.locator('[data-testid="mobile-nav-dashboard-btn"]');
    await expect(mobileDashboardBtn).toBeVisible();
    await expect(mobileDashboardBtn).toHaveAttribute("href", "/affiliate");

    // Open drawer
    await page.locator('[data-testid="nav-menu-toggle-btn"]').click();

    // Verify drawer displays authenticated user card with role badge and dashboard shortcut
    const drawerDashboardBtn = page.locator('[data-testid="drawer-dashboard-btn"]');
    await expect(drawerDashboardBtn).toBeVisible();
    await expect(drawerDashboardBtn).toHaveAttribute("href", "/affiliate");
    await expect(page.locator("text=buyer@vitedrop.com")).toBeVisible();
  });
});

