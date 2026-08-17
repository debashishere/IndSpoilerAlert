# 0104 — Slice 1: Edit-Mode Inventory Drift Detection & Re-evaluation Alert Banner

**What to build:**
When a user edits an existing saved campaign (`editingCampaignId`) in `LiquidationAutomationStudio.tsx`, look up the most recent execution run for this campaign strategy from `automationRuns` state (or fetch via API if needed). Compare the historical snapshot lot count (`snapshotInventoryIds.length`) against the current dynamically matched lot count (`matchedLots.length`).

If a drift is detected (i.e. the historical run targeted $N$ lots, but current live inventory matches $M$ lots where $N \neq M$), display an interactive **"Inventory Re-evaluated"** alert banner right above the Master Inventory Pool filter section.

**Key Specifications:**
1. **Drift Detection Logic**:
   - Compute `lastRunLotCount = latestRun?.snapshotInventoryIds?.length || 0`.
   - Compute `currentMatchedCount = matchedLots.length`.
   - Drift condition: `Boolean(editingCampaignId && latestRun && lastRunLotCount > 0 && lastRunLotCount !== currentMatchedCount)`.
2. **Alert Banner UI Design**:
   - Styled with a warning/info palette (`hsl(var(--warning) / 12%)` background, `hsl(var(--warning))` border and accents).
   - Headline: `Inventory Scope Updated (Live Re-evaluation)`.
   - Body copy:
     > *"Inventory has changed since the last execution on {formattedLastRunDate}. Currently, **{currentMatchedCount} lot(s)** are eligible based on active filter rules ({lastRunLotCount - currentMatchedCount} previously processed lots are no longer active, have been liquidated, or aged out)."*
   - Action Buttons:
     - `[Review Lot Breakdown]` (opens the diff breakdown modal built in Slice 2).
     - `[Dismiss]` (hides the banner for the current session).

**Acceptance Criteria:**
- [x] In `LiquidationAutomationStudio.tsx`, look up the latest historical execution run for `editingCampaignId`.
- [x] If the latest run had $N$ lots (e.g. 104) and current dynamic evaluation matches $M$ lots (e.g. 1), render the "Inventory Scope Updated" banner with exact counts.
- [x] If no previous execution exists or if counts match, do not render the drift banner.
- [x] Clicking `[Dismiss]` closes the banner.
- [x] Add unit and component tests verifying the drift banner appearance and dismissal behavior.
