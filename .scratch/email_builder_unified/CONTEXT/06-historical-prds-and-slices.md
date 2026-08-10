# 06 — Historical PRDs & Vertical Slices Matrix

## Overview
A historical inventory of all PRDs and vertical slice specifications from `issues/` related to the Email Builder subsystem.

## Historical Documents Summary

| Issue File | Document Title | Primary Objectives & Requirements |
| :--- | :--- | :--- |
| `0045-slice-3-react-email-6-builder-wysiwyg-preview.md` | React Email 6 Builder & WYSIWYG Preview | Code-first modular block toolkit, token injector pills, dual block edit / live device preview modes. |
| `0047-prd-saved-campaigns-and-react-email-builder.md` | Saved Campaigns & React Email Builder PRD | Campaign lifecycle state management (`Draft`, `Active`, `Stopped`, `Completed`), offer sheet builder. |
| `0066-slice-2-email-open-telemetry-pixel-and-dispatches-log.md` | Email Open Telemetry Pixel & Log | Tracking 1x1 GIF open pixels, log dispatches in `EmailDispatchLog`. |
| `0067-slice-3-dynamic-server-rendered-email-assets.md` | Dynamic Server-Rendered Email Assets | Dynamic image generation for email header banners and barcode badges. |
| `0070-prd-supplier-smtp-email-communication-hub-and-telemetry.md` | Supplier SMTP & Communication Hub PRD | Supplier SMTP credentials, open/click telemetry, listing-scoped email hubs. |
| `0076-slice-1-emailtemplate-schema-api-and-defaults.md` | EmailTemplate Schema & API | Mongoose schema, seed defaults, backend CRUD endpoints. |
| `0077-slice-2-handlebars-token-compiler-and-juice-inliner.md` | Handlebars Token Compiler & Juice Inliner | Handlebars engine for token replacement, Juice CSS inliner for Outlook HTML compatibility. |
| `0078-slice-3-tiptap-wysiwyg-template-editor.md` | TipTap WYSIWYG Template Editor | TipTap rich-text editor integration, custom extensions (`Figure`, `InventoryTableToken`). |
| `0080-slice-5-adhoc-broadcast-dispatcher-and-cta-token-engine.md` | Ad-Hoc Broadcast Dispatcher & CTA Token Engine | One-click dispatch, signed quick-bid token generation. |
| `0081-prd-send-email-section-and-campaign-workspace.md` | Send Email Section & Campaign Workspace PRD | Ad-hoc broadcast view (`SendBroadcastView.tsx`), audience targeting. |
| `0089-prd-workflow-email-builder-redesign.md` | Workflow Email Builder Redesign PRD | Workflow Email Builder shell layout (`WorkflowEmailBuilder.tsx`). |
| `0090-slice-1-core-shell-and-light-theme-layout.md` | Core Shell & Light Theme Layout | Container styling, light mode tokens, responsive padding. |
| `0091-slice-2-stage-stepper-sidebar.md` | Stage Stepper Sidebar | Stepper breadcrumbs and stage navigation. |
| `0092-slice-3-email-metadata-form-and-tags-drawer.md` | Email Metadata Form & Tags Drawer | Metadata input fields (`EmailMetadataForm.tsx`) and slide-out token drawer (`TagsDrawer.tsx`). |
| `0093-slice-4-rich-text-editor-canvas-and-studio-integration.md` | Rich Text Editor Canvas & Studio Integration | Connecting `TipTapTemplateEditor.tsx` inside `LiquidationAutomationStudio.tsx`. |
