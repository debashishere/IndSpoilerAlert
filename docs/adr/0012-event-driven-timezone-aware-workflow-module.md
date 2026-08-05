# Event-Driven, Timezone-Aware Workflow Module Architecture

We decided to implement a timezone-aware, event-driven, and highly optimized stage-gate **Workflow Module** that separates template definitions from execution runs. This design expands upon and refines the initial automation concepts from [ADR-0011](file:///Users/debashisroy/Documents/IndSpoilerAlert/docs/adr/0011-liquidation-workflow-automation-engine.md).

### Context
Our initial design combined the workflow rules and execution state in a single document and suggested a simple cron polling interval. In production, this approach fails because:
1. Scheduled runs overlap. If one run is waiting for bids, a subsequent run will overwrite the shared document's status.
2. Performing manual timezone checks and calendar matching inside a Node.js polling loop is CPU-heavy and prone to Daylight Saving Time (DST) synchronization errors.
3. Checking the evaluation deadline via periodic database checks creates unnecessary read/write operations.
4. Interating nested queries for target matching scales at $O(N \times M)$ complexity, which can block the single-threaded Node event loop under heavy loads.

### Decisions & Rationale

#### 1. Decoupled Models: `LiquidationAutomation` vs. `AutomationRun`
We separate the static workflow configuration (the template definition) from its dynamic executions. Each cycle execution creates a new `AutomationRun` document. This allows clean state tracking for concurrent runs, provides historical audit logging for food safety compliance (FSMA/FDA), and captures immutable inventory snapshots of the matches.

#### 2. Native Timezone Scheduling via Agenda.js
Instead of manually matching timezone offsets in a custom loop, we offload scheduling to Agenda.js, which stores job indexes directly in MongoDB. Agenda natively supports timezone parameters during schedule creation, offloading DST calculations to the underlying engine and eliminating CPU-heavy date/time offset parsing.

#### 3. Event-Driven Resolution (Race vs. Timeout)
Rather than checking expired runs via periodic polling, we implement an event-driven race condition. When a run is dispatched:
*   We schedule a one-shot fallback timeout job in Agenda.
*   We listen to `BidCreated` events. If a qualifying bid arrives, we immediately award the bid, execute the success action, and cancel the fallback job.
*   If the fallback job triggers first, it executes the fallback action.
This reduces database polling, provides near-zero lag for buyer actions, and guarantees execution safety.

#### 4. $O(N + M)$ Batching Engine
To scale, we structure the dispatch flow to pre-compile the inventory table once, filter the buyer list, and compute matches only for top candidates. This reduces algorithmic complexity from $O(N \times M)$ to $O(N + M)$, keeping the Node event loop fast and responsive.

#### 5. Safety Floor Guards
To prevent sales representatives from accidentally liquidating inventory at extreme discounts (e.g. $0.01/case), the workflow creation form requires absolute minimum bid floors or yield recovery percentages before the template can be saved.
