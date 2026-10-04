# 04: In-Situ Import Commit Handshake and Pipeline Navigation

**What to build:** In Quadrant 4, the operator binds OCR column headers to canonical attributes in `GridMapperTable` configured in `mode="import"` for the active pipeline target. Clicking the confirm button directly commits the records into the database, displays an emerald ingestion success banner with imported record count and generated IDs, and surfaces CTAs to "Scan Another Document" or "View in Pipeline Table →" which navigates seamlessly back to the target pipeline.

**Blocked by:** 03: Scanned Documents Roster Target Lineage and Re-staging

**Status:** completed

- [x] Quadrant 4 binds `GridMapperTable` in `mode="import"` with `pipelineType` matching the active target.
- [x] Mapper header pill displays the active target schema label and active document name.
- [x] On successful confirmation, renders the completion banner displaying imported record count, generated lot/record IDs, and source file name.
- [x] "Scan Another Document" CTA clears staging state, resets dropzone, and enables immediate re-scan.
- [x] "View in Pipeline Table →" CTA dispatches pipeline tab update and invokes `onNavigateToPipeline` navigation callback.
- [x] End-to-end integration tests verify confirmation commit, success banner rendering, and pipeline table navigation.
