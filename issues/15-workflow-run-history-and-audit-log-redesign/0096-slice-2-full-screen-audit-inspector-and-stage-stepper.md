# 0096 — Slice 2: Full-Screen "A to Z" Execution Audit Inspector & Stage-Gate Stepper

**What to build:**
Create a full-screen popup modal overlay (`WorkflowRunAuditModal.tsx`) and visual progression stepper (`WorkflowRunTimelineStepper.tsx`) that opens whenever a user clicks on any execution run row, presenting complete top-level metrics, status badges, and stage escalation traces.

**Blocked by:** 0095 — Slice 1: Workflow-Grouped Main List View with Strategy Health Metrics & Search

**Status:** completed

- [x] Implement full-screen modal overlay with backdrop blur and sticky executive summary header.
- [x] Surface sticky header indicators: Workflow Name, Run ID (#xxxxxx), Execution Mode, Status Badge, Dispatched Timestamp, Duration, Total Recovered ($), and Total Evaluated Lots/Cases.
- [x] Build `WorkflowRunTimelineStepper.tsx` rendering step-by-step stage gates (Liquidation, Donation, Landfill) with status indicators, pricing rules, wait windows, and audience targets.
- [x] Implement the **Summary & Timeline** tab featuring 4-card metric overview (Lots, Bids, Winning Bid Price, Total Recovery) and Resolution Audit details.
- [x] Connect modal launch to execution run rows in `WorkflowRunHistoryView.tsx` with smooth open/close interactions.
- [x] Unit and component tests verifying full-screen modal rendering, stage progression stepper, and data binding.
