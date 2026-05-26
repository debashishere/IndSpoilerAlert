# 0024: Deferring Dynamic Donation & Multi-Entity Diversion UI Section in Workflow Builder

## Context
The Liquidation Automation Studio (`LiquidationAutomationStudio.tsx`) previously introduced "5. Dynamic Donation & Multi-Entity Diversion" as a dedicated configuration card within the Workflow Builder. This section allowed suppliers to configure multi-entity recipient food bank tables, global case diversion limits, priority cascade vs. pro-rata allocation strategies, and instant donation alert notifications.

While backend data models (`LiquidationAutomation.donationConfig`, `AutomationRun.donationConfigSummary`), controllers, and job execution engines fully support multi-entity donation handling, presenting this section in the primary workflow creation form adds interface complexity for suppliers focused on establishing baseline stage-gate liquidation campaigns.

## Decision
1. **Hide Section 5 in Workflow Builder UI**:
   - Conditionally hide Section 5 ("Dynamic Donation & Multi-Entity Diversion") in `LiquidationAutomationStudio.tsx` using a clean feature flag (`SHOW_DYNAMIC_DONATION_SECTION = false`).
2. **Maintain Baseline Backend Compatibility & Fallback Models**:
   - Retain default donation state hooks and schema bindings so active/draft workflow creation and backend fallback resolution continue to function reliably without requiring UI input.
3. **Phased Re-Enablement Path**:
   - Reserve the UI section for re-activation in a subsequent product phase by toggling `SHOW_DYNAMIC_DONATION_SECTION` to `true` when complex multi-entity non-profit routing capabilities are exposed to sustainability leads.

## Consequences
- **User Experience**: The base Workflow Builder UI is streamlined, focusing supplier attention on campaign setup, inventory targeting, stage-gate timelines, and email template previews.
- **System Stability**: Preserves end-to-end backend automation contracts and test coverage for fallback donation allocations without requiring UI setup.
- **Maintainability**: Clear feature flag isolation enables instant re-enabling when multi-entity donation diversion is launched in future releases.
