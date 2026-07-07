import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

describe('Workflow Execution Timeline API & Snapshot Test Suite (Issues 0054-0055)', () => {
  jest.setTimeout(30000);

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('Cycle 1 & 2 (Issues 0054-0055): should create automation run with executedAt snapshot and retrieve via REST APIs', async () => {
    const supplierId = new mongoose.Types.ObjectId().toString();
    const cycleId = new mongoose.Types.ObjectId().toString();

    // 1. Create a liquidation automation campaign
    const createRes = await request(app)
      .post('/api/liquidation-automations')
      .send({
        supplierId,
        liquidationCycleId: cycleId,
        name: 'Dairy Liquidation Flash Strategy',
        templateName: 'category_liquidation',
        inventoryFilters: { category: 'Dairy', maxRsl: 0.20 },
        stages: [
          {
            stageIndex: 1,
            name: 'Stage 1 Primary Retails',
            buyerMode: 'custom',
            customBuyers: [{ id: 'b1', name: 'Primary Retails Co', email: 'buyers@primaryretails.com' }],
            discountType: 'yield',
            discountValue: 20
          }
        ],
        donationConfig: {
          enabled: true,
          maxCases: 500,
          diversionStrategy: 'percentage_split',
          donatingEntities: [{ id: 'd1', name: 'Feeding America', email: 'donations@feedingamerica.org', maxCases: 300, allocationPercent: 100 }]
        },
        status: 'active',
        isActive: true
      });

    if (createRes.status !== 201) {
      console.error('CREATE AUTOMATION ERROR:', createRes.body);
    }
    expect(createRes.status).toBe(201);
    const automationId = createRes.body._id;

    // 2. Trigger campaign execution (manual trigger)
    const triggerRes = await request(app)
      .post(`/api/liquidation-automations/${automationId}/trigger`)
      .send();

    expect(triggerRes.status).toBe(201);
    expect(triggerRes.body.executedAt).toBeDefined();
    expect(triggerRes.body.buyerEmails).toContain('buyers@primaryretails.com');
    expect(triggerRes.body.campaignSnapshot?.name).toBe('Dairy Liquidation Flash Strategy');

    const runId = triggerRes.body._id;

    // 3. GET /api/liquidation-automations/:id/runs (Execution Summary List)
    const listRes = await request(app).get(`/api/liquidation-automations/${automationId}/runs`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThan(0);
    expect(listRes.body[0].executedAt).toBeDefined();

    // 4. GET /api/liquidation-automations/runs/:runId (Detailed Execution Run Snapshot)
    const detailRes = await request(app).get(`/api/liquidation-automations/runs/${runId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body._id).toBe(runId);
    expect(detailRes.body.buyerEmails).toContain('buyers@primaryretails.com');
    expect(detailRes.body.campaignSnapshot.name).toBe('Dairy Liquidation Flash Strategy');
  });
});
