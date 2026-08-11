# 07 — TipTap Rich Editor Light Theme (TipTapTemplateEditor)

**What to build:** The full `TipTapTemplateEditor` — toolbar buttons (font, size, format, alignment, color pickers), the link insertion modal, the image insertion modal, the dynamic token panel (token list, individual token detail fields, token value inputs), and the editor canvas surface — all render correctly in light mode. This component has the highest density of hardcoded dark classes (~40 occurrences) and so receives its own ticket.

**Blocked by:** 06 — Email Builder Shell Light Theme

**Status:** completed

- [x] Every toolbar button/dropdown renders with a light surface, visible icon, and correct hover state in light mode
- [x] The link insertion modal card is white/light, with dark input text and visible focus rings
- [x] The image insertion modal card is white/light, with dark input text
- [x] The dynamic token panel renders with a light card background; individual token rows are readable
- [x] Token detail input fields (value overrides) have a light background and dark text
- [x] The TipTap editor canvas itself has a white/light writing surface in light mode
- [x] Interactive Token Badges remain visually distinct (border + background tint) in light mode
- [x] Dark mode renders unchanged — no regression in either the toolbar or token panel
