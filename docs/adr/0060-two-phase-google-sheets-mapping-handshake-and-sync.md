# 60. Two-Phase Google Sheets Mapping Handshake and Autonomous Sync

To ensure high data fidelity while eliminating repetitive manual imports, Google Sheets Ingestion operates as a two-phase lifecycle: an initial interactive handshake where sample spreadsheet rows hydrate `GridMapperTable` for user-verified column mapping saved to a `SupplierTemplate`, followed by autonomous background polling that applies the template to sync new and modified inventory rows into active `InventoryLot` records.
