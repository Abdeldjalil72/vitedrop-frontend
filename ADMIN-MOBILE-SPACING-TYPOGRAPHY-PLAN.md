# ViteDrop Admin Mobile Spacing & Typography Plan

## Objective

Improve the admin dashboard experience on phone-sized screens by standardizing spacing, reducing crowded layouts, improving responsive tables, and making the typography feel consistent across French, English, and Arabic.

The goal is to fix the shared causes of the visual problems instead of adding isolated mobile overrides to individual screens.

## 1. Audit findings

### 1.1 Global content padding is too generous on phones

The shared dashboard shell currently uses:

```tsx
<main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
```

At phone width, the page has `16px` horizontal padding while cards, tables, and toolbars add more internal padding. Dense operational pages therefore lose usable width.

Affected areas:

- Orders
- Products
- Withdrawals
- Reconciliation
- Audit log
- Users
- Agents

### 1.2 Vertical rhythm is inconsistent

Admin pages mix:

- `space-y-8`
- `space-y-6`
- `space-y-4`
- `p-6`
- `p-5`
- `p-4`
- `py-3`
- `py-3.5`

This creates inconsistent distances between headers, filters, KPI cards, tables, detail sections, and action groups.

### 1.3 The mobile topbar is crowded

The topbar contains:

- Mobile menu button
- Role badge
- Wallet balance
- Language selector
- Notifications
- Logout

The balance capsule and role text can consume too much width, especially in Arabic.

### 1.4 Typography uses inconsistent font declarations

The root layout loads Inter, while the dashboard and multiple admin cells explicitly use `font-sans`. This can produce different font rendering between:

- Headings
- Sidebar labels
- Buttons
- Table cells
- Metadata
- Arabic text

`font-mono` is appropriate for money and technical identifiers, but should not be applied too broadly.

### 1.5 Tables are scrollable but not necessarily mobile-friendly

Many tables use `overflow-x-auto`, which prevents layout breakage but leaves the user scrolling across seven or more columns. Important values and actions can become difficult to associate with the correct record.

Each table should be classified as one of:

1. Desktop table plus mobile cards
2. Compact mobile table with low-priority columns hidden
3. Intentionally horizontally scrollable technical table

## 2. Responsive design direction

### 2.1 Standard page spacing

Use the following responsive rhythm:

```tsx
className="space-y-5 sm:space-y-6 lg:space-y-8"
```

Use:

- `space-y-5` on phones
- `space-y-6` on tablets
- `space-y-8` on desktop

### 2.2 Standard page padding

Update the shared shell to:

```tsx
className="flex-1 px-3 py-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto"
```

For dense pages:

```tsx
className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
```

### 2.3 Standard card padding

Use:

```tsx
p-4 sm:p-5 lg:p-6
```

This provides:

- `16px` on phones
- `20px` on tablets
- `24px` on desktop

### 2.4 Standard grid gaps

Use:

```tsx
gap-3 sm:gap-4
```

for KPI cards, filters, and action groups unless a larger gap is intentional.

## 3. Files to update

### 3.1 Shared dashboard shell

File:

- `src/components/dashboard/dashboard-layout.tsx`

Changes:

- Reduce mobile main-content padding.
- Add an optional `data-dashboard-role` attribute for role-specific responsive rules.
- Keep the existing RTL direction handling.
- Verify mobile navigation closes after every sidebar link action.
- Preserve the existing authentication and role redirect behavior.

Suggested shell:

```tsx
<main className="flex-1 px-3 py-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
```

### 3.2 Topbar

File:

- `src/components/dashboard/topbar.tsx`

Changes:

- Reduce header height to `h-14` on phones and retain `sm:h-16`.
- Use `px-3 sm:px-6`.
- Use `gap-1 sm:gap-3` on the right-side controls.
- Reduce role badge padding on phones.
- Compact the wallet capsule and constrain its width.
- Keep logout icon-only on phones.
- Keep the language switcher and notification icon usable with touch-friendly hit areas.

Suggested patterns:

```tsx
<header className="h-14 sm:h-16 ... px-3 sm:px-6">
```

```tsx
<div className="flex items-center gap-1 sm:gap-3">
```

```tsx
className="max-w-[112px] px-2 py-1 sm:px-3 sm:py-1.5 ..."
```

### 3.3 Sidebar

File:

- `src/components/dashboard/sidebar.tsx`

Changes:

- Use a responsive drawer width:

```tsx
w-[min(18rem,calc(100vw-2rem))]
```

- Reduce mobile navigation padding to `px-2.5 py-3`.
- Keep navigation links touch-friendly while reducing excessive horizontal padding.
- Add safe-area bottom padding for devices with home indicators.
- Verify Arabic labels do not create unwanted wrapping.
- Preserve the current active-route behavior using `usePathname()`.

## 4. Admin page updates

### 4.1 Admin overview

File:

- `src/app/admin/page.tsx`

Changes:

- Replace `space-y-8` with `space-y-5 sm:space-y-6 lg:space-y-8`.
- Use a two-column KPI grid on phones:

```tsx
grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4
```

- Change KPI cards from `p-6` to `p-4 sm:p-5 lg:p-6`.
- Use `text-2xl` KPI values on phones and `sm:text-3xl` on larger screens.
- Limit KPI descriptions to one or two lines.
- Move the escrow pool indicator below the heading on phones.

### 4.2 Orders

Files:

- `src/app/admin/orders/page.tsx`
- `src/components/admin/order-filters.tsx`

Changes:

- Keep the desktop table at `sm` and above.
- Add a mobile order-card representation containing:
  1. Order ID and date
  2. Customer and Wilaya
  3. Product and quantity
  4. Status
  5. CPA amount
  6. Supplier/affiliate summary
  7. Details action
- If a card conversion is deferred, hide low-priority columns under `sm`.
- Keep customer, product, status, amount, and details visible on phones.
- Stack filter controls vertically.
- Make filter inputs full width.
- Use a compact two-column action row for reset/apply controls.
- Move advanced filters into a disclosure section if the filter block remains too tall.

### 4.3 Products

File:

- `src/app/admin/products/page.tsx`

Changes:

- Use a mobile product card containing:
  - Product name and status
  - Supplier
  - Retail price and CPA
  - Available/reserved stock
  - Delivery rate
  - Primary action
- Keep the complete table on desktop.
- Move secondary operational actions into an overflow menu on phones.
- Prevent stock values from wrapping unpredictably.

### 4.4 Product detail

File:

- `src/app/admin/products/[id]/page.tsx`

Changes:

- Use a two-column KPI grid on phones:

```tsx
grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4
```

- Use `p-4 sm:p-5` for metric cards.
- Stack the product title and actions on phones.
- Make product actions full-width or use a two-column action layout.
- Keep archive/suspend actions visually separate from informational content.
- Use `space-y-5 sm:space-y-6` for detail sections.
- Continue rendering `deliveryRate` directly as a percentage and pair it with `deliveredOrders / totalOrders`.

### 4.5 Withdrawals

File:

- `src/app/admin/withdrawals/page.tsx`

Changes:

- Replace `space-y-8` with `space-y-5 sm:space-y-6 lg:space-y-8`.
- Use compact withdrawal cards on phones.
- Keep amount prominent in `font-mono`.
- Place masked recipient data below the amount.
- Put approve/reject actions in a full-width bottom row.
- Keep dangerous actions visually distinct.

### 4.6 Reconciliation

File:

- `src/app/admin/reconciliation/page.tsx`

Changes:

- Use a two-column summary grid where labels fit.
- Convert wallet discrepancies, order anomalies, and run history rows into cards on phones.
- Use one-line summaries with expandable details for technical information.
- Make the reconciliation action full width on small screens.
- Stack the refresh and run buttons:

```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
```

Suggested action layout:

```tsx
<div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
```

### 4.7 Webhooks

File:

- `src/app/admin/webhooks/page.tsx`

Changes:

- Use compact webhook event cards on phones.
- Truncate tracking identifiers visually while preserving copy/detail access.
- Move raw JSON payloads into a modal or drawer.
- Keep only the most important status, tracking, provider, and timestamp information in the primary mobile view.

### 4.8 Audit log

File:

- `src/app/admin/audit-log/page.tsx`

Changes:

- Use mobile cards ordered as:
  1. Timestamp
  2. Action
  3. Admin identity
  4. Resource
  5. Reason
  6. Expandable before/after data
- Move JSON metadata and before/after values into a disclosure or modal.
- Use `break-all` only inside controlled technical blocks.

### 4.9 Users and agents

Files:

- `src/app/admin/users/page.tsx`
- `src/app/admin/agents/page.tsx`

Changes:

- Convert identity-heavy rows into mobile cards.
- Use:
  - Avatar `w-8 h-8` on phones and `w-9 h-9` on desktop
  - Name `text-sm`
  - Email `text-[11px]`
  - Technical ID `text-[10px]`
- Keep one primary action and place secondary actions in an overflow menu.
- Preserve the existing identity-box design pattern.

### 4.10 Order detail

File:

- `src/app/admin/orders/[id]/page.tsx`

Changes:

- Stack header actions below order identity.
- Move financial breakdown near the top.
- Use compact definition-list rows for customer and logistics information.
- Keep the status timeline full width.
- Separate notes and webhook actions into clear sections.
- Change fixed section padding to `p-4 sm:p-5`.
- Keep the main detail layout single-column until `lg`:

```tsx
grid-cols-1 lg:grid-cols-3
```

## 5. Typography correction

### 5.1 Use one primary UI font

Files:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/dashboard/dashboard-layout.tsx`
- Admin page components that explicitly override `font-sans`

Recommended direction:

1. Keep Inter as the primary UI font.
2. Define it through a CSS variable or a single global body declaration.
3. Remove unnecessary `font-sans` overrides from admin components.
4. Keep `font-serif-luxury` only for the ViteDrop logo.
5. Keep `font-mono` for:
   - DZD amounts
   - Wallet values
   - Order/user IDs
   - Tracking numbers
   - Ledger values
   - Other technical identifiers

Avoid using `font-mono` for regular table labels or prose.

### 5.2 Standard dashboard type scale

| Element | Phone | Desktop |
| --- | --- | --- |
| Page title | `text-2xl` | `text-3xl` |
| Page description | `text-xs` | `text-sm` |
| Card title | `text-sm` | `text-base` |
| Table primary text | `text-xs` or `text-sm` | `text-sm` |
| Table metadata | `text-[11px]` | `text-xs` |
| Technical ID | `text-[10px]` | `text-[10px]` |
| KPI value | `text-2xl` | `text-3xl` |
| Action button | `text-xs` | `text-xs` or `text-sm` |

### 5.3 Arabic typography

Arabic UI text should not inherit aggressive Latin-oriented tracking rules. Review and reduce where needed:

- `tracking-tight`
- `tracking-wider`
- Uppercase kicker labels
- Monospace labels

Arabic must remain readable in:

- Topbar role labels
- Sidebar navigation
- KPI labels
- Filter controls
- Table/card actions
- Modal buttons

## 6. Shared components

### 6.1 Admin page header

Add:

- `src/components/admin/admin-page-header.tsx`

Responsibilities:

- Eyebrow
- Page title
- Description
- Responsive actions
- Arabic-aware layout
- Standardized vertical spacing

Suggested API:

```tsx
<AdminPageHeader
  eyebrow="Global Order Operations"
  title="Gestion & Suivi des Commandes"
  description="..."
  actions={<Button ... />}
/>
```

Behavior:

- Phone: stacked title and actions
- Tablet: partially horizontal where space allows
- Desktop: title left and actions right

### 6.2 Responsive admin list

Add:

- `src/components/admin/responsive-admin-list.tsx`

Responsibilities:

- Desktop table rendering
- Mobile card rendering
- Loading state
- Empty state
- Error state
- Pagination
- Action placement

This should be reused for orders, products, withdrawals, users, agents, webhooks, and audit logs where appropriate.

### 6.3 Responsive metric grid

Add:

- `src/components/admin/admin-metric-grid.tsx`

Standard classes:

```tsx
grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4
```

Metric card padding:

```tsx
p-4 sm:p-5 lg:p-6
```

## 7. Implementation phases

### Phase 1: Shared shell

Update:

- `src/components/dashboard/dashboard-layout.tsx`
- `src/components/dashboard/topbar.tsx`
- `src/components/dashboard/sidebar.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`

Tasks:

- Normalize mobile page padding.
- Compact the topbar.
- Improve mobile drawer width and safe-area behavior.
- Establish one primary font.
- Add role-specific hooks or classes only if needed.

### Phase 2: Shared UI components

Add or update:

- `src/components/admin/admin-page-header.tsx`
- `src/components/admin/admin-metric-grid.tsx`
- `src/components/admin/responsive-admin-list.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`

Tasks:

- Standardize mobile and desktop spacing.
- Preserve touch-friendly button heights.
- Standardize table cell spacing.
- Provide reusable mobile card behavior.

### Phase 3: Primary admin operations

Update:

- `src/app/admin/page.tsx`
- `src/app/admin/orders/page.tsx`
- `src/app/admin/products/page.tsx`
- `src/app/admin/withdrawals/page.tsx`
- `src/app/admin/reconciliation/page.tsx`

Tasks:

- Apply the responsive page rhythm.
- Convert dense tables into mobile cards.
- Reduce mobile card padding.
- Stack action groups.
- Preserve financial information hierarchy.

### Phase 4: Detail and governance pages

Update:

- `src/app/admin/products/[id]/page.tsx`
- `src/app/admin/orders/[id]/page.tsx`
- `src/app/admin/webhooks/page.tsx`
- `src/app/admin/audit-log/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/agents/page.tsx`

Tasks:

- Improve detail-section spacing.
- Move technical payloads into modals/disclosures.
- Make timelines and financial breakdowns readable on phones.
- Standardize technical metadata typography.

### Phase 5: RTL and typography validation

Test:

- French
- English
- Arabic

Verify:

- `dir="rtl"`
- Logical spacing
- Arabic line wrapping
- Button labels
- Mobile navigation
- Tables and cards
- Modal alignment
- Currency and technical values

## 8. Validation plan

Use the local frontend:

- `http://localhost:3000`

Admin credentials:

- Email: `admin@vitedrop.com`
- Password: `password`

Viewport sizes:

- `390x844`
- `768x1024`
- `1440x900`

Pages:

- `/admin`
- `/admin/orders`
- `/admin/orders/[id]`
- `/admin/products`
- `/admin/products/[id]`
- `/admin/withdrawals`
- `/admin/reconciliation`
- `/admin/webhooks`
- `/admin/users`
- `/admin/agents`
- `/admin/audit-log`

For every page verify:

1. No unintended horizontal overflow.
2. Page title and actions do not collide.
3. Cards use consistent vertical spacing.
4. Buttons remain touch-friendly.
5. Tables either scroll intentionally or become mobile cards.
6. Arabic does not overflow or break action layouts.
7. Monetary values remain readable and aligned.
8. Technical IDs truncate safely.
9. Loading and empty states use consistent spacing.
10. Modals fit within the viewport.
11. Sidebar opens and closes correctly.
12. Topbar controls remain usable at the narrowest viewport.

## 9. Recommended implementation order

1. Normalize global font handling.
2. Reduce dashboard shell padding on phones.
3. Compact the topbar and mobile sidebar.
4. Standardize page headers and KPI grids.
5. Convert orders, products, and withdrawals to responsive mobile lists.
6. Improve reconciliation, audit-log, and webhook mobile layouts.
7. Validate French, English, and Arabic.
8. Test all three target viewport sizes.
9. Run the frontend production build.
10. Repeat browser checks after the build and any backend restart.

