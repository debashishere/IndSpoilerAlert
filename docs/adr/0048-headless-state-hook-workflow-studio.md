# 48. Headless State Hook for Workflow Studio Architecture

## Context
`LiquidationAutomationStudio` manages deep, interdependent dynamic state: real-time lot filtering calculations, polymorphic stage-gate mutation arrays, cron string compilation, and pre-flight validation rules. Storing keystroke-level transient form inputs in the global Redux store causes unnecessary re-renders across sibling tabs, while prop-drilling through a 3,800-line file creates massive coupling.

## Decision
We extract all business logic, reactive filtering, stage mutation actions, and validation computations into a dedicated headless hook: `useWorkflowStudio`. Global Redux (`workflowSlice`, `coreSlice`) remains reserved strictly for server-synchronized entities (saved workflows, runs, inventory lots, buyer lists), while the studio shell and its slice components consume state and dispatch operations through `useWorkflowStudio`.

## Rationale
Isolating state inside a headless hook provides deep module boundaries, enables zero-UI headless testing, prevents global Redux store pollution with uncommitted draft inputs, and strictly aligns with the `/react-ts-v1` and `/codebase-design` standards.
