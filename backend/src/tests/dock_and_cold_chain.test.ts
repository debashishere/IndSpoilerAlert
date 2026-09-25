import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Shipment from '../models/Shipment';
import Award from '../models/Award';
import Buyer from '../models/Buyer';
import MarketplaceListing from '../models/MarketplaceListing';
import InventoryLot from '../models/InventoryLot';
import ProductMaster from '../models/ProductMaster';
import Supplier from '../models/Supplier';
import DistributionCenter from '../models/DistributionCenter';
import Offer from '../models/Offer';
import DockAppointment from '../models/DockAppointment';
import ColdChainLog from '../models/ColdChainLog';

function createTestToken(): string {
  return 'mock-firebase-id-token-dev@indspoileralert.com';
}

describe('Dock Appointment & Cold Chain Persistence API', () => {
  let shipmentId: string;
  let lotId: string;
  const authToken = createTestToken();

  beforeAll(async () => {
    const supplier = await Supplier.create({
      name: 'Test Cold Supplier',
      companyName: 'Test Cold Supplier',
      companyCode: 'SUP-COLD-01',
      email: 'coldsupplier@test.com',
    });

    const dc = await DistributionCenter.create({
      supplierId: supplier._id,
      name: 'DC Cold Hub',
      code: 'DC-COLD-1',
      address: '100 Cold Way',
      coordinates: { lat: 29.7604, lng: -95.3698 },
    });

    // Seed prerequisite models
    const product = await ProductMaster.create({
      supplierId: supplier._id,
      sku: 'TEST-SKU-DOCK',
      description: 'Test Dock Product',
      category: 'Frozen',
      unitCost: 10,
    });

    const lot = await InventoryLot.create({
      supplierId: supplier._id,
      distributionCenterId: dc._id,
      productId: product._id,
      lotNumber: 'LOT-DOCK-1',
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 10,
      standardSellPrice: 15,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      mfgDate: new Date(),
    });
    lotId = lot._id.toString();

    const buyer = await Buyer.create({
      companyName: 'Cold Logistics Buyer Inc',
      email: 'coldbuyer@test.com',
      tier: 'Tier 1',
    });

    const listing = await MarketplaceListing.create({
      lotId: lot._id,
      title: 'Listing Dock Test',
      askPrice: 8,
      status: 'active',
      availableQty: 100,
    });

    const offer = await Offer.create({
      listingId: listing._id,
      buyerId: buyer._id,
      price: 8,
      quantity: 50,
      status: 'fully_accepted',
    });

    const award = await Award.create({
      offerId: offer._id,
      listingId: listing._id,
      buyerId: buyer._id,
      awardedQty: 50,
      price: 8,
      finalPrice: 8,
      totalAmount: 400,
      status: 'awarded',
    });

    const shipment = await Shipment.create({
      awardId: award._id,
      carrier: 'Carrier Express',
      pickupLocation: 'Distribution Center 1',
      deliveryLocation: 'Retail Store 42',
      status: 'scheduled',
      temperature: '0°F - Frozen',
    });
    shipmentId = shipment._id.toString();
  });

  afterAll(async () => {
    await DockAppointment.deleteMany({});
    await ColdChainLog.deleteMany({});
    await Shipment.deleteMany({});
    await Award.deleteMany({});
    await Offer.deleteMany({});
    await MarketplaceListing.deleteMany({});
    await InventoryLot.deleteMany({});
    await ProductMaster.deleteMany({});
    await DistributionCenter.deleteMany({});
    await Supplier.deleteMany({});
    await Buyer.deleteMany({});
  });

  describe('POST & GET /api/logistics/dock-appointments', () => {
    it('should create and retrieve a dock pickup appointment', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 3600000).toISOString();
      const endTime = new Date(now.getTime() + 7200000).toISOString();

      const createRes = await request(app)
        .post('/api/logistics/dock-appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shipmentId,
          pickupWindowStart: startTime,
          pickupWindowEnd: endTime,
          carrierName: 'Fastline Logistics',
          carrierDotNumber: 'DOT-889977',
          dockDoor: 'Door 4',
          notes: 'Reefer trailer required',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body).toHaveProperty('_id');
      expect(createRes.body.shipmentId).toBe(shipmentId);
      expect(createRes.body.carrierName).toBe('Fastline Logistics');
      expect(createRes.body.dockDoor).toBe('Door 4');
      expect(createRes.body.status).toBe('confirmed');

      const getRes = await request(app)
        .get('/api/logistics/dock-appointments')
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.status).toBe(200);
      expect(Array.isArray(getRes.body)).toBe(true);
      expect(getRes.body.length).toBeGreaterThan(0);
      const appointment = getRes.body.find((a: any) => a._id === createRes.body._id);
      expect(appointment).toBeDefined();
      expect(appointment.carrierDotNumber).toBe('DOT-889977');
    });
  });

  describe('POST & GET /api/logistics/cold-chain', () => {
    it('should record a cold chain log with FSMA 204 audit metadata and retrieve history/metrics', async () => {
      const logPayload = {
        shipmentId,
        lotId,
        temperature: 34.5,
        unit: '°F',
        recordedBy: 'Inspector John Doe',
        complianceStatus: 'compliant',
        fsma204Audit: {
          verified: true,
          traceabilityCode: 'KDE-FSMA-2026-001',
        },
      };

      const postRes = await request(app)
        .post('/api/logistics/cold-chain')
        .set('Authorization', `Bearer ${authToken}`)
        .send(logPayload);

      expect(postRes.status).toBe(201);
      expect(postRes.body).toHaveProperty('_id');
      expect(postRes.body.temperature).toBe(34.5);
      expect(postRes.body.complianceStatus).toBe('compliant');
      expect(postRes.body.fsma204Audit.verified).toBe(true);
      expect(postRes.body.fsma204Audit.traceabilityCode).toBe('KDE-FSMA-2026-001');

      const getRes = await request(app)
        .get('/api/logistics/cold-chain')
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body).toHaveProperty('logs');
      expect(getRes.body).toHaveProperty('metrics');
      expect(getRes.body.metrics).toHaveProperty('tempComplianceSla');
      expect(getRes.body.metrics).toHaveProperty('fsma204VerifiedCount');
      expect(Array.isArray(getRes.body.logs)).toBe(true);
      expect(getRes.body.logs.length).toBeGreaterThan(0);
    });
  });
});
