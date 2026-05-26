# 0025: Deferring Distressed Analytics and Freight Logistics Sections for Base Version Release

## Context
The Spoiler Alert platform has developed vertical modules for "Distressed Analytics" (COGS recovery, waste diversion, landfill savings dashboards) and "Freight Logistics" (carrier assignment, dock appointment confirmation, cold chain temperature logging, and BOL generation).

While backend models, Redux slices (`analyticsSlice`, `logisticsSlice`), and API endpoints (`/analytics/summary`, `/shipments`) are fully operational and tested, presenting these specialized views in the initial user interface adds secondary operational surface area for suppliers who require a streamlined base version release focused on core inventory ingestion, stage-gate liquidation workflows, and B2B marketplace execution.

## Decision
1. **Disable/Hide Navigation Links in App Shell**:
   - Conditionally hide "Distressed Analytics" and "Freight Logistics" in `Sidebar.tsx` and `App.tsx` navigation menus using clean feature flags:
     - `SHOW_DISTRESSED_ANALYTICS = false`
     - `SHOW_FREIGHT_LOGISTICS = false`
2. **Feature-Flag Main Body View Rendering**:
   - Conditionally render the lazy-loaded `AnalyticsView` and `LogisticsView` components in `App.tsx` behind `SHOW_DISTRESSED_ANALYTICS` and `SHOW_FREIGHT_LOGISTICS` feature flags.
3. **Preserve Underlying Services & Backend APIs**:
   - Retain all backend models, Express routes (`/analytics`, `/shipments`), Redux state slices, and unit test suites to ensure full system compatibility, test coverage, and instant re-activation.
4. **Phased Release Path**:
   - Enable both sections in post-base product releases by toggling `SHOW_DISTRESSED_ANALYTICS` and `SHOW_FREIGHT_LOGISTICS` to `true` when sustainability and freight operations dashboards are rolled out to enterprise logistics managers.

## Consequences
- **User Experience**: The base product interface is clean and targeted, directing supplier focus to data ingestion, inventory management, liquidation workflow automation, and buyer marketplace bidding.
- **System Integrity**: Backend contracts, data collection services, and Redux state stores remain active and unimpaired.
- **Maintainability & Readiness**: Re-enabling the feature sections requires toggling the feature flags to `true` without refactoring navigation or API integrations.
