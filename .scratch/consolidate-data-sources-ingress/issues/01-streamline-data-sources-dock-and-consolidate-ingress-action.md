# 01: Streamline Data Sources Dock and Consolidate Ingress Action

**What to build:** An operator navigating the Ingestion workspace sees a clean, streamlined "Data Sources" dock header without individual connector preview chips/tabs. The dock retains its title, descriptive subtitle, and operational telemetry badge ("Auto-sync Active • 4 sources configured"). A prominent visual `+ Add Data Source` primary button serves as the sole interactive navigation entrypoint into the full-page Integration Management Suite, landing on Google Sheets configuration by default.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] All connector preview chips (Google Sheets, CSV / Excel Upload, Zapier Webhooks, Image & Doc Scanner) are removed from the Data Sources dock in `IngestionHubConnectors`.
- [x] The Data Sources header retains the section title, icon, descriptive subtitle, and "Auto-sync Active" operational telemetry badge.
- [x] The `+ Add Data Source` primary button (`data-testid="data-sources-add-button"`) remains clearly rendered on the right side of the dock and dispatches navigation to `google-sheets` (`onSelectConnector('google-sheets')`).
- [x] Unit tests in `DataSourcesDock.test.tsx` verify the streamlined dock layout, absence of preview chips, and functional navigation dispatch upon clicking `+ Add Data Source`.
