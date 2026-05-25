# 18. Scoped Unique Workflow Names and Interactive Strategy Stage Timeline

* **Status**: Accepted
* **Date**: 2026-07-25
* **Context**: CPG sales managers and logistics operators manage multiple automated liquidation strategies. Without unique workflow strategy names and explicit stage-gate timeline visualization, users face ambiguity when correlating active evaluation windows and run history logs back to parent saved workflows. To ensure complete auditability and operational clarity, workflow names must be scoped uniquely per supplier, and saved strategies must expose an interactive stage-by-stage visual breakdown of dispatch timing, bidding rules, and resolution gates.

## Decision Drivers

* **Operational Unambiguity**: When sales reps inspect active evaluation windows or historical execution logs, every strategy title must uniquely identify exactly one saved workflow strategy within their supplier account.
* **Multi-Tenant Isolation**: Different supplier accounts (e.g. Unilever vs. Kraft Heinz) must remain isolated so standard industry strategy names do not conflict across tenants.
* **Stage-Gate Transparency**: Operators require clear visibility into the 3-stage lifecycle (Dispatch & Blast ➔ Bids Evaluation Window ➔ Resolution Gate) before triggering or scheduling automated runs.

## Considered Options

1. **Option A (Chosen)**: Scoped Compound Unique Constraint & Interactive Stage Timeline
   - Enforce compound unique index `{ supplierId: 1, name: 1 }` (`sparse: true`) in MongoDB schema and controller validation.
   - Implement an interactive **Strategy Stage & Action Timeline Modal** (`inspectingCampaignStages`) in `WorkflowsView.tsx` rendering Stage 1 (Dispatch & Notification), Stage 2 (Bids Evaluation Window with floor price & match score), and Stage 3 (Auto-Award vs Auto-Donate Fallback Gate).
   - Add a **Saved Workflow Lineage Filter Bar** on the Runs & History tab to dynamically isolate execution runs for any specific saved workflow.
2. **Option B**: Global Unique Workflow Name Index
   - Require globally unique workflow names across all suppliers system-wide.
   - *Drawback*: Unnecessarily restricts distinct suppliers from using identical descriptive strategy names.

## Consequences

* **Positive**: 100% clear correlation between Saved Workflows, Active Evaluation Windows, and Run Histories; zero naming collisions per supplier; full stage-gate visibility for sales operators.
* **Negative**: Slightly stricter API validation on workflow creation and updates (returns HTTP 400 Bad Request if duplicate strategy name exists for supplier).
