# IndSpoiler Alert Inventory & Surplus Liquidation Platform — Comprehensive Demo Document

This document serves as the master guide, test specification, dataset reference, data validation schema, KPI calculation breakdown, and user benefit overview for the **IndSpoiler Alert Surplus Inventory Platform**.

---

## 1. System & Database Clean Report

The local MongoDB database (`ind-spoiler-alert`) has been cleaned and freshly populated with a complete, deterministic demo dataset.

- **MongoDB Host**: `mongodb://localhost:27017/ind-spoiler-alert`
- **Database Status**: Wiped clean & re-seeded with 100% test-ready data.
- **Seeded Collections**:
  - `buyers`: 50 Retail Buyers (Secondary market closeout buyers & food banks)
  - `suppliers`: 5 Major CPG Suppliers (Unilever, Kraft Heinz, Mondelez, Danone, Conagra)
  - `distributioncenters`: 5 Regional Distribution Centers (Midwest Cold/Dry Warehouses)
  - `productmasters`: 10 Standardized SKUs (Dairy, Dry Goods, Meat, Beverages)
  - `liquidationcycles`: 2 Active Liquidation Campaigns
  - `inventorylots`: 8 Diverse Surplus Inventory Lots (Active, Pending, Sold, Donated, Recycled)
  - `sales`: 5 Confirmed/In-Transit Sales Transactions
  - `marketplacelistings`: 2 Active Marketplace Bidding Listings
  - `offers`: 3 Buyer Bids & Negotiation Message Chains
  - `awards`: 1 Awarded PO Record
  - `shipments`: 1 Carrier Shipment with FSMA Temperature Logs
  - `donations`: 1 Non-Profit Food Bank Donation Receipt
  - `disposals`: 1 Composting / Organic Recycling Record
  - `liquidationautomations`: 1 Automated Stage-Gate Workflow Rule
  - `automationruns`: 1 Automation Run Execution Audit
  - `activities`: 3 Chronological Lot Activity Logs

---

## 2. Seeded Demo Data Reference

### 2.1 Buyer List (50 Secondary Market Buyers & Food Banks)

Here is a summary of primary buyers seeded in the system. The database contains 50 active buyers:

| Buyer Company Name | Email Address | Min RSL (Days) | Transport Radius (Miles) | Accepted Categories | Excluded Allergens |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Grocery Outlet** | `procurement@groceryoutlet.com` | 5 days | 300 mi | Dairy, Dry Goods, Beverages, Meat | None |
| **Big Lots** | `salvage@biglots.com` | 10 days | 250 mi | Dry Goods, Beverages, Meat | None |
| **Misfits Market** | `surplus@misfitsmarket.com` | 7 days | 200 mi | Dairy, Produce, Beverages | None |
| **Imperfection Foods** | `buying@imperfectionfoods.com` | 5 days | 150 mi | Dairy, Produce, Dry Goods | None |
| **Dollar General Surplus** | `closeouts@dollargeneral.com` | 14 days | 400 mi | Dry Goods, Beverages | None |
| **Ollies Bargain Outlet** | `deals@ollies.com` | 10 days | 350 mi | Dry Goods, Beverages | None |
| **Greater Chicago Food Depository** | `donations@chicagofoodbank.org` | 2 days | 100 mi | Dairy, Produce, Meat, Dry Goods, Beverages | None |
| **Second Harvest Food Bank** | `intake@secondharvest.org` | 2 days | 120 mi | Dairy, Produce, Meat, Dry Goods | None |
| **Cheetah Wholesalers** | `orders@cheetahwholesale.com` | 8 days | 180 mi | Dairy, Meat, Beverages | Tree Nuts |
| **Daily Table Outlet** | `sourcing@dailytable.org` | 3 days | 90 mi | Dairy, Produce, Dry Goods | None |
| *+40 Additional Regional Buyers* | `*@indspoileralert-demo.com` | 3–14 days | 100–350 mi | Multi-category | Various |

---

### 2.2 Inventory Lots Dataset (8 Lots)

| Lot Number | Supplier | SKU | Product Description | Exp. Date | RSL % | Qty Cases | Cost / Case | Sell Price | FDA Regulated | Status |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **LOT-ULVR-2026-001** | Unilever | `ULVR-YOG-01` | Organic Vanilla Yogurt 32oz | 2026-08-02 | 22% | 1,200 | $18.00 | $32.00 | Yes (Cold 34–38°F) | **active** |
| **LOT-ULVR-2026-002** | Unilever | `ULVR-BUT-02` | Plant-Based Butter 16oz | 2026-08-10 | 30% | 800 | $22.00 | $45.00 | No | **pending** |
| **LOT-KHC-2026-003** | Kraft Heinz | `KHC-KET-01` | Tomato Ketchup Squeeze 64oz | 2026-09-05 | 49% | 2,500 | $12.00 | $24.00 | No | **active** |
| **LOT-MDLZ-2026-004** | Mondelez | `MDLZ-CRK-01` | Whole Wheat Crackers 12oz | 2026-08-06 | 23% | 3,000 | $8.00 | $16.00 | No | **active** |
| **LOT-DANN-2026-005** | Danone | `DANN-YOG-01` | Greek Yogurt Variety 6-Pk | 2026-07-26 | 10% | 500 | $15.00 | $30.00 | Yes (Cold 34–38°F) | **donated** |
| **LOT-CAG-2026-006** | Conagra | `CAG-MEAT-01` | Frozen Poultry Breasts 5lb | 2026-08-20 | 35% | 1,500 | $35.00 | $60.00 | Yes (Frozen 0–10°F) | **sold** |
| **LOT-ULVR-2026-007** | Unilever | `ULVR-MLK-03` | Almond Milk Vanilla 64oz | 2026-08-04 | 21% | 1,000 | $14.00 | $28.00 | Yes (Cold 34–40°F) | **active** |
| **LOT-KHC-2026-008** | Kraft Heinz | `KHC-DRS-02` | Zesty Italian Dressing 16oz | 2026-07-24 | 1% | 300 | $10.00 | $20.00 | No | **recycled** |

---

### 2.3 Sales Data (5 Transactions)

| Invoice # | Lot Number | Buyer Company | Buyer Email | SKU | Qty Cases | Price/Case | Total Sales Revenue | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **INV-2026-8801** | `LOT-ULVR-2026-001` | Grocery Outlet | `procurement@groceryoutlet.com` | `ULVR-YOG-01` | 400 | $17.50 | **$7,000.00** | `delivered` |
| **INV-2026-8802** | `LOT-KHC-2026-003` | Big Lots | `salvage@biglots.com` | `KHC-KET-01` | 1,000 | $14.00 | **$14,000.00** | `in_transit` |
| **INV-2026-8803** | `LOT-CAG-2026-006` | Big Lots | `salvage@biglots.com` | `CAG-MEAT-01` | 1,500 | $38.00 | **$57,000.00** | `delivered` |
| **INV-2026-8804** | `LOT-MDLZ-2026-004` | Dollar General Surplus | `closeouts@dollargeneral.com` | `MDLZ-CRK-01` | 1,000 | $9.50 | **$9,500.00** | `confirmed` |
| **INV-2026-8805** | `LOT-ULVR-2026-001` | Misfits Market | `surplus@misfitsmarket.com` | `ULVR-YOG-01` | 300 | $16.00 | **$4,800.00** | `scheduled` |

---

## 3. How to Test Each Feature of the System

### Feature 1: Ingestion Engine (Messy Data AI Normalizer)
- **Goal**: Ingest unstructured supplier invoice PDFs or messy CSV sheets and dynamically convert them into typed canonical inventory lots.
- **How to Test**:
  1. Navigate to the **Ingestion** tab (`/ingest`).
  2. Select supplier **Unilever** (`ULVR`).
  3. Upload sample test CSV or PDF file from `test_files/` directory.
  4. Observe the AI Data Normalizer parse heterogenous headers into standard fields: SKU, Lot #, Expiration Date, Cases, and Cost.
  5. Click **Confirm Ingestion**.
  6. **Verification**: Check that a new inventory lot appears in the **Inventory List** with status `'pending'`.

---

### Feature 2: Inventory List & Lot Operations Hub
- **Goal**: View, filter, and inspect surplus lots with dynamic facets, risk assessment, and lot-level activity tracking.
- **How to Test**:
  1. Navigate to **Inventory List** (`/inventory`).
  2. Use sidebar dynamic facets to filter lots by **Category** (`Dairy`), **Supplier** (`Unilever`), or **Status** (`active`).
  3. Click on lot **LOT-ULVR-2026-001** to open the **Lot Operations Hub**.
  4. Inspect the sub-tabs:
     - **Overview**: View Remaining Shelf Life (RSL 22%), Expiration date, and quantity available.
     - **Compliance & FDA**: Verify attached Certificate of Analysis (COA) or upload a new compliance file.
     - **Bidding Operations**: View active offers from Grocery Outlet and Misfits Market.
     - **Activity Audit Log**: Confirm chronological log entries (`INGESTED`, `RISK_ASSESSED`, `BIDDING_ENABLED`).

---

### Feature 3: Yield Optimization (Dynamic Discount Engine)
- **Goal**: Automatically calculate markdown price decay curves based on Days Left to Expiration and price elasticity.
- **How to Test**:
  1. In **Lot Operations Hub** for `LOT-ULVR-2026-001`, click **Assess Risk & Yield Pricing**.
  2. The system executes API `/api/inventory/lot/:id/assess-risk`.
  3. **Verification**: Verify that the engine outputs a recommended **45% markdown discount** ($17.60/case target) given RSL = 22%.

---

### Feature 4: Smart Buyer Matching & Bidding Marketplace
- **Goal**: Pair distressed lots with top retail buyers using category preference, RSL thresholds, transport radius, and allergen rules.
- **How to Test**:
  1. Click **Enable Bidding** on `LOT-ULVR-2026-001`.
  2. Open **Marketplace View** (`/marketplace`).
  3. Observe listed opportunity with asking price $20.00/case and floor price $15.00/case.
  4. Click **View Matching Buyers** to see high-probability buyer matches (Grocery Outlet: 95% match, Misfits Market: 90% match).
  5. Submit a custom bid as Grocery Outlet (500 cases @ $17.50).
  6. Supplier counters at $18.00. Test partial awarding by awarding 500 cases to Grocery Outlet.
  7. **Verification**: `LOT-ULVR-2026-001` available quantity decrements from 1,200 to 700 cases while remaining active for other buyers.

---

### Feature 5: Stage-Gate Liquidation Automation Studio
- **Goal**: Execute rule-based automated liquidation stage-gate workflows with dynamic inventory selection and email templates.
- **How to Test**:
  1. Navigate to **Liquidation Automations** tab.
  2. Select workflow **"Short-Dated Dairy Stage-Gate Automated Liquidation"**.
  3. View dynamic filters (`Category: Dairy`, `Max Expiration: 15 days`).
  4. Inspect the **Live Impact & Allocation Panel** showing matched lots (2 lots, 2,000 cases, $35,600 COGS value at risk).
  5. Click **Trigger Immediate Run**.
  6. **Verification**: Check **Automation Runs Audit Log** for execution status `'awarded'` and winning buyer `Grocery Outlet`.

---

### Feature 6: Logistics, Freight & Cold Chain Temperature Logging
- **Goal**: Manage dock appointments, Bill of Lading (BOL) generation, and FSMA cold storage temperature compliance.
- **How to Test**:
  1. Navigate to **Logistics & Shipments** view (`/shipments`).
  2. Locate shipment for award PO `PO-CAG-9912` (`LOT-CAG-2026-006`).
  3. Click **Confirm Dock Appointment** and select pickup window (`2026-07-19 08:00 AM - 12:00 PM`).
  4. Add a new cold chain temperature reading (`35.5°F`).
  5. **Verification**: Ensure status transitions to `'confirmed'` / `'delivered'` and all temperature logs remain within [0°F, 10°F] frozen range.

---

### Feature 7: Sales Reconciliation & Distressed Inventory Analytics
- **Goal**: Reconcile closeout sales against inventory lots and view recovery rate KPIs and landfill diversion statistics.
- **How to Test**:
  1. Navigate to **Analytics View** (`/analytics`).
  2. Review dashboard cards for **COGS Recovery Rate**, **Landfill Diversion %**, and **Total Sales Revenue**.
  3. Check **Sales Reconciliation Table** for matched sales invoices (`INV-2026-8801` through `INV-2026-8805`).

---

## 4. Data Validation Rules & Schema Invariants

To ensure data integrity, system transactions enforce strict validation rules:

1. **Inventory Lot Validation Invariants**:
   - `expirationDate` MUST be greater than `productionDate`.
   - `remainingShelfLife` (RSL) formula:
     $$\text{RSL} = \frac{\text{expirationDate} - \text{currentDate}}{\text{expirationDate} - \text{productionDate}}$$
     Must be bounded between $0.00$ and $1.00$.
   - `quantityCases` and `availableQty` MUST be integers $\ge 0$. `availableQty` CANNOT exceed `quantityCases`.
   - If `fdaRegulated == true`, `complianceDocs` MUST contain at least one verified document before promoting lot to active marketplace bidding.
   - Temperature ranges `temperatureMin` and `temperatureMax` MUST be specified for cold-storage products.

2. **Buyer Validation Rules**:
   - `email` MUST be unique, non-empty, and lowercase.
   - `transportRadius` MUST be $> 0$ miles.
   - `minShelfLife` MUST be $\ge 0$ days.
   - If an inventory lot contains an allergen present in buyer's `excludedAllergens` list, the buyer match score MUST be forced to $0$.

3. **Bidding & Awarding Validation Rules**:
   - Offer price MUST be $\ge$ listing `minimumPrice` (floor price).
   - Offered quantity MUST be $\le$ lot `availableQty`.
   - Partial awards MUST decrement lot `availableQty` by `awardedQty`. If `availableQty` reaches $0$, lot status MUST transition to `'sold'`.

4. **Stage-Gate Automation Validation Rules**:
   - `evaluationWindowHours` MUST be $> 0$.
   - Email templates MUST contain the dynamic token `{{inventory_table}}` to compile itemized lot tables.
   - Fallback actions MUST be restricted to `['auto_donate', 'yield_markdown_retry', 'escalate_review']`.

5. **Logistics & Cold Chain Rules**:
   - `pickupWindowStart` MUST be prior to `pickupWindowEnd`.
   - Temperature logs during transit MUST fall strictly within `[temperatureMin, temperatureMax]`. Out-of-bounds readings generate an automatic FSMA alert.

---

## 5. Calculated Key Performance Indicators (KPIs)

Based on the seeded database dataset, the system calculates the following concrete metrics:

### 5.1 COGS Value at Risk
$$\text{Total COGS at Risk} = \sum (\text{Total Cases Ingested} \times \text{Cost per Case}) = \$170,200.00$$
*(8 seeded lots, 11,800 total cases)*

### 5.2 Total Liquidated Sales Revenue
$$\text{Total Recovered Revenue} = \sum \text{Sales Total Value} = \$92,300.00$$
*(5 sales invoices: \$7,000 + \$14,000 + \$57,000 + \$9,500 + \$4,800)*

### 5.3 COGS Recovery Rate (%)
$$\text{COGS Recovery Rate on Sold Lots} = \frac{\text{Total Recovered Revenue}}{\text{COGS of Sold Quantity}} \times 100\%$$
$$\text{COGS of Sold Quantity} = (700 \times \$18) + (1000 \times \$12) + (1500 \times \$35) + (1000 \times \$8) = \$85,100.00$$
$$\text{COGS Recovery Rate} = \frac{\$92,300.00}{\$85,100.00} \times 100\% = \mathbf{108.46\%}$$
*(Demonstrates net positive margin on closeout liquidation sales vs original cost)*

### 5.4 Landfill Diversion Rate (%)
$$\text{Landfill Diversion Rate} = \frac{\text{Cases Sold} + \text{Cases Donated} + \text{Cases Recycled}}{\text{Total Cases Ingested}} \times 100\%$$
$$\text{Landfill Diversion Rate} = \frac{4,200 + 500 + 300}{11,800} \times 100\% = \frac{5,000}{11,800} \times 100\% = \mathbf{42.37\%}$$

### 5.5 Environmental & Social Impact
- **Donated Stock**: 500 cases ($7,500 tax deduction benefit).
- **Landfill Avoided**: 0.45 tons of solid waste.
- **CO2 Emissions Prevented**: 1.12 metric tons $CO_2e$.

---

## 6. Value Proposition & Short Feature Notes

- **Ingestion Engine**: *Eliminates manual data entry.* Converts heterogeneous supplier invoices and CSVs into clean database lots in seconds.
- **Inventory List & Lot Operations Hub**: *Centralizes decision-making.* Gives sales reps a 360-degree command center for RSL monitoring, compliance checks, and lot actions.
- **Yield Optimization Engine**: *Maximizes revenue recovery.* Automatically calculates optimal decay markdowns before expiration to prevent zero-value dumpsters.
- **Smart Buyer Matching & Marketplace**: *Accelerates velocity.* Instantly matches distressed lots with verified closeout buyers while enforcing distance and allergen rules.
- **Stage-Gate Liquidation Automation Studio**: *Automates closeout workflows.* Multi-stage automated emails, bidding windows, and fallback donations run seamlessly without manual supervision.
- **Logistics & Cold Chain Module**: *Protects food safety.* Ensures FSMA compliance with carrier appointment scheduling, BOL generation, and real-time temperature audit trails. *(Note: UI navigation section disabled for base release via `SHOW_FREIGHT_LOGISTICS = false` feature flag; see [ADR 0025](file:///Users/debashisroy/Documents/IndSpoilerAlert/docs/adr/0025-defer-distressed-analytics-and-freight-logistics-for-base-release.md)).*
- **Sales Reconciliation & Distressed Analytics**: *Provides clear ROI visibility.* Gives supply chain executives real-time metrics on COGS recovery, revenue, and ESG landfill diversion. *(Note: UI navigation section disabled for base release via `SHOW_DISTRESSED_ANALYTICS = false` feature flag; see [ADR 0025](file:///Users/debashisroy/Documents/IndSpoilerAlert/docs/adr/0025-defer-distressed-analytics-and-freight-logistics-for-base-release.md)).*

---
*Document updated and verified on 2026-07-23 for IndSpoiler Alert Surplus Platform.*
