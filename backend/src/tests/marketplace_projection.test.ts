import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import InventoryLot from '../models/InventoryLot';
import ProductMaster from '../models/ProductMaster';
import Supplier from '../models/Supplier';
import DistributionCenter from '../models/DistributionCenter';
import ComplianceDocument from '../models/ComplianceDocument';
import MarketplaceListing from '../models/MarketplaceListing';
import { projectToMarketplaceListing, publishLotToMarketplace } from '../services/marketplaceService';

describe('0084 — Marketplace Listing Projection & Publication Invariants', () => {
  let supplierId: string;
  let dcId: string;
  let productId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/spoiler-alert-test';
      await mongoose.connect(mongoUri);
    }

    const supplier = await Supplier.create({ name: 'Test CPG Corp', companyCode: 'CPG1' });
    supplierId = supplier._id.toString();

    const dc = await DistributionCenter.create({
      supplierId,
      code: 'DC-001',
      name: 'Central DC',
      address: '100 Main St',
      coordinates: { lat: 41.8781, lng: -87.6298 }
    });
    dcId = dc._id.toString();

    const product = await ProductMaster.create({
      supplierId,
      sku: 'SKU-MILK-001',
      description: 'Organic Whole Milk 1 Gallon',
      category: 'Dairy'
    });
    productId = product._id.toString();
  });

  afterAll(async () => {
    await Supplier.deleteMany({});
    await DistributionCenter.deleteMany({});
    await ProductMaster.deleteMany({});
    await InventoryLot.deleteMany({});
    await ComplianceDocument.deleteMany({});
    await MarketplaceListing.deleteMany({});
    await mongoose.connection.close();
  });

  it('should sanitize internal supplier COGS, margins, and private notes when projecting MarketplaceListing', async () => {
    const lot = await InventoryLot.create({
      supplierId,
      distributionCenterId: dcId,
      productId,
      lotNumber: 'LOT-SECRET-123',
      expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      remainingShelfLife: 0.75,
      quantityCases: 500,
      availableQty: 500,
      costPerCase: 12.50, // Internal COGS - MUST BE SANITIZED
      standardSellPrice: 18.00,
      comment: 'CONFIDENTIAL: Supplier cost recovery target is $14.00/cs.', // Sensitive private note
      fdaRegulated: true,
      status: 'active'
    });

    const projection = await projectToMarketplaceListing(lot._id.toString());

    expect(projection).toHaveProperty('publicPrice');
    expect(projection.publicPrice).toBe(18.00);
    expect(projection).not.toHaveProperty('costPerCase');
    expect(projection).not.toHaveProperty('cogs');
    expect((projection as any).comment).toBeUndefined(); // Sensitive comment stripped
    expect(projection.sanitized).toBe(true);
  });

  it('should reject publication if compliance document (COA / Batch Record) is unverified (Manual API & Workflow Invariant)', async () => {
    const tempLotId = new mongoose.Types.ObjectId();
    const unverifiedDoc = await ComplianceDocument.create({
      lotId: tempLotId,
      docType: 'COA',
      s3Url: 'http://s3.amazonaws.com/coa_draft.pdf',
      status: 'pending', // unverified
      verified: false
    });

    const lot = await InventoryLot.create({
      supplierId,
      distributionCenterId: dcId,
      productId,
      lotNumber: 'LOT-NO-COA-999',
      expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      remainingShelfLife: 0.5,
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 8.00,
      standardSellPrice: 15.00,
      fdaRegulated: true,
      complianceDocs: [unverifiedDoc._id],
      status: 'active'
    });

    // 1. Direct Service / Manual API Invariant Check
    await expect(publishLotToMarketplace(lot._id.toString())).rejects.toThrow(
      /compliance verification required/i
    );

    // 2. HTTP POST API invariant check
    const res = await request(app)
      .post(`/api/v1/supplier/lots/${lot._id}/publish-marketplace`)
      .send();

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/compliance verification required/i);
  });

  it('should successfully publish listing when COA compliance is verified', async () => {
    const tempLotId2 = new mongoose.Types.ObjectId();
    const verifiedDoc = await ComplianceDocument.create({
      lotId: tempLotId2,
      docType: 'COA',
      s3Url: 'http://s3.amazonaws.com/coa_approved.pdf',
      status: 'verified',
      verified: true
    });

    const lot = await InventoryLot.create({
      supplierId,
      distributionCenterId: dcId,
      productId,
      lotNumber: 'LOT-VERIFIED-456',
      expirationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      remainingShelfLife: 0.8,
      quantityCases: 300,
      availableQty: 300,
      costPerCase: 10.00,
      standardSellPrice: 16.00,
      fdaRegulated: true,
      complianceDocs: [verifiedDoc._id],
      status: 'active'
    });

    const res = await request(app)
      .post(`/api/v1/supplier/lots/${lot._id}/publish-marketplace`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.listing).toBeDefined();
    expect(res.body.listing.coaVerified).toBe(true);
    expect(res.body.listing.sanitized).toBe(true);
  });
});
