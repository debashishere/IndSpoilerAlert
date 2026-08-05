# InventoryFlowing Platform Domain Context

This document outlines the core domain model, glossary of terms, and architectural design constraints for the InventoryFlowing Platform (formerly IndSpoiler Alert).


## Core Glossary

### Surplus Inventory
CPG products (dairy, produce, dry goods, etc.) that are near expiration, overproduced, or otherwise surplus, requiring liquidation.

### Ingestion Engine (Messy Data AI Normalizer)
The system responsible for taking unstructured files (PDF invoices, messy CSV sheets) from suppliers (e.g., Unilever, Mondelez) and converting them into standardized, structured JSON payloads.

### Yield Optimization (Dynamic Discount Engine)
An analytical model that recommends discount percentages based on the days left to expiration (`days_until_expiration`), volume, and price elasticity, with the goal of liquidating stock before expiration while maximizing recovered value.

### Demand Matching (Smart Buyer Matching)
A recommendation engine that scores and pairs newly ingested surplus inventory with the top retail buyers based on buyer preferences (e.g., "accepts short-dated dairy") and past purchase history.

### Offer Sheet / Listing
A compiled catalog or batch of surplus inventory items made available to retail buyers for bidding or direct purchase.

### Buyer Marketplace (Public Buyer Portal)
A standalone public-facing portal (`marketplace.indspoileralert.com`) and product landing page where secondary market retail buyers browse active, compliance-verified Marketplace Listings, evaluate Remaining Shelf Life (RSL), and submit bids using email identification. It is architecturally and visually isolated from the authenticated Supplier Inventory Platform. *(See [ADR 0026](file:///Users/debashisroy/Documents/IndSpoilerAlert/docs/adr/0026-separation-of-buyer-marketplace-and-inventory-platform.md)).*


### Bidding & Awarding
A competitive transaction flow where secondary market buyers submit bid offers (price and volume) on a listing. Suppliers can perform partial awarding, selling fractional quantities to different buyers, which keeps the listing active until the remaining inventory is fully liquidated.

### Bid (Offer)
A formal bid submission from a retail buyer specifying the desired quantity of cases and the price per case they are willing to pay for a specific listing.

### Remaining Shelf Life (RSL)
The proportion of a product's shelf life left at the time of ingestion or transaction, used to determine markdown urgency and discount decay schedules.

### Alternative Disposal (Donation / Recycling)
Off-channel options to redirect distressed inventory to food banks (donation) or processing centers (recycling) when liquidation sales are no longer viable, helping CPG brands avoid landfill waste and fees.

### Distressed Inventory Analytics
Decision intelligence reporting (e.g., "Remaining Shelf Life" and "Leftovers" reports) assessing team efficiency, cost of goods sold (COGS) recovery rates, and landfill diversion stats. *(Note: The Distressed Analytics navigation section is hidden for the base version release via `SHOW_DISTRESSED_ANALYTICS = false` feature flag to ensure a streamlined base release; see [ADR 0025](file:///Users/debashisroy/Documents/IndSpoilerAlert/docs/adr/0025-defer-distressed-analytics-and-freight-logistics-for-base-release.md)).*


### AI Bid Evaluator
An intelligent decision support module that automatically scores and classifies incoming Bids against the calculated Yield Optimization curve, advising suppliers on whether to accept, counter, or divert the bid to donation.

### Award Notice (Email Draft)
An editable notification template generated upon accepting a bid, permitting the supplier to customize logistics details (pickup window, dock instructions) before notifying the buyer.

### Inventory Analytics & Charts View
A visual decision intelligence view of Surplus Inventory metrics, presenting high-level KPI cards and interactive performance charts (COGS Risk Trajectory, RSL & Category Distribution, Landfill Diversion Velocity, and Buyer Bidding Heatmap; marked as Coming Soon). Raw Inventory Data and Buyer Data lists are centralized within the Surplus Ingestion Pipeline (`IngestionView`). *(See [ADR 0028](file:///Users/debashisroy/Documents/IndSpoilerAlert/docs/adr/0028-relocate-inventory-and-buyer-lists-to-ingestion-pipeline-and-transition-inventory-tab-to-charts.md)).*

### Lot Operations Hub
A dedicated workspace view for a single Surplus Inventory lot that consolidates item management, active bid evaluations and awarding, and chronological activity tracking into structured sub-tabs.
_Avoid_: Action tab, manage bids drawer, details popup

### Bid Negotiation (Communication Chain)
An interactive chronological transaction flow where suppliers and buyers exchange messages and counter-offers on an active listing, simulating negotiation dynamics before a bid is awarded or rejected.

### Buyer Email Identification & Auto-Registration
The use of a buyer's email address as their primary identifier during bidding, which triggers automatic buyer profile registration using domain-derived company names if the email does not exist in the database.

### Compliance Document (COA / Batch Record / Attestation)
Legal food safety documentation (e.g., Certificate of Analysis or Lot Batch Record) that must be uploaded and verified for FDA-regulated products before an Inventory Lot can be promoted to an active marketplace listing.

### Purchase Order (PO)
An official document automatically generated as a PDF upon the final award of a bid. It captures the agreed quantity, price, buyer details, and lot information.

### Bill of Lading (BOL)
A standard freight document generated upon bid award, detailing the carrier, shipper, consignee, and quantity of cases being transported.

### Dock Appointment Confirmation
The process by which a buyer or carrier schedules and confirms a specific `pickupWindow` at a distribution center's dock door, transitioning a shipment from `'scheduled'` to `'confirmed'`.

### Cold Chain Temperature Logging
The FSMA-compliant recording of temperatures during a lot's shipment phase to ensure that cold storage ranges (e.g. 34–38°F) were maintained throughout transport.

### Dynamic Data Translator
A semantic normalization layer that transforms heterogeneous supplier product parameters into standardized canonical attributes and typed semantic attributes during ingestion.

### Dynamic Semantic Attributes
Category-specific or supplier-specific product attributes (e.g., certifications, pallet Ti/Hi, Brix score) stored in a structured dictionary on the inventory lot while preserving strictly typed canonical invariants for core transaction and pricing mechanics.

### Semantic Transformation Rule
A declarative rule mapping an incoming supplier product parameter to a canonical or semantic attribute key, including data type coercion and unit conversion (e.g., Celsius to Fahrenheit).

### Dynamic Facet Discovery
An aggregation mechanism that inspects active inventory lots to dynamically discover available semantic attribute keys and their distinct values or counts for context-sensitive buyer filtering.

### Sale (Sales Record)
A transaction record stored in a dedicated collection representing closeout or liquidated stock sales, populated either through direct bidding awards or bulk spreadsheet ingestion, and linked to surplus inventory via lot number or SKU.

### Liquidation Cycle
A high-level campaign container that groups related surplus inventory lots, sales reports, and liquidation activities for a supplier during a specific timeframe.
_Avoid_: ParentList, Campaign Group

### Liquidation Automation
A configurable rule-based process that automatically filters surplus inventory, ranks buyers, applies discount logic, and initiates bidding/donation actions based on a template.
_Avoid_: AutoFlow, Liquidation Bot

### Stage-Gate Workflow Template
A structured sequence containing triggering rules, wait delays, customized email templates, and conditional resolution branches (Success vs. Fallback) designed for sales representatives.
_Avoid_: Node Map, Zapier Flow

### Hybrid Inventory Selector
A selection mechanism combining dynamic query filters (such as `createdAt`, `expirationDate`, and `supplier`) with granular manual check-boxes to curate specific lots attached to a workflow.

### Dynamic Email Table Token
A template placeholder (`{{inventory_table}}`) that automatically compiles details of multiple selected surplus lots (SKU, description, quantity, price) into a styled table inside buyer-facing emails.

### Liquidation Automation Studio
The primary full-page workflow creation and execution workspace where suppliers specify campaign cycle metadata, select automation templates, define dynamic inventory rules, configure stage-gate buyer lists, and trigger immediate or scheduled runs.
_Avoid_: Workflow Modal, Automation Wizard Popup, Create Campaign Drawer

### Live Impact & Allocation Panel
A real-time sticky sidebar or drawer in the Liquidation Automation Studio that dynamically calculates and renders matched lot counts, case volumes, total COGS recovery value, and buyer allocation metrics as filters are adjusted.
_Avoid_: Summary Box, Calculation Drawer

### Pre-Flight Launch Audit
A mandatory modal summary step prior to workflow execution that provides a final verification of matched lots, total value at risk, target buyer counts, rendered email preview, and scheduled timing parameters.
_Avoid_: Confirmation Popup, Run Prompt

### Interactive Tour Tab Isolation
A design pattern that scopes interactive guide overlays and floating tour widgets strictly to their target view (e.g., Ingestion tab) to prevent z-index layering conflicts with workspace footers and side drawers on other tabs.

### Campaign & Strategy Save Persistence
The capability within the Liquidation Automation Studio to explicitly save and persist campaign cycle parameters and automated stage-gate rules for specific active date windows (e.g., 3-day short-term clearance vs. future-dated category campaigns) to the database without requiring an immediate pre-flight audit trigger.

### React Email Builder Engine
A code-first block-based email template authoring interface integrated within the Liquidation Automation Studio. It leverages modern design tokens and dynamic template placeholders (e.g., `{{inventory_table}}`, `{{buyer_name}}`, `{{discount_percent}}`) to construct high-conversion, responsive B2B surplus offer sheets.
_Avoid_: Heavyweight MJML Canvas, Plain Text Email Editor

### Dynamic Offer Sheet Template
A structured email layout configuration composed of modular blocks (Header, Text, Inventory Table, CTA Button, Logistics) and dynamic context variables, compiled into responsive HTML for buyer dispatch during stage-gate campaigns.

### Saved Campaigns Workspace
The primary management tab within the Workflow module that lists all persisted liquidation campaign strategies, enabling sales representatives to monitor status (`Draft`, `Active`, `Stopped`, `Completed`), track creation metadata, and execute lifecycle operations via a 3-dots action menu.

### Campaign Lifecycle State
The discrete status states of a liquidation campaign: `Draft` (configured but unlaunched), `Active` (live stage-gate execution), `Stopped` (manually halted before completion), and `Completed` (all stages finished or inventory fully awarded).

### Campaign Save Invariant
The mandatory validation rule requiring at least 1 valid, non-expired surplus inventory lot and at least 1 total case selected before a campaign strategy can be persisted as Draft or Active.

### Campaign Studio Entry Invariant
The mandatory validation rule requiring a supplier to have successfully authenticated an OAuth Mailbox Integration *before* they can enter the Liquidation Automation Studio to build a campaign. This "Hard Gate" ensures all drafted strategies are guaranteed to have a valid dispatch channel from the start.

### Mailbox Connection Canvas
A dedicated empty-state screen rendered inside the Liquidation Automation Studio tab when the Campaign Studio Entry Invariant fails. It presents the value proposition of connecting an email account and houses the primary OAuth trigger, preventing jarring navigation intercepts.

### Mailbox Authentication Soft Lock
A UI state triggered when a previously authenticated OAuth Mailbox token expires or is revoked. It permits read-only access to the Liquidation Automation Studio for viewing past campaigns, but displays a persistent warning banner and disables all campaign launch and communication actions until the connection is restored.

### Buyer Segment Roster Inspection
An interactive modal inspection drawer attached to stage buyer segment tabs that lists all registered buyers matching a target segment (including company name, email address, and registration date).

### Multi-Entity Donation Diversion
A dynamic configuration model permitting distressed inventory fallbacks or direct donation stages to split surplus cases across multiple certified non-profit and food bank entities according to configurable case caps and diversion strategies (`percentage_split` or `priority_cascade`). *(Note: The Section 5 UI card in `LiquidationAutomationStudio.tsx` is hidden for the base release via `SHOW_DYNAMIC_DONATION_SECTION = false` feature flag to ensure a streamlined base version, while backend models remain fully functional for future activation; see [ADR 0024](file:///Users/debashisroy/Documents/IndSpoilerAlert/docs/adr/0024-defer-dynamic-donation-section-in-workflow-builder.md)).*

### Campaign Builder Editing Session Indicator
A prominent Amber/Gold banner and control bar displayed at the top of the Liquidation Automation Studio when editing an existing campaign strategy, indicating active editing mode and offering actions to "Clear & Start New" or "Update Strategy".

### Matched Inventory Inspection Modal
A dedicated modal dialog accessible via an Eye button in the Saved Campaigns list that displays all surplus inventory lots matched by a strategy's targeting rules.

### In-Place Evaluation Bids Panel
An inline expandable view within an active workflow evaluation card that renders live buyer bids and award/rejection controls directly without navigating away from the workflow tab.

### Scoped Unique Strategy Name
The compound unique constraint (`{ supplierId, name }`) that guarantees every saved liquidation strategy has a distinct, unambiguous title within a supplier account, preventing naming collisions and ensuring clear identification across active evaluation windows and run history logs.

### Collapsible Workflow Execution Card
A unified card component layout used across both Active Workflow Evaluations and Run History & Audit Log sections. It supports a compact collapsed summary view optimized for mobile/tablet devices and an expanded view displaying execution metrics, buyer bids, stage timeline step cards, and run details.

### Execution Details Panel
An inline sub-view within a workflow execution card that consolidates detailed execution parameters, including dispatched/resolution timestamps, total bids received, winning bid amount, total dollar value recovered, case counts, snapshot inventory lot references, and audit logs.

### Workflow Strategy Stage & Action Timeline Viewer
An interactive modal visualization in the Saved Campaigns tab displaying a step-by-step pipeline breakdown: Stage 1 (Dispatch & Buyer Blast with email payload preview), Stage 2 (Active Bidding Window with floor price and match score guardrails), and Stage 3 (Resolution Gate for auto-award vs. auto-donation fallback), along with cron timing and historical dispatch statistics.

### Saved Workflow Lineage Filter Bar
A filter toolbar control on the Runs & History sub-tab that dynamically filters active evaluation windows and historical execution runs by any selected saved strategy name.

### OAuth Mailbox Integration
A seamless connection method (e.g., via Nylas) allowing suppliers to authenticate their corporate email accounts (Google Workspace, Microsoft 365) via OAuth, bypassing manual SMTP configuration for dispatching offer sheets and bid notifications.

### Platform Default Mailer
The baseline transactional email service powered by SendGrid (Free Tier) used for zero-config outbound supplier campaign emails, buyer thread replies, and platform system notifications.

### Email Communication Hub (Mails Workspace)
A dedicated workspace embedded directly within Centralized Platform Settings consolidating outbound campaign email dispatches, incoming buyer responses, pixel open telemetry, and bid negotiation histories into structured message threads.

### Centralized Platform Settings
A unified configuration workspace managing supplier credentials/login, OAuth Mailbox Integration status, SendGrid Platform Default Mailer, Mails Workspace, and system-wide application preferences.

### Email Campaign Workspace
A centralized workspace that allows suppliers to compose, preview, and dispatch ad-hoc email broadcasts to targeted retail buyers, while also managing reusable email templates utilized by automated Stage-Gate Workflows.

### Ad-Hoc Email Broadcast
A manual email dispatch initiated by a sales representative outside of automated workflow schedules, targeting selected retail buyers with specific surplus inventory lots or promotional offer sheets.

### Email Template Reference (templateId)
A string or entity reference identifying an Email Template used across broadcasts and automation workflows, resolving to "default" for platform baseline templates unless overridden by a custom supplier template reference.

### Template Variable Token
A standardized Handlebars placeholder tag (e.g., `{{buyer_name}}`, `{{inventory_table}}`, `{{quick_bid_link}}`) inserted into email template bodies and dynamically substituted during template compilation.

### Buyer Account Name Token
A dynamic variable token chip (`{{buyer_name}}` / `"Buyer Account Name"`) inserted into Email Templates. In standalone template authoring, it acts as an unbound placeholder. When attached to a workflow stage, it dynamically binds to the workflow's target buyer selection.

### Workflow Email Template Token Binding
The mechanism where selecting/attaching a saved email template to a workflow stage in the Workflow Builder automatically binds embedded token chips (such as `{{buyer_name}}`) to that stage's buyer selection dropdown (`buyerSegment` or `customBuyers`), resolving recipient data dynamically at dispatch time.

### Zero-Buyer Workflow Stage Invariant
The strict validation rule governing stage-gate workflows:
1. In the Workflow Builder UI: Selecting an empty buyer segment or custom list immediately displays a blocking validation error, restricting workflow creation/save until at least 1 valid buyer is attached.
2. In Workflow Engine Execution: If a stage evaluates to 0 target buyers at execution time, execution immediately fails, transitions the run status to `'error'`, and logs a detailed string error reason in the execution audit history.

### Buyer List Registry
A centralized management catalog within Buyer Ingestion enabling suppliers to curate, organize, and inspect buyer accounts into system-protected or user-defined lists for campaign targeting.

### System Default Buyer List
Permanent, system-protected list containers (`Primary Buyers` and `Secondary Buyers`) present for all suppliers that cannot be deleted, but whose buyer account memberships can be updated.

### Custom Buyer List
A user-defined, named collection of buyers created by a supplier with full CRUD capabilities (create, rename, update members, delete list) for granular workflow and broadcast targeting.

### Buyer Detail Drawer
A full-screen slide-over panel that opens from the right when a supplier clicks any buyer row in the Buyer Registry. Contains two tabs: **Profile & Settings** (editable fields, opt-in toggles, deactivation control, list-membership checkboxes) and **Communications** (a scoped list of `EmailThread` records matching that buyer's email, with snippet, date, and a link into the Email Communications Hub). Only one drawer is open at a time.
_Avoid_: Buyer popup, buyer modal, buyer edit page

### Buyer Deactivation
A soft-kill state (`isActive: false`) applied to a Buyer record. A deactivated buyer is silently excluded from all workflow executions, email dispatches, and UI registry lists without removing their database document or list-membership records. Reactivation restores the buyer to all their previous lists automatically. The deactivation is permanent until a supplier explicitly reactivates the buyer.
_Avoid_: Buyer deletion, hard remove, archive

### Buyer Opt-Out
A per-channel suppression state on a Buyer record, controlled by two independent boolean flags: `optInBidding` (default `true`) and `optInSales` (default `true`). When a flag is `false`, the buyer is skipped in that channel's workflow email triggers while remaining active, list-enrolled, and visible in the registry. The supplier toggles these flags in the Buyer Detail Drawer. "Temporary" opt-out is implemented by the supplier flipping the flag back on when ready — there is no automatic expiry.
_Avoid_: Buyer blacklist, session-scoped opt-out, timed suppression

### Buyer List Manager
A modal opened from the Buyer Registry header (button labelled "Buyer Lists") that provides two capabilities: (1) list-level CRUD — create, rename, and delete Custom Buyer Lists (System Default Lists are protected from renaming and deletion); (2) per-list bulk member assignment — a two-panel interface showing current list members on one side and all registered active buyers on the other, allowing bulk add/remove. Individual per-buyer list assignments are also available in the Buyer Detail Drawer.
_Avoid_: List admin panel, segment manager





### Smart Audience Targeting
The capability within the Email Campaign Workspace to dynamically resolve broadcast recipients based on buyer categories, historical bid profiles, or explicit buyer selection.

### Personalized Quick-Bid CTA Token
A recipient-unique secure URL token generated during campaign dispatch that allows a retail buyer to submit a 1-click bid on featured inventory lots directly from their email payload.

### Public Landing Page
The unauthenticated entry point rendered by the platform when no active Firebase session is detected. It presents the product value proposition and houses the Central Auth Modal for login and signup. Once authentication succeeds, the reactive `isAuthenticated` flag in `AuthContext` causes the platform shell to replace it automatically — no explicit callback navigation is needed.

### Auth Resolution Screen
A full-screen branded loading state rendered while Firebase asynchronously resolves the current session on cold page load. It prevents any flash of the landing page for returning authenticated users, or flash of the platform shell for logged-out users.

### Session Gate
The conditional rendering logic in `App` that reads `isLoading` and `isAuthenticated` from `AuthContext` to decide which root-level view to display: Auth Resolution Screen (loading), Public Landing Page (unauthenticated), or Platform Shell (authenticated).
