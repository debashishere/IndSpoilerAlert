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
- **Google OAuth Mailbox**: The authenticated mail connection bound to a supplier ID, authorizing outbound email dispatch via Google's OAuth 2.0 API (`https://mail.google.com/` scope). Serves as the single unified transport engine for all outbound email types (campaign broadcasts, direct inbox thread replies, and automated workflow notifications) whenever connected. Tracks access/refresh tokens and connection status (`connected`, `expired`, `missing`).

## Authentication & User Identity

- **Disallowed Mock Email Domain**: Any email domain address matching mock/test domain patterns (such as `@example.com`, `@mock.com`, `@test.com`, `@invalid`, `@localhost`, or containing `mock` in the domain name). Email addresses matching these patterns are strictly prohibited from authenticating or registering on the platform.

## Stage-Gate Escalation Model

- **Stage Type**: The operational classification (`liquidation` | `donation` | `landfill`) determining a stage's audience targeting, pricing, timing constraints, and inventory allocation rules.
- **Liquidation Stage**: A commercial clearance stage targeting commercial buyers or liquidator tiers with algorithmic/fixed pricing discounts and response wait windows.
- **Donation Stage**: A non-commercial philanthropic stage targeting charitable and non-profit partners with customizable offer expiration windows and dedicated inventory allocations (omitting pricing and discount logic).
- **Landfill Stage**: A terminal disposal stage configured with mandatory disposal deadlines and inventory allocation for authorized waste/recycling partners.
- **Master Inventory Pool**: The total collection of inventory lots matched by the workflow's Section 2 filters (category, RSL threshold, explicit lot IDs).
- **Stage Inventory Allocation**: The granular subset of inventory lots (`allocatedLotIds`) assigned specifically to an individual stage, allowing distinct lots to be divided and offered among different buyers, donors, or disposal partners.
- **Offer Expiration Window**: The response timeframe (duration in Days/Hours/Mins) configured on a Donation stage before the donation transfer offer expires or cascades.
- **Disposal Deadline**: The mandatory removal/pickup cutoff date configured on a Landfill stage by which inventory must be collected or disposed of.
- **Stage Type Switcher**: The interactive toggle control located in the stage card title bar replacing the static token binding badge, allowing direct switching between Liquidation, Donation, and Landfill stage types.
- **Unified Partner Registry**: The centralized directory (managed via Buyer Registry & Buyer List Manager) serving as the single repository for commercial buyers, non-profit / food bank donation partners, and waste management / landfill operators.
- **Context-Aware Stage Tokens**: Dynamic merge tokens (`{{current_stage_discount}}`, `{{expiry_hours}}`, `{{offer_expiration_time}}`, `{{disposal_deadline}}`, `{{inventory_table}}`) that adapt their resolution automatically based on the stage's operational type.
- **Stage Validation Guardrails**: Type-specific validation enforcing that Liquidation stages have buyers + pricing rules, Donation stages have non-profit partners + allocated lots + expiration windows, and Landfill stages have disposal partners + removal deadline dates.








