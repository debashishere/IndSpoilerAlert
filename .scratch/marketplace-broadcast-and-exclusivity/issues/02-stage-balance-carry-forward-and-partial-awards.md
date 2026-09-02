# 02 — Stage Balance Carry-Forward & Partial Awards Handling

**What to build:** Implement partial bid award processing and quantity carry-forward across workflow stages. When a buyer bids on a subset of available cases and is awarded, the remaining unawarded quantity remains active for other targeted buyers in the current stage until the evaluation window expires, after which the exact remaining balance carries forward to downstream stages.

**Blocked by:** 01 — Private Stage Exclusivity Enforcement & Quick Bid Routing

**Status:** complete

- [x] Awarding a partial quantity updates `awardedQty` on the current stage execution while preserving the remaining lot quantity in the active evaluation pool.
- [x] Subsequent stages receive only the unawarded balance (`totalQty - awardedQty`) rather than resetting to the original lot count.
- [x] If all cases across all evaluated lots are awarded, downstream stages are aborted and the run status transitions cleanly to `awarded`.
- [x] Automated regression tests verify accurate balance calculation across multi-stage execution runs.
