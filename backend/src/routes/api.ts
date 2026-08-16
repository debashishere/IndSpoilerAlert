import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Controllers
import * as generalController from '../controllers/generalController';
import * as ingestController from '../controllers/ingestController';
import * as inventoryController from '../controllers/inventoryController';
import * as marketplaceController from '../controllers/marketplaceController';
import * as offersController from '../controllers/offersController';
import * as analyticsController from '../controllers/analyticsController';
import * as liquidationController from '../controllers/liquidationController';
import settingsRoutes from './settingsRoutes';
import trackingRoutes from './trackingRoutes';
import emailAssetRoutes from './emailAssetRoutes';
import quickBidRoutes from './quickBidRoutes';
import emailThreadRoutes from './emailThreadRoutes';
import oauthRoutes from './oauthRoutes';
import emailTemplateRoutes from './emailTemplateRoutes';
import * as emailTemplateController from '../controllers/emailTemplateController';
import { authenticateToken } from '../middleware/authMiddleware';






import supplierRouter from './supplierRoutes';
import marketplaceRouter from './marketplaceRoutes';
import buyerListRoutes from './buyerListRoutes';

const router = Router();

// Route Namespaces (0083)
router.use('/v1/supplier', supplierRouter);
router.use('/v1/marketplace', marketplaceRouter);
router.use('/buyer-lists', buyerListRoutes);


// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// TODO: Move multer to respective config file
// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowedExt = ext === '.csv' || ext === '.pdf';
    const isAllowedMime = /pdf|csv|excel|spreadsheet|text\/plain|octet-stream/.test(file.mimetype);
    if (isAllowedExt || isAllowedMime) {
      return cb(null, true);
    }
    cb(new Error('Only PDF and CSV files are allowed.'));
  }
});

// General
router.get('/health', generalController.getHealth);
router.post('/seed', generalController.seedDataController);
router.get('/suppliers', generalController.getSuppliers);
router.get('/buyers', generalController.getBuyers);
router.post('/buyers', generalController.createBuyer);
router.get('/buyers/:id', generalController.getBuyerById);
router.put('/buyers/:id', generalController.updateBuyer);
router.patch('/buyers/:id/deactivate', generalController.deactivateBuyer);
router.patch('/buyers/:id/reactivate', generalController.reactivateBuyer);
router.get('/imports', generalController.getImports);
router.get('/sidecar/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Sidecar proxy is healthy' });
});

// Liquidation Cycles
router.post('/liquidation-cycles', liquidationController.createLiquidationCycle);
router.get('/liquidation-cycles', liquidationController.getLiquidationCycles);
router.put('/liquidation-cycles/:id', liquidationController.updateLiquidationCycle);

// Liquidation Automations
router.post('/liquidation-automations', liquidationController.createLiquidationAutomation);
router.get('/liquidation-automations', liquidationController.getLiquidationAutomations);
router.put('/liquidation-automations/:id', liquidationController.updateLiquidationAutomation);
router.patch('/liquidation-automations/:id/status', liquidationController.patchLiquidationAutomationStatus);
router.delete('/liquidation-automations/:id', liquidationController.deleteLiquidationAutomation);
router.post('/liquidation-automations/preview-email', liquidationController.previewEmail);
router.post('/liquidation-automations/:id/trigger', liquidationController.triggerLiquidationAutomation);
router.get('/automation-runs', liquidationController.getAutomationRuns);
router.post('/automation-runs/:id/force-expire', liquidationController.forceExpireRun);
router.get('/liquidation-automations/runs/:runId', liquidationController.getAutomationRunById);
router.get('/liquidation-automations/:id/runs', liquidationController.getAutomationRunsByCampaignId);
router.get('/liquidation-automations/:id', liquidationController.getLiquidationAutomationById);
// Ingestion
router.post('/ingest/upload', upload.single('file'), ingestController.uploadIngestFile);
router.get('/ingest/jobs/:id', ingestController.getJobStatus);
router.post('/ingest/callback', ingestController.ingestCallback);
router.post('/ingest/confirm', ingestController.confirmIngest);
router.post('/ingest/confirm-sales', ingestController.confirmSalesIngest);
router.post('/ingest/confirm-buyer', ingestController.confirmBuyerIngest);



// Inventory
router.get('/inventory', inventoryController.getInventory);
router.get('/inventory/facets', inventoryController.getInventoryFacets);
router.get('/sales', authenticateToken, inventoryController.getSales);
router.put('/inventory/lot/:id', inventoryController.updateLot);


router.post('/inventory/lot/:id/assess-risk', inventoryController.assessRisk);
router.post('/inventory/lot/:id/compliance', upload.single('file'), inventoryController.uploadComplianceDoc);
router.post('/inventory/:id/bids/enable', inventoryController.enableBidding);
router.get('/inventory/:id/bids', inventoryController.getBids);
router.post('/inventory/:id/bids/:bidId/award', inventoryController.awardBid);
router.post('/inventory/:id/donate', inventoryController.donateInventory);
router.post('/inventory/:id/recycle', inventoryController.recycleInventory);
router.get('/inventory/:id/activities', inventoryController.getActivities);
router.post('/inventory/:id/activities', inventoryController.createActivity);

// Marketplace
router.post('/inventory/opportunity/:id/pricing/recommend', marketplaceController.suggestPricing);
router.get('/marketplace/listing/:id/matches', marketplaceController.recommendBuyers);
router.post('/marketplace/listing/:id/bids', marketplaceController.placeBid);

// Offers & Negotiation
router.get('/bids', offersController.getBids);
router.use('/bids', quickBidRoutes);
router.post('/offers/:id/message', offersController.sendMessage);
router.post('/offers/:id/reject', offersController.rejectBid);



// Logistics & Freight
router.get('/shipments', inventoryController.getShipments);
router.get('/shipments/:id', inventoryController.getShipmentById);
router.post('/shipments/:id/confirm-appointment', inventoryController.confirmAppointment);
router.post('/shipments/:id/status', inventoryController.updateShipmentStatus);
router.post('/shipments/:id/temperature', inventoryController.addShipmentTemperatureLog);

// Analytics
router.get('/analytics/summary', analyticsController.getAnalyticsSummary);

// Allergens & Exclusions Management
router.put('/products/:id/allergens', generalController.updateProductAllergens);
router.put('/buyers/:id/exclusions', generalController.updateBuyerExclusions);

// Settings, Tracking, Assets & Email Threads
router.use('/settings', settingsRoutes);
router.use('/tracking', trackingRoutes);
router.use('/email-assets', emailAssetRoutes);
router.use('/email-threads', emailThreadRoutes);
router.use('/oauth', oauthRoutes);
router.use('/email-templates', emailTemplateRoutes);
router.post('/emails/broadcast-preview', emailTemplateController.generateBroadcastPreview);
router.post('/emails/dispatch-broadcast', emailTemplateController.dispatchBroadcast);

export default router;

