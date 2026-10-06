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
- **Interactive Pills / Toggles Area**: `bg-[#f4f4f4]` or `bg-[#fbfbfb]`
- **Card Backgrounds**: `bg-white` with subtle border `border border-black/[0.08]`
- **Table Header Background**: `bg-[#fbfbfb]`

### Text Colors
- **Primary Headings / Strong Text**: `text-black` or `text-neutral-950`
- **Secondary / Muted Text**: `text-[#6b6b6b]` (Descriptions, subtitles, inactive tabs, email subtexts)
- **Muted Technical IDs**: `text-neutral-400`
- **Inverse Text**: `text-white` (Badges, primary buttons, active gradient highlights)

### Brand Accents & Gradients
- **Primary Brand Gradient (ViteDrop Blue)**: `bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb]`
  - *Usage*: Main CTAs, active tab highlights, primary action buttons.
  - *Shadow Pairing*: Always pair with `shadow-md shadow-sky-500/20` (or `hover:shadow-sky-500/35`).
- **Success / Active Pulse**: `bg-[#17c964]` or `bg-emerald-500` (Used as `w-1.5 h-1.5 rounded-full animate-pulse`).
- **Platform Revenue / Escrow Accent**: Emerald tones (`text-emerald-700 bg-emerald-50 border-emerald-200`).

### Borders & Shadows
- **Card / Container Borders**: `border-black/[0.06]` to `border-black/[0.08]`
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
- **Contact / Phone**: `text-xs font-mono font-medium text-neutral-800 flex items-center gap-1.5`

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

### Status Badges
- **Active / Livré**: `bg-emerald-50 text-emerald-700 border-emerald-200/80` with pulsing dot `w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse`
- **Suspended / Annulé**: `bg-rose-50 text-rose-700 border-rose-200/80` with `w-1.5 h-1.5 rounded-full bg-rose-500`
- **Pending / En attente**: `bg-amber-50 text-amber-800 border-amber-200/80`

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

## 9. Admin QA checklist

- Check all dashboard routes after login with an admin session and confirm unauthorized roles are redirected or rejected.
- Test French and Arabic on at least one dense admin page; verify `dir="rtl"`, logical spacing, and readable tables/timelines.
- Check narrow (`390x844`), tablet (`768x1024`), and desktop (`1440x900`) layouts for horizontal overflow.
- At desktop width, verify sidebar width expands/collapses from `1px` to `256px` without transform overshoot; at mobile width, verify the drawer enters/exits the viewport and the backdrop fades correctly.
- After backend changes, restart or rebuild the backend before browser verification so the browser is not testing stale Nest output.
