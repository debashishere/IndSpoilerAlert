# 06: Interactive Outbound Email Preview Modal Dialog

**What to build:** 
The interactive "Preview Email" dialog featured across both the top modal header and the bottom work surface action bars in the Stitch design. From the supplier's perspective:
1. Clicking "Preview Email" opens an overlay dialog displaying the exact recipient email metadata (`To:`, `Subject:`) corresponding to the active mode (Acceptance settlement, Counter-offer proposal, or Decline notice).
2. The preview renders the outbound HTML template with **all dynamic tokens fully resolved** to authentic customer-facing values (e.g. converting `{{price_per_case}}` into `$15.00/case` and `{{buyer_name}}` into `Atlanta Community Food Bank`) rather than raw tokens or bracketed chips.
3. Provides intuitive close and dismiss controls, allowing suppliers to inspect formatting with confidence before committing dispatches.

**Blocked by:** 02: Accept Offer Work Surface with DC Logistics & Multi-Channel Communication Card, 03: Negotiate Work Surface with Live Counter Parameters, In-Situ Continuity & Delta Metrics, 04: Decline Offer Work Surface with Mandatory Codes, Audit Memo & Rejection Dispatch

**Status:** complete

- [x] "Preview Email" buttons in header and footer bars trigger the Outbound Email Preview modal.
- [x] Modal displays recipient email address and dynamic subject line based on the active tab mode.
- [x] Rendered body resolves all merge tags and TipTap token badges into real buyer-facing commercial values.
- [x] Modal provides responsive close buttons (top-right X and footer Done button) returning smoothly to the inspector.
- [x] Comprehensive unit tests verify modal appearance and token hydration for Accept, Counter, and Decline templates.
