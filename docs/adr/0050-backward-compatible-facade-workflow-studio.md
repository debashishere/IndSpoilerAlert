# 50. Backward-Compatible Facade for Liquidation Automation Studio

## Context
Over 15 critical test suites across the frontend (`WorkflowLightThemeFontColors.test.tsx`, `StageTypeValidationAndLifecycle.test.tsx`, `PolymorphicStageGateTimeline.test.tsx`, `MailboxSoftLock.test.tsx`, etc.) import `LiquidationAutomationStudio` and its exported helpers (`getStageBuyerCount`, `getStageValidationErrors`, `DYNAMIC_TOKENS_LIST`, `compileFrontendCron`) directly from `components/LiquidationAutomationStudio.tsx`. Refactoring this 3,800-line monolith into smaller modular files risks breaking test imports and regressions across the application.

## Decision
We retain `components/LiquidationAutomationStudio.tsx` as a backward-compatible public facade. The module continues to export all legacy types, functions, and the top-level `LiquidationAutomationStudio` component, but delegates internally to the headless hook (`useWorkflowStudio`) and modular domain slices under `components/domain/workflows/studio/`.

## Rationale
The facade pattern decouples internal refactoring and UX overhaul from existing consumer imports, ensuring that every vertical slice tracer bullet can be introduced and verified against existing test suites without breaking changes.
