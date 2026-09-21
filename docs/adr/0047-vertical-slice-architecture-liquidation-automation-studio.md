# 47. Vertical Slice Architecture for Liquidation Automation Studio

## Context
`LiquidationAutomationStudio.tsx` is an integrated, monolithic module exceeding 3,800 lines of code responsible for campaign authoring, dynamic inventory scope filtering, polymorphic stage-gate escalation, and workflow execution dispatch. Refactoring in a single monolithic pass risks breaking complex dynamic state bindings and test suites, while pure visual reskinning leaves excessive technical debt.

## Decision
We decompose `LiquidationAutomationStudio` into 4 discrete, vertically sliced tracer bullets combining headless hook state management with `/ux-v1` institutional ergonomics:
1. **Slice 1 (Shell, Header & Scheduling Engine)**: Workspace framing (<25% static chrome), campaign naming, strategy presets, recurrence cron popover, and OAuth mailbox lock telemetry.
2. **Slice 2 (Matching Inventory & Scope Engine)**: Faceted inventory filters (Category, Max RSL, Min Cases), dynamic lot table with selection checkboxes, and inventory scope diff inspection.
3. **Slice 3 (Polymorphic Stage-Gate Escalation Timeline)**: Dynamic stage cards (Liquidation, Donation, Landfill), audience picker, pricing/discount sliders, response windows, and TipTap stage email modal integration.
4. **Slice 4 (Pre-Flight Audit & Dispatch Engine)**: Comprehensive multi-stage validation engine, pre-flight audit modal, terminal action bar, and execution dispatch orchestration.

## Rationale
Vertical slicing delivers fully testable, visually complete end-to-end increments without destabilizing the existing production workflow contracts or degrading dynamic data capture capabilities.
