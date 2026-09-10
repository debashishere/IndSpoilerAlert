# 03C — Embedded TipTap Rich-Text Editor Canvas & Formatting Toolbar

**What to build:** 
Embed the full-featured `WorkflowTipTapBodyEditor` component directly into the right work pane of `BidActionInspectorModal` in `[⇄ Re-negotiate / Counter]` mode. Surfaces the complete TipTap custom formatting toolbar: Font Family picker, Text Size dropdown, Named Formats (Paragraph, H1-H3, Blockquote), text alignment controls, hyperlink insertion modal, image insertion modal/drag-and-drop, and dynamic token tags selector. Adapts the editor canvas styling, min-height, and scroll behaviors to fit seamlessly within the modal container while supporting disabled states during API submission.

**Blocked by:** 03B — Split 2-Column Work Surface with Delta Indicators & In-Situ Continuity

**Status:** done

- [x] Embeds `WorkflowTipTapBodyEditor` inside the right pane of `BidActionInspectorModal` in Counter mode, replacing the plain textarea.
- [x] Active TipTap custom toolbar includes Font Family dropdown (Verdana, Inter, Arial, etc.), Text Size dropdown (9pt to 36pt), and Named Formats (Paragraph, Heading 1–3, Blockquote).
- [x] Active TipTap custom toolbar includes Text Alignments (left, center, right, justify) and color pickers.
- [x] Hyperlink and Image insertion modals are accessible and functional from the toolbar.
- [x] Dynamic tokens dropdown button is wired to present available negotiation merge tags (`buyer_name`, `product_name`, `counter_price`, `counter_quantity`, `original_price`).
- [x] Editor respects the `isSubmitting` disabled state, preventing modifications while a dispatch is in-flight.
- [x] Includes component tests verifying toolbar interaction, formatting toggles, token tag insertion, and HTML output propagation.
