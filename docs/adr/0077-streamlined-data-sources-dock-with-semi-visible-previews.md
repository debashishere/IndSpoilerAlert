# Redesign Ingestion Hub as Streamlined Data Sources Dock with Semi-Visible Preview Chips

## Context
The inventory ingestion workbench previously occupied significant vertical viewport real estate with a 5-card collapsible grid (`IngestionHubConnectors`), rendering separate large cards for Zapier, Google Sheets, Doc Scanner, CSV/Excel, and an empty Add Integration card. Since all connectors now feature dedicated full-page management views under the Integration Management Suite (ADR 0070, ADR 0071, ADR 0076), rendering redundant large cards created unnecessary visual clutter before the pipeline table.

## Decision
We replace the 5-card grid with a compact, high-density **Data Sources Dock**. The dock features a clear section header ("Data Sources"), a prominent visual `+` button launching the Integration Management Suite (defaulting to the primary cloud connector `google-sheets`), and semi-visible (muted/translucent preview chips with brand icons) displaying available data sources (Google Sheets, CSV / Excel, Zapier, Image & Doc Scanner). The semi-visible preview chips use frosted translucent pill styling with brand accents and display live-status pulse dots for active feeds. Clicking the primary `+` button opens the suite at `google-sheets`, while clicking any specific source chip smoothly navigates directly into that connector's workspace.

## Consequences
- Reduces vertical footprint by ~70%, bringing active inventory and pipeline tables above the fold.
- Retains at-a-glance comprehension of all available inbound data connections through recognizable semi-visible chips.
- Maintains deep-linkable navigation directly into each connector's configuration suite.

