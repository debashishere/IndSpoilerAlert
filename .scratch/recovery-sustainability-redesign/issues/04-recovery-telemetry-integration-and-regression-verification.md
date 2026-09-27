# 04: End-to-End Recovery Hub Telemetry Integration & Regression Verification

**What to build:** Comprehensive integration verification across the entire Centralized Insight Hub. Validates that the `/api/analytics/summary` endpoint accurately populates all 4 metric cards (`SummaryMetrics`) and both chart components (`COGSRecoveryDashboard`, `RSLDistributionChart`) through Redux selectors (`selectCOGSRecoveryMetrics`, `selectRSLDistribution`, `selectLandfillDiversionStats`). Verifies seamless subtab switching between "Recovery & Sustainability", "Current Bidding Data", "Sales & Clearing", and "Cross-Platform Operations" without visual layout shift. Ensures the entire test suite passes with 100% green tests and zero regressions.

**Blocked by:** 01: Unify Recovery & Sustainability Metric Cards with Exclusive Disclosure, 03: Unify Stock Disposition and CPG Category Breakdown into Balanced Right-Hand Rail

**Status:** done

- [x] Verify live backend `/api/analytics/summary` payload flows through Redux thunk and populates all Recovery panel components
- [x] Ensure subtab switching between all 4 insight subtabs maintains state and does not trigger visual regressions
- [x] Run full test suite (`npm test`) across all 140 test files and ensure 100% pass rate
- [x] Add comprehensive integration test suite `RecoverySustainabilityTelemetry.test.tsx` verifying end-to-end data flow and user interactions
