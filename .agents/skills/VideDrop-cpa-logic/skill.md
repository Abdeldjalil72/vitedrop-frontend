---
name: vitedrop-cpa-logic
description: Enforces the Algerian Cash-on-Delivery (COD) CPA Affiliate Network rules specifically for the ViteDrop platform. Use this for any task involving affiliate tracking, order state machines, supplier billing ledgers, or courier webhooks.
---
# ViteDrop: Algerian COD CPA Affiliate Network Rules

## Context

This project is ViteDrop, an Algerian COD CPA Affiliate Network. This is NOT a traditional dropshipping platform.

  - **Suppliers (Fournisseurs)** own the products, set the retail price, define the total CPA budget, and run the call centers.
  - **Affiliates (Media Buyers)** drive traffic to ViteDrop-hosted landing pages using unique tracking links.
  - **ViteDrop (The Platform)** acts as the tracking engine and escrow. We do not process credit cards. Transactions are completed in physical cash by couriers (e.g., Yalidine, ZR Express) at the customer's door.

## Mandatory Rules for the Agent

### 1. The Lead & Order State Machine

You must ONLY use the following exact states for an order/lead within ViteDrop:

  * `lead_generated`: Customer filled out the form via a ViteDrop affiliate link.
  * `canceled`: Supplier's call center marked the lead as fake, duplicate, or the customer declined.
  * `supplier_confirmed`: Supplier confirmed intent via phone.
  * `dispatched`: Waybill (bordereau) generated via ViteDrop's integrated courier API.
  * `in_transit`: Package picked up by courier.
  * `delivered`: Courier webhook confirms cash was collected.
  * `rto_in_transit`: Customer refused (Return to Origin); package heading back to the supplier.
  * `returned_to_supplier`: Supplier confirmed physical receipt of the RTO.

**Constraint:** The `delivered` state can ONLY be triggered by a webhook from the courier API, never by manual supplier input. This prevents "lead shaving" (suppliers stealing affiliate commissions from ViteDrop affiliates).

**Legal State Transitions Matrix:**
```text
lead_generated       -> canceled | supplier_confirmed
supplier_confirmed   -> dispatched
dispatched           -> in_transit
in_transit           -> delivered | rto_in_transit
rto_in_transit       -> returned_to_supplier
canceled             -> terminal
delivered            -> terminal (IMMUTABLE: cash collected; cannot silently flip to RTO or canceled)
returned_to_supplier -> terminal
```
Any transition not defined above must be strictly rejected. Once an order is `delivered`, delivery settlement is executed and the order state is final.

### 2. Financial Immutability & Billing Flow

Never write SQL or ORM code that uses flat updates (e.g., `UPDATE wallets SET balance = balance + X`). You must use a strictly typed double-entry accounting ledger via a `wallet_transactions` table.

**Strict Transaction Enum Types:** 
You must ONLY use: `DEPOSIT` (wallet top-ups), `WITHDRAWAL` (payout disbursements), `WITHDRAWAL_REFUND` (compensatory credit when a payout is rejected or fails), `CPA_PAYOUT` (credit to affiliate), `PLATFORM_FEE` (credit to platform), and `SUPPLIER_DEBIT`. (Do NOT use generic terms like "CREDIT" or "DEBIT").

* **The Invisible Spread Model (20% Cut):**
  The system splits the Supplier's Total CPA Budget into an Affiliate Net Payout (80%) and a Platform Fee (20%). Affiliates never see the Platform Fee. 
* **On `delivered`:**
  1. Debit the Supplier's wallet (`SUPPLIER_DEBIT` for the Gross CPA).
  2. Credit the Affiliate's wallet (`CPA_PAYOUT` for the 80% Net Payout).
  3. Credit the ViteDrop Platform wallet (`PLATFORM_FEE` for the 20% cut).
* **On `rto_in_transit` / `Retour`:**
  * The Affiliate earns 0 DZD.
  * **CRITICAL:** ViteDrop is a "Prepaid Escrow Model" where Suppliers own their private courier API accounts. Because the Supplier is billed directly by the courier in real life for the wasted shipping label, **ViteDrop DOES NOT deduct any platform penalty from the Supplier's wallet on RTO.** The wallet balance remains untouched for both parties.
* **On Withdrawal Failure / Rejection:**
  * When an admin rejects a pending withdrawal or marks an execution as failed, the funds MUST be restored to the affiliate's wallet via a new compensatory transaction of type `WITHDRAWAL_REFUND`. Never alter historical transaction entries or use direct balance overwrites.
* Suppliers operate on a prepaid billing model. Their wallets are automatically generated upon registration, and they must top-up (`DEPOSIT`) to cover their budgets.

### 3. Affiliate Tracking & Pixels (Server-Side)

  * Any database schema for `orders` or `leads` MUST include an `affiliate_id` and tracking metadata (`click_id`, `fbclid`, `ttclid`).
  * ViteDrop's backend architecture must include a worker queue (e.g., Redis/BullMQ) dedicated to firing Server-Side API events (Facebook Conversions API / TikTok Events API) to report "Purchase" events back to the affiliate's ad accounts upon the `lead_generated` or `delivered` state.

### 4. Courier API as the Single Source of Truth

  * Suppliers must NOT use their private courier accounts to ship ViteDrop orders. The backend must generate Yalidine/ZR Express waybills using ViteDrop's master API keys.
  * Implement row-level database locks (e.g., `SELECT ... FOR UPDATE` in PostgreSQL) on webhook listeners to prevent race conditions from duplicate courier webhook payloads.

### 5. Geographical Data
  * ViteDrop checkout forms and delivery pricing modules must exclusively rely on the official 58 Algerian Wilayas and their associated Communes.

  ### 6. Admin operations represented in the UI

  - Admin supervision includes orders, order details/timelines/notes, products and status actions, withdrawals, reconciliation, courier webhooks, agents, users, and audit logs.
  - **Order Supervision (`/admin/orders` & `/admin/orders/[id]`)**:
    - Display supplier and affiliate identities together on order tables: the supplier owns the product and funds the gross CPA; the affiliate generated the lead and receives the 80% payout after courier-confirmed delivery.
    - Customer phone numbers in `font-mono` with Algerian standard prefixes (+213, 05, 06, 07).
    - Geographic address: Official 58 Wilaya code and name (e.g., `16 - Alger`) + Commune.
    - Tracking code 1-click clipboard copy, and courier waybill (Bordereau) generation links.
    - Order Detail Timeline: Chronological event history showing timestamps, actors, status badges, and admin internal operational notes.
  - **Product Supervision (`/admin/products` & `/admin/products/[id]`)**:
    - Automatic approval verification according to the 5 solvency invariants.
    - Admin operational actions: suspension (`isActive: false`), reactivation, out-of-stock management, and archival (never alters historical order snapshots).
    - Performance metrics: Render backend `deliveryRate` directly as a percentage with one decimal precision (e.g., `33.3%`), paired with `deliveredOrders` and `totalOrders`.
  - **Withdrawals Clearinghouse (`/admin/withdrawals`)**:
    - High-priority threshold is strictly **20,000 DZD** (`amount >= 20000`), highlighted with a glowing amber badge on both desktop and mobile viewports.
    - Support postal rails: BaridiMob (cyan capsule) and Algérie Poste CCP (amber capsule).
    - Provide 1-click clipboard copy for recipient details (RIP / CCP) with visual checkmark feedback.
    - Rejection requires an explicit reason; Marking as paid requires the postal/banking transaction reference voucher code.
  - **Double-Entry Reconciliation Engine (`/admin/reconciliation`)**:
    - Endpoints are:
      - `GET /admin/reconciliation/summary` (audited wallets, total variance, delivered orders, last run)
      - `GET /admin/reconciliation/wallets` (cached balance vs ledger sum comparison)
      - `GET /admin/reconciliation/orders` (CPA settlement completeness vs supplier debit and platform fee)
      - `POST /admin/reconciliation/runs` (initiates audit cycle; requires confirmation guard)
      - `GET /admin/reconciliation/runs` (audit run history)
      - `GET /admin/reconciliation/runs/:id` (detailed run log)
    - Reconciliation UI is strictly read-only and analytical; it audits and reports variances without directly mutating ledger tables.

  ### 7. Localization, RTL, and responsive checks

  - Supported dashboard languages are French, English, and Arabic. Language selection persists in `localStorage` and Arabic must set RTL direction.
  - Use logical layout utilities (`text-start`, `text-end`, `ms-*`, `me-*`) so tables, timelines, dialogs, and navigation remain correct in RTL.
  - Validate representative admin pages at approximately `390x844`, `768x1024`, and `1440x900`; check both rendering and horizontal overflow.
  - Sidebar animation is viewport-specific: desktop uses synchronized width expansion/collapse with the content layout, while mobile uses a transform-based drawer and animated backdrop. Test both opening and closing at the representative viewport sizes.

  ### 8. Admin verification workflow

  - After API or schema changes, rebuild the backend and frontend before browser checks; stale Nest watch processes can continue serving old routes.
  - Verify login and redirect, each admin route, product detail metrics, order detail timeline, reconciliation run/history, audit log, RBAC boundaries, invalid/ignored webhooks, and Arabic switching.

### 9. Automated Product Approval & Escrow Solvency Rules

Products submitted by suppliers do not require manual admin approval. They are automatically approved (`isActive: true`) and published if and only if they satisfy:
  * **Escrow Solvency Buffer**: The supplier's prepaid wallet balance must cover at least 5x the CPA (`balance >= supplierTotalCpa * 5`).
  * **CPA Margins & Ceilings**:
    - The CPA budget cannot exceed 50% of the retail selling price (`supplierTotalCpa <= retailPrice * 0.5`).
    - The retail price must be strictly greater than the CPA (`retailPrice > supplierTotalCpa`).
    - Note on CPA Floor: There is NO 500 DZD floor rule. Any positive CPA (`supplierTotalCpa > 0`) is valid as long as retail margin and escrow buffer invariants are maintained.
  * **Inventory Threshold**: Initial stock must be at least **20 units** (`stock >= 20`).

### 10. Admin Order & Product Supervision Invariants

- **Dual-Identity Attribution**: In all admin order supervision views, cleanly separate:
  - **Supplier Store Capsule**: The upstream merchant funding 100% Gross CPA (`supplierTotalCpa`) from their escrow ledger.
  - **Affiliate Media Buyer Capsule**: The downstream publisher receiving 80% Net CPA (`affiliateNetPayout`) upon delivered status.
- **Directional Safety for Algerian Phone Numbers**:
  - Algerian phone numbers (`+213` or `05/06/07`) MUST be wrapped in `<span dir="ltr">` with `font-mono` to prevent digit flipping when rendered in Arabic RTL contexts.
- **Official 58-Wilaya Formatting**:
  - Wilayas must display both official numeric code and localized name (e.g. `16 - Alger` / `16 - الجزائر`).
- **Courier Waybill (Bordereau) Generation**:
  - Support high-fidelity modal simulation for national couriers (Yalidine Express, ZR Express) featuring barcode stripes, master COD tags, logistics hub sender, customer destination, and print capability.
- **Product Solvency Compliance Posture**:
  - The product detail page (`/admin/products/[id]`) must audit the 5 automated solvency invariants via a live `ProductSolvencyCard` displaying real-time compliance ratio (e.g., `5/5 Conforme`), escrow health ratio, and margin checks.
- **Auditable Product Lifecycle Operations**:
  - Status mutations (suspend, reactivate, archive) must require an auditable reason submitted through a WCAG 2.1 AA accessible dialog (`role="dialog"`, `aria-modal="true"`, `Escape` listener, and error alert).

### 11. Admin User, Webhook & Audit Supervision Invariants

- **Auditable User Account Management**:
  - Suspending an active account (Affiliate or Supplier) requires a mandatory auditable reason entered via `UserStatusModal`.
  - Role modifications enforce anti-self-demotion guards to prevent the authenticated administrator from demoting or disabling their own account.
- **Courier Telemetry & Inbound Signals**:
  - Tracking numbers and provider event IDs must be wrapped in `<span dir="ltr">` with `font-mono` to prevent digit flipping in Arabic RTL.
  - Inbound courier webhooks (Yalidine, ZR Express) support interactive state simulation (`Livre` $\rightarrow$ delivered, `Retour` $\rightarrow$ returned) and raw JSON inspection with 1-click clipboard copy.
- **Immutable Audit Trail Integrity**:
  - Sensitive operations (withdrawal clearance, account status toggles, product suspensions) must capture the administrative actor, client IP, action type, before/after state diffs, and audit rationale.

### 12. Supplier Dashboard & Call Center Desk Invariants (`/supplier`)

- **Zero Native Browser Alerts**:
  - Never trigger `alert()`, `confirm()`, or `prompt()` in supplier views. Always use accessible in-page banners (`role="status"` for successes, `role="alert"` for errors) and custom WCAG 2.1 AA modals.
- **Directional Phone Protection**:
  - Algerian customer numbers (`05xx`, `06xx`, `07xx`) and tracking identifiers must be enclosed in `<span dir="ltr" className="font-mono">` with a 1-click copy trigger to prevent digit scrambling in Arabic RTL views.
- **Call Center Confirmation Workflow**:
  - Leads arrive in `lead_generated` status. Call center operators must confirm by phone before order dispatch (`PATCH /supplier/call-center/:id/confirm`).
  - Cancellations require an official categorization via `SupplierCancelModal` (`UNREACHABLE`, `DUPLICATE`, `CUSTOMER_REFUSED`, `OUT_OF_ZONE`, or `OTHER` with custom description) (`PATCH /supplier/call-center/:id/cancel`).
- **Logistics & Courier Webhook Simulation**:
  - Confirmed orders transition to `dispatched` upon waybill creation (`POST /supplier/call-center/:id/dispatch`).
  - Suppliers can test courier callbacks (`POST /webhooks/courier/yalidine`) simulating `Livre` (triggering wallet debit) or `Retour` (releasing escrow reserve with 0 DZD fee).
- **Prepaid Escrow Recharge (`SupplierTopUpModal`)**:
  - Suppliers must maintain a minimum buffer of 3,000 DZD. When low, visual warnings prompt top-up.
  - The modal provides 1-click clipboard copy with 2s checkmark confirmation for official payment rails:
    - **BaridiMob RIP**: `00799999002194829345`
    - **Postal CCP**: `0021948293 Clé 45`
    - **National Bank (BNA)**: `00100 02103 0000123456 78`
    - **Account Holder**: `SARL ViteDrop Logistics DZ`
- **Dedicated Logistics & Shipments Hub (`/supplier/orders`)**:
  - Full dual-rendering parity: high-density table (`supplier-orders-table`) for $\ge 640\text{px}$ viewports and standalone mobile cards (`supplier-orders-card`) for $< 640\text{px}$ viewports.
  - In-page feedback banners (`supplier-action-banner` and `supplier-error-banner`) with zero native browser alerts.
  - 1-click clipboard triggers (`copy-tracking-btn`) with visual checkmark feedback.
  - Search toolbar and 58 Wilaya filter dropdown (`supplier-wilaya-select`).
  - Waybill generation (`POST /supplier/call-center/:id/dispatch`) and live courier webhook simulation (`POST /webhooks/courier/yalidine`).

### 13. Supplier Product Catalog & Live Solvency Pre-check (`/supplier/products`)

- **Automated Instant Activation**:
  - Suppliers manage and publish catalog items directly at `/supplier/products`.
  - When submitting via `SupplierProductModal`, real-time client & server validation checks 4 solvency invariants:
    1. `retailPrice > supplierTotalCpa`
    2. `supplierTotalCpa <= retailPrice * 0.5` (Max 50% retail margin cap)
    3. `stock >= 20` units
    4. `walletBalance >= supplierTotalCpa * 5` (5x Escrow buffer)
  - No 500 DZD floor rule is enforced.
- **Dynamic 80/20 & Escrow Buffer Visualizer**:
  - Typing a gross CPA dynamically decomposes into the 80% Affiliate Net Payout and 20% ViteDrop Platform Commission, alongside the exact 5x Escrow reserve required.
- **Direct Top-Up Bridge**:
  - If a supplier's wallet balance does not cover the 5x buffer, the modal presents an inline prompt and direct trigger opening `SupplierTopUpModal` with official RIP/CCP details.
- **Dual-Rendering Parity & 1-Click Clipboard**:
  - Mobile viewports (< 640px) render responsive cards (`data-testid="supplier-product-card"`) with financial metrics and 1-click product ID copy.
  - Desktop viewports (>= 640px) render high-density table rows (`data-testid="supplier-product-row"`).
  - Status filters (`ALL`, `ACTIVE`, `OUT_OF_STOCK`) and live search filter results instantly.

### 14. Supplier Escrow Wallet & Double-Entry Ledger (`/supplier/wallet`)

- **Prepaid Escrow Model Enforcement**:
  - Suppliers fund their escrow wallet in advance using postal rails (BaridiMob RIP, Postal CCP) or bank transfer.
  - Required minimum buffer is **3,000 DZD**. When balance falls below this threshold (`balance < 3000`), a prominent amber warning prompts an immediate top-up.
- **Double-Entry Transaction Types**:
  - `DEPOSIT`: Top-ups made via BaridiMob/CCP/BNA (positive credit to escrow).
  - `SUPPLIER_DEBIT`: Gross CPA deduction triggered strictly upon courier-confirmed delivery (`delivered` / `Livre`).
  - **Zero Fee on RTO / Returns**: On `rto_in_transit` or `Retour`, 0 DZD is deducted from the supplier's wallet.
- **Escrow Analytics Cards**:
  - Current Escrow Balance (`font-mono`, Space Mono formatted).
  - Cumulative Deposits (total sum of `DEPOSIT` credits).
  - Cumulative Delivery Debits (total sum of `SUPPLIER_DEBIT` deductions).
- **Dual-Rendering Ledger & Search**:
  - Mobile cards (`data-testid="supplier-wallet-tx-card"`) for `< 640px` viewports with 1-click transaction reference copy (`data-testid="copy-tx-ref-btn"`).
  - Desktop table (`data-testid="supplier-wallet-tx-row"`) for `>= 640px` viewports.
  - Transaction type pills (`ALL`, `DEPOSITS`, `DEBITS`) and live search input (`data-testid="tx-search-input"`).
- **Integrated Accessible Top-Up**:
  - Header button (`data-testid="supplier-wallet-topup-btn"`) opens `SupplierTopUpModal` featuring copy triggers for official BaridiMob RIP (`00799999002194829345`) and CCP (`0021948293 Clé 45`).

### 15. Affiliate Portal: Marketplace & S2S Campaign Builder

- **Marketplace & Offer Discovery (`/affiliate/marketplace` & `/affiliate/marketplace/[id]`)**:
  - Exclusively displays the **80% Net CPA Commission** (`affiliateNetPayout`) in Space Mono (`formatDZD`), never the platform fee.
  - Retail selling prices, merchant stock levels, and Sourced Stock DZ indicators.
  - Category tabs and dynamic sort options (`CPA Net le plus élevé`, `Prix croissant/décroissant`, `Nouveautés`).
  - Integrated `TrackingLinkModal` dialog for 1-click tracking URL generation.
  - Product Offer Detail page with official courier delivery rates table across 58 Wilayas (with 10/58 slice toggle).

- **Tracking Link Generator & S2S Campaigns (`/affiliate/links`)**:
  - Traffic source presets (Facebook, TikTok, Snapchat, Google Ads).
  - Dynamic URL assembly: `${origin}/p/${productId}?aff=${affiliateId}&utm_source=...&utm_campaign=...&sub_id=...`.
  - 1-click clipboard copy with checkmark feedback. Zero native browser `alert()` calls.
  - S2S telemetry documentation detailing `click_id`, `fbclid`, and `ttclid` tracking throughout checkout and courier webhooks.
  - Dual-rendering table and mobile card parity on 390px screens.

### 16. Affiliate Portal: Orders, Leads & Postal Wallet Clearinghouse

- **Leads & Real-Time Orders Tracker (`/affiliate/orders` & `/affiliate/leads`)**:
  - Transparent tracking across 8 legal COD states (`lead_generated`, `supplier_confirmed`, `dispatched`, `in_transit`, `delivered`, `rto_in_transit`, `returned_to_supplier`, `canceled`).
  - Search toolbar by customer name, order ID, phone, or tracking code.
  - 58 Algerian Wilaya filter dropdown (`data-testid="affiliate-wilaya-select"`).
  - Dual-rendering table (`data-testid="affiliate-order-row"`) and mobile card (`data-testid="affiliate-order-card"`) parity.
  - Directional LTR customer phone numbers (`dir="ltr"`) and 1-click tracking number copy triggers.
  - Accessible Order Detail modal (`role="dialog"`, `aria-modal="true"`) with delivery details and keyboard Escape dismissal.

- **Affiliate Wallet & Postal Payouts Clearinghouse (`/affiliate/wallet`)**:
  - Treasury KPI cards: Cleared Balance (Solde Disponible), Pipeline Reserve (Commissions en Attente), and Cumulative Disbursements (Total Retiré).
  - Dual-rendering double-entry transaction ledger (`CPA_PAYOUT`, `WITHDRAWAL`, `WITHDRAWAL_REFUND`).
  - Withdrawal Request Modal (`AffiliateWithdrawModal`):
    - BaridiMob (20-digit RIP validation, cyan badge).
    - Algérie Poste CCP (CCP account + Clé validation, amber badge).
    - High-Priority Threshold trigger: automatic glowing capsule highlighting 12h priority execution for amounts $\ge 20{,}000$ DZD (`payout-priority-capsule`).

### 17. Affiliate Command Center Overview (`/affiliate`)

- **Executive KPI Cards**:
  - Total Net Revenue (`data-testid="stat-total-earnings"`) with Space Mono formatting and 80% Net CPA badge.
  - Delivered Orders (`data-testid="stat-delivered-orders"`).
  - Delivery Success Rate % (`data-testid="stat-delivery-rate"`).
  - Pipeline Pending Commissions (`data-testid="stat-pending-commissions"`).
- **Quick Action Ribbon**:
  - Shortcuts to Marketplace catalog (`data-testid="quick-marketplace-btn"`), Tracking Links generator (`data-testid="quick-links-btn"`), and Wallet.
- **Recent Leads & Orders Preview**:
  - Dual-rendering desktop table (`data-testid="affiliate-recent-orders-table"`) and mobile cards (`data-testid="affiliate-recent-order-card"`).
  - Zero horizontal overflow across 390px, 768px, and 1440px viewports with full Arabic RTL parity.

### 18. Public Customer Checkout Funnel (`/p/[productId]`)

- **Ad Traffic & Attribution Ingestion**:
  - Public landing page where Algerian consumers arrive from affiliate ad campaigns (Meta Ads, TikTok Ads, Google, Snapchat).
  - Captures tracking query parameters: `ref` (affiliate ID), `fbclid` (Facebook click ID), `ttclid` (TikTok click ID), `utm_campaign`, and `sub_id`.
  - Dispatches tracking attribution payload directly to `POST /checkout` via `apiCreateCheckoutLead`.
- **58 Algerian Wilayas & Cascading Delivery Fee Engine**:
  - Official 58 Wilaya selector with bilingual display (`Alger` / `الجزائر`, `Oran` / `وهران`).
  - Communes dropdown dynamically filters according to selected Wilaya.
  - Live delivery mode calculation: Home Delivery (`delivery-type-home`) vs Bureau Stop-Desk (`delivery-type-desk`).
  - Dynamic grand total calculation updating live with quantity selector (1, 2, 3 items) and Wilaya/mode delivery fee.
- **Algerian Phone Number Integrity**:
  - Enforces 10-digit format starting with `05`, `06`, or `07`.
  - Enforces `dir="ltr"` on telephone input and confirmation screens to protect against Arabic RTL digit flipping.
- **Zero Native Browser Dialogs & WCAG 2.1 AA Error Handling**:
  - Employs `<form noValidate>` to prevent intrusive browser HTML5 tooltips.
  - Surfaces accessible inline error tags (`checkout-error-name`, `checkout-error-phone`, `checkout-error-commune`, `checkout-error-address`, `checkout-api-error`).
- **Mobile Responsiveness & Arabic RTL Parity**:
  - 390px mobile viewport optimization with fixed sticky bottom conversion CTA (`mobile-sticky-checkout-btn`).
  - Strict layout containment with zero horizontal scrolling (`scrollWidth <= clientWidth`).
  - Complete Arabic RTL experience with single-click language toggle (`landing-lang-toggle`) to French.
- **Order Confirmation & Retention**:
  - Dedicated success state (`checkout-success-view`) presenting full order reference ID (`checkout-success-order-id`).
  - 1-click clipboard copy (`copy-order-id-btn`) with visual checkmark feedback.
  - "Order another item" CTA (`order-again-btn`) resetting form state for additional purchases.

### 19. Public Marketing, Registration Onboarding & Password Recovery (`/`, `/register`, `/forgot-password`)

- **High-Converting Editorial Marketing Homepage (`/`)**:
  - Luxury typography with moving blue gradient auras and tactile spring interactions.
  - Audience ecosystem switcher (`audience-tab-buyer` vs `audience-tab-supplier`) revealing bespoke workflows for Media Buyers vs Product Owners.
  - Real-time logistics ticker highlighting 58 Wilayas coverage, Yalidine API, ZR Express, and 24h BaridiMob settlements.
  - Accessible navigation dropdown supporting English, French, and Arabic (`nav-lang-btn`, `lang-option-en`, `lang-option-fr`, `lang-option-ar`).
- **Role-Based Registration Onboarding (`/register`)**:
  - Segmented role picker (`tab-affiliate` vs `tab-supplier`).
  - Supplier profile expansion: Mandatory company / brand name (`register-company-input`) and warehouse Wilaya selection (`register-wilaya-select`).
  - Algerian mobile validation (10 digits starting with `05`, `06`, or `07`) with `dir="ltr"` protection across all language modes.
  - Automatic double-entry wallet generation upon registration completion.
  - Zero native alerts: Accessible inline error banner (`register-error-banner`) and success alert (`register-success-banner`).
- **Self-Service Password Recovery (`/forgot-password`)**:
  - Email reset dispatch flow with confirmation state (`forgot-success-view`).
  - Return link to login (`back-to-login-btn`) with full keyboard accessibility.
- **Strict Mobile & RTL Containment**:
  - Zero horizontal overflow across 390px, 768px, and 1440px viewports.
  - Full Arabic RTL parity with protected LTR directionality for all numeric and phone inputs.

### 20. Master End-to-End Multi-Actor Order Lifecycle Integration (`tests/e2e-order-lifecycle.spec.ts`)

- **Comprehensive Multi-Actor Lifecycle Coverage (Stage 1 through 7)**:
  - **Stage 1: Supplier Product Creation**: Supplier catalogs inventory with Space Mono pricing and dynamic 80/20 CPA commission split.
  - **Stage 2: Admin Supervision**: Product is immediately verified in Admin Catalog (`/admin/products`) under active status.
  - **Stage 3: Affiliate Marketplace Discovery**: Affiliate browses marketplace (`/affiliate/marketplace`), views 80% Net CPA payout, and generates tracked landing URL with campaign parameters.
  - **Stage 4: Public Algerian Customer COD Purchase**: Customer arrives via tracked ad link (`/p/[productId]?ref=...&fbclid=...`), selects Wilaya/commune with dynamic delivery fee, and submits cash-on-delivery order (`lead_generated`).
  - **Stage 5: Supplier Call Center Confirmation & Dispatch**: Lead appears in supplier's Call Center Queue (`/supplier`), agent calls customer to confirm purchase intent (`supplier_confirmed`), moves to Confirmed tab, and generates Yalidine express tracking number (`dispatched`).
  - **Stage 6: Yalidine Courier Delivery & Double-Entry Ledger Settlement**: Courier webhook receives delivery confirmation (`status: Livre`), triggering simultaneous ledger entries:
    - Supplier Escrow wallet debited Gross CPA (`-2,000 DZD`).
    - Affiliate wallet credited 80% Net Payout (`+1,600 DZD`).
    - ViteDrop Platform retains 20% platform cut (`+400 DZD`).
  - **Stage 7: Multi-Actor Ledger Audit & Treasury Reconciliation**:
    - Affiliate verifies delivered order and updated cleared balance (`/affiliate/wallet`).
    - Supplier audits Escrow ledger debit and updated current balance (`/supplier/wallet`).
    - Admin audits Treasury Reconciliation (`/admin/reconciliation`), confirming 0 variance across all wallets and 100% clean double-entry balance.
- **Return to Origin (RTO) Zero-Penalty Invariant**:
  - When customer refuses delivery at doorstep (`status: Retour`), order transitions to `rto_in_transit`.
  - Zero CPA fee is deducted from the supplier's escrow wallet (0 DZD fee).
  - Affiliate receives 0 DZD commission. Both wallet balances remain completely untouched.
- **Call Center Rejection & Terminal Cancellation**:
  - Unreachable or duplicate customer orders are rejected in call center queue with mandatory cancellation reason.
  - Order transitions to terminal `canceled` state, releasing reserved stock with zero penalty applied.
- **100% Regression Suite Pass Rate**:
  - Full platform test suite executes with 108 / 108 passing tests across 20 spec files.




