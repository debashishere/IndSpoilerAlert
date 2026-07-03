import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import SupplierOAuthMailbox from '../models/SupplierOAuthMailbox';
import EmailDispatchLog from '../models/EmailDispatchLog';
import QuickBidToken from '../models/QuickBidToken';
import Buyer from '../models/Buyer';
import InventoryLot from '../models/InventoryLot';

describe('Slice 5: POST /api/emails/dispatch-broadcast', () => {
  jest.setTimeout(30000);
  const testSupplierId = 'supplier-broadcast-test-1';

  beforeEach(async () => {
    try {
      await SupplierOAuthMailbox.deleteMany({ supplierId: testSupplierId });
      await EmailDispatchLog.deleteMany({ supplierId: testSupplierId });
      await QuickBidToken.deleteMany({ buyerEmail: /broadcast-test/i });
      await Buyer.deleteMany({ email: /broadcast-test/i });
    } catch (err) {
      // Ignore if DB connection is initializing
    }
  });

  afterAll(async () => {
    try {
      await SupplierOAuthMailbox.deleteMany({ supplierId: testSupplierId });
      await EmailDispatchLog.deleteMany({ supplierId: testSupplierId });
      await QuickBidToken.deleteMany({ buyerEmail: /broadcast-test/i });
      await Buyer.deleteMany({ email: /broadcast-test/i });
    } catch (err) {
      // Cleanup best effort
    }
  });

  it('should return 400 error if SupplierOAuthMailbox is missing or not connected', async () => {
    // Ensure mailbox is not connected (e.g. status: 'expired')
    await SupplierOAuthMailbox.create({
      supplierId: testSupplierId,
      status: 'expired',
      userEmail: 'ops@testsupplier.com'
    });

    const response = await request(app)
      .post('/api/emails/dispatch-broadcast')
      .send({
        supplierId: testSupplierId,
        buyerSegment: 'all_buyers',
        emailSubject: 'Test Subject',
        emailBodyHtml: '<p>Test Body</p>'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/OAuth Mailbox not connected/i);
  });

  it('should execute broadcast, generate CTA tokens, send emails, and log dispatches when connected', async () => {
    // 1. Create connected mailbox
    await SupplierOAuthMailbox.create({
      supplierId: testSupplierId,
      status: 'connected',
      userEmail: 'ops@testsupplier.com',
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    });

    // 2. Create test buyers
    const buyer1 = await Buyer.create({
      companyName: 'Broadcast Test Buyer 1',
      email: 'buyer1-broadcast-test@example.com',
      acceptsShortDated: true,
      minShelfLife: 7
    });
    const buyer2 = await Buyer.create({
      companyName: 'Broadcast Test Buyer 2',
      email: 'buyer2-broadcast-test@example.com',
      acceptsShortDated: true,
      minShelfLife: 7
    });

    // 3. Create test inventory lot
    const lot = await InventoryLot.create({
      supplierId: new mongoose.Types.ObjectId(),
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      lotNumber: 'LOT-TEST-100',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      costPerCase: 25.0,
      standardSellPrice: 45.0,
      availableQty: 500,
      quantityCases: 500,
      status: 'active'
    });

    // 4. Trigger dispatch broadcast
    const response = await request(app)
      .post('/api/emails/dispatch-broadcast')
      .send({
        supplierId: testSupplierId,
        buyerSegment: 'all_buyers',
        explicitBuyerIds: [buyer1._id.toString(), buyer2._id.toString()],
        lotIds: [lot._id.toString()],
        templateId: 'default',
        emailSubject: 'Liquidation Offer for {{buyer_name}}',
        emailBodyHtml: '<div>Hello {{buyer_name}}, check {{inventory_table}} and <a href="{{quick_bid_link}}">Bid Here</a></div>'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.dispatchedCount).toBe(2);

    // 5. Verify QuickBidTokens were created for both buyers
    const tokens = await QuickBidToken.find({ buyerEmail: { $in: [buyer1.email, buyer2.email] } });
    expect(tokens.length).toBe(2);
    expect(tokens[0].token).toBeDefined();

    // 6. Verify EmailDispatchLogs were created
    const logs = await EmailDispatchLog.find({ supplierId: testSupplierId });
    expect(logs.length).toBe(2);
    expect(logs.map((l: any) => l.buyerEmail).sort()).toEqual([buyer1.email, buyer2.email].sort());

    await InventoryLot.findByIdAndDelete(lot._id);
  });
});
