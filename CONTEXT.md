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
- **Private Stage Exclusivity Window**: The designated response timeframe during an active Liquidation Stage targeting specific or customized buyers, during which the evaluated inventory lots remain unlisted on the public marketplace and can only be bid upon via private, tokenized 1-click buyer action links.
- **Marketplace Broadcast Fallback**: A terminal fallback rule configuration where remaining unsold inventory lots from prior private stages or stages targeting "All Buyers" are automatically published to the public `MarketplaceListing` catalog (subject to compliance verification) as a final commercial recovery attempt before non-commercial diversion.
- **Compliance Hold Gate**: An automated regulatory safeguard during Marketplace Broadcast execution where lots with verified compliance documentation (COA/Batch Record) publish immediately to the public marketplace, while unverified FDA-regulated lots are held in a `compliance_hold` status pending supplier document upload and verification.
- **Stage Balance Carry-Forward**: The automated mechanism where unawarded or partially remaining inventory quantities from a prior stage execution remain active for the duration of the current stage window and then carry forward as the available inventory pool for downstream stages or marketplace broadcast.

## Workflow Run History & Audit Trail

- **Workflow Run Group**: A grouped collection of all historical executions belonging to a specific saved Workflow Strategy, surfacing high-level aggregated health metrics (total run count, success/award rate, cumulative dollar recovery, and latest dispatch timestamp).
- **Execution Run Record**: An individual historical execution instance of a workflow (dispatched manually or on schedule), capturing immutable snapshots of matched inventory lots, buyer dispatches, stage evaluation timeline, and final resolution outcome.
- **Full-Screen Execution Audit Inspector**: A comprehensive modal overlay offering an end-to-end, "A-to-Z" chronological trace and granular breakdown of a single workflow execution run.
- **Execution Audit Tabs**:
  - **Summary & Timeline Tab**: High-level resolution overview and visual step-by-step stage escalation stepper tracking triggers, evaluations, and final resolutions.
  - **Strategy Snapshot Tab**: Immutable record of workflow configuration, discount formulas, wait windows, and partner segments active at dispatch time.
  - **Inventory Scope Tab**: Complete itemized roster of lots and SKUs evaluated during the execution window (quantities, expiration dates, RSL %, baseline valuation).
  - **Communications Log Tab**: Itemized outbound email delivery ledger logging recipient addresses, timestamps, template snapshot, and OAuth mailbox dispatches.
  - **Bids & Offers Ledger Tab**: Comprehensive log of all buyer bids received, comparative ranking, unit pricing, and awarding decisions.
  - **Raw Telemetry & JSON Tab**: Complete machine-readable execution audit payload with search, filter, and JSON export capabilities.
- **Audit Report Export**: Formatted JSON / CSV data generation containing full execution run telemetry, inventory snapshots, bidding logs, and resolution metrics for compliance and reporting.
- **Evaluation Override**: Administrative control allowing immediate manual termination of an in-flight evaluation window to force immediate resolution (awarding top bid or cascading to next stage).
- **Run Re-Trigger Dispatch**: On-demand action enabling an immediate fresh execution run using the parameters and scope of a saved workflow strategy or prior run.
- **Stage Execution Window**: The configured duration (in Minutes, Hours, or Days) allocated for partner responses, bidding evaluations, or transfer actions in a specific stage.
- **Active Stage Window Countdown**: A real-time countdown timer rendering the remaining time left within the currently active stage's configured evaluation window alongside total duration and elapsed time.
- **Formatted Execution Window**: A human-readable representation of stage evaluation windows that preserves user input units (`Mins`, `Hours`, `Days`) and provides backward-compatible duration inference for legacy execution records.

## Bid & Offer Management

- **Bid & Offer Workspace**: The unified management view within the Operation Hub (replacing the split "Incoming Bids & Offers" and "Live Negotiation Chat" panels) that renders a consolidated list of all incoming buyer offers associated with the active inventory lot across both private workflow dispatches (`lotId`) and public marketplace listings (`listingId`).
- **Bid Action Inspector**: The full-size modal window that opens upon selecting a bid row in the Bid & Offer Workspace, featuring mode-driven action tabs (`Accept Offer`, `Re-negotiate / Counter`, `Decline Offer`) and a central TipTap-powered Email Builder with dynamic token population.
- **Decline Reason Rationale**: Mandatory justification required when declining a buyer offer (e.g., Price below recovery floor, Inventory committed, Delivery/transport constraints, or Custom reason) embedded in the outbound rejection notice.
- **Deal Settlement Portal**: The dedicated, standalone web interface accessible by the buyer via an email token link (`/deal/:dealId` or tokenized action link) that renders a distraction-free external buyer settlement experience (omitting supplier internal sidebars and admin chrome). Facilitates a two-step post-award settlement: Payment Confirmation (QR code / Pay Now trigger) followed by legal E-Signature execution of the B2B Surplus Asset Purchase Agreement.
- **Hybrid Deal Token Authorization**: The dual-mode security model protecting the Deal Settlement Portal: permits frictionless guest execution via cryptographic HMAC `dealToken` parameter from outbound emails, while also honoring authenticated buyer JWT sessions matched to `buyerId` (and supplier admin preview access).
- **Payment-Gated E-Sign**: An operational safeguard requiring transaction payment status to be `confirmed` before the digital signature canvas and legal agreement execution controls are unlocked for the buyer.
- **Immediate Payment Clearance Event**: The backend event and CRM audit log triggered upon buyer payment simulation/confirmation (`POST /api/deals/:dealId/confirm-payment`), immediately persisting `paymentStatus: 'confirmed'` to the database and unlocking Step 2 across browser reloads while recording an audit entry in the Lot CRM timeline.
- **Adaptive Bid State Machine**: The lifecycle model governing buyer offers where `pending` and `countered` bids allow standard actioning (`Accept`, `Re-negotiate`, `Decline`), while already decided bids (`fully_accepted`, `rejected`) provide state-aware management actions (Resend Settlement/E-Sign Link, Re-open/Re-negotiate Terms, and Revoke/Cancel Award with rationale) rather than terminal UI lockdown.
- **Award Revocation**: An administrative override action allowing a supplier to cancel an existing acceptance/award, returning inventory back to available allocation and notifying the buyer with a mandatory decline rationale.
- **Bid Communication Dispatcher**: The messaging service routing outbound bid communications (Acceptance & Settlement, Counter-Offer Negotiations, and Decline Notices) through the supplier's authenticated Google OAuth Mailbox while automatically synchronizing records into the Lot CRM Timeline, Emails Hub thread repository, and Offer message history.
- **Settlement Tokens**: Dynamic merge tokens (`{{pickup_location}}`, `{{pickup_hours}}`, `{{payment_link}}`, `{{deal_document_link}}`, `{{total_amount}}`) resolved during acceptance email generation from inventory distribution center data and deal settlement session.
- **B2B Surplus Asset Purchase Agreement**: The standardized legal deal contract executed within the Deal Settlement Portal governing the transfer of surplus inventory, incorporating commercial terms, DC pickup logistics, pickup hours, payment confirmation record, and legally binding digital e-signatures.
- **Executed Deal Document**: The finalized, immutable purchase contract generated upon buyer signature submission via authoritative backend PDF compilation (`GET /api/deals/:dealId/pdf`), streaming a formal vector agreement embedding commercial terms, DC pickup logistics, legal disclaimers, and the digital signature audit block, with its artifact reference saved to `Award.poPdfUrl`.
- **Execution Audit Record**: The tamper-evident legal audit metadata captured at signature submission (`POST /api/deals/:dealId/sign`), encapsulating the signer's legal name, corporate title, authorization acknowledgment, signature data (canvas vector/data URL or typed glyph), client IP address, user agent, execution ISO timestamp, and cryptographic verification hash.
- **Downstream Fulfillment Provisioning**: The automated operational trigger executed immediately upon contract execution (`signatureStatus === 'executed'`) that auto-instantiates a linked `Shipment` record in `status: 'scheduled'` (carrier: "Buyer Arranged Freight (FOB Origin)") with the agreed DC pickup address, bridging commercial settlement directly into the supplier's warehouse logistics and dock scheduling queue while appending an execution memo to the offer history and Lot CRM timeline.
- **Dual-Mode Signature Capture**: The signing input interface supporting both interactive HTML5 canvas touch/mouse drawing and legal typed name rendered in cursive script, paired with mandatory corporate title input and legal authorization acknowledgment.
- **Executed Deal Portal Dashboard**: The terminal state view rendered when visiting or revisiting an already executed deal (`/deal/:dealId`), locking input controls, surfacing the executed audit certificate badge and timestamp, providing real-time agreement PDF download, and displaying DC dock pickup logistics instructions.
- **Negotiation History Thread**: The interactive chronological transcript embedded in the Bid Action Inspector displaying previous buyer bids, supplier counter-offers, and negotiation messages.
- **Counter Negotiation Email Preset**: The pre-built, tokenized email template populated with dynamic merge tags (`{{buyer_name}}`, `{{product_name}}`, `{{counter_price}}`, `{{counter_quantity}}`, `{{original_price}}`) pre-loaded into the TipTap editor during a counter-offer action.
- **Live-Evaluating Token Badge**: An atomic inline TipTap editor node that displays the active value of a commercial parameter (e.g. `$14.50/cs`) while preserving its underlying template token attribute (`data-token="counter_price"`) to prevent template destruction during supplier text composition.
- **Baseline Bid Preservation**: The domain constraint guaranteeing that the buyer's original submitted price and volume on the root offer entity remain immutable throughout negotiation rounds, with active supplier adjustments recorded in the message ledger.
- **Resilient Counter Dispatch**: The transactional policy for counter-offer negotiations ensuring offer state progression, CRM activity logging, and Emails Hub thread synchronization proceed unblocked even if third-party email transport encounters transient delivery failure, returning delivery telemetry to the caller.
- **In-Situ Negotiation Continuity**: The UX principle within the Bid Action Inspector where dispatching a counter-offer preserves the inspector session, immediately appending the sent proposal to the visible negotiation thread and updating the active lifecycle badge without abrupt modal dismissal.











