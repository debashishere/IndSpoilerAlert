# 11: Timeline Centralization, Verification & ADR 0037 Amendment

**What to build:**
Centralize the Timeline Audit Trail within the `max-w-[1100px] mx-auto` container, verify Outbound Email Preview modal dialog behavior in the full-screen layout, amend ADR 0037 with an architectural record of the full-screen sequential workspace decisions, and verify that the entire automated test suite passes green without regressions.

**Blocked by:** 08: Sequential Stacking & Clean Single-Column View for Accept Offer Tab, 09: Sequential Stacking & Clean Single-Column View for Negotiate / Counter Tab, 10: Sequential Stacking & Clean Single-Column View for Decline Offer Tab.

**Status:** complete

- [x] Aligns the Timeline Audit Trail and Event Stream within the centralized `max-w-[1100px] mx-auto` container with consistent card styling, filters, and search bar.
- [x] Verifies Outbound Email Preview modal dialog opens and renders clean resolved token preview across all tabs in full-screen mode.
- [x] Amends `docs/adr/0037-stitch-bid-action-inspector-communication-and-data-hierarchy.md` with an Architectural Amendment detailing the full-screen workspace, maximize removal, centralized tabs, and sequential single-column stacking.
- [x] Runs the complete test suite in `src/test/BidActionInspectorModal.test.tsx` verifying all 89 tests pass green with zero regressions.
