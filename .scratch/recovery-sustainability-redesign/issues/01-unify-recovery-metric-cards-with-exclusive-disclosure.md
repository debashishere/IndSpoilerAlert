# 01: Unify Recovery & Sustainability Metric Cards with Exclusive Disclosure

**What to build:** When a supplier navigates to the Insight tab and views the default "Recovery & Sustainability" subtab, the 4 metric cards (`COGS Recovery Rate`, `Landfill Waste Diverted`, `Fees & Tax Benefit Saved`, `CO2 Emissions Saved`) should display institutional `/ux-v1` card styling conforming to ADR-0052. The "i" button is positioned at the top right of the card next to the uppercase metric title (not wrapped to the bottom). Clicking the "i" button opens a popover detailing the verified calculation formula, inputs, and domain definition. Opening any info popover automatically closes any other open card popover (single-active exclusive disclosure), and clicking outside dismisses the popover. All legacy inline CSS styles (`style={{ ... }}`) and `.card` class dependencies are eliminated.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Refactor `SummaryMetrics.tsx` to render the 4 metrics using the canonical `InsightCard` component pattern
- [x] Align the "i" button next to the uppercase title in the header row of each metric card
- [x] Implement controlled single-active exclusive disclosure state (`activeInfoCardId`) across all 4 cards
- [x] Add outside-click dismissal listener to close active popovers when clicking outside the card
- [x] Update card tooltip content with accurate calculation formulas and accounting definitions per ADR-0052
- [x] Ensure metric values render with `/ux-v1` tabular typography (`text-[20px] font-bold font-mono leading-none`)
- [x] Write unit tests verifying single-active disclosure, outside-click dismissal, and tooltip formula contents
