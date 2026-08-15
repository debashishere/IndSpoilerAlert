import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import * as ingestService from '../services/ingestService';

describe('Ingestion Confirm and Templates API', () => {
  let supplierId: string;
  let documentId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }
    // Ensure models are registered




    const Supplier = mongoose.model('Supplier');

    const DistributionCenter = mongoose.model('DistributionCenter');
    const DocumentImport = mongoose.model('DocumentImport');

    // Seed dummy supplier safely handling duplicates
    await Supplier.deleteMany({ companyCode: 'TSUPING' });
    const supp = await Supplier.create({
      name: 'Test Supplier Ingest',
      companyCode: 'TSUPING',
      preferredDisposition: 'sell'
    });

    supplierId = supp._id.toString();

    // Seed distribution center
    await DistributionCenter.create({
      supplierId: supp._id,
      name: 'Test Midwest DC Ingest',
      code: 'TSUPING-MW-DC',
      address: '100 Logistics Way, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });

    // Seed document import
    const doc = await DocumentImport.create({
      fileName: 'test_invoice.csv',
      status: 'parsed',
      rawGrid: [
        ['SKU_Col', 'Description_Col', 'Qty_Col', 'Exp_Col', 'Price_Col'],
        ['SKU-001', 'Ktchp 24oz', '100', '2026-12-31', '2.50'],
        ['SKU-002', 'Dairy Creamer 1L', '50', '2026-11-30', '4.00']
      ],
      suggestedMapping: {}
    });
    documentId = doc._id.toString();
  });

  afterAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const DocumentImport = mongoose.model('DocumentImport');
    const SupplierTemplate = mongoose.model('SupplierTemplate');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Buyer = mongoose.model('Buyer');
    const BuyerList = mongoose.model('BuyerList');

    await Supplier.deleteMany({ name: 'Test Supplier Ingest' });
    await DistributionCenter.deleteMany({ name: 'Test Midwest DC Ingest' });
    await DocumentImport.deleteMany({ fileName: { $in: ['test_invoice.csv', 'test_no_sku.csv', 'test_extra_fields.csv', 'test_buyers.csv', 'comment_cases.csv'] } });
    await SupplierTemplate.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await InventoryLot.deleteMany({ supplierId });
    await Buyer.deleteMany({ email: { $in: ['buyer1@acme.com', 'buyer2@beta.com', 'buyer3@gamma.com'] } });
    await BuyerList.deleteMany({ name: 'Target VIP List' });

    await mongoose.disconnect();
  });

  it('should confirm ingestion, normalize product names, and save SupplierTemplate', async () => {
    const res = await request(app)
      .post('/api/ingest/confirm')
      .send({
        documentId,
        supplierId,
        mappings: {
          sku: 'SKU_Col',
          description: 'Description_Col',
          quantity: 'Qty_Col',
          expirationDate: 'Exp_Col',
          originalPrice: 'Price_Col'
        },
        saveTemplate: true,
        templateName: 'Test Supplier Template Ingest'
      });

    expect(res.status).toBe(200);
    expect(res.body.countImported).toBe(2);
    expect(res.body.lotIds).toHaveLength(2);

    // Verify template was saved
    const SupplierTemplate = mongoose.model('SupplierTemplate');
    const template = await SupplierTemplate.findOne({ supplierId });
    expect(template).toBeTruthy();
    expect(template?.templateName).toBe('Test Supplier Template Ingest');
    expect(template?.columnMappings.get('sku')).toBe('SKU_Col');

    // Verify product master and inventory lots were created
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');

    const products = await ProductMaster.find({ supplierId });
    expect(products).toHaveLength(2);
    
    const ketchup = products.find(p => p.sku === 'SKU-001');
    expect(ketchup).toBeTruthy();
    expect(ketchup?.description).toBe('Ketchup');
    expect(ketchup?.category).toBe('Dry Goods');

    const creamer = products.find(p => p.sku === 'SKU-002');
    expect(creamer).toBeTruthy();
    expect(creamer?.description).toBe('Dairy Creamer');
    expect(creamer?.category).toBe('Dairy');

    const lots = await InventoryLot.find({ supplierId });
    expect(lots).toHaveLength(2);
    expect(lots[0].status).toBe('pending');
    expect(lots[0].quantityCases).toBe(100);
    expect(lots[0].availableQty).toBe(100);
    expect(lots[0].costPerCase).toBe(2.50);
  });

  it('should confirm ingestion, fallback to generated SKU when SKU mapping is empty, and map custom lotNumber and productionDate', async () => {
    const DocumentImport = mongoose.model('DocumentImport');
    const docWithNoSku = await DocumentImport.create({
      fileName: 'test_no_sku.csv',
      status: 'parsed',
      rawGrid: [
        ['Desc_Col', 'Qty_Col', 'Exp_Col', 'Price_Col', 'Lot_Col', 'Mfg_Col'],
        ['Greek Yogurt 32oz', '140', '2026-03-29', '18.86', 'LOT264714', '2026-01-28']
      ],
      suggestedMapping: {}
    });

    const res = await request(app)
      .post('/api/ingest/confirm')
      .send({
        documentId: docWithNoSku._id.toString(),
        supplierId,
        mappings: {
          sku: '',
          description: 'Desc_Col',
          quantity: 'Qty_Col',
          expirationDate: 'Exp_Col',
          originalPrice: 'Price_Col',
          lotNumber: 'Lot_Col',
          productionDate: 'Mfg_Col'
        },
        saveTemplate: false
      });

    expect(res.status).toBe(200);
    expect(res.body.countImported).toBe(1);

    // Verify the generated SKU and correct mapped fields
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');

    const product = await ProductMaster.findOne({ supplierId, sku: 'GREEK-YOGURT-32OZ' });
    expect(product).toBeTruthy();
    expect(product?.description).toBe('Greek Yogurt'); // Sidecar normalized name
    expect(product?.category).toBe('Dairy');           // Sidecar category

    const lot = await InventoryLot.findOne({ productId: product?._id });
    expect(lot).toBeTruthy();
    expect(lot?.lotNumber).toBe('LOT264714'); // custom mapped lotNumber
    expect(lot?.productionDate?.toISOString().split('T')[0]).toBe('2026-01-28'); // custom mapped productionDate
  });

  it('should confirm ingestion with Category, List Price, Warehouse, and store unmapped columns as attributes', async () => {
    const DocumentImport = mongoose.model('DocumentImport');
    const docWithExtraFields = await DocumentImport.create({
      fileName: 'test_extra_fields.csv',
      status: 'parsed',
      rawGrid: [
        ['Desc_Col', 'Qty_Col', 'Exp_Col', 'Cost_Col', 'Cat_Col', 'ListPrice_Col', 'Warehouse_Col', 'CasePack_Col'],
        ['Greek Yogurt Dallas 32oz', '140', '2026-03-29', '18.86', 'Dairy', '27.35', 'Dallas DC', '12']
      ],
      suggestedMapping: {}
    });

    const res = await request(app)
      .post('/api/ingest/confirm')
      .send({
        documentId: docWithExtraFields._id.toString(),
        supplierId,
        mappings: {
          sku: '',
          description: 'Desc_Col',
          quantity: 'Qty_Col',
          expirationDate: 'Exp_Col',
          originalPrice: 'Cost_Col',
          category: 'Cat_Col',
          standardSellPrice: 'ListPrice_Col',
          warehouse: 'Warehouse_Col'
        },
        saveTemplate: false
      });

    expect(res.status).toBe(200);
    expect(res.body.countImported).toBe(1);

    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const DistributionCenter = mongoose.model('DistributionCenter');

    // Verify ProductMaster category is correctly mapped
    const product = await ProductMaster.findOne({ supplierId, sku: 'GREEK-YOGURT-DALLAS-32OZ' });
    expect(product).toBeTruthy();
    expect(product?.category).toBe('Dairy'); // Explicitly mapped category, not sidecar default!

    // Verify custom DistributionCenter was dynamically created
    const customDC = await DistributionCenter.findOne({ supplierId, name: 'Dallas DC' });
    expect(customDC).toBeTruthy();
    expect(customDC?.name).toBe('Dallas DC');

    // Verify InventoryLot standardSellPrice, distributionCenterId, and attributes
    const lot = await InventoryLot.findOne({ productId: product?._id });
    expect(lot).toBeTruthy();
    expect(lot?.distributionCenterId.toString()).toBe(customDC?._id.toString());
    expect(lot?.standardSellPrice).toBe(27.35); // Explicitly mapped list price
    expect(lot?.attributes?.get('CasePack_Col')).toBe('12'); // Unmapped column stored in attributes!
  });

  it('should translate unmapped columns into normalized attributes and preserve rawAttributes during confirmIngestion', async () => {
    const DocumentImport = mongoose.model('DocumentImport');
    const docWithSemanticFields = await DocumentImport.create({
      fileName: 'semantic_invoice.csv',
      status: 'parsed',
      rawGrid: [
        ['Desc_Col', 'Qty_Col', 'Exp_Col', 'Price_Col', 'StorageTemp_C', 'Kosher Status'],
        ['Frozen Berry Pack 10oz', '100', '2026-10-10', '15.00', '-18', 'YES']
      ],
      supplierId
    });

    const res = await request(app)
      .post('/api/ingest/confirm')
      .send({
        documentId: docWithSemanticFields._id.toString(),
        supplierId,
        mappings: {
          description: 'Desc_Col',
          quantity: 'Qty_Col',
          expirationDate: 'Exp_Col',
          originalPrice: 'Price_Col'
        },
        saveTemplate: false
      });

    expect(res.status).toBe(200);
    expect(res.body.countImported).toBe(1);

    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');

    const product = await ProductMaster.findOne({ supplierId, sku: 'FROZEN-BERRY-PACK-10OZ' });
    expect(product).toBeTruthy();


    const lot = await InventoryLot.findOne({ productId: product?._id });
    expect(lot).toBeTruthy();
    expect(lot?.attributes).toBeDefined();
    expect(lot?.attributes?.get('tempMinF')).toBeCloseTo(-0.4, 1);
    expect(lot?.attributes?.get('certifications')).toEqual(expect.arrayContaining(['kosher']));
    expect(lot?.rawAttributes).toBeDefined();
    expect(lot?.rawAttributes?.get('StorageTemp_C')).toBe('-18');
    expect(lot?.rawAttributes?.get('Kosher Status')).toBe('YES');
  });

  it('should save embedded semanticRules on SupplierTemplate without any many-to-many connections when saveTemplate is true', async () => {
    const DocumentImport = mongoose.model('DocumentImport');
    const SupplierTemplate = mongoose.model('SupplierTemplate');

    const doc = await DocumentImport.create({
      fileName: 'template_rules.csv',
      status: 'parsed',
      rawGrid: [
        ['Desc_Col', 'Qty_Col', 'Exp_Col', 'Price_Col', 'Custom_Temp_C'],
        ['Template Berry Pack', '50', '2026-11-11', '10.00', '-20']
      ],
      supplierId
    });

    const semanticRules = [
      { sourceKey: 'Custom_Temp_C', targetKey: 'minStorageTempF', transform: 'celsiusToFahrenheit' }
    ];

    const res = await request(app)
      .post('/api/ingest/confirm')
      .send({
        documentId: doc._id.toString(),
        supplierId,
        mappings: {
          description: 'Desc_Col',
          quantity: 'Qty_Col',
          expirationDate: 'Exp_Col',
          originalPrice: 'Price_Col'
        },
        saveTemplate: true,
        templateName: 'Semantic_Template_v1',
        semanticRules
      });

    expect(res.status).toBe(200);

    const savedTemplate = await SupplierTemplate.findOne({ supplierId, templateName: 'Semantic_Template_v1' });
    expect(savedTemplate).toBeTruthy();
    expect(savedTemplate?.semanticRules).toBeDefined();
    expect(savedTemplate?.semanticRules?.length).toBe(1);
    expect(savedTemplate?.semanticRules?.[0].sourceKey).toBe('Custom_Temp_C');
    expect(savedTemplate?.semanticRules?.[0].targetKey).toBe('minStorageTempF');
    expect(savedTemplate?.semanticRules?.[0].transform).toBe('celsiusToFahrenheit');
  });

  it('should support quantityCases and comment mappings during confirmIngestion', async () => {
    const DocumentImport = mongoose.model('DocumentImport');
    const doc = await DocumentImport.create({
      fileName: 'comment_cases.csv',
      status: 'parsed',
      rawGrid: [
        ['Sku_Col', 'Desc_Col', 'Cases_Col', 'Exp_Col', 'Price_Col', 'Comment_Col'],
        ['SKU-COMMENT-TEST', 'Comment Test Creamer', '125', '2026-12-12', '4.50', 'Fragile - keep dry']
      ],
      supplierId
    });

    const res = await request(app)
      .post('/api/ingest/confirm')
      .send({
        documentId: doc._id.toString(),
        supplierId,
        mappings: {
          sku: 'Sku_Col',
          description: 'Desc_Col',
          quantityCases: 'Cases_Col',
          expirationDate: 'Exp_Col',
          originalPrice: 'Price_Col',
          comment: 'Comment_Col'
        },
        saveTemplate: false
      });

    expect(res.status).toBe(200);
    expect(res.body.countImported).toBe(1);

    const InventoryLot = mongoose.model('InventoryLot');
    const lot = await InventoryLot.findOne({ quantityCases: 125, supplierId });
    expect(lot).toBeTruthy();
    expect(lot?.quantityCases).toBe(125);
    expect(lot?.comment).toBe('Fragile - keep dry');
  });

  describe('confirmBuyerIngestion Engine', () => {
    beforeEach(async () => {
      const DocumentImport = mongoose.model('DocumentImport');
      const Buyer = mongoose.model('Buyer');
      await DocumentImport.deleteMany({ fileName: 'test_buyers.csv' });
      await Buyer.deleteMany({ email: { $in: ['buyer1@acme.com', 'buyer2@beta.com', 'buyer3@gamma.com'] } });
    });

    it('should confirm buyer ingestion, create new buyers with mapped fields, update document status, and return metrics', async () => {
      const DocumentImport = mongoose.model('DocumentImport');
      const Buyer = mongoose.model('Buyer');

      const doc = await DocumentImport.create({
        fileName: 'test_buyers.csv',
        status: 'parsed',
        rawGrid: [
          ['Company', 'Email', 'Tier', 'ShortDated', 'MinShelfLife', 'Categories', 'Radius'],
          ['Acme Market', 'BUYER1@acme.com', 'tier1', 'true', '14', 'Produce, Dairy', '150'],
          ['Beta Grocery', 'buyer2@beta.com', 'tier2', 'false', '30', 'Frozen', '75']
        ]
      });

      const result = await ingestService.confirmBuyerIngestion(
        doc._id.toString(),
        {
          companyName: 'Company',
          email: 'Email',
          tier: 'Tier',
          acceptsShortDated: 'ShortDated',
          minShelfLife: 'MinShelfLife',
          categories: 'Categories',
          transportRadius: 'Radius'
        }
      );

      expect(result).toBeDefined();
      expect(result.createdCount).toBe(2);
      expect(result.updatedCount).toBe(0);
      expect(result.buyerIds).toHaveLength(2);

      const buyer1 = await Buyer.findOne({ email: 'buyer1@acme.com' });
      expect(buyer1).toBeTruthy();
      expect(buyer1?.companyName).toBe('Acme Market');
      expect(buyer1?.tier).toBe('tier1');
      expect(buyer1?.acceptsShortDated).toBe(true);
      expect(buyer1?.minShelfLife).toBe(14);
      expect(buyer1?.categories).toEqual(['Produce', 'Dairy']);
      expect(buyer1?.transportRadius).toBe(150);

      const updatedDoc = await DocumentImport.findById(doc._id);
      expect(updatedDoc?.status).toBe('imported');
      expect(updatedDoc?.recordsParsed).toBe(2);
    });

    it('should perform case-insensitive email duplicate upserts and accurately track updatedCount', async () => {
      const DocumentImport = mongoose.model('DocumentImport');
      const Buyer = mongoose.model('Buyer');

      // Pre-seed an existing buyer with lowercase email
      const existingBuyer = await Buyer.create({
        companyName: 'Old Acme Corp',
        email: 'buyer1@acme.com',
        tier: 'tier1',
        acceptsShortDated: true,
        minShelfLife: 7,
        categories: ['Beverages'],
        transportRadius: 50,
        warehouseLocations: []
      });

      const doc = await DocumentImport.create({
        fileName: 'test_buyers.csv',
        status: 'parsed',
        rawGrid: [
          ['Company Name', 'Email Address'],
          ['New Acme Enterprise', 'BUYER1@ACME.COM'], // Upper case matching existing buyer
          ['Gamma Foods', 'buyer3@gamma.com']        // New buyer
        ]
      });

      const result = await ingestService.confirmBuyerIngestion(
        doc._id.toString(),
        {
          companyName: 'Company Name',
          email: 'Email Address'
        }
      );

      expect(result.createdCount).toBe(1);
      expect(result.updatedCount).toBe(1);
      expect(result.buyerIds).toHaveLength(2);
      expect(result.buyerIds).toContain(existingBuyer._id.toString());

      const reloadedBuyer = await Buyer.findById(existingBuyer._id);
      expect(reloadedBuyer?.companyName).toBe('New Acme Enterprise');

      const gammaBuyer = await Buyer.findOne({ email: 'buyer3@gamma.com' });
      expect(gammaBuyer).toBeTruthy();
      expect(gammaBuyer?.companyName).toBe('Gamma Foods');
    });

    it('should link imported buyer ObjectIds to target BuyerList when buyerListId is provided', async () => {
      const DocumentImport = mongoose.model('DocumentImport');
      const BuyerList = mongoose.model('BuyerList');

      const targetList = await BuyerList.create({
        name: 'Target VIP List',
        type: 'custom',
        buyerIds: []
      });

      const doc = await DocumentImport.create({
        fileName: 'test_buyers.csv',
        status: 'parsed',
        rawGrid: [
          ['Company Name', 'Email Address'],
          ['Delta Retail', 'buyer1@acme.com'],
          ['Epsilon Mart', 'buyer2@beta.com']
        ]
      });

      const result = await ingestService.confirmBuyerIngestion(
        doc._id.toString(),
        {
          companyName: 'Company Name',
          email: 'Email Address'
        },
        targetList._id.toString()
      );

      expect(result.createdCount).toBe(2);
      expect(result.buyerIds).toHaveLength(2);

      const updatedList = await BuyerList.findById(targetList._id);
      expect(updatedList).toBeTruthy();
      expect(updatedList?.buyerIds).toHaveLength(2);
      const strIds = updatedList?.buyerIds.map((id: any) => id.toString());
      expect(strIds).toContain(result.buyerIds[0]);
      expect(strIds).toContain(result.buyerIds[1]);
    });

    it('should return 400 from POST /api/ingest/confirm-buyer when documentId or mappings is missing', async () => {
      const res = await request(app)
        .post('/api/ingest/confirm-buyer')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should process POST /api/ingest/confirm-buyer successfully via HTTP endpoint', async () => {
      const DocumentImport = mongoose.model('DocumentImport');
      const doc = await DocumentImport.create({
        fileName: 'test_buyers.csv',
        status: 'parsed',
        rawGrid: [
          ['Company Name', 'Email Address'],
          ['Zeta Stores', 'buyer1@acme.com']
        ]
      });

      const res = await request(app)
        .post('/api/ingest/confirm-buyer')
        .send({
          documentId: doc._id.toString(),
          mappings: {
            companyName: 'Company Name',
            email: 'Email Address'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.createdCount).toBe(1);
      expect(res.body.buyerIds).toHaveLength(1);
    });

    it('should allow POST /api/ingest/upload for CSV files with text/plain or text/csv mimetype', async () => {
      const csvBuffer = Buffer.from('companyName,email,tier\nAcme Test,test@acme.com,tier1');
      const res = await request(app)
        .post('/api/ingest/upload')
        .attach('file', csvBuffer, { filename: 'buyers_100_seed.csv', contentType: 'text/plain' });

      expect([200, 202]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.rawGrid).toBeDefined();
        expect(res.body.rawGrid[0]).toEqual(['companyName', 'email', 'tier']);
        expect(res.body.suggestedMapping).toBeDefined();
      } else {
        expect(res.body.ingestionJobId).toBeDefined();
      }
    });
  });
});







