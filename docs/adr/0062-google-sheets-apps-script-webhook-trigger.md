# 62. Google Sheets Apps Script Webhook Trigger and Native Sheet Action Menu

To achieve instant real-time synchronization without server polling overhead or complex Google Drive domain verification hurdles, Google Sheets Ingestion employs an event-driven Google Apps Script trigger. The platform provisions an authenticated webhook endpoint (`/api/v1/ingestion/google-sheets/webhook`) and an installable Apps Script that debounces spreadsheet `onChange` edits and injects a native "SpoilerAlert OS ⚡ > Sync to Platform Now" toolbar menu directly inside the supplier's Google Sheet.
