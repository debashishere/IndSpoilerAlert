# 03 — Live Buyer CSV Ingestion UI Panel & Unified Buyer Registry

**What to build:** Interactive UI in the Buyer Registry panel replacing the static "backend import coming soon" message with live file upload, column mapping preview, and instant buyer list re-fetching upon successful CSV import.

**Blocked by:** 02 — Redux Store & Service Integration for Live Buyer Ingestion

**Status:** done

- [x] Update `BuyerRegistryPanel.tsx` to handle file selection by calling `uploadBuyerThunk`.
- [x] Render column mapping modal or inline confirmation control when a buyer CSV (e.g., `buyers_100_seed.csv`) is uploaded.
- [x] Dispatch `confirmBuyerThunk` upon user confirmation and auto-trigger `fetchCoreReferenceData()` to immediately display newly imported buyers in the registry list.
- [x] Ensure manually added buyers (via manual form) and bulk-imported buyers exist side-by-side in the same unified table layout.
- [x] Add UI unit/integration tests verifying file upload, column mapping confirmation, and table state updates.
