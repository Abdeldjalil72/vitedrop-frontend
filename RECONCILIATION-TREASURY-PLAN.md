# Swiss Haute Treasury Reconciliation Plan

## Objective

Align `/admin/reconciliation` with ViteDrop's Swiss Haute Treasury mode while preserving the existing reconciliation contracts and accounting rules.

The finished page should make reconciliation status immediately legible to an admin, keep all financial values auditable, and provide equivalent experiences on desktop, tablet, and mobile in French, English, and Arabic RTL.

## Scope

Primary route:

- `src/app/admin/reconciliation/page.tsx`

Related production surfaces:

- `src/components/admin/reconciliation-summary.tsx`
- `src/components/admin/reconciliation-status-badge.tsx`
- `src/components/admin/admin-page-header.tsx`
- `src/components/admin/responsive-admin-list.tsx`
- `src/lib/api-client.ts`
- `src/lib/locales.ts`
- `src/lib/formatters.ts`
- `src/app/globals.css`

Existing API endpoints to preserve:

- `GET /admin/reconciliation/summary`
- `GET /admin/reconciliation/wallets`
- `GET /admin/reconciliation/orders`
- `POST /admin/reconciliation/runs`
- `GET /admin/reconciliation/runs`
- `GET /admin/reconciliation/runs/:id`

## Current Gaps

### Visual system gaps

- Reconciliation cards and tables still use mostly neutral borders and rounded-xl surfaces.
- The page does not consistently use the Treasury sandstone canvas (`#f8f7f4`), stone border (`#e7e5df`), Racing Green (`#064e3b`), and Brushed Gold (`#d97706`) semantics.
- The run button uses a neutral black action rather than a clear Racing Green reconciliation trigger.
- Wallet owner badges and anomaly states do not consistently use the shared Treasury badge geometry.
- Mobile cards are implemented locally instead of using the shared responsive admin-list pattern.

### Localization and RTL gaps

- Most labels branch only between Arabic and French; English parity is incomplete.
- Several mobile labels are hardcoded in French, including wallet balance, ledger sum, variance, and order CPA labels.
- Status and run-result text is not consistently localized.
- Physical alignment and spacing should be reviewed for logical RTL behavior across tables, cards, tabs, and action links.

### Data and type-safety gaps

- `runs` is typed as `any[]`.
- `apiRunReconciliation()` returns `run: any`.
- `apiGetReconciliationRuns()` returns `Promise<any[]>`.
- The summary adapter currently sets `ordersWithDuplicateTransactions` to `0` instead of consuming a backend field when available.
- Run history is rendered from a loosely typed object and does not expose a detail link or the full audit result.
- Loading and error handling use broad `any` catches in the page.

### Operational UX gaps

- The page loads all four data sources together, but the runs request silently falls back to an empty array with `.catch(() => [])`, hiding a history API failure.
- A reconciliation run has no explicit confirmation, run identity, or result summary before the page refreshes.
- Wallet and order discrepancy records do not provide consistent audit context such as owner ID, tracking number, expected CPA, and calculated delta in the mobile hierarchy.
- The page does not clearly distinguish “no discrepancies” from “data could not be loaded.”

## Design Direction

### Treasury visual tokens

Use the existing Brand Bridge tokens and avoid introducing a competing palette:

- Canvas: `#f8f7f4`
- Container/card surface: `bg-white`
- Stone border: `#e7e5df`
- Escrow/reconciled state: `#064e3b` and emerald semantic tones
- Payout/accounting caution: brushed gold `#d97706` and amber semantic tones
- Discrepancy/risk: rose semantic tones
- Technical and financial values: `font-mono`

Use `rounded-2xl`, subtle `shadow-xs`, and stable hover/focus states consistent with the withdrawal clearinghouse.

### Information hierarchy

The page should read in this order:

1. Audit purpose and current system posture.
2. Summary of wallets, variance, delivered-order settlement, and latest run.
3. Primary Racing Green “Run reconciliation” action.
4. Discrepancy tabs with visible counts.
5. Evidence rows/cards with technical IDs, financial comparisons, and next action.
6. Historical run evidence.

### Status semantics

- Reconciled: emerald / Racing Green.
- Pending or requires review: amber / Brushed Gold.
- Discrepancy: rose, with text and icon in addition to color.
- Audit action in progress: disabled control with spinner and explicit localized label.

## Implementation Plan

### Phase 1 — Stabilize contracts and types

1. Add explicit interfaces in `src/lib/api-client.ts`:
   - `ReconciliationRun`
   - `ReconciliationRunDetail` if the backend detail shape differs.
   - `ReconciliationRunsResponse` if the collection endpoint returns an envelope.
2. Replace `any` return types from:
   - `apiRunReconciliation()`
   - `apiGetReconciliationRuns()`
3. Normalize backend response fields in the API client rather than in JSX.
4. Preserve the reconciliation domain vocabulary:
   - Wallet cached balance versus ledger sum.
   - Expected CPA versus supplier debit, affiliate payout, and platform fee.
   - Wallet variance and order settlement anomaly.
5. Extend the summary adapter to consume duplicate-transaction counts when provided by the backend instead of always returning `0`.
6. Use `unknown` in catches and narrow with `instanceof Error`.
7. Do not change accounting behavior or create wallet mutations in this UI task. Reconciliation remains read-only except for the explicit audit-run endpoint.

### Phase 2 — Centralize localized copy

1. Add reconciliation translations for `fr`, `en`, and `ar` in `src/lib/locales.ts`.
2. Cover:
   - Page eyebrow, title, description.
   - Refresh and run actions.
   - Running, success, and failure messages.
   - Summary card labels and helper text.
   - Wallet discrepancy columns and mobile labels.
   - Order anomaly columns and mobile labels.
   - Run-history columns, statuses, and empty states.
   - Inspect/review links.
3. Keep all amounts, dates, IDs, tracking numbers, and order references formatted through existing formatters.
4. Ensure Arabic strings use logical layout classes and do not require physical left/right overrides.

### Phase 3 — Apply Swiss Treasury surfaces

1. Update the page root and authenticated content surface to use the sandstone Treasury canvas where consistent with `DashboardLayout`.
2. Replace reconciliation-specific neutral borders with `border-[#e7e5df]`.
3. Upgrade summary cards:
   - `rounded-2xl`.
   - Stone border.
   - Consistent padding at phone, tablet, and desktop widths.
   - `font-mono` for all financial values and counts.
   - Emerald state for zero variance.
   - Amber/rose state for review and discrepancy conditions.
4. Update `AdminPageHeader` usage:
   - Treasury/audit eyebrow with a neutral or emerald variant.
   - Racing Green primary run action.
   - Secondary refresh action with visible loading state.
5. Keep the page aligned with the withdrawal page rather than copying the standalone preview shell or Tailwind CDN styles.

### Phase 4 — Improve summary and run controls

1. Add a concise audit posture line:
   - Last run time.
   - Current variance state.
   - Wallet/order anomaly counts.
2. Add an accessible confirmation step before starting a new reconciliation run if the backend operation is non-trivial or expensive.
3. On success:
   - Show a localized success alert.
   - Include the returned run ID when available.
   - Refresh summary, discrepancies, and run history.
4. On failure:
   - Keep the page data visible.
   - Show the error explicitly.
   - Re-enable the controls.
   - Do not replace existing data with an empty state.
5. Make refresh and run actions announce disabled/loading states to assistive technology.

### Phase 5 — Build mobile card parity

#### Wallet discrepancy cards

Each card should show:

- Wallet ID in monospace.
- Owner type badge.
- Owner ID or available identity context.
- Cached balance.
- Ledger sum.
- Variance with explicit sign and DZD formatting.
- Reconciliation status badge.

#### Order discrepancy cards

Each card should show:

- Order ID link.
- Order status.
- Tracking number when available.
- Issue text.
- Expected CPA.
- Supplier debit.
- Affiliate payout.
- Platform fee.
- Inspect/review action.

#### Run-history cards

Each card should show:

- Run ID.
- Timestamp.
- Wallets audited.
- Wallets with variance.
- Order audit counts when available.
- Localized result badge.
- Detail link when the detail endpoint can be used.

Use the shared mobile card rhythm from `ResponsiveAdminList`: clear separation, logical text alignment, no clipped identifiers, and no horizontal page overflow.

### Phase 6 — Improve desktop evidence tables

1. Use consistent Treasury table headers:
   - `text-xs`.
   - Uppercase/technical labels where appropriate.
   - `text-start` and `text-end` logical alignment.
2. Use standard row padding and stone dividers.
3. Keep long IDs/tracking numbers readable with controlled truncation and an accessible full-value label or detail link.
4. Use semantic status badges instead of raw colored text.
5. Keep financial columns aligned with `font-mono` tabular numerals.
6. Ensure discrepancy amounts are visually prominent without relying only on red color.

### Phase 7 — API failure and state behavior

1. Separate loading state from empty state.
2. Preserve successfully loaded sections if one secondary endpoint fails, while showing an explicit section-level error.
3. Add retry behavior for failed summary, discrepancy, or run-history loads.
4. Prevent duplicate run requests while a run is in progress.
5. Refresh all reconciliation data after a successful run.
6. Ensure stale run results cannot overwrite newer results when refreshes resolve out of order.

### Phase 8 — Accessibility and motion

1. Use semantic `role="status"` or `role="alert"` for success/error feedback.
2. Ensure tabs expose selected state and remain keyboard accessible.
3. Give icon-only controls accessible names.
4. Mark decorative icons as `aria-hidden`.
5. Use logical `text-start`, `text-end`, `ms-*`, and `me-*` utilities.
6. Preserve visible focus rings against sandstone and white surfaces.
7. Keep animations subtle:
   - Use existing Motion patterns only where they clarify state.
   - Do not animate financial values in a way that obscures the final value.
   - Respect reduced-motion preferences.

## QA and Verification Plan

### Functional checks

- Admin can load summary, wallet discrepancies, order discrepancies, and run history.
- A reconciliation run can be started once and cannot be double-submitted.
- Successful runs refresh all sections and appear in history.
- Failed runs show an explicit error and preserve previous data.
- Wallet records link to the correct owner and display cached-versus-ledger values.
- Order records show supplier debit, affiliate payout, platform fee, expected CPA, and issue.
- Run history uses the typed collection response and does not silently hide endpoint failures.

### Localization checks

- French, English, and Arabic labels exist for every visible state.
- Arabic sets `dir="rtl"`.
- Tables, cards, tabs, buttons, and links preserve logical ordering.
- Dates and DZD values use the existing localized formatters.

### Responsive checks

Test at:

- `390x844`
- `768x1024`
- `1440x900`

Verify:

- No document-level horizontal overflow.
- Summary cards remain readable.
- Tables scroll only within their intended region on tablet/desktop.
- Mobile cards expose all critical evidence without clipping.
- Header actions wrap without overlap.
- Sidebar desktop and mobile behavior remains unchanged.

### Validation commands

```powershell
npx eslint src/app/admin/reconciliation/page.tsx src/components/admin/reconciliation-summary.tsx src/components/admin/reconciliation-status-badge.tsx src/lib/api-client.ts
npx tsc --noEmit
npm run test:e2e -- --workers=1
git diff --check
```

Add focused Playwright coverage for:

- Reconciliation page loading.
- Successful run and refresh.
- Failed run recovery.
- Empty, discrepancy, and history states.
- Arabic RTL rendering.
- No overflow at the three representative viewports.

## Acceptance Criteria

- The reconciliation page visibly belongs to Treasury Operations and matches the Swiss Haute Treasury language used by withdrawals.
- All four summary concepts are clear: wallets audited, wallet variance, delivered-order settlement, and latest run.
- Wallet, order, and run-history records have mobile card parity with desktop evidence.
- French, English, and Arabic/RTL have complete visible-copy parity.
- Every financial value and technical identifier uses the established formatting rules.
- API errors are explicit and do not become silent empty states.
- Reconciliation API contracts are typed without new `any` usage in the touched surface.
- Run actions are safe against duplicate submission and refresh the page with authoritative server data.
- Responsive and accessibility checks pass at the required viewport sizes.

## Out of Scope

- Changing backend reconciliation calculations.
- Changing wallet balances or ledger transaction semantics.
- Adding new reconciliation endpoints.
- Redesigning unrelated admin pages.
- Copying standalone preview markup into production.
