# 0115: Slice 3 - Quick Notifications Popover Flyout

## Parent
[0112-prd-global-navigation-bar-and-drawer.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/19-global-navigation-bar-and-drawer/0112-prd-global-navigation-bar-and-drawer.md)

## What to build
The lightweight floating quick notification popover flyout anchored to the notification bell button in the Global Navigation Bar and Mobile Nav Bar.

From the user's perspective:
1. When unread alerts are present, the bell button displays an unread indicator dot (blue `#2563eb`).
2. Clicking the bell toggles an ambient quick notifications popover overlay.
3. The popover displays:
   - Header with title "Notifications", unread alert count, and "Mark all as read" control.
   - Chronological list of recent alerts: inbound buyer bids, workflow campaign completions, compliance document notices, and system status events.
   - Each notification item displays a contextual icon, time elapsed (e.g. "5m ago", "1h ago"), bold headline, and preview summary text.
   - A prominent full-width action button at the bottom: `"View All in Inbox"`.
4. Clicking `"View All in Inbox"` immediately dismisses the popover and routes the workspace to the `inbox` tab (`EmailsHubView`).
5. Clicking outside the flyout dismisses it cleanly.

## Acceptance criteria
- [x] `NotificationsPopover.tsx` implemented with absolute popover positioning and outside-click dismissal.
- [x] Notification bell reflects unread alert status with high-contrast indicator badge.
- [x] Displays chronological list of recent alerts with timestamps and severity/category badges.
- [x] Provides `"Mark all as read"` interaction clearing the unread dot indicator.
- [x] `"View All in Inbox"` CTA button dismisses the popover and routes `core.activeTab` to `'inbox'`.
- [x] Unit tests in `NotificationsPopover.test.tsx` verify bell toggle, item rendering, outside click, and inbox routing.

## Blocked by
- [0113-slice-1-web-navigation-bar-foundation-and-primary-tab-routing.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/19-global-navigation-bar-and-drawer/0113-slice-1-web-navigation-bar-foundation-and-primary-tab-routing.md)
