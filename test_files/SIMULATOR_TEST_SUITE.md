# 🚀 SpoilerAlert Simulator Mastermind Test Suite

Welcome to the **SpoilerAlert Simulation & Feature Verification Suite**. This repository of test datasets in `test_files/` has been crafted to test and stress-test the core capabilities of the SpoilerAlert platform—from surplus ingestion and semantic column mapping to multi-stage escalation, buyer allergen filtering, cold-chain compliance, and ERP sales reconciliation.

---

## 📁 Test Datasets & Target Feature Map

| Test File | Description & Purpose | Targeted Platform Features |
| :--- | :--- | :--- |
| 📦 [`inventory.csv`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/inventory.csv) | **100 Master Surplus Lots**: Complete inventory across Dairy, Meat, Frozen, Beverages, and Dry Goods spanning 5 major U.S. distribution hubs. Includes active, sold, and partially allocated lots. | • Inventory Pipeline Ingestion<br>• RSL % & Expiration Decays<br>• Temperature Range Validation<br>• FEFO Lifecycle Matrix |
| 🏢 [`buyers.csv`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/buyers.csv) | **50 Multi-Tier Buyers & Partners**: National Retailers (Tier 1), Regional Co-ops (Tier 2), Closeout Liquidators, and Non-Profit Food Rescue organizations. Includes email tags, geocodes, and allergen filters. | • Buyer Registry & Segmentation<br>• Allergen Safety Filtering<br>• Radius & Geographic Scoping<br>• Automated Offer Dispatch |
| 💳 [`sales.csv`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/sales.csv) | **93 ERP Financial Sales Transactions**: Historical and active sales records across `delivered`, `in_transit`, `confirmed`, and `cancelled` statuses. | • Live ERP Clearing Telemetry<br>• Sales Progressive Accordion<br>• Customer Margin Recovery<br>• Unit Price Variance Tracking |
| 🚨 [`scenario_1_emergency_short_dated_inventory.csv`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scenario_1_emergency_short_dated_inventory.csv) | **Ultra-Short Dated Emergency Lots**: Lots expiring in 3 to 7 days (RSL < 10%) with FDA regulation flags and cold-chain parameters. | • Stage-Gate Liquidation Escalation<br>• Private Exclusivity Window<br>• Donation Cascade Triggering<br>• Compliance Hold Safeguards |
| 🔄 [`scenario_2_non_canonical_erp_export.csv`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scenario_2_non_canonical_erp_export.csv) | **Raw SAP / Oracle ERP Data Dump**: Non-standard column headers (`Material_SKU`, `Batch_Number`, `BBD_Date`, `Stock_Cases`, `WH_Location`, `Unit_Cost_USD`). | • **Ingestion Mapping Window**<br>• **Fuzzy Semantic Header Matching**<br>• Dynamic Column Translation |
| 🛡️ [`scenario_3_buyer_segmentation_and_allergens.csv`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scenario_3_buyer_segmentation_and_allergens.csv) | **Specialized Buyer Profiles**: Partners with strict allergen exclusions (`peanuts`, `tree_nuts`, `gluten`, `dairy`), custom non-profit tiers, and short-dated toggles. | • Allergen Exclusions Engine<br>• Non-Profit Food Bank Matching<br>• Tier-Based Exclusivity Rules |
| ⚡ [`scenario_4_edge_cases_and_anomalies.csv`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scenario_4_edge_cases_and_anomalies.csv) | **Ingestion Stress & Anomaly Dataset**: Lots with quoted commas in descriptions, special characters (`Ben & Jerry's`), zero stock balances, and high unit values ($250/cs). | • Ingestion Parser Resilience<br>• CSV Quote/Escaping Verification<br>• Zero Balance Inventory State |

---

## 🛠️ Step-by-Step Upload & Verification Walkthrough

### 1. Ingesting Baseline Inventory & Buyer Directory
1. Navigate to the **`Ingestion`** tab on the Global Navigation Bar.
2. Click **`CSV / Excel Upload`** inside the **Dedicated Ingestion Hub**.
3. Select **`Inventory Data`** in Step 1 of the **Unified Surplus Data Ingestion Modal**.
4. Drag and drop [`inventory.csv`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/inventory.csv).
5. Verify column mappings in the **Ingestion Mapping Window** and click **`Confirm & Ingest`**.
6. Repeat for [`buyers.csv`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/buyers.csv) under **`Buyer Data`**.

### 2. Testing Non-Canonical ERP Export Mapping (Fuzzy Translator)
1. Trigger **`CSV / Excel Upload`** and select **`Inventory Data`**.
2. Upload [`scenario_2_non_canonical_erp_export.csv`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scenario_2_non_canonical_erp_export.csv).
3. Observe how SpoilerAlert's **Semantic Matcher** automatically maps:
   - `Material_SKU` ➔ `sku`
   - `Batch_Number` ➔ `lotNumber`
   - `Best_Before_Date` ➔ `expirationDate`
   - `Stock_Cases` ➔ `quantityCases`
   - `Dist_Center` ➔ `warehouse`

### 3. Simulating Emergency Liquidation & Donation Cascading
1. Upload [`scenario_1_emergency_short_dated_inventory.csv`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scenario_1_emergency_short_dated_inventory.csv).
2. Switch to the **`Workflow`** tab and launch the **Liquidation Automation Studio**.
3. Create a workflow with:
   - **Stage 1 (Liquidation)**: 2-day wait window, 20% discount.
   - **Stage 2 (Donation)**: Cascade remaining inventory to Food Bank non-profits.
4. Verify that ultra-short dated items (`LOT-EMERG-003`, 3 days remaining) trigger automated donation routing.

### 4. Auditing ERP Sales Clearance & Margin Recovery
1. Upload [`sales.csv`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/sales.csv) under **`Sales Data`**.
2. Inspect the **Sales Filter Bar** to confirm the **Live ERP Clearing Connected Badge** hydrates live ledger stats.
3. Click **"Toggle All"** on the pipeline action strip to expand the **Progressive Row Inspection Drawers** and view real-time fleet telemetry and invoice reconciliation CTAs.

---

## 🔍 Verification Checklist

- [x] All 100 inventory lots populated in the master inventory table.
- [x] RSL % color-coding (Red for <15%, Yellow for 15-30%, Green for >30%) correctly assigned.
- [x] Allergen warnings surfaced when attempting to route lots containing peanuts/dairy to restricted buyers.
- [x] Multi-warehouse telemetry reflected accurately across Chicago, Newark, Atlanta, Dallas, and Seattle.
- [x] Deal contracts and settlement tokens executable without data truncation.
