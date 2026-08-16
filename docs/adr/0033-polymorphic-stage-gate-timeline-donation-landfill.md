# ADR 0033: Polymorphic Stage-Gate Escalation Timeline for Donation & Landfill

- **Status**: Approved
- **Date**: 2026-08-15
- **Authors**: Antigravity AI & SpoilerAlert Engineering Team
- **Deciders**: Lead Architect, Full-Stack Engineers

---

## 1. Context & Problem Statement

Suppliers utilizing the **Liquidation Automation Studio** required capabilities to escalate unsold or distressed inventory beyond standard commercial clearance (Primary Retailers, Secondary Liquidators) into philanthropic **Donation** (e.g., food banks, charities) and terminal **Landfill / Bio-waste Disposal** stages.

Previously, timeline stages were tightly coupled to commercial clearance assumptions:
1. Every stage required pricing rules (Discount % markdown, Minimum Floor Price, AI Yield Optimizer).
2. The entire matched inventory pool was offered uniformly to all stages without per-stage allocation.
3. The stage title bar featured static token binding badges rather than stage mode controls.

We needed a unified, polymorphic domain model and UI interface that supports Donation and Landfill stages without duplicating backend dispatch services or breaking backward compatibility.

---

## 2. Decision & Architectural Specifications

We establish a polymorphic **Stage-Gate Escalation Model** across the UI and Backend:

### 2.1 Stage Type Classification
Each stage card defines `stageType: 'liquidation' | 'donation' | 'landfill'` (defaulting to `'liquidation'`).
- In the stage title bar, a **Stage Type Pill Switcher** (`[ 🏷️ Liquidation | 🎁 Donate | 🗑️ Landfill ]`) replaces the static token badge, enabling one-click transformation of the stage.

### 2.2 Dedicated Timing & Removal Controls
- **Donation Stage**: Omits commercial pricing rules. Exposes an **Offer Expiration Window** (`waitHours` + Days/Hours/Mins unit) for non-profit acceptance.
- **Landfill Stage**: Exposes a **Disposal & Removal Deadline** calendar date (`disposalDeadline`) and removal notes.

### 2.3 Per-Stage Granular Inventory Allocation
- Introduces `allocatedLotIds?: string[]` on `Stage`.
- Each stage can either inherit the master inventory pool (`"All Matching Lots"`) or specify a custom subset of lots to divide across multiple recipients/donors.

### 2.4 Unified Partner Directory Reuse
- Reuses the existing **Buyer Registry & Buyer List Manager** (`Ingestion Section -> Buyer Lists`) to manage commercial buyers, non-profit / food bank donation partners, and certified landfill / waste management facilities under a single unified schema and API layer.

### 2.5 Context-Aware Template & Merge Token Resolution
- Tokens resolve contextually:
  - `{{current_stage_discount}}` $\rightarrow$ *"Surplus Donation Transfer (Complimentary)"* (Donation) or *"Scheduled Scrap & Disposal"* (Landfill).
  - `{{expiry_hours}}` / `{{offer_expiration_time}}` $\rightarrow$ Formatted offer window.
  - `{{disposal_deadline}}` $\rightarrow$ Formatted removal deadline.
  - `{{inventory_table}}` $\rightarrow$ Renders only the lots allocated to that stage.

---

## 3. Consequences

### Positive
- Unified UI/BE code paths: No parallel pipelines or disconnected controllers.
- Full flexibility: Suppliers can build complex escalation paths (e.g. Stage 1: Tier 1 $\rightarrow$ Stage 2: Liquidators $\rightarrow$ Stage 3: Food Bank Donation $\rightarrow$ Stage 4: Landfill Removal).
- Clean data model backward compatible with existing saved automations.

### Neutral / Follow-ups
- Update validation routines to enforce type-specific rules before saving or dispatching workflows.
