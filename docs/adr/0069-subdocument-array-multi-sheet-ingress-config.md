# 69. Subdocument Array Pattern for Multi-Sheet Ingress Configuration

To ensure atomic state updates and efficient single-roundtrip hydration of the Connected Sheets Roster, `GoogleSheetsSyncConfig` maintains a master document per supplier containing a persistent `ingressKey` and an embedded array of `connectedSheets`. Incoming webhooks identify or upsert subdocuments by `spreadsheetId` + `sheetName`, tracking per-sheet synchronization health, last synced timestamp, lot volume metrics, and template bindings without document fragmentation.
