# ADR 0038: Modular Architecture Refactoring for Bid Action Inspector

- **Status**: Approved
- **Date**: 2026-09-19
- **Authors**: Antigravity AI & SpoilerAlert Engineering Team
- **Deciders**: Lead Architect, Full-Stack Engineers

---

## 1. Context & Problem Statement

`BidActionInspectorModal.tsx` grew into a 3,047-line monolithic file while implementing the Stitch Trading Desk specifications (ADR 0037). While fully functional and thoroughly tested (89 green tests in `BidActionInspectorModal.test.tsx`), the monolith concentrated multiple distinct responsibilities:
1. Outbound email templates and dynamic merge tokens.
2. Complex bid calculation and margin variance math.
3. Multi-channel state management (Email, In-App, SMS) across 3 action modes.
4. Full timeline audit stream generation, filtering, and text querying.
5. Extensive JSX UI trees with thousands of inline style properties.

Maintaining and extending this file violated the Senior React & TypeScript architecture standard (`react-ts-v1`), specifically the deep module, headless state isolation, and <250-line orchestrator shell rules.

---

## 2. Decision & Architectural Seams

We decompose `BidActionInspectorModal.tsx` into a modular domain feature under `src/components/domain/bid-action-inspector/`:

1. **Dedicated Constants & Templates (`constants/`)**:
   - `bidActionInspectorConstants.ts`: Reusable token arrays (`NEGOTIATION_TOKENS`, `SETTLEMENT_TOKENS`, `DECLINE_TOKENS`), decline reasons (`DECLINE_REASONS`).
   - `bidActionInspectorTemplates.ts`: Default HTML templates with dynamic token markers.

2. **Strict TypeScript Types (`types/`)**:
   - `bidActionInspector.types.ts`: Discriminated mode unions, timeline event schemas, action payloads, and prop contracts.

3. **Headless Hooks (`hooks/`)**:
   - `useBidCalculations.ts`: Pure calculations for unit prices, volume clearances, margin uplift, and token hydration.
   - `useTimelineAudit.ts`: Event collation, category filtering, and real-time substring search.
   - `useBidActionInspector.ts`: Primary headless state machine managing modal lifecycle, channel selection, accordion collapsing, and async dispatch mutations.

4. **Composable Stage Subcomponents (`subcomponents/`)**:
   - `BidActionInspectorHeader.tsx`: Exit anchors, lot identifiers, preview trigger, and reset CTA.
   - `CommercialStatCards.tsx`: Centralized 4-metric grid (Buyer Org, Unit Offer, Volume Requested, Gross Recovery).
   - `ModeNavigationTabs.tsx`: Mode tab bar with badge counts and disabled state guards.
   - `StateAwareBanners.tsx`: Lifecycle state feedback, decline summaries, and in-situ toast notices.
   - `EmailPreviewDialog.tsx`: Modal popover rendering hydrated outbound HTML.
   - `stages/AcceptOfferStage.tsx`: Step 1 logistics card, Step 2 TipTap communication, Step 3 sticky settlement execution bar.
   - `stages/NegotiateCounterStage.tsx`: Step 1 counter parameters card, Step 2 communication card, Step 3 sticky counter summary bar.
   - `stages/DeclineOfferStage.tsx`: Step 1 rejection specification card, Step 2 communication card, Step 3 sticky decline action footer.
   - `stages/TimelineAuditStage.tsx`: Centralized timeline audit trail with controls and activity feed.

5. **Slim Orchestrator Shell (< 250 lines)**:
   - `BidActionInspectorModal.tsx`: Thin coordinator consuming `useBidActionInspector` and wiring subcomponents.
   - Re-exported via `src/components/BidActionInspectorModal.tsx` to maintain 100% backward compatibility with `LotOperationsHubView.tsx` and existing tests.

---

## 3. Consequences

### Positive
- Component code reduced from 3,047 lines in a single file to a high-cohesion orchestrator under 150 lines.
- Headless business logic, calculations, and templates are isolated and easily testable in isolation.
- Zero regressions: 100% backward compatibility for existing test suite and imports.
- Reusable constants and types can be shared across other liquidation views.

### Negative / Trade-offs
- Multiple files created across `domain/bid-action-inspector/`; managed via standard directory conventions and barrel exports in `index.ts`.
