# 📄 Multi-Pipeline Doc Scanner Test Images & Verification Suite

This directory contains test image files (`.png`, `.jpg`, `.jpeg`) designed specifically to test the multi-pipeline document scanner architecture described in [`.scratch/multi-pipeline-doc-scanner/issues/`](file:///Users/debashisroy/Documents/SpoilerAlert/.scratch/multi-pipeline-doc-scanner/issues/):

- **Issue 01**: Ingress Target Selection & Telemetry Header
- **Issue 02**: Multi-Pipeline OCR Upload Dispatch & Image Ingress (Accepts `.pdf`, `.png`, `.jpg`, `.jpeg` up to 50MB)
- **Issue 03**: Scanned Documents Roster Target Lineage & Re-staging (Inventory blue, Sales emerald, Buyer purple badges)
- **Issue 04**: In-Situ Import Commit Handshake & Pipeline Navigation (`GridMapperTable` in `mode="import"`, commit banner, navigation)

---

## 📁 Test Image Files Overview

| Image File | Format | Target Pipeline | Simulated Document Type | Key Headers & Columns |
| :--- | :--- | :--- | :--- | :--- |
| [`01_inventory_manifest_packing_slip.png`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scanned_documents/01_inventory_manifest_packing_slip.png) | `.png` | **Inventory Data** | Warehouse Inbound Packing Slip | `Item Description`, `Lot Code`, `Quantity Cases`, `Price / Case`, `Expiration Date`, `Warehouse` |
| [`02_inventory_warehouse_bol_photo.jpg`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scanned_documents/02_inventory_warehouse_bol_photo.jpg) | `.jpg` | **Inventory Data** | Scanned Freight Bill of Lading (BOL) | `SKU`, `Description`, `Lot Number`, `Cases Available`, `Unit Price`, `Best Before Date` |
| [`03_sales_wholesale_invoice_photo.jpg`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scanned_documents/03_sales_wholesale_invoice_photo.jpg) | `.jpg` | **Sales Data** | Wholesale Clearance Sales Invoice | `Invoice Number`, `Customer Name`, `Sale Date`, `Item Description`, `Sold Cases`, `Unit Price`, `Total Amount`, `Status` |
| [`04_sales_reconciliation_clearing.png`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scanned_documents/04_sales_reconciliation_clearing.png) | `.png` | **Sales Data** | ERP Financial Clearing Statement | `Invoice`, `Buyer Company`, `Date`, `SKU`, `Quantity`, `Revenue`, `Warehouse` |
| [`05_buyer_onboarding_registry_scan.png`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scanned_documents/05_buyer_onboarding_registry_scan.png) | `.png` | **Buyer Data** | Partner Directory & Allergen Scan | `Company Name`, `Contact Email`, `Buyer Tier`, `Min Shelf Life`, `Preferred Categories`, `Transport Radius`, `Excluded Allergens` |
| [`06_buyer_partner_intake_sheet.jpeg`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scanned_documents/06_buyer_partner_intake_sheet.jpeg) | `.jpeg` | **Buyer Data** | Commercial Registration Intake Roster | `Company Name`, `Email Address`, `Buyer Tier`, `Short Dated Accepted`, `Min Shelf Life Days`, `Phone Number`, `Location` |
| [`07_inventory_cold_chain_delivery_slip.jpeg`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scanned_documents/07_inventory_cold_chain_delivery_slip.jpeg) | `.jpeg` | **Inventory Data** | Cold-Chain Temperature Inspection Slip | `Item Description`, `Lot Code`, `Quantity Cases`, `Price / Case`, `Expiration Date`, `Temp Min F`, `Temp Max F` |
| [`08_sales_receipt_mobile_snap.jpg`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scanned_documents/08_sales_receipt_mobile_snap.jpg) | `.jpg` | **Sales Data** | Mobile Snapshot of Liquidation Cash Receipt | `Invoice`, `Buyer Name`, `Date`, `Description`, `Quantity`, `Unit Price`, `Total Amount` |

---

## 🛠️ Feature Verification Guide

### 1. Ingress Target Selection & Health Telemetry (Issue 01)
1. Open the **Image & Doc Scanner** tab in the Ingestion workbench (`/?tab=ingestion&connector=doc-scanner`).
2. Verify that **Quadrant 1** updates its **"Active Pipeline Target"** badge whenever switching between:
   - 📦 **Inventory Data**
   - 💳 **Sales Data**
   - 🏢 **Buyer Data**
3. Verify URL reflects `?target=inventory`, `?target=sales`, or `?target=buyers`.

### 2. File Format Support & Thunk Routing (Issue 02)
1. Select **Inventory Data** in Quadrant 2 and drop [`01_inventory_manifest_packing_slip.png`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scanned_documents/01_inventory_manifest_packing_slip.png). Click **"Run AI Extraction"**.
   - Verifies: `.png` ingestion dispatches `uploadInventoryThunk`.
2. Select **Sales Data** and drop [`03_sales_wholesale_invoice_photo.jpg`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scanned_documents/03_sales_wholesale_invoice_photo.jpg). Click **"Run AI Extraction"**.
   - Verifies: `.jpg` photo invoice ingestion dispatches `uploadSalesThunk`.
3. Select **Buyer Data** and drop [`06_buyer_partner_intake_sheet.jpeg`](file:///Users/debashisroy/Documents/SpoilerAlert/test_files/scanned_documents/06_buyer_partner_intake_sheet.jpeg). Click **"Run AI Extraction"**.
   - Verifies: `.jpeg` format support and `uploadBuyerThunk` dispatch.

### 3. Scanned Documents Roster Target Lineage (Issue 03)
1. Inspect the **Scanned Documents Roster** in Quadrant 3.
2. Confirm each row displays its distinct colored target badge:
   - Blue for **Inventory Data**
   - Emerald for **Sales Data**
   - Purple for **Buyer Data**
3. Click **"Map Schema"** on a historical row of a different target:
   - Confirms auto-switching workbench target and hydration of corresponding Redux slice (`setInventoryParsedResult`, `setSalesParsedResult`, or `setBuyerParsedResult`).

### 4. In-Situ Import Commit Handshake (Issue 04)
1. In Quadrant 4, verify the **In-Situ Schema Field Mapper** (`GridMapperTable`) reflects the target schema.
2. Confirm the mapping and click **"Confirm & Ingest"**.
3. Verify the emerald completion banner displays:
   - Imported record count
   - Generated Lot/Transaction/Buyer IDs
   - Source image filename
4. Test the two CTAs:
   - **"Scan Another Document"**: Resets dropzone and mapper state.
   - **"View in Pipeline Table →"**: Navigates directly to the target pipeline view.

---

## 🔄 Re-generating Test Images

To re-generate or modify any image parameters (fonts, colors, sample rows):

```bash
python3 test_files/generate_test_images.py
```
