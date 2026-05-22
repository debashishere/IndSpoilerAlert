# Decoupled Sales Ingestion Model

To support importing legacy, off-platform, or third-party closeout sales spreadsheets and PDF invoices, we decided to introduce a standalone `Sale` collection and model, rather than reusing the transactional `Award` model.

### Context

The existing `Award` model represents the final, successful stage of the active marketplace bidding pipeline. It requires strict references to a `MarketplaceListing` and an `Offer` (Bid) to enforce transaction validity. However, spreadsheet imports of completed closeout sales do not originate from live system auctions, meaning they lack system-generated `listingId` and `offerId` fields.

### Rationale

- **Avoid Schema Contamination**: Loosening constraints on the `Award` model or creating mock listings and offers to satisfy foreign-key requirements would pollute the database with dummy records and complicate analytics.
- **Dynamic Identification Coupling**: The standalone `Sale` model stores text identifiers (like `lotNumber` and `sku`). It dynamically links to `InventoryLot` and `ProductMaster` records when they match, but remains valid even if the physical inventory lot has already been deleted or was never tracked in this system.
- **Fulfillment & Logistics Mapping**: A separate collection allows for independent status columns on the Sales Kanban board (e.g. `Scheduled`, `Confirmed`, `In Transit`, `Delivered`) based on shipment status, without affecting active negotiation states in the bidding system.
- **Clean Ingestion Mapping**: Having a separate model makes it simple to map columns during ingestion (e.g., mapping buyer email, price, quantity, and lot number) to a flat schema, mirroring real-world ERP closeout sales export formats.
