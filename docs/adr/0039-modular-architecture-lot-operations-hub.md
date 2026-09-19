# ADR 0039: Modular Architecture Refactoring for Lot Operations Hub

- **Status**: Approved
- **Date**: 2026-09-19
- **Authors**: Antigravity AI & SpoilerAlert Engineering Team
- **Deciders**: Lead Architect, Full-Stack Engineers

---

## 1. Context & Problem Statement

`LotOperationsHubView.tsx` grew into an 1,827-line monolithic component coordinating all aspects of a single inventory lot's post-ingestion operations. While fully functional and covered by integration tests, the component violates several core principles of the React & TypeScript architecture standard (`react-ts-v1`):

1. **State & Logic Sprawl**: Over 25 distinct state variables, Redux store selectors, and dispatch thunks (lifecycle actions, pricing simulator, compliance uploads, allergen updates, bid actions, and CRM activity logging) are concentrated in a single render function.
2. **Embedded Algorithmic Math**: Sigmoid curve calculations, category elasticity models, and SVG path rendering are inline within the JSX body.
3. **Inline Style Sprawl**: Hundreds of lines of inline `style={{ ... }}` objects are scattered across tables, badges, containers, and charts.
4. **Oversized Component**: At 1,827 lines, it far exceeds the 250-line target for shell orchestrators.

---

## 2. Decision & Architectural Seams

We decompose `LotOperationsHubView.tsx` into a modular domain package located at `src/components/domain/lot-operations-hub/`:

1. **Constants & Math (`constants/`)**:
   - `lotOperationsConstants.ts`: Category price elasticities, bid status mapping rules, tab definitions, activity type presets, and default slider parameters.

2. **Strict TypeScript Types (`types/`)**:
   - `lotOperations.types.ts`: Props interfaces, sub-tab discriminated unions, pricing curve point structures, normalized bid statuses, and activity payload types.

3. **Headless Hooks (`hooks/`)**:
   - `useLotOperationsHub.ts`: Central coordinator managing Redux store bindings, prop overrides, toast notices, back navigation, and sub-tab selection.
   - `useLotPricingSimulator.ts`: Pure pricing elasticity calculations, SVG decay curve points generation, and slider state management.
   - `useLotBidsTradingDesk.ts`: Bid deduplication, status normalization (`getBidStatusInfo`), search/filter logic, dual-figure unit pricing, and action dispatches (accept, counter, decline, reset, resend settlement).
   - `useLotActivitiesStream.ts`: Activity filter state, author attribution, and activity creation thunk execution.

4. **Composable Subcomponents (`subcomponents/`)**:
   - `LotOperationsHeader.tsx`: Lot identification, SKU, expiry countdown, allergen tags, and lifecycle actions (Enable Bidding, Donate, Recycle).
   - `LotOperationsSubTabs.tsx`: Tab navigation bar (`details` | `bids` | `activities`).
   - `details/LotDetailsOverview.tsx`: Product specs, risk assessment badges, and allergen manager.
   - `details/LotPricingSimulator.tsx`: Sliders, suggested price badges, and SVG decay curve plot.
   - `details/LotBuyerMatches.tsx`: Buyer recommendation roster with confidence scores.
   - `details/LotComplianceSection.tsx`: COA documents, batch records, and file upload zone.
   - `bids/LotBidsTradingDesk.tsx`: Bids search, status filters, summary metric cards, bid rows, and `BidActionInspectorModal` integration.
   - `activities/LotActivityTimeline.tsx`: Categorized CRM activity stream and item cards.
   - `activities/LotActivityComposer.tsx`: Communication logging form with channel presets.

5. **Slim Orchestrator Shell (< 250 lines)**:
   - `LotOperationsHubView.tsx` inside `domain/lot-operations-hub/`: Clean coordinator rendering the header, sub-tabs, and active stage view.
   - Re-exported via `src/components/LotOperationsHubView.tsx` to maintain 100% backward compatibility for all existing tests and imports.

---

## 3. Consequences

### Positive
- Component code reduced from 1,827 lines in a single file to an orchestrator shell under 200 lines.
- Headless math, pricing curve algorithms, and bid filtering are cleanly decoupled and testable.
- Inline styles migrated to Tailwind utility classes and theme tokens (`hsl(var(--...))`).
- 100% backward-compatible prop contract and Redux bindings. Zero test regressions.

### Negative / Trade-offs
- Multiple files created across `domain/lot-operations-hub/`; unified through standard directory conventions and barrel exports in `index.ts`.
