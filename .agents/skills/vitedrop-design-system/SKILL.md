---
name: vitedrop-design-system
description: The core UI properties, design tokens, layout conventions, typography system, dashboard architecture, and motion principles for the ViteDrop frontend. Use this as a reference when building new pages or components.
---

# ViteDrop Design System & UI Properties

This skill defines the complete visual language, Tailwind tokens, component patterns, dashboard architecture, and framer-motion principles used across the ViteDrop frontend. Any new pages, dialogs, tables, or components MUST adhere strictly to these guidelines.

---

## 1. Color Palette & Tokens

### Backgrounds
- **Primary Page Background**: `bg-white`
- **Secondary/Offset Background**: `bg-[#fafafa]` (Used for alternating sections, dashboard container)
- **Swiss Haute Treasury / Auth Surface**: `bg-[#f8f7f4]` (Warm sandstone, used for Swiss Treasury cards, auth gateway, and audit summaries)
- **Interactive Pills / Toggles Area**: `bg-[#f4f4f4]` or `bg-[#fbfbfb]`
- **Card Backgrounds**: `bg-white` with subtle border `border border-black/[0.08]` or stone border `border-[#e7e5df]`
- **Table Header Background**: `bg-[#fbfbfb]`

### Text Colors
- **Primary Headings / Strong Text**: `text-black` or `text-neutral-950`
- **Secondary / Muted Text**: `text-[#6b6b6b]` (Descriptions, subtitles, inactive tabs, email subtexts)
- **Muted Technical IDs**: `text-neutral-400`
- **Inverse Text**: `text-white` (Badges, primary buttons, active gradient highlights)

### Brand Accents, Gradients & Treasury Tokens
- **Primary Brand Gradient (ViteDrop Blue)**: `bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb]`
  - *Usage*: Main CTAs, active tab highlights, primary action buttons.
  - *Shadow Pairing*: Always pair with `shadow-md shadow-sky-500/20` (or `hover:shadow-sky-500/35`).
- **British Racing Green (Treasury & Escrow)**: `#064e3b` (`bg-[#064e3b]`, `hover:bg-[#064e3b]/90`, `text-[#064e3b]`)
  - *Usage*: Primary audit trigger CTAs, settled escrow, 0-variance posture indicators.
- **Brushed Gold (Payout Rails & Priority Alerts)**: `#d97706` (`text-amber-800 bg-amber-50 border-amber-200/80`)
  - *Usage*: Algérie Poste CCP rails, high-priority payout badge highlights.
- **Success / Active Pulse**: `bg-[#17c964]` or `bg-emerald-500` (Used as `w-1.5 h-1.5 rounded-full animate-pulse`).
- **Platform Revenue / Escrow Accent**: Emerald tones (`text-emerald-700 bg-emerald-50 border-emerald-200`).

### Borders & Shadows
- **Card / Container Borders**: `border-black/[0.06]` to `border-black/[0.08]`
- **Swiss Treasury Stone Borders**: `border-[#e7e5df]`
- **Dividers**: `border-black/[0.04]`
- **Card Shadow**: `shadow-xs` or `shadow-sm`
- **Modal Shadow**: `shadow-2xl`

---

## 2. Typography System & Hierarchy

### Font Families
- **Primary Sans**: System default Tailwind sans (`font-sans`).
- **Luxury Serif**: `font-serif-luxury` (Used exclusively for the ViteDrop logo brand text).
- **Monospace (`font-mono`)**: Required for all financial numbers (DZD), telephone numbers, dates, order/user IDs, and tracking codes.

### Headings Hierarchy
- **Hero Title**: `text-[46px] sm:text-[68px] lg:text-[80px] font-semibold leading-[1.03] tracking-[-0.07em]`
- **Dashboard Page Title**: `text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1`
- **Page Eyebrow / Kicker**: `text-xs font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border` (e.g. `bg-rose-50 text-rose-700 border-rose-200` for Admin, `bg-sky-50 text-sky-700` for Affiliate).
- **Card / Section Title**: `text-base sm:text-lg font-bold text-neutral-900`

### Table Typography & Spacing
- **Table Headings**: `py-4 text-xs font-bold uppercase tracking-wider text-[#6b6b6b]`
- **Table Row Padding**: `py-4 px-4 align-middle text-start`
- **Table Primary Text (Name/Title)**: `text-sm font-semibold text-neutral-950 tracking-tight leading-snug`
- **Table Secondary Text (Email/Subtext)**: `text-xs text-[#6b6b6b] flex items-center gap-1.5`
- **Table Technical Text (IDs/Codes)**: `text-[10px] text-neutral-400 font-mono tracking-wider`
- **Financial Balances / Amounts**: `font-mono text-sm font-bold text-neutral-900 tracking-tight` (Always formatted via `formatDZD(amount, lang)`)
- **Contact / Phone**: `text-xs font-mono font-medium text-neutral-800 flex items-center gap-1.5` (Always wrap phone numbers in `<span dir="ltr">` so Algerian phone numbers `+213 / 05...` never reverse in Arabic/RTL mode).

### Standard Responsive Spacing & Layout Rhythm
- **Global Page Container**: `px-3 py-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto`
- **Dense Operational Container**: `px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8`
- **Vertical Stack Rhythm**: `space-y-5 sm:space-y-6 lg:space-y-8` (`space-y-5` phones, `space-y-6` tablets, `space-y-8` desktop)
- **Standard Card Padding**: `p-4 sm:p-5 lg:p-6` (`16px` phones, `20px` tablets, `24px` desktop)
- **Standard Grid Gaps**: `gap-3 sm:gap-4` for KPI cards, filters, and operational action bars

---

## 3. UI Components & Design Tokens

### Buttons
- **Primary CTA (Brand Gradient)**:
  ```jsx
  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/20 hover:shadow-sky-500/35 hover:brightness-105 transition-all"
  ```
- **Secondary Button (Outline)**:
  ```jsx
  className="px-4 py-2 rounded-full border border-black/10 hover:border-black/30 bg-white text-black text-xs font-semibold transition-all"
  ```
- **Table Action Button (Pill)**:
  ```jsx
  className="text-xs px-3 py-1.5 rounded-xl font-medium gap-1.5"
  ```
- **Danger Button**:
  ```jsx
  className="text-xs px-3 py-1.5 rounded-xl font-medium gap-1.5 bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100/80"
  ```

### Role Badges
- **Admin**: `bg-rose-50 text-rose-700 border-rose-200/80` (Shield icon)
- **Supplier (Fournisseur)**: `bg-purple-50 text-purple-700 border-purple-200/80` (Briefcase/Store icon)
- **Affiliate (Media Buyer)**: `bg-sky-50 text-sky-700 border-sky-200/80` (Users/TrendingUp icon)
- **Call Center Agent**: `bg-amber-50 text-amber-800 border-amber-200/80` (Headphones icon)
- *Badge standard wrapper*: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs`

### Status & Treasury Posture Badges
- **Active / Livré / Reconciled (0 Variance)**: `bg-emerald-50 text-emerald-700 border-emerald-200/80` with pulsing dot `w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse`
- **Suspended / Annulé / Discrepancy**: `bg-rose-50 text-rose-700 border-rose-200/80` with `w-1.5 h-1.5 rounded-full bg-rose-500`
- **Pending / En attente / Warning**: `bg-amber-50 text-amber-800 border-amber-200/80` with `w-1.5 h-1.5 rounded-full bg-amber-500`

### Postal Payout Rail Badges
- **BaridiMob**: `bg-cyan-50 text-cyan-800 border-cyan-200/80` (Cyan capsule with `CreditCard` icon)
- **Algérie Poste CCP**: `bg-amber-50 text-amber-800 border-amber-200/80` (Amber capsule with `Building2` icon)

### High-Priority Payout Highlight (≥ 20,000 DZD)
- **Threshold Rule**: Any withdrawal amount `>= 20000` is flagged as High Priority across both desktop and mobile viewports.
- **Badge**: `bg-amber-100 text-amber-900 border-amber-300 font-mono font-bold animate-pulse text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1`

### Swiss Haute Treasury Summary Cards
Financial posture cards in the admin treasury overview use warm sandstone surfaces, stone borders, and monospace values:
```jsx
<div className="rounded-2xl border border-[#e7e5df] bg-white p-5 shadow-xs">
  <div className="flex items-center justify-between text-xs text-[#6b6b6b]">
    <span className="font-medium">{title}</span>
    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
  </div>
  <p className="mt-2 text-xl sm:text-2xl font-bold font-mono tracking-tight text-neutral-900">
    {formattedValue}
  </p>
  <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
</div>
```

### 1-Click Clipboard Copy UI Pattern
Standard pattern for RIP, CCP account numbers, order IDs, and technical hashes with visual `Check` feedback (1.5-2s timeout):
```jsx
const [copiedId, setCopiedId] = useState<string | null>(null);

const handleCopy = (id: string, text: string) => {
  navigator.clipboard.writeText(text);
  setCopiedId(id);
  setTimeout(() => setCopiedId(null), 2000);
};

// In JSX:
<div className="flex items-center gap-1.5">
  <span className="font-mono text-xs text-neutral-800">{accountNumber}</span>
  <button
    type="button"
    onClick={() => handleCopy(item.id, accountNumber)}
    className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
    title="Copy to clipboard"
    aria-label="Copy to clipboard"
  >
    {copiedId === item.id ? (
      <Check className="w-3.5 h-3.5 text-emerald-600" />
    ) : (
      <Copy className="w-3.5 h-3.5" />
    )}
  </button>
</div>
```

### Table User Identity Pattern
Every user row in modern tables uses the standard identity box:
```jsx
<div className="flex items-center gap-3">
  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-neutral-100 to-neutral-200/80 border border-black/[0.06] flex items-center justify-center font-bold text-xs text-neutral-800 shrink-0 select-none shadow-2xs">
    {(user.fullName || user.email).slice(0, 2).toUpperCase()}
  </div>
  <div className="flex flex-col min-w-0">
    <span className="font-semibold text-sm text-neutral-950 tracking-tight leading-snug truncate">
      {user.fullName || "Non spécifié"}
    </span>
    <span className="text-xs text-[#6b6b6b] flex items-center gap-1.5 truncate mt-0.5">
      <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
      <span>{user.email}</span>
    </span>
    <span className="text-[10px] text-neutral-400 font-mono tracking-wider mt-0.5">
      ID: {user.id.slice(0, 8)}
    </span>
  </div>
</div>
```

---

## 4. Dashboard Architecture & Standards

### Global `DashboardLayout` Rules
All authenticated dashboard pages (`/admin`, `/supplier`, `/affiliate`, and sub-pages) MUST wrap their content in `DashboardLayout`:
```tsx
<DashboardLayout initialRole="admin" initialLang="fr">
  {({ role, lang, setRole, setLang }) => (
    // Page Content
  )}
</DashboardLayout>
```

#### Core Architecture Behaviors:
1. **Client-Side RBAC Guard**: Evaluates `getCurrentUser()`. If unauthenticated -> redirects to `/login`. If role does not match `initialRole` -> automatically redirects to their authorized dashboard (`/admin`, `/supplier`, or `/affiliate`).
2. **Hook Order Invariance**: All `useEffect` and `useState` declarations MUST remain at the very top of `DashboardLayout` before any `if (!isAuthorized) return` checks to satisfy React Rules of Hooks.
3. **Session Language Persistence**:
   - Language is loaded from `localStorage.getItem("vitedrop_lang") || initialLang`.
   - Any language change persists via `localStorage.setItem("vitedrop_lang", newLang)`.
4. **Live Balance Injection**:
   - `DashboardLayout` dynamically resolves live PostgreSQL balance per role:
     - Affiliates/Suppliers: Fetched via `apiGetMyWallet()` (`/wallets/me`).
     - Admin: Fetched via `apiGetAdminStats()` (`stats.platformRevenue`).
   - The balance is passed reactively to `<Topbar balance={balance} />`.
5. **Next.js `<Link>` Navigation in Sidebar**:
   - Sidebar items MUST use Next.js `<Link href={item.href}>` (never plain `<button>` tags with dummy state).
   - Active route styling is dynamically determined using Next.js `usePathname()`.

---

## 5. Navigation & Topbar Standards

### Language Dropdown Pattern
Both the landing page navbar and dashboard `Topbar` use the unified hoverable dropdown component:
```jsx
<div className="relative group">
  <button
    type="button"
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#f4f4f4] transition-colors text-xs font-semibold text-black"
  >
    <Globe className="w-3.5 h-3.5 text-neutral-500" />
    <span>{lang.toUpperCase()}</span>
    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black transition-colors" />
  </button>
  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-black/[0.06] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1 z-50">
    <button onClick={() => onLangChange("en")} className="w-full text-start px-4 py-2 text-xs font-medium hover:bg-neutral-50">English</button>
    <button onClick={() => onLangChange("fr")} className="w-full text-start px-4 py-2 text-xs font-medium hover:bg-neutral-50">Français</button>
    <button onClick={() => onLangChange("ar")} className="w-full text-start px-4 py-2 text-xs font-medium hover:bg-neutral-50">العربية</button>
  </div>
</div>
```

### Landing Page Auth CTA
The homepage navbar dynamically evaluates `getCurrentUser()`:
- If logged in -> Displays a single direct button to their dashboard: `"Tableau de Bord"` / `"Dashboard"` / `"لوحة التحكم"` linking to their specific role path.
- If logged out -> Displays clean `"Login"` and `"Sign Up"` links.

---

## 6. Internationalization (i18n) & RTL Rules

- **Languages Supported**: French (`fr`, default in Algeria), Arabic (`ar`), English (`en`).
- **Translation Dictionaries**:
  - Landing page: `src/app/locales.ts`
  - Dashboards & Navigation: `src/lib/locales.ts` (`translations[lang]`)
- **RTL Support (Arabic)**:
  - Root container dynamically applies `dir={isRTL(lang) ? "rtl" : "ltr"}`.
  - Text alignment: Always use logical classes (`text-start`, `text-end`) rather than physical (`text-left`, `text-right`).
  - Spacing: Prefer flexbox gaps (`gap-2`, `gap-4`) or logical margins (`ms-`, `me-`).

---

## 7. Motion & Animation Principles

ViteDrop uses buttery Apple-style springs via `motion/react`:
- **Standard Ease**: `ease: [0.16, 1, 0.3, 1]`
- **Spring Setup**: `transition={{ type: "spring", stiffness: 450, damping: 35 }}`
- **Card Hover**: `whileHover={{ y: -3, boxShadow: "0 12px 24px -6px rgba(0, 0, 0, 0.08)" }}`
- **Button Tap**: `whileTap={{ scale: 0.96 }}`

### Responsive Sidebar Animation

- Desktop sidebar collapse/expand must be driven by the sidebar width transition; do not animate a percentage transform at the same time as width, because the changing transform reference size causes drift and overshoot.
- Mobile sidebar drawers should use a transform animation because they overlay the page and leave the document layout width unchanged.
- Keep desktop and mobile timing consistent (`300ms` with the standard ease when using a non-spring desktop transition), and verify opening and closing separately.
- When switching animation strategy by viewport, use a media-query listener and keep the desktop transform at `0`; do not rely on conflicting Tailwind `transition-[transform,width]` classes.

## 8. Admin data and validation conventions

- Keep API contract translation in `src/lib/api-client.ts`. Convert UI pagination to the backend's expected `page`/`limit` fields and normalize compatibility response names there.
- Use explicit loading, empty, and error states for operational pages. Never render `undefined` for a count or status; use a typed fallback or a clear empty state.
- Financial and operational pages must show auditable context: status, actor/reason where applicable, technical identifiers in monospace, and refresh data after mutations.
- Reconciliation cards must distinguish wallets checked, wallet variance, delivered orders audited, settlement anomalies, and latest run. Run history requires a collection endpoint, not only a detail endpoint.
- Product delivery rates are percentage values returned by the backend; render them once with one decimal precision. Pair the rate with delivered/total counts.
- **Product Solvency Invariants Card**: The Swiss Treasury card (`ProductSolvencyCard`) audits the 5 automated solvency invariants with a live compliance pill (e.g. `5/5 Conforme`), British Racing Green indicators, and monospace ledger calculations.
- **Waybill Simulation Modal (`OrderWaybillModal`)**: Renders printable Yalidine / ZR Express bordereau slips with realistic barcode stripes, origin logistics hub, destination customer, and COD collection amount.
- **Phone Number Directional Safety**: Wrap all Algerian telephone numbers in `<span dir="ltr">` with `font-mono` to prevent bi-directional text inversion in Arabic RTL modes.
- **1-Click Clipboard Copying**: Interactive copy triggers for Order IDs, Tracking Numbers, Phone Numbers, User IDs, and Product IDs provide 2000ms checkmark visual feedback.
- **Auditable User Management Modals**: `UserStatusModal` and `UserRoleModal` implement WCAG 2.1 AA dialog accessibility, trilingual labels, mandatory suspension rationale, and anti-self-demotion safeguards.
- **Courier Telemetry & Inspection Modals**: `WebhookPayloadModal` provides formatted JSON payload inspection with 1-click clipboard copy, and `WebhookSimulationModal` enables mock courier delivery/return state testing.
- **Component HTML Props Spreading**: Core table components (`TableRow`, `TableHead`, `TableCell`) and modal containers must accept and forward standard HTML attributes (`...props`, `data-testid`, `role="dialog"`, `aria-modal="true"`).

## 9. Admin QA checklist

- Check all dashboard routes after login with an admin session and confirm unauthorized roles are redirected or rejected.
- Test French and Arabic on at least one dense admin page; verify `dir="rtl"`, logical spacing, and readable tables/timelines.
- Check narrow (`390x844`), tablet (`768x1024`), and desktop (`1440x900`) layouts for horizontal overflow.
- At desktop width, verify sidebar width expands/collapses from `1px` to `256px` without transform overshoot; at mobile width, verify the drawer enters/exits the viewport and the backdrop fades correctly.
- After backend changes, restart or rebuild the backend before browser verification so the browser is not testing stale Nest output.

## 10. Brand Bridge & production learnings

### Two intentional product modes

ViteDrop uses one shared brand grammar with two deliberate modes:

- **Public Growth**: electric blue, conversion-focused hierarchy, product discovery, and visible unit economics.
- **Auth Gateway**: warm sandstone (`#f8f7f4`), the official `Source Serif 4` ViteDrop wordmark, and a concise DZ-58 double-entry security note.
- **Treasury Operations**: sandstone surfaces, stone borders (`#e7e5df`), British Racing Green (`#064e3b`) for escrow and settled funds, brushed gold (`#d97706`) for BaridiMob/CCP payout rails, and Space Mono for auditable values.

Do not flatten these modes into one generic color scheme. Connect them through shared typography, logo geometry, icon family, radius, borders, focus states, localization, and motion tokens.

### Authentication error boundary

The shared API client must not redirect every `401` response to `/login`. A `401` from an authentication endpoint such as `/auth/login` is a form validation failure and must be returned to the login page so the user can retry without navigation or refresh. Automatic session-expiry redirects apply only to non-authentication API requests.

Example:

```ts
const isAuthRequest = path.startsWith("/auth/");
if (response.status === 401 && !isAuthRequest) {
  // Clear the expired session and redirect from a protected surface.
}
```

### Production validation baseline

Before extending the visual system to another dashboard surface, verify:

- invalid credentials stay on `/login` and preserve the form for retry;
- successful authentication routes by decoded role;
- protected API expiry redirects only from protected surfaces;
- French, English, and Arabic/RTL rendering work on a dense operational screen;
- no document-level horizontal overflow exists at approximately `390px`, `768px`, or `1440px`;
- real withdrawal records exercise both BaridiMob and CCP, priority thresholds, approve/reject mutations, and post-mutation refresh.

Keep standalone preview pages as design-review artifacts. Do not copy their review shell, Tailwind CDN usage, or placeholder translations into production screens.

## 11. Responsive Admin Lists & Data Tables (`ResponsiveAdminList`)

Operational admin pages (`/admin/withdrawals`, `/admin/reconciliation`, etc.) MUST use `ResponsiveAdminList` or follow its dual-render contract:

- **Desktop Table (`hidden sm:block`)**:
  - Full tabular layout using semantic `table`, `thead`, `tbody`.
  - Column headers formatted with uppercase tracking (`text-xs font-bold uppercase tracking-wider text-[#6b6b6b]`).
  - Rows tagged with `data-testid="<context>-row"` (e.g. `withdrawal-row`, `reconciliation-run-row`).
- **Mobile Card View (`block sm:hidden`)**:
  - Dense card items tagged with `data-testid="<context>-card"` (e.g. `withdrawal-card`, `reconciliation-run-card`).
  - Key-value metadata displayed in concise rows with small monospace IDs, dates, and amounts.
  - Interactive action buttons must be easily tap-targetable (`py-2 px-3`).
- **Pagination & Counter Contract**:
  - Includes total count summary (`Showing X to Y of Z`).
  - Accessible previous/next buttons with disabled styling when on first or last page.
  - Empty state with clear context message when list is empty.

## 12. Accessible Action Modals & Form Dialogs (WCAG 2.1 AA)

All interactive modals (withdrawal approvals/rejections, audit run confirmations, dispute triggers) must meet these accessibility standards:

- **Modal Dialog Semantics**:
  - Container must declare `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="modal-title"`.
  - The title element must have `id="modal-title"`.
- **Keyboard Dismissal & Event Listeners**:
  - Must attach a native `keydown` listener to `window` for `Escape` key dismissal.
  - Clicking the backdrop or cancel button must cleanly close the modal and reset validation errors.
- **Form Submission & Native Validation Bypass**:
  - Forms must specify `<form noValidate onSubmit={handleSubmit}>`. This prevents browser-native tooltips from invisibly blocking submission before custom React validation logic executes.
- **Error Summary Alerting**:
  - Field errors and API rejections must be surfaced inside an alert box with `role="alert"`:
    ```jsx
    {error && (
      <div role="alert" className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200/80">
        {error}
      </div>
    )}
    ```
- **Loading State**:
  - Submit buttons must indicate pending state (spinner or `opacity-50 pointer-events-none`) and prevent duplicate submissions.

## 13. Playwright End-to-End (E2E) Testing Standards

Follow these testing patterns for robust test automation across ViteDrop:

- **Session Auth Pre-Injection via `addInitScript`**:
  - Inject auth tokens before page initialization to eliminate redundant login hops and redirects:
    ```ts
    await page.addInitScript(() => {
      localStorage.setItem("vitedrop_token", "fake-admin-jwt");
      localStorage.setItem("vitedrop_user", JSON.stringify({
        id: "admin-1",
        email: "admin@vitedrop.com",
        role: "admin",
      }));
    });
    ```
- **Scoped Route Mocking (`http://localhost:4000/*`)**:
  - Mock backend API endpoints explicitly matching the API URL (e.g., `http://localhost:4000/api/**` or `http://localhost:4000/**`).
  - **NEVER** use broad catch-all patterns like `**/*` or relative paths like `**/admin/**` that intercept Next.js chunks, webpack HMR, or frontend page routes on port 3000.
- **Viewport-Specific Locators**:
  - When asserting against mobile viewports (`{ width: 390, height: 844 }`), locate mobile card elements using `[data-testid="*-card"]`.
  - Do NOT target desktop `tr` or desktop action buttons in mobile tests, as Playwright will throw `locator.click() failed: element is hidden`.
- **Deterministic Route Fulfillments**:
  - Always mock both success and failure states (e.g. 400 Bad Request) to verify client-side `role="alert"` displays properly.
  - Set test workers to sequential execution where appropriate to prevent state bleed during mock mutations.

## 14. Supplier Portal & Call Center UI Conventions (`/supplier`)

- **Elimination of Browser Native Alerts**:
  - Never call `window.alert()`, `confirm()`, or `prompt()`. All notifications must use inline banners (`role="status"` for confirmations, `role="alert"` for errors) and custom WCAG 2.1 AA dialogs.
- **Directional Phone Protection**:
  - Customer numbers (`05xx`, `06xx`, `07xx`) and tracking codes must be wrapped in `<span dir="ltr" className="font-mono">` with 1-click clipboard triggers (`2s` checkmark visual feedback) to prevent inversion in Arabic RTL.
- **Workflow Tab Navigation**:
  - Tab 1: Queue (`data-testid="tab-queue"`, `data-testid="supplier-lead-row"`, `data-testid="supplier-lead-card"`)
  - Tab 2: Confirmed Orders (`data-testid="tab-confirmed"`, `data-testid="supplier-confirmed-row"`, `data-testid="supplier-confirmed-card"`)
  - Tab 3: All Orders (`data-testid="tab-all"`, `data-testid="supplier-order-row"`, `data-testid="supplier-order-card"`)
- **Accessible Modals**:
  - `SupplierCancelModal`: Official reason radios (`UNREACHABLE`, `DUPLICATE`, `CUSTOMER_REFUSED`, `OUT_OF_ZONE`, `OTHER`), custom textarea, and trilingual labels.
  - `SupplierTopUpModal`: 1-click copy triggers for BaridiMob RIP (`00799999002194829345`) and CCP (`0021948293 Clé 45`) with WhatsApp verification instructions.
- **Zero Horizontal Overflow Containment**:
  - Ensure `w-full max-w-full min-w-0` and `overflow-x-hidden` on parent flex containers so scrollWidth matches clientWidth across 390px, 768px, and 1440px in Arabic RTL.

## 15. Supplier Product Catalog & Live Solvency Pre-check UI (`/supplier/products`)

- **Instant Automated Activation Architecture**:
  - Eliminates manual admin review by embedding 4 strict solvency invariants directly inside `SupplierProductModal`.
  - Invariants evaluated live:
    1. Retail price strictly greater than CPA (`retailPrice > supplierTotalCpa`)
    2. CPA capped at 50% retail price (`supplierTotalCpa <= retailPrice * 0.5`)
    3. Minimum initial stock of 20 units (`stock >= 20`)
    4. Escrow balance covers 5x CPA buffer (`walletBalance >= supplierTotalCpa * 5`)
  - **No CPA 500 DZD Floor**: Any positive CPA budget is allowed as long as the 4 invariants pass.
- **Dynamic 80/20 & Escrow Buffer Visualizer**:
  - Dynamically calculates the 80% Affiliate Net Payout, 20% Platform Fee, and 5x Escrow Buffer requirement in real-time.
  - Visual checklist displays live green checkmarks or warning indicators with status capsule (`Conforme 4/4` / `جاهز للتفعيل`).
- **Direct Escrow Top-Up Bridge**:
  - When CPA creates an escrow buffer requirement greater than the supplier's balance, an alert banner provides an inline button triggering `SupplierTopUpModal` directly.
- **Dual-Rendering Parity & 1-Click Clipboard**:
  - Mobile viewports (< 640px) render responsive cards (`data-testid="supplier-product-card"`).
  - Desktop viewports (>= 640px) render high-density table rows (`data-testid="supplier-product-row"`).
  - 1-click clipboard triggers (`data-testid="copy-product-id-btn"`) for uppercase product IDs (`#PROD-XXX`) with 2s checkmark feedback.
  - Search input (`data-testid="product-search-input"`) and status filter pills (`data-testid="filter-*-btn"`).

## 16. Supplier Escrow Wallet & Transaction Ledger UI (`/supplier/wallet`)

- **Escrow Treasury Dashboard Architecture**:
  - Highlights the prepaid nature of ViteDrop's escrow network via 3 primary KPI cards:
    1. **Solde Escrow Actuel**: Large Space Mono balance display with low-balance warning capsule when `balance < 3000 DZD`.
    2. **Total Dépôts Prépayés**: Cumulative sum of verified credits (`DEPOSIT`).
    3. **Débits Livraisons Confirmées**: Cumulative gross CPA deductions with zero-penalty guarantee on returns (`0 DZD de frais en cas de retour`).
- **Dual-Rendering Ledger Parity**:
  - Mobile viewports (< 640px) render responsive cards (`data-testid="supplier-wallet-tx-card"`) with uppercase `#TX-ID`, type badges, date/time, and signed amount.
  - Desktop viewports (>= 640px) render high-density table rows (`data-testid="supplier-wallet-tx-row"`).
  - 1-click clipboard triggers (`data-testid="copy-tx-ref-btn"`) with 2s checkmark confirmation.
  - Type filter pills (`data-testid="filter-all-btn"`, `data-testid="filter-deposits-btn"`, `data-testid="filter-debits-btn"`) and live search input (`data-testid="tx-search-input"`).
- **Integrated Reusable Top-Up Modal**:
  - Direct integration with `SupplierTopUpModal` (`data-testid="supplier-topup-modal"`) providing official BaridiMob RIP (`00799999002194829345`) and CCP (`0021948293 Clé 45`) copy triggers.
