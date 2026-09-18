# 02: Accept Offer Work Surface with DC Logistics & Multi-Channel Communication Card

**What to build:** 
The complete Accept Offer work surface faithfully matching the Stitch design. From the supplier's perspective:
1. **Logistics & Allocation Parameters**: Pre-populates the distribution center pickup address (tagged with FOB Origin), dock operating hours (appointment required indicator), case allocation stepper capped at available inventory, and locked agreed price display.
2. **Communication Section**: Introduces a multi-channel pill selector (`Email`, `In-App`, `SMS`) with `Email` active, dynamic token count pill, word count badge, accordion expand/collapse, and embedded TipTap editor populated with the acceptance template.
3. **Settlement Summary Footer**: Computes live total deal value with clearing tier and single-click "Confirm Offer" action dispatching settlement terms to the buyer.

**Blocked by:** 01: Stitch Header, 4-Column Commercial Stat Cards & Test Baseline

**Status:** completed

- [x] Logistics parameters card renders DC pickup address, dock hours, awarded quantity stepper, and settled price lock.
- [x] Multi-channel selector switches between Email, In-App, and SMS modes with Email as default.
- [x] Communication accordion displays active word count and dynamic token count pills.
- [x] TipTap body editor hydrates dynamic merge tokens (`{{buyer_name}}`, `{{product_name}}`, `{{awarded_quantity}}`, `{{price_per_case}}`, `{{total_amount}}`, etc.).
- [x] Bottom settlement summary displays live total deal value and triggers `onAccept` dispatch callback.
- [x] Integration tests verify full and partial allocation workflows.
