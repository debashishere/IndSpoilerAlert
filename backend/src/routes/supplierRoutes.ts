import { Router } from 'express';
import * as generalController from '../controllers/generalController';
import * as inventoryController from '../controllers/inventoryController';
import * as liquidationController from '../controllers/liquidationController';
import * as ingestController from '../controllers/ingestController';

import * as marketplaceController from '../controllers/marketplaceController';

import { optionalAuthToken } from '../middleware/authMiddleware';

const supplierRouter = Router();

supplierRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', namespace: 'supplier' });
});

supplierRouter.get('/current', optionalAuthToken, generalController.getCurrentSupplier);
supplierRouter.get('/suppliers', optionalAuthToken, generalController.getSuppliers);

supplierRouter.get('/inventory', inventoryController.getInventory);
supplierRouter.get('/inventory/facets', inventoryController.getInventoryFacets);
supplierRouter.get('/liquidation-cycles', liquidationController.getLiquidationCycles);
supplierRouter.get('/liquidation-automations', liquidationController.getLiquidationAutomations);

// 0088 Supplier Bid Award & Inventory Volume Recalculation Route
supplierRouter.post('/bids/:id/award', inventoryController.awardBidByOfferId);

// 0084 Publication Invariant Route
supplierRouter.post('/lots/:id/publish-marketplace', marketplaceController.publishMarketplaceListing);

export default supplierRouter;



// Test 
console.log("--------------------------------loaded Suppliers Routes")
