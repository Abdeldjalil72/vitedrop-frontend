---
name: vitedrop-design-system
description: The core UI properties, design tokens, layout conventions, and motion principles for the ViteDrop frontend. Use this as a reference when building new pages or components.
---

# ViteDrop Design System & UI Properties

This skill defines the visual language, tailwind conventions, and framer-motion principles used across the ViteDrop frontend. Any new pages or components MUST adhere strictly to these guidelines to ensure consistency.

## 1. Color Palette

### Backgrounds
- **Primary Page Background**: `bg-white`
- **Secondary/Offset Background**: `bg-[#fafafa]` (Used for alternating sections like Logistics/Marquee)
- **Interactive Pills/Toggles Area**: `bg-[#f4f4f4]` or `bg-[#fbfbfb]`
- **Card Backgrounds**: `bg-white` (usually paired with subtle borders)

### Text Colors
- **Primary Text (Headings/Body)**: `text-black` or `text-[#0a0a0a]`
- **Secondary/Muted Text**: `text-[#6b6b6b]` (Used for descriptions, subtitles, and inactive tabs)
- **Inverse Text**: `text-white` (Inside dark badges, primary buttons, or active gradient tabs)

### Brand Accents & Gradients
- **Primary Brand Gradient (ViteDrop Blue)**: `bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb]`
  - *Usage*: Main CTA buttons, active state pill highlights, hero background blobs.
  - *Shadow Pairing*: Always pair with `shadow-sky-500/20` to `shadow-sky-500/35`.
- **Success/Active Status**: `bg-[#17c964]` (Used as an `animate-pulse` dot for VIP Manager/Status indicators).

### Borders & Dividers
- **Subtle Dividers/Cards**: `border-black/[0.06]` to `border-black/[0.08]`
- **Interactive Borders (Hover)**: `hover:border-black/30`

---

## 2. Typography

### Font Families
- **Primary Sans**: System default (Tailwind default sans).
- **Luxury Serif**: `font-serif-luxury` (Used for the ViteDrop logo and selective italic emphasis words).
- **Monospace**: `font-mono` (Used for step numbers, small technical badges).

### Headings
- **Hero/Massive**: `text-[46px] sm:text-[68px] lg:text-[80px] font-semibold leading-[1.03] tracking-[-0.07em]`
- **Section Titles**: `text-3xl sm:text-5xl font-semibold tracking-[-0.05em]`
- **Section Kicker/Eyebrow**: `text-[13px] font-semibold uppercase tracking-widest text-black`
- **Card Titles**: `text-xl font-semibold tracking-tight`

### Body Text
- **Large Lead**: `text-[17px] sm:text-[18px] leading-[1.5]`
- **Standard Body**: `text-[15px] or text-[16px] leading-relaxed`
- **Small/Muted**: `text-[13px] or text-sm`

---

## 3. UI Components & Layouts

### Containers
- **Main Max Width**: `max-w-[1200px] mx-auto px-6`
- **Text/Header Max Width**: `max-w-[640px]` or `max-w-[880px]` (For centered section headers)
- **Section Padding**: `py-24` (Standard vertical rhythm for major sections)

### Buttons & Pills
- **Primary Button (Gradient)**: 
  ```jsx
  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white font-medium shadow-md shadow-sky-500/20 hover:shadow-sky-500/35 hover:brightness-105 transition-all"
  ```
- **Secondary Button (Outline/Ghost)**:
  ```jsx
  className="px-4 py-2 rounded-full border border-black/10 hover:border-black/30 bg-white text-black text-xs font-semibold transition-all"
  ```
- **Tab Toggles / Segmented Controls**:
  Wrapped in `p-1.5 bg-[#f4f4f4] rounded-full`. Active state uses a `motion.div` with `layoutId` for the sliding pill effect.

### Cards ("Editorial Cards")
- **Standard Card**:
  ```jsx
  className="editorial-card p-8 rounded-3xl border border-black/[0.08] flex flex-col justify-between"
  ```
  - *Inner Spacing*: Top content, followed by `mt-8 pt-4 border-t border-black/[0.06]` for the footer/badge area.
  - *Hover Effect*: `whileHover={{ y: -4 }}` via framer-motion.

---

## 4. Animation & Motion (motion/react)

ViteDrop relies heavily on buttery, Apple-style spring animations rather than linear CSS transitions.

- **Standard Easing Curve**: `ease: [0.16, 1, 0.3, 1]`
- **Spring Configuration**: `transition={{ type: "spring", stiffness: 450, damping: 35 }}` or `stiffness: 420, damping: 32` for layouts.
- **Scroll Reveal (Sections)**:
  ```jsx
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-60px" }}
  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
  ```
- **Staggered Text Entrance**:
  Parent: `transition: { staggerChildren: 0.12, delayChildren: 0.08 }`
  Children: `hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 }`

---

## 5. Internationalization (i18n) & RTL Rules

- **Global Language State**: Managed via `pageLang` (`"en" | "fr" | "ar"`).
- **Translations**: Always extracted to `src/app/locales.ts` to keep JSX clean. Do not hardcode content in the TSX files.
- **RTL Support (Arabic)**:
  - The root/container MUST use `dir={pageLang === "ar" ? "rtl" : "ltr"}`.
  - Tailwind intelligently flips logical properties (e.g., margins, paddings, flex order) natively if standard classes are used, but ensure we use logical properties (`ms-` / `me-` / `ps-` / `pe-` instead of `ml-` / `mr-`) if specific spacing is required. Currently, flexbox layouts handle the RTL flip gracefully.
