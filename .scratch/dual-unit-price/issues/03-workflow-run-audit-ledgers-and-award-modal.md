# 03: Workflow Run Audit Ledgers & Award Modal Pricing Synchronization

**What to build:** Synchronize the dual-figure pricing logic across historical workflow execution audit surfaces (`WorkflowRunAuditModal`, `WorkflowRunTimelineStepper`) and award confirmation dialogs (`AwardModal`). When reviewing awarded bids from executed workflows or confirming awards, display the agreed settled price alongside baseline bid context, and compute total recovery from finalized terms.

**Blocked by:** 01: Core Final Price Data Pipeline & Operation Hub Bid List Dual-Figure Presentation (#1)

**Status:** ready-for-agent

- [ ] In `WorkflowRunAuditModal` ("Bids & Offers Ledger" tab), awarded bid rows display the finalized price alongside initial bid reference when negotiated, and compute total offer value using final terms.
- [ ] In `WorkflowRunTimelineStepper` ("Bids & Offers Ledger" section), awarded bids reflect the final negotiated price and accurate total valuation.
- [ ] In `AwardModal`, ensure awarding a negotiated bid reflects the agreed settlement price rather than solely the initial un-negotiated bid.
- [ ] Automated tests verify audit ledger tables and award modal calculation with negotiated terms.
