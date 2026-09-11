import request from 'supertest';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import app from '../index';

describe('Bid Renegotiate State Machine & Ledger (Issue #03A)', () => {
  jest.setTimeout(25000);

  let buyerId: string;
  let offerId: string;

  beforeAll(async () => {
    jest.spyOn(nodemailer, 'createTransport').mockImplementation(() => {
      return {
        sendMail: jest.fn().mockResolvedValue({
          messageId: 'test-renegotiate-msg-id',
          response: '250 OK'
        })
      } as any;
    });

    const Buyer = mongoose.model('Buyer');
    const Offer = mongoose.model('Offer');

    const buyer = await Buyer.create({
      companyName: 'Renegotiate Test Buyer Co',
      email: 'renegotiatebuyer@test-sample.org',
      acceptsShortDated: true,
      minShelfLife: 3,
      categories: ['Bakery'],
      transportRadius: 100,
      warehouseLocations: [{ lat: 41.8781, lng: -87.6298 }]
    });
    buyerId = buyer._id.toString();

    const offer = await Offer.create({
      buyerId: buyer._id,
      quantity: 100,
      price: 5.50,
      status: 'pending',
      submittedAt: new Date()
    });
    offerId = offer._id.toString();
  });

  afterAll(async () => {
    const Buyer = mongoose.model('Buyer');
    const Offer = mongoose.model('Offer');

    await Buyer.deleteMany({ _id: buyerId });
    await Offer.deleteMany({ buyerId });
  });

  describe('Validation Guardrails (400 Bad Request)', () => {
    it('should return 400 if counterPrice is missing or <= 0', async () => {
      const resMissing = await request(app)
        .post(`/api/bids/${offerId}/renegotiate`)
        .send({ counterQuantity: 80 });

      expect(resMissing.status).toBe(400);
      expect(resMissing.body.error).toMatch(/counterPrice/i);

      const resZero = await request(app)
        .post(`/api/bids/${offerId}/renegotiate`)
        .send({ counterPrice: 0, counterQuantity: 80 });

      expect(resZero.status).toBe(400);
      expect(resZero.body.error).toMatch(/counterPrice/i);

      const resNegative = await request(app)
        .post(`/api/bids/${offerId}/renegotiate`)
        .send({ counterPrice: -2.5, counterQuantity: 80 });

      expect(resNegative.status).toBe(400);
      expect(resNegative.body.error).toMatch(/counterPrice/i);
    });

    it('should return 400 if counterQuantity is missing, <= 0, or not an integer', async () => {
      const resMissing = await request(app)
        .post(`/api/bids/${offerId}/renegotiate`)
        .send({ counterPrice: 6.00 });

      expect(resMissing.status).toBe(400);
      expect(resMissing.body.error).toMatch(/counterQuantity/i);

      const resZero = await request(app)
        .post(`/api/bids/${offerId}/renegotiate`)
        .send({ counterPrice: 6.00, counterQuantity: 0 });

      expect(resZero.status).toBe(400);
      expect(resZero.body.error).toMatch(/counterQuantity/i);

      const resFloat = await request(app)
        .post(`/api/bids/${offerId}/renegotiate`)
        .send({ counterPrice: 6.00, counterQuantity: 12.5 });

      expect(resFloat.status).toBe(400);
      expect(resFloat.body.error).toMatch(/counterQuantity/i);
    });

    it('should return 404 if offer does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/bids/${nonExistentId}/renegotiate`)
        .send({ counterPrice: 7.00, counterQuantity: 60 });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Offer not found.');
    });
  });

  describe('Baseline Bid Preservation & Status Transition', () => {
    it('should transition offer.status to countered, preserve root price/quantity, and append supplier counter message to ledger', async () => {
      const res = await request(app)
        .post(`/api/bids/${offerId}/renegotiate`)
        .send({
          counterPrice: 6.25,
          counterQuantity: 75,
          messageText: 'We can supply 75 cases at $6.25/case.'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('countered');
      // Root fields remain intact (Baseline Bid Preservation)
      expect(res.body.price).toBe(5.50);
      expect(res.body.quantity).toBe(100);

      // Verify in MongoDB
      const Offer = mongoose.model('Offer');
      const updatedOffer = await Offer.findById(offerId);
      expect(updatedOffer).toBeDefined();
      expect(updatedOffer?.status).toBe('countered');
      expect(updatedOffer?.price).toBe(5.50);
      expect(updatedOffer?.quantity).toBe(100);

      // Verify message ledger
      expect(updatedOffer?.messages.length).toBeGreaterThanOrEqual(1);
      const counterMsg = updatedOffer?.messages[updatedOffer.messages.length - 1];
      expect(counterMsg?.sender).toBe('supplier');
      expect(counterMsg?.content).toBe('We can supply 75 cases at $6.25/case.');
      expect(counterMsg?.proposedPrice).toBe(6.25);
      expect(counterMsg?.proposedQuantity).toBe(75);
      expect(counterMsg?.timestamp).toBeDefined();
    });

    it('should support the route alias POST /api/offers/:id/renegotiate identically', async () => {
      const res = await request(app)
        .post(`/api/offers/${offerId}/renegotiate`)
        .send({
          counterPrice: 6.50,
          counterQuantity: 80,
          messageText: 'Revised counter via offers route'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('countered');
      expect(res.body.price).toBe(5.50);
      expect(res.body.quantity).toBe(100);

      const Offer = mongoose.model('Offer');
      const updatedOffer = await Offer.findById(offerId);
      const counterMsg = updatedOffer?.messages[updatedOffer.messages.length - 1];
      expect(counterMsg?.sender).toBe('supplier');
      expect(counterMsg?.proposedPrice).toBe(6.50);
      expect(counterMsg?.proposedQuantity).toBe(80);
      expect(counterMsg?.content).toBe('Revised counter via offers route');
    });
  });
});
