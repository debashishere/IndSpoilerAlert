# Unified Campaign and Stage-Gate Workflow Builder Architecture

We decided to implement a unified creation wizard and interactive linear timeline builder for **Liquidation Campaigns** and **Stage-Gate Workflows**. This design merges high-level campaign metadata with automated execution rules.

### Context
Previously, campaigns (`LiquidationCycle`) and automations (`LiquidationAutomation`) were decoupled:
1. Campaigns were created in a simple 480px modal and only captured name and start/end dates.
2. Automations were configured separately in a form on the right-hand column, with no straightforward visual alignment between a campaign's lifecycle and its automation timeline.
3. Building a custom stage-gate workflow was not possible because the automation model only supported fixed single-run configurations without customizable intermediate steps (such as progressive markdowns or multiple delay gates).

### Decisions & Rationale

#### 1. Unified Campaign & Workflow Creation Wizard
We unify campaign details and workflow configuration into a single multi-step wizard. Creating a campaign now automatically provisions its execution strategy, ensuring that campaigns are always backed by clear business rules (e.g., auto-negotiating auctions, flash sales, or donation backstops) from day one.

#### 2. Right-Side Slide-Out Panel (Drawer)
*(Note: Superseded by [ADR 0015](file:///Users/debashisroy/Documents/IndSpoilerAlert/docs/adr/0015-merge-campaign-setup-into-automation-studio-and-tour-isolation.md): Campaign Cycle setup was merged directly into Section 1 of the full-page **Liquidation Automation Studio** (`LiquidationAutomationStudio.tsx`), eliminating the redundant side drawer.)*

#### 3. Extended Database Schema: `stages` Array in `LiquidationAutomation`
To support the custom stage-gate workflow template, we extend the `LiquidationAutomation` model to store an ordered sequence of stages. Each stage is defined by:
*   `stageType`: `'auction' | 'markdown' | 'wait' | 'fallback_resolution'`
*   `parameters`: A mixed-type dictionary holding stage-specific settings (e.g., discount percentage for markdowns, or duration hours for wait gates).

This keeps the workflow execution code type-safe and extensible while avoiding complex unstructured blobs.

#### 4. Interactive Step Cards Timeline Builder
We implement a linear vertical timeline UI representing the workflow steps. For custom templates, users can dynamically add delay gates or markdown stages, drag/remove them, and adjust parameters inline. This satisfies the UX requirement for dynamic flow creation while strictly adhering to the domain rule of avoiding heavy 2D node graphs (e.g. Node Map or Zapier-style flows).

#### 5. Interactive Campaign Read/Write Panel
Selecting an existing campaign displays a detail view showing its date range, inventory filters, and stage-gate sequence status. We also provide an "Edit Campaign" flow that opens the Unified Drawer pre-filled in edit-mode, enabling users to update both the campaign parameters and the workflow rules together.
