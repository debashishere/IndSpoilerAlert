import { Router } from 'express';
import * as generalController from '../controllers/generalController';
import * as inventoryController from '../controllers/inventoryController';
import * as liquidationController from '../controllers/liquidationController';
import * as ingestController from '../controllers/ingestController';

import * as marketplaceController from '../controllers/marketplaceController';

const supplierRouter = Router();

supplierRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', namespace: 'supplier' });
});

supplierRouter.get('/suppliers', generalController.getSuppliers);
supplierRouter.get('/inventory', inventoryController.getInventory);
supplierRouter.get('/inventory/facets', inventoryController.getInventoryFacets);
supplierRouter.get('/liquidation-cycles', liquidationController.getLiquidationCycles);
supplierRouter.get('/liquidation-automations', liquidationController.getLiquidationAutomations);

// 0088 Supplier Bid Award & Inventory Volume Recalculation Route
supplierRouter.post('/bids/:id/award', inventoryController.awardBidByOfferId);

// 0084 Publication Invariant Route
supplierRouter.post('/lots/:id/publish-marketplace', marketplaceController.publishMarketplaceListing);

export default supplierRouter;

