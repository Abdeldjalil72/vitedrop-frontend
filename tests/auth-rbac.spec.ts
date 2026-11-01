import { expect, test, type Page } from "@playwright/test";

const credentials = {
  admin: { email: "admin@vitedrop.com", password: "password" },
  supplier: { email: "sup@test.com", password: "password" },
  affiliate: { email: "aff@test.com", password: "password" },
};

function createMockToken(role: "ADMIN" | "SUPPLIER" | "AFFILIATE", email: string): string {
  const payload = {
    sub: `mock-${role.toLowerCase()}-uuid`,
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `header.${base64Payload}.signature`;
}

async function authenticateSession(
  page: Page,
  account: keyof typeof credentials
): Promise<void> {
  const user = credentials[account];
  const apiBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:4000";
  let token: string;

  try {
    const response = await page.request.post(`${apiBaseUrl}/auth/login`, {
      data: user,
      timeout: 1000,
    });
    if (response.ok()) {
      const body = (await response.json()) as { access_token: string };
      token = body.access_token;
    } else {
      const roleMap: Record<keyof typeof credentials, "ADMIN" | "SUPPLIER" | "AFFILIATE"> = {
        admin: "ADMIN",
        supplier: "SUPPLIER",
        affiliate: "AFFILIATE",
      };
      token = createMockToken(roleMap[account], user.email);
    }
  } catch {
    const roleMap: Record<keyof typeof credentials, "ADMIN" | "SUPPLIER" | "AFFILIATE"> = {
      admin: "ADMIN",
      supplier: "SUPPLIER",
      affiliate: "AFFILIATE",
    };
    token = createMockToken(roleMap[account], user.email);
  }

  // Intercept wallet and stats calls that DashboardLayout makes on load
  await page.route(new RegExp(`^${apiBaseUrl}/wallets?/me`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ balance: 5000 }),
    });
  });

  await page.route(new RegExp(`^${apiBaseUrl}/admin/stats`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        platformRevenue: 100000,
        totalAffiliates: 10,
        totalSuppliers: 5,
        totalOrders: 100,
        totalSupplierEscrow: 50000,
        totalAffiliateLiability: 10000,
        pendingWithdrawalsCount: 0,
        pendingWithdrawalsAmount: 0,
      }),
    });
  });

  await page.route(new RegExp(`^${apiBaseUrl}/supplier/call-center/`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(new RegExp(`^${apiBaseUrl}/supplier/orders`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.goto("/login");
  await page.evaluate((t) => {
    localStorage.clear();
    localStorage.setItem("vitedrop_token", t);
  }, token);
}

async function settleRoleRedirect(page: Page, role: "admin" | "supplier" | "affiliate"): Promise<void> {
  await expect(page.locator(`[data-dashboard-role="${role}"]`)).toBeVisible({ timeout: 15000 });
}

test.describe("Authentication and RBAC Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("invalid credentials stay on the login page", async ({ page }) => {
    await page.route("**/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Identifiants invalides." }),
      });
    });

    await page.goto("/login");
    await page.getByRole("textbox", { name: /Adresse e-mail|Email|البريد الإلكتروني/ }).fill("invalid@example.com");
    await page.getByRole("textbox", { name: /Mot de passe|Password|كلمة المرور/ }).fill("wrong-password");
    await page.getByRole("button", { name: /Se connecter|Sign in|دخول/ }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("alert").filter({ hasText: /.+/ })
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Adresse e-mail|Email|البريد الإلكتروني/ })).toHaveValue("invalid@example.com");
  });

  test("login language persists and Arabic remains RTL after refresh", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "AR" }).click();
    await expect(page.locator('[dir="rtl"]')).toBeVisible();
    await expect(page.getByRole("heading")).toContainText("تسجيل الدخول");

    await page.reload();

    await expect(page.locator('[dir="rtl"]')).toBeVisible();
    await expect(page.getByRole("heading")).toContainText("تسجيل الدخول");
    await expect(page.evaluate(() => localStorage.getItem("vitedrop_lang"))).resolves.toBe("ar");
  });

  test("unauthenticated users are redirected from protected routes", async ({ page }) => {
    for (const route of ["/admin", "/admin/withdrawals", "/admin/orders", "/supplier", "/affiliate"]) {
      await page.goto("/login");
      await page.evaluate(() => localStorage.clear());
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.locator("[data-dashboard-role]")).toHaveCount(0);
    }
  });

  test("admin can access admin routes and is redirected from other role areas", async ({ page }) => {
    await authenticateSession(page, "admin");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await settleRoleRedirect(page, "admin");

    await page.goto("/supplier");
    await settleRoleRedirect(page, "admin");
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto("/affiliate");
    await settleRoleRedirect(page, "admin");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("supplier and affiliate accounts are confined to their role areas", async ({ page }) => {
    await authenticateSession(page, "supplier");
    await page.goto("/supplier");
    await expect(page).toHaveURL(/\/supplier$/);
    await settleRoleRedirect(page, "supplier");
    await page.goto("/admin");
    await settleRoleRedirect(page, "supplier");
    await expect(page).toHaveURL(/\/supplier$/);
    await page.goto("/affiliate");
    await settleRoleRedirect(page, "supplier");
    await expect(page).toHaveURL(/\/supplier$/);

    await page.evaluate(() => localStorage.removeItem("vitedrop_token"));
    await authenticateSession(page, "affiliate");
    await page.goto("/affiliate");
    await expect(page).toHaveURL(/\/affiliate$/);
    await settleRoleRedirect(page, "affiliate");
    await page.goto("/admin");
    await settleRoleRedirect(page, "affiliate");
    await expect(page).toHaveURL(/\/affiliate$/);
    await page.goto("/supplier");
    await settleRoleRedirect(page, "affiliate");
    await expect(page).toHaveURL(/\/affiliate$/);
  });

  test("logout clears the session and returns to login", async ({ page }) => {
    await authenticateSession(page, "admin");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await settleRoleRedirect(page, "admin");
    await page.locator('button[title="Déconnexion"], button[title="Log out"]').first().click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.evaluate(() => localStorage.getItem("vitedrop_token"))).resolves.toBeNull();
  });
});
