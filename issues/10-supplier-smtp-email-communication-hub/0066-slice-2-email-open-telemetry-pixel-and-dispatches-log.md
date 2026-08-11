## What to build

Deploy an email open tracking pixel and dispatched emails audit view. Outbound emails automatically embed a transparent 1x1 tracking pixel endpoint that logs initial open timestamp, last open timestamp, and total open counts per recipient dispatch log.

## Acceptance criteria

- [ ] Backend endpoint `GET /api/tracking/pixel.png?dispatchId=<id>` returns a transparent 1x1 image and updates dispatch telemetry.
- [ ] Dispatch log records `firstOpenedAt`, `lastOpenedAt`, `openCount`, buyer email, and User-Agent headers.
- [ ] Dispatched Emails Telemetry sub-tab displays high-level open metrics (Total Sent, Unique Opens, Open Rate %) and a searchable dispatch log table.

## Blocked by

- [Issue #0065](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0065-slice-1-centralized-platform-settings-and-supplier-smtp.md)
