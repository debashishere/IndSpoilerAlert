# 03B — Split 2-Column Work Surface with Delta Indicators & In-Situ Continuity

**What to build:** 
Restructure `[⇄ Re-negotiate / Counter]` mode inside `BidActionInspectorModal` into a Split 2-Column Work Surface. The left pane (~38% width) houses Counter Price ($/cs) and Counter Quantity (cases) inputs with dynamic delta indicators (absolute and percentage difference compared to the buyer's original offer), stacked on top of the scrollable Negotiation History Thread. The right pane (~62% width) provides the outbound communication staging area with the "Dispatch Counter-Offer" button. Enforces In-Situ Negotiation Continuity: when counter dispatch succeeds, the inspector remains open, its status badge updates to `Countered`, the new supplier proposal is immediately appended to the visible negotiation thread, a success toast confirms dispatch, and the parent bids table in `LotOperationsHubView` is refreshed in the background.

**Blocked by:** 03A — Backend Re-negotiate State Machine & Negotiation History Thread

**Status:** completed

- [x] In `[⇄ Re-negotiate / Counter]` mode, renders a Split 2-Column Work Surface layout (left ~38%, right ~62%).
- [x] Left column provides numeric inputs for Counter Price ($/cs) and Counter Quantity (cases) with live validation (non-empty, positive values).
- [x] Displays live delta indicators below the inputs showing unit price delta ($ and %) and total recovery delta compared to the buyer's original bid.
- [x] Left column embeds the scrollable, chronological Negotiation History Thread directly beneath the counter parameters.
- [x] Right column hosts the outbound message composition area and the primary "Dispatch Counter-Offer" action button.
- [x] Enforces In-Situ Negotiation Continuity: upon clicking "Dispatch Counter-Offer", executes the counter request, keeps the modal open, updates the header status badge to `Countered`, appends the newly sent proposal to the visible thread, and emits a success toast.
- [x] Automatically notifies and refreshes the parent bids list in `LotOperationsHubView`.
- [x] Includes component tests verifying split layout rendering, delta calculations, form validation, and in-situ session preservation.

