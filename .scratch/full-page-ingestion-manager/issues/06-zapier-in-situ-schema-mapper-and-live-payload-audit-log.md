# 06: Zapier In-Situ Schema Mapper & Live Payload Audit Log

**What to build:** An operator managing Zapier feeds can configure column mappings per feed and monitor incoming deliveries in real-time on the full page. The page provides Quadrant 4: an in-situ schema field mapper binding Zapier JSON keys to canonical lot attributes, paired with an expandable Recent Payload Ingress log displaying recent webhook hits, HTTP status codes, execution durations, and raw payload previews for instant debugging.

**Blocked by:** 05: Full-Page Zapier Telemetry, Credentials & Roster

**Status:** completed

- [x] Delivers Quadrant 4 in the full-page Zapier view: in-situ key-to-lot field schema mapping editor for per-zap mapping configurations.
- [x] Renders the Recent Payload Ingress log beneath the roster displaying recent webhook deliveries, timestamps, response codes, and payload samples.
- [x] Connects schema save and preview handlers to backend Zapier mapping endpoints.
- [x] Frontend unit and component tests verify mapping editor actions, payload log expansion, and error states.
