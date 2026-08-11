# 10 — QA Pass: Cross-Module Light Theme Verification

**What to build:** A structured QA sweep across every module in both light and dark mode. Any regressions or missed dark sections are caught and fixed here. The product is A-grade — professional SaaS quality — in both themes after this ticket closes.

**Blocked by:** 02 — App Boot Light Default, 03 — Shell Sidebar, 04 — MarketplaceLayout, 05 — Auth Modals, 06 — Email Builder Shell, 07 — TipTap Editor, 08 — Main Views, 09 — Modals & Misc

**Status:** ready-for-agent

- [ ] Walk every navigable view in light mode — zero dark sections remaining
- [ ] Walk every navigable view in dark mode — zero regressions from the original dark experience
- [ ] Theme toggle is smooth with no flash or layout shift in either direction
- [ ] All interactive states (hover, focus, active, disabled) look correct in both themes
- [ ] Text contrast ratios pass WCAG AA across both themes (primary text on page bg, labels on card bg, placeholder on input bg)
- [ ] Buyer Marketplace surfaces are consistent with the supplier app in light mode
- [ ] Any remaining hardcoded dark colours found during QA are patched before this ticket is closed
