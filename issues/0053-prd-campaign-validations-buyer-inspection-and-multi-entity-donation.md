# PRD 0053: Campaign Validations, Buyer Segment Roster Inspection & Multi-Entity Donation Diversion Engine

## Problem Statement

Sales managers liquidating surplus inventory faced several usability and workflow limitations:
1. **Invalid/Empty Campaign Saves**: Campaigns could inadvertently be saved without selecting any available inventory or total cases, resulting in empty automation runs.
2. **Lack of Target Buyer Transparency**: Sales reps had no quick way to inspect individual registered buyers (company name, email, registration date) matching a specific target segment tag (e.g., Tier 1 Primary Retailers).
3. **Saved Campaigns Table Clipping & Abrupt Views**: Action menus for items near the bottom of the Saved Campaigns list were clipped by table scroll containers, and editing a campaign jumped abruptly without visual transition.
4. **Incomplete Campaign Re-Hydration**: Editing a saved campaign did not reliably reload exact inventory filters and lot selections back into the Studio and Live Impact panel.
5. **Single-Entity Donation Limitation**: Fallback auto-donations were constrained to a single recipient, with no capability to cap cases or split diverted inventory across multiple food bank and rescue organizations.

## Solution

The Spoiler Alert platform has been upgraded with a comprehensive campaign validation framework, segment roster inspection modal, popover positioning fixes, smooth view transitions, complete edit re-hydration, and a dynamic multi-entity donation diversion engine.

1. **Campaign Save Validation Invariants**: Strict validation enforcing at least 1 valid inventory lot and at least 1 total case for both Draft and Active campaign saves.
2. **Buyer Segment Roster Inspection Modal**: An Eye button adjacent to segment selection opens a drawer showing buyer company name, email, and registration date with live search filtering.
3. **Saved Campaigns Popover & View Transition UX**: Popover dropdowns pop upward for bottom rows in Saved Campaigns to eliminate scroll clipping, with smooth 250ms cross-fade view transitions and top scroll reset on Edit.
4. **Full Edit State Re-Hydration**: Edit hydration re-populates exact inventory filters (`explicitLotIds`, `excludedLotIds`, `category`, `maxRsl`, `minCases`), target buyer stages, cron schedule, email blocks, and donation configs, updating the Live Impact sidebar dynamically.
5. **Dynamic Donation & Multi-Entity Diversion Configuration Engine**: A dedicated donation configuration section enabling multi-receiver tables, max case limits, diversion strategies (`percentage_split` vs `priority_cascade`), and backend fallback job execution logging.

## User Stories

1. As a Sales Manager, I want the system to block saving a campaign if 0 valid inventory lots or 0 total cases are selected, so that I don't accidentally deploy empty automation workflows.
2. As a Sales Representative, I want an Eye button beside the Target Buyer Segment selector, so that I can inspect the registered buyers belonging to that segment tag before launching an offer sheet.
3. As a Sales Representative, I want to see the company name, email address, and registration date (`createDate`) of all buyers in a segment roster, so that I can verify buyer eligibility.
4. As a Sales Representative, I want an inline search input inside the Buyer Segment Roster modal, so that I can quickly locate specific buyer accounts.
5. As a Sales Manager, I want the 3-dots action menu in Saved Campaigns to pop upward for items near the bottom of the list, so that menu options are never clipped by the scroll container.
6. As a Sales Manager, I want smooth cross-fade view transitions when switching between Saved Campaigns and the Campaign Builder, so that navigating sub-tabs feels natural and seamless.
7. As a Sales Manager, I want the view to scroll smoothly to the top when I click "Edit" on a saved campaign, so that I am immediately focused on the top of the Campaign Builder.
8. As a Sales Representative, I want editing a saved campaign to reload all my exact inventory lot check-boxes and filters (`explicitLotIds`, `excludedLotIds`), so that I don't have to re-select my distressed stock manually.
9. As a Sales Representative, I want the Live Impact panel to immediately re-calculate matched lots, total cases, and COGS recovery value upon editing a saved campaign, so that I have accurate allocation visibility.
10. As a Sustainability Lead, I want a dedicated Dynamic Donation Configuration section in the Automation Studio, so that I can establish automatic food rescue backstops for unsold inventory.
11. As a Sustainability Lead, I want to configure a global maximum case cap for campaign donations, so that off-channel inventory transfers remain within company budget and tax guidelines.
12. As a Sustainability Lead, I want to add multiple recipient non-profit and food bank entities to a single campaign strategy, so that distressed food is distributed to local community partners.
13. As a Sustainability Lead, I want to specify contact emails, individual max case limits, and percentage allocation splits for each donating entity, so that receiving food banks receive appropriate volumes.
14. As a Sustainability Lead, I want to choose between a Pro-Rata Percentage Split and a Priority Cascade diversion strategy, so that inventory overflow is routed according to partner priority.
15. As a System Administrator, I want the backend fallback job runner (`execute-workflow-fallback`) to execute multi-entity donation allocations and log summary metadata, so that audit trails track food rescue impact.

## Implementation Decisions

- **Domain Model Extension**: Extended `LiquidationAutomation` schema and `ILiquidationAutomation` interface to include `donationConfig` with `enabled`, `maxCases`, `diversionStrategy`, and `donatingEntities` array (`id`, `name`, `email`, `maxCases`, `allocationPercent`).
- **Automation Run Resolution Tracking**: Updated `AutomationRun` model `resolution` schema to capture `donationConfigSummary` containing multi-entity case allocation breakdowns.
- **Frontend Validation Invariants**: Added pre-save check in `LiquidationAutomationStudio` `handleSaveCampaign` requiring `totalLots >= 1` and `totalCases >= 1`.
- **Target Buyer Roster Inspection Component**: Integrated `onInspectSegment` callback in `StageAudiencePicker` and built a modal overlay rendering buyer roster data (`companyName`, `email`, `createdAt`) with search filter.
- **Action Popover Positioning**: Calculated table row indices in `WorkflowsView` to pop the 3-dots action menu upward (`top: auto; bottom: 44px`) when rendering bottom table items.
- **Edit Hydration Refactor**: Updated `fetchEditingCampaign` effect to preserve exact saved numeric filters (`maxRsl`, `minCases`) and hydrate `donationConfig` state.
- **Backend Job Execution Service**: Updated `agendaService.ts` `execute-workflow-fallback` to process multi-entity donation configurations during auto-donation fallbacks.

## Testing Decisions

- **Testing Principles**: Tests strictly evaluate end-to-end API contracts, schema invariants, UI rendering, modal interactions, and background job resolutions without depending on internal implementation details.
- **Backend Seam Coverage**: `backend/src/tests/automations.test.ts` covers `POST` / `PUT` automation endpoints, inventory validation, Agenda fallback job execution, and multi-entity donation logging.
- **Frontend Seam Coverage**: `frontend/src/test/WorkflowsView.test.tsx` and `frontend/src/test/StudioPersistenceDualLaunch.test.tsx` test sub-tab navigation, popover menus, segment roster inspection modals, and edit re-hydration.
- **Prior Art**: Extends existing Jest tests in `backend/src/tests/` and Vitest tests in `frontend/src/test/`.

## Out of Scope

- Real-time third-party food bank API integration (e.g. Feeding America API live inventory sync).
- Automated transportation dispatch for donation pickup loads.

## Further Notes

- All changes have been verified against 11 backend test suites (71 tests total) and 17 frontend test suites (50 tests total).
