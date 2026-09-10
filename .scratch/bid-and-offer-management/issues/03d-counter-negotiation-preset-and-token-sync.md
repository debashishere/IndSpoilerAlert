# 03D — Counter Negotiation Email Preset & Live-Evaluating Token Badge Sync

**What to build:** 
Automatically pre-populate the TipTap editor canvas in Counter mode with the standard Counter Negotiation email preset. The template includes dynamic merge tokens: `{{buyer_name}}`, `{{product_name}}`, `{{counter_price}}`, `{{counter_quantity}}`, and `{{original_price}}`. Implement Live-Evaluating Token Badges: as the supplier types into the Counter Price or Counter Quantity inputs in the left pane, the token pills inside the TipTap canvas dynamically update their displayed values (e.g., displaying `[$14.50/cs]` and `[150 cases]`) without re-rendering the full document or overwriting custom text and formatting added by the supplier.

**Blocked by:** 03C — Embedded TipTap Rich-Text Editor Canvas & Formatting Toolbar

**Status:** done

- [x] When switching to `[⇄ Re-negotiate / Counter]` mode, auto-populates the TipTap editor with the standard Counter Negotiation email preset if no draft exists.
- [x] Email preset contains dynamic token pills for `buyer_name`, `product_name`, `counter_price`, `counter_quantity`, and `original_price`.
- [x] Implements Live-Evaluating Token Badges: changing Counter Price or Counter Quantity in the left column updates the badge display text in real-time inside the TipTap editor canvas.
- [x] Updating inputs does NOT reset or overwrite custom sentences, reworded clauses, or formatting introduced by the supplier in the editor canvas.
- [x] Preserves underlying `data-token` attributes on the token badge elements so template compilation remains consistent.
- [x] Includes unit/component tests verifying initial template loading, live token text reactivity, and non-destructive custom text preservation.
