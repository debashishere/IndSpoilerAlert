# PRD 19: Global Navigation Bar & Responsive Mobile Drawer

## Executive Summary
This PRD defines the transition from the legacy vertical left sidebar navigation to the top-anchored **Global Navigation Bar** (desktop) and **Mobile Navigation Bar with Expanded Slide-Over Drawer** (mobile/tablet), implementing Google Stitch specifications from project `8026610550472801794`:
- `docs/stitch/web-nav-bar.html`
- `docs/stitch/mobile-nav-bar.html`
- `docs/stitch/expanded-mobile-navigation-drawer.html`

## Architectural Scope
- **Desktop**: Top-anchored pill navigation bar with brand emblem, unified module tabs, notification trigger, and verified user avatar pill.
- **Institutional Control Menu**: Centralized popover consolidating user identity, supplier selector, dark/light theme switch, and node telemetry.
- **Quick Notifications Popover**: Flyout for inspecting alerts with direct jump to Emails Hub.
- **Mobile Navigation Drawer**: Slide-over overlay with stats matrix grid (`Active Lots`, `Pending Bids`, `Unread Alerts`), primary navigation with badges, and node telemetry.
- **Full-Width Canvas**: Removal of the vertical left sidebar, expanding all operational workspaces to 100% viewport width.

## Referenced Decisions
- [ADR 0040: Stitch Global Navigation Bar & Slide-Over Drawer Architecture](file:///Users/debashisroy/Documents/SpoilerAlert/docs/adr/0040-stitch-global-navigation-bar-and-drawer.md)
- Domain Glossary in [CONTEXT.md](file:///Users/debashisroy/Documents/SpoilerAlert/CONTEXT.md)

## Slices
1. `0113-slice-1-web-navigation-bar-foundation-and-primary-tab-routing.md`
2. `0114-slice-2-institutional-control-menu-and-profile-pill-popover.md`
3. `0115-slice-3-quick-notifications-popover-flyout.md`
4. `0116-slice-4-mobile-navigation-bar-and-responsive-slide-over-drawer.md`
5. `0117-slice-5-legacy-sidebar-retirement-and-full-width-shell-verification.md`
