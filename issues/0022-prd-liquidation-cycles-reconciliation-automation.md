# Issue #22: Implement Liquidation Cycles, Dynamic Reconciliation, and Workflow Automations (PRD)

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Problem Statement

Suppliers struggle to manage closeout sales over time. When uploading inventory sheets and distributor sales reports, they lack a logical container to group documents by liquidation campaign (or cycle), making performance tracking and batch operations difficult. Additionally, sales reports often lack precise Lot Numbers, making matching and stock deduction error-prone. Finally, suppliers manually identify target buyers, set discounts, and create active bidding listings or coordinate donation transport, wasting valuable time that could be automated via rule-based templates.

## Solution

Implement:
1. **Liquidation Cycles**: High-level campaign containers (represented by `LiquidationCycle`) that group related inventory lots, sales reports, and listings for a supplier during a specific timeframe, keeping schemas flat and clean.
2. **Dynamic Reconciliation with FEFO Allocation**: Reconcile incoming sales records against available lot quantities by matching warehouse-to-warehouse. When sales data is missing lot numbers, apply a First Expiring, First Out (FEFO) fallback matching strategy to subtract quantity from the soonest-expiring lot.
3. **Dynamic Data Translator Enhancements**: Expand the `translatorService` to parse packaging size/weights and save custom `SemanticRule`s in the `SupplierTemplate` during the column mapping wizard, avoiding custom database joins.
4. **Liquidation Automations (Workflow Setup)**: Equip the supplier dashboard with a workflow builder where users choose from predefined templates (Smart Bidding Auction, Direct Closeout Blast, Auto-Donate Safeguard), filter their inventory data, match against buyer lists, and run the flow immediately or on a recurring schedule.

## User Stories

1. As a supplier operations manager, I want to create a new Liquidation Cycle with a start and end date, so that I can group all related surplus inventory, sales reports, and listings for a specific campaign.
2. As a supplier, I want to associate my uploaded stock sheets and distributor sales reports with a specific Liquidation Cycle, so that my metrics are consolidated by cycle.
3. As a supplier, I want the system to automatically reconcile sales reports against active inventory lots in the same distribution center, so that stock levels remain accurate at each warehouse location.
4. As a supplier, I want the system to apply FEFO (First Expiring, First Out) allocation when a sale matches a SKU but lacks a lot number, so that quantities are deducted from the soonest-to-expire batch.
5. As a supplier, I want to see reconciliation warning alerts for sales that could not be matched or required auto-allocation, so that I can audit and manually correct the lot associations.
6. As a supplier, I want the Dynamic Data Translator to extract and normalize case weights and sizes from messy text (e.g. "Pack of 12", "12/24 oz"), so that I don't have to manually normalize unit sizes.
7. As a supplier, I want to define and save custom Semantic Rules (e.g. mapping `Kosher_Stat` to the `certifications` list) during the ingestion wizard, so that future reports automatically translate.
8. As a supplier, I want to choose a Liquidation Automation Template (e.g., Smart Bidding Auction, Direct Closeout Blast, Auto-Donate Safeguard) from a setup tab, so that I can easily configure automated liquidation.
9. As a supplier, I want to filter my inventory (e.g. only dry goods expiring in 15 days) and target specific buyers when configuring an automation flow, so that the right stock goes to the right buyers.
10. As a supplier, I want to schedule automation flows to run on a recurring cron schedule (e.g., every Monday at 8 AM), so that I can automate closeout processes without manual intervention.
11. As a supplier, I want to view a history of all executions of my automation workflows, so that I can track which listings were created and which sales were successfully completed.

## Implementation Decisions

- **Models & Schema changes**:
  - `LiquidationCycle`: `{ _id, supplierId, name, startDate, endDate, status: 'active'|'closed' }`
  - `InventoryLot` and `Sale` schemas will add a `liquidationCycleId` reference.
  - `InventoryLot` will add a `liquidationDeadline` date field.
  - `SupplierTemplate` will be updated to store `semanticRules` (an array of `SemanticRule` objects).
  - `LiquidationAutomation`: `{ _id, supplierId, liquidationCycleId, templateName, inventoryFilters, targetBuyerSelection, schedule: { type, cronExpression, triggerAt }, status: 'active'|'paused'|'completed' }`
- **Reconciliation Engine**:
  - Add a service method `reconcileSaleWithInventory(sale)`:
    1. Matches by `lotNumber` and `supplierId`.
    2. If no `lotNumber` is present, it queries active lots matching the `sku` and `supplierId` (populated via `ProductMaster`) and sorts by `expirationDate` ascending (FEFO).
    3. Decrements `availableQty` of the matched lot(s). If `availableQty` reaches 0, it changes lot status to `'sold'`.
    4. If the sale cannot be fully matched or allocated, it saves the `Sale` record with a `reconciliationWarning` flag.
- **Dynamic Data Translator Integration**:
  - Update `translateAttributes` in `translatorService.ts` to retrieve and apply the `semanticRules` saved in `SupplierTemplate`.
- **Workflow Automation & Scheduling**:
  - Implement a simple cron runner (or agenda system) in Node.js that checks for active `LiquidationAutomation` schedules.
  - When triggered, it queries inventory matching `inventoryFilters`, maps buyers, calculates yield pricing using the FastAPI sidecar endpoints, and executes the corresponding template actions (e.g., publishing listings or creating donation records).

## Testing Decisions

- **Seams for Testing**:
  - **API Seam (Integration tests)**: Write Express integration tests (in `backend/src/tests/liquidation.test.ts`) that test creating liquidation cycles, associating lots, triggering workflow automations, and verifying sales reconciliation.
  - **Service Seam (Unit tests)**: Write unit tests verifying that the FEFO allocation logic correctly distributes quantity across multiple expiring lots, handles negative inventory bounds, and raises warnings for unmatched SKUs.
- **Prior Art**: Refer to `backend/src/tests/sales_bids.test.ts` for supertest patterns and mocked model creation.

## Out of Scope

- Integration with external ERP inventory syncing (SAP, NetSuite API sync); file ingestion (CSV/PDF) remains the primary input source.
- Multi-supplier collaborative campaigns; each liquidation cycle and automation flow operates strictly within a single supplier's boundaries.

## Further Notes

- Database seed script `seed.ts` should be updated to include 2 preloaded liquidation cycles, 3 automation templates, and a set of sample `Sale` records with mismatched/missing lot numbers to immediately showcase reconciliation capabilities.
