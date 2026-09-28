import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { getRedisClient } from '../utils/redis';

describe('Operations Analytics API Endpoint (GET /api/analytics/operations)', () => {
  jest.setTimeout(30000);
  const validToken = 'mock-firebase-id-token-mock-uid-YXV0aHRlc3RAaW5kc3BvaWxlcmFsZXJ0LmNvbQ';
  let supplierId: string;
  let otherSupplierId: string;
  let lot1: any;
  let InventoryLot: any;
  let Buyer: any;
  let Award: any;
  let Shipment: any;
  let DockAppointment: any;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('connected', resolve));
    }

    const Supplier = mongoose.model('Supplier');
    Buyer = mongoose.model('Buyer');
    InventoryLot = mongoose.model('InventoryLot');
    const EmailDispatchLog = mongoose.model('EmailDispatchLog');
    const EmailThread = mongoose.model('EmailThread');
    const LiquidationAutomation = mongoose.model('LiquidationAutomation');
    const AutomationRun = mongoose.model('AutomationRun');
    const ColdChainLog = mongoose.model('ColdChainLog');
    Shipment = mongoose.model('Shipment');
    Award = mongoose.model('Award');
    DockAppointment = mongoose.model('DockAppointment');

    // Clean up test collections
    await Supplier.deleteMany({ name: { $in: ['Ops Analytics Test Supplier', 'Other Ops Supplier'] } });
    await Buyer.deleteMany({ email: { $in: ['ops-buyer-1@test.com', 'ops-buyer-2@test.com'] } });
    await InventoryLot.deleteMany({ lotNumber: { $in: ['LOT-OPS-001', 'LOT-OPS-002', 'LOT-OPS-CRIT'] } });
    await EmailDispatchLog.deleteMany({ dispatchId: { $in: ['DISP-OPS-1', 'DISP-OPS-2', 'DISP-OPS-3'] } });
    await EmailThread.deleteMany({ threadId: { $in: ['THREAD-OPS-1'] } });
    await LiquidationAutomation.deleteMany({ templateName: { $in: ['Ops Automation Campaign 1', 'Ops Draft Campaign'] } });
    await AutomationRun.deleteMany({ fallbackJobId: { $in: ['JOB-OPS-RUN-1', 'JOB-OPS-RUN-2'] } });
    await ColdChainLog.deleteMany({ recordedBy: 'Ops Test Suite' });
    await Shipment.deleteMany({ bolNumber: 'BOL-OPS-001' });
    await DockAppointment.deleteMany({ carrierName: 'Carrier Freight Lines' });

    // 1. Seed Suppliers
    const supp = await Supplier.create({
      name: 'Ops Analytics Test Supplier',
      companyCode: 'OATS',
      preferredDisposition: 'sell'
    });
    supplierId = supp._id.toString();

    const otherSupp = await Supplier.create({
      name: 'Other Ops Supplier',
      companyCode: 'OOPS',
      preferredDisposition: 'sell'
    });
    otherSupplierId = otherSupp._id.toString();

    // 2. Seed Buyers
    await Buyer.create({
      supplierId: supp._id,
      companyName: 'Ops Prime Buyer',
      email: 'ops-buyer-1@test.com',
      isActive: true,
      warehouseLocations: [{ lat: 40.7128, lng: -74.0060 }]
    });

    await Buyer.create({
      supplierId: supp._id,
      companyName: 'Ops Inactive Buyer',
      email: 'ops-buyer-2@test.com',
      isActive: false,
      warehouseLocations: [{ lat: 34.0522, lng: -118.2437 }]
    });

    // 3. Seed Lots (Active, Critical RSL <14d, and Sold)
    const now = new Date();
    lot1 = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      lotNumber: 'LOT-OPS-001',
      expirationDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days
      remainingShelfLife: 0.8,
      quantityCases: 400,
      availableQty: 400,
      costPerCase: 10.0,
      standardSellPrice: 20.0, // 400 * 20 = $8,000
      status: 'active'
    });

    await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      lotNumber: 'LOT-OPS-CRIT',
      expirationDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days (Critical < 14d)
      remainingShelfLife: 0.1,
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 8.0,
      standardSellPrice: 15.0, // 100 * 15 = $1,500
      status: 'active'
    });

    await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      lotNumber: 'LOT-OPS-002',
      expirationDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      remainingShelfLife: 0.4,
      quantityCases: 500,
      availableQty: 0,
      costPerCase: 10.0,
      standardSellPrice: 18.0,
      status: 'sold'
    });

    // 4. Seed Email Dispatches & Threads
    await EmailDispatchLog.create({
      dispatchId: 'DISP-OPS-1',
      supplierId: supp._id.toString(),
      buyerEmail: 'ops-buyer-1@test.com',
      dispatchedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      firstOpenedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 3600000),
      openCount: 2
    });

    await EmailDispatchLog.create({
      dispatchId: 'DISP-OPS-2',
      supplierId: supp._id.toString(),
      buyerEmail: 'ops-buyer-1@test.com',
      dispatchedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      openCount: 0
    });

    await EmailThread.create({
      threadId: 'THREAD-OPS-1',
      supplierId: supp._id.toString(),
      buyerEmail: 'ops-buyer-1@test.com',
      subject: 'Surplus Offer Thread',
      status: 'active',
      messages: [
        {
          messageId: 'MSG-1',
          senderType: 'supplier',
          senderEmail: 'supplier@test.com',
          body: 'Special offer available',
          sentAt: new Date(now.getTime() - 10 * 3600000)
        },
        {
          messageId: 'MSG-2',
          senderType: 'buyer',
          senderEmail: 'ops-buyer-1@test.com',
          body: 'We accept $15/case',
          sentAt: new Date(now.getTime() - 8 * 3600000) // 2 hours response turnaround
        }
      ]
    });

    // 5. Seed Automations & Runs
    const auto1 = await LiquidationAutomation.create({
      supplierId: supp._id,
      name: 'Ops Automation Campaign 1',
      templateName: 'Ops Automation Campaign 1',
      isActive: true,
      status: 'active',
      inventoryFilters: {},
      schedule: { type: 'immediate' },
      stats: { totalRuns: 1, totalAwarded: 0, totalDonated: 0 }
    });

    await LiquidationAutomation.create({
      supplierId: supp._id,
      name: 'Ops Draft Campaign',
      templateName: 'Ops Draft Campaign',
      isActive: false,
      status: 'draft',
      inventoryFilters: {},
      schedule: { type: 'immediate' },
      stats: { totalRuns: 0, totalAwarded: 0, totalDonated: 0 }
    });

    await AutomationRun.create({
      automationId: auto1._id,
      runType: 'manual',
      status: 'awarded',
      dispatchedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      executedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      evaluationEndsAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      snapshotInventoryIds: [],
      evaluatedBuyerIds: [],
      fallbackJobId: 'JOB-OPS-RUN-1',
      resolution: { action: 'auto_award', resolvedAt: new Date() }
    });

    await AutomationRun.create({
      automationId: auto1._id,
      runType: 'scheduled',
      status: 'failed',
      dispatchedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      executedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      evaluationEndsAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      snapshotInventoryIds: [],
      evaluatedBuyerIds: [],
      fallbackJobId: 'JOB-OPS-RUN-2',
      errorReason: 'No matching bids'
    });

    // 6. Seed Cold Chain Logs & Shipments
    await ColdChainLog.create({
      lotId: lot1._id,
      temperature: 34.5,
      unit: '°F',
      recordedBy: 'Ops Test Suite',
      complianceStatus: 'compliant',
      fsma204Audit: { verified: true },
      timestamp: new Date(now.getTime() - 12 * 3600000)
    });

    await ColdChainLog.create({
      lotId: lot1._id,
      temperature: 35.0,
      unit: '°F',
      recordedBy: 'Ops Test Suite',
      complianceStatus: 'compliant',
      fsma204Audit: { verified: true },
      timestamp: new Date(now.getTime() - 6 * 3600000)
    });

    const dummyAward = await Award.create({
      offerId: new mongoose.Types.ObjectId(),
      lotId: lot1._id,
      buyerId: new mongoose.Types.ObjectId(),
      awardedQty: 200,
      price: 15.0
    });

    const ship = await Shipment.create({
      awardId: dummyAward._id,
      carrier: 'Carrier Freight Lines',
      pickupLocation: 'Dallas DC Dock 4',
      deliveryLocation: 'Austin Receiving',
      status: 'scheduled',
      bolNumber: 'BOL-OPS-001'
    });

    await DockAppointment.create({
      shipmentId: ship._id,
      pickupWindowStart: new Date(now.getTime() - 45 * 60000),
      pickupWindowEnd: now,
      carrierName: 'Carrier Freight Lines',
      dockDoor: 'Door 4',
      status: 'confirmed',
      slaMet: true,
    });
  });

  afterAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const Buyer = mongoose.model('Buyer');
    const InventoryLot = mongoose.model('InventoryLot');
    const EmailDispatchLog = mongoose.model('EmailDispatchLog');
    const EmailThread = mongoose.model('EmailThread');
    const LiquidationAutomation = mongoose.model('LiquidationAutomation');
    const AutomationRun = mongoose.model('AutomationRun');
    const ColdChainLog = mongoose.model('ColdChainLog');
    const Shipment = mongoose.model('Shipment');
    const Award = mongoose.model('Award');
    const DockAppointment = mongoose.model('DockAppointment');

    await Supplier.deleteMany({ name: { $in: ['Ops Analytics Test Supplier', 'Other Ops Supplier'] } });
    await Buyer.deleteMany({ email: { $in: ['ops-buyer-1@test.com', 'ops-buyer-2@test.com'] } });
    await InventoryLot.deleteMany({ lotNumber: { $in: ['LOT-OPS-001', 'LOT-OPS-002', 'LOT-OPS-CRIT'] } });
    await EmailDispatchLog.deleteMany({ dispatchId: { $in: ['DISP-OPS-1', 'DISP-OPS-2', 'DISP-OPS-3'] } });
    await EmailThread.deleteMany({ threadId: { $in: ['THREAD-OPS-1'] } });
    await LiquidationAutomation.deleteMany({ templateName: { $in: ['Ops Automation Campaign 1', 'Ops Draft Campaign'] } });
    await AutomationRun.deleteMany({ fallbackJobId: { $in: ['JOB-OPS-RUN-1', 'JOB-OPS-RUN-2'] } });
    await ColdChainLog.deleteMany({ recordedBy: 'Ops Test Suite' });
    await Shipment.deleteMany({ bolNumber: 'BOL-OPS-001' });
    await DockAppointment.deleteMany({ carrierName: 'Carrier Freight Lines' });
    await Award.deleteMany({ _id: { $exists: true } });
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/analytics/operations');
    expect(res.status).toBe(401);
  });

  it('aggregates live telemetry across all 4 pillars for default 30d timeframe with supplier scoping', async () => {
    const res = await request(app)
      .get(`/api/analytics/operations?supplierId=${supplierId}&timeframe=30d`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    const data = res.body;

    expect(data.timeframe).toBe('30d');

    // Pillar 1: Ingestion
    expect(data.ingestion).toBeDefined();
    // 400 * $20 + 100 * $15 = $9,500 active portfolio value
    expect(data.ingestion.portfolioValue).toBe('$9,500');
    expect(data.ingestion.criticalRsl).toBe('1 Lot');
    // Sold: 500 cases, Total: 1000 cases -> 50%
    expect(data.ingestion.liquidationVelocity).toBe('50.0%');
    expect(data.ingestion.matchedBuyers).toBe('1 Verified');

    // Pillar 2: Buyer Comms
    expect(data.buyerComms).toBeDefined();
    expect(data.buyerComms.activeBuyers).toBe(1);
    expect(data.buyerComms.dispatchVolume).toBe(2);
    // 1 opened out of 2 dispatched = 50%
    expect(data.buyerComms.engagementRate).toBe(50);
    // 2 hours response turnaround
    expect(data.buyerComms.responseVelocityHours).toBe(2);

    // Pillar 3: Workflow Campaigns
    expect(data.workflowCampaigns).toBeDefined();
    expect(data.workflowCampaigns.activeCampaigns).toBe(1);
    expect(data.workflowCampaigns.inactiveCampaigns).toBe(1);
    expect(data.workflowCampaigns.casesInScope).toBe(500); // 400 + 100 active cases
    expect(data.workflowCampaigns.automationRuns).toBe(2);
    // 1 awarded out of 2 = 50% yield
    expect(data.workflowCampaigns.executionYield).toBe(50);

    // Pillar 4: Cold Chain & Compliance
    expect(data.coldChain).toBeDefined();
    expect(data.coldChain.tempComplianceSla).toBe('100.0%');
    expect(data.coldChain.fsma204Status).toBe('Verified');
    expect(data.coldChain.dockSla).toBe('< 45 Min');
    expect(data.coldChain.logisticsLinkStatus).toBe('Active');
  });

  it('supports 7d, 90d, and ytd timeframes', async () => {
    for (const tf of ['7d', '90d', 'ytd']) {
      const res = await request(app)
        .get(`/api/analytics/operations?supplierId=${supplierId}&timeframe=${tf}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.timeframe).toBe(tf);
    }
  });

  it('returns clean mathematical zero-state baselines when supplier has no operational events', async () => {
    const res = await request(app)
      .get(`/api/analytics/operations?supplierId=${otherSupplierId}&timeframe=30d`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    const data = res.body;

    expect(data.ingestion.portfolioValue).toBe('$0');
    expect(data.ingestion.criticalRsl).toBe('0 Lots');
    expect(data.ingestion.liquidationVelocity).toBe('0%');
    expect(data.ingestion.matchedBuyers).toBe('0 Verified');

    expect(data.buyerComms.activeBuyers).toBe(0);
    expect(data.buyerComms.dispatchVolume).toBe(0);
    expect(data.buyerComms.engagementRate).toBe(0);
    expect(data.buyerComms.responseVelocityHours).toBe(0);

    expect(data.workflowCampaigns.activeCampaigns).toBe(0);
    expect(data.workflowCampaigns.inactiveCampaigns).toBe(0);
    expect(data.workflowCampaigns.casesInScope).toBe(0);
    expect(data.workflowCampaigns.automationRuns).toBe(0);
    expect(data.workflowCampaigns.executionYield).toBe(0);

    expect(data.coldChain.tempComplianceSla).toBe('0%');
    expect(data.coldChain.fsma204Status).toBe('Unverified');
    expect(data.coldChain.dockSla).toBe('0.0 hrs');
    expect(data.coldChain.logisticsLinkStatus).toBe('Disconnected');
  });

  it('returns velocityTrendline coordinate points with accurate cross-service counts and zero baselines', async () => {
    const res = await request(app)
      .get(`/api/analytics/operations?supplierId=${supplierId}&timeframe=7d`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    const data = res.body;

    expect(Array.isArray(data.velocityTrendline)).toBe(true);
    expect(data.velocityTrendline.length).toBe(7);

    const firstPoint = data.velocityTrendline[0];
    expect(firstPoint).toHaveProperty('date');
    expect(firstPoint).toHaveProperty('label');
    expect(firstPoint).toHaveProperty('lots');
    expect(firstPoint).toHaveProperty('runs');
    expect(firstPoint).toHaveProperty('dispatches');

    const totalLots = data.velocityTrendline.reduce((s: number, p: any) => s + p.lots, 0);
    const totalRuns = data.velocityTrendline.reduce((s: number, p: any) => s + p.runs, 0);
    const totalDispatches = data.velocityTrendline.reduce((s: number, p: any) => s + p.dispatches, 0);

    // 3 lots created today, 2 runs created (1 at -3d, 1 at -1d), 2 dispatches created (1 at -2d, 1 at -1d)
    expect(totalLots).toBe(3);
    expect(totalRuns).toBe(2);
    expect(totalDispatches).toBe(2);

    // Check zero-state baseline for other supplier
    const zeroRes = await request(app)
      .get(`/api/analytics/operations?supplierId=${otherSupplierId}&timeframe=7d`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(zeroRes.status).toBe(200);
    expect(Array.isArray(zeroRes.body.velocityTrendline)).toBe(true);
    expect(zeroRes.body.velocityTrendline.length).toBe(7);
    for (const point of zeroRes.body.velocityTrendline) {
      expect(point.lots).toBe(0);
      expect(point.runs).toBe(0);
      expect(point.dispatches).toBe(0);
    }
  });

  it('returns distribution metrics for workflow yield, buyer turnaround buckets, and cold chain compliance with zero baselines', async () => {
    const res = await request(app)
      .get(`/api/analytics/operations?supplierId=${supplierId}&timeframe=30d`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    const data = res.body;

    expect(data.distribution).toBeDefined();

    // Workflow Yield
    expect(data.distribution.workflowYield).toEqual({
      yieldPct: 50,
      successfulRuns: 1,
      totalRuns: 2,
    });

    // Buyer Turnaround Distribution
    expect(data.distribution.turnaroundDistribution).toEqual({
      under2h: { count: 0, pct: 0 },
      twoToSixH: { count: 1, pct: 100 },
      sixToTwentyFourH: { count: 0, pct: 0 },
      over24h: { count: 0, pct: 0 },
      totalEvaluated: 1,
    });

    // Cold Chain Compliance
    expect(data.distribution.coldChainCompliance).toEqual({
      dockCompliancePct: 100,
      tempCompliancePct: 100,
      totalShipments: 1,
      totalColdLogs: 2,
    });

    // Zero-state baseline for other supplier
    const zeroRes = await request(app)
      .get(`/api/analytics/operations?supplierId=${otherSupplierId}&timeframe=30d`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(zeroRes.status).toBe(200);
    expect(zeroRes.body.distribution).toEqual({
      workflowYield: {
        yieldPct: 0,
        successfulRuns: 0,
        totalRuns: 0,
      },
      turnaroundDistribution: {
        under2h: { count: 0, pct: 0 },
        twoToSixH: { count: 0, pct: 0 },
        sixToTwentyFourH: { count: 0, pct: 0 },
        over24h: { count: 0, pct: 0 },
        totalEvaluated: 0,
      },
      coldChainCompliance: {
        dockCompliancePct: 0,
        tempCompliancePct: 0,
        totalShipments: 0,
        totalColdLogs: 0,
      },
    });
  });

  it('dynamically scopes Ingestion and Buyer metrics to the requested timeframe', async () => {
    const now = new Date();
    // Seed an older lot (45 days old)
    const oldLot = await InventoryLot.create({
      supplierId: new mongoose.Types.ObjectId(supplierId),
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      lotNumber: 'LOT-OLD-OPS',
      status: 'active',
      quantityCases: 200,
      availableQty: 200,
      costPerCase: 10,
      standardSellPrice: 15,
      expirationDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
    });

    // Seed an older buyer (45 days old)
    const oldBuyer = await Buyer.create({
      supplierId: new mongoose.Types.ObjectId(supplierId),
      companyName: 'Older Buyer Corp',
      email: 'old@buyer.test',
      isActive: true,
      createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
    });

    try {
      // 30d should EXCLUDE the 45-day-old lot ($9,500) and buyer (1 Verified)
      const res30d = await request(app)
        .get(`/api/analytics/operations?supplierId=${supplierId}&timeframe=30d`)
        .set('Authorization', `Bearer ${validToken}`);
      expect(res30d.status).toBe(200);
      expect(res30d.body.ingestion.portfolioValue).toBe('$9,500');
      expect(res30d.body.ingestion.matchedBuyers).toBe('1 Verified');

      // 90d should INCLUDE the 45-day-old lot: $9,500 + (200 * $15 = $3,000) = $12,500, and 2 Verified buyers
      const res90d = await request(app)
        .get(`/api/analytics/operations?supplierId=${supplierId}&timeframe=90d`)
        .set('Authorization', `Bearer ${validToken}`);
      expect(res90d.status).toBe(200);
      expect(res90d.body.ingestion.portfolioValue).toBe('$12,500');
      expect(res90d.body.ingestion.matchedBuyers).toBe('2 Verified');
    } finally {
      await InventoryLot.deleteOne({ _id: oldLot._id });
      await Buyer.deleteOne({ _id: oldBuyer._id });
    }
  });

  it('calculates dockSla dynamically from actual DockAppointment pickup durations without hardcoding', async () => {
    const now = new Date();
    // Check baseline zero with no appointments
    const zeroRes = await request(app)
      .get(`/api/analytics/operations?supplierId=${otherSupplierId}&timeframe=30d`)
      .set('Authorization', `Bearer ${validToken}`);
    expect(zeroRes.body.coldChain.dockSla).toBe('0.0 hrs');

    // Create a shipment with a 90-minute appointment
    const dummyAward2 = await Award.create({
      offerId: new mongoose.Types.ObjectId(),
      lotId: lot1._id,
      buyerId: new mongoose.Types.ObjectId(),
      awardedQty: 50,
      price: 15.0
    });
    const ship90 = await Shipment.create({
      awardId: dummyAward2._id,
      carrier: 'Custom Logistics',
      pickupLocation: 'Dock 2',
      deliveryLocation: 'Distribution 5',
      status: 'scheduled',
      bolNumber: 'BOL-OPS-90MIN'
    });
    const appt90 = await DockAppointment.create({
      shipmentId: ship90._id,
      pickupWindowStart: new Date(now.getTime() - 2 * 3600000),
      pickupWindowEnd: new Date(now.getTime() - 30 * 60000), // 90 min window
      carrierName: 'Custom Logistics',
      status: 'confirmed',
      slaMet: true
    });

    try {
      const res = await request(app)
        .get(`/api/analytics/operations?supplierId=${supplierId}&timeframe=30d`)
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      // We had appointment 1 (60 min) + appointment 2 (90 min) -> average 75 min = 1.3 hrs (or 1.25 hrs -> '1.3 hrs')
      expect(res.body.coldChain.dockSla).toMatch(/\d+(\.\d+)?\s*(hrs|min)/);
      expect(res.body.coldChain.dockSla).not.toBe('< 45 Min');
    } finally {
      await DockAppointment.deleteOne({ _id: appt90._id });
      await Shipment.deleteOne({ _id: ship90._id });
      await Award.deleteOne({ _id: dummyAward2._id });
    }
  });

  it('includes events occurring at the exact start boundary of the timeframe in velocityTrendline', async () => {
    const now = new Date();
    // 7d timeframe starts 7 days ago. Seed a lot right at start boundary: now - 7 days + 1 second
    const boundaryLot = await InventoryLot.create({
      supplierId: new mongoose.Types.ObjectId(supplierId),
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      lotNumber: 'LOT-BOUNDARY-OPS',
      status: 'active',
      quantityCases: 50,
      availableQty: 50,
      costPerCase: 10,
      standardSellPrice: 15,
      expirationDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 1000),
    });

    try {
      const res = await request(app)
        .get(`/api/analytics/operations?supplierId=${supplierId}&timeframe=7d`)
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      // The boundary lot must be included in the first bucket (index 0) rather than dropped
      expect(res.body.velocityTrendline[0].lots).toBeGreaterThanOrEqual(1);
    } finally {
      await InventoryLot.deleteOne({ _id: boundaryLot._id });
    }
  });
});


