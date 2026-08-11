# 0030: Light Theme Support & Top-Right Moon Icon Theme Switcher System

Date: 2026-08-10

## Status
Accepted / Implemented

## Context
The IndSpoiler Alert Surplus Inventory Platform previously operated under a hardcoded dark theme styling paradigm (`color-scheme: dark`, `#0b0f19` background). Enterprise users across logistics, account management, and buyer operations require high-contrast light mode support for improved readability under bright office lighting environments. Furthermore, theme toggling must be seamless, persist across user sessions, and be immediately accessible from any view in the platform.

## Decision

1. **Light Theme CSS Token Design System (`index.css`)**:
   - Standardize on CSS custom properties (`var(--bg-main)`, `var(--bg-card)`, `var(--border-color)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`) scoped under `[data-theme="light"]`.
   - Palette inspired by high-trust popular ColorHunt light palettes:
     - **Background Main**: Crisp light slate (`#f8fafc` / HSL `210 40% 98%`)
     - **Cards & Elevated Surfaces**: Pure white (`#ffffff` / HSL `0 0% 100%`)
     - **Borders**: Soft slate (`#cbd5e1` / `#e2e8f0`)
     - **Primary Accent**: Electric Indigo Blue (`#2563eb`)
     - **Secondary Accent**: Modern Violet (`#7c3aed`)
     - **Primary Text**: High-contrast dark slate (`#0f172a` / HSL `222 47% 11%`)
   - Provide fallback overrides for dark-utility Tailwind classes (`bg-slate-950`, `bg-slate-900`, `text-white`, `border-slate-800`).

2. **Centralized Theme Context & State Persistence (`ThemeContext.tsx`)**:
   - Provide a React Context (`ThemeProvider` and `useTheme` hook) managing `'dark'` | `'light'` mode.
   - Synchronize state with `localStorage` and mutate root `data-theme` attribute on `document.documentElement` and `document.body`.

3. **Top-Right Floating Theme Switcher (`ThemeToggle.tsx`)**:
   - Place a fixed glassmorphic theme toggle button at the top-right corner of the application viewport (`top: 16px; right: 24px; z-index: 9999`).
   - Render Lucide `Moon` icon when in Dark mode and `Sun` icon when in Light mode.
   - Include micro-animation rotations, backdrop blur, hover glow, and accessible `aria-label` / `title` tooltips.

## Consequences

- **Positive**: Enables instant, high-contrast Light mode switching for enterprise accessibility.
- **Positive**: Selection persists reliably across app reloads via `localStorage`.
- **Positive**: Universal top-right placement guarantees accessibility across landing page, dashboard, drawers, and modal workflows.
- **Negative**: Requires maintaining CSS token consistency when introducing custom styled third-party widgets.
