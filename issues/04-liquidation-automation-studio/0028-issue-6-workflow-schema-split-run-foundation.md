# Issue #28: Workflow Schema Split & AutomationRun Model Foundation

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

- Issue #22

## What to build

Refactor our MongoDB schemas to separate the static template definition of a workflow from its active and historical execution runs.

1. **Update `LiquidationAutomation`**: Change Mongoose schema in `backend/src/models/LiquidationAutomation.ts` to represent the static template definition. Remove the `status` enum. Add:
   * `isActive: { type: Boolean, default: true }`
   * `nextRunAt: { type: Date }`
   * `stats: { totalRuns: { type: Number, default: 0 }, totalAwarded: { type: Number, default: 0 }, totalDonated: { type: Number, default: 0 } }`
   * Expand `inventoryFilters` to support cherry-picked inputs (`explicitLotIds: [ObjectId]`, `excludedLotIds: [ObjectId]`).
   * Expand `schedule` to capture target `timezone: string` (e.g. "America/New_York"), `timeOfDay`, and `daysOfWeek`.
   * Add `emailTemplate` properties (`subject`, `body`, `targetBuyers`, `customBuyerIds`).
   * Add `rules` structure (`evaluationWindowHours`, `onSuccess`, `onFallback`, `minimumBidFloorPrice`, `minimumYieldRecoveryPercent`).

2. **Create `AutomationRun`**: Create Mongoose schema in `backend/src/models/AutomationRun.ts`:
   * `automationId: ObjectId` (ref: `LiquidationAutomation`)
   * `runType: 'scheduled' | 'manual'`
   * `status: 'dispatched' | 'evaluating' | 'awarded' | 'fallback_executed' | 'failed'`
   * `snapshotInventoryIds: [ObjectId]` (ref: `InventoryLot`)
   * `evaluatedBuyerIds: [ObjectId]` (ref: `Buyer`)
   * `fallbackJobId: String` (for queue cancellation reference)
   * `dispatchedAt: Date`
   * `evaluationEndsAt: Date`
   * `resolution`: `{ action: string, targetBuyerId: ObjectId, winningOfferId: ObjectId, resolvedAt: Date }`

3. **Build API CRUD routes**: Implement endpoints in the Express routes to handle:
   * Create/update `LiquidationAutomation` templates.
   * Query historical `AutomationRun` logs filtered by `supplierId` or `automationId`.

## Acceptance criteria

- [ ] Mongoose models `LiquidationAutomation` and `AutomationRun` compile and register successfully.
- [ ] CRUD endpoints for managing templates and fetching runs return correct schemas.
- [ ] Database seed scripts are updated to verify database schema registration.
- [ ] Integration tests verify template creation and template/run separation.

## Blocked by

None - can start immediately
