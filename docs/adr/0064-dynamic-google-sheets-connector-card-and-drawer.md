# 64. Dynamic Google Sheets Connector Card and Configuration Drawer

To surface live integration health directly within the Ingestion Hub, the Google Sheets connector card employs a dual-state design: an unconfigured state triggering a slide-over configuration drawer (for OAuth verification, spreadsheet selection, copyable Apps Script snippets, and initial mapping preview), and an active state with live pulse telemetry, one-click "Sync Now" dispatch, and drawer reconfiguration controls.
