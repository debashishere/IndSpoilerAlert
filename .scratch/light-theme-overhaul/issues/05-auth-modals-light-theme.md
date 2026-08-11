# 05 — Auth Modals Light Theme (CentralAuthModal + BuyerAuthModal)

**What to build:** The supplier login modal (`CentralAuthModal`) and the buyer authentication modal (`BuyerAuthModal`) render correctly in light mode. Modal backdrops, card containers, input fields, placeholder text, focus rings, and submit buttons all use appropriate light-mode colours. No dark input backgrounds or invisible text in either modal.

**Blocked by:** 01 — Semantic Token Layer Refactor

**Status:** closed

- [x] Modal card background is white/light-surface, not dark slate
- [x] Input fields have a light background with dark placeholder and label text — readable at a glance
- [x] Focus ring colour is visible against a light input background
- [x] Tab/toggle controls (e.g. Login vs Register) render correctly in light mode
- [x] Error and validation messages have correct contrast in light mode
- [x] Dark mode renders unchanged — no regression
