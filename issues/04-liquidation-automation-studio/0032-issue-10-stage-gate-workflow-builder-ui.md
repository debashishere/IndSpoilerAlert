# Issue #32: Stage-Gate Workflow Builder UI with Floor Guards

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

- Issue #22

## What to build

Update the frontend React user interface on the `workflows` tab to support custom stage-gate workflow creations and template configurations.

1. **Build Hybrid Inventory Selector**:
   * Add a dynamic selection widget that allows reps to specify filters (Category, Warehouse, Expiration days remaining).
   * Show a paginated preview list of matching lots with checkboxes, allowing sales reps to manually include or exclude individual lots before activation (mapping to `explicitLotIds` and `excludedLotIds`).
2. **Build Scheduling & Email Editor**:
   * Add timezone dropdown selection (e.g. US/Eastern, US/Central, UTC).
   * Implement a custom email drafting text area supporting text tags (chips) like `{{contact_name}}` and `{{inventory_table}}`.
   * Add an "Email Preview" modal that queries `/preview-email` and renders the email structure with mockup details, including empty-state warning banners.
3. **Build Branch Selection & Floor Guards**:
   * Implement UI controls to configure Success Path and Fallback Path actions.
   * Add floor price validation: if `auto_award` is selected, display required input fields for `minimumBidFloorPrice` and/or `minimumYieldRecoveryPercent`. Disable the "Activate Workflow" button unless these floor guard values are specified.

## Acceptance criteria

- [ ] Interactive form successfully creates a `LiquidationAutomation` document in the database via the API.
- [ ] Hybrid selection preview allows including/excluding specific lots and updates arrays in payload.
- [ ] Email Preview modal renders styled inventory tables and shows empty state warning banner when 0 lots match.
- [ ] UI floor guards prevent saving workflows with auto-award enabled but empty floor prices.

## Blocked by

- Issue #30
- Issue #31
