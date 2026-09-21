# Domain Glossary & Model

## Global Navigation Shell

- **Global Navigation Bar**: The top-level horizontal navigation shell replacing the legacy vertical sidebar, housing the brand emblem, rounded pill routing tabs (`Ingestion`, `Insight`, `Workflow`, `Inbox`, `Settings`), notifications trigger, Public Marketplace Launcher link, and verified user profile pill.
  _Avoid_: `Sidebar Navigation`, `Left Navigation Menu`, `Sidebar Shell`.
- **Public Marketplace Launcher**: The external navigation link ("Public Marketplace ↗") in the Supplier Global Navigation Bar and Institutional Control Menu opening the standalone buyer portal (`/marketplace`) in a clean browser context.
  _Avoid_: `Internal Marketplace Tab`, `Embedded Marketplace View`.
- **Institutional Control Menu**: The centralized popover dropdown anchored to the User Profile Pill in the Global Navigation Bar. It consolidates authenticated identity details, active supplier/facility selection, dark/light theme switching, service telemetry (Backend & Sidecar health), and console session termination (`logout`).
  _Avoid_: `Simple User Menu`, `Floating Theme Button`.
- **Quick Notifications Popover**: The lightweight floating notification flyout triggered by the notification bell in the Global Navigation Bar and Mobile Nav Bar, rendering time-stamped alerts for inbound bids, workflow runs, and compliance actions with a direct jump to the Emails Hub.
  _Avoid_: `Notifications Page`, `Full Page Notifications`.
- **Operational Metric Hydration**: The reactive data binding mechanism linking drawer matrix cards (`Active Lots`, `Pending Bids`, `Unread Alerts`) and navigation tab badges to live Redux and domain store states, with graceful baseline fallbacks during network initialization.
  _Avoid_: `Static Drawer Numbers`, `Hardcoded Stats`.
- **Hybrid High-Fidelity Asset Pipeline**: The visual integration architecture combining Google Font CDN typography (`Hanken Grotesk`, `Inter`) and Material Symbols with embedded SVG/Lucide component fallbacks for offline environments and CI unit test resilience.
  _Avoid_: `Pure Icon Font Dependency`, `Unstyled System Fallback`.
- **Mobile Navigation Drawer**: The responsive slide-over drawer overlay triggered by the mobile header hamburger toggle, displaying user credentials, live operational metrics (Active Lots, Pending Bids, Unread Alerts), primary routing items with contextual badges, terminal node status, and session termination controls.
  _Avoid_: `Bottom Navigation Bar`, `Mobile Tab Strip`.
- **Terminal Node Status**: The institutional telemetry indicator in the drawer and navigation shell reflecting the connected distribution clearinghouse node (`Node: NA-SOUTH-TX-HUB`) and network compliance status (`FSMA 204 Audited`, `TLS 1.3 End-to-End`).

## Public Buyer Marketplace Portal

- **Standalone Public Buyer Marketplace Portal**: The dedicated, unauthenticated web application entrypoint (`/marketplace/*` or `marketplace.inventoryflowing.com`) serving secondary market retail buyers with open catalog search, sanitized product listings, and OTP-verified bid submission, decoupled from supplier navigation and admin chrome.
- **Frictionless Buyer Verification**: The identity mechanism where unauthenticated buyers can openly inspect listings, but submitting a bid triggers email OTP/magic-link verification via `/api/v1/marketplace/auth/send-verification`, creating or linking a buyer profile without requiring a prior password.



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
- **Campaign Scope**: The macro-orchestration boundary (`AutomationRun`) managing multi-lot inventory snapshots (`snapshotInventoryIds`), stage escalation timers, and buyer tier dispatches across multiple lots.
- **Atomic Offer Granularity**: The micro-transactional unit (`Offer` and `Award`) representing a buyer's commercial and legal commitment to a single physical inventory lot (`lotId`), ensuring warehouse DC pickup accuracy, SKU-level valuation, and independent negotiation.
- **Strict Listing Reference Invariant**: The database relational integrity rule requiring `Offer.listingId` (and `Award.listingId`) to be strictly null or undefined unless a matching document exists in the `MarketplaceListing` collection, preventing foreign key cross-contamination with unlisted inventory lot IDs.

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
- **Bid Action Inspector**: The dedicated full-screen operational workspace (replacing the pop-up modal dialog) that opens upon selecting a bid row in the Bid & Offer Workspace, featuring mode-driven action tabs (`Accept Offer`, `Negotiate / Counter`, `Decline Offer`, `Timeline`), centralized content containers, and vertically stacked parameter capture and TipTap-powered Email Builder with dynamic token population.
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
- **Counter Negotiation Email Preset**: The pre-built, tokenized email template populated with dynamic merge tags (`{{buyer_name}}`, `{{product_name}}`, `{{counter_price}}`, `{{counter_quantity}}`, `{{original_price}}`) pre-loaded into the TipTap editor during a counter-offer action.
- **Live-Evaluating Token Badge**: An atomic inline TipTap editor node that displays the active value of a commercial parameter (e.g. `$14.50/cs`) while preserving its underlying template token attribute (`data-token="counter_price"`) to prevent template destruction during supplier text composition.
- **Baseline Bid Preservation**: The domain constraint guaranteeing that the buyer's original submitted price and volume on the root offer entity remain immutable throughout negotiation rounds, with active supplier adjustments recorded in the message ledger.
- **Final Unit Price (Settled Price)**: The negotiated and agreed price per case (`finalPrice`) established upon offer acceptance (by supplier award or buyer counter-acceptance), preserved alongside the original immutable `price` (Initial Unit Price). In the Bid List view, accepted bids with negotiated terms render in a stacked presentation (prominent green settled price with subtitle initial bid reference) and compute Total Recovery from finalized terms. In the Bid Action Inspector modal, the header summary card highlights the settled price alongside the initial bid subtitle, and the post-award settlement banner explicitly details both the final agreed rate and the initial bid baseline.
- **Resilient Counter Dispatch**: The transactional policy for counter-offer negotiations ensuring offer state progression, CRM activity logging, and Emails Hub thread synchronization proceed unblocked even if third-party email transport encounters transient delivery failure, returning delivery telemetry to the caller.
- **In-Situ Negotiation Continuity**: The UX principle within the Bid Action Inspector where dispatching a counter-offer preserves the inspector session, immediately appending the sent proposal to the Timeline audit stream and updating the active lifecycle badge without abrupt modal dismissal.
- **Decline Notice Email Preset**: The pre-built, tokenized email template populated with dynamic merge tags (`{{buyer_name}}`, `{{product_name}}`, `{{decline_reason}}`, `{{decline_rationale}}`, `{{lot_number}}`) pre-loaded into the TipTap editor during a decline action in the Bid Action Inspector.
- **Resilient Decline Dispatch**: The transactional policy for offer decline notifications ensuring offer rejection state progression, CRM activity logging, and Emails Hub thread synchronization proceed unblocked even if third-party email transport encounters transient delivery failure, returning delivery telemetry to the caller.
- **Buyer Negotiation Portal**: The dedicated guest portal accessible via cryptographic token from counter-offer emails (`/portal/negotiation/:offerId?token=...`) where buyers can review negotiation history, accept supplier counter-proposals (advancing directly to post-award Deal Settlement), or submit revised counter-bids (`proposedPrice`, `proposedQuantity`, notes).
- **Counter Action CTA Tokens**: Dynamic email tokens (`{{accept_counter_link}}`, `{{renegotiate_link}}`) embedded in outbound counter-offer emails allowing buyers direct frictionless access to the Buyer Negotiation Portal.
- **Superseded Proposal Invalidation**: The domain rule stipulating that once a newer counter-offer or revision is dispatched in the negotiation thread, all prior financial proposals from that party are rendered historical and cannot be accepted.
- **Decline Catalog Redirection**: An engagement safeguard embedded within outbound decline notices providing buyers with a direct tokenized link (`{{catalog_link}}` / `{{marketplace_link}}`) to explore alternative available inventory lots following an unawarded or declined bid.
- **Turn-Taking Negotiation State**: The state management principle whereby an incoming buyer counter-bid reverts the offer's operational status to `'pending'` while rendering a contextual "Buyer Countered" visual indicator, signaling supplier action is required without perturbing the canonical status enum.
- **Counter Acceptance Direct Settlement**: The automated post-counter transition triggered upon buyer acceptance within the Buyer Negotiation Portal, generating an `Award` record at the agreed counter terms and immediately routing the buyer into the Deal Settlement Portal for payment and contract execution.
- **Outbound Email Preview**: A dedicated modal dialog within the Bid Action Inspector displaying a faithful, read-only preview of the outbound HTML dispatch with all dynamic token badges resolved to actual contextual values before sending.

## Lot Operations Hub

- **Lot Operations Hub**: The centralized, high-density operational cockpit for managing a specific inventory lot across its entire surplus lifecycle, combining inventory health metrics, dynamic price decay simulation, buyer recommendations, regulatory compliance, bid trading desk actioning, and CRM activity timelines.
  - _Avoid_: Monolithic view components mixing pricing elasticity SVG mathematics, Redux dispatch mutations, bid filtering, and activity composition.
- **Price Decay Simulation Curve**: An algorithmic pricing projection model visualizing price and revenue decay over remaining shelf life (days remaining vs recovery revenue) based on product category price elasticity, volume discounts, and sigmoid sell-through probability.
- **Lot CRM & Audit Timeline**: The consolidated, chronological event stream tracking all automated dispatches, supplier communications, notes, and regulatory actions associated with a specific inventory lot.
- **Bid Status Normalization**: The mapping of raw bid states (`pending`, `countered`, `fully_accepted`, `partially_accepted`, `rejected`, and buyer counter message heuristics) into canonical operational badge representations (`Pending`, `Countered`, `Buyer Countered`, `Awarded`, `Declined`).

## Dedicated Ingestion Hub & Surplus Pipelines

- **Dedicated Ingestion Hub & Connectors**: The collapsible top-level multi-source ingestion workbench in the Ingestion Tab displaying ingestion channel cards (`Zapier Webhooks`, `Google Sheets Sync`, `Image & Doc Scanner`, `CSV / Excel Upload`, and `+ Add Integration` Directory) with real-time status and sync telemetry.
  _Avoid_: `Simple File Dropzone`, `Upload-Only Banner`.
- **Unified Surplus Data Ingestion Modal**: The centralized modal overlay triggered by the "CSV / Excel Upload" connector or pipeline import action buttons, providing a 2-step batch upload flow: 1) dataset destination selection (`Inventory Data`, `Sales Data`, or `Buyer Data`), and 2) file drag-and-drop / selection that advances to the Ingestion Mapping Window.
  _Avoid_: `Fragmented Upload Modals`, `Per-Tab File Uploaders`.
- **Progressive Row Inspection Drawer**: The collapsible in-situ accordion inspection workbench expanding directly beneath table rows (across Inventory, Sales, and Buyer pipelines) when selected, presenting detailed cold-chain/environmental telemetry, FEFO lifecycle matrix, date audit logs, financial settlement remittance, and context-sensitive operational actions.
  _Avoid_: `Full Page Lot Redirection on Row Click`, `Modal-Only Details Dialog`.
- **Global Table Accordion Toggle ("Toggle All")**: The master control in the pipeline action strip that bulk-expands or bulk-collapses all visible Progressive Row Inspection Drawers across the active dataset.
  _Avoid_: `Manual Per-Row Expansion Only`.
- **Ingestion Mapping Window**: The dynamic spreadsheet column matching and semantic translation interface that renders parsed tabular rows and enables user-confirmed mapping of source headers to target domain attributes before committing records to the registry.
- **Live ERP Clearing Connected Badge**: The operational telemetry indicator within the Sales Filter Bar reflecting real-time ERP synchronization and total ledger records cleared across financial accounts.
  _Avoid_: `Static Sales Count Label`.
- **Sales Contextual Action CTAs**: The domain-aware operational action triggers embedded in the Sales Progressive Row Inspection Drawer (`Reconcile Invoice`, `Authorize Dock Gate Pass`, `Live Fleet Telemetry`) initiating in-situ transaction clearance, dock authorization, or carrier tracking.
  _Avoid_: `Generic Row Actions Menu`.
- **Master Pipeline Synchronizer**: The event-driven coordination protocol connecting `PipelineSwitcherBar`, pipeline datasets, and progressive inspection drawers via `toggle-all-rows` and `toggle-all-state-changed` DOM CustomEvents. Ensures that the master "Toggle All" control accurately reflects visible drawer states and cleanly resets upon pipeline tab transitions.
  _Avoid_: `Stale Cross-Tab Toggle State`, `Unsynchronized Master Button`.
- **Multi-Theme Ingestion Tokens**: The institutional Tailwind CSS color and typography taxonomy harmonizing `IngestionView`, `IngestionTelemetryBar`, and connector workbenches across light and dark modes (`dark:bg-slate-950`, `dark:bg-slate-900`, `dark:border-slate-800`, `dark:text-slate-100`) while honoring the 4px/8pt optical density standard.
  _Avoid_: `Hardcoded White Backgrounds`, `Inconsistent Dark Mode Surfaces`.

## Liquidation Automation Studio Architecture

- **Workflow Studio Orchestrator**: The top-level composition container within `WorkflowsView.tsx` (`workflowSubTab === 'builder'`) responsible for mounting the workflow authoring pipeline and binding headless campaign state to presentation slices.
  _Avoid_: `Monolithic Studio File`, `Inline Heavy Workflow Component`.
- **Progressive Section Accordion**: The layout paradigm structuring the Workflow Builder into numbered, collapsible cards (Strategy & Scope, Stage-Gate Timeline, Review & Dispatch) that condense into single-line visual summary chip strips when collapsed to preserve viewport headroom.
  _Avoid_: `Permanently Expanded Canvas Dump`, `Rigid Multi-Page Wizard Pagination`.
- **Headless Workflow Studio Hook (`useWorkflowStudio`)**: The state and calculation engine encapsulating all reactive campaign draft values, lot filtering algorithms, polymorphic stage array mutations, validation guardrails, and execution submission handlers away from the visual view layers.
  _Avoid_: `Transient Redux Form State`, `Component-Coupled Business Logic`.
- **Workflow Header & Scheduling Bar**: The ergonomic top-rail control strip consolidating campaign identity, strategy presets, scheduling trigger popover, and OAuth mailbox security posture within a compact, non-congesting (<25% viewport height) frame.
  _Avoid_: `Multi-tier Sticky Header`, `Floating Uncontained Schedule Card`.
- **Inventory Matching Scope Panel**: The faceted inventory filtering and lot selection surface evaluating available warehouse surplus by Category, Maximum Remaining Shelf Life (RSL %), and Minimum Cases with live lot diff inspection.
  _Avoid_: `Unpaginated Lot Table Dump`, `Rigid Fixed Filter Grid`.
- **Stage-Gate Escalation Canvas**: The dynamic, polymorphic stage sequence manager rendering Liquidation, Donation, and Landfill escalation cards with granular buyer targeting, discount curve sliders, and wait-time duration units.
  _Avoid_: `Static Non-Polymorphic Stage List`, `Hardcoded Buyer Radio Buttons`.
- **Pre-Flight Dispatch & Audit Engine**: The multi-point validation and execution gate confirming mailbox readiness, buyer reachability, and inventory allocation before triggering an immediate workflow run or persisting a saved strategy.
  _Avoid_: `Unchecked Workflow Submission`, `Silent Dispatch Failures`.

