# 17. Immutable Workflow Execution Timeline Snapshots

* **Status**: Accepted
* **Date**: 2026-07-23
* **Context**: CPG sales and operations teams require a complete historical audit timeline (`ExecutedAt` Timeline) for every background execution run of a liquidation campaign. To ensure compliance and auditability, sales representatives must be able to select any historical run timestamp from a dropdown in the Saved Campaigns table and inspect the exact inventory lot IDs affected, buyer email list targeted, stage discount rules applied, dynamic email template blocks used, and resolution outcome.

## Decision Drivers

* **Audit Integrity**: Campaign rules, buyer segment rosters, and product details evolve over time. Querying current live campaign parameters for a run executed 3 months ago produces inaccurate historical reports.
* **UI Responsiveness**: Sales representatives need fast table rendering with 1-click access to execution history via an `ExecutedAt` dropdown without fetching heavy payload histories for uninspected rows.
* **Historical Compliance**: CPG brands require verifiable audit trails of which retail buyers and food rescue entities received surplus inventory offers during automated fallback triggers.

## Considered Options

1. **Option A (Chosen)**: Immutable Execution Snapshots on `AutomationRun`
   - Capture `executedAt`, `buyerEmails`, `affectedInventoryLots` (lot ID, SKU, description, cases, RSL), and a complete `campaignSnapshot` (stage rules, email template, donation config) directly on the `AutomationRun` document at execution time.
   - Provide lightweight summary list endpoint `GET /api/liquidation-automations/:id/runs` for table dropdown populators and detailed endpoint `GET /api/liquidation-automations/runs/:runId` for modal inspection.
2. **Option B**: Dynamic Joins on Live Campaign Data
   - Store only entity ID references on `AutomationRun` and attempt to resolve inventory lots and buyer emails at query time.
   - *Drawback*: Fails to preserve historical accuracy when buyer emails or campaign rules change later.

## Consequences

* **Positive**: Guaranteed historical audit accuracy; fast, responsive Saved Campaigns table rendering; sales-friendly execution data inspection.
* **Negative**: Slightly higher MongoDB storage per execution run due to embedded snapshot dictionaries.
