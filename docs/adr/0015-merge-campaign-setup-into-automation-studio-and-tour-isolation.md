# 0015: Merging Campaign Setup into Liquidation Automation Studio and Interactive Tour Tab Isolation

**Status**: Accepted  
**Date**: 2026-07-23  

## Context
1. **Redundant Campaign Creation Drawer**: Previously, initiating a new campaign cycle opened a multi-step slide-out drawer (`CampaignDrawer.tsx`). This drawer duplicated strategy templates, stage-gate configuration, and inventory filtering that were already natively available in the full-page **Liquidation Automation Studio** (`LiquidationAutomationStudio.tsx`). This caused UX redundancy and forced users through two separate configuration flows for the same underlying liquidation strategy.
2. **UI Element Overlap with Interactive Tour**: The `InteractiveTour` widget rendered globally across all tabs as a fixed floating element (`bottom: 20px, right: 20px, zIndex: 9999`). When side drawers or studio footers were active on non-ingestion tabs (such as Workflows), the tour widget hovered directly over key action buttons (e.g. Next Step / Save buttons).

## Decisions & Rationale

### 1. Merge Campaign Cycle Setup into Liquidation Automation Studio Section 1
- **Unified Section 1**: Enhanced Section 1 of the Campaign Builder studio ("1. Stage-Gate Workflow Template & Campaign Setup") to accept **Campaign Cycle Name**, **Cycle Start Date**, and **Cycle End Date** alongside the **Sales Strategy Template** selector.
- **Single Workspace**: Consolidated campaign metadata and automated stage-gate execution into a single, cohesive full-page studio, completely eliminating the redundant `CampaignDrawer.tsx` side drawer.
- **Smooth Navigation**: The "New Campaign Cycle" header button in `WorkflowsView.tsx` now switches the active sub-tab to `builder` and smoothly scrolls to Section 1 of the studio workspace.

### 2. Restrict Interactive Tour Rendering to Ingestion Tab
- **Tab-Scoped Tour Rendering**: Added strict tab checking (`if (activeTab !== 'ingestion') return null;` in `InteractiveTour.tsx` and conditional rendering `{activeTab === 'ingestion' && <InteractiveTour />}` in `App.tsx`) so the interactive demo guide mounts only when the user is actively on the Ingestion tab.
- **Zero Overlay Conflicts**: Eliminates z-index layering conflicts, ensuring all drawer footers, form actions, and studio buttons on Inventory, Workflows, Marketplace, Logistics, and Analytics tabs remain 100% accessible.

### 3. Consolidated Sales Strategy Catalog & Category Liquidation
- **Consolidated Catalog**: Merged all strategies previously in the side drawer into `TEMPLATE_DEFINITIONS` in `LiquidationAutomationStudio.tsx`, giving suppliers 9 pre-configured and customizable automation templates in a single dropdown.
- **Category Liquidation & Fast-Track**: Updated and generalized *Dairy & Perishables Fast-Track* into **Category Liquidation & Cold-Chain Fast-Track**, enabling category filtering across Dairy, Produce, Frozen Foods, Beverages, and Dry Goods with automated FEFO allocation and AI elasticity pricing curves.

### 4. Direct Campaign & Strategy Persistence ("Save Campaign & Strategy")
- **Independent Campaign Persistence**: Introduced a dedicated **"Save Campaign & Strategy"** action button in both the top bar and live impact sidebar of `LiquidationAutomationStudio.tsx`.
- **Scheduled Multi-Campaign Creation**: Allows suppliers to define and persist campaign cycles with specific Start & End Date windows to the database (`LiquidationCycle` and `LiquidationAutomation`), enabling multiple campaigns (e.g., immediate 3-day clearance vs. future-dated category liquidations) to be staged and scheduled independently without triggering an immediate pre-flight audit run.

## Consequences
- **Positive**: Streamlined user experience with zero duplicate forms or side drawer redundancies; comprehensive catalog of 9 sales strategies available in a single dropdown.
- **Positive**: Suppliers can stage, schedule, and save multiple campaigns with customized date ranges for future execution.
- **Positive**: Simplified code footprint and reduced bundle size by removing `CampaignDrawer.tsx` and unneeded state variables in `App.tsx`.
- **Neutral**: Integration tests updated to reflect in-place studio configuration instead of drawer step assertions.
