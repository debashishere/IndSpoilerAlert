# 02: Modernize Recovery Trendline Dashboard with /ux-v1 Styling and Robust Fallbacks

**What to build:** In the "Recovery & Sustainability" subtab, the COGS Recovery Rate & Waste Diverted Trends chart (`COGSRecoveryDashboard`) should render inside an institutional `/ux-v1` card shell (`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs`) conforming to ADR-0053. The SVG line chart displays the 6-month historical recovery percentage and waste diverted tonnage with clear axis ticks, data dots, readable month labels, and dark-mode styling. Legacy inline styles (`style={{ ... }}`) and `.card` class are completely removed. When backend telemetry is initializing or returns empty trends, a clean zero/empty-state placeholder is displayed instead of a blank or broken chart.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Re-engineer `COGSRecoveryDashboard.tsx` container using `/ux-v1` Tailwind utility classes
- [x] Eliminate all inline `style={{ ... }}` objects and the uncontained `.card` class
- [x] Add dark-mode responsive styling to SVG grid lines, axis labels, legend indicators, and line paths
- [x] Provide graceful zero/empty-state fallback when `trends` is empty or loading
- [x] Ensure SVG coordinates scale cleanly across desktop and tablet viewports
- [x] Add unit tests verifying chart rendering with live data, empty state fallback, and selector binding
