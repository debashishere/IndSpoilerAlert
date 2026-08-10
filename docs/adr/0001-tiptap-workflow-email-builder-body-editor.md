# ADR 0001: Integrated TipTap Body Editor in Workflow Email Builder

## Context & Problem Statement
Currently, the Email Builder in `WorkflowEmailBuilder.tsx` used a passive HTML preview component without a direct body input field, relying only on dynamic token adjustments. Users need the ability to directly edit email body content, load prebuilt HTML templates into an rich text editor, update formatting, insert images/links, and apply or save the modified template to a workflow step.

## Decision
1. **Embedded TipTap Editor**: Replace the body preview area in `WorkflowEmailBuilder.tsx` with a fully interactive TipTap rich text editor engine (`@tiptap/react`).
2. **Custom Reference Toolbar**: Implement a rich formatting toolbar matching the reference workflow editor (`Automation-workflow-5.jpg`):
   - Font Family selector (`Verdana`, `Inter`, `Arial`, `Georgia`, `Monospace`).
   - Text Size selector (`9pt`, `11pt`, `12pt`, `14pt`, `18pt`, `24pt`, `36pt`).
   - Named Formats / Styles dropdown (`Paragraph`, `Heading 1-3`, `Blockquote`, `Code Block`).
   - Dynamic Tags / Tokens insertion.
   - List options (Bulleted List, Numbered List).
   - Text alignment (Left, Center, Right, Justify).
   - Link popover / modal to insert & edit hyperlinks.
   - Image icon supporting local file upload and drag-and-drop (Base64 encoding).
   - Foreground Text Color and Background Highlight Color pickers.
3. **Template Loading & Protection**:
   - Selecting a prebuilt template populates TipTap.
   - Confirmation prompts prevent overwriting unsaved body edits when changing templates.
   - Dynamic tokens insert as protected visual badge nodes.

## Consequences
- Users gain full WYSIWYG editing capabilities directly inside workflow stage configuration.
- Prebuilt templates can be loaded, modified, and saved seamlessly.
- Local image uploads and formatting options are fully supported without external backend dependency.
