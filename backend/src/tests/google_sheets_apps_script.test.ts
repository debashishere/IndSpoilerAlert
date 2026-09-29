import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import GoogleSheetsSyncConfig from '../models/GoogleSheetsSyncConfig';
import Supplier from '../models/Supplier';
import { generateGoogleAppsScript } from '../services/googleAppsScriptGenerator';

describe('Google Apps Script Generator & Test Ping API', () => {
  let supplierId: string;
  const testIngressKey = 'test-ingress-script-key-777888';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'GAS_GEN_TEST' });
    const supplier = await Supplier.create({
      name: 'GAS Generator Test Supplier',
      companyCode: 'GAS_GEN_TEST',
      preferredDisposition: 'sell',
      active: true
    });
    supplierId = supplier._id.toString();

    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await GoogleSheetsSyncConfig.create({
      supplierId,
      spreadsheetId: 'sheet-gas-123',
      sheetName: 'Inventory Sheet',
      ingressKey: testIngressKey,
      syncStatus: 'idle',
      lastSyncMetrics: {
        totalRows: 0,
        inserted: 0,
        updated: 0,
        depleted: 0,
        errors: []
      }
    });
  });

  afterAll(async () => {
    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await Supplier.deleteMany({ companyCode: 'GAS_GEN_TEST' });
  });

  describe('Slice 1: Apps Script Generator Utility (generateGoogleAppsScript)', () => {
    it('produces valid executable Apps Script containing webhook endpoint, test ping endpoint, and cryptographic ingress key', () => {
      const script = generateGoogleAppsScript({
        supplierId,
        ingressKey: testIngressKey,
        webhookUrl: 'https://app.spoileralert.com/api/v1/ingestion/google-sheets/webhook',
        testPingUrl: 'https://app.spoileralert.com/api/v1/ingestion/google-sheets/test-ping',
        sheetName: 'Inventory Sheet',
        debounceSeconds: 5
      });

      expect(typeof script).toBe('string');
      expect(script).toContain('https://app.spoileralert.com/api/v1/ingestion/google-sheets/webhook');
      expect(script).toContain('https://app.spoileralert.com/api/v1/ingestion/google-sheets/test-ping');
      expect(script).toContain(testIngressKey);
      expect(script).toContain('X-Ingress-Key');
    });

    it('injects native Google Sheets toolbar menu with "SpoilerAlert OS ⚡ > Sync to Platform Now" and "Verify Connection"', () => {
      const script = generateGoogleAppsScript({
        supplierId,
        ingressKey: testIngressKey,
        webhookUrl: 'https://app.spoileralert.com/api/v1/ingestion/google-sheets/webhook',
        testPingUrl: 'https://app.spoileralert.com/api/v1/ingestion/google-sheets/test-ping'
      });

      expect(script).toContain('function onOpen(');
      expect(script).toContain('createMenu("SpoilerAlert OS ⚡")');
      expect(script).toContain('.addItem("Sync to Platform Now", "syncToPlatform")');
      expect(script).toContain('.addItem("Verify Connection", "testConnection")');
      expect(script).toContain('.addToUi()');
    });

    it('incorporates installable onChange / onEdit handler with a 5-second debounce window', () => {
      const script = generateGoogleAppsScript({
        supplierId,
        ingressKey: testIngressKey,
        webhookUrl: 'https://app.spoileralert.com/api/v1/ingestion/google-sheets/webhook',
        testPingUrl: 'https://app.spoileralert.com/api/v1/ingestion/google-sheets/test-ping',
        debounceSeconds: 5
      });

      expect(script).toContain('function onEdit(e)');
      expect(script).toContain('function onChange(e)');
      expect(script).toContain('function installTriggers()');
      expect(script).toContain('ScriptApp.newTrigger');
      expect(script).toContain('DEBOUNCE_SECONDS: 5');
      expect(script).toContain('Utilities.sleep');
      expect(script).toContain('CacheService.getScriptCache()');
    });
  });

  describe('Slice 2: Script Template Endpoint (GET /api/v1/ingestion/google-sheets/script-template)', () => {
    it('returns 400 Bad Request when supplierId parameter is missing', async () => {
      const res = await request(app)
        .get('/api/v1/ingestion/google-sheets/script-template');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/supplierId is required/i);
    });

    it('returns 404 Not Found when no GoogleSheetsSyncConfig exists for the given supplierId', async () => {
      const nonExistentSupplierId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/v1/ingestion/google-sheets/script-template?supplierId=${nonExistentSupplierId}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/sync configuration not found/i);
    });

    it('returns 200 OK with personalized executable script and sync configuration metadata', async () => {
      const res = await request(app)
        .get(`/api/v1/ingestion/google-sheets/script-template?supplierId=${supplierId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ingressKey).toBe(testIngressKey);
      expect(res.body.webhookUrl).toContain('/api/v1/ingestion/google-sheets/webhook');
      expect(res.body.testPingUrl).toContain('/api/v1/ingestion/google-sheets/test-ping');
      expect(res.body.script).toBeDefined();
      expect(res.body.script).toContain(testIngressKey);
      expect(res.body.script).toContain('createMenu("SpoilerAlert OS ⚡")');
    });
  });

  describe('Slice 3: Connectivity Test Ping Endpoint (POST /api/v1/ingestion/google-sheets/test-ping)', () => {
    it('returns 401 Unauthorized when X-Ingress-Key header is missing', async () => {
      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/test-ping')
        .send({ spreadsheetId: 'sheet-gas-123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/unauthorized|ingress key/i);
    });

    it('returns 401 Unauthorized when X-Ingress-Key is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/test-ping')
        .set('X-Ingress-Key', 'invalid-test-ping-key')
        .send({ spreadsheetId: 'sheet-gas-123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/unauthorized|invalid/i);
    });

    it('returns 200 OK with connection verification and supplier metadata when key is valid', async () => {
      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/test-ping')
        .set('X-Ingress-Key', testIngressKey)
        .send({
          spreadsheetId: 'sheet-gas-123',
          sheetName: 'Inventory Sheet'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('connected');
      expect(res.body.supplierName).toBe('GAS Generator Test Supplier');
      expect(res.body.message).toMatch(/ready for sync/i);
      expect(res.body.spreadsheetId).toBe('sheet-gas-123');
    });
  });
});


