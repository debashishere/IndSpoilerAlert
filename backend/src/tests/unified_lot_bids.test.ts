import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

describe('Unified Lot Bids Query (Issue #01)', () => {
  jest.setTimeout(25000);

  let supplierId: string;
  let buyerId: string;
  let dcId: string;
  let productId: string;
  let lotWithoutListingId: string;

  beforeAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const Buyer = mongoose.model('Buyer');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Offer = mongoose.model('Offer');

    const supp = await Supplier.create({
      name: 'Unified Bids Test Supplier',
      companyCode: 'UBTSUP',
      preferredDisposition: 'sell'
    });
    supplierId = supp._id.toString();

    const buyer = await Buyer.create({
      companyName: 'Apex Liquidators',
      email: 'debashisroe1996@gmail.com',
      acceptsShortDated: true,
      minShelfLife: 3,
      categories: ['Dairy'],
      transportRadius: 300,
      warehouseLocations: [{ lat: 41.8781, lng: -87.6298 }]
    });
    buyerId = buyer._id.toString();

    const dc = await DistributionCenter.create({
      supplierId: supp._id,
      name: 'Unified Bids DC',
      code: 'UBT-DC',
      address: '500 Logistics Park, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });
    dcId = dc._id.toString();

    const prod = await ProductMaster.create({
      supplierId: supp._id,
      sku: 'SKU-UB-001',
      category: 'Dairy',
      description: 'Organic Milk 1L',
      shelfLifeDays: 20
    });
    productId = prod._id.toString();

    // Create a lot that has NO Opportunity and NO MarketplaceListing
    const lot = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-UB-11',
      expirationDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      remainingShelfLife: 0.5,
      quantityCases: 200,
      availableQty: 200,
      costPerCase: 3.00,
      standardSellPrice: 5.00,
      status: 'active'
    });
    lotWithoutListingId = lot._id.toString();

    // Create a private workflow bid linked directly to the lotId
    await Offer.create({
      lotId: lot._id,
      buyerId: buyer._id,
      quantity: 150,
      price: 3.50,
      status: 'pending',
      submittedAt: new Date()
    });
  });

  afterAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const Buyer = mongoose.model('Buyer');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Opportunity = mongoose.model('Opportunity');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const Offer = mongoose.model('Offer');

    await Supplier.deleteMany({ name: 'Unified Bids Test Supplier' });
    await Buyer.deleteMany({ email: 'debashisroe1996@gmail.com' });
    await DistributionCenter.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await InventoryLot.deleteMany({ supplierId });
    await Offer.deleteMany({ buyerId });
    await Opportunity.deleteMany({ lotId: lotWithoutListingId });
  });

  it('should retrieve private workflow bids matching lotId when no marketplace listing exists', async () => {
    const res = await request(app).get(`/api/inventory/${lotWithoutListingId}/bids`);

    expect(res.status).toBe(200);
    expect(res.body.bids).toBeDefined();
    expect(res.body.bids.length).toBe(1);

    const bid = res.body.bids[0];
    expect(bid.lotId).toBe(lotWithoutListingId);
    expect(bid.price).toBe(3.50);
    expect(bid.quantity).toBe(150);
    expect(bid.status).toBe('pending');
    expect(bid.buyerId).toBeDefined();
    expect(bid.buyerId.email).toBe('debashisroe1996@gmail.com');
    expect(bid.buyerId.companyName).toBe('Apex Liquidators');
  });

  it('should retrieve unified bids matching both lotId and listingId with populated buyer and award details', async () => {
    const InventoryLot = mongoose.model('InventoryLot');
    const Opportunity = mongoose.model('Opportunity');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const Buyer = mongoose.model('Buyer');
    const Offer = mongoose.model('Offer');
    const Award = mongoose.model('Award');

    await Buyer.deleteMany({ email: 'buyer2@beaconsurplus.com' });
    const buyer2 = await Buyer.create({
      companyName: 'Beacon Surplus Foods',
      email: 'buyer2@beaconsurplus.com',
      categories: ['Dairy'],
      warehouseLocations: [{ lat: 41.8781, lng: -87.6298 }]
    });

    const lotWithListing = await InventoryLot.create({
      supplierId,
      distributionCenterId: dcId,
      productId,
      lotNumber: 'LOT-UB-22',
      expirationDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      remainingShelfLife: 0.5,
      quantityCases: 300,
      availableQty: 300,
      costPerCase: 3.00,
      standardSellPrice: 5.00,
      status: 'active'
    });

    const opp = await Opportunity.create({
      lotId: lotWithListing._id,
      opportunityType: 'sell',
      priority: 'high',
      recommendedAction: 'List on marketplace',
      status: 'approved'
    });

    const listing = await MarketplaceListing.create({
      opportunityId: opp._id,
      title: 'Dairy Bulk Lot',
      description: 'Organic Milk surplus',
      startingPrice: 3.00,
      reservePrice: 4.00,
      allowBidding: true
    });

    // 1) Direct private bid on lot
    const privateBid = await Offer.create({
      lotId: lotWithListing._id,
      buyerId,
      quantity: 100,
      price: 4.20,
      status: 'pending',
      submittedAt: new Date()
    });

    // 2) Marketplace bid on listing
    const marketplaceBid = await Offer.create({
      listingId: listing._id,
      buyerId: buyer2._id,
      quantity: 200,
      price: 4.50,
      status: 'fully_accepted',
      awardedQty: 200,
      submittedAt: new Date()
    });

    // Award for marketplace bid
    await Award.create({
      offerId: marketplaceBid._id,
      buyerId: buyer2._id,
      awardedQty: 200,
      price: 4.50,
      poPdfUrl: 'https://storage.spoiler-alert.com/po/PO-UB-22.pdf',
      approvedDate: new Date()
    });

    const res = await request(app).get(`/api/inventory/${lotWithListing._id}/bids`);

    expect(res.status).toBe(200);
    expect(res.body.bids).toBeDefined();
    expect(res.body.bids.length).toBe(2);

    const foundPrivate = res.body.bids.find((b: any) => b._id.toString() === privateBid._id.toString());
    const foundMarketplace = res.body.bids.find((b: any) => b._id.toString() === marketplaceBid._id.toString());

    expect(foundPrivate).toBeDefined();
    expect(foundPrivate.buyerId.email).toBe('debashisroe1996@gmail.com');
    expect(foundPrivate.buyerId.companyName).toBe('Apex Liquidators');

    expect(foundMarketplace).toBeDefined();
    expect(foundMarketplace.buyerId.email).toBe('buyer2@beaconsurplus.com');
    expect(foundMarketplace.buyerId.companyName).toBe('Beacon Surplus Foods');
    expect(foundMarketplace.poPdfUrl).toBe('https://storage.spoiler-alert.com/po/PO-UB-22.pdf');

    // Cleanup extra records
    await Buyer.deleteMany({ email: 'buyer2@beaconsurplus.com' });
    await InventoryLot.deleteMany({ _id: lotWithListing._id });
    await Opportunity.deleteMany({ _id: opp._id });
    await MarketplaceListing.deleteMany({ _id: listing._id });
    await Offer.deleteMany({ _id: { $in: [privateBid._id, marketplaceBid._id] } });
    await Award.deleteMany({ offerId: marketplaceBid._id });
  });

  it('should return finalPrice in getBids and getAllOffers, falling back to award.price when offer.finalPrice is not set (Issue 01 Seam 2)', async () => {
    const InventoryLot = mongoose.model('InventoryLot');
    const Buyer = mongoose.model('Buyer');
    const Offer = mongoose.model('Offer');
    const Award = mongoose.model('Award');

    const testLot = await InventoryLot.create({
      supplierId,
      distributionCenterId: dcId,
      productId,
      lotNumber: 'LOT-FALLBACK-01',
      expirationDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      quantityCases: 200,
      availableQty: 200,
      costPerCase: 5.00,
      standardSellPrice: 10.00,
      status: 'active'
    });

    // 1. Offer with explicit finalPrice
    const offerWithFinal = await Offer.create({
      lotId: testLot._id,
      buyerId,
      quantity: 50,
      price: 12.00,
      finalPrice: 15.50,
      status: 'fully_accepted',
      awardedQty: 50,
      submittedAt: new Date()
    });

    // 2. Legacy offer without finalPrice on Offer, but with an Award having price
    const legacyOffer = await Offer.create({
      lotId: testLot._id,
      buyerId,
      quantity: 80,
      price: 10.00,
      status: 'fully_accepted',
      awardedQty: 80,
      submittedAt: new Date()
    });
    await Award.create({
      offerId: legacyOffer._id,
      buyerId,
      lotId: testLot._id,
      awardedQty: 80,
      price: 11.25,
      totalAmount: 900.00,
      approvedDate: new Date()
    });

    // 3. Pending offer without finalPrice and without Award
    const pendingOffer = await Offer.create({
      lotId: testLot._id,
      buyerId,
      quantity: 30,
      price: 9.00,
      status: 'pending',
      submittedAt: new Date()
    });

    // Test GET /api/inventory/:id/bids
    const lotBidsRes = await request(app).get(`/api/inventory/${testLot._id}/bids`);
    expect(lotBidsRes.status).toBe(200);
    const bids = lotBidsRes.body.bids;
    expect(bids.length).toBe(3);

    const resOfferWithFinal = bids.find((b: any) => b._id.toString() === offerWithFinal._id.toString());
    const resLegacyOffer = bids.find((b: any) => b._id.toString() === legacyOffer._id.toString());
    const resPendingOffer = bids.find((b: any) => b._id.toString() === pendingOffer._id.toString());

    expect(resOfferWithFinal.finalPrice).toBe(15.50);
    expect(resLegacyOffer.finalPrice).toBe(11.25);
    expect(resPendingOffer.finalPrice).toBeUndefined();

    // Test GET /api/bids (getAllOffers)
    const allBidsRes = await request(app).get('/api/bids');
    expect(allBidsRes.status).toBe(200);
    const allBids = allBidsRes.body;

    const allOfferWithFinal = allBids.find((b: any) => b._id.toString() === offerWithFinal._id.toString());
    const allLegacyOffer = allBids.find((b: any) => b._id.toString() === legacyOffer._id.toString());
    const allPendingOffer = allBids.find((b: any) => b._id.toString() === pendingOffer._id.toString());

    expect(allOfferWithFinal.finalPrice).toBe(15.50);
    expect(allLegacyOffer.finalPrice).toBe(11.25);
    expect(allPendingOffer.finalPrice).toBeUndefined();

    // Clean up
    await Offer.deleteMany({ _id: { $in: [offerWithFinal._id, legacyOffer._id, pendingOffer._id] } });
    await Award.deleteMany({ offerId: legacyOffer._id });
    await InventoryLot.findByIdAndDelete(testLot._id);
  });
});

