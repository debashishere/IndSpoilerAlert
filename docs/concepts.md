# Product Concepts and Feature Designs

This document contains case studies, problem definitions, and design documentation for key product features in the Spoiler Alert Inventory Platform.

## Reference Case Studies
1. [Conagra Data-Driven Decisions](https://www.spoileralert.com/resources/data-driven-decisions-made-faster-at-conagra)
2. [Danone Markdown Digitization](https://www.spoileralert.com/resources/spoiler-alert-digitizes-danone-markdown)
3. [Ferrara Efficiency & Scale](https://www.spoileralert.com/resources/sweet-success-ferraras-efficiency-scale)
4. [Campbell Soup Co. Partnership](https://www.spoileralert.com/resources/campbell-soup-co-partners-with-spoiler-alert)
5. [A Day in the Life: Hormel](https://www.spoileralert.com/resources/a-day-in-the-life-hormel)
6. [Consistent Sales Processes for Excess Inventory](https://www.spoileralert.com/resources/creating-a-consistent-sales-process-for-excess-inventory)
7. [Land O'Lakes on Fast Company](https://www.spoileralert.com/resources/land-olakes-fast-company)
8. [Sausages & Sustainability at Johnsonville](https://www.spoileralert.com/resources/sausages-sustainability-streamlined-sales-johnsonville)

---

## Feature 1: The "Messy Data" AI Normalizer (Automated Ingestion)

### The Problem
CPG brands send surplus inventory data in wildly different formats (PDFs, messy CSVs, inconsistent naming conventions like "Ktchp 24oz" vs. "Tomato Ketchup 24 oz").

### The Solution Design
An API pipeline that accepts unstructured or messy mock inventory data and uses a parsing service (assisted by AI) to parse, clean, categorize, and output a standardized JSON payload.

- **UI Component**: A section to upload, preview, and map fields dynamically before final ingestion.
- **S3 / Chunk Processing (Future Scale)**: Stream files to S3, download chunk-by-chunk on the backend, and write records incrementally to avoid memory issues.
- **Docling Integration**: Prioritize table structure precision over speed. Disable default cell matching when columns are close-knit (e.g. Unit Price and Total) to prevent merging.
  - Options used: `TableFormerMode.ACCURATE` and `do_cell_matching = False`.

---

## Feature 2: Dynamic Discount Engine (Yield Optimization)

### The Problem
Determining the optimal discount for a surplus pallet to maximize COGS recovery before expiration, avoiding landfill waste.

### The Solution Design
An analytical optimization model that recommends discounts based on:
- `days_remaining`
- `quantity`
- `original_price`
- `category` (to estimate price elasticity)

- **Solver**: Utilizes a logistic model representing sell-through probability optimized via `scipy.optimize.minimize` (L-BFGS-B method) inside the Python sidecar.
- **Category Elasticity defaults**:
  - Dairy: -1.8
  - Produce: -2.2
  - Meat: -2.0
  - Dry Goods: -1.2
  - Beverages: -1.5

---

## Feature 3: Smart Buyer Matching (Demand Matching)

### The Problem
CPG suppliers need to notify the right buyers for a surplus batch quickly without spamming the entire mailing list.

### The Solution Design
An embedding-based recommendation pipeline that ranks secondary-market buyers based on:
1. Category preferences (e.g., "Short-dated Dairy", "Dry Goods")
2. Maximum transportation radius
3. Proximity to the distribution center (calculated via Haversine distance)
4. Score is returned for the top 5 highest-probability buyers.
