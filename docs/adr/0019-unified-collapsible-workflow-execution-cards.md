# 19. Unified Collapsible Workflow Execution Cards and Mobile Compact Views

* Status: accepted
* Date: 2026-07-25

## Context and Problem Statement

Logistics operators and sales managers monitor automated surplus liquidation strategies across active evaluation windows and historical run logs. Previously, Active Workflow Evaluations were rendered as rich cards while Run History & Audit Log was rendered as a flat, desktop-centric HTML data table with limited inline visibility into winning bids, recovered dollar values, case volumes, snapshot inventory lots, and stage execution timelines. On mobile and tablet devices, the table required horizontal scrolling and lacked compact collapsible card states.

## Decision Drivers

* Visual & Operational Consistency: Active evaluation runs and historical execution logs should share an identical component architecture.
* Complete Audit Metrics: History cards must expose total bids, winning unit bid ($/case), total dollar value recovered ($), aggregate case counts, snapshot inventory lot SKUs, and exact dispatch/resolution timestamps ("when").
* Mobile & Tablet Usability: Wide multi-column tables and horizontal stage steppers break on small viewports.
* Information Density Control: Operators monitoring dozens of historical execution runs require global and per-card collapse/expand toggles.

## Considered Options

1. Keep Flat HTML Table for Run History and add horizontal scrollbars for mobile.
2. Build separate custom components for Active Runs vs. History Logs with different UI schemas.
3. **Adopt a Unified Collapsible Workflow Execution Card System** with shared metric grids, inline sub-tab Details panels, vertical timeline adaptations for mobile/tablet, and global section expand/collapse controls.

## Decision Outcome

Chosen Option: Option 3 (**Unified Collapsible Workflow Execution Card System**).

### Key Architectural Specifications:

1. **Shared Card Architecture**:
   - Both Active Workflow Evaluations and Run History & Audit Log share the same collapsible card layout structure.
   - Cards support **Collapsed Mode** (compact summary header with chevron toggle, status pill, recovery value, cases, bids count, and execution date/time) and **Expanded Mode**.

2. **History Card Execution Data**:
   - Header Pill Summary: `Status` • `Resolution Date/Time` • `Total Cases` • `Total Dollar Recovery ($)`
   - 4-Card Metric Grid: Total Cases & Snapshot Lots, Total Bids Received, Winning Bid per Case ($), and Total Revenue Recovered ($).
   - Snapshot Lot Chips: Interactive tags displaying SKU numbers and lot titles.

3. **Inline Execution Details Panel (Sub-Tabs)**:
   - **Overview & Audit Summary**: Timestamps, trigger mode, resolution action, and winning buyer details.
   - **Target Inventory Lots**: Detailed tabular breakdown of all snapshot lots evaluated during the run.
   - **Stage Execution History**: Stage waterfall progression (Stage 1 buyer blast, Stage 2 escalation, Fallback action).
   - **Raw Audit Log**: Formatted JSON audit payload for technical troubleshooting.

4. **Mobile & Tablet Responsiveness**:
   - Responsive breakpoints (`@media (max-width: 768px)`): Stack metrics grids vertically, adapt horizontal stage steppers into vertical timeline steps, and transform bids/inventory tables into touch-friendly cards.
   - Global Section Controls: `[ Expand All Cards ]` / `[ Collapse All Cards ]` toggle buttons added to section headers.
