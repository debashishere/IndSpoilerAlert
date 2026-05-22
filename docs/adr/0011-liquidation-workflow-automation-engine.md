# Liquidation Workflow Automation Engine

We decided to implement a template-based **Liquidation Automation Engine** with structured workflow templates (such as Smart Bidding Auction, Direct Closeout Blast, and Auto-Donate Safeguard) and background cron scheduling, rather than a generic graph-based workflow orchestrator.

### Context
Suppliers want to automate closeout actions (setting prices, ranking buyers, inviting bidders, or diverting unsold leftovers to donation/recycling). A generic workflow builder with drag-and-drop node logic would require a complex graph execution engine, state persistence at each step, and is prone to user configuration errors.

### Rationale
- **Template-Driven Simplicity**: Predefined, domain-specific templates encode best-practice workflows. This simplifies user configuration to basic parameter options (filters, buyers, and schedules) while ensuring predictable, safe execution paths.
- **Unified Scheduling**: Integrating a background scheduler (cron/once runner) directly into the Node.js Express backend keeps system infrastructure simple, avoiding the operational overhead of running external BPMN engines (like Camunda or temporal.io).
- **Direct Engine Integration**: The workflow runner integrates natively with our existing Yield Optimization and Smart Buyer Matching services, allowing automated pipelines to benefit from AI-driven matching and dynamic pricing suggestions without intermediate API overhead.
