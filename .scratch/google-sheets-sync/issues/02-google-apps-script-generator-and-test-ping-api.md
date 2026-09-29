# 02: Google Apps Script Generator and Test Ping API

**What to build:** A script generation service and test verification endpoint that produces tailored Google Apps Script code for any supplier. The generated script equips the supplier's Google Sheet with a native toolbar menu ("SpoilerAlert OS ⚡ > Sync to Platform Now") and an installable `onChange` event trigger that debounces spreadsheet edits and pushes data to the ingress webhook.

**Blocked by:** 01: Google Sheets Ingress Webhook and Idempotent Inventory Engine

**Status:** complete

- [x] Implement backend generator utility producing executable Google Apps Script code pre-populated with the supplier's API endpoint URL and cryptographic `X-Ingress-Key`.
- [x] Incorporate an installable `onChange` / `onEdit` handler in the script with a 5-second debounce window to prevent webhook storms during manual cell editing.
- [x] Inject native Google Sheets UI menu items (`onOpen` creating `"SpoilerAlert OS ⚡ > Sync to Platform Now"` and `"Verify Connection"`).
- [x] Implement `GET /api/v1/ingestion/google-sheets/script-template?supplierId=...` returning the personalized script string.
- [x] Implement `POST /api/v1/ingestion/google-sheets/test-ping` endpoint allowing suppliers or the script to verify connectivity and return an immediate health check status.
- [x] Add unit tests verifying script generation token safety, menu configuration, and test-ping endpoint behavior.

