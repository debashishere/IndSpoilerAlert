# 07: Full-Screen Workspace Shell, Centralized Tabs & Maximize Removal

**What to build:**
Convert the Bid Action Inspector from a floating pop-up modal with dark overlay into a dedicated, viewport-filling full-screen operational workspace. The maximize and minimize toggle button and state are completely removed. The workspace fills the entire screen (`fixed inset-0 w-screen h-screen z-[1050] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden`), eliminating dimmed backdrop margins. The header provides dual exit anchors (`← Back to Bids & Offers` link on the left alongside Lot #, SKU, and status pills, plus a top-right `✕ Close Workspace` button). All body content and commercial stat cards are constrained within a clean, centered `max-w-[1100px] mx-auto` container, and the Mode Navigation Tabs bar (`Accept Offer`, `Negotiate`, `Decline`, `Timeline`) is horizontally centered (`justify-content: center`).

**Blocked by:** None (can start immediately).

**Status:** complete

- [x] Replaces modal overlay backdrop (`rgba(0, 0, 0, 0.75)`) and floating modal dialog card with a viewport-filling full-screen operational workspace container (`fixed inset-0 w-screen h-screen z-[1050] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden`).
- [x] Permanently removes maximize/minimize state (`isMaximized`) and toggle control button (`toggle-maximize-inspector-btn`).
- [x] Implements dual exit anchors in the header: a dedicated `← Back to Bids & Offers` button on the top-left and an explicit top-right `✕ Close Workspace` button, both calling `onClose()`.
- [x] Preserves all header metadata badges (Lot # tag, SKU tag, live lifecycle status badge, product title, Outbound Email Preview trigger, and state-aware reset action).
- [x] Centralizes the 4 commercial stat cards (Buyer Organization, Unit Offer, Volume Requested, Gross Recovery) within a `max-w-[1100px] mx-auto w-full` container with comfortable padding.
- [x] Centers the Mode Navigation Tabs bar horizontally (`justify-content: center`) within the centralized container.
- [x] All existing tests in `src/test/BidActionInspectorModal.test.tsx` continue to pass.
