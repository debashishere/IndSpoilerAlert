# 01 — Body Section Editor Specifications & Features

## Overview
The **Body Section Editor** is a rich-text Tiptap-powered core workspace within the React Email Builder Engine where suppliers type free-form email text or load pre-designed HTML templates with confirmation safeguards against overwriting active drafts.

## Key Sub-Modules & Capabilities

### 1. Email HTML Transformer Engine (`emailHtmlTransformer.ts`)
- Converts Tiptap-generated modern HTML (`<figure>`, `<figcaption>`, CSS classes) into email-client-safe HTML (table-based layouts, inline styles, legacy HTML attributes).
- Replaces dynamic token markers (`{{inventory_table}}`, `[inventory_table]`, UI token pills) with live rendered itemized table HTML.
- Inlines styles for headings (`<h1>`, `<h2>`, `<h3>`), paragraphs, tables (`cellpadding="0"`, `cellspacing="0"`, `border="0"`).
- Wraps output in a responsive 600px XHTML 1.0 Transitional wrapper.

### 2. Built-in B2B Template Presets (`b2bTemplatePresets.ts`)
Four curated B2B email layout presets:
1. **B2B Inventory Offer Sheet** (`b2b-offer-sheet`): Full itemized surplus inventory table with call to action.
2. **Short-Dated Flash Sale** (`short-dated-flash`): High-urgency clearance layout emphasizing remaining shelf life (RSL).
3. **Bulk Clearance Announcement** (`bulk-clearance`): Pallet & truckload volume discount messaging.
4. **Blank Slate** (`blank-slate`): Minimal starter layout with standard buyer merge tokens.

### 3. Template Picker & Overwrite Safeguard Modal
- Provides a dropdown selector for template presets.
- If the editor contains non-empty user edits, selecting a new preset triggers a confirmation modal:
  - *Title:* "Overwrite Current Template?"
  - *Description:* Warns that loading the new preset will discard un-saved changes.
  - *Actions:* `Cancel` (reverts selection) or `Confirm & Overwrite` (applies preset HTML).

### 4. Live Email Client Preview & Viewport Toggles
- Renders real-time compiled HTML inside a iframe/container frame.
- Viewport toggles: Desktop (600px width) and Mobile (360px width).
- Injects sample lot data and sample buyer account information to show exact rendered output before dispatch.
