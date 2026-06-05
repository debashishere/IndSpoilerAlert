# PRD: Saved Campaigns Workspace & React Email 6.0 Builder Engine

## Problem Statement

Sales representatives managing surplus inventory closeouts lack a dedicated workspace to save, review, toggle, and manage campaign strategies without immediately executing them. Previously, campaign creation and execution history were conflated without explicit status lifecycle management (`Draft`, `Active`, `Stopped`, `Completed`). Furthermore, email offer sheet creation relied on basic text fields rather than a code-first, component-based email builder capable of rendering modern design tokens and dynamic inventory data tokens (`{{inventory_table}}`) across desktop and mobile devices.

## Solution

A comprehensive update to the Workflow module introducing a primary **Saved Campaigns Workspace** tab and a **React Email 6.0 Builder Engine**. The Saved Campaigns tab presents a tabular overview of all saved strategies with status badges, creation metadata, matched inventory counts, and a 3-dots action menu (`Edit`, `Activate`, `Stop`, `Delete`). The React Email 6.0 Builder Engine provides a code-first block toolkit with live Desktop/Mobile device previews, dynamic token quick-inserters, and preset email templates tailored for B2B surplus inventory liquidation.

## User Stories

1. As a sales manager, I want a dedicated "Saved Campaigns" default tab in the Workflow module, so that I can easily view all my saved liquidation strategies in one place.
2. As a sales manager, I want to see clear status badges (`Draft`, `Active`, `Stopped`, `Completed`) on each campaign, so that I can immediately identify active runs versus unlaunched drafts.
3. As a sales manager, I want to view creation metadata (`CreatedAt` date and `CreatedBy` author identity) for each campaign, so that I can track team accountability.
4. As a sales manager, I want to see a summary of matched inventory lots and case volume for each campaign, so that I know the scope of inventory affected.
5. As a sales manager, I want a 3-dots action menu on each campaign row, so that I can access campaign management options cleanly.
6. As a sales manager, I want an "Edit" option in the action menu, so that I can load any saved campaign into the Campaign Builder workspace for modifications.
7. As a sales manager, I want an "Activate" option in the action menu, so that I can transition a `Draft` or `Stopped` campaign to `Active` and initiate stage-gate execution.
8. As a sales manager, I want a "Stop" option in the action menu, so that I can immediately halt an `Active` campaign and pause its automated stage-gate timers.
9. As a sales manager, I want a "Delete" option in the action menu with a confirmation prompt, so that I can safely remove outdated campaign strategies.
10. As a sales manager, I want a top-right "+ New Campaign" button, so that I can quickly open a fresh Campaign Builder workspace with a single click.
11. As a sales manager, I want a code-first React Email 6.0 block-based email editor, so that I can build modern, responsive B2B offer sheets.
12. As a sales manager, I want visual block controls (Move Up, Move Down, Duplicate, Delete), so that I can reorder and customize email layout blocks effortlessly.
13. As a sales manager, I want quick-click token injector pills (`{{inventory_table}}`, `{{buyer_name}}`, `{{discount_percent}}`, `{{offer_expiry_hours}}`), so that I can easily insert dynamic variables into block text without typing syntax manually.
14. As a sales manager, I want a configurable `{{inventory_table}}` placeholder block, so that I can toggle which columns (SKU, Description, Cases, Expiration Date, MSRP, Discount Price) appear in buyer offer emails.
15. As a sales manager, I want a dual view switcher between Block Edit Mode and Live WYSIWYG Device Preview, so that I can review desktop and mobile layouts before dispatching offers.
16. As a sales manager, I want pre-loaded starter email templates (*Short-Dated Clearance*, *Category FEFO Fast-Track*, *FDA COA Verified Exclusive*), so that I can instantiate high-converting offer layouts instantly.
17. As a sales manager, I want dual CTA buttons ("Save as Draft" and "Launch Active Campaign") in the studio footer, so that I can save my progress as a draft or launch immediately after a pre-flight audit.

## Implementation Decisions

- **Schema Extensions**: Added `status` enum (`'draft'`, `'active'`, `'stopped'`, `'completed'`), `createdBy` string, and `emailTemplate.blocks` array to backend `LiquidationAutomation` MongoDB schema.
- **REST API Endpoints**: Exposed `GET`, `POST`, `PUT`, `PATCH /api/liquidation-automations/:id/status`, and `DELETE /api/liquidation-automations/:id` routes in Express.
- **Service & State Layer**: Updated `WorkflowService` and Redux `workflowSlice.ts` to manage 3 sub-tabs (`'saved'`, `'builder'`, `'runs'`), `editingCampaignId`, and thunks for status patching and campaign deletion.
- **Frontend Tab Layout**: `WorkflowsView.tsx` updated to render `Saved Campaigns` as default sub-tab 1, `Campaign Builder` (`LiquidationAutomationStudio.tsx`) as sub-tab 2, and `Runs & History` as sub-tab 3.
- **React Email 6.0 Builder**: Integrated directly into `LiquidationAutomationStudio.tsx` with block palette, token pills, dual live device frame (Desktop/Mobile), and starter template loader.

## Testing Decisions

- **Backend Seam**: Test Express endpoints using Jest/supertest against `/api/liquidation-automations`, verifying status transitions and deletion.
- **Redux Thunk Seam**: Test `fetchLiquidationAutomationsThunk`, `patchLiquidationAutomationStatusThunk`, and `deleteLiquidationAutomationThunk` to ensure state updates match API responses.
- **Component View Seam**: Test `WorkflowsView.tsx` and `LiquidationAutomationStudio.tsx` using React Testing Library to verify sub-tab switching, table rendering, 3-dots action menu, and email block editing.

## Out of Scope

- Automated SMS or WhatsApp offer notifications (Email B2B offer sheets remain primary).
- Custom HTML/CSS raw code editor mode (Block-based React Email 6.0 design tokens enforced for design consistency).

## Further Notes

- All changes adhere strictly to the domain glossary in `docs/CONTEXT.md` and decision record in `docs/adr/0016-saved-campaigns-and-react-email-builder-engine.md`.
