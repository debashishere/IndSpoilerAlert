# 52. Recovery Panel Metric Cards Unification with InsightCard

The 4 metric cards in `SummaryMetrics` within the Recovery & Sustainability panel (`COGS Recovery Rate`, `Landfill Waste Diverted`, `Fees & Tax Benefit Saved`, `CO2 Emissions Saved`) are refactored from legacy inline-styled containers to the canonical `InsightCard` component. This standardizes typography (`text-[20px] font-bold font-mono`), optical information icon alignment alongside uppercase titles, single-active exclusive disclosure state, and outside-click dismissal across the entire Insight Hub.
