# ADR 0037: Stitch Bid Action Inspector Communication & Data Hierarchy

- **Status**: Approved
- **Date**: 2026-09-18
- **Authors**: Antigravity AI & SpoilerAlert Engineering Team
- **Deciders**: Lead Architect, Full-Stack Engineers

---

## 1. Context & Problem Statement

The **Bid Action Inspector** is the central supplier operational workspace for actioning inbound buyer offers on distressed inventory lots. The existing modal provided a 3-tab layout (`Accept Offer`, `Re-negotiate / Counter`, `Decline Offer`) with inline negotiation messaging and split two-column panes.

To advance the institutional trading desk UX, Google Stitch produced a revised design: **Bid Action Inspector - Communication & Data Hierarchy** (`projects/8026610550472801794/screens/39f8fd77c0f24f98953898f4756f30b0`).

The Stitch specification introduces:
1. **Four-Column Key Metrics Stat Cards**: Instant visual scan of Buyer Organization, Unit Offer (dual settled/initial comparison), Volume Requested (% of lot & full clearing indicators), and Gross Recovery (net clearing).
2. **Four-Tab Navigation Structure**:
   - `Accept Offer`: Logistics & allocation parameters (DC address with FOB tag, dock hours, allocation stepper) with integrated acceptance email builder and settlement calculation bar.
   - `Negotiate`: Live counter-offer parameters (stepper, margin uplift badge, holding window, reserve floor indicator), counter negotiation email composer, and summary dispatch bar.
   - `Decline`: Mandatory decline codes, internal audit notes, inventory return toggle, decline email composer, and escrow release notice.
   - `Timeline`: Dedicated audit trail and chronological activity stream with event filters (`All`, `Negotiations`, `System Notes`, `Status Transitions`) and text search.
3. **Multi-Channel Communication Architecture**: Channel selector pills (`Email`, `In-App`, `SMS`) with `Email` as primary, TipTap dynamic token evaluation, and accordion collapse/expand.
4. **Outbound Email Preview Modal**: Instant pop-up preview rendering recipient-facing HTML with resolved token values before dispatch.

---

## 2. Decisions & Architectural Specifications

### 2.1 In-Place Upgrade with Contract Compatibility
- `BidActionInspectorModal.tsx` is updated in place, retaining existing callback signatures (`onAccept`, `onCounter`, `onDecline`, `onReset`, `onResendSettlement`) and test IDs (`counter-split-work-surface`, `counter-left-pane`, `counter-right-pane`, etc.).
- Props remain fully typed in TypeScript and backward compatible with `LotOperationsHubView.tsx`.

### 2.2 Four-Tab Architecture & Dedicated Timeline
- Tab keys: `'accept' | 'counter' | 'decline' | 'timeline'`.
- Negotiation history is consolidated in the dedicated `Timeline` tab which renders the complete chronological audit trail, categorized by event type (`negotiations`, `system`, `status`) with interactive filtering and search, keeping action tabs focused on configuration parameters and outbound communication.

### 2.3 Channel Selector Strategy
- Channel selector options (`Email`, `In-App`, `SMS`) are presented in the Communication card.
- `Email` is fully active and wired to `WorkflowTipTapBodyEditor` with dynamic tokens.
- `In-App` and `SMS` act as staged communication modes with intuitive notifications and future extensibility hooks.

### 2.4 Outbound Email Preview Dialog
- Both header and footer actions trigger `isOpenEmailPreview: boolean` modal rendering rendered HTML with dynamic tokens replaced by current contextual values.

### 2.5 State-Aware Banners for Decided Bids
- For bids already `'accepted'` or `'declined'`, state-aware notification banners are displayed at the top of the modal with post-settlement actions (`Resend Settlement Email`, `Open Deal Settlement Portal`) and adaptive override (`Re-open & Re-negotiate Terms`). All tabs remain browsable for audit.

---

## 3. Consequences

### Positive
- Elevated institutional look and feel matching Stitch design specifications.
- Clear separation between counter actions and deep chronological audit logs.
- Immediate transparency of outbound communications with Email Preview.
- 100% backward compatibility with existing tests and `LotOperationsHubView`.

### Negative / Trade-offs
- Slight increase in modal component DOM size due to dedicated Timeline tab and Preview Modal; mitigated by modular component decomposition and clean React state handling.

---

## 4. Architectural Amendment: Full-Screen Workspace & Sequential Single-Column Flow

- **Amendment Date**: 2026-09-18
- **Status**: Approved & Implemented

### 4.1 Full-Screen Operational Workspace Shell & Maximize Elimination
- **Context**: The previous floating window overlay with maximize/minimize toggle caused UI crampedness across rich institutional actions (steppers, dynamic TipTap editors, preview modals).
- **Decision**: Promoted the Bid Action Inspector to a permanent, viewport-filling full-screen operational workspace (`w-screen h-screen`, `fixed inset-0`, `rounded-none`, `z-[1050]`).
- **Maximize Button Removal**: The maximize/minimize toggle button (`maximize-modal-btn`) has been permanently eliminated. Escape key or explicit exit anchors (`back-to-bids-btn` and `close-workspace-btn`) gracefully dismiss the full-screen workspace session.

### 4.2 Centralized Layout Architecture (`max-w-[1100px] mx-auto`)
- **Key Metrics Stat Cards**: Centralized in a responsive 4-column grid constrained to `max-w-[1100px] mx-auto w-full`.
- **Mode Navigation Tabs**: The 4 navigation tabs (`Accept Offer`, `Negotiate`, `Decline Offer`, `Timeline`) are horizontally centered within `max-w-[1100px] mx-auto`.
- **Content Workspace Body**: The tab content body (`centralized-workspace-body`) is strictly constrained to `max-w-[1100px] mx-auto w-full`, standardizing eye tracking and typography reading line lengths.

### 4.3 Sequential Single-Column Vertical Flow
The legacy side-by-side two-column split layouts (`left-pane` and `right-pane` side-by-side) across action tabs have been refactored into a clear, top-down sequential dependency hierarchy:
1. **Accept Offer Tab**:
   - **Step 1 (Configuration)**: Logistics & Allocation Card (`accept-left-pane`, `accept-logistics-card`) with full-width sequential rows for DC Address (`logistics-row-address`), Operating Hours (`logistics-row-hours`), Awarded Quantity stepper (`logistics-row-quantity`), and Settled Price stepper (`logistics-row-price`).
   - **Step 2 (Communication)**: Multi-channel Communication Card (`accept-right-pane`, `accept-communication-card`) with full-width TipTap Email Builder, channel pills (`Email`, `In-App`, `SMS`), token badges, and accordion controls.
   - **Step 3 (Settlement Execution)**: Docks stickily at the viewport bottom (`accept-execution-bar`, `sticky bottom-0 z-20 backdrop-blur`) aligned with the 1100px container, keeping recovery calculations and primary Confirm Offer CTA continuously accessible.
2. **Negotiate / Counter Tab**:
   - **Step 1 (Parameters)**: Counter-Offer Parameters Card (`counter-left-pane`, `negotiate-parameters-card`) with full-width sequential rows for Counter Price (`counter-row-price`), Counter Volume (`counter-row-volume`), Holding Window (`counter-row-holding`), and Reserve Floor (`counter-row-reserve`), displaying margin uplift badges and delta variance indicators.
   - **Step 2 (Communication)**: Multi-channel Communication Card (`counter-right-pane`, `counter-communication-card`) with full-width TipTap editor with dynamic token hydration and sync.
   - **Step 3 (Dispatch Summary)**: Docks stickily at viewport bottom (`counter-summary-bar`, `sticky bottom-0 z-20 backdrop-blur`), providing live counter total recovery, baseline delta indicators, and Send Counter-Offer CTA.
3. **Decline Offer Tab**:
   - **Step 1 (Specification)**: Decline Specification Card (`decline-left-pane`, `decline-specification-card`) with full-width sequential rows for Mandatory Reason (`decline-row-reason`), Internal Audit Memo (`decline-row-memo`), and Inventory Relist toggle (`decline-row-relist`).
   - **Step 2 (Communication)**: Multi-channel Communication Card (`decline-right-pane`, `decline-communication-card`) with full-width rejection notice editor and token synchronization.
   - **Step 3 (Action Footer)**: Docks stickily at viewport bottom (`decline-action-footer`, `sticky bottom-0 z-20 backdrop-blur`), rendering escrow deposit release indicators, auto-relist telemetry, and Confirm Decline CTA.
4. **Timeline Audit Trail Tab**:
   - Centralized within `timeline-audit-surface` (`max-w-[1100px] mx-auto w-full`), rendering the controls bar (`timeline-controls-bar`), category filter (`timeline-category-filter`), search bar (`timeline-search-input`), and chronological activity feed (`timeline-activity-feed`) with consistent card aesthetics.

### 4.4 Outbound Email Preview Dialog Integration
- Outbound Email Preview modal dialog (`email-preview-dialog`) functions seamlessly within the full-screen layout.
- Accessible via header preview button or sticky footers across all modes.
- Hydrates all dynamic tokens into authentic commercial values before dispatch, and dismisses cleanly without closing the full-screen inspector session.

