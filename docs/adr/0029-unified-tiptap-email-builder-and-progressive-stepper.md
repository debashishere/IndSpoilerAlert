# 0029: Unified TipTap Email Builder Engine & Progressive 3-Step Stepper Architecture

Date: 2026-08-08

## Status
Accepted / Implemented

## Context
As the IndSpoiler Alert Surplus Inventory Platform evolved, email template creation existed in fragmented forms across standalone template management and workflow stage-gate campaign creation. Previous iterations relied on raw Handlebars text syntax (`{{buyer_name}}`, `{{inventory_table}}`) that was prone to syntax errors by sales representatives. Additionally, modern HTML outputs from rich-text editors often failed to render predictably across legacy email clients (Outlook Desktop).

## Decision

1. **Unified TipTap Visual WYSIWYG Engine**:
   - Standardize on `TipTapTemplateEditor.tsx` as the core visual editor across both standalone template management and workflow campaign creation.
   - Render dynamic merge tokens (`{{buyer_name}}`, `{{inventory_table}}`, `{{quick_bid_link}}`, `{{header}}`) as uneditable, interactive **UI Component Pills** in the editor canvas while preserving underlying data binding syntax.
   - Provide visual vs. raw HTML code mode switching (`visual` vs `code`).

2. **Email HTML Compatibility Transformation Pipeline (`emailHtmlTransformer.ts`)**:
   - Implement an automated post-processing pipeline that flattens modern DOM nodes (`<figure>` $\rightarrow$ `<div>`, `<figcaption>` $\rightarrow$ `<p>`).
   - Inject legacy table attributes (`cellpadding="0"`, `cellspacing="0"`, `border="0"`, `width="100%"`) and inline styles for headers and table cells.
   - Wrap compiled output in an email-client-safe 600px / 360px XHTML 1.0 Transitional wrapper.

3. **Progressive 3-Step Accordion Stepper**:
   - Structurally group Section 4 of `LiquidationAutomationStudio.tsx` into a progressive 3-step accordion:
     - **Step 1: Choose Email Template** (Dropdown template selection).
     - **Step 2: Email Subject Line & Metadata** (Subject input, From address, Signature).
     - **Step 3: Dynamic Data Context & Live Device Renderer** (Real-time data overrides, responsive Desktop/Mobile `LiveDevicePreview`).
   - Expose header navigation pills with `✓ Completed` status indicators to permit backward editing without losing downstream state.

4. **Presets & Safeguards**:
   - Provide 4 built-in B2B template presets (`b2b-offer-sheet`, `short-dated-flash`, `bulk-clearance`, `blank-slate`).
   - Enforce an Overwrite Safeguard Modal when selecting presets over non-empty editor content.
   - Enforce Zero-Buyer guardrails and OAuth Mailbox Hard Gates before dispatch.

## Consequences

- **Positive**: Eliminates syntax errors by converting merge tokens into visual UI pills.
- **Positive**: Ensures 100% rendering fidelity across Outlook, Gmail, and Mobile clients via automated XHTML transformation.
- **Positive**: Provides a unified, single source of design truth documented in `.scratch/email_builder_unified/FINAL_DESIGN_DOCUMENT.md`.
- **Negative**: Requires maintaining DOM hydration and token transformation functions when adding new dynamic token types.
