# 01 — Semantic Token Layer Refactor (CSS Foundation)

**What to build:** Restructure `index.css` so `:root` defines the light palette as the default — no theme attribute needed for light mode. All current dark values move into a `[data-theme="dark"]` block. The blunt `!important` override blocks are removed entirely. New semantic surface tokens are established (`--surface-page`, `--surface-card`, `--surface-elevated`, `--text-on-surface`). Light is now the default experience without any component changes — visiting the app with no stored preference renders light mode correctly.

**Blocked by:** None — can start immediately

**Status:** completed

- [x] `:root` contains only the light palette values — no dark colors
- [x] `[data-theme="dark"]` contains all dark palette values (migrated from old `:root`)
- [x] `[data-theme="light"]` block is either removed or reduced to only additive overrides (no `!important` color blunt-force)
- [x] Semantic surface tokens (`--surface-page`, `--surface-card`, `--surface-elevated`, `--text-on-surface`, `--border`) are defined in both theme blocks
- [x] Existing CSS classes that use `hsl(var(--bg-main))`, `hsl(var(--bg-card))`, `hsl(var(--text-primary))` etc. continue to work correctly in both modes
- [x] Dark mode visually unchanged from before this ticket
- [x] Light mode background, card, text, and border colors are all professional-grade in a blank shell render
