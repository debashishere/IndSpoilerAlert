# Hierarchical Buyer Inspection and Detail Drawer Integration

## Context
The platform features an extensive `BuyerDetailDrawer` component supporting granular buyer configuration, tier reassignment, cold-chain compliance flags, and opt-in channel toggles. The new Ingestion Hub design introduces inline accordion rows for fast reading of buyer contacts, categories, and facilities.

## Decision
1. Row click on a buyer table entry expands or collapses the inline **Progressive Row Inspection Drawer**, presenting procurement contacts, authorized categories, logistics hub facilities, and immediate tender action triggers.
2. Inside the expanded drawer, an explicit **"Edit Buyer Profile"** action button bridges directly into the slide-over `BuyerDetailDrawer`.

## Rationale
This maintains parity with existing CRM capabilities without crowding the high-density table grid or sacrificing quick scanning ergonomics.
