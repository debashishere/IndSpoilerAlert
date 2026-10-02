import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Supplier from '../models/Supplier';
import ZapierSyncConfig from '../models/ZapierSyncConfig';

import InventoryLot from '../models/InventoryLot';
import ProductMaster from '../models/ProductMaster';
import DistributionCenter from '../models/DistributionCenter';
import SupplierTemplate from '../models/SupplierTemplate';

describe('Zapier Ingress Seam - Slice 1: Authentication & Connectivity', () => {
  let supplierId: string;
  const validIngressKey = 'zap-test-key-slice-1';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'ZAP_SLICE1_SUP' });
    const supplier = await Supplier.create({
      name: 'Zapier Slice 1 Supplier',
      companyCode: 'ZAP_SLICE1_SUP',
      preferredDisposition: 'sell',
      active: true
    });
    supplierId = supplier._id.toString();

    await ZapierSyncConfig.deleteMany({ supplierId });
    await ZapierSyncConfig.create({
      supplierId,
      ingressKey: validIngressKey,
      connectedZaps: [],
      deliveryLogs: []
    });
  });

  afterAll(async () => {
    await Supplier.deleteMany({ companyCode: 'ZAP_SLICE1_SUP' });
    await ZapierSyncConfig.deleteMany({ supplierId });
  });

  it('rejects test-ping with 401 when X-Ingress-Key header is missing', async () => {
    const res = await request(app)
      .post('/api/v1/ingestion/zapier/test-ping')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Missing X-Ingress-Key/i);
  });

  it('rejects test-ping with 401 when X-Ingress-Key is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/ingestion/zapier/test-ping')
      .set('X-Ingress-Key', 'invalid-key-xyz')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Invalid X-Ingress-Key/i);
  });

  it('verifies connectivity and returns 200 with supplier details and latency when valid key is provided', async () => {
    const res = await request(app)
      .post('/api/v1/ingestion/zapier/test-ping')
      .set('X-Ingress-Key', validIngressKey)
      .send({ zapName: 'ERP to Warehouse Sync' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('connected');
    expect(res.body.supplierName).toBe('Zapier Slice 1 Supplier');
    expect(typeof res.body.latencyMs).toBe('number');
    expect(res.body.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe('Zapier Ingress Seam - Slice 2: Webhook Ingress & Normalization Seam', () => {
  let supplierId: string;
  const zapIngressKey = 'zap-test-key-slice-2';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'ZAP_SLICE2_SUP' });
    const supplier = await Supplier.create({
      name: 'Zapier Slice 2 Supplier',
      companyCode: 'ZAP_SLICE2_SUP',
      preferredDisposition: 'sell',
      active: true
    });
    supplierId = supplier._id.toString();

    await DistributionCenter.deleteMany({ supplierId });
    await DistributionCenter.create({
      supplierId,
      name: 'Zapier Distribution Hub',
      code: 'ZAP-DC-01',
      address: '456 Automation Way, Austin, TX',
      coordinates: { lat: 30.2672, lng: -97.7431 },
      coldStorage: true
    });

    await ZapierSyncConfig.deleteMany({ supplierId });
    await ZapierSyncConfig.create({
      supplierId,
      ingressKey: zapIngressKey,
      connectedZaps: [],
      deliveryLogs: []
    });
  });

  afterAll(async () => {
    await Supplier.deleteMany({ companyCode: 'ZAP_SLICE2_SUP' });
    await DistributionCenter.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await InventoryLot.deleteMany({ supplierId });
    await ZapierSyncConfig.deleteMany({ supplierId });
  });

  it('rejects webhook ingestion with 401 when X-Ingress-Key is missing or invalid', async () => {
    const res = await request(app)
      .post('/api/v1/ingestion/zapier/webhook')
      .send({ sku: 'ZAP-SKU-99', quantity: 50 });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('ingests single lot object, reconciles into ProductMaster/InventoryLot, and records delivery log', async () => {
    const payload = {
      zapId: 'zap-single-feed',
      zapName: 'Zapier Single Lot Inbound',
      sku: 'SKU-ZAP-SINGLE-1',
      description: 'Organic Cold-Pressed Juice',
      quantityCases: 75,
      costPerCase: 8.5,
      expirationDate: '2027-04-15',
      lotNumber: 'LOT-ZAP-S1',
      category: 'Beverages'
    };

    const res = await request(app)
      .post('/api/v1/ingestion/zapier/webhook')
      .set('X-Ingress-Key', zapIngressKey)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics.inserted).toBe(1);

    // Verify ProductMaster
    const product = await ProductMaster.findOne({ supplierId, sku: 'SKU-ZAP-SINGLE-1' });
    expect(product).not.toBeNull();
    expect(product?.description).toBe('Organic Cold-Pressed Juice');

    // Verify InventoryLot
    const lot = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-ZAP-S1' });
    expect(lot).not.toBeNull();
    expect(lot?.quantityCases).toBe(75);
    expect(lot?.availableQty).toBe(75);

    // Verify ZapierSyncConfig auto-registered the zap and appended a delivery log
    const config = await ZapierSyncConfig.findOne({ supplierId });
    expect(config).not.toBeNull();
    expect(config?.connectedZaps.length).toBe(1);
    expect(config?.connectedZaps[0].zapId).toBe('zap-single-feed');
    expect(config?.connectedZaps[0].zapName).toBe('Zapier Single Lot Inbound');
    expect(config?.deliveryLogs.length).toBe(1);
    expect(config?.deliveryLogs[0].httpStatus).toBe(200);
    expect(config?.deliveryLogs[0].status).toBe('success');
  });

  it('ingests array of lot objects and updates existing zap metrics and delivery logs', async () => {
    const payload = [
      {
        zapId: 'zap-array-feed',
        zapName: 'Zapier Batch Feed',
        sku: 'SKU-ZAP-BATCH-1',
        description: 'Artisan Sourdough Crackers',
        quantityCases: 120,
        costPerCase: 3.25,
        expirationDate: '2027-06-01',
        lotNumber: 'LOT-ZAP-B1',
        category: 'Dry Goods'
      },
      {
        zapId: 'zap-array-feed',
        zapName: 'Zapier Batch Feed',
        sku: 'SKU-ZAP-BATCH-2',
        description: 'Sea Salt Pita Crisps',
        quantityCases: 200,
        costPerCase: 2.9,
        expirationDate: '2027-07-01',
        lotNumber: 'LOT-ZAP-B2',
        category: 'Dry Goods'
      }
    ];

    const res = await request(app)
      .post('/api/v1/ingestion/zapier/webhook')
      .set('X-Ingress-Key', zapIngressKey)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics.inserted).toBe(2);

    const config = await ZapierSyncConfig.findOne({ supplierId });
    expect(config?.connectedZaps.length).toBe(2); // 'zap-single-feed' and 'zap-array-feed'
    expect(config?.deliveryLogs.length).toBe(2);
  });
});

describe('Zapier Ingress Seam - Slice 3: Mapping Handshake & Roster Telemetry', () => {
  let supplierId: string;
  const zapIngressKey = 'zap-test-key-slice-3';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'ZAP_SLICE3_SUP' });
    const supplier = await Supplier.create({
      name: 'Zapier Slice 3 Supplier',
      companyCode: 'ZAP_SLICE3_SUP',
      preferredDisposition: 'sell',
      active: true
    });
    supplierId = supplier._id.toString();

    await DistributionCenter.deleteMany({ supplierId });
    await DistributionCenter.create({
      supplierId,
      name: 'Austin Central DC',
      code: 'ATX-DC',
      address: '789 Warehouse Blvd, Austin, TX',
      coordinates: { lat: 30.2672, lng: -97.7431 },
      coldStorage: false
    });

    await ZapierSyncConfig.deleteMany({ supplierId });
    await ZapierSyncConfig.create({
      supplierId,
      ingressKey: zapIngressKey,
      connectedZaps: [
        {
          zapId: 'zap-existing-roster-1',
          zapName: 'Shopify Surplus Sync',
          triggerEvent: 'order_cancelled',
          status: 'active',
          lotCount: 0,
          lastSyncMetrics: {
            totalRows: 5,
            inserted: 5,
            updated: 0,
            depleted: 0,
            errors: []
          }
        }
      ],
      deliveryLogs: []
    });
  });

  afterAll(async () => {
    await Supplier.deleteMany({ companyCode: 'ZAP_SLICE3_SUP' });
    await DistributionCenter.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await InventoryLot.deleteMany({ supplierId });
    await SupplierTemplate.deleteMany({ supplierId });
    await ZapierSyncConfig.deleteMany({ supplierId });
  });

  it('rejects mapping request when columnMappings or identifier is missing', async () => {
    const res = await request(app)
      .post('/api/v1/ingestion/zapier/mapping')
      .send({ zapId: 'test-zap' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('saves per-zap column mapping and binds SupplierTemplate to ZapierSyncConfig', async () => {
    const mappingPayload = {
      supplierId,
      zapId: 'zap-custom-erp',
      zapName: 'NetSuite Surplus Stream',
      templateName: 'NetSuite Custom Lot Schema',
      columnMappings: {
        item_code: 'sku',
        item_title: 'description',
        case_count: 'quantityCases',
        best_by: 'expirationDate',
        batch_code: 'lotNumber',
        unit_cost: 'costPerCase'
      }
    };

    const res = await request(app)
      .post('/api/v1/ingestion/zapier/mapping')
      .set('X-Ingress-Key', zapIngressKey)
      .send(mappingPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.supplierTemplateId).toBeDefined();

    // Verify template was persisted in MongoDB
    const template = await SupplierTemplate.findById(res.body.supplierTemplateId);
    expect(template).not.toBeNull();
    expect(template?.templateName).toBe('NetSuite Custom Lot Schema');

    // Verify ZapierSyncConfig updated the connectedZap binding
    const config = await ZapierSyncConfig.findOne({ supplierId });
    const boundZap = config?.connectedZaps.find(z => z.zapId === 'zap-custom-erp');
    expect(boundZap).toBeDefined();
    expect(boundZap?.supplierTemplateId?.toString()).toBe(res.body.supplierTemplateId);
  });

  it('correctly normalizes payload using custom saved mapping when ingesting webhook', async () => {
    const webhookPayload = {
      zapId: 'zap-custom-erp',
      item_code: 'SKU-NETSUITE-01',
      item_title: 'Cold Brew Coffee Concentrate',
      case_count: 50,
      best_by: '2027-09-30',
      batch_code: 'LOT-NS-99',
      unit_cost: 12.0
    };

    const res = await request(app)
      .post('/api/v1/ingestion/zapier/webhook')
      .set('X-Ingress-Key', zapIngressKey)
      .send(webhookPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics.inserted).toBe(1);

    const product = await ProductMaster.findOne({ supplierId, sku: 'SKU-NETSUITE-01' });
    expect(product).not.toBeNull();
    expect(product?.description).toBe('Cold Brew Coffee Concentrate');

    const lot = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-NS-99' });
    expect(lot).not.toBeNull();
    expect(lot?.quantityCases).toBe(50);
  });

  it('retrieves connected Zap roster with computed lot counts and delivery logs', async () => {
    const res = await request(app)
      .get('/api/v1/ingestion/zapier/roster')
      .set('X-Ingress-Key', zapIngressKey);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.supplierId).toBe(supplierId);
    expect(Array.isArray(res.body.connectedZaps)).toBe(true);
    expect(res.body.connectedZaps.length).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.deliveryLogs)).toBe(true);

    const netSuiteZap = res.body.connectedZaps.find((z: any) => z.zapId === 'zap-custom-erp');
    expect(netSuiteZap).toBeDefined();
    expect(netSuiteZap.lotCount).toBeGreaterThanOrEqual(1);
  });
});

describe('Zapier Ingress Seam - Slice 4: Feed Disconnect & Lifecycle', () => {
  let supplierId: string;
  const zapIngressKey = 'zap-test-key-slice-4';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'ZAP_SLICE4_SUP' });
    const supplier = await Supplier.create({
      name: 'Zapier Slice 4 Supplier',
      companyCode: 'ZAP_SLICE4_SUP',
      preferredDisposition: 'sell',
      active: true
    });
    supplierId = supplier._id.toString();

    await ZapierSyncConfig.deleteMany({ supplierId });
    await ZapierSyncConfig.create({
      supplierId,
      ingressKey: zapIngressKey,
      connectedZaps: [
        {
          zapId: 'zap-to-disconnect-1',
          zapName: 'Staging Legacy Feed',
          status: 'active',
          lastSyncMetrics: { totalRows: 0, inserted: 0, updated: 0, depleted: 0, errors: [] }
        },
        {
          zapId: 'zap-staying-active',
          zapName: 'Active Production Feed',
          status: 'active',
          lastSyncMetrics: { totalRows: 0, inserted: 0, updated: 0, depleted: 0, errors: [] }
        }
      ],
      deliveryLogs: []
    });
  });

  afterAll(async () => {
    await Supplier.deleteMany({ companyCode: 'ZAP_SLICE4_SUP' });
    await ZapierSyncConfig.deleteMany({ supplierId });
  });

  it('rejects disconnect when zapId or auth is missing', async () => {
    const res = await request(app)
      .delete('/api/v1/ingestion/zapier/disconnect')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('successfully disconnects a Zap feed from connectedZaps', async () => {
    const res = await request(app)
      .delete('/api/v1/ingestion/zapier/disconnect')
      .set('X-Ingress-Key', zapIngressKey)
      .send({ zapId: 'zap-to-disconnect-1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.remainingZaps).toBe(1);

    // Verify in database
    const config = await ZapierSyncConfig.findOne({ supplierId });
    expect(config?.connectedZaps.length).toBe(1);
    expect(config?.connectedZaps[0].zapId).toBe('zap-staying-active');
  });

  it('successfully archives a Zap feed when action is archive', async () => {
    const res = await request(app)
      .delete('/api/v1/ingestion/zapier/disconnect')
      .set('X-Ingress-Key', zapIngressKey)
      .send({ zapId: 'zap-staying-active', action: 'archive' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/archived/i);

    const config = await ZapierSyncConfig.findOne({ supplierId });
    const archivedZap = config?.connectedZaps.find(z => z.zapId === 'zap-staying-active');
    expect(archivedZap).toBeDefined();
    expect(archivedZap?.status).toBe('archived');
  });
});



