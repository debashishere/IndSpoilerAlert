# Unified Four-Quadrant Integration Page Architecture

To ensure operational predictability and visual coherence across all automated ingestion connectors (Google Sheets, Zapier, Image & Doc Scanner), every full-page integration management view adheres to a standardized Four-Quadrant structure:
1. Header & Health Telemetry: High-level status pill, latency telemetry, breadcrumb, and manual trigger controls.
2. Credentials & Setup Guide: Webhook endpoint URL, cryptographic secret ingress key, and context-specific setup documentation.
3. Connected Sources Roster: Tabular registry of active feeds, sheets, or webhook origins with row metrics and individual sync triggers.
4. In-Situ Schema Field Mapper: Interactive mapping surface binding heterogeneous source attributes to canonical domain entities without leaving the page.
