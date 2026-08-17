# 01 — Remove Raw Telemetry Tab & Tighten Audit Modal Tab Bar

**What to build:** The `Raw Telemetry & JSON` tab is removed from the Full-Screen Execution Audit Inspector. The tab bar renders exactly 5 tabs: Summary & Timeline, Strategy Snapshot, Inventory Scope, Communications Log, and Bids & Offers Ledger. The `activeTab` state type is narrowed to exclude `'raw'`. No functional regression — all other tab content and the export JSON button in the header remain untouched.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] `Raw Telemetry & JSON` tab button is removed from the audit modal nav bar
- [ ] The `activeTab` union type no longer includes `'raw'`
- [ ] The raw telemetry tab body content block is removed
- [ ] The 5 remaining tabs render correctly with no layout shift
- [ ] The header-level "Export Audit Report (JSON)" button still works (it is independent of the raw tab)
- [ ] No console errors or TypeScript errors introduced
