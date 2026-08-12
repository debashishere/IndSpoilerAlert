# Domain Glossary & Model

## Email Builder Engine

- **Workflow Email Editor**: The integrated email editing component inside `WorkflowEmailBuilder.tsx` where users configure workflow stage metadata (Template, Subject, From Email, Signature) and directly edit the email body via the embedded TipTap editor.
- **Prebuilt Email Template**: A re-usable email template preset containing pre-formatted layout HTML and dynamic merge tokens. When selected from the Template dropdown, its content populates the TipTap editor for live inline editing, modification, saving back, or applying directly to the workflow step.
- **TipTap Custom Toolbar**: The rich formatting toolbar positioned above the TipTap editor canvas. It includes:
  - **Font Family Dropdown**: Allows picking fonts (e.g. Verdana, Inter, Arial, Georgia, Monospace).
  - **Text Size Dropdown**: Select font size in points (e.g., 9pt, 11pt, 12pt, 14pt, 18pt, 24pt, 36pt).
  - **Named Formats Dropdown**: Allows switching block types (Paragraph, Heading 1, Heading 2, Heading 3, Blockquote, Code Block).
  - **Tags / Dynamic Tokens Dropdown**: Enables inserting workflow merge fields directly at the cursor position.
  - **Alignment Controls**: Align text left, center, right, or justify.
  - **Link & Image Modals**: Small dedicated icons to insert/edit hyperlink attributes and image source URLs.
  - **Color Pickers**: Foreground text color and background highlight color.
- **Local File & Drag-and-Drop Image Insertion**: Users can click the Image icon to upload local image files or drag-and-drop images directly into the TipTap canvas. Uploaded images are stored as Base64/Object Data URLs within the template body.
- **Interactive Token Badges**: Dynamic merge tags inserted into TipTap render as atomic inline badge nodes, protecting them from syntax corruption while allowing easy deletion or re-positioning.
- **Template Load Confirmation**: Loading a prebuilt template into an editor with unsaved body modifications triggers a confirmation prompt to prevent accidental data loss.
- **Scoped Integration**: The TipTap editor is focused specifically on replacing the body area within `WorkflowEmailBuilder.tsx` and connecting with prebuilt template loading/updating/saving.

## Emails Hub

- **Emails Hub**: The top-level navigation section (formerly labelled "Inbox") that houses all email-related functionality for a supplier. Routed by `activeTab === 'inbox'` and rendered by `EmailsHubView`.
- **Inbox Sub-Tab**: The default active sub-tab inside the Emails Hub. Renders the full supplier–buyer thread workspace (`EmailCommunicationsView`) with no behavioural changes from the pre-hub experience.
- **Template Gallery**: The second sub-tab inside the Emails Hub reserved for browsing and managing reusable email templates. Currently shows a placeholder pending the Template Builder feature.
- **Template Editor**: The forthcoming editor surface inside the Template Gallery where suppliers will create and modify reusable email templates.
- **Email Template**: A reusable, pre-formatted email body (with optional merge tokens) that can be applied to outbound communications or workflow stages.

