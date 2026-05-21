# Distressed Inventory Orchestration Domain Model

To support product-grade features and accommodate the operational complexities of leading CPG manufacturers (as seen in Conagra, Hormel, Danone, Ferrara, and Land O'Lakes), we decided to shift from a naive `InventoryItem -> Bid -> Transaction` schema to a rich, decoupled domain model of 18 collections organized across four bounded contexts:

1. **Inventory Intelligence**: `Supplier`, `DistributionCenter`, `ProductMaster`, `InventoryLot`, `InventoryRisk`, `SupplierTemplate`, `DocumentImport`
2. **Disposition Management**: `Opportunity`, `PricingRecommendation`
3. **Marketplace & Fulfillment**: `MarketplaceListing`, `Buyer`, `BuyerMatch`, `Offer`, `Award`, `Shipment`, `Donation`, `Disposal`
4. **Analytics & Sustainability**: `AnalyticsSnapshot`

### Rationale

- **Avoid Duplication**: Splitting products (`ProductMaster`) and warehouse locations (`DistributionCenter`) from individual batches (`InventoryLot`) prevents redundant storage and represents real-world supply chains.
- **Traceability (Lots & Opportunities)**: A single lot of food or goods has production dates, batch numbers, and expirations. An operator might choose to split a lot, group lots, or decide different actions (Sell vs. Donate vs. Recycle) for different proportions of a lot. Decoupling the physical inventory (`InventoryLot`) from the commercial listing (`MarketplaceListing` via `Opportunity`) is essential for this workflow.
- **Persisted AI Recommendations**: Both pricing decay curves (`PricingRecommendation`) and semantic buyer ranks (`BuyerMatch`) are computationally heavy. Persisting them allows for low-latency retrieval, historical audit logging, and offline retraining of models.
- **Differentiated Disposals**: B2B closeout sales (`Offer`, `Award`, `Shipment`), charity redirections (`Donation`), and waste operations (`Disposal`) have completely different schemas, compliance requirements, and tax implications, demanding dedicated structures.
