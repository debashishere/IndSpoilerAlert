import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import '../models/Sale'; // Import to register the schema

describe('Sales & Bids Endpoints', () => {
  let buyerId: mongoose.Types.ObjectId;
  let sellerId: mongoose.Types.ObjectId;
  let listingId: mongoose.Types.ObjectId;
  let offerId: mongoose.Types.ObjectId;
  let saleId: mongoose.Types.ObjectId;
  let dcId: mongoose.Types.ObjectId;
  let productId: mongoose.Types.ObjectId;
  let lotId: mongoose.Types.ObjectId;
  let documentId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    // Wait for DB connection
    const Buyer = mongoose.model('Buyer');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const Offer = mongoose.model('Offer');
    const Supplier = mongoose.model('Supplier');
    const Sale = mongoose.model('Sale');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const DocumentImport = mongoose.model('DocumentImport');

    // Pre-cleanup to ensure no leftover records from aborted runs
    await Buyer.deleteMany({ email: 'tdd.buyer@example.com' });
    await Supplier.deleteMany({ name: 'TDD Test Supplier' });
    await Sale.deleteMany({ lotNumber: { $in: ['LOT-TDD-TEST', 'LOT-TDD-UNMATCHED'] } });
    await DistributionCenter.deleteMany({ name: 'TDD DC' });
    await ProductMaster.deleteMany({ sku: 'SKU-TDD-TEST' });
    await InventoryLot.deleteMany({ lotNumber: 'LOT-TDD-TEST' });

    // Create a mock Supplier
    sellerId = new mongoose.Types.ObjectId();
    await Supplier.create({
      _id: sellerId,
      name: 'TDD Test Supplier',
      companyCode: 'TSUP',
      regions: ['Midwest']
    });

    // Create mock buyer
    const buyer = await Buyer.create({
      companyName: 'Test Buyer TDD',
      email: 'tdd.buyer@example.com',
      acceptsShortDated: true,
      minShelfLife: 5,
      categories: ['Dairy'],
      transportRadius: 100,
      warehouseLocations: [{ lat: 41.8781, lng: -87.6298 }]
    });
    buyerId = buyer._id as mongoose.Types.ObjectId;

    // Create DC
    const dc = await DistributionCenter.create({
      supplierId: sellerId,
      name: 'TDD DC',
      code: 'TSUP-DC-TDD',
      address: '100 Logistics Way, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });
    dcId = dc._id as mongoose.Types.ObjectId;

    // Create ProductMaster
    const product = await ProductMaster.create({
      supplierId: sellerId,
      sku: 'SKU-TDD-TEST',
      category: 'Dairy',
      description: 'TDD Test Yogurt',
      shelfLifeDays: 30
    });
    productId = product._id as mongoose.Types.ObjectId;

    // Create InventoryLot with 100 cases
    const lot = await InventoryLot.create({
      supplierId: sellerId,
      distributionCenterId: dcId,
      productId,
      lotNumber: 'LOT-TDD-TEST',
      expirationDate: new Date(Date.now() + 86400000 * 20), // 20 days out
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 5.0,
      standardSellPrice: 8.0,
      status: 'active'
    });
    lotId = lot._id as mongoose.Types.ObjectId;

    // Create mock listing
    const listing = await MarketplaceListing.create({
      opportunityId: new mongoose.Types.ObjectId(),
      sellerId,
      allowBidding: true,
      startingPrice: 15.0,
      minimumPrice: 8.0,
      expiresAt: new Date(Date.now() + 86400000), // tomorrow
      originalQty: 100,
      availableQty: 100,
      currentPrice: 10,
      decaySchedule: [],
      status: 'active',
      buyersNotified: []
    });
    listingId = listing._id as mongoose.Types.ObjectId;

    // Create mock offer (bid)
    const offer = await Offer.create({
      listingId,
      buyerId,
      quantity: 50,
      price: 8.5,
      status: 'pending'
    });
    offerId = offer._id as mongoose.Types.ObjectId;

    // Create mock sale
    const sale = await Sale.create({
      supplierId: sellerId,
      buyerId,
      lotNumber: 'LOT-TDD-TEST',
      sku: 'SKU-TDD-TEST',
      description: 'TDD Test Yogurt',
      quantityCases: 100,
      pricePerCase: 5.5,
      totalValue: 550,
      saleDate: new Date(),
      status: 'scheduled'
    });
    saleId = sale._id as mongoose.Types.ObjectId;

    // Create a mock Sales document import
    const doc = await DocumentImport.create({
      fileName: 'tdd_sales.csv',
      status: 'parsed',
      rawGrid: [
        ['Item_No', 'Batch_No', 'Buyer_Mail', 'Cases_Sold', 'Per_Case_Price', 'Date_Of_Sale'],
        ['SKU-TDD-TEST', 'LOT-TDD-TEST', 'tdd.buyer@example.com', '20', '6.00', '2026-07-16'],
        ['SKU-TDD-TEST', 'LOT-TDD-UNMATCHED', 'tdd.buyer@example.com', '10', '5.00', '2026-07-16']
      ],
      suggestedMapping: {}
    });
    documentId = doc._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    const Buyer = mongoose.model('Buyer');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const Offer = mongoose.model('Offer');
    const Supplier = mongoose.model('Supplier');
    const Sale = mongoose.model('Sale');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const DocumentImport = mongoose.model('DocumentImport');

    // Clean up TDD records
    await Supplier.findByIdAndDelete(sellerId);
    await Buyer.findByIdAndDelete(buyerId);
    await MarketplaceListing.findByIdAndDelete(listingId);
    await Offer.findByIdAndDelete(offerId);
    await Sale.deleteMany({ lotNumber: { $in: ['LOT-TDD-TEST', 'LOT-TDD-UNMATCHED'] } });
    await DistributionCenter.findByIdAndDelete(dcId);
    await ProductMaster.findByIdAndDelete(productId);
    await InventoryLot.findByIdAndDelete(lotId);
    await DocumentImport.findByIdAndDelete(documentId);

    await mongoose.disconnect();
  });

  it('should return 200 and all bids (Behavior 1)', async () => {
    const res = await request(app).get('/api/bids');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    const foundOffer = res.body.find((o: any) => o._id === offerId.toString());
    expect(foundOffer).toBeDefined();
    expect(foundOffer.price).toBe(8.5);
    expect(foundOffer.quantity).toBe(50);
    expect(foundOffer.buyerId).toBeDefined();
    expect(foundOffer.buyerId.companyName).toBe('Test Buyer TDD');
  });

  it('should return 401 Unauthorized when requesting sales without authorization header', async () => {
    const res = await request(app).get('/api/sales');
    expect(res.status).toBe(401);
  });

  it('should return 200 and sales for logged in user (Behavior 2)', async () => {
    const validToken = 'mock-firebase-id-token-valid-user';
    const res = await request(app)
      .get(`/api/sales?supplierId=${sellerId}`)
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const foundSale = res.body.find((s: any) => s._id === saleId.toString());
    expect(foundSale).toBeDefined();
    expect(foundSale.sku).toBe('SKU-TDD-TEST');
    expect(foundSale.quantityCases).toBe(100);
    expect(foundSale.pricePerCase).toBe(5.5);
    expect(foundSale.totalValue).toBe(550);
    expect(foundSale.buyerId).toBeDefined();
    expect(foundSale.buyerId.companyName).toBe('Test Buyer TDD');
    expect(foundSale.supplierId).toBeDefined();
    expect(foundSale.supplierId.name).toBe('TDD Test Supplier');
  });

  it('should confirm sales ingestion, resolve buyers, and reconcile inventory (Behavior 3 & 4)', async () => {
    const res = await request(app)
      .post('/api/ingest/confirm-sales')
      .send({
        documentId: documentId.toString(),
        supplierId: sellerId.toString(),
        mappings: {
          sku: 'Item_No',
          lotNumber: 'Batch_No',
          buyerEmail: 'Buyer_Mail',
          quantity: 'Cases_Sold',
          price: 'Per_Case_Price',
          saleDate: 'Date_Of_Sale'
        },
        saveTemplate: false
      });

    expect(res.status).toBe(200);
    expect(res.body.countImported).toBe(2);
    expect(res.body.warnings).toBeDefined();
    // Verify warning for the unmatched lot
    const unmatchedWarning = res.body.warnings.find((w: string) => w.includes('LOT-TDD-UNMATCHED'));
    expect(unmatchedWarning).toBeDefined();

    // Verify Sale record was created for the matched row
    const Sale = mongoose.model('Sale');
    const matchedSale = await Sale.findOne({ lotNumber: 'LOT-TDD-TEST', quantityCases: 20 });
    expect(matchedSale).toBeTruthy();
    expect(matchedSale?.buyerId.toString()).toBe(buyerId.toString());

    // Verify Sale record was created for the unmatched row
    const unmatchedSale = await Sale.findOne({ lotNumber: 'LOT-TDD-UNMATCHED', quantityCases: 10 });
    expect(unmatchedSale).toBeTruthy();
    expect(unmatchedSale?.buyerId.toString()).toBe(buyerId.toString());

    // Verify InventoryLot availableQty was decremented by 20 (from 100 to 80)
    const InventoryLot = mongoose.model('InventoryLot');
    const lot = await InventoryLot.findById(lotId);
    expect(lot?.availableQty).toBe(80);
    expect(lot?.status).toBe('active'); // Still active since remaining availableQty > 0
  });

  it('should transition lot status to sold when availableQty reaches 0 (Behavior 4 Part 2)', async () => {
    // Ingest another 80 cases for LOT-TDD-TEST
    const extraDoc = await mongoose.model('DocumentImport').create({
      fileName: 'tdd_sales_extra.csv',
      status: 'parsed',
      rawGrid: [
        ['Item_No', 'Batch_No', 'Buyer_Mail', 'Cases_Sold', 'Per_Case_Price', 'Date_Of_Sale'],
        ['SKU-TDD-TEST', 'LOT-TDD-TEST', 'tdd.buyer@example.com', '120', '6.00', '2026-07-16'] // 120 exceeds remaining 80
      ]
    });

    const res = await request(app)
      .post('/api/ingest/confirm-sales')
      .send({
        documentId: extraDoc._id.toString(),
        supplierId: sellerId.toString(),
        mappings: {
          sku: 'Item_No',
          lotNumber: 'Batch_No',
          buyerEmail: 'Buyer_Mail',
          quantity: 'Cases_Sold',
          price: 'Per_Case_Price',
          saleDate: 'Date_Of_Sale'
        },
        saveTemplate: false
      });

    expect(res.status).toBe(200);

    // Verify InventoryLot availableQty was capped at 0 and status changed to 'sold'
    const InventoryLot = mongoose.model('InventoryLot');
    const lot = await InventoryLot.findById(lotId);
    expect(lot?.availableQty).toBe(0);
    expect(lot?.status).toBe('sold');

    await mongoose.model('DocumentImport').findByIdAndDelete(extraDoc._id);
  });

  it('should successfully ingest sales records even if lotNumber is missing, defaulting to UNKNOWN', async () => {
    const missingLotDoc = await mongoose.model('DocumentImport').create({
      fileName: 'tdd_sales_missing_lot.csv',
      status: 'parsed',
      rawGrid: [
        ['Item_No', 'Buyer_Mail', 'Cases_Sold', 'Per_Case_Price', 'Date_Of_Sale'],
        ['SKU-TDD-TEST', 'tdd.buyer@example.com', '15', '7.00', '2026-07-16']
      ]
    });

    const res = await request(app)
      .post('/api/ingest/confirm-sales')
      .send({
        documentId: missingLotDoc._id.toString(),
        supplierId: sellerId.toString(),
        mappings: {
          sku: 'Item_No',
          buyerEmail: 'Buyer_Mail',
          quantity: 'Cases_Sold',
          price: 'Per_Case_Price',
          saleDate: 'Date_Of_Sale'
        },
        saveTemplate: false
      });

    expect(res.status).toBe(200);
    expect(res.body.countImported).toBe(1);
    expect(res.body.warnings).toBeDefined();
    expect(res.body.warnings.some((w: string) => w.includes('Lot Number not provided'))).toBe(true);

    const Sale = mongoose.model('Sale');
    const savedSale = await Sale.findOne({ lotNumber: 'UNKNOWN', quantityCases: 15 });
    expect(savedSale).toBeTruthy();
    expect(savedSale?.sku).toBe('SKU-TDD-TEST');

    // Clean up
    await Sale.deleteOne({ _id: savedSale?._id });
    await mongoose.model('DocumentImport').findByIdAndDelete(missingLotDoc._id);
  });

  it('should apply FEFO allocation across multiple expiring lots when lotNumber is missing', async () => {
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Sale = mongoose.model('Sale');

    // 1. Create a product catalog entry
    const product = await ProductMaster.create({
      supplierId: sellerId,
      sku: 'SKU-FEFO-TEST',
      description: 'FEFO Test Butter',
      category: 'Dairy',
      shelfLifeDays: 30
    });

    // 2. Create two active lots with different expiration dates
    // Soonest expiring lot
    const lotA = await InventoryLot.create({
      supplierId: sellerId,
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: product._id,
      lotNumber: 'LOT-FEFO-A',
      expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Expiring in 5 days
      quantityCases: 10,
      availableQty: 10,
      costPerCase: 4.0,
      standardSellPrice: 8.0,
      status: 'active'
    });

    // Later expiring lot
    const lotB = await InventoryLot.create({
      supplierId: sellerId,
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: product._id,
      lotNumber: 'LOT-FEFO-B',
      expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Expiring in 10 days
      quantityCases: 20,
      availableQty: 20,
      costPerCase: 4.0,
      standardSellPrice: 8.0,
      status: 'active'
    });

    // 3. Create document import with missing lot number, requesting 15 cases
    const fefoDoc = await mongoose.model('DocumentImport').create({
      fileName: 'fefo_sales_test.csv',
      status: 'parsed',
      rawGrid: [
        ['Item_No', 'Buyer_Mail', 'Cases_Sold', 'Per_Case_Price', 'Date_Of_Sale'],
        ['SKU-FEFO-TEST', 'fefo.buyer@example.com', '15', '8.00', '2026-07-16']
      ]
    });

    // 4. Ingest and reconcile
    const res = await request(app)
      .post('/api/ingest/confirm-sales')
      .send({
        documentId: fefoDoc._id.toString(),
        supplierId: sellerId.toString(),
        mappings: {
          sku: 'Item_No',
          buyerEmail: 'Buyer_Mail',
          quantity: 'Cases_Sold',
          price: 'Per_Case_Price',
          saleDate: 'Date_Of_Sale'
        },
        saveTemplate: false
      });

    expect(res.status).toBe(200);
    expect(res.body.countImported).toBe(1);

    // 5. Verify Lot A was fully exhausted
    const updatedLotA = await InventoryLot.findById(lotA._id);
    expect(updatedLotA!.availableQty).toBe(0);
    expect(updatedLotA!.status).toBe('sold');

    // 6. Verify Lot B was partially decremented (20 - 5 = 15)
    const updatedLotB = await InventoryLot.findById(lotB._id);
    expect(updatedLotB!.availableQty).toBe(15);
    expect(updatedLotB!.status).toBe('active');

    // 7. Verify Sale record was created with first lot as reference and no warning
    const savedSale = await Sale.findOne({ sku: 'SKU-FEFO-TEST', buyerEmail: 'fefo.buyer@example.com' });
    expect(savedSale).toBeTruthy();
    expect(savedSale?.lotId.toString()).toBe(lotA._id.toString());
    expect(savedSale?.reconciliationWarning).toBeUndefined();

    // Clean up
    await ProductMaster.findByIdAndDelete(product._id);
    await InventoryLot.findByIdAndDelete(lotA._id);
    await InventoryLot.findByIdAndDelete(lotB._id);
    await Sale.deleteOne({ _id: savedSale?._id });
    await mongoose.model('DocumentImport').findByIdAndDelete(fefoDoc._id);
  });

  it('should prevent re-importing an already imported document (Document Level Deduplication)', async () => {
    const importedDoc = await mongoose.model('DocumentImport').create({
      fileName: 'already_imported.csv',
      status: 'imported',
      rawGrid: [
        ['Item_No', 'Cases_Sold', 'Per_Case_Price'],
        ['SKU-DUP-1', '10', '5.00']
      ]
    });

    const res = await request(app)
      .post('/api/ingest/confirm-sales')
      .send({
        documentId: importedDoc._id.toString(),
        supplierId: sellerId.toString(),
        mappings: { sku: 'Item_No', quantity: 'Cases_Sold', price: 'Per_Case_Price' }
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/already been imported/i);

    await mongoose.model('DocumentImport').findByIdAndDelete(importedDoc._id);
  });

  it('should detect and skip duplicate sale rows within an import (Row Level Deduplication)', async () => {
    const Sale = mongoose.model('Sale');
    // Pre-create an existing sale
    const existingSale = await Sale.create({
      supplierId: sellerId,
      lotNumber: 'LOT-DUP-TEST',
      sku: 'SKU-DUP-ROW',
      description: 'Duplicate Row Test Item',
      quantityCases: 50,
      pricePerCase: 10.0,
      totalValue: 500,
      saleDate: new Date('2026-08-01'),
      status: 'scheduled',
      buyerEmail: 'dup.buyer@example.com',
      invoiceNumber: 'INV-DUP-999'
    });

    const dupDoc = await mongoose.model('DocumentImport').create({
      fileName: 'dup_rows.csv',
      status: 'parsed',
      rawGrid: [
        ['Invoice_No', 'Item_No', 'Batch_No', 'Buyer_Mail', 'Cases_Sold', 'Per_Case_Price', 'Date_Of_Sale'],
        ['INV-DUP-999', 'SKU-DUP-ROW', 'LOT-DUP-TEST', 'dup.buyer@example.com', '50', '10.00', '2026-08-01']
      ]
    });

    const res = await request(app)
      .post('/api/ingest/confirm-sales')
      .send({
        documentId: dupDoc._id.toString(),
        supplierId: sellerId.toString(),
        mappings: {
          invoiceNumber: 'Invoice_No',
          sku: 'Item_No',
          lotNumber: 'Batch_No',
          buyerEmail: 'Buyer_Mail',
          quantity: 'Cases_Sold',
          price: 'Per_Case_Price',
          saleDate: 'Date_Of_Sale'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.countImported).toBe(0);
    expect(res.body.warnings).toBeDefined();
    expect(res.body.warnings.some((w: string) => w.includes('Skipped duplicate sale record'))).toBe(true);

    await Sale.findByIdAndDelete(existingSale._id);
    await mongoose.model('DocumentImport').findByIdAndDelete(dupDoc._id);
  });

  it('should process mapped attributes brand, description, totalValue, status, and buyerCompany correctly', async () => {
    const extendedDoc = await mongoose.model('DocumentImport').create({
      fileName: 'extended_sales.csv',
      status: 'parsed',
      rawGrid: [
        ['Item_No', 'Batch_No', 'Buyer_Co', 'Cases_Sold', 'Per_Case_Price', 'Date_Of_Sale', 'Brand_Name', 'Product_Desc', 'Net_Total', 'Sale_Status'],
        ['SKU-EXT-01', 'LOT-EXT-01', 'Acme Market', '10', '15.00', '2026-08-01', 'Organic Valley', 'Organic Whole Milk 1 Gal', '150.00', 'confirmed']
      ]
    });

    const res = await request(app)
      .post('/api/ingest/confirm-sales')
      .send({
        documentId: extendedDoc._id.toString(),
        supplierId: sellerId.toString(),
        mappings: {
          sku: 'Item_No',
          lotNumber: 'Batch_No',
          buyerCompany: 'Buyer_Co',
          quantity: 'Cases_Sold',
          price: 'Per_Case_Price',
          saleDate: 'Date_Of_Sale',
          brand: 'Brand_Name',
          description: 'Product_Desc',
          totalValue: 'Net_Total',
          status: 'Sale_Status'
        },
        saveTemplate: false
      });

    expect(res.status).toBe(200);
    expect(res.body.countImported).toBe(1);

    const SaleModel = mongoose.model('Sale');
    const BuyerModel = mongoose.model('Buyer');

    const createdSale = await SaleModel.findOne({ sku: 'SKU-EXT-01', brand: 'Organic Valley' });
    expect(createdSale).toBeDefined();
    expect(createdSale?.brand).toBe('Organic Valley');
    expect(createdSale?.description).toBe('Organic Whole Milk 1 Gal');
    expect(createdSale?.totalValue).toBe(150.00);
    expect(createdSale?.status).toBe('confirmed');

    const createdBuyer = await BuyerModel.findOne({ companyName: 'Acme Market' });
    expect(createdBuyer).toBeDefined();

    if (createdSale) await SaleModel.findByIdAndDelete(createdSale._id);
    if (createdBuyer) await BuyerModel.findByIdAndDelete(createdBuyer._id);
    await mongoose.model('DocumentImport').findByIdAndDelete(extendedDoc._id);
  });
});

