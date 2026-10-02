import { Router } from 'express';
import {
  handleGoogleSheetsWebhook,
  getScriptTemplate,
  testPingGoogleSheets,
  getSampleRows,
  syncNowGoogleSheets,
  saveMappingHandshake,
  getConnectedSheetsRoster,
  disconnectGoogleSheet
} from '../controllers/googleSheetsIngressController';
import {
  testPingZapier,
  handleZapierWebhook,
  saveZapierMappingHandler,
  getZapierRosterHandler,
  disconnectZapierFeedHandler
} from '../controllers/zapierIngressController';

const router = Router();

// Zapier Ingestion Endpoints
// POST /api/v1/ingestion/zapier/webhook
router.post('/zapier/webhook', handleZapierWebhook);

// GET /api/v1/ingestion/zapier/roster
router.get('/zapier/roster', getZapierRosterHandler);

// POST /api/v1/ingestion/zapier/test-ping
router.post('/zapier/test-ping', testPingZapier);

// POST /api/v1/ingestion/zapier/mapping
router.post('/zapier/mapping', saveZapierMappingHandler);

// DELETE /api/v1/ingestion/zapier/disconnect
router.delete('/zapier/disconnect', disconnectZapierFeedHandler);





// POST /api/v1/ingestion/google-sheets/webhook
router.post('/google-sheets/webhook', handleGoogleSheetsWebhook);

// GET /api/v1/ingestion/google-sheets/roster
router.get('/google-sheets/roster', getConnectedSheetsRoster);

// DELETE /api/v1/ingestion/google-sheets/disconnect
router.delete('/google-sheets/disconnect', disconnectGoogleSheet);

// GET /api/v1/ingestion/google-sheets/script-template
router.get('/google-sheets/script-template', getScriptTemplate);

// POST /api/v1/ingestion/google-sheets/test-ping
router.post('/google-sheets/test-ping', testPingGoogleSheets);

// GET /api/v1/ingestion/google-sheets/sample-rows
router.get('/google-sheets/sample-rows', getSampleRows);

// POST /api/v1/ingestion/google-sheets/mapping
router.post('/google-sheets/mapping', saveMappingHandshake);
router.post('/google-sheets/save-mapping', saveMappingHandshake);

// POST /api/v1/ingestion/google-sheets/sync-now
router.post('/google-sheets/sync-now', syncNowGoogleSheets);

export default router;



