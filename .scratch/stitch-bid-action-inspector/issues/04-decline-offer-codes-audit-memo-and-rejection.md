# 04: Decline Offer Work Surface with Mandatory Codes, Audit Memo & Rejection Dispatch

**What to build:** 
The Stitch Decline Offer work surface giving suppliers clear, structured rejection workflows:
1. **Rejection Specification Card**: Dropdown for mandatory decline reason codes (`Price below recovery floor`, `Inventory committed elsewhere`, `Logistics/pickup constraint`, `Custom rationale`), an internal audit ledger memo field, and an auto-relist inventory toggle returning cases to the surplus pool.
2. **Multi-Channel Communication Card**: Channel selector pills (`Email`, `In-App`, `SMS`), TipTap decline editor with dynamic tokens (`decline_reason`, `decline_rationale`, `catalog_link`).
3. **Rejection Footer Action Bar**: Highlights inventory return state and escrow deposit release, with single-click "Confirm Decline & Send Notice" button.

**Blocked by:** 01: Stitch Header, 4-Column Commercial Stat Cards & Test Baseline

**Status:** completed

- [x] Rejection specification card provides mandatory reason dropdown and internal audit note input.
- [x] Auto-relist checkbox controls whether inventory cases return to the active open liquidation pool.
- [x] TipTap composer auto-populates decline notice template with dynamic tokens and catalog redirect link.
- [x] Decline submission validates mandatory reason presence and passes payload (`reason`, `rationale`, `templateHtml`) to `onDecline`.
- [x] Rejection footer displays escrow release notice and executes decline flow with feedback toast.
