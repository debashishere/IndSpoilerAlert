# 01 — Dynamic Token UI Component Pill Editor & Info Popover

**What to build:** Upgrades the Centralized Email Builder (`TipTapTemplateEditor.tsx`) to render dynamic variables (Header, Inventory Table, Buyer Name, Expiry Date, Discount %) as clean, interactive UI pill badges instead of raw `{{}}` or `[]` syntax. Clicking any UI pill component or toolbar Info button opens a client popover detailing the exact dynamic fields and sample values injected at run-time.

**Blocked by:** None — can start immediately

**Status:** completed

- [x] Dynamic tokens in the palette and editor render as visual UI component badges without `{{}}` or `[]` raw text.
- [x] Clicking any dynamic UI pill component or toolbar Info button opens the `activeTokenInfoModal` displaying injected dynamic fields and sample data.
- [x] Toolbar features `[ 🏷️ Insert Dynamic Header ]` and `[ 📊 Insert Dynamic Inventory Table ]` quick insertion controls.
