# 63. Direct Grid Payload Push with Fallback Pull

To optimize sync performance and eliminate Google Cloud API rate-limiting during frequent spreadsheet edits, Google Sheets Ingestion prioritizes direct grid payload pushing from Google Apps Script. Spreadsheet rows are packaged in the webhook POST body authenticated with an `X-Ingress-Key`, processed immediately against the bound `SupplierTemplate`, and fall back to Google Sheets API streaming only if payload size limits are exceeded.
