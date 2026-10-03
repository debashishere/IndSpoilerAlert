# Contextual Pipeline Switcher Actions for Buyer Pipeline

## Context
The master `PipelineSwitcherBar` contains tabs for `Inventory Pipeline`, `Sales Pipeline`, and `Buyer Pipeline`, alongside action utilities (`Buyer Lists`, `+ Add Buyer`, and `Toggle All`). Previously, `Buyer Lists` and `Add Buyer` were permanently rendered across all tabs, exposing buyer management actions even when operators were inspecting Inventory or Sales records.

## Decision
We condition the rendering of the `Buyer Lists` and `+ Add Buyer` button cluster in `PipelineSwitcherBar` on `activeTab === 'buyers'`. The master `Toggle All` button remains globally present across all pipeline tabs.

## Consequences
- Prevents cross-domain action clutter in the Inventory and Sales pipeline workbenches.
- Retains `Buyer Lists` and `+ Add Buyer` within the top-level switcher action strip when operating in the Buyer Pipeline without altering sub-panel hierarchy.
- Maintains backwards compatibility with existing event dispatchers and drawer synchronization mechanisms.
