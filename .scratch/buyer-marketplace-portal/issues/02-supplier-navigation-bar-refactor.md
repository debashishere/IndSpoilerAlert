# 02 — Supplier Navigation Bar Refactor and Public Marketplace Launcher

Type: task
Status: resolved
Blocked by: 01

## Question

How should `PRIMARY_NAVIGATION_TABS` in `navigationConstants.ts` be updated to remove the internal `marketplace` tab, and where should the new `Public Marketplace ↗` launcher link be positioned in `GlobalNavigationBar.tsx` and `InstitutionalControlMenu.tsx` so suppliers can cleanly launch the public portal in an external tab without breaking existing navigation tests?

## Answer

1. **`navigationConstants.ts`**:
   - Removed the `{ id: 'marketplace', label: 'Marketplace', ... }` object from `PRIMARY_NAVIGATION_TABS`. The primary supplier operational tabs are now strictly: `ingestion`, `inventory` ('Insight'), `workflows` ('Workflow'), `inbox` ('Inbox'), and `settings` ('Settings').

2. **`GlobalNavigationBar.tsx`**:
   - Integrated the standalone "Public Marketplace ↗" launcher link (`target="_blank"`, `rel="noopener noreferrer"`, `href="/marketplace"`) within the desktop center container alongside `NavigationPillTabs`.

3. **`InstitutionalControlMenu.tsx`**:
   - Added a dedicated "Public Marketplace Portal" launcher item with storefront icon and external window badge directly in the user profile menu.

4. **`MobileNavDrawer.tsx`**:
   - Cleaned up obsolete tab badge checks and added a mobile-friendly "Public Marketplace ↗" launcher button under the primary navigation list.

5. **Test Parity**:
   - Updated `test/GlobalNavigationBar.test.tsx` and `test/MobileNavDrawer.test.tsx` to verify the presence of the new launcher links with `href="/marketplace"` and assert that the internal `marketplace` tab button is no longer rendered. All 19 navigation unit tests pass.

