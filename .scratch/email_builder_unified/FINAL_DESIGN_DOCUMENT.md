# Email Builder Subsystem — Master Final Design Document

> **Document Version:** 1.0.0  
> **Status:** Approved / Current State Reference  
> **Location:** `/Users/debashisroy/Documents/SpoilerAlert/.scratch/email_builder_unified/FINAL_DESIGN_DOCUMENT.md`  
> **Target Audience:** Engineering, Product, and Design teams extending or updating the Email Builder flow.

---

## 1. Executive Summary & System Purpose

The **Email Builder Subsystem** in the IndSpoiler Alert Surplus Inventory Platform provides a B2B offer sheet authoring, rendering, and dispatch engine. It enables food manufacturers (suppliers) to build responsive, email-client-safe B2B liquidation offer emails that contain dynamic inventory lot data (`{{inventory_table}}`), personalized buyer account tokens (`{{buyer_name}}`), quick-action bid URLs (`{{quick_bid_link}}`), and promotional copy.

### Primary Goals Achieved
1. **Dual Execution Contexts:** Supports both standalone template authoring (`TipTapTemplateEditor.tsx`) and automated stage-gate workflow campaign creation (`WorkflowEmailBuilder.tsx` / `LiquidationAutomationStudio.tsx`).
2. **Dynamic UI Component Pills:** Replaces raw syntax text (`{{buyer_name}}`, `{{inventory_table}}`) with interactive, uneditable visual UI pill badges in the WYSIWYG editor canvas while preserving dynamic compilation semantics.
3. **Email Client Compatibility:** Bypasses Outlook/Gmail rendering issues by flattening modern DOM structures (`<figure>`, `<figcaption>`), inlining CSS declarations, and generating standard XHTML 1.0 Transitional markup with 600px desktop / 360px mobile viewports.
4. **Safety & Invariants:** Enforces OAuth Mailbox authentication gates, overwrite safeguards when loading built-in presets, and zero-buyer dispatch guardrails.

---

## 2. Core Architectural System Map

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                FRONTEND APPLICATION                                    │
│                                                                                         │
│  ┌─────────────────────────────────┐           ┌─────────────────────────────────────┐  │
│  │     TipTapTemplateEditor        │           │        WorkflowEmailBuilder         │  │
│  │ ─── WYSIWYG Editor Core ─────── │           │ ─── 3-Step Accordion Stepper ────── │  │
│  │  • TipTap Engine + Extensions   │           │  • Step 1: Template Selection       │  │
│  │  • UI Token Pills (renderPill)  │           │  • Step 2: Subject & Metadata       │  │
│  │  • Visual / Code View Switcher  │           │  • Step 3: Overrides & Live Preview │  │
│  └────────────────┬────────────────┘           └──────────────────┬──────────────────┘  │
│                   │                                               │                     │
│                   ▼                                               ▼                     │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        emailHtmlTransformer & LiveDevicePreview                   │  │
│  │  • Flatten <figure>/<figcaption>  • Inline Heading & Table Styles • 600px Container │  │
│  └────────────────────────────────────────┬──────────────────────────────────────────┘  │
└───────────────────────────────────────────┼─────────────────────────────────────────────┘
                                            │ HTTP REST / JSON
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                BACKEND SERVICES & APIS                                  │
│                                                                                         │
│  ┌───────────────────────────────────┐        ┌──────────────────────────────────────┐  │
│  │      emailTemplateController      │        │       email_compiler.ts              │  │
│  │ ─── API Routes (/api/email-t... ) │        │ ─── Runtime Token Compiler ───────── │  │
│  │  • GET/POST/PUT/DELETE Templates  │        │  • Handlebars Dynamic Injection      │  │
│  │  • Seed Presets Endpoint          │        │  • Juice CSS Inliner Pipeline        │  │
│  └────────────────┬──────────────────┘        └──────────────────┬───────────────────┘  │
│                   │                                              │                      │
│                   ▼                                              ▼                      │
│  ┌───────────────────────────────────┐        ┌──────────────────────────────────────┐  │
│  │      MongoDB EmailTemplate        │        │        EmailDispatchLog              │  │
│  └───────────────────────────────────┘        └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Data Schemas & Models

### 3.1 Backend Mongoose Model (`backend/src/models/EmailTemplate.ts`)
```typescript
export interface IEmailTemplate extends Document {
  supplierId: mongoose.Types.ObjectId;
  templateId: string; // e.g. "b2b-offer-sheet"
  name: string;
  subject: string;
  bodyHtml: string;
  category: 'clearance' | 'auction' | 'award' | 'general';
  availableTokens: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Frontend Email Template Data Interface (`frontend/src/components/TipTapTemplateEditor.tsx`)
```typescript
export interface EmailTemplateData {
  _id?: string;
  templateId: string;
  name: string;
  subject: string;
  bodyHtml: string;
  category: 'clearance' | 'auction' | 'award' | 'general';
  availableTokens?: string[];
  isDefault?: boolean;
}
```

### 3.3 Workflow Metadata Contract (`frontend/src/components/WorkflowEmailBuilder.tsx`)
```typescript
export interface WorkflowEmailMetadata {
  template: string;
  fromEmail: string;
  subject: string;
  signature: string;
}
```

---

## 4. WYSIWYG Editor Engine (`TipTapTemplateEditor.tsx`)

The visual editor core combines a contenteditable HTML canvas with live state synchronization, code mode editing, dynamic token injection, and template preset selection.

### Key Capabilities & Controls
1. **Editor Modes (`visual` vs `code`):** Allows switching between a rich-text visual WYSIWYG canvas and direct raw HTML source code editing (`<textarea>`).
2. **View Modes (`authoring` vs `preview`):** Allows toggling between live template editing and real-time email client rendering.
3. **Toolbar Action Controls:**
   - Text Formatting: Bold, Italic, Bullet List, Heading 2 (`<h2>`), Code Block, Link insertion.
   - Dynamic Component Quick-Inserts: `[ 🏷️ Insert Dynamic Header ]`, `[ 📊 Insert Dynamic Inventory Table ]`.
   - Token Info Inspector: `[ ℹ️ Info ]` button opens `activeTokenInfoModal`.

---

## 5. Dynamic Token Subsystem & UI Component Pills

### 5.1 Token Pill Rendering Engine
Raw token strings (`{{buyer_name}}`, `[inventory_table]`) are converted into uneditable UI pill elements for authoring, and converted back into raw tokens for storage and backend compilation.

```typescript
export function renderTokenPillHtml(token: string): string {
  if (token === 'inventory_table') {
    return `<div class="dynamic-token-pill" data-token="inventory_table" contenteditable="false" ...>📊 Dynamic Inventory Table (Workflow Data) ℹ️</div>`;
  } else if (token === 'header') {
    return `<div class="dynamic-token-pill" data-token="header" contenteditable="false" ...>🏷️ Dynamic Header Component ℹ️</div>`;
  } else {
    const label = token === 'buyer_name' ? 'Buyer Account Name'
      : token === 'supplier_name' ? 'Supplier Organization'
      : token === 'lot_title' ? 'Surplus Inventory Lot Title'
      : token === 'quick_bid_link' ? '1-Click Buyer Action Link'
      : `${token.replace(/_/g, ' ')} Component`;
    return `<span class="dynamic-token-pill" data-token="${token}" contenteditable="false" ...>${label} ℹ️</span>`;
  }
}

export function hydrateRawTokensInHtml(html: string): string {
  if (!html) return html;
  return html
    .replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, token) => renderTokenPillHtml(token))
    .replace(/\[([a-zA-Z0-9_]+)\]/g, (_match, token) => renderTokenPillHtml(token));
}
```

### 5.2 Token Inspector Modal (`activeTokenInfoModal`)
Clicking any UI token pill badge opens an interactive popover displaying:
- **Token Identifier & Name**
- **Purpose Description**
- **Injected Data Fields** (e.g. SKU, Description, Cases, Expiry)
- **Sample Runtime Value**

---

## 6. HTML Transformation & Compatibility Pipeline (`emailHtmlTransformer.ts`)

To ensure 100% rendering fidelity in strict email clients (Outlook Desktop, Gmail Web/Mobile, Apple Mail), the transformer executes the following transformation passes:

```
Raw Tiptap Output ──► 1. Flatten <figure>/<figcaption> ──► 2. Add Legacy Table Attributes
                                                                      │
XHTML 1.0 Output   ◄── 4. Wrap 600px Container ◄── 3. Inline Headings/TD ◄┘
```

1. **Node Flattening:** Converts `<figure>` to `<div style="text-align:center;">` and `<figcaption>` to `<p style="color:#6b7280; font-size:14px;">`.
2. **Legacy Table Attributes:** Injects `cellpadding="0"`, `cellspacing="0"`, `border="0"`, `width="100%"`, and `border-collapse: collapse`.
3. **Style Inlining:** Merges default heading (`<h1>`, `<h2>`, `<h3>`) and cell padding styles inline.
4. **Token Replacement:** Replaces token pills and placeholders with rendered itemized HTML tables.
5. **Outer Container Wrapper:** Encloses output in an email-safe XHTML 1.0 Transitional container.

---

## 7. Workflow & Stepper Integration

### 7.1 Progressive 3-Step Accordion Stepper (`LiquidationAutomationStudio.tsx`)
In campaign workflow creation, Section 4 uses a progressive 3-step accordion:
- **Step 1: Choose Email Template** (Select preset or custom template).
- **Step 2: Email Subject Line & Metadata** (Subject input, From address, Signature).
- **Step 3: Dynamic Data Context & Live Device Renderer** (Live inventory lot summary, target buyer inspection, responsive preview).

### 7.2 Shell Wrapper (`WorkflowEmailBuilder.tsx`)
Provides top breadcrumb navigation (`Campaigns > Liquidation Workflow > Email Template`), action buttons (`< Tags` drawer toggle, `Back`, `Save as Draft`, `Next`), and slide-out `TagsDrawer.tsx`.

---

## 8. Template Presets & Overwrite Safeguards

### 8.1 B2B Preset Library (`frontend/src/utils/b2bTemplatePresets.ts`)
- `b2b-offer-sheet`: Complete B2B Inventory Offer Sheet layout.
- `short-dated-flash`: Short-Dated Flash Sale urgency layout.
- `bulk-clearance`: Bulk Clearance Announcement layout.
- `blank-slate`: Minimal starter layout.

### 8.2 Overwrite Safeguard Protocol
Selecting a new template preset while the canvas contains active user text triggers an overwrite modal:
- **Modal Title:** `"Overwrite Current Template?"`
- **Warning Message:** Replaces current content with preset defaults.
- **User Actions:** `Cancel` (reverts selector) or `Confirm & Overwrite` (replaces canvas HTML).

---

## 9. Live Device Preview & Viewport Switching (`LiveDevicePreview.tsx`)

Renders the compiled output inside a responsive device container with viewport controls:
- **Desktop Mode:** Fixed 600px width container mimicking desktop email clients.
- **Mobile Mode:** Fixed 360px width container mimicking smartphone screens.
- **Lot Data Selector:** Allows selecting different active inventory lots to verify real-time data binding.

---

## 10. OAuth Mailbox Authentication Invariants & Soft Locks

1. **Campaign Studio Entry Invariant (Hard Gate):** A supplier MUST have an active OAuth mailbox connection before entering the Campaign Studio. If unauthenticated, `MailboxConnectionCanvas.tsx` is displayed instead.
2. **Mailbox Authentication Soft Lock:** If an OAuth token expires, campaign editing remains accessible in read-only mode, but launch and dispatch capabilities are disabled until re-authenticated.
3. **Zero-Buyer Guardrail:** Stages targeting 0 buyers display warning banners and disable execution to prevent empty dispatches.

---

## 11. Test Coverage & Verification Matrix

The Email Builder subsystem is thoroughly tested across frontend unit, integration, and backend compiler suites:

| Test File Path | Primary Functionality Tested |
| :--- | :--- |
| `frontend/src/test/TipTapWysiwygTemplateEditor.test.tsx` | TipTap visual editor, token pill hydration, preview switching. |
| `frontend/src/test/BodyEditorTypingAndCodeMode.test.tsx` | Visual vs Code mode switching and raw HTML synchronization. |
| `frontend/src/test/emailHtmlTransformer.test.ts` | Transformer node flattening, inline style merging, XHTML wrapping. |
| `frontend/src/test/TemplatePickerAndOverwriteModal.test.tsx` | Preset dropdown selection and overwrite confirmation modal. |
| `frontend/src/test/WorkflowEmailBuilder.test.tsx` | Shell navigation, metadata state, slide-out tags drawer. |
| `frontend/src/test/LiveEmailClientPreviewTabs.test.tsx` | Responsive Desktop/Mobile viewport toggling and lot switching. |
| `frontend/src/test/WorkflowStageTemplateAttachmentZeroBuyerRestriction.test.tsx` | Zero-buyer stage restriction UI and warning banners. |
| `backend/src/tests/email_compiler.test.ts` | Backend Handlebars compilation, Juice inlining, token resolution. |

---

## 12. Design Extension & Refactoring Roadmap for Future Enhancements

This section outlines recommended architectural seams and guidelines for future development:

### 12.1 Drag-and-Drop Block Extension (Modular Block Builder)
- **Seam Location:** `frontend/src/components/EmailBuilder/EmailBuilderEngine.tsx`
- **Goal:** Extend current rich-text canvas into a modular block-based layout builder (Header Block, Text Block, Inventory Block, Hero Image Block, Button Block, Footer Block) with drag-and-drop handles.
- **Approach:** Wrap TipTap node extensions in custom React NodeViews with drag controls.

### 12.2 Enhanced Token System & Custom Expression Engine
- **Seam Location:** `frontend/src/components/TipTapTemplateEditor.tsx` & `backend/src/services/emailService.ts`
- **Goal:** Support conditional merge tags (e.g. `{{#if discount}}...{{/if}}`) and computed math fields (e.g. `{{savings_amount}}`).
- **Approach:** Extend Handlebars helper registry in `email_compiler.ts` and add token parameter controls to `activeTokenInfoModal`.

### 12.3 Real-Time Collaborative Editing & Version History
- **Seam Location:** `backend/src/models/EmailTemplate.ts` & `TipTapTemplateEditor.tsx`
- **Goal:** Track template revision history with restore capabilities and collaborative cursor locking.
- **Approach:** Add `revisions` array schema to `EmailTemplate` model and integrate Yjs / TipTap Collaboration extension.
