# 0114: Slice 2 - Institutional Control Menu & Profile Pill Popover

## Parent
[0112-prd-global-navigation-bar-and-drawer.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/19-global-navigation-bar-and-drawer/0112-prd-global-navigation-bar-and-drawer.md)

## What to build
The centralized institutional control popover dropdown anchored to the User Profile Pill in the Global Navigation Bar.

From the user's perspective:
1. Clicking the User Profile Pill (`DH` avatar, `Debashishere007`, `Verified Agent` badge, and chevron) toggles a clean, institutional dropdown popover menu.
2. The popover displays:
   - Authenticated user details, email, role, and verification badge.
   - Active facility/supplier switcher (`selectedSupplier`) with immediate switching between connected distribution centers/suppliers.
   - Integrated Dark / Light theme toggle switch, smoothly toggling `data-theme` attribute and persisting to localStorage.
   - Real-time telemetry indicators reflecting Backend API health, Python Sidecar health, and Newark Hub Node status.
   - Sign Out / Lock Console button that terminates the session via `useAuth().logout()`.
3. Clicking outside the popover gracefully dismisses it.
4. The floating `<ThemeToggle />` in `App.tsx` is cleanly retired, as theme control is now unified within the menu.

## Acceptance criteria
- [x] `InstitutionalControlMenu.tsx` implemented with popover positioning and outside-click dismissal.
- [x] Displays authenticated user identity and verified status.
- [x] Integrates supplier/facility switcher wired to Redux `fetchCoreReferenceData` and `selectedSupplier`.
- [x] Integrates Dark / Light theme toggle switch with instant DOM and localStorage synchronization.
- [x] Surfaces live Backend and Sidecar health status telemetry.
- [x] Triggers session logout cleanly when clicking Sign Out / Lock Console.
- [ ] Retires legacy floating `<ThemeToggle />` component from `App.tsx`.
- [x] Unit tests in `InstitutionalControlMenu.test.tsx` verify toggling, selection, theme switching, and logout triggers.

## Blocked by
- [0113-slice-1-web-navigation-bar-foundation-and-primary-tab-routing.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/19-global-navigation-bar-and-drawer/0113-slice-1-web-navigation-bar-foundation-and-primary-tab-routing.md)
