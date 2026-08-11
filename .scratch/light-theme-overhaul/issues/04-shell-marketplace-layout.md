# 04 — Shell: MarketplaceLayout Light Theme

**What to build:** The Buyer Marketplace shell — sticky header, navigation links, user account dropdown, and footer — renders correctly in light mode. All hardcoded dark Tailwind classes (`bg-slate-950`, `bg-slate-900`, `text-slate-100`, `border-slate-800`, etc.) are replaced with semantic tokens. The emerald/teal brand accent colours are preserved and look great in both themes.

**Blocked by:** 01 — Semantic Token Layer Refactor

**Status:** completed

- [x] Marketplace sticky header renders with a light surface, correct text contrast, and visible border in light mode
- [x] User dropdown menu renders with a light card background and readable items in light mode
- [x] Footer renders with a light surface and muted text — no dark bleed
- [x] Emerald/teal brand accent colours (logo gradient, badge) remain vibrant in both themes
- [x] No dark mode regression — marketplace still looks correct when dark is active
