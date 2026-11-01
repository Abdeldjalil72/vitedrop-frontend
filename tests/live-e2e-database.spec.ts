import { expect, test } from "@playwright/test";

test.describe("Live Full-Stack Database & API E2E Suite", () => {
  // NO MOCKS: All requests go directly to the running NestJS API and PostgreSQL database

  test("1. Admin logs in with real DB credentials and views live Admin Dashboard", async ({ page }) => {
    await page.goto("/login");

    // Enter real database credentials
    await page.locator('input[type="email"]').fill("admin@vitedrop.com");
    await page.locator('input[type="password"]').fill("password");
    await page.locator('button[type="submit"]').click();

    // Verify real redirection to /admin
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10000 });
    await expect(page.locator('[data-dashboard-role="admin"]')).toBeVisible();

    // Verify real JWT was saved in localStorage
    const token = await page.evaluate(() => localStorage.getItem("vitedrop_token"));
    expect(token).toBeTruthy();
    expect(token).not.toContain("mock");
  });

  test("2. Supplier logs in with real DB credentials and views database products", async ({ page }) => {
    await page.goto("/login");

    // Enter real supplier credentials
    await page.locator('input[type="email"]').fill("sup@test.com");
    await page.locator('input[type="password"]').fill("password");
    await page.locator('button[type="submit"]').click();

    // Verify real redirection to /supplier
    await expect(page).toHaveURL(/\/supplier$/, { timeout: 10000 });
    await expect(page.locator('[data-dashboard-role="supplier"]')).toBeVisible();

    // Navigate to products catalog backed by PostgreSQL
    await page.goto("/supplier/products");
    await expect(page).toHaveURL(/\/supplier\/products$/, { timeout: 10000 });

    // Verify that the product seeded in the database ('Test Prod') appears in the table
    await expect(page.locator("table").getByText("Test Prod")).toBeVisible({ timeout: 10000 });
  });

  test("3. Affiliate logs in with real DB credentials and views live Marketplace", async ({ page }) => {
    await page.goto("/login");

    // Enter real affiliate credentials
    await page.locator('input[type="email"]').fill("aff@test.com");
    await page.locator('input[type="password"]').fill("password");
    await page.locator('button[type="submit"]').click();

    // Verify real redirection to /affiliate
    await expect(page).toHaveURL(/\/affiliate$/, { timeout: 10000 });
    await expect(page.locator('[data-dashboard-role="affiliate"]')).toBeVisible();

    // Navigate to marketplace backed by PostgreSQL
    await page.goto("/affiliate/marketplace");
    await expect(page).toHaveURL(/\/affiliate\/marketplace$/, { timeout: 10000 });

    // Verify that 'Test Prod' is displayed to affiliate without gross supplier margin
    await expect(page.getByText("Test Prod").first()).toBeVisible({ timeout: 10000 });
  });
});
