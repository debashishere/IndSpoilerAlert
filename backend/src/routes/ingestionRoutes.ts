import { Router } from 'express';
import {
  handleGoogleSheetsWebhook,
  getScriptTemplate,
  testPingGoogleSheets,
  getSampleRows,
  syncNowGoogleSheets,
  saveMappingHandshake
} from '../controllers/googleSheetsIngressController';

const router = Router();

// POST /api/v1/ingestion/google-sheets/webhook
router.post('/google-sheets/webhook', handleGoogleSheetsWebhook);

// GET /api/v1/ingestion/google-sheets/script-template
router.get('/google-sheets/script-template', getScriptTemplate);

// POST /api/v1/ingestion/google-sheets/test-ping
router.post('/google-sheets/test-ping', testPingGoogleSheets);

// GET /api/v1/ingestion/google-sheets/sample-rows
router.get('/google-sheets/sample-rows', getSampleRows);

// POST /api/v1/ingestion/google-sheets/mapping
router.post('/google-sheets/mapping', saveMappingHandshake);

// POST /api/v1/ingestion/google-sheets/sync-now
router.post('/google-sheets/sync-now', syncNowGoogleSheets);

export default router;



