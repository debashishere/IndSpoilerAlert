# Tracer Bullet Roadmap: Liquidation Automation Studio Vertical Slices

This document specifies the vertical slice decomposition of [`LiquidationAutomationStudio.tsx`](../frontend/src/components/LiquidationAutomationStudio.tsx) (~3,830 lines) into four discrete tracer bullets, applying the `/ux-v1` design engineering standard and `/grill-with-docs` architectural discipline.

---

## Architectural Seams & Directory Structure

```
frontend/src/
├── hooks/
│   └── useWorkflowStudio.ts                   # Headless state machine & calculations
├── components/
│   ├── LiquidationAutomationStudio.tsx         # Backward-compatible facade entry point
│   └── domain/
│       └── workflows/
│           ├── PreFlightAuditModal.tsx         # (Existing) Pre-flight confirmation modal
│           ├── StageEmailModal.tsx             # (Existing) TipTap stage email modal
│           ├── InventoryScopeDiffModal.tsx     # (Existing) Scope diff comparator modal
│           └── studio/                         # [NEW] Vertical Slice Domain Components
│               ├── WorkflowStudioOrchestrator.tsx  # Master orchestrator shell (<250 lines)
│               ├── WorkflowHeaderBar.tsx           # Slice 1: Shell, Header & Scheduling
│               ├── WorkflowScopeSection.tsx        # Slice 2: Strategy & Inventory Filtering
│               ├── WorkflowStageTimelineSection.tsx# Slice 3: Polymorphic Stage-Gate Timeline
│               │   ├── WorkflowStageCard.tsx       # Polymorphic stage card renderer
│               │   └── WorkflowAudiencePicker.tsx   # Granular buyer list & partner picker
│               └── WorkflowDispatchSection.tsx     # Slice 4: Review, Pre-Flight & Footer
```

---

## Ticket #1: Slice 1 — Headless State Hook (`useWorkflowStudio`) & Studio Header/Schedule Bar

- **Goal**: Establish the headless calculation engine and replace the monolithic studio header with an ergonomic, anti-congesting top rail while retaining backward compatibility.
- **Path**: `Workflow -> Campaign Builder -> New Workflow`
- **Estimated Scope**: Tracer Bullet 1 (Foundational Contract & Top-Rail UX)

### User Story
As a surplus inventory manager, I want to configure my campaign name, choose execution timing (immediate or recurring cron), and view my mailbox authentication security status without the header consuming more than 20% of my vertical screen.

### Deliverables
1. **`useWorkflowStudio.ts`**:
   - Extract campaign metadata (`campaignName`, `campaignType`, `runMode`, `cronSchedule`).
   - Extract filter parameters (`category`, `maxRsl`, `minCases`, `selectedLotIds`).
   - Extract stage array state and mutation actions (`addStage`, `removeStage`, `updateStage`, `reorderStages`).
   - Extract pre-flight validation logic (`getStageValidationErrors`, `isFormValid`).
2. **`WorkflowHeaderBar.tsx`**:
   - Modernize the header using `/ux-v1` tokens: soft hairline border (`border-slate-200/80 dark:border-slate-800`), 40px height (`h-10`) campaign name input with diffuse focus ring (`focus:ring-2 focus:ring-primary/20`).
   - Recurrence cron scheduling popover with clean button groups (`Mins`, `Hours`, `Days`, `Specific Time`) without layout breaking.
   - Mailbox security banner reflecting Google OAuth connection telemetry with soft alert styling.
3. **`LiquidationAutomationStudio.tsx`**:
   - Export all legacy functions (`getStageBuyerCount`, `getStageValidationErrors`, `DYNAMIC_TOKENS_LIST`, `compileFrontendCron`, `formatWaitTime`).
   - Mount `WorkflowHeaderBar` seamlessly at the top of the studio.

### UX-v1 Compliance Criteria
- [x] **Viewport Sovereignty**: Header bar height is strictly ≤ 72px (less than 10% viewport height).
- [x] **No Prison Grid**: Remove stark 1px solid borders around meta tags and scheduling buttons.
- [x] **Form Ergonomics**: Campaign Name input has generous height (40px) and soft inset background (`bg-slate-50/60 dark:bg-slate-900/60`).

### Verification & Testing Gate
- `npm test frontend/src/test/SchedulePopoverInteraction.test.tsx` (100% green).
- `npm test frontend/src/test/MailboxSoftLock.test.tsx` (100% green).
- New unit test `frontend/src/test/useWorkflowStudio.test.ts` asserting headless state mutations.

---

## Ticket #2: Slice 2 — Strategy & Matching Inventory Scope Engine

- **Goal**: Extract the template presets and faceted inventory lot selection engine into a progressive accordion card with live scope inspection.
- **Estimated Scope**: Tracer Bullet 2 (Faceted Search & Dynamic Lot Data Capture)

### User Story
As a supplier, I want to filter and select distressed inventory lots matching specific shelf-life thresholds and categories, previewing valuation impact in real-time before establishing stage-gate escalation.

### Deliverables
1. **`WorkflowScopeSection.tsx`**:
   - Section 1: Template selection cards (Quick Clearance, Private Exclusivity, Dynamic Diversion, Custom).
   - Section 2: Faceted filter controls (Category dropdown, Max RSL % slider, Min Cases number input).
   - Inventory Lot Ledger: Table of matched lots with select-all checkbox, individual lot toggles, FEFO badges, and RSL % progress indicators.
   - Live Inventory Scope Diff Modal integration (`InventoryScopeDiffModal.tsx`).
2. **Progressive Accordion Behavior**:
   - Collapsible section card: when collapsed, renders high-density summary chip strip:
     `Strategy: Quick Clearance • 14 Lots Selected ($42,500 total value) • Max RSL: 60%`.

### UX-v1 Compliance Criteria
- [x] **60-30-10 Color Architecture**: Grayscale/tinted slate table surfaces with selective primary accent only for active selection states.
- [x] **Tabular Numerals**: Quantities, cases, and dollar values formatted with `font-mono tabular-nums leading-none`.
- [x] **Zero Layout Inline Styles**: All layout dimensions and padding refactored to Tailwind utility classes.
- [x] **Ergonomic Sliders & Inputs**: Slider track styled with soft rounded rails; number inputs height 40px (`h-10`).

### Verification & Testing Gate
- `npm test frontend/src/test/CampaignEditInventoryReevaluation.test.tsx` (100% green).
- New test `frontend/src/test/WorkflowScopeSection.test.tsx` verifying filter change propagation to `useWorkflowStudio`.

---

## Ticket #3: Slice 3 — Polymorphic Stage-Gate Escalation Timeline Engine

- **Goal**: Refactor the stage-gate escalation timeline into modular polymorphic stage cards supporting Liquidation, Donation, and Landfill phases with granular buyer targeting.
- **Estimated Scope**: Tracer Bullet 3 (Polymorphic Stage Sequence & Audience Allocation)

### User Story
As an inventory orchestrator, I want to configure multi-stage escalation rules (Tier 1 private liquidation -> Tier 2 liquidator markdown -> charitable food bank donation) with customizable wait windows and personalized TipTap email bodies.

### Deliverables
1. **`WorkflowStageTimelineSection.tsx`**:
   - Sequential stage timeline canvas with `+ Add Escalation Stage` action.
   - Accordion collapse support with summary chip strip: `3 Stages Configured • Stage 1: Tier 1 Liquidation (24h) • Stage 2: Public Broadcast (48h)`.
2. **`WorkflowStageCard.tsx`**:
   - Polymorphic stage header with interactive Stage Type Switcher (Liquidation, Donation, Landfill).
   - Price markdown discount slider with live floor price calculation and warning indicators.
   - Response window duration inputs with units dropdown (`Minutes`, `Hours`, `Days`).
   - Granular inventory allocation picker (`allocatedLotIds`).
   - Integrated TipTap `StageEmailModal` trigger with dynamic token indicators (`DYNAMIC_TOKENS_LIST`).
3. **`WorkflowAudiencePicker.tsx`**:
   - Audience modes: Saved Buyer Lists, Segment, or Custom Hand-Picked Buyers.
   - Non-profit charity and food rescue directory support for Donation stages.

### UX-v1 Compliance Criteria
- [x] **Elimination of "Prison Grid"**: Replace heavy nested borders inside stage cards with subtle background stepping (`bg-slate-50/50 dark:bg-slate-900/50` on card shell).
- [x] **No Label Badge Spam**: Remove step badge clutter (`[Step 1.1]`, `[Step 1.2]`, `[Max]`) in favor of clean, readable labels and subtle helper text.
- [x] **Epistolary Editor Leading**: Ensure email modal preview and token chips declare `leading-[1.7]` to prevent clipping.

### Verification & Testing Gate
- `npm test frontend/src/test/PolymorphicStageGateTimeline.test.tsx`
- `npm test frontend/src/test/StageTypeValidationAndLifecycle.test.tsx`
- `npm test frontend/src/test/StageEmailModalIntegration.test.tsx`
- `npm test frontend/src/test/WorkflowDynamicBuyerLists.test.tsx`
- `npm test frontend/src/test/InitialBuyerListConfigurationResolution.test.tsx`
- `npm test frontend/src/test/PrimarySecondaryEmptyBuyerListsWorkflowBuilder.test.tsx`
- `npm test frontend/src/test/ResponseWindowDaysOption.test.tsx`
- `npm test frontend/src/test/GranularStageInventoryAllocation.test.tsx`

---

## Ticket #4: Slice 4 — Pre-Flight Audit Ledger & Execution Dispatch Engine

- **Goal**: Deliver the terminal validation ledger, pre-flight audit modal, and ergonomic execution action bar to finalize and launch workflows.
- **Estimated Scope**: Tracer Bullet 4 (Validation Ledger, Audit Modal & Launch Orchestration)

### User Story
As a compliance and operations executive, I want to review all validation guardrails (mailbox status, buyer coverage, unallocated lots) before committing a strategy or initiating a live liquidation campaign.

### Deliverables
1. **`WorkflowDispatchSection.tsx`**:
   - Section 3: Pre-Flight Review & Dispatch Safeguards.
   - Validation Error & Warning Ledger: Clear status tiles with 1-click jumps to the responsible form section.
   - Fallback Rule Controls: Marketplace Broadcast toggle and Compliance Hold safeguards.
2. **`WorkflowActionFooter.tsx`**:
   - Ergonomic dock: Height ≤ 56px, floating or anchored footer with zero content obstruction.
   - Secondary CTA: `Save Workflow Strategy` (for recurring or on-demand reuse).
   - Primary CTA: `Review & Launch Workflow` (triggers `PreFlightAuditModal.tsx`).
   - Live execution state machine: Optimistic UI transitions (<100ms) with spinner feedback during API dispatch.
3. **Final Integration of `WorkflowStudioOrchestrator.tsx`**:
   - Assemble all 4 slices into the orchestrator (<250 lines total orchestrator code).
   - Verify complete feature parity with legacy `LiquidationAutomationStudio.tsx`.

### UX-v1 Compliance Criteria
- [x] **Hick's Law**: Exactly 1 prominent primary action button (`Review & Launch Workflow`) with visually subordinated secondary button (`Save Strategy`).
- [x] **Action Confirmation Ergonomics**: Dedicated sleek footer bar with zero sticky-inside-scrollable overlay traps.
- [x] **All 7 UI States**: Ideal, Empty, Loading, Partial, Error, Success, Disabled fully handled.

### Verification & Testing Gate
- `npm test frontend/src/test/WorkflowLightThemeFontColors.test.tsx`
- `npm test frontend/src/test/TipTapWysiwygTemplateEditor.test.tsx`
- Full regression test run across all 15 workflow test suites.
