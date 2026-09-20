# Sales Pipeline Progressive Inspection Drawer and Clearing Reconciliation

## Context
The Sales Pipeline previously used a generic legacy table (`SalesTable.tsx`) with inline CSS styles and lacked progressive disclosure, logistics dispatch details, and ERP clearing telemetry. The Stitch enterprise design specifies a dedicated 2-row Sales Filter Bar, an institutional 12-column table grid, and an in-situ **Progressive Row Inspection Drawer** displaying multi-carrier dispatch telemetry, date audit logs, and financial remittance with contextual actions ("Reconcile Invoice", "Authorize Dock Gate Pass", "Live Fleet Telemetry").

## Decision
1. **Decoupled Headless Pipeline Hook (`useSalesPipeline`)**:
   Isolate sales filter state, search indexing, clearing records count, pagination, and accordion drawer expansion into a dedicated custom hook (`useSalesPipeline`).
2. **Synchronized Drawer Accordion & Master "Toggle All"**:
   Synchronize row drawers with the master `Toggle All` button in `PipelineSwitcherBar` using bidirectional DOM CustomEvents (`toggle-all-rows` and `toggle-all-state-changed`), matching the pattern established in the Inventory Pipeline.
3. **Institutional Progressive Disclosure**:
   Instead of pop-up modals or full-page navigation, row selection toggles an inline 4-column workbench revealing:
   - Logistics & Dispatch (Contract #, Carrier / Terms, Delivery Window / Appointment)
   - Audit & Date Logs (Date Recorded, Create UTC, Update UTC)
   - Financial Remittance (Gross Sale, Net Remitted / Escrow Funding Status)
   - Contextual Action CTAs (Reconcile Invoice, Authorize Dock Gate Pass, Live Fleet Telemetry)
4. **Tailwind Design Token Discipline**:
   Eliminate all legacy inline styles in favor of semantic Tailwind utility classes, adhering to the 4px/8pt spacing scale, muted borders (`border-slate-200/80`), and monospace tabular figures (`font-mono font-bold leading-none`).

## Rationale
This architecture ensures deep module boundaries, keeps orchestrator shells under 250 lines, supports instant responsive filtering across large ERP clearing datasets, and eliminates visual clutter through progressive disclosure.
