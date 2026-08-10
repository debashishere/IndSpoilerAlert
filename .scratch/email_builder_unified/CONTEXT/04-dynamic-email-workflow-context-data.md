# 04 — Dynamic Email Workflow Context Data Specifications

## Overview
Defines how live workflow state (inventory lots, category filters, matched cases, pricing discounts) is dynamically calculated, injected into email templates, overridden, and synchronized in real time.

## Key Specifications & Features

### 1. Dynamic Workflow Context Computation & Fallbacks
- Context calculations compute:
  - `matchedLots`: Active inventory lots passing campaign criteria.
  - `totalCases`: Sum of cases available across matched lots.
  - `lotTitleSummary`: Multi-lot summary string (e.g. `"Organic Dairy & Beverage Clearance Pack (3 Lots, 4,200 Cases)"`).
  - `inventoryTableHtml`: Rendered HTML table of matched lot items.
- *Fallback Handling:* If 0 lots are matched, renders a clear placeholder message: `"No active inventory lots selected in current workflow filter."`

### 2. Itemized Inventory Table & Multi-Lot Title Generation
- `buildInventoryTableHtml(lots)` constructs email-safe HTML `<table>` elements with columns for SKU, Description, Cases, and Expiry.
- Multi-lot title algorithm formats single lot titles or groups multiple lots into a clean headline for the email subject line and header component.

### 3. Live Workflow Autosync Overrides & Reset
- In Step 3 of Workflow Email Builder:
  - Users can manually override specific context variables for preview (e.g., custom Subject override, custom Markdown discount rate override).
  - Clicking **Reset to Workflow Defaults** clears manual overrides and re-computes variables from upstream studio state.
