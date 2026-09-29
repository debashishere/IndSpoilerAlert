# 61. Idempotent Google Sheets Upsert and Quantity Drift Reconciliation

To prevent lot ID churn and avoid corrupting active workflow campaigns or buyer bids, Google Sheets synchronization reconciles inbound spreadsheet rows against active `InventoryLot` records via a composite natural key (`sku` + `lotNumber`). New rows insert fresh inventory lots, existing rows update mutable attributes (available quantities, expiration dates, baseline pricing) while preserving stage bids and audit logs, and zero-quantity rows transition cleanly to depleted status.
