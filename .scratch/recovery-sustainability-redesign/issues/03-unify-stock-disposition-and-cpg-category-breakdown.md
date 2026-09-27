# 03: Unify Stock Disposition and CPG Category Breakdown into Balanced Right-Hand Rail

**What to build:** In the "Recovery & Sustainability" subtab, the two sections of `RSLDistributionChart` (*Product Stock Disposition* stacked bar and *Volume Distribution by CPG Category* bar list) should be grouped into a single unified column container within the right-hand (1fr) rail of the `grid-cols-[1.5fr_1fr]` dashboard layout. This eliminates the layout bug where the CPG category card wrapped into an orphan row, leaving empty grid space. Both cards are modernized with `/ux-v1` Tailwind design tokens (`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs`), removing legacy inline styles. Live case counts, disposition percentages (Sold, Donated, Recycled, Expired), and CPG category volume bars are bound to Redux selectors.

**Blocked by:** 02: Modernize Recovery Trendline Dashboard with /ux-v1 Styling and Robust Fallbacks

**Status:** done

- [x] Wrap `RSLDistributionChart.tsx` child cards in a unified vertical flex container (`flex flex-col gap-5`) so they align symmetrically with the 1.5fr trendline chart
- [x] Modernize both cards with `/ux-v1` Tailwind styling and dark mode support
- [x] Eliminate all inline styles and legacy `.card` class dependencies
- [x] Format disposition stacked bar with theme-safe colors and accessible titles
- [x] Render CPG category volume distribution bars with accurate case counts and percentage calculations
- [x] Add unit tests verifying stacked bar calculations, category breakdown rendering, and zero-state handling
