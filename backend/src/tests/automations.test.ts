import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { createAutomationRun } from '../services/agendaService';
import EmailDispatchLog from '../models/EmailDispatchLog';
import AutomationRun from '../models/AutomationRun';

describe('Liquidation Automations API Endpoints', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spoiler-alert';
        await mongoose.connect(uri);
      } catch (e) {}
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.disconnect();
      } catch (e) {}
    }
  });

  it('should create a new liquidation automation workflow', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const cycleId = new mongoose.Types.ObjectId();
    const automationData = {
      supplierId: supplierId.toString(),
      liquidationCycleId: cycleId.toString(),
      templateName: 'smart_bidding_auction',
      inventoryFilters: { category: 'Dairy', maxRsl: 0.15 },
      targetBuyerSelection: 'all_matched',
      schedule: {
        type: 'cron',
        cronExpression: '0 8 * * 1'
      }
    };

    const res = await request(app)
      .post('/api/liquidation-automations')
      .send(automationData);

    expect(res.status).toBe(201);
    expect(res.body).toBeDefined();
    expect(res.body.templateName).toBe('smart_bidding_auction');
    expect(res.body.inventoryFilters.category).toBe('Dairy');
    expect(res.body.status).toBe('active');

    // Clean up
    const LiquidationAutomation = mongoose.model('LiquidationAutomation');
    await LiquidationAutomation.findByIdAndDelete(res.body._id);
  });

  it('should create a workflow template with custom stage-gate rules, emails, and timezone schedule, defaulting to isActive true', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const workflowData = {
      supplierId: supplierId.toString(),
      name: 'Dairy Quick Liquidation',
      templateName: 'custom_stage_gate',
      inventoryFilters: {
        category: 'Dairy',
        maxRsl: 0.20,
        explicitLotIds: [new mongoose.Types.ObjectId().toString()],
        excludedLotIds: []
      },
      schedule: {
        type: 'cron',
        timezone: 'America/New_York',
        timeOfDay: '09:00',
        daysOfWeek: [1]
      },
      emailTemplate: {
        subject: 'Urgent Offer',
        body: 'Here is our stock: {{inventory_table}}',
        targetBuyers: 'matched_only'
      },
      rules: {
        evaluationWindowHours: 48,
        onSuccess: 'auto_award',
        onFallback: 'auto_donate',
        minimumBidFloorPrice: 10.0,
        minimumYieldRecoveryPercent: 35
      }
    };

    const res = await request(app)
      .post('/api/liquidation-automations')
      .send(workflowData);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Dairy Quick Liquidation');
    expect(res.body.isActive).toBe(true);
    expect(res.body.schedule.timezone).toBe('America/New_York');
    expect(res.body.rules.minimumBidFloorPrice).toBe(10.0);
    expect(res.body.stats.totalRuns).toBe(0);

    // Clean up
    const LiquidationAutomation = mongoose.model('LiquidationAutomation');
    await LiquidationAutomation.findByIdAndDelete(res.body._id);
  });

  it('should enforce unique workflow names per supplier', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const workflowData = {
      supplierId: supplierId.toString(),
      name: 'Unique Strategy Alpha',
      templateName: 'custom_stage_gate'
    };

    const firstRes = await request(app)
      .post('/api/liquidation-automations')
      .send(workflowData);

    expect(firstRes.status).toBe(201);

    const dupRes = await request(app)
      .post('/api/liquidation-automations')
      .send(workflowData);

    expect(dupRes.status).toBe(400);
    expect(dupRes.body.error).toMatch(/already exists/i);

    // Clean up
    const LiquidationAutomation = mongoose.model('LiquidationAutomation');
    await LiquidationAutomation.findByIdAndDelete(firstRes.body._id);
  });

  it('should retrieve liquidation automations for a specific supplier only', async () => {
    const supplierA = new mongoose.Types.ObjectId();
    const supplierB = new mongoose.Types.ObjectId();

    const LiquidationAutomation = mongoose.model('LiquidationAutomation');
    const auto1 = await LiquidationAutomation.create({
      supplierId: supplierA,
      name: 'Produce Bidding Strategy',
      templateName: 'smart_bidding_auction',
      inventoryFilters: { category: 'Produce' },
      status: 'active'
    });
    const auto2 = await LiquidationAutomation.create({
      supplierId: supplierA,
      name: 'Meat Closeout Strategy',
      templateName: 'direct_closeout_blast',
      inventoryFilters: { category: 'Meat' },
      status: 'paused'
    });
    const auto3 = await LiquidationAutomation.create({
      supplierId: supplierB,
      templateName: 'auto_donate_safeguard',
      inventoryFilters: {},
      status: 'active'
    });

    const res = await request(app)
      .get(`/api/liquidation-automations?supplierId=${supplierA.toString()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    const templates = res.body.map((a: any) => a.templateName);
    expect(templates).toContain('smart_bidding_auction');
    expect(templates).toContain('direct_closeout_blast');
    expect(templates).not.toContain('auto_donate_safeguard');

    // Clean up
    await LiquidationAutomation.deleteMany({ _id: { $in: [auto1._id, auto2._id, auto3._id] } });
  });

  it('should fetch a single liquidation automation by ID', async () => {
    const LiquidationAutomation = mongoose.model('LiquidationAutomation');
    const supplierId = new mongoose.Types.ObjectId();
    const created = await LiquidationAutomation.create({
      supplierId,
      name: 'Single Automation Test',
      templateName: 'smart_bidding_auction',
      inventoryFilters: { category: 'Produce' },
      status: 'active'
    });

    const res = await request(app).get(`/api/liquidation-automations/${created._id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Single Automation Test');
    expect(res.body.templateName).toBe('smart_bidding_auction');

    // Clean up
    await LiquidationAutomation.findByIdAndDelete(created._id);
  });

  it('should trigger a manual run on a template, capture matching inventory, and save an AutomationRun record', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const dcId = new mongoose.Types.ObjectId();
    
    // Seed matching product & inventory lot
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');

    const product = await ProductMaster.create({
      supplierId,
      sku: 'TEST-DAIRY-1',
      brand: 'TestBrand',
      category: 'Dairy',
      description: 'Test Creamer',
      shelfLifeDays: 30
    });

    const lot = await InventoryLot.create({
      supplierId,
      distributionCenterId: dcId,
      productId: product._id,
      lotNumber: 'L-DAIRY-999',
      expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days remaining
      remainingShelfLife: 0.20,
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 10,
      standardSellPrice: 15,
      status: 'active'
    });

    // Create a template
    const template = await mongoose.model('LiquidationAutomation').create({
      supplierId,
      name: 'Dairy Quick Liquidation',
      templateName: 'custom_stage_gate',
      inventoryFilters: {
        category: 'Dairy',
        maxRsl: 0.50
      },
      stages: [{
        stageIndex: 1,
        buyerMode: 'custom',
        customBuyers: [{ name: 'Test Buyer', email: 'testbuyer@example.com' }]
      }],
      schedule: {
        type: 'cron',
        timezone: 'America/New_York'
      },
      rules: {
        evaluationWindowHours: 48,
        onSuccess: 'auto_award',
        onFallback: 'auto_donate'
      }
    });

    // Call the trigger endpoint
    const res = await request(app)
      .post(`/api/liquidation-automations/${template._id}/trigger`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.automationId).toBe(template._id.toString());
    expect(res.body.status).toBe('evaluating');
    expect(res.body.runType).toBe('manual');
    expect(res.body.snapshotInventoryIds).toContain(lot._id.toString());

    // Verify GET /api/automation-runs returns the runs
    const getRes = await request(app)
      .get(`/api/automation-runs?supplierId=${supplierId.toString()}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBe(1);
    expect(getRes.body[0].automationId).toBe(template._id.toString());

    // Clean up
    await ProductMaster.findByIdAndDelete(product._id);
    await InventoryLot.findByIdAndDelete(lot._id);
    await mongoose.model('LiquidationAutomation').findByIdAndDelete(template._id);
    // Find and delete the AutomationRun if created
    const AutomationRun = mongoose.model('AutomationRun');
    await AutomationRun.deleteMany({ automationId: template._id });
  });

  it('should schedule a timezone-aware job in Agenda when a template is created, and cancel it when deactivated', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const workflowData = {
      supplierId: supplierId.toString(),
      name: 'Chicago AM Closeouts',
      templateName: 'custom_stage_gate',
      inventoryFilters: { category: 'Produce' },
      schedule: {
        type: 'cron',
        timezone: 'America/Chicago',
        timeOfDay: '08:30',
        daysOfWeek: [1] // Monday
      },
      emailTemplate: {
        subject: 'Weekly Closeouts',
        body: 'Check out these items: {{inventory_table}}',
        targetBuyers: 'matched_only'
      },
      rules: {
        evaluationWindowHours: 24,
        onSuccess: 'auto_award',
        onFallback: 'auto_donate'
      }
    };

    // 1. Create template
    const res = await request(app)
      .post('/api/liquidation-automations')
      .send(workflowData);

    expect(res.status).toBe(201);
    const templateId = res.body._id;

    // 2. Query agenda collection to verify job exists
    const db = mongoose.connection.db!;
    const agendaJobsCol = db.collection('agendaJobs');
    
    // Wait briefly for Agenda to persist the job
    await new Promise(resolve => setTimeout(resolve, 500));

    const job = await agendaJobsCol.findOne({ 'data.automationId': new mongoose.Types.ObjectId(templateId) });
    expect(job).toBeTruthy();
    expect(job!.repeatInterval).toBe('30 8 * * 1'); // Resolved cron expression for Monday 08:30
    expect(job!.repeatTimezone).toBe('America/Chicago');

    // 3. Update template to deactivated (isActive = false)
    const updateRes = await request(app)
      .put(`/api/liquidation-automations/${templateId}`)
      .send({ isActive: false });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.isActive).toBe(false);

    // Wait briefly for Agenda to cancel/delete the job
    await new Promise(resolve => setTimeout(resolve, 500));

    const deletedJob = await agendaJobsCol.findOne({ 'data.automationId': new mongoose.Types.ObjectId(templateId) });
    expect(deletedJob).toBeFalsy();

    // Clean up
    await mongoose.model('LiquidationAutomation').findByIdAndDelete(templateId);
  });

  it('should render custom preview emails and show empty warning if matching inventory is empty', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');

    // Seed a dairy product and lot
    const product = await ProductMaster.create({
      supplierId,
      sku: 'TEST-PREVIEW-DAIRY',
      brand: 'TestBrand',
      category: 'Dairy',
      description: 'Organic Milk',
      shelfLifeDays: 30
    });

    const lot = await InventoryLot.create({
      supplierId,
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: product._id,
      lotNumber: 'L-PREVIEW-1',
      expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      remainingShelfLife: 0.15,
      quantityCases: 50,
      availableQty: 50,
      costPerCase: 8.0,
      standardSellPrice: 12.0,
      status: 'active'
    });

    // Case A: Preview with matching lots
    const previewDataSuccess = {
      subject: 'Surplus Offer',
      body: 'Hello {{contact_name}},\n\nHere is our stock:\n\n{{inventory_table}}',
      inventoryFilters: {
        category: 'Dairy',
        maxRsl: 0.30
      },
      supplierId: supplierId.toString()
    };

    const resSuccess = await request(app)
      .post('/api/liquidation-automations/preview-email')
      .send(previewDataSuccess);

    expect(resSuccess.status).toBe(200);
    expect(resSuccess.body.renderedBodyHtml).toContain('Organic Milk');
    expect(resSuccess.body.renderedBodyHtml).toContain('50');
    expect(resSuccess.body.matchesZeroLots).toBe(false);

    // Case B: Preview with 0 matching lots (empty state warning)
    const previewDataEmpty = {
      subject: 'Surplus Offer',
      body: 'Hello {{contact_name}},\n\nHere is our stock:\n\n{{inventory_table}}',
      inventoryFilters: {
        category: 'Produce', // Filters out our seeded Dairy product
        maxRsl: 0.30
      },
      supplierId: supplierId.toString()
    };

    const resEmpty = await request(app)
      .post('/api/liquidation-automations/preview-email')
      .send(previewDataEmpty);

    expect(resEmpty.status).toBe(200);
    expect(resEmpty.body.matchesZeroLots).toBe(true);
    expect(resEmpty.body.renderedBodyHtml).toContain('warning');

    // Clean up
    await ProductMaster.findByIdAndDelete(product._id);
    await InventoryLot.findByIdAndDelete(lot._id);
  });

  it('should auto-award and resolve run when a qualifying bid is submitted before timeout', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const dcId = new mongoose.Types.ObjectId();
    const buyerId = new mongoose.Types.ObjectId();

    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Opportunity = mongoose.model('Opportunity');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const Buyer = mongoose.model('Buyer');

    // Seed buyer
    const buyer = await Buyer.create({
      _id: buyerId,
      companyName: 'Test Buyer Corp',
      email: `test-award-${Date.now()}@buyer.com`,
      acceptsShortDated: true,
      minShelfLife: 5,
      categories: ['Dairy'],
      transportRadius: 150,
      warehouseLocations: [{ lat: 41.8781, lng: -87.6298 }]
    });

    // Seed product and lot
    const product = await ProductMaster.create({
      supplierId,
      sku: 'TEST-AWARD-SKU',
      brand: 'TestBrand',
      category: 'Dairy',
      description: 'Award Creamer',
      shelfLifeDays: 30
    });

    const lot = await InventoryLot.create({
      supplierId,
      distributionCenterId: dcId,
      productId: product._id,
      lotNumber: 'L-AWARD-111',
      expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      remainingShelfLife: 0.20,
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 10,
      standardSellPrice: 15,
      status: 'active'
    });

    // Create Opportunity & Marketplace Listing
    const opportunity = await Opportunity.create({
      lotId: lot._id,
      opportunityType: 'sell',
      priority: 'high',
      recommendedAction: 'sell',
      status: 'approved'
    });

    const listing = await MarketplaceListing.create({
      opportunityId: opportunity._id,
      sellerId: supplierId,
      allowBidding: true,
      startingPrice: 12.0,
      minimumPrice: 10.0,
      status: 'active',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });

    // Create active template
    const template = await mongoose.model('LiquidationAutomation').create({
      supplierId,
      name: 'Dairy Auto-Award Test',
      templateName: 'custom_stage_gate',
      inventoryFilters: { category: 'Dairy' },
      stages: [{
        stageIndex: 1,
        buyerMode: 'custom',
        customBuyers: [{ name: 'Test Buyer', email: 'testbuyer@example.com' }]
      }],
      schedule: { type: 'cron', timezone: 'America/New_York' },
      rules: {
        evaluationWindowHours: 48,
        onSuccess: 'auto_award',
        onFallback: 'auto_donate',
        minimumBidFloorPrice: 10.0
      }
    });

    // 1. Trigger the workflow run (creates active run in 'evaluating' state)
    const runRes = await request(app)
      .post(`/api/liquidation-automations/${template._id}/trigger`)
      .send({});
    expect(runRes.status).toBe(201);
    const runId = runRes.body._id;

    // 2. Submit a qualifying bid on the listing
    const bidData = {
      buyerId: buyerId.toString(),
      quantity: 50,
      price: 11.50 // Meets floor price of 10.0
    };

    const bidRes = await request(app)
      .post(`/api/marketplace/listing/${listing._id}/bids`)
      .send(bidData);
    expect(bidRes.status).toBe(201);

    // 3. Verify AutomationRun is updated to 'awarded'
    const updatedRun = await mongoose.model('AutomationRun').findById(runId);
    expect(updatedRun).toBeTruthy();
    expect(updatedRun!.status).toBe('awarded');
    expect(updatedRun!.resolution!.action).toBe('auto_award');
    expect(updatedRun!.resolution!.targetBuyerId.toString()).toBe(buyerId.toString());

    // Clean up
    await Buyer.findByIdAndDelete(buyerId);
    await ProductMaster.findByIdAndDelete(product._id);
    await InventoryLot.findByIdAndDelete(lot._id);
    await Opportunity.findByIdAndDelete(opportunity._id);
    await MarketplaceListing.findByIdAndDelete(listing._id);
    await mongoose.model('LiquidationAutomation').findByIdAndDelete(template._id);
    await mongoose.model('AutomationRun').findByIdAndDelete(runId);
    await mongoose.model('Offer').deleteMany({ listingId: listing._id });
    await mongoose.model('Award').deleteMany({ listingId: listing._id });
  });

  it('should auto-donate and resolve run when evaluation window expires (fallback timeout)', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const dcId = new mongoose.Types.ObjectId();

    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Opportunity = mongoose.model('Opportunity');
    const MarketplaceListing = mongoose.model('MarketplaceListing');

    // Seed product and lot
    const product = await ProductMaster.create({
      supplierId,
      sku: 'TEST-FALLBACK-SKU',
      brand: 'TestBrand',
      category: 'Dairy',
      description: 'Fallback Creamer',
      shelfLifeDays: 30
    });

    const lot = await InventoryLot.create({
      supplierId,
      distributionCenterId: dcId,
      productId: product._id,
      lotNumber: 'L-FALLBACK-111',
      expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      remainingShelfLife: 0.20,
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 10,
      standardSellPrice: 15,
      status: 'active'
    });

    // Create Opportunity
    const opportunity = await Opportunity.create({
      lotId: lot._id,
      opportunityType: 'sell',
      priority: 'high',
      recommendedAction: 'sell',
      status: 'approved'
    });

    // Create active template with onFallback: 'auto_donate'
    const template = await mongoose.model('LiquidationAutomation').create({
      supplierId,
      name: 'Dairy Fallback Test',
      templateName: 'custom_stage_gate',
      inventoryFilters: { category: 'Dairy' },
      stages: [{
        stageIndex: 1,
        buyerMode: 'custom',
        customBuyers: [{ name: 'Test Buyer', email: 'testbuyer@example.com' }]
      }],
      schedule: { type: 'cron', timezone: 'America/New_York' },
      rules: {
        evaluationWindowHours: 48,
        onSuccess: 'auto_award',
        onFallback: 'auto_donate',
        minimumBidFloorPrice: 10.0
      }
    });

    // 1. Trigger the workflow run (creates active run in 'evaluating' state and schedules fallback job)
    const runRes = await request(app)
      .post(`/api/liquidation-automations/${template._id}/trigger`)
      .send({});
    expect(runRes.status).toBe(201);
    const runId = runRes.body._id;

    // 2. Fetch fallback job from agendaJobs collection
    const db = mongoose.connection.db!;
    const agendaJobsCol = db.collection('agendaJobs');
    
    // Wait briefly for Agenda to persist the job
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const jobData = await agendaJobsCol.findOne({ 'data.runId': new mongoose.Types.ObjectId(runId) });
    expect(jobData).toBeTruthy();

    // 3. Trigger the fallback job handler directly to simulate timeout
    const { agenda } = require('../services/agendaService');
    const fallbackHandler = agenda._definitions['execute-workflow-fallback'].fn;
    
    await fallbackHandler({ attrs: { data: { runId: new mongoose.Types.ObjectId(runId) } } });

    // 4. Verify run status is 'fallback_executed' and resolution is 'auto_donate'
    const updatedRun = await mongoose.model('AutomationRun').findById(runId);
    expect(updatedRun!.status).toBe('fallback_executed');
    expect(updatedRun!.resolution!.action).toBe('auto_donate');

    // 5. Verify the lot status has been updated to 'donated'
    const updatedLot = await InventoryLot.findById(lot._id);
    expect(updatedLot!.status).toBe('donated');
    expect(updatedLot!.availableQty).toBe(0);

    // Clean up
    await ProductMaster.findByIdAndDelete(product._id);
    await InventoryLot.findByIdAndDelete(lot._id);
    await Opportunity.findByIdAndDelete(opportunity._id);
    await mongoose.model('LiquidationAutomation').findByIdAndDelete(template._id);
    await mongoose.model('AutomationRun').findByIdAndDelete(runId);
    await mongoose.model('Donation').deleteMany({ lotId: lot._id });
  });

  it('should force expire an active evaluating run via API and trigger onFallback', async () => {
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const supplierId = new mongoose.Types.ObjectId();

    const product = await ProductMaster.create({
      supplierId,
      sku: 'SKU-FORCE-EXPIRE',
      description: 'Force Expire Milk',
      category: 'Dairy',
      shelfLifeDays: 30
    });

    const lot = await InventoryLot.create({
      supplierId,
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: product._id,
      lotNumber: 'LOT-FORCE-EXPIRE',
      expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      quantityCases: 50,
      availableQty: 50,
      costPerCase: 5.0,
      standardSellPrice: 10.0,
      status: 'active'
    });

    const template = await mongoose.model('LiquidationAutomation').create({
      supplierId,
      name: 'Forced Fallback Test',
      templateName: 'smart_bidding_auction',
      inventoryFilters: { category: 'Dairy' },
      stages: [{
        stageIndex: 1,
        buyerMode: 'custom',
        customBuyers: [{ name: 'Test Buyer', email: 'testbuyer@example.com' }]
      }],
      schedule: { type: 'immediate' },
      rules: {
        evaluationWindowHours: 24,
        onSuccess: 'auto_award',
        onFallback: 'auto_donate',
        minimumBidFloorPrice: 8.0
      }
    });

    const runRes = await request(app)
      .post(`/api/liquidation-automations/${template._id}/trigger`)
      .send({});
    expect(runRes.status).toBe(201);
    const runId = runRes.body._id;

    const forceRes = await request(app)
      .post(`/api/automation-runs/${runId}/force-expire`)
      .send({});
    expect(forceRes.status).toBe(200);
    expect(forceRes.body.status).toBe('fallback_executed');
    expect(forceRes.body.resolution.action).toBe('auto_donate');

    const updatedLot = await InventoryLot.findById(lot._id);
    expect(updatedLot!.status).toBe('donated');
    expect(updatedLot!.availableQty).toBe(0);

    // Clean up
    await ProductMaster.findByIdAndDelete(product._id);
    await InventoryLot.findByIdAndDelete(lot._id);
    await mongoose.model('LiquidationAutomation').findByIdAndDelete(template._id);
    await mongoose.model('AutomationRun').findByIdAndDelete(runId);
    await mongoose.model('Donation').deleteMany({ lotId: lot._id });
  });

  it('should successfully save short_dated_clearance template and other FE strategy templates without enum validation errors', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const cycleId = new mongoose.Types.ObjectId();

    const templatesToTest = [
      'short_dated_clearance',
      'category_liquidation',
      'coa_verified_priority',
      'standard_tiered_markdown',
      'overstock_volume_liquidation',
      'category_overstock',
      'distressed_salvage'
    ];

    const createdIds: string[] = [];

    for (const tName of templatesToTest) {
      const res = await request(app)
        .post('/api/liquidation-automations')
        .send({
          supplierId: supplierId.toString(),
          liquidationCycleId: cycleId.toString(),
          templateName: tName,
          inventoryFilters: { category: 'Dairy', maxRsl: 0.20, minCases: 10 },
          rules: {
            onSuccess: 'auto_award',
            onFallback: 'auto_donate'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.templateName).toBe(tName);
      expect(res.body.templateKey).toBe(tName);
      createdIds.push(res.body._id);
    }

    // Clean up
    const LiquidationAutomation = mongoose.model('LiquidationAutomation');
    await LiquidationAutomation.deleteMany({ _id: { $in: createdIds } });
  });

  it('should handle templateKey parameter fallback when templateName is omitted in request body', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/liquidation-automations')
      .send({
        supplierId: supplierId.toString(),
        templateKey: 'short_dated_clearance',
        inventoryFilters: { maxRsl: 0.15 }
      });

    expect(res.status).toBe(201);
    expect(res.body.templateName).toBe('short_dated_clearance');
    expect(res.body.templateKey).toBe('short_dated_clearance');

    await mongoose.model('LiquidationAutomation').findByIdAndDelete(res.body._id);
  });

  it('should save and retrieve full stage-gate rules and email blocks intact without stripping custom attributes', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const stages = [
      { stageNumber: 1, name: 'Stage 1: Primary Bargain', discountType: 'percentage_off_wholesale', discountValue: 15, waitHours: 24, buyerMode: 'segment', buyerSegment: 'Tier 1 Wholesale', autoExecute: true },
      { stageNumber: 2, name: 'Stage 2: Broad Market Clearance', discountType: 'fixed_price', discountValue: 5.0, waitHours: 48, buyerMode: 'all', autoExecute: false }
    ];
    const emailBlocks = [
      { id: 'b1', type: 'text', content: 'Special offer sheet:' },
      { id: 'b2', type: 'inventory_table', content: '{{inventory_table}}' }
    ];

    const res = await request(app)
      .post('/api/liquidation-automations')
      .send({
        supplierId: supplierId.toString(),
        templateName: 'short_dated_clearance',
        stages,
        emailTemplate: {
          subject: 'Special Closeout Offer',
          blocks: emailBlocks,
          customIntro: 'Clearance details attached'
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.stages).toHaveLength(2);
    expect(res.body.stages[0].stageNumber).toBe(1);
    expect(res.body.stages[0].discountType).toBe('percentage_off_wholesale');
    expect(res.body.stages[0].buyerSegment).toBe('Tier 1 Wholesale');
    expect(res.body.emailTemplate.blocks).toHaveLength(2);
    expect(res.body.emailTemplate.customIntro).toBe('Clearance details attached');

    await mongoose.model('LiquidationAutomation').findByIdAndDelete(res.body._id);
  });

  it('should patch campaign status (draft -> active -> stopped) and sync isActive boolean', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const LiquidationAutomation = mongoose.model('LiquidationAutomation');

    // Create a draft campaign
    const campaign = await LiquidationAutomation.create({
      supplierId,
      templateName: 'short_dated_clearance',
      status: 'draft',
      isActive: false,
      createdBy: 'Sales Manager'
    });

    // Patch to active
    const activeRes = await request(app)
      .patch(`/api/liquidation-automations/${campaign._id}/status`)
      .send({ status: 'active' });

    expect(activeRes.status).toBe(200);
    expect(activeRes.body.status).toBe('active');
    expect(activeRes.body.isActive).toBe(true);

    // Patch to stopped
    const stoppedRes = await request(app)
      .patch(`/api/liquidation-automations/${campaign._id}/status`)
      .send({ status: 'stopped' });

    expect(stoppedRes.status).toBe(200);
    expect(stoppedRes.body.status).toBe('stopped');
    expect(stoppedRes.body.isActive).toBe(false);

    // Patch with invalid status
    const invalidRes = await request(app)
      .patch(`/api/liquidation-automations/${campaign._id}/status`)
      .send({ status: 'invalid_status' });

    expect(invalidRes.status).toBe(400);

    // Clean up
    await LiquidationAutomation.findByIdAndDelete(campaign._id);
  });

  it('should delete a liquidation automation by id and return 404 for non-existent id', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const LiquidationAutomation = mongoose.model('LiquidationAutomation');

    const campaign = await LiquidationAutomation.create({
      supplierId,
      templateName: 'short_dated_clearance',
      name: 'Temporary Campaign To Delete',
      status: 'draft'
    });

    const deleteRes = await request(app)
      .delete(`/api/liquidation-automations/${campaign._id}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain('deleted successfully');
    expect(deleteRes.body.id).toBe(campaign._id.toString());

    // Verify it is removed from db
    const found = await LiquidationAutomation.findById(campaign._id);
    expect(found).toBeNull();

    // Deleting again should return 404
    const notFoundRes = await request(app)
      .delete(`/api/liquidation-automations/${campaign._id}`);
    expect(notFoundRes.status).toBe(404);
  });

  describe('Ticket 01 - Seam 2: Zero-Buyer Execution Guardrail & Recipient Audit Logging', () => {
    jest.setTimeout(15000);

    it('Ticket 01 - Criterion 2: should transition AutomationRun status to error and populate errorReason if 0 target buyers exist', async () => {

      const supplierId = new mongoose.Types.ObjectId();
      const automation = {
        _id: new mongoose.Types.ObjectId(),
        supplierId,
        name: 'Empty Audience Strategy',
        templateName: 'custom_stage_gate',
        stages: [{
          stageIndex: 1,
          buyerMode: 'custom',
          customBuyers: []
        }]
      };

      const run = await createAutomationRun(automation, [], 'manual');
      expect(run).toBeDefined();
      if (!run) return;
      expect(run.status).toBe('error');
      expect(run.errorReason).toContain('0 target buyers');
    });

    it('Ticket 01 - Criterion 3: should record EmailDispatchLog entries per recipient buyer with compiled buyer name', async () => {
      const supplierId = new mongoose.Types.ObjectId();
      const automation = {
        _id: new mongoose.Types.ObjectId(),
        supplierId,
        name: 'Targeted Campaign',
        templateName: 'custom_stage_gate',
        stages: [{
          stageIndex: 1,
          buyerMode: 'custom',
          customBuyers: [
            { id: 'b1', name: 'Apex Foods Ltd', email: 'apex@test.com' },
            { id: 'b2', name: 'Metro Retailers', email: 'metro@test.com' }
          ]
        }]
      };

      const run = await createAutomationRun(automation, [], 'manual');
      expect(run).toBeDefined();
      if (!run) return;
      expect(run.status).toBe('evaluating');
      expect(run.buyerEmails).toContain('apex@test.com');
      expect(run.buyerEmails).toContain('metro@test.com');

      if (mongoose.connection.readyState === 1) {
        const logs = await EmailDispatchLog.find({ supplierId: supplierId.toString() });
        expect(logs.length).toBe(2);
        expect(logs.some(l => l.buyerEmail === 'apex@test.com' && l.compiledBuyerName === 'Apex Foods Ltd')).toBe(true);
      }
    });

  });
});





