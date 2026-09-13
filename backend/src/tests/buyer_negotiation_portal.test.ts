import request from 'supertest';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import app from '../index';
import Offer from '../models/Offer';
import Buyer from '../models/Buyer';
import InventoryLot from '../models/InventoryLot';
import ProductMaster from '../models/ProductMaster';
import DistributionCenter from '../models/DistributionCenter';
import SupplierOAuthMailbox from '../models/SupplierOAuthMailbox';
import Activity from '../models/Activity';
import EmailThread from '../models/EmailThread';
import Award from '../models/Award';

describe('Buyer Negotiation Portal & Outbound Counter Action CTAs (Slice 3, Seam 3A)', () => {
  jest.setTimeout(30000);

  const testSupplierId = 'supplier-portal-test-1';
  let buyer: any;
  let product: any;
  let dc: any;
  let lot: any;
  let offer: any;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.REAL_SMTP = 'true';
    process.env.QUICK_BID_SECRET = 'spoileralert-quick-bid-secret';

    jest.spyOn(nodemailer, 'createTransport').mockImplementation(() => {
      return {
        sendMail: jest.fn().mockResolvedValue({
          messageId: 'test-portal-msg-id-101',
          response: '250 OK'
        })
      } as any;
    });

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/indspoileralert_test');
    }
  });

  beforeEach(async () => {
    const mockSupplierId = new mongoose.Types.ObjectId();

    await SupplierOAuthMailbox.deleteMany({ supplierId: testSupplierId });
    await Activity.deleteMany({ 'metadata.action': { $in: ['counter', 'buyer_rebid'] } });
    await EmailThread.deleteMany({ buyerEmail: /portal-test-buyer/i });
    await Offer.deleteMany({ price: { $in: [12.00, 14.00, 13.50] } });
    await InventoryLot.deleteMany({ lotNumber: 'LOT-PORTAL-0110' });
    await ProductMaster.deleteMany({ sku: 'SKU-PORTAL-0110' });
    await DistributionCenter.deleteMany({ code: 'DC-PORTAL-01' });
    await Buyer.deleteMany({ email: /portal-test-buyer/i });

    buyer = await Buyer.create({
      companyName: 'Metro Wholesale Grocers',
      email: 'portal-test-buyer@example-buyer.org',
      acceptsShortDated: true
    });

    product = await ProductMaster.create({
      supplierId: mockSupplierId,
      sku: 'SKU-PORTAL-0110',
      brand: 'DairyCrest',
      category: 'Dairy',
      description: 'Artisan Aged Cheddar Blocks'
    });

    dc = await DistributionCenter.create({
      supplierId: mockSupplierId,
      name: 'Midwest Distribution Hub',
      code: 'DC-PORTAL-01',
      address: '700 Cold Storage Pkwy, Chicago, IL 60601',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true,
      operatingHours: '07:00 AM - 04:00 PM CST'
    });

    lot = await InventoryLot.create({
      lotNumber: 'LOT-PORTAL-0110',
      distributionCenterId: dc._id,
      productId: product._id,
      supplierId: mockSupplierId,
      quantityCases: 300,
      availableQty: 300,
      standardSellPrice: 22.00,
      costPerCase: 9.00,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    offer = await Offer.create({
      buyerId: buyer._id,
      lotId: lot._id,
      price: 12.00,
      quantity: 150,
      status: 'pending',
      submittedAt: new Date(),
      messages: []
    });
  });

  afterAll(async () => {
    await SupplierOAuthMailbox.deleteMany({ supplierId: testSupplierId });
    await Activity.deleteMany({ 'metadata.action': { $in: ['counter', 'buyer_rebid'] } });
    await EmailThread.deleteMany({ buyerEmail: /portal-test-buyer/i });
    await Offer.deleteMany({ buyerId: buyer?._id });
    await InventoryLot.deleteMany({ lotNumber: 'LOT-PORTAL-0110' });
    await ProductMaster.deleteMany({ sku: 'SKU-PORTAL-0110' });
    await DistributionCenter.deleteMany({ code: 'DC-PORTAL-01' });
    await Buyer.deleteMany({ email: /portal-test-buyer/i });
  });

  describe('HMAC Token Generation & Outbound Counter Action CTAs', () => {
    it('generates cryptographic negotiationToken and embeds portal action link tokens in counter email', async () => {
      const templateBody = '<p>Counter terms: {{counter_price}} for {{counter_quantity}} cases.</p><p><a href="{{accept_counter_link}}">Accept Counter-Offer</a></p><p><a href="{{renegotiate_link}}">Propose New Terms</a></p>';

      const res = await request(app)
        .post(`/api/bids/${offer._id}/renegotiate`)
        .send({
          counterPrice: 15.00,
          counterQuantity: 120,
          templateHtml: templateBody
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedOffer = await Offer.findById(offer._id);
      expect(updatedOffer?.negotiationToken).toBeDefined();
      expect(updatedOffer?.negotiationToken).toContain('.');

      const activity = await Activity.findOne({ lotId: lot._id, 'metadata.action': 'counter' });
      expect(activity?.content).toContain('/portal/negotiation/');
      expect(activity?.content).toContain(updatedOffer?.negotiationToken);
    });

    it('automatically embeds prominent CTA buttons in counter email when plain messageText is provided', async () => {
      await Activity.deleteMany({});
      const res = await request(app)
        .post(`/api/bids/${offer._id}/renegotiate`)
        .send({
          counterPrice: 16.50,
          counterQuantity: 100,
          messageText: 'We propose a counter-offer for Banquet Premium Surplus Item #13 at $16.50 for 100 cases.'
        });

      expect(res.status).toBe(200);
      const activity = await Activity.findOne({ lotId: lot._id, 'metadata.action': 'counter' });
      expect(activity?.content).toContain('Accept Counter-Offer');
      expect(activity?.content).toContain('Propose New Terms / Re-bid');
      expect(activity?.content).toContain('action=accept');
      expect(activity?.content).toContain('action=rebid');
    });
  });

  describe('GET /api/portal/negotiation/:offerId', () => {
    it('rejects access when token is missing or invalid with 401 Unauthorized', async () => {
      const res = await request(app).get(`/api/portal/negotiation/${offer._id}`);
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/unauthorized|token/i);

      const invalidRes = await request(app).get(`/api/portal/negotiation/${offer._id}?token=bad-token.123`);
      expect(invalidRes.status).toBe(401);
    });

    it('returns negotiation context, lot summary, latest counter proposal, and transcript when token is valid', async () => {
      // Dispatch counter to generate negotiationToken
      await request(app)
        .post(`/api/bids/${offer._id}/renegotiate`)
        .send({
          counterPrice: 14.50,
          counterQuantity: 120,
          messageText: 'Can meet at $14.50/cs for 120 cases.'
        });

      const updatedOffer = await Offer.findById(offer._id);
      const token = updatedOffer?.negotiationToken;
      expect(token).toBeDefined();

      const res = await request(app).get(`/api/portal/negotiation/${offer._id}?token=${token}`);
      expect(res.status).toBe(200);
      expect(res.body.offer).toBeDefined();
      expect(res.body.offer.status).toBe('countered');
      expect(res.body.lot).toBeDefined();
      expect(res.body.lot.lotNumber).toBe('LOT-PORTAL-0110');
      expect(res.body.product).toBeDefined();
      expect(res.body.product.description).toBe('Artisan Aged Cheddar Blocks');
      expect(res.body.latestSupplierProposal).toBeDefined();
      expect(res.body.latestSupplierProposal.proposedPrice).toBe(14.50);
      expect(res.body.latestSupplierProposal.proposedQuantity).toBe(120);
    });
  });

  describe('POST /api/portal/negotiation/:offerId/re-bid', () => {
    it('validates token, records revised buyer proposal, reverts status to pending, logs CRM activity, and syncs thread', async () => {
      // First, establish counter offer with valid token
      await request(app)
        .post(`/api/bids/${offer._id}/renegotiate`)
        .send({
          counterPrice: 14.50,
          counterQuantity: 120,
          messageText: 'Counter offer: $14.50/cs for 120 cases.'
        });

      const updatedOffer = await Offer.findById(offer._id);
      const token = updatedOffer?.negotiationToken;

      const res = await request(app)
        .post(`/api/portal/negotiation/${offer._id}/re-bid?token=${token}`)
        .send({
          proposedPrice: 13.50,
          proposedQuantity: 130,
          message: 'Our top budget ceiling is $13.50/cs for 130 cases.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify offer state reverted to 'pending'
      const rebidOffer = await Offer.findById(offer._id);
      expect(rebidOffer?.status).toBe('pending');
      const lastMessage = rebidOffer?.messages[rebidOffer.messages.length - 1];
      expect(lastMessage?.sender).toBe('buyer');
      expect(lastMessage?.proposedPrice).toBe(13.50);
      expect(lastMessage?.proposedQuantity).toBe(130);
      expect(lastMessage?.content).toContain('Our top budget ceiling is $13.50/cs');

      // Verify CRM activity
      const activity = await Activity.findOne({
        lotId: lot._id,
        'metadata.action': 'buyer_rebid'
      });
      expect(activity).toBeDefined();
      expect(activity?.subject).toContain('Buyer Countered');
      expect(activity?.content).toContain('$13.50');

      // Verify Emails Hub thread sync
      const thread = await EmailThread.findOne({ buyerEmail: buyer.email });
      expect(thread).toBeDefined();
      const lastThreadMsg = thread?.messages[thread.messages.length - 1];
      expect(lastThreadMsg?.senderType).toBe('buyer');
      expect(lastThreadMsg?.body).toContain('$13.50');
    });
  });

  describe('POST /api/portal/negotiation/:offerId/accept (Slice 4)', () => {
    it('rejects acceptance when token is missing or invalid with 401 Unauthorized', async () => {
      const res = await request(app)
        .post(`/api/portal/negotiation/${offer._id}/accept`)
        .send();

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/unauthorized|token/i);
    });

    it('accepts supplier counter-offer, awards lot, generates dealToken, and prepares deal settlement', async () => {
      // 1. Supplier counters offer at $14.25/cs for 120 cases
      await request(app)
        .post(`/api/bids/${offer._id}/renegotiate`)
        .send({
          counterPrice: 14.25,
          counterQuantity: 120,
          messageText: 'Counter offer: $14.25/cs for 120 cases.'
        });

      const updatedOffer = await Offer.findById(offer._id);
      const token = updatedOffer?.negotiationToken;
      expect(token).toBeDefined();

      // 2. Buyer accepts counter-offer via portal endpoint
      const acceptRes = await request(app)
        .post(`/api/portal/negotiation/${offer._id}/accept?token=${token}`)
        .send();

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);
      expect(acceptRes.body.dealId).toBeDefined();
      expect(acceptRes.body.dealToken).toBeDefined();
      expect(acceptRes.body.dealToken).toContain('.');

      // 3. Verify offer lifecycle status
      const acceptedOffer = await Offer.findById(offer._id);
      expect(['fully_accepted', 'partially_accepted']).toContain(acceptedOffer?.status);
      expect(acceptedOffer?.awardedQty).toBe(120);

      // 4. Verify Award document
      const award = await Award.findById(acceptRes.body.dealId);
      expect(award).toBeDefined();
      expect(award?.awardedQty).toBe(120);
      expect(award?.price).toBe(14.25);
      expect(award?.totalAmount).toBe(120 * 14.25);
      expect(award?.dealToken).toBe(acceptRes.body.dealToken);

      // 5. Verify DealSettlementPortal token authentication works with this dealToken
      const dealPortalRes = await request(app)
        .get(`/api/deals/${award?._id}?token=${acceptRes.body.dealToken}`);
      expect(dealPortalRes.status).toBe(200);
      expect(dealPortalRes.body.deal.awardedQty).toBe(120);
      expect(dealPortalRes.body.deal.price).toBe(14.25);

      // 6. Verify Lot CRM Activity recorded
      const acceptActivity = await Activity.findOne({ lotId: lot._id, 'metadata.action': 'buyer_accept_counter' });
      expect(acceptActivity).toBeDefined();
      expect(acceptActivity?.subject).toContain('Buyer Accepted Counter-Offer');
      expect((acceptActivity?.metadata as any)?.pricePerCase).toBe(14.25);
      expect((acceptActivity?.metadata as any)?.awardedQuantity).toBe(120);

      // 7. Verify Baseline Bid Preservation Invariant: offer.quantity and offer.price remain original values
      expect(acceptedOffer?.price).toBe(12.00);
      expect(acceptedOffer?.quantity).toBe(150);
    });

    it('rejects unilateral buyer acceptance when no supplier counter proposal exists with 400 Bad Request', async () => {
      // Create fresh pending offer with token generated directly
      const pendingOffer = await Offer.create({
        buyerId: buyer._id,
        lotId: lot._id,
        price: 10.00,
        quantity: 100,
        status: 'pending',
        messages: [{ sender: 'buyer', content: 'Lowball $10 bid', proposedPrice: 10.00, proposedQuantity: 100 }]
      });

      // Generate valid HMAC token for this offer
      const crypto = require('crypto');
      const rawToken = 'testrawtoken123';
      const hmacSecret = process.env.QUICK_BID_SECRET || 'spoileralert-quick-bid-secret';
      const token = `${rawToken}.${crypto.createHmac('sha256', hmacSecret).update(`${rawToken}:${pendingOffer._id}`).digest('hex')}`;
      pendingOffer.negotiationToken = token;
      await pendingOffer.save();

      const res = await request(app)
        .post(`/api/portal/negotiation/${pendingOffer._id}/accept?token=${token}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot accept|no active supplier/i);
    });

    it('rejects counter acceptance if supplier counter was superseded by a buyer re-bid with 400 Bad Request', async () => {
      // Counter offer first
      await request(app)
        .post(`/api/bids/${offer._id}/renegotiate`)
        .send({
          counterPrice: 16.00,
          counterQuantity: 100,
          messageText: 'Counter: $16.00 for 100 cases.'
        });

      const updatedOffer = await Offer.findById(offer._id);
      const token = updatedOffer?.negotiationToken;

      // Buyer re-bids
      await request(app)
        .post(`/api/portal/negotiation/${offer._id}/re-bid?token=${token}`)
        .send({
          proposedPrice: 15.00,
          proposedQuantity: 100,
          message: 'Buyer counter at $15.00.'
        });

      // Offer is now 'pending' and last message is buyer
      const res = await request(app)
        .post(`/api/portal/negotiation/${offer._id}/accept?token=${token}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot accept|superseded/i);
    });

    it('enforces turn-taking by rejecting re-bid if offer is already pending supplier review with 409 Conflict', async () => {
      // Counter offer
      await request(app)
        .post(`/api/bids/${offer._id}/renegotiate`)
        .send({
          counterPrice: 16.00,
          counterQuantity: 100,
          messageText: 'Counter'
        });

      const updatedOffer = await Offer.findById(offer._id);
      const token = updatedOffer?.negotiationToken;

      // First re-bid succeeds
      const firstRebid = await request(app)
        .post(`/api/portal/negotiation/${offer._id}/re-bid?token=${token}`)
        .send({
          proposedPrice: 15.00,
          proposedQuantity: 100,
          message: 'First rebid'
        });
      expect(firstRebid.status).toBe(200);

      // Immediate second re-bid fails with 409 Conflict
      const secondRebid = await request(app)
        .post(`/api/portal/negotiation/${offer._id}/re-bid?token=${token}`)
        .send({
          proposedPrice: 14.50,
          proposedQuantity: 100,
          message: 'Second rebid'
        });
      expect(secondRebid.status).toBe(409);
      expect(secondRebid.body.error).toMatch(/already pending/i);
    });

    it('rejects re-bid if offer is already decided (rejected or accepted) with 400 Bad Request', async () => {
      // Decline the offer
      await request(app)
        .post(`/api/bids/${offer._id}/decline`)
        .send({ reason: 'Inventory unavailable' });

      // Attempt to re-bid on rejected offer using valid token
      const crypto = require('crypto');
      const rawToken = 'testrawtoken456';
      const hmacSecret = process.env.QUICK_BID_SECRET || 'spoileralert-quick-bid-secret';
      const token = `${rawToken}.${crypto.createHmac('sha256', hmacSecret).update(`${rawToken}:${offer._id}`).digest('hex')}`;
      offer.negotiationToken = token;
      await offer.save();

      const res = await request(app)
        .post(`/api/portal/negotiation/${offer._id}/re-bid?token=${token}`)
        .send({
          proposedPrice: 14.00,
          proposedQuantity: 100
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot submit a counter-bid|rejected/i);
    });
  });
});
