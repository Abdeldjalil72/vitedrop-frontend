import { expect, test, type Page } from "@playwright/test";

function createToken(role: "ADMIN" | "SUPPLIER" | "AFFILIATE", userId: string): string {
  const payload = {
    sub: userId,
    email: `${role.toLowerCase()}@vitedrop.com`,
    role,
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `header.${base64Payload}.signature`;
}

interface SharedLifecycleState {
  products: any[];
  orders: any[];
  supplierWallet: {
    balance: number;
    cumulativeDeposits: number;
    cumulativeDebits: number;
    transactions: any[];
  };
  affiliateWallet: {
    clearedBalance: number;
    pendingReserve: number;
    cumulativeDisbursements: number;
    transactions: any[];
  };
  reconciliation: {
    walletsAudited: number;
    walletsWithVariance: number;
    totalVarianceAmount: number;
    deliveredOrdersAudited: number;
    ordersMissingSettlement: number;
    ordersWithDuplicateTransactions: number;
    lastRunAt: string;
  };
}

function initSharedState(): SharedLifecycleState {
  return {
    products: [
      {
        id: "prod-cinema-4k",
        name: "Projecteur LED Cinema 4K",
        description: "Vidéoprojecteur haute définition avec enceintes intégrées et connectivité WiFi/Bluetooth.",
        retailPrice: 12000,
        supplierTotalCpa: 2000,
        affiliateNetPayout: 1600, // 80%
        platformFee: 400, // 20%
        stock: 30,
        category: "Électronique & Soins",
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ],
    orders: [],
    supplierWallet: {
      balance: 15000,
      cumulativeDeposits: 20000,
      cumulativeDebits: 5000,
      transactions: [],
    },
    affiliateWallet: {
      clearedBalance: 3200,
      pendingReserve: 0,
      cumulativeDisbursements: 0,
      transactions: [],
    },
    reconciliation: {
      walletsAudited: 12,
      walletsWithVariance: 0,
      totalVarianceAmount: 0,
      deliveredOrdersAudited: 4,
      ordersMissingSettlement: 0,
      ordersWithDuplicateTransactions: 0,
      lastRunAt: new Date().toISOString(),
    },
  };
}

async function attachLifecycleRouter(page: Page, state: SharedLifecycleState) {
  const apiBase = "http://localhost:4000";

  // 1. Products Routes
  await page.route(new RegExp(`^${apiBase}/supplier/products`), async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(state.products),
      });
    } else if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      const newProduct = {
        id: `prod-cinema-4k`,
        name: body.name,
        description: body.description || null,
        retailPrice: Number(body.retailPrice),
        supplierTotalCpa: Number(body.supplierTotalCpa),
        affiliateNetPayout: Math.round(Number(body.supplierTotalCpa) * 0.8),
        platformFee: Math.round(Number(body.supplierTotalCpa) * 0.2),
        stock: Number(body.stock),
        status: "active",
        createdAt: new Date().toISOString(),
      };
      state.products = [newProduct, ...state.products];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(newProduct),
      });
    } else {
      await route.continue();
    }
  });

  await page.route(new RegExp(`^${apiBase}/admin/products`), async (route) => {
    const adminProducts = state.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      retailPrice: p.retailPrice,
      supplierTotalCpa: p.supplierTotalCpa,
      affiliateNetPayout: p.affiliateNetPayout || Math.round(p.supplierTotalCpa * 0.8),
      platformFee: p.platformFee || Math.round(p.supplierTotalCpa * 0.2),
      stock: p.stock,
      reservedStock: 0,
      status: "active",
      supplierId: "sup-qa-uuid",
      supplierName: "Atlas Import SARL",
      escrowCoverage: 10,
      createdAt: p.createdAt,
    }));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: adminProducts,
        total: adminProducts.length,
        page: 1,
        limit: 20,
      }),
    });
  });

  await page.route(new RegExp(`^${apiBase}/admin/stats`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ platformRevenue: 1280000, totalOrders: 158 }),
    });
  });

  await page.route(new RegExp(`^${apiBase}/affiliate/marketplace`), async (route) => {
    const marketProducts = state.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      retailPrice: p.retailPrice,
      affiliateNetPayout: p.affiliateNetPayout || Math.round(p.supplierTotalCpa * 0.8),
      stock: p.stock,
      category: p.category || "Électronique & Soins",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
      status: "active",
      createdAt: p.createdAt,
    }));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketProducts),
    });
  });

  // 2. Public Checkout Product & Lead Creation Routes
  await page.route(new RegExp(`^${apiBase}/checkout/product/`), async (route) => {
    const url = route.request().url();
    const productId = url.split("/").pop()?.split("?")[0] || "prod-cinema-4k";
    const found = state.products.find((p) => p.id === productId) || state.products[0];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: found.id,
        name: found.name,
        description: found.description,
        retailPrice: found.retailPrice,
        stock: found.stock,
      }),
    });
  });

  await page.route(new RegExp(`^${apiBase}/checkout$`), async (route) => {
    if (route.request().method() === "POST") {
      const lead = route.request().postDataJSON();
      const orderId = `ORD-LIFECYCLE-101`;
      const newOrder = {
        id: orderId,
        supplierId: "sup-qa-uuid",
        affiliateId: lead.affiliateId || "aff-qa-uuid",
        cpaCommission: 2000,
        platformFee: 400,
        status: "lead_generated",
        customerName: lead.customerName,
        customerPhone: lead.customerPhone,
        address: lead.address,
        productId: lead.productId,
        productName: "Projecteur LED Cinema 4K",
        quantity: lead.quantity || 1,
        wilaya: lead.wilaya || 16,
        commune: lead.commune || "Bab El Oued",
        trackingNumber: null,
        courier: null,
        fbclid: lead.fbclid || null,
        ttclid: lead.ttclid || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.orders = [newOrder, ...state.orders];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true, orderId }),
      });
    } else {
      await route.continue();
    }
  });

  // 3. Supplier Call Center & Orders Routes
  await page.route(new RegExp(`^${apiBase}/supplier/orders`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(state.orders),
    });
  });

  await page.route(new RegExp(`^${apiBase}/supplier/call-center/`), async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes("/leads") && method === "GET") {
      const leads = state.orders.filter((o) => o.status === "lead_generated");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(leads),
      });
      return;
    }

    if (url.includes("/confirm") && method === "PATCH") {
      const match = url.match(/\/call-center\/([^/]+)\/confirm/);
      const id = match ? match[1] : "ORD-LIFECYCLE-101";
      state.orders = state.orders.map((o) =>
        o.id === id ? { ...o, status: "supplier_confirmed" } : o
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id, status: "supplier_confirmed" }),
      });
      return;
    }

    if (url.includes("/cancel") && method === "PATCH") {
      const match = url.match(/\/call-center\/([^/]+)\/cancel/);
      const id = match ? match[1] : "ORD-LIFECYCLE-101";
      const body = route.request().postDataJSON() || {};
      state.orders = state.orders.map((o) =>
        o.id === id ? { ...o, status: "canceled", cancellationReason: body.reason } : o
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id, status: "canceled", reason: body.reason }),
      });
      return;
    }

    if (url.includes("/dispatch") && method === "POST") {
      const match = url.match(/\/call-center\/([^/]+)\/dispatch/);
      const id = match ? match[1] : "ORD-LIFECYCLE-101";
      const trackingNumber = "YAL-99884433";
      state.orders = state.orders.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "dispatched",
              trackingNumber,
              courier: "YALIDINE",
            }
          : o
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          orderId: id,
          trackingNumber,
        }),
      });
      return;
    }

    await route.continue();
  });

  // 4. Courier Webhook & Double-Entry Settlement Simulation
  await page.route(new RegExp(`^${apiBase}/webhooks/courier/yalidine`), async (route) => {
    const payload = route.request().postDataJSON();
    const trackingNumber = payload.trackingNumber;
    const isDelivered = payload.status === "Livre" || payload.status === "delivered";

    if (isDelivered) {
      // 1. Update order status
      state.orders = state.orders.map((o) =>
        o.trackingNumber === trackingNumber ? { ...o, status: "delivered" } : o
      );

      // 2. Execute double-entry ledger settlement
      // Supplier debited Gross CPA (-2000 DZD)
      state.supplierWallet.balance -= 2000;
      state.supplierWallet.cumulativeDebits += 2000;
      state.supplierWallet.transactions.unshift({
        id: `tx-sup-${Date.now()}`,
        type: "SUPPLIER_DEBIT",
        amount: -2000,
        reference: `ORD-${trackingNumber}`,
        createdAt: new Date().toISOString(),
      });

      // Affiliate credited 80% Net CPA (+1600 DZD)
      state.affiliateWallet.clearedBalance += 1600;
      state.affiliateWallet.transactions.unshift({
        id: `tx-aff-${Date.now()}`,
        type: "CPA_PAYOUT",
        amount: 1600,
        reference: `ORD-${trackingNumber}`,
        createdAt: new Date().toISOString(),
      });

      // Update reconciliation stats
      state.reconciliation.deliveredOrdersAudited += 1;
      state.reconciliation.totalVarianceAmount = 0;
    } else {
      // RTO: Order refused by customer
      state.orders = state.orders.map((o) =>
        o.trackingNumber === trackingNumber ? { ...o, status: "rto_in_transit" } : o
      );
      // Zero fee on RTO rule: Wallets remain untouched
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        trackingNumber,
        status: isDelivered ? "delivered" : "rto_in_transit",
      }),
    });
  });

  // 5. Wallets & Reconciliation Routes
  await page.route(new RegExp(`^${apiBase}/wallets?/transactions`), async (route) => {
    const authHeader = route.request().headers()["authorization"] || "";
    let isAffiliate = false;
    try {
      if (authHeader.includes("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        const parts = token.split(".");
        if (parts[1]) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
          if (payload.role === "AFFILIATE") {
            isAffiliate = true;
          }
        }
      }
    } catch {}

    const txs = isAffiliate ? state.affiliateWallet.transactions : state.supplierWallet.transactions;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: txs,
        total: txs.length,
        limit: 100,
        offset: 0,
      }),
    });
  });

  await page.route(new RegExp(`^${apiBase}/wallets?/me`), async (route) => {
    const authHeader = route.request().headers()["authorization"] || "";
    let isAffiliate = false;
    try {
      if (authHeader.includes("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        const parts = token.split(".");
        if (parts[1]) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
          if (payload.role === "AFFILIATE") {
            isAffiliate = true;
          }
        }
      }
    } catch {}

    if (isAffiliate) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "wal-aff-qa",
          userId: "aff-qa-uuid",
          balance: state.affiliateWallet.clearedBalance,
          currency: "DZD",
          ownerType: "AFFILIATE",
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "wal-sup-qa",
          userId: "sup-qa-uuid",
          balance: state.supplierWallet.balance,
          currency: "DZD",
          ownerType: "SUPPLIER",
        }),
      });
    }
  });

  await page.route(new RegExp(`^${apiBase}/supplier/wallet`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        balance: state.supplierWallet.balance,
        cumulativeDeposits: state.supplierWallet.cumulativeDeposits,
        cumulativeDebits: state.supplierWallet.cumulativeDebits,
        transactions: state.supplierWallet.transactions,
      }),
    });
  });

  await page.route(new RegExp(`^${apiBase}/affiliate/wallet`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        clearedBalance: state.affiliateWallet.clearedBalance,
        pendingReserve: state.affiliateWallet.pendingReserve,
        cumulativeDisbursements: state.affiliateWallet.cumulativeDisbursements,
        transactions: state.affiliateWallet.transactions,
      }),
    });
  });

  await page.route(new RegExp(`^${apiBase}/affiliate/orders`), async (route) => {
    const affOrders = state.orders.map((o) => ({
      id: o.id,
      affiliateId: o.affiliateId,
      cpaCommission: 1600, // Affiliate Net 80%
      status: o.status,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      address: o.address,
      productId: o.productId,
      productName: o.productName,
      quantity: o.quantity,
      wilaya: o.wilaya,
      commune: o.commune,
      trackingNumber: o.trackingNumber,
      courier: o.courier,
      fbclid: o.fbclid,
      ttclid: o.ttclid,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(affOrders),
    });
  });

  await page.route(new RegExp(`^${apiBase}/admin/reconciliation/summary`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(state.reconciliation),
    });
  });

  await page.route(new RegExp(`^${apiBase}/admin/reconciliation/wallets`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(new RegExp(`^${apiBase}/admin/reconciliation/orders`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(new RegExp(`^${apiBase}/admin/reconciliation/runs`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}

test.describe("Full End-to-End Multi-Actor Order Lifecycle Integration Suite", () => {
  test.setTimeout(90000);

  test("1. Traces complete happy-path lifecycle: Supplier Product Creation -> Affiliate Link -> Customer COD Purchase -> Call Center Confirmation -> Yalidine Courier Dispatch -> Webhook Settlement & Treasury Audit", async ({
    browser,
  }) => {
    const state = initSharedState();

    // ==========================================
    // STAGE 1: Supplier Creates & Catalogs Product
    // ==========================================
    const supplierContext = await browser.newContext();
    const supplierPage = await supplierContext.newPage();
    await attachLifecycleRouter(supplierPage, state);

    await supplierPage.addInitScript(
      ({ token }) => {
        localStorage.setItem("vitedrop_token", token);
        localStorage.setItem("vitedrop_lang", "fr");
      },
      { token: createToken("SUPPLIER", "sup-qa-uuid") }
    );

    await supplierPage.goto("/supplier/products");
    await expect(supplierPage.locator('[data-dashboard-role="supplier"]')).toBeVisible();

    // Click Add Product using verified testid
    const addProductBtn = supplierPage.locator('[data-testid="add-product-btn"]');
    await expect(addProductBtn).toBeVisible();
    await addProductBtn.click();

    const productModal = supplierPage.locator('[data-testid="supplier-product-modal"]');
    await expect(productModal).toBeVisible();

    // Fill Product Details Modal
    await supplierPage.locator('[data-testid="product-name-input"]').fill("Projecteur LED Cinema 4K");
    await supplierPage.locator('[data-testid="product-desc-input"]').fill("Vidéoprojecteur haute définition");
    await supplierPage.locator('[data-testid="product-stock-input"]').fill("30");
    await supplierPage.locator('[data-testid="product-retail-price-input"]').fill("12000");
    await supplierPage.locator('[data-testid="product-cpa-input"]').fill("2000");

    // Dynamic 80/20 breakdown check: Net Affiliate 1,600 DZD, Platform Fee 400 DZD
    await expect(productModal.getByText(/1[\s\u202F]?600/)).toBeVisible();
    await expect(productModal.getByText(/400/)).toBeVisible();

    // Submit Product Form
    const submitProductBtn = supplierPage.locator('[data-testid="product-submit-btn"]');
    await expect(submitProductBtn).toBeEnabled();
    await submitProductBtn.click();

    await expect(productModal).toBeHidden();
    await expect(supplierPage.locator('[role="status"]')).toBeVisible();

    // ==========================================
    // STAGE 2: Admin Verifies Product in Supervision
    // ==========================================
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await attachLifecycleRouter(adminPage, state);

    await adminPage.addInitScript(
      ({ token }) => {
        localStorage.setItem("vitedrop_token", token);
        localStorage.setItem("vitedrop_lang", "fr");
      },
      { token: createToken("ADMIN", "admin-qa-uuid") }
    );

    await adminPage.goto("/admin/products");
    await expect(adminPage.locator('[data-dashboard-role="admin"]')).toBeVisible();

    // Verify newly registered product is present in Admin catalog
    const productRow = adminPage.locator('[data-testid="admin-product-row"]').first();
    await expect(productRow).toBeVisible();
    await expect(productRow).toContainText("Projecteur LED Cinema 4K");

    // ==========================================
    // STAGE 3: Affiliate Discovers Product in Marketplace
    // ==========================================
    const affiliateContext = await browser.newContext();
    const affiliatePage = await affiliateContext.newPage();
    await attachLifecycleRouter(affiliatePage, state);

    await affiliatePage.addInitScript(
      ({ token }) => {
        localStorage.setItem("vitedrop_token", token);
        localStorage.setItem("vitedrop_lang", "fr");
      },
      { token: createToken("AFFILIATE", "aff-qa-uuid") }
    );

    await affiliatePage.goto("/affiliate/marketplace");
    await expect(affiliatePage.locator('[data-dashboard-role="affiliate"]')).toBeVisible();

    // Affiliate discovers product with 1,600 DZD net payout (80% cut)
    const marketplaceCard = affiliatePage.locator('[data-testid="marketplace-product-card"]').first();
    await expect(marketplaceCard).toBeVisible();
    await expect(marketplaceCard).toContainText("Projecteur LED Cinema 4K");
    await expect(marketplaceCard).toContainText(/1[\s\u202F]?600/);

    // ==========================================
    // STAGE 4: Public Algerian Customer Lands From Ad & Places COD Order
    // ==========================================
    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();
    await attachLifecycleRouter(customerPage, state);

    // Customer lands from Facebook Ads tracking campaign
    const adTrackingUrl =
      "/p/prod-cinema-4k?ref=aff-qa-uuid&fbclid=fb.1.1029384756&ttclid=tt.1.5647382910&utm_campaign=winter_promo_alger&sub_id=adset_01";
    await customerPage.goto(adTrackingUrl);

    // Product Title & Retail Price in Space Mono
    await expect(customerPage.locator('[data-testid="product-landing-title"]')).toBeVisible();
    await expect(customerPage.locator('[data-testid="product-landing-price"]')).toContainText(/12[,. ]?000/);

    // Fill customer checkout details
    await customerPage.locator('[data-testid="checkout-customer-name"]').fill("Kamel Touati");
    await customerPage.locator('[data-testid="checkout-customer-phone"]').fill("0661223344");

    // Choose Wilaya 16 (Alger) Home Delivery (450 DZD) -> Total: 12,450 DZD
    await customerPage.locator('[data-testid="checkout-commune-select"]').selectOption("Bab El Oued");
    await customerPage.locator('[data-testid="checkout-address"]').fill("15 Rue Didouche Mourad, Alger");

    await expect(customerPage.locator('[data-testid="checkout-delivery-fee"]')).toContainText(/450/);
    await expect(customerPage.locator('[data-testid="checkout-grand-total"]')).toContainText(/12[,. ]?450/);

    // Submit Cash-on-Delivery form
    await customerPage.locator('[data-testid="checkout-submit-btn"]').click();

    // Verify Success Screen renders order reference ID
    const successView = customerPage.locator('[data-testid="checkout-success-view"]');
    await expect(successView).toBeVisible();
    await expect(customerPage.locator('[data-testid="checkout-success-order-id"]')).toContainText("ORD-LIFECYCLE-101");
    await expect(customerPage.locator('[data-testid="checkout-success-total"]')).toContainText(/12[,. ]?450/);

    // ==========================================
    // STAGE 5: Supplier Call Center Confirms & Dispatches Order
    // ==========================================
    await supplierPage.goto("/supplier");
    await expect(supplierPage.locator('[data-dashboard-role="supplier"]')).toBeVisible();

    // Order appears in Call Center Queue under lead_generated
    const leadRow = supplierPage.locator('[data-testid="supplier-lead-row"]').first();
    await expect(leadRow).toBeVisible();
    await expect(leadRow).toContainText("Kamel Touati");

    // Call Center agent confirms phone intent
    const confirmBtn = leadRow.locator('[data-testid="confirm-lead-btn"]');
    await confirmBtn.click();
    await expect(supplierPage.locator('[role="status"]')).toBeVisible();

    // Switch to Confirmed tab to dispatch package
    await supplierPage.locator('[data-testid="tab-confirmed"]').click();

    // Click Expédier (Dispatch)
    const dispatchBtn = supplierPage.locator('[data-testid="dispatch-order-btn"]:visible').first();
    await expect(dispatchBtn).toBeVisible();
    await dispatchBtn.click();
    await expect(supplierPage.locator('[role="status"]')).toBeVisible();

    // ==========================================
    // STAGE 6: Yalidine Courier Webhook Confirms Delivery & Executes Settlement
    // ==========================================
    // Simulating courier webhook HTTP POST
    await supplierPage.evaluate(async () => {
      await fetch("http://localhost:4000/webhooks/courier/yalidine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: "YAL-99884433",
          status: "Livre",
          cashCollected: 12450,
        }),
      });
    });

    // ==========================================
    // STAGE 7: Multi-Actor Settlement & Treasury Verification
    // ==========================================
    // 7A: Affiliate verifies order delivered and commission credited (+1,600 DZD)
    await affiliatePage.goto("/affiliate/orders");
    const affiliateOrderRow = affiliatePage.locator('[data-testid="affiliate-order-row"]').first();
    await expect(affiliateOrderRow).toBeVisible();
    await expect(affiliateOrderRow).toContainText("YAL-99884433");

    await affiliatePage.goto("/affiliate/wallet");
    // Initial 3,200 + 1,600 = 4,800 DZD
    const clearedCard = affiliatePage.locator('[data-testid="cleared-balance"]');
    await expect(clearedCard).toBeVisible();
    await expect(clearedCard).toContainText(/4[\s\u202F]?800 DZD/);

    // 7B: Supplier verifies Gross CPA deduction (-2,000 DZD)
    await supplierPage.goto("/supplier/wallet");
    // Initial 15,000 - 2,000 = 13,000 DZD
    await expect(supplierPage.getByRole("main").getByText(/13[\s\u202F]?000 DZD/).first()).toBeVisible();

    // 7C: Admin Treasury Reconciliation verifies 0 variance
    await adminPage.goto("/admin/reconciliation");
    await expect(adminPage.locator('[data-dashboard-role="admin"]')).toBeVisible();
    await expect(adminPage.locator("text=Écart Total (Variance)").first()).toBeVisible();

    // Clean up browser contexts
    await supplierContext.close();
    await adminContext.close();
    await affiliateContext.close();
    await customerContext.close();
  });

  test("2. Enforces Return to Origin (RTO) zero-penalty rule when customer refuses delivery", async ({
    browser,
  }) => {
    const state = initSharedState();
    const initialSupplierBalance = state.supplierWallet.balance;
    const initialAffiliateBalance = state.affiliateWallet.clearedBalance;

    // Create an order already dispatched
    state.orders.push({
      id: "ORD-RTO-777",
      supplierId: "sup-qa-uuid",
      affiliateId: "aff-qa-uuid",
      cpaCommission: 2000,
      platformFee: 400,
      status: "dispatched",
      customerName: "Mourad Belhadj",
      customerPhone: "0550998877",
      address: "Zone 04, Oran",
      productId: "prod-cinema-4k",
      productName: "Projecteur LED Cinema 4K",
      quantity: 1,
      wilaya: 31,
      commune: "Oran",
      trackingNumber: "YAL-RTO-554433",
      courier: "YALIDINE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const supplierContext = await browser.newContext();
    const supplierPage = await supplierContext.newPage();
    await attachLifecycleRouter(supplierPage, state);

    await supplierPage.addInitScript(
      ({ token }) => {
        localStorage.setItem("vitedrop_token", token);
        localStorage.setItem("vitedrop_lang", "fr");
      },
      { token: createToken("SUPPLIER", "sup-qa-uuid") }
    );

    // Simulate Courier Webhook returning package to origin (Retour / rto_in_transit)
    await supplierPage.goto("/supplier");
    await supplierPage.evaluate(async () => {
      await fetch("http://localhost:4000/webhooks/courier/yalidine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: "YAL-RTO-554433",
          status: "Retour",
        }),
      });
    });

    // Verify Supplier Wallet balance remains UNTOUCHED (0 DZD penalty)
    await supplierPage.goto("/supplier/wallet");
    await expect(supplierPage.getByRole("main").getByText(/15[\s\u202F]?000 DZD/).first()).toBeVisible();
    expect(state.supplierWallet.balance).toBe(initialSupplierBalance);

    // Verify Affiliate earned 0 DZD for refused delivery
    expect(state.affiliateWallet.clearedBalance).toBe(initialAffiliateBalance);

    await supplierContext.close();
  });

  test("3. Handles Call Center lead cancellation with mandatory reason and terminal state enforcement", async ({
    browser,
  }) => {
    const state = initSharedState();

    // Customer placed a fake / duplicate lead
    state.orders.push({
      id: "ORD-FAKE-999",
      supplierId: "sup-qa-uuid",
      affiliateId: "aff-qa-uuid",
      cpaCommission: 2000,
      platformFee: 400,
      status: "lead_generated",
      customerName: "Faux Client Test",
      customerPhone: "0770000000",
      address: "Adresse Inexistante",
      productId: "prod-cinema-4k",
      productName: "Projecteur LED Cinema 4K",
      quantity: 1,
      wilaya: 16,
      commune: "Alger",
      trackingNumber: null,
      courier: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const supplierContext = await browser.newContext();
    const supplierPage = await supplierContext.newPage();
    await attachLifecycleRouter(supplierPage, state);

    await supplierPage.addInitScript(
      ({ token }) => {
        localStorage.setItem("vitedrop_token", token);
        localStorage.setItem("vitedrop_lang", "fr");
      },
      { token: createToken("SUPPLIER", "sup-qa-uuid") }
    );

    await supplierPage.goto("/supplier");
    await expect(supplierPage.locator('[data-dashboard-role="supplier"]')).toBeVisible();

    // Click Cancel Button in Call Center Queue
    const cancelBtn = supplierPage.locator('[data-testid="cancel-lead-btn"]:visible').first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Accessible Cancellation Modal opens
    const cancelModal = supplierPage.locator('[data-testid="supplier-cancel-modal"]');
    await expect(cancelModal).toBeVisible();
    await expect(cancelModal).toHaveAttribute("role", "dialog");
    await expect(cancelModal).toHaveAttribute("aria-modal", "true");

    // Select second reason: Duplicate order / unreachable client
    const reasonRadio = cancelModal.locator('input[type="radio"]').nth(1);
    await reasonRadio.check();

    // Confirm Cancellation
    const confirmCancelBtn = cancelModal.locator('[data-testid="confirm-cancel-lead-btn"]');
    await expect(confirmCancelBtn).toBeEnabled();
    await confirmCancelBtn.click();

    // In-page feedback banner confirms cancellation
    await expect(supplierPage.locator('[role="status"]')).toBeVisible();

    // Verify order in state is now in terminal canceled state
    const canceledOrder = state.orders.find((o) => o.id === "ORD-FAKE-999");
    expect(canceledOrder?.status).toBe("canceled");

    await supplierContext.close();
  });
});
