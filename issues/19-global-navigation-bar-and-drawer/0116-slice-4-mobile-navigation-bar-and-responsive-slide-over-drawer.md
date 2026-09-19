# 0116: Slice 4 - Mobile Navigation Bar & Responsive Slide-Over Drawer

## Parent
[0112-prd-global-navigation-bar-and-drawer.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/19-global-navigation-bar-and-drawer/0112-prd-global-navigation-bar-and-drawer.md)

## What to build
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
   - Primary Navigation list with icons, chevron indicators, and badges (`Active` for Ingestion, `Live 94.8%` for Marketplace, `4 New` for Inbox). Clicking any item changes the active tab and closes the drawer.
   - Terminal Node card displaying `Northeast Hub Newark` and `Node: NA-SOUTH-TX-HUB` with sync icon.
   - Drawer footer with `FSMA 204 Audited`, `TLS 1.3 End-to-End`, and `Sign Out / Lock Console` CTA button.
3. Clicking the backdrop, close button, or pressing Escape dismisses the drawer smoothly.

## Acceptance criteria
- [x] Mobile Navigation Bar renders at `< 1024px` breakpoint with brand, notification bell, DH avatar, and hamburger menu button.
- [x] Hamburger button opens the `MobileNavDrawer.tsx` slide-over overlay with backdrop blur.
- [x] Drawer displays user identity card with verified badge and agent ID.
- [x] 3-column stats grid dynamically displays `Active Lots`, `Pending Bids`, and `Unread Alerts` from live Redux state.
- [x] Primary navigation links render with active pill highlighting and contextual status badges (`Marketplace: Live 94.8%`, `Inbox: 4 New`).
- [x] Terminal Node card displays clearinghouse node identifier and sync indicator.
- [x] Sign Out / Lock Console button triggers authentication logout.
- [x] Backdrop click, close button, and Escape key close the drawer.
- [x] Unit tests in `MobileNavDrawer.test.tsx` verify drawer opening, closing, metric hydration, and navigation clicks.

## Blocked by
- [0113-slice-1-web-navigation-bar-foundation-and-primary-tab-routing.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/19-global-navigation-bar-and-drawer/0113-slice-1-web-navigation-bar-foundation-and-primary-tab-routing.md)
- [0114-slice-2-institutional-control-menu-and-profile-pill-popover.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/19-global-navigation-bar-and-drawer/0114-slice-2-institutional-control-menu-and-profile-pill-popover.md)
- [0115-slice-3-quick-notifications-popover-flyout.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/19-global-navigation-bar-and-drawer/0115-slice-3-quick-notifications-popover-flyout.md)
