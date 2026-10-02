# 05: Full-Page Zapier Telemetry, Credentials & Roster

**What to build:** An operator configuring or monitoring Zapier webhooks can open a dedicated full-page view featuring Quadrants 1, 2, and 3: 1) live Zapier connection and throughput telemetry, 2) Ingress Webhook endpoint URL, cryptographic secret token, and interactive Zapier Catch Hook setup guide with sample JSON payloads, and 3) Connected Zaps Roster displaying registered Zap feeds, trigger origins, lot counts, and disconnect controls.

**Blocked by:** 01: Sub-Routing, Ingestion Page Shell & Connector Transition Seam, 04: Zapier Inbound Webhook API & Ingestion Backend Seam

**Status:** completed

- [x] Delivers the full-page Zapier view housing Quadrants 1, 2, and 3.
- [x] Quadrant 1 renders Zapier status (`Active Trigger`, `Idle`, `Error`), ping test trigger, ping latency, and total ingested lots count.
- [x] Quadrant 2 provides the Ingress Webhook endpoint URL, supplier secret token, and interactive Zapier Catch Hook setup guide (trigger setup, headers, sample JSON payload).
- [x] Quadrant 3 renders the Connected Zaps Roster (Zap name, trigger origin, lot counts, last active timestamp, and disconnect controls).
- [x] Frontend Redux slice (`zapierSync`) and API service client integrated.
- [x] Comprehensive frontend unit and component tests verify rendering, credentials copy, and roster controls.
