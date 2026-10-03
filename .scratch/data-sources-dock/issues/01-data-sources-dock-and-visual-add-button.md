# 01: Redesign Ingestion Hub into Data Sources Dock with Visual + Button

**What to build:** An operator navigating the Inventory and Ingestion workspace sees a clean, streamlined "Data Sources" section instead of the bulky 5-card grid. It displays the section title "Data Sources", a descriptive subtitle, and a prominent visual "+ Add Data Source" primary button. When clicked, the button triggers seamless navigation into the full-page Integration Management Suite window, landing by default on the Google Sheets configuration workspace.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] The component displays the section title "Data Sources" with supporting subtitle explaining inbound ingestion capabilities.
- [x] A prominent visual `+ Add Data Source` primary button (`data-testid="data-sources-add-button"`) is clearly visible with an icon and responsive styling.
- [x] Clicking the `+ Add Data Source` button dispatches navigation into the Integration Management Suite (`onSelectConnector('google-sheets')` or default ingress route).
- [x] The container maintains backwards-compatible IDs (`id="ingestion-hub-section"` and `data-testid="data-sources-dock"`).
- [x] Component unit tests verify clean rendering, test IDs, and button click callback dispatch.

