Issue: 0056
Title: "Slice 3: Saved Campaigns Table ExecutedAt Column & Interactive Dropdown UI"
Status: COMPLETED

## What to build

Add an `ExecutedAt` column to the Saved Campaigns table in `WorkflowsView.tsx`. Render `Never Executed` for 0 runs, a single formatted timestamp badge for 1 run, and a reverse-chronological `<select>` dropdown menu for multiple runs. Selecting a timestamp triggers loading and modal inspection.

## Acceptance criteria

- [ ] Saved Campaigns table includes an `ExecutedAt` column header.
- [ ] Displays `Never Executed` pill when a campaign has no run history.
- [ ] Displays reverse-chronological `<select>` dropdown when multiple execution timestamps exist.
- [ ] Selecting an execution timestamp triggers loading of that specific run's audit snapshot.

## Blocked by

- [Issue 0055](file:///Users/debashisroy/Documents/SpoilerAlert/issues/0055-slice-2-execution-summary-and-run-snapshot-api-endpoints.md)
