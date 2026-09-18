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
