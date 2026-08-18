import mongoose from 'mongoose';
import Buyer from '../models/Buyer';
import BuyerList from '../models/BuyerList';
import { resolveStageBuyers, ResolvedStageBuyers } from '../services/stageResolver';

describe('Stage Buyer Resolver Helper (resolveStageBuyers)', () => {
  jest.setTimeout(30000);
  let supplierId: mongoose.Types.ObjectId;
  let activeSalesOnlyBuyer: any;
  let activeBiddingOnlyBuyer: any;
  let inactiveBuyer: any;
  let buyerListDoc: any;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ind-spoiler-alert-test';
      await mongoose.connect(uri);
    }
  });

  beforeEach(async () => {
    supplierId = new mongoose.Types.ObjectId();

    activeSalesOnlyBuyer = await Buyer.create({
      name: 'Sales Only Buyer',
      companyName: 'Sales Co',
      email: `sales_${Date.now()}_${Math.random().toString(36).substring(7)}@buyer.com`,
      isActive: true,
      optInBidding: false,
      optInSales: true
    });

    activeBiddingOnlyBuyer = await Buyer.create({
      name: 'Bidding Only Buyer',
      companyName: 'Bidding Co',
      email: `bidding_${Date.now()}_${Math.random().toString(36).substring(7)}@buyer.com`,
      isActive: true,
      optInBidding: true,
      optInSales: false
    });

    inactiveBuyer = await Buyer.create({
      name: 'Inactive Buyer',
      companyName: 'Inactive Co',
      email: `inactive_${Date.now()}_${Math.random().toString(36).substring(7)}@buyer.com`,
      isActive: false,
      optInBidding: true,
      optInSales: true
    });

    buyerListDoc = await BuyerList.create({
      name: 'Premium Buyers List',
      type: 'primary',
      supplierId: supplierId,
      buyerIds: [activeSalesOnlyBuyer._id, activeBiddingOnlyBuyer._id, inactiveBuyer._id]
    });
  });

  afterEach(async () => {
    if (activeSalesOnlyBuyer?._id) await Buyer.findByIdAndDelete(activeSalesOnlyBuyer._id);
    if (activeBiddingOnlyBuyer?._id) await Buyer.findByIdAndDelete(activeBiddingOnlyBuyer._id);
    if (inactiveBuyer?._id) await Buyer.findByIdAndDelete(inactiveBuyer._id);
    if (buyerListDoc?._id) await BuyerList.findByIdAndDelete(buyerListDoc._id);
  });

  afterAll(async () => {
    // Clean up if needed
  });

  describe('Slice 1: Custom Buyer Mode', () => {
    it('resolves inline customBuyers and DB customBuyerIds while enforcing isActive and opt-in rules', async () => {
      const inlineEmail = `inline_${Date.now()}@inline.com`;
      const stage = {
        stageNumber: 1,
        name: 'Stage 1 Sales',
        stageType: 'sales',
        buyerMode: 'custom',
        customBuyers: [
          { email: inlineEmail, name: 'Inline Custom Buyer' }
        ],
        customBuyerIds: [
          activeSalesOnlyBuyer._id,
          activeBiddingOnlyBuyer._id,
          inactiveBuyer._id
        ]
      };

      const result: ResolvedStageBuyers = await resolveStageBuyers(stage, { supplierId });

      expect(result.buyerEmails).toContain(inlineEmail);
      expect(result.buyerEmails).toContain(activeSalesOnlyBuyer.email.toLowerCase());
      // Bidding-only buyer should be excluded in a sales stage
      expect(result.buyerEmails).not.toContain(activeBiddingOnlyBuyer.email.toLowerCase());
      // Inactive buyer should be excluded
      expect(result.buyerEmails).not.toContain(inactiveBuyer.email.toLowerCase());

      // Check evaluatedBuyerIds
      expect(result.evaluatedBuyerIds.map((id: any) => id.toString())).toContain(activeSalesOnlyBuyer._id.toString());
      expect(result.evaluatedBuyerIds.map((id: any) => id.toString())).not.toContain(activeBiddingOnlyBuyer._id.toString());
      expect(result.evaluatedBuyerIds.map((id: any) => id.toString())).not.toContain(inactiveBuyer._id.toString());

      // Check resolvedBuyerMap
      expect(result.resolvedBuyerMap.has(inlineEmail)).toBe(true);
      expect(result.resolvedBuyerMap.has(activeSalesOnlyBuyer.email.toLowerCase())).toBe(true);
      expect(result.resolvedBuyerMap.get(inlineEmail).name).toBe('Inline Custom Buyer');
    });

    it('enforces optInBidding when stage is a bidding stage', async () => {
      const stage = {
        stageNumber: 1,
        name: 'Stage 1 Bidding',
        stageType: 'bidding',
        buyerMode: 'custom',
        customBuyerIds: [
          activeSalesOnlyBuyer._id,
          activeBiddingOnlyBuyer._id
        ]
      };

      const result: ResolvedStageBuyers = await resolveStageBuyers(stage, { supplierId });

      expect(result.buyerEmails).toContain(activeBiddingOnlyBuyer.email.toLowerCase());
      expect(result.buyerEmails).not.toContain(activeSalesOnlyBuyer.email.toLowerCase());
    });
  });

  describe('Slice 2: List Buyer Mode', () => {
    it('resolves buyers from BuyerList referenced by buyerListId (ObjectId)', async () => {
      const stage = {
        stageNumber: 1,
        name: 'Stage 1 Sales List',
        stageType: 'sales',
        buyerMode: 'list',
        buyerListId: buyerListDoc._id
      };

      const result: ResolvedStageBuyers = await resolveStageBuyers(stage, { supplierId });

      expect(result.buyerEmails).toContain(activeSalesOnlyBuyer.email.toLowerCase());
      // Excluded due to opt-in rules for sales stage
      expect(result.buyerEmails).not.toContain(activeBiddingOnlyBuyer.email.toLowerCase());
      // Excluded due to inactive
      expect(result.buyerEmails).not.toContain(inactiveBuyer.email.toLowerCase());

      expect(result.evaluatedBuyerIds.map((id: any) => id.toString())).toContain(activeSalesOnlyBuyer._id.toString());
      expect(result.resolvedBuyerMap.has(activeSalesOnlyBuyer.email.toLowerCase())).toBe(true);
    });

    it('resolves buyers from BuyerList referenced by type/name when buyerListId is a string reference', async () => {
      const stage = {
        stageNumber: 1,
        name: 'Stage 1 Bidding List',
        stageType: 'bidding',
        buyerMode: 'list',
        buyerListId: 'primary'
      };

      const result: ResolvedStageBuyers = await resolveStageBuyers(stage, { supplierId });

      expect(result.buyerEmails).toContain(activeBiddingOnlyBuyer.email.toLowerCase());
      expect(result.buyerEmails).not.toContain(activeSalesOnlyBuyer.email.toLowerCase());
    });
  });

  describe('Slice 3: Segment Buyer Mode', () => {
    let segmentBuyer: any;

    beforeEach(async () => {
      segmentBuyer = await Buyer.create({
        name: 'Tier 1 Segment Buyer',
        companyName: 'Tier 1 Co',
        email: `tier1_${Date.now()}_${Math.random().toString(36).substring(7)}@buyer.com`,
        segment: 'Tier 1 Wholesale',
        isActive: true,
        optInBidding: true,
        optInSales: true
      });
    });

    afterEach(async () => {
      if (segmentBuyer?._id) await Buyer.findByIdAndDelete(segmentBuyer._id);
    });

    it('resolves buyers matching buyerSegment directly on Buyer model when no BuyerList exists', async () => {
      const stage = {
        stageNumber: 1,
        name: 'Stage 1 Segment',
        stageType: 'sales',
        buyerMode: 'segment',
        buyerSegment: 'Tier 1 Wholesale'
      };

      const result: ResolvedStageBuyers = await resolveStageBuyers(stage, { supplierId });

      expect(result.buyerEmails).toContain(segmentBuyer.email.toLowerCase());
      expect(result.evaluatedBuyerIds.map((id: any) => id.toString())).toContain(segmentBuyer._id.toString());
      expect(result.resolvedBuyerMap.has(segmentBuyer.email.toLowerCase())).toBe(true);
    });
  });

  describe('Slice 4: All Buyers Mode', () => {
    it('resolves all active buyers in database respecting stage opt-ins', async () => {
      const stage = {
        stageNumber: 1,
        name: 'Stage 1 All Buyers',
        stageType: 'sales',
        buyerMode: 'all'
      };

      const result: ResolvedStageBuyers = await resolveStageBuyers(stage, { supplierId });

      expect(result.buyerEmails).toContain(activeSalesOnlyBuyer.email.toLowerCase());
      // Excluded due to optInSales: false
      expect(result.buyerEmails).not.toContain(activeBiddingOnlyBuyer.email.toLowerCase());
      // Excluded due to isActive: false
      expect(result.buyerEmails).not.toContain(inactiveBuyer.email.toLowerCase());
      expect(result.evaluatedBuyerIds.map((id: any) => id.toString())).toContain(activeSalesOnlyBuyer._id.toString());
    });
  });

  describe('Slice 5: Inferred Modes and Donation / Landfill Stages', () => {
    it('infers custom mode when buyerMode is missing but customBuyers array is present', async () => {
      const inlineEmail = `inferred_${Date.now()}@inferred.com`;
      const stage = {
        stageNumber: 1,
        name: 'Stage 1 Unspecified Mode',
        stageType: 'liquidation',
        customBuyers: [{ email: inlineEmail, name: 'Inferred Custom' }]
      };

      const result: ResolvedStageBuyers = await resolveStageBuyers(stage, { supplierId });

      expect(result.buyerEmails).toEqual([inlineEmail]);
      expect(result.resolvedBuyerMap.has(inlineEmail)).toBe(true);
    });

    it('infers list mode when buyerMode is missing but buyerListId is present', async () => {
      const stage = {
        stageNumber: 1,
        name: 'Stage 1 Unspecified Mode List',
        stageType: 'liquidation',
        buyerListId: buyerListDoc._id
      };

      const result: ResolvedStageBuyers = await resolveStageBuyers(stage, { supplierId });

      // In liquidation (sales) stage, activeSalesOnlyBuyer should be included
      expect(result.buyerEmails).toContain(activeSalesOnlyBuyer.email.toLowerCase());
      expect(result.buyerEmails).not.toContain(inactiveBuyer.email.toLowerCase());
    });

    it('allows both bidding and sales buyers in donation or landfill stage where stage is not restricted to sales/bidding', async () => {
      const stage = {
        stageNumber: 2,
        name: 'Stage 2 Donation',
        stageType: 'donation',
        buyerMode: 'list',
        buyerListId: buyerListDoc._id
      };

      const result: ResolvedStageBuyers = await resolveStageBuyers(stage, { supplierId });

      expect(result.buyerEmails).toContain(activeSalesOnlyBuyer.email.toLowerCase());
      expect(result.buyerEmails).toContain(activeBiddingOnlyBuyer.email.toLowerCase());
      // Inactive buyer should still be excluded
      expect(result.buyerEmails).not.toContain(inactiveBuyer.email.toLowerCase());
    });
  });
});
