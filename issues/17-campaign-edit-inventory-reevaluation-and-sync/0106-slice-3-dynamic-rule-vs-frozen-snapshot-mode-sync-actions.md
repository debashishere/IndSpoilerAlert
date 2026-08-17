# 0106 — Slice 3: Dynamic Rule vs. Frozen Scope Mode & Stage Allocation Sync

**What to build:**
Provide explicit user choice in `LiquidationAutomationStudio.tsx` regarding whether the saved campaign should execute as an ongoing **Dynamic Rule (Sweep Mode)** or as a **Pinned Snapshot (Explicit Lot Mode)**, and automate syncing the newly evaluated inventory with configured stage-gate lot allocations.

**Key Specifications:**
1. **Scope Mode Selector Affordance**:
   - In Section 2 (Master Inventory Pool), provide a clean mode toggle/pill:
     - **Dynamic Rule (Sweep Mode)** (`selectorMode: 'automatic'`): Evaluates live warehouse inventory dynamically on each execution run based on category and RSL thresholds.
     - **Pinned Lot Scope (Snapshot Mode)** (`selectorMode: 'explicit'`): Freezes the exact selected lot IDs so future runs only target these specific lots.
2. **Re-evaluate & Sync Stage Allocations CTA**:
   - When editing a campaign with granular stage lot allocations:
     - If previous lot allocations contain IDs that are no longer available in the warehouse, automatically purge/unassign defunct IDs from the stage's `allocatedLotIds`.
     - Provide a CTA in the drift banner or stage header: `[Sync Stage Allocations with Live Inventory]`.
     - Clicking updates stage allocations to distribute currently eligible lots across configured stages.
3. **Studio Save/Update Lifecycle**:
   - Saving the updated campaign correctly persists `selectorMode`, updated `explicitLotIds`, `inventoryFilters`, and updated `stages[].allocatedLotIds`.

**Acceptance Criteria:**
- [x] Mode selector in Section 2 allows seamless switching between Dynamic Rule (Sweep) and Pinned Lot Scope.
- [x] Freezing current lots automatically populates `explicitLotIds` with the currently matched lot IDs.
- [x] Defunct/unavailable lot IDs are safely removed from stage allocations upon sync.
- [x] Saving updates the backend campaign document with consistent state.
- [x] End-to-end and component tests verifying mode switching, stage allocation sync, and campaign persistence.
