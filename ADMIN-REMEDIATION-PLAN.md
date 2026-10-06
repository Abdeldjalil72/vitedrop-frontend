# ViteDrop Admin Remediation Plan

This document is the implementation roadmap for correcting the ViteDrop admin dashboard, backend financial workflows, order state machine, courier integrations, inventory behavior, and operational tooling.

Frontend repository:

`C:\Users\adz72\Desktop\vitedrop-frontend`

Backend repository:

`C:\Users\adz72\Desktop\vitedrop`

The implementation must preserve the local ViteDrop skills:

- `.agents/skills/VideDrop-cpa-logic/skill.md`
- `.agents/skills/vitedrop-design-system/SKILL.md`
- `.agents/skills/motion/SKILL.md`
- Next.js App Router guidance supplied by the local Next.js skill

---

## 1. Non-negotiable domain rules

### 1.1 Order states

Only these order states are allowed:

```text
lead_generated
canceled
supplier_confirmed
dispatched
in_transit
delivered
rto_in_transit
returned_to_supplier
```

`delivered` may only be produced by an authenticated courier webhook. It must never be a manual supplier action.

Recommended valid transitions:

```text
lead_generated       -> canceled | supplier_confirmed
supplier_confirmed   -> dispatched
dispatched           -> in_transit
in_transit           -> delivered | rto_in_transit
rto_in_transit      -> returned_to_supplier
canceled             -> terminal
delivered            -> terminal
returned_to_supplier -> terminal
```

Invalid transitions must be rejected explicitly.

### 1.2 Wallet transaction types

Only these transaction types may be used:

```text
DEPOSIT
WITHDRAWAL
CPA_PAYOUT
PLATFORM_FEE
SUPPLIER_DEBIT
```

Do not introduce generic `CREDIT`, `DEBIT`, `REFUND`, or `PENALTY` transaction types.

For a delivered order:

```text
Supplier wallet:  SUPPLIER_DEBIT  - gross CPA
Affiliate wallet: CPA_PAYOUT      + 80% net CPA
Platform wallet:  PLATFORM_FEE    + 20% platform fee
```

RTO must not create a ViteDrop wallet penalty.

### 1.3 Product activation

Products are automatically activated when all of the following are true:

- Total CPA is at least 500 DZD.
- Total CPA is no more than 50% of retail price.
- Retail price is greater than total CPA.
- Initial stock is at least 20 units.
- Supplier wallet balance covers at least five times the CPA.

Admin product controls should manage operational suspension, reactivation, out-of-stock, and archival. They should not add a conflicting manual approval workflow.

### 1.4 Frontend design

All new admin UI must use:

- `bg-[#fafafa]` dashboard background
- White cards with subtle black borders
- Emerald financial success styling
- Amber pending styling
- Rose danger/admin styling
- Purple supplier styling
- Sky affiliate styling
- `font-mono` for financial amounts, dates, IDs, phone numbers, and tracking codes
- Logical RTL-safe classes such as `text-start`, `text-end`, `ms-*`, and `me-*`
- Existing UI components before introducing duplicates
- `motion/react`, never `framer-motion`

---

## 2. Phase One: establish a safe baseline

### Objective

Create a stable foundation before changing financial behavior.

### Backend files

- `C:\Users\adz72\Desktop\vitedrop\src\app.module.ts`
- `C:\Users\adz72\Desktop\vitedrop\src\main.ts`
- `C:\Users\adz72\Desktop\vitedrop\ormconfig.ts`
- `C:\Users\adz72\Desktop\vitedrop\package.json`
- `C:\Users\adz72\Desktop\vitedrop\tsconfig.json`

### Frontend files

- `C:\Users\adz72\Desktop\vitedrop-frontend\src\app\admin\page.tsx`
- `C:\Users\adz72\Desktop\vitedrop-frontend\src\app\admin\users\page.tsx`
- `C:\Users\adz72\Desktop\vitedrop-frontend\src\components\dashboard\dashboard-layout.tsx`
- `C:\Users\adz72\Desktop\vitedrop-frontend\src\components\dashboard\sidebar.tsx`
- `C:\Users\adz72\Desktop\vitedrop-frontend\src\lib\api-client.ts`
- `C:\Users\adz72\Desktop\vitedrop-frontend\src\lib\locales.ts`

### Changes

#### 2.1 Disable production TypeORM synchronization

In `src/app.module.ts`, replace unconditional synchronization:

```ts
synchronize: true
```

with an environment-controlled value:

```ts
synchronize:
  config.get<string>("NODE_ENV") === "development" &&
  config.get<string>("DB_ALLOW_SYNCHRONIZE") === "true",
```

Recommended production values:

```env
NODE_ENV=production
DB_ALLOW_SYNCHRONIZE=false
```

Keep `ormconfig.ts` configured for migrations.

Add migration scripts to the backend `package.json`:

```json
{
  "migration:generate": "typeorm-ts-node-commonjs migration:generate -d ormconfig.ts",
  "migration:run": "typeorm-ts-node-commonjs migration:run -d ormconfig.ts",
  "migration:revert": "typeorm-ts-node-commonjs migration:revert -d ormconfig.ts"
}
```

#### 2.2 Strengthen global validation

In `src/main.ts`, use:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

This rejects unknown fields in admin requests, webhook payloads, role changes, and financial requests.

#### 2.3 Remove duplicate admin authorization

In the frontend admin page, remove:

- Page-level `useRouter`
- Page-level `getCurrentUser`
- `isAuthorized`
- The page-level authorization effect
- The early `if (!isAuthorized) return null`

Use `DashboardLayout initialRole="admin"` as the shared client-side guard.

#### 2.4 Improve shared dashboard authorization

Update `dashboard-layout.tsx` to:

- Use an explicit `checking`, `authorized`, and `redirecting` state.
- Use `router.replace()` for forced redirects.
- Handle `CALL_CENTER_AGENT` explicitly.
- Keep all hooks before conditional returns.
- Centralize role-to-dashboard routing.
- Avoid duplicate balance requests where possible.

#### 2.5 Repair route mismatches

Either create:

```text
src/app/affiliate/links/page.tsx
src/app/affiliate/settings/page.tsx
```

or temporarily remove their sidebar links.

Change the homepage `/signup` link to `/register`, because `/register` is the implemented route.

---

## 3. Phase Two: implement a real withdrawal lifecycle

### Objective

Replace the current immediate debit with a real request, review, payment, rejection, and failure workflow.

### New backend files

```text
src/modules/wallets/entities/withdrawal.entity.ts
src/modules/wallets/dto/admin-withdrawal-action.dto.ts
src/modules/wallets/dto/create-withdrawal.dto.ts
src/modules/wallets/enums/withdrawal-status.enum.ts
src/modules/wallets/enums/withdrawal-method.enum.ts
```

### Existing backend files to modify

- `src/modules/wallets/admin.controller.ts`
- `src/modules/wallets/wallets.controller.ts`
- `src/modules/wallets/wallets.service.ts`
- `src/modules/wallets/wallets.module.ts`
- `src/modules/wallets/entities/wallet-transaction.entity.ts`

### New frontend files

```text
src/app/admin/withdrawals/page.tsx
src/components/admin/withdrawal-action-modal.tsx
src/components/admin/withdrawal-status-badge.tsx
```

### 3.1 Add withdrawal statuses

Create:

```ts
export enum WithdrawalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  PAID = "PAID",
  REJECTED = "REJECTED",
  FAILED = "FAILED",
}
```

### 3.2 Add withdrawal methods

Create a validated enum:

```ts
export enum WithdrawalMethod {
  BARIDIMOB = "BARIDIMOB",
  CCP = "CCP",
  BANK_TRANSFER = "BANK_TRANSFER",
}
```

### 3.3 Add withdrawal entity

Create `withdrawal.entity.ts` with:

```ts
@Entity("withdrawals")
export class Withdrawal {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  userId: string;

  @Column("uuid")
  walletId: string;

  @Column("numeric", { precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: "enum",
    enum: WithdrawalMethod,
  })
  method: WithdrawalMethod;

  @Column({ type: "varchar" })
  recipientDetailsMasked: string;

  @Column({ type: "varchar", nullable: true })
  recipientDetailsEncrypted: string | null;

  @Column({
    type: "enum",
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status: WithdrawalStatus;

  @Column({ type: "varchar", nullable: true })
  adminNote: string | null;

  @Column({ type: "varchar", nullable: true })
  paymentReference: string | null;

  @Column("uuid", { nullable: true })
  reviewedBy: string | null;

  @Column({ type: "timestamp", nullable: true })
  reviewedAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  paidAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  rejectedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

Do not store unmasked payment details in `WalletTransaction.reference`.

### 3.4 Add withdrawal linkage to wallet transactions

Add:

```ts
@Column("uuid", { nullable: true })
withdrawalId: string | null;
```

Use the existing `WITHDRAWAL` type for funds reserved by a withdrawal request and compensating entries.

### 3.5 Create withdrawal request

Update `WalletsService.requestWithdrawal()`:

1. Start a database transaction.
2. Lock the affiliate wallet with a pessimistic write lock.
3. Validate positive amount and supported method.
4. Validate recipient details.
5. Check available balance.
6. Create a `PENDING` withdrawal.
7. Create a negative `WITHDRAWAL` ledger transaction referencing the withdrawal.
8. Store `balanceAfter`.
9. Commit.

The result is a pending request, not a completed payment.

### 3.6 Approve withdrawal

Add admin service logic:

1. Lock withdrawal.
2. Require `PENDING`.
3. Set `APPROVED`.
4. Store reviewer and review timestamp.
5. Do not debit again.

### 3.7 Reject withdrawal

Add admin service logic:

1. Lock withdrawal.
2. Require `PENDING`.
3. Lock wallet.
4. Insert a positive `WITHDRAWAL` compensating transaction.
5. Restore wallet balance.
6. Set `REJECTED`.
7. Store rejection note, reviewer, and timestamp.

Never delete the original withdrawal transaction.

### 3.8 Mark withdrawal paid

Add admin service logic:

1. Lock withdrawal.
2. Require `APPROVED`.
3. Require a payment reference.
4. Set `PAID`.
5. Store `paidAt`, reviewer, and payment reference.
6. Do not debit the wallet again.

### 3.9 Mark withdrawal failed

Add admin service logic:

1. Lock withdrawal.
2. Require `APPROVED`.
3. Insert a positive `WITHDRAWAL` compensating transaction.
4. Restore wallet balance.
5. Set `FAILED`.
6. Store failure reason.

### 3.10 Add endpoints

Affiliate endpoints:

```text
POST /wallets/withdraw
GET  /wallets/withdrawals
```

Admin endpoints:

```text
GET   /admin/withdrawals
GET   /admin/withdrawals/:id
PATCH /admin/withdrawals/:id/approve
PATCH /admin/withdrawals/:id/reject
PATCH /admin/withdrawals/:id/paid
PATCH /admin/withdrawals/:id/failed
```

Every mutation must use row locks and an explicit status transition.

### 3.11 Frontend withdrawal management

Update `src/lib/api-client.ts` with typed `AdminWithdrawal` interfaces and:

```ts
apiGetAdminWithdrawals()
apiApproveWithdrawal(id)
apiRejectWithdrawal(id, reason)
apiMarkWithdrawalPaid(id, paymentReference)
apiMarkWithdrawalFailed(id, reason)
```

Create `/admin/withdrawals`.

The page must provide:

- Status tabs
- Search
- Date filtering
- Amount display in `font-mono`
- Masked recipient details
- Approve confirmation
- Reject modal requiring a reason
- Paid modal requiring payment reference
- Failed modal requiring a reason
- Loading skeletons
- Empty states
- Inline error messages
- Refresh after mutation
- Disabled buttons during mutation

The existing withdrawal buttons in the overview page must either link to the withdrawal page or use the same action handlers. They must never remain visual-only.

---

## 4. Phase Three: secure courier webhooks

### Backend files

- `src/modules/webhooks/webhooks.controller.ts`
- `src/modules/webhooks/webhooks.service.ts`
- `src/modules/webhooks/dto/courier-webhook.dto.ts`
- `src/modules/webhooks/webhooks.module.ts`
- `src/modules/orders/orders.service.ts`

### New files

```text
src/modules/webhooks/entities/webhook-event.entity.ts
src/modules/webhooks/guards/courier-signature.guard.ts
```

### 4.1 Add webhook event entity

Store:

- Provider
- Provider event ID
- Tracking number
- Received status
- Normalized status
- Signature validity
- Processing status
- Raw payload, subject to privacy policy
- Error message
- Created and updated timestamps

Add a unique index on:

```text
(provider, providerEventId)
```

### 4.2 Add signature validation

Validate:

- HMAC signature
- Request timestamp
- Provider event ID
- Replay window
- Optional source IP

Add environment variables:

```env
YALIDINE_WEBHOOK_SECRET=
YALIDINE_WEBHOOK_TOLERANCE_SECONDS=300
```

The exact signature header names must match the courier integration contract.

### 4.3 Strengthen DTO validation

Extend `CourierWebhookDto` with optional:

```ts
providerEventId?: string;
eventTimestamp?: string;
```

Use strict validation and reject unknown fields.

### 4.4 Enforce legal transitions

Add a centralized transition map to `OrdersService`.

The webhook handler must:

1. Lock the order.
2. Check webhook event uniqueness.
3. Reject or ignore replayed events.
4. Validate current-to-next transition.
5. Apply transition.
6. Settle only on a valid `delivered` transition.
7. Store event processing status.

### 4.5 Add `in_transit` and `returned_to_supplier`

Map actual courier statuses to:

```text
in_transit
returned_to_supplier
```

Only allow:

```text
in_transit -> rto_in_transit
rto_in_transit -> returned_to_supplier
```

No wallet movement occurs for these transitions.

---

## 5. Phase Four: fix wallet settlement concurrency

### Files

- `src/modules/orders/orders.service.ts`
- `src/modules/wallets/wallets.service.ts`
- `src/modules/wallets/entities/wallet.entity.ts`
- `src/modules/wallets/entities/wallet-transaction.entity.ts`
- `src/common/database/transaction-lock.util.ts`

### 5.1 Lock all affected wallets

Within the same delivery transaction:

1. Lock the order.
2. Load supplier wallet.
3. Load affiliate wallet.
4. Load platform wallet.
5. Lock all wallets using pessimistic write locks.
6. Lock in deterministic ID order to avoid deadlocks.
7. Check supplier balance.
8. Insert all three transactions.
9. Update all cached balances.
10. Store `balanceAfter`.
11. Commit.

### 5.2 Add settlement uniqueness

Add a partial unique index preventing multiple delivery transactions of the same type for one order:

```text
(orderId, type) WHERE orderId IS NOT NULL
```

This protects:

- `SUPPLIER_DEBIT`
- `CPA_PAYOUT`
- `PLATFORM_FEE`

### 5.3 Add balance snapshots

Add:

```ts
@Column("numeric", { precision: 12, scale: 2, nullable: true })
balanceAfter: number | null;
```

to `WalletTransaction`.

### 5.4 Correct wallet lookup

When loading a wallet, query by both:

```ts
ownerId
ownerType
```

This avoids returning a supplier wallet after a role change.

---

## 6. Phase Five: fix inventory and escrow exposure

### Files

- `src/modules/products/entities/product.entity.ts`
- `src/modules/products/products.service.ts`
- `src/modules/orders/orders.service.ts`
- `src/modules/products/controllers/supplier-products.controller.ts`
- `src/modules/products/products.module.ts`

### New files

```text
src/modules/products/entities/inventory-movement.entity.ts
src/modules/products/enums/product-status.enum.ts
```

### 6.1 Add product operational status

Create:

```ts
export enum ProductStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  OUT_OF_STOCK = "out_of_stock",
  ARCHIVED = "archived",
}
```

Keep automatic activation after CPA validation.

### 6.2 Add reserved stock

Add:

```ts
@Column("int", { default: 0 })
reservedStock: number;

@Column({
  type: "enum",
  enum: ProductStatus,
  default: ProductStatus.ACTIVE,
})
status: ProductStatus;
```

### 6.3 Reserve stock during checkout

In `OrdersService.createLead()`:

1. Start a transaction.
2. Lock the product row.
3. Verify product is active.
4. Verify available stock is at least quantity.
5. Decrease available stock.
6. Increase reserved stock.
7. Create the lead.
8. Create an inventory reservation movement.
9. Commit.

This prevents concurrent overselling.

### 6.4 Define stock release behavior

Recommended behavior:

```text
lead_generated       -> stock remains reserved
canceled             -> release reservation
supplier_confirmed   -> reservation remains
dispatched           -> reservation remains
delivered            -> convert reservation to fulfillment
rto_in_transit       -> reservation remains until return resolution
returned_to_supplier -> release or restore according to policy
```

Inventory movement types should be separate from wallet transaction types:

```text
RESERVATION
RELEASE
FULFILLMENT
RTO_RETURN
MANUAL_ADJUSTMENT
```

### 6.5 Resolve quantity semantics

Explicitly decide whether CPA is per order or per unit.

If per unit:

```ts
grossCpa = product.supplierTotalCpa * order.quantity;
affiliatePayout = product.affiliateNetPayout * order.quantity;
platformFee = product.platformFee * order.quantity;
```

If per order, preserve the current settlement and document it clearly.

Do not leave this ambiguous.

### 6.6 Add escrow exposure reporting

Calculate:

- Available supplier balance
- Active products
- Pending order exposure
- Gross CPA exposure
- Coverage ratio
- Suppliers below coverage

Do not silently reserve wallet funds for every product unless product-level reservation is explicitly approved as a business rule.

---

## 7. Phase Six: secure public checkout

### Files

- `src/modules/orders/dto/create-checkout.dto.ts`
- `src/modules/orders/orders.service.ts`
- `src/modules/orders/checkout.controller.ts`
- `src/modules/products/entities/product.entity.ts`
- Frontend `src/components/checkout/cod-checkout-form.tsx`

### 7.1 Validate affiliate identity

Before creating a lead:

- Load affiliate by `affiliateId`.
- Require `AFFILIATE` role.
- Require active status.
- Reject missing, suspended, supplier, admin, or agent users.

Do not trust a UUID supplied by a public client.

### 7.2 Validate geography

Use:

```ts
@IsInt()
@Min(1)
@Max(58)
wilaya: number;
```

Also verify the code exists in the official backend geography data.

### 7.3 Validate quantity

Use integer validation:

```ts
@IsInt()
@Min(1)
@Max(20)
quantity: number;
```

The maximum must be made configurable later.

### 7.4 Preserve tracking metadata

Add to DTO and entity where required:

```ts
click_id?: string;
utm_source?: string;
utm_campaign?: string;
sub_id?: string;
```

Forward these fields from the checkout form.

---

## 8. Phase Seven: add admin order management

### New backend files

```text
src/modules/orders/controllers/admin-orders.controller.ts
src/modules/orders/dto/admin-orders-query.dto.ts
src/modules/orders/dto/admin-order-correction.dto.ts
src/modules/orders/dto/admin-order-note.dto.ts
src/modules/orders/entities/order-event.entity.ts
src/modules/orders/entities/order-note.entity.ts
```

### Existing backend files

- `src/modules/orders/orders.module.ts`
- `src/modules/orders/orders.service.ts`
- `src/modules/orders/entities/order.entity.ts`

### New frontend files

```text
src/app/admin/orders/page.tsx
src/app/admin/orders/[id]/page.tsx
src/components/admin/order-filters.tsx
src/components/admin/order-status-timeline.tsx
src/components/admin/financial-breakdown.tsx
```

### 8.1 Add admin order list

Endpoint:

```text
GET /admin/orders
```

Filters:

```text
page
limit
search
status
supplierId
affiliateId
productId
courier
wilaya
createdFrom
createdTo
```

Return:

- Order ID
- Product
- Supplier
- Affiliate
- Masked customer phone
- Wilaya
- Current status
- Tracking number
- Gross CPA
- Affiliate payout
- Platform fee
- Created and updated timestamps

Use server-side pagination.

### 8.2 Add order detail

Endpoint:

```text
GET /admin/orders/:id
```

Return:

- Full order information
- State history
- Courier events
- Ledger entries
- Tracking metadata
- Product financial snapshot
- Supplier and affiliate identity
- Settlement status
- Inventory movements

### 8.3 Add admin notes

Endpoint:

```text
POST /admin/orders/:id/notes
```

Notes must be append-only and audited.

### 8.4 Restrict manual corrections

Do not expose arbitrary status editing.

Use controlled operations such as:

```text
POST /admin/orders/:id/reprocess-webhook
POST /admin/orders/:id/reconcile-settlement
```

Any exceptional manual correction must:

- Require a reason.
- Require an audit record.
- Check ledger idempotency.
- Never silently mark an order delivered without courier evidence.

---

## 9. Phase Eight: ledger reconciliation

### New backend files

```text
src/modules/reconciliation/reconciliation.module.ts
src/modules/reconciliation/reconciliation.controller.ts
src/modules/reconciliation/reconciliation.service.ts
src/modules/reconciliation/dto/reconciliation-query.dto.ts
src/modules/reconciliation/entities/reconciliation-run.entity.ts
```

### Endpoints

```text
GET  /admin/reconciliation/summary
GET  /admin/reconciliation/wallets
GET  /admin/reconciliation/orders
POST /admin/reconciliation/runs
GET  /admin/reconciliation/runs/:id
```

### Checks

#### Wallet balance

```text
cached wallet balance
- sum(wallet transactions)
= variance
```

#### Delivered settlement

Every delivered order must have exactly:

```text
one SUPPLIER_DEBIT
one CPA_PAYOUT
one PLATFORM_FEE
```

#### Amount balance

```text
abs(SUPPLIER_DEBIT)
= CPA_PAYOUT + PLATFORM_FEE
```

#### State consistency

Flag:

- Canceled orders with settlement entries
- RTO orders with settlement entries
- Delivered orders without settlement
- Duplicate transaction types
- Orphan transactions
- Transactions without required order IDs
- Negative wallets
- Missing platform wallet

### Frontend

Create:

```text
src/app/admin/reconciliation/page.tsx
src/components/admin/reconciliation-summary.tsx
src/components/admin/reconciliation-table.tsx
```

Use emerald for reconciled results, rose for exceptions, and amber for pending review.

---

## 10. Phase Nine: add admin product management

### New backend files

```text
src/modules/products/controllers/admin-products.controller.ts
src/modules/products/dto/admin-product-query.dto.ts
src/modules/products/dto/admin-product-status.dto.ts
```

### Existing backend files

- `src/modules/products/products.module.ts`
- `src/modules/products/products.service.ts`
- `src/modules/products/entities/product.entity.ts`

### New frontend files

```text
src/app/admin/products/page.tsx
src/app/admin/products/[id]/page.tsx
src/components/admin/product-status-modal.tsx
```

### Endpoints

```text
GET   /admin/products
GET   /admin/products/:id
PATCH /admin/products/:id/suspend
PATCH /admin/products/:id/reactivate
PATCH /admin/products/:id/archive
GET   /admin/products/:id/performance
```

### Product columns

- Product name
- Supplier
- Retail price
- Gross CPA
- Affiliate payout
- Platform fee
- Available stock
- Reserved stock
- Status
- Active order count
- Delivery rate
- RTO rate
- Escrow coverage
- Created date

Suspension must:

- Hide the product from new marketplace traffic.
- Preserve existing order snapshots.
- Avoid changing existing ledger entries.
- Not cancel current orders automatically.
- Create an audit event.

Reactivation must rerun:

- Supplier active status
- Stock availability
- CPA rules
- Escrow coverage

---

## 11. Phase Ten: improve users and call-center agents

### Existing backend files

- `src/modules/wallets/admin.controller.ts`
- `src/modules/users/users.controller.ts`
- `src/modules/users/users.service.ts`
- `src/modules/users/entities/user.entity.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/strategies/jwt.strategy.ts`

### New DTO files

```text
src/modules/users/dto/admin-update-user-status.dto.ts
src/modules/users/dto/admin-update-user-role.dto.ts
src/modules/users/dto/admin-create-agent.dto.ts
src/modules/users/dto/admin-assign-agent.dto.ts
```

### 11.1 Validate role changes

Use `@IsEnum(Role)`.

Reject:

- Unknown roles
- Self-demotion
- Demotion of the last admin
- Call-center agents without a valid supplier tenant
- Incompatible wallet ownership
- Invalid target users

### 11.2 Add agent management

Endpoints:

```text
POST  /admin/agents
GET   /admin/agents
PATCH /admin/agents/:id/tenant
PATCH /admin/agents/:id/status
```

Verify the supplier tenant exists and is active.

### 11.3 Invalidate stale sessions

Add `tokenVersion` to `User`.

Include it in JWT payloads.

In `JwtStrategy.validate()`:

- Load the current user.
- Verify `isActive`.
- Verify token version.
- Verify current role and tenant.

This makes suspension and role changes effective immediately.

### 11.4 Improve frontend user management

Update `src/app/admin/users/page.tsx`:

- Replace `any` casts with typed roles.
- Replace browser `alert()` and `confirm()` with project modals.
- Add agent tenant assignment.
- Add user detail view.
- Show wallet owner type.
- Show audit history.
- Prevent invalid self-role changes.

---

## 12. Phase Eleven: add audit logging

### New backend files

```text
src/modules/audit/entities/audit-log.entity.ts
src/modules/audit/audit.module.ts
src/modules/audit/audit.service.ts
src/modules/audit/audit.controller.ts
src/modules/audit/decorators/audit-action.decorator.ts
src/modules/audit/interceptors/audit.interceptor.ts
```

### Audit fields

Store:

- Acting admin
- Action
- Entity type
- Entity ID
- Before state
- After state
- Reason
- IP address
- Timestamp

Audit:

- Withdrawal approval/rejection/payment
- User suspension/reactivation
- Role changes
- Agent assignment
- Product suspension/reactivation
- Manual reconciliation
- Webhook replay
- Admin order notes
- Manual operational corrections

Add:

```text
src/app/admin/audit-log/page.tsx
```

---

## 13. Phase Twelve: improve admin statistics

### New backend files

```text
src/modules/admin/admin.module.ts
src/modules/admin/admin.service.ts
src/modules/admin/dto/admin-metrics-query.dto.ts
```

Move raw SQL aggregation out of `admin.controller.ts` into `AdminService`.

### Replace ambiguous metrics

Return explicit groups:

```ts
{
  users: {
    totalAffiliates: number;
    totalSuppliers: number;
    totalAgents: number;
    activeUsers: number;
    suspendedUsers: number;
  },
  orders: {
    total: number;
    leadGenerated: number;
    supplierConfirmed: number;
    dispatched: number;
    inTransit: number;
    delivered: number;
    canceled: number;
    rtoInTransit: number;
    returnedToSupplier: number;
  },
  finance: {
    platformWalletBalance: number;
    platformFeesLifetime: number;
    platformFeesToday: number;
    platformFeesThisMonth: number;
    supplierEscrowAvailable: number;
    affiliateWalletLiability: number;
    pendingWithdrawalAmount: number;
    pendingWithdrawalCount: number;
    reconciliationVariance: number;
  },
  risk: {
    suppliersBelowCoverage: number;
    productsBelowStockThreshold: number;
    stuckOrders: number;
    failedWebhooks: number;
    unsettledDeliveredOrders: number;
  }
}
```

Do not label the current platform wallet balance as lifetime revenue.

Support:

```text
GET /admin/stats?from=...&to=...
```

---

## 14. Phase Thirteen: admin frontend information architecture

### New routes

```text
src/app/admin/withdrawals/page.tsx
src/app/admin/orders/page.tsx
src/app/admin/orders/[id]/page.tsx
src/app/admin/products/page.tsx
src/app/admin/products/[id]/page.tsx
src/app/admin/reconciliation/page.tsx
src/app/admin/webhooks/page.tsx
src/app/admin/agents/page.tsx
src/app/admin/audit-log/page.tsx
```

The existing admin overview page should focus on:

- Financial health
- Order health
- Risk alerts
- Recent activity
- Links to operational queues

### New reusable components

```text
src/components/admin/admin-kpi-card.tsx
src/components/admin/admin-alert-list.tsx
src/components/admin/order-filters.tsx
src/components/admin/order-status-timeline.tsx
src/components/admin/withdrawal-status-badge.tsx
src/components/admin/financial-breakdown.tsx
src/components/admin/reconciliation-status-badge.tsx
src/components/admin/webhook-event-table.tsx
src/components/admin/metric-period-selector.tsx
```

### Sidebar

Update `src/components/dashboard/sidebar.tsx` with:

```text
/admin
/admin/withdrawals
/admin/orders
/admin/products
/admin/reconciliation
/admin/webhooks
/admin/agents
/admin/users
/admin/audit-log
```

Add all labels to `src/lib/locales.ts` for English, French, and Arabic. Remove `(t.nav as any)` by defining a complete typed translation shape.

---

## 15. Phase Fourteen: loading, errors, dates, and localization

### Files

- `src/app/admin/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/lib/locales.ts`
- `src/lib/formatters.ts`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/empty-state.tsx`

Every admin screen must provide:

- Loading skeletons
- Empty states
- Inline errors
- Retry action
- Refresh action
- Disabled mutation state
- Success confirmation
- Accessible labels
- Arabic RTL rendering

Do not render zero-value KPIs as if they were real data after a failed request.

Add:

```ts
formatDateTime(value: string | Date, lang: Language): string
```

Use locale-aware formatting:

- `fr-DZ`
- `en-DZ`
- `ar-DZ`

Do not use unlocalized `toLocaleDateString()`.

---

## 16. Phase Fifteen: queue and tracking reliability

### Files

- `src/modules/tracking/tracking.processor.ts`
- `src/modules/tracking/tracking.module.ts`
- `src/modules/orders/orders.service.ts`

### New files

```text
src/modules/tracking/entities/tracking-event.entity.ts
src/modules/tracking/tracking.service.ts
src/modules/tracking/dto/tracking-event.dto.ts
```

### Required behavior

Replace commented provider calls with provider services that:

- Read credentials from environment variables.
- Retry transient errors.
- Use exponential backoff.
- Record attempts.
- Record success or failure.
- Move exhausted jobs to a failed state.
- Do not silently swallow errors.

Use an outbox/tracking event record created in the same transaction as the order or settlement.

Admin should be able to inspect:

- Queued events
- Processed events
- Failed events
- Retry count
- Last error
- Related order

---

## 17. Phase Sixteen: database migrations

Create migrations under:

```text
C:\Users\adz72\Desktop\vitedrop\src\migrations\
```

Recommended order:

### Migration 1: withdrawals

Create `withdrawals`, enums, and indexes.

### Migration 2: ledger improvements

Add:

- `withdrawalId`
- `balanceAfter`
- Transaction indexes
- Settlement uniqueness constraint

### Migration 3: webhook security

Create `webhook_events` and provider event uniqueness.

### Migration 4: order history

Create `order_events`.

### Migration 5: inventory

Add:

- `reservedStock`
- Product status
- Inventory movement table

### Migration 6: audit logs

Create `audit_logs` and indexes.

### Migration 7: session invalidation

Add `tokenVersion`.

### Migration 8: integrity constraints

Add foreign keys and uniqueness constraints for:

- Order affiliate
- Order supplier
- Order product
- Wallet owner
- Wallet transaction wallet
- Wallet transaction order
- Non-null tracking number uniqueness
- One wallet per owner/type

Before applying foreign keys, create a cleanup/check script for orphaned rows.

---

## 18. Testing plan

### 18.1 Backend unit tests

Add tests for:

#### Withdrawals

- Pending request creation
- Insufficient funds
- Approve only from pending
- Reject only from pending
- Rejection restores funds through a compensating transaction
- Paid requires approved
- Failed payout restores funds
- Duplicate actions are rejected
- Concurrent requests serialize correctly

#### State machine

- Every allowed transition
- Every invalid transition
- Delivered cannot become RTO
- Canceled cannot become delivered
- RTO cannot become delivered
- RTO can become returned-to-supplier
- Supplier cannot manually mark delivered

#### Settlement

- Exactly three transactions on delivery
- No transactions on RTO
- Duplicate webhook is idempotent
- Concurrent delivery does not lose wallet balance
- Insufficient supplier balance rolls back everything
- Unique settlement constraint rejects duplicates

#### Checkout

- Invalid affiliate rejected
- Suspended affiliate rejected
- Missing product rejected
- Inactive product rejected
- Quantity beyond stock rejected
- Invalid wilaya rejected
- Stock reservation is atomic

#### Webhooks

- Invalid signature rejected
- Expired timestamp rejected
- Replay ignored
- Unknown tracking number rejected
- Valid delivery processes once
- Unknown status is recorded as ignored

### 18.2 Integration tests

Extend:

```text
C:\Users\adz72\Desktop\vitedrop\src\scripts\full-test-suite.ts
```

Cover:

- Admin withdrawal lifecycle
- Admin order filtering
- Product suspension/reactivation
- Reconciliation output
- Webhook signature validation
- Concurrent settlement
- Stock reservation
- Role/session invalidation

### 18.3 Frontend tests

Cover:

- Withdrawal modal validation
- Approval mutation refresh
- Rejection reason requirement
- Paid reference requirement
- Admin filters
- Arabic RTL rendering
- Loading and error states
- Disabled mutation buttons
- No fake success after API failure

### 18.4 Manual acceptance tests

Verify:

1. Admin sees admin routes only.
2. Supplier cannot use admin APIs.
3. Affiliate cannot use admin APIs.
4. Pending withdrawals display as pending.
5. Rejection restores the affiliate wallet.
6. Approval and payment do not debit twice.
7. Invalid courier requests cannot settle orders.
8. Duplicate delivery webhook creates no duplicate payout.
9. Delivered cannot become RTO.
10. RTO does not affect wallets.
11. Stock cannot be oversold.
12. Arabic admin pages align correctly.
13. Financial values use DZD and monospace styling.
14. Failed API requests show explicit errors.

---

## 19. Recommended implementation milestones

### Milestone 1: security and accounting foundation

Implement:

- Production-safe migrations
- Strict validation
- Authenticated webhooks
- Legal state transitions
- Wallet row locking
- Settlement uniqueness

### Milestone 2: withdrawal operations

Implement:

- Withdrawal entity
- Pending/approved/paid/rejected/failed lifecycle
- Compensating ledger entries
- Admin withdrawal endpoints
- Working frontend actions
- Audit records

### Milestone 3: admin operations

Implement:

- Global order management
- Product operations
- Reconciliation
- Webhook monitoring
- Clear overview metrics

### Milestone 4: inventory and governance

Implement:

- Stock reservation
- Inventory movements
- Supplier exposure
- Agent management
- Session invalidation
- Safe role updates

### Milestone 5: analytics and reliability

Implement:

- Tracking outbox
- Retryable pixel events
- Courier metrics
- Performance analytics
- Scheduled reconciliation
- Exportable reports

---

## 20. Definition of done

The admin platform is complete only when:

- Withdrawal buttons perform real backend actions.
- Pending withdrawals are truly pending.
- Rejected withdrawals restore funds through the ledger.
- Courier webhooks are authenticated and replay-safe.
- Delivery settlement locks all affected wallets.
- Order transitions are explicitly validated.
- Delivered orders cannot silently become RTO.
- Stock is reserved atomically.
- Affiliate identity is validated at checkout.
- Admin can inspect every order and financial settlement.
- Admin can suspend/reactivate products without changing historical snapshots.
- Ledger reconciliation reports inconsistencies.
- Role changes are validated and audited.
- Agent tenant assignments are manageable.
- Suspended users lose access promptly.
- Database changes use versioned migrations.
- Admin screens have complete loading, error, empty, localization, and RTL behavior.
- Tests cover concurrency, financial idempotency, state transitions, webhook security, stock reservation, and withdrawal lifecycle.
