# 02: Institutional Control Menu & Profile Pill Popover

**What to build:**
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

**Blocked by:** 01: Web Navigation Bar Foundation & Primary Tab Routing.

**Status:** ready-for-agent

- [ ] `InstitutionalControlMenu.tsx` implemented with popover positioning and outside-click dismissal.
- [ ] Displays authenticated user identity and verified status.
- [ ] Integrates supplier/facility switcher wired to Redux `fetchCoreReferenceData` and `selectedSupplier`.
- [ ] Integrates Dark / Light theme toggle switch with instant DOM and localStorage synchronization.
- [ ] Surfaces live Backend and Sidecar health status telemetry.
- [ ] Triggers session logout cleanly when clicking Sign Out / Lock Console.
- [ ] Retires legacy floating `<ThemeToggle />` component from `App.tsx`.
- [ ] Unit tests in `InstitutionalControlMenu.test.tsx` verify toggling, selection, theme switching, and logout triggers.
