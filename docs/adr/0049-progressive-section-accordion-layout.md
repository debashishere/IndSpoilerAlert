# 49. Progressive Section Accordion Layout for Workflow Builder

## Context
`LiquidationAutomationStudio` contains dense configuration workflows spanning template presets, dynamic inventory filtering tables, multi-stage escalation timelines with pricing sliders, and execution rules. Displaying all sections simultaneously in a continuous expanded format creates an overwhelming 3,800+ line visual canvas with severe visual friction and viewport congestion. Conversely, rigid wizard pagination hinders rapid cross-stage adjustments.

## Decision
We adopt a **Progressive Section Accordion with Visual Summary** layout for the Workflow Builder:
- The screen is structured into collapsible numbered section cards:
  1. Strategy & Inventory Scope (Templates, Faceted Filters & Matched Lots)
  2. Stage-Gate Escalation Timeline (Polymorphic Stage Sequence & Audience Allocation)
  3. Pre-Flight Review & Dispatch Safeguards (Validation Ledger & Execution Actions)
- When a section is collapsed, it renders a high-density, single-line **Visual Summary Chip Strip** (e.g. `Strategy: Quick Clearance • 14 Lots Matched ($42,500) • 3 Stages Configured`), allowing the user to scan the overall state without choking the active working surface.

## Rationale
This layout strictly adheres to the `/ux-v1` Viewport Sovereignty rule (keeping non-working chrome compact), prevents cognitive overload, and provides instant situational awareness through progressive disclosure.
