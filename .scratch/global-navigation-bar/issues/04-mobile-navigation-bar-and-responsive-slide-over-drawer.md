# 04: Mobile Navigation Bar & Responsive Slide-Over Drawer

**What to build:**
The responsive mobile navigation header and expanded slide-over drawer overlay matching Google Stitch specifications (`docs/stitch/mobile-nav-bar.html` and `docs/stitch/expanded-mobile-navigation-drawer.html`).

From the user's perspective:
1. On viewports `< 1024px` (mobile and tablet), the desktop pill navigation collapses, and the compact Mobile Navigation Bar renders:
   - Brand logo emblem + "IndSpoiler Alert" + "OS v4.2".
   - Notification bell with unread indicator (opening the Quick Notifications Popover).
   - "DH" user avatar indicator.
   - Hamburger menu toggle button (`menu`).
2. Clicking the hamburger menu button triggers a smooth slide-over navigation drawer overlay from the right or top with backdrop blur:
   - Header with brand title, version tag, enterprise liquidation badge, and close ("X") button.
   - Verified Agent profile card with avatar, name, verification badge, agent ID `#AGT-402`, and profile expand chevron.
   - 3-Column Stats Matrix Grid: `Active Lots`, `Pending Bids`, and `Unread Alerts` dynamically hydrated from Redux state (with robust baseline defaults).
   - Primary Navigation list with icons, chevron indicators, and badges (`Active` for Ingestion Engine, `Live 94.8%` for Marketplace, `4 New` for Inbox). Clicking any item changes the active tab and closes the drawer.
   - Terminal Node card displaying `Northeast Hub Newark` and `Node: NA-SOUTH-TX-HUB` with sync icon.
   - Drawer footer with `FSMA 204 Audited`, `TLS 1.3 End-to-End`, and `Sign Out / Lock Console` CTA button.
3. Clicking the backdrop, close button, or pressing Escape dismisses the drawer smoothly.

**Blocked by:** 
- 01: Web Navigation Bar Foundation & Primary Tab Routing
- 02: Institutional Control Menu & Profile Pill Popover
- 03: Quick Notifications Popover Flyout

**Status:** ready-for-agent

- [ ] Mobile Navigation Bar renders at `< 1024px` breakpoint with brand, notification bell, DH avatar, and hamburger menu button.
- [ ] Hamburger button opens the `MobileNavDrawer.tsx` slide-over overlay with backdrop blur.
- [ ] Drawer displays user identity card with verified badge and agent ID.
- [ ] 3-column stats grid dynamically displays `Active Lots`, `Pending Bids`, and `Unread Alerts` from live Redux state.
- [ ] Primary navigation links render with active pill highlighting and contextual status badges (`Marketplace: Live 94.8%`, `Inbox: 4 New`).
- [ ] Terminal Node card displays clearinghouse node identifier and sync indicator.
- [ ] Sign Out / Lock Console button triggers authentication logout.
- [ ] Backdrop click, close button, and Escape key close the drawer.
- [ ] Unit tests in `MobileNavDrawer.test.tsx` verify drawer opening, closing, metric hydration, and navigation clicks.
