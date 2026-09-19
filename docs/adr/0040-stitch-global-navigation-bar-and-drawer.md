# ADR 0040: Stitch Global Navigation Bar & Slide-Over Drawer Architecture

- **Status**: Approved
- **Date**: 2026-09-19
- **Authors**: Antigravity AI & SpoilerAlert Engineering Team
- **Deciders**: Lead Architect, Full-Stack Engineers

---

## 1. Context & Problem Statement

The platform previously employed a collapsible vertical left sidebar navigation (`<aside className="sidebar">`) across desktop and tablet viewports. As the system expanded with data-dense clearinghouse surfaces (Ingestion Grid, Lot Operations Hub, Bid Action Inspector, and Marketplace Listings), the persistent vertical column restricted available horizontal viewport width.

Google Stitch established a redesigned global navigation specification (`projects/8026610550472801794`):
1. **Web Nav Bar** (`docs/stitch/web-nav-bar.html`): Top-anchored horizontal pill navigation bar with brand emblem, unified module tabs, notification trigger, and verified user avatar pill.
2. **Mobile Nav Bar** (`docs/stitch/mobile-nav-bar.html`): Responsive compact top header bar with branding, notifications, and hamburger drawer toggle.
3. **Mobile Navigation Drawer** (`docs/stitch/expanded-mobile-navigation-drawer.html`): Full slide-over drawer housing user profile status, live metric cards (Active Lots, Pending Bids, Unread Alerts), primary navigation items with status badges, clearinghouse node telemetry, and session sign-out.

---

## 2. Decision

We retire the vertical left sidebar navigation and transition the primary application layout to the top-anchored **Global Navigation Bar** on desktop and **Mobile Nav Bar + Slide-Over Drawer** on mobile viewports.

1. **Full-Width Workspace Canvas**: All operational views (Ingestion, Insight, Workflows, Marketplace, Inbox, Settings) occupy 100% horizontal viewport width beneath the top navigation bar.
2. **Tab Alignment & State Mapping**: Primary tabs directly map to Redux `core.activeTab`:
   - `Ingestion` -> `'ingestion'`
   - `Insight` -> `'inventory'` (or Lot Hub active session)
   - `Workflow` -> `'workflows'`
   - `Marketplace` -> `'marketplace'`
   - `Inbox` -> `'inbox'`
   - `Settings` -> `'settings'`
3. **Mobile Navigation Drawer**: On viewports `< 1024px` (`lg` breakpoint), the pill navigation collapses into the compact mobile header. Activating the hamburger trigger smoothly renders the full drawer overlay with backdrop blur, retaining complete operational parity.

---

## 3. Consequences

### Positive
- Maximizes screen real estate for wide multi-column tables and trading split-views.
- Unifies brand identity and system telemetry ("Enterprise Liquidation OS", "Node: NA-SOUTH-TX-HUB") in standard desktop and mobile headers.
- Consistent single-shell responsive paradigm matching the Stitch design system.

### Negative / Trade-offs
- Vertical space is occupied by the top header (~64px); offset by removing the left sidebar's persistent 240px width consumption.
