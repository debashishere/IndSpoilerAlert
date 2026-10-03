# Consolidate Data Sources Ingress to Single Add Data Source Action

## Context
The Data Sources dock in the Ingestion view previously displayed semi-visible preview tabs/chips for individual connectors (Google Sheets, CSV/Excel Upload, Zapier Webhooks, Image & Doc Scanner) alongside a primary "+ Add Data Source" button. Each chip triggered direct navigation to its corresponding integration management view.

## Decision
We remove the preview chip / tab layout entirely from the Data Sources dock, establishing the visual "+ Add Data Source" primary button as the sole interactive ingress action navigating into the Integration Management Suite (landing by default on Google Sheets Sync). The dock header retains its title, subtitle, and operational auto-sync telemetry badge.

## Consequences
- Simplifies the Ingestion workbench header into a clean, distraction-free command banner.
- Establishes a single, unambiguous user journey for configuring inbound integrations via the "+ Add Data Source" button.
- Preserves full cross-connector switching within the dedicated Integration Management Suite (`IngestionConnectorShell`).
