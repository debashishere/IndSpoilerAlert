import axios from 'axios';
import Opportunity from '../models/Opportunity';
import InventoryLot from '../models/InventoryLot';
import ProductMaster from '../models/ProductMaster';
import PricingRecommendation from '../models/PricingRecommendation';
import MarketplaceListing from '../models/MarketplaceListing';
import Buyer from '../models/Buyer';
import Offer from '../models/Offer';
import Award from '../models/Award';
import Shipment from '../models/Shipment';
import DistributionCenter from '../models/DistributionCenter';

const SIDECAR_URL = process.env.SIDECAR_URL || 'http://localhost:8000';

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function suggestPricing(
  opportunityId: string,
  daysRemaining?: number,
  quantity?: number
) {
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    throw new Error('Opportunity not found.');
  }

  const lot = await InventoryLot.findById(opportunity.lotId);
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  const product = await ProductMaster.findById(lot.productId);
  if (!product) {
    throw new Error('Product Master not found.');
  }

  const today = new Date();
  const diffTime = lot.expirationDate.getTime() - today.getTime();
  const defaultDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const inputDays = daysRemaining !== undefined ? daysRemaining : defaultDaysRemaining;
  const inputQty = quantity !== undefined ? quantity : lot.quantityCases;

  // Call Python sidecar pricing engine
  const sidecarRes = await axios.post(`${SIDECAR_URL}/suggest-pricing`, {
    days_remaining: inputDays,
    quantity: inputQty,
    original_price: lot.costPerCase,
    category: product.category || 'Dry Goods'
  });

  const sidecarData = sidecarRes.data;

  // Save PricingRecommendation
  const pricing = await PricingRecommendation.findOneAndUpdate(
    { lotId: lot._id },
    {
      lotId: lot._id,
      recommendedDiscount: sidecarData.recommended_discount,
      recommendedPrice: sidecarData.recommended_price,
      expectedSellThrough: sidecarData.expected_sell_through,
      expectedRevenue: sidecarData.expected_revenue,
      elasticity: sidecarData.elasticity
    },
    { upsert: true, new: true }
  );

  return pricing;
}

export async function recommendBuyers(listingId: string) {
  const listing = await MarketplaceListing.findById(listingId);
  if (!listing) {
    throw new Error('Listing not found.');
  }

  const opportunity = await Opportunity.findById(listing.opportunityId);
  if (!opportunity) {
    throw new Error('Opportunity not found.');
  }

  const lot = await InventoryLot.findById(opportunity.lotId);
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  const product = await ProductMaster.findById(lot.productId);
  if (!product) {
    throw new Error('Product Master not found.');
  }

  const dc = await DistributionCenter.findById(lot.distributionCenterId);
  if (!dc) {
    throw new Error('Distribution Center not found.');
  }

  // Load all buyers
  const buyers = await Buyer.find({});
  if (buyers.length === 0) {
    throw new Error('No buyers found. Please seed the database.');
  }

  // Build distance matrix (buyerId -> distance in miles)
  const distanceMatrix: Record<string, number> = {};
  const buyerExclusions: Record<string, string[]> = {};
  buyers.forEach(buyer => {
    buyerExclusions[buyer._id.toString()] = buyer.excludedAllergens || [];
    if (buyer.warehouseLocations && buyer.warehouseLocations.length > 0) {
      const dist = calculateHaversineDistance(
        dc.coordinates.lat,
        dc.coordinates.lng,
        buyer.warehouseLocations[0].lat,
        buyer.warehouseLocations[0].lng
      );
      distanceMatrix[buyer._id.toString()] = parseFloat(dist.toFixed(2));
    } else {
      distanceMatrix[buyer._id.toString()] = 100.0; // fallback
    }
  });

  // Call Python sidecar matching engine
  const sidecarRes = await axios.post(`${SIDECAR_URL}/recommend-buyers`, {
    product_name: product.description,
    category: product.category,
    supplier_id: lot.supplierId.toString(),
    distance_matrix: distanceMatrix,
    product_allergens: product.allergens || [],
    buyer_exclusions: buyerExclusions
  });

  // Populate matches with full buyer profiles
  const matches = [];
  for (const m of sidecarRes.data.matches) {
    const buyer = await Buyer.findById(m.buyer_id);
    if (buyer) {
      const hasConflict = buyer.excludedAllergens?.some(allergen => 
        product.allergens?.includes(allergen)
      );
      if (hasConflict) {
        continue;
      }
      matches.push({
        ...m,
        buyer
      });
    }
  }

  return { matches };
}

export async function placeBid(listingId: string, bidData: any) {
  const { buyerId, buyerEmail, quantity, price, directPurchase } = bidData;

  const listing = await MarketplaceListing.findById(listingId);
  if (!listing) {
    throw new Error('Listing not found.');
  }

  const opportunity = await Opportunity.findById(listing.opportunityId);
  if (!opportunity) {
    throw new Error('Opportunity not found.');
  }

  const lot = await InventoryLot.findById(opportunity.lotId);
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  // Resolve Buyer by Email or ID (with email being the primary identifier)
  let buyer = null;
  if (buyerEmail) {
    const emailLower = buyerEmail.trim().toLowerCase();
    buyer = await Buyer.findOne({ email: emailLower });
    if (!buyer) {
      // Auto-register the Buyer!
      const emailParts = emailLower.split('@');
      const prefix = emailParts[0];
      const domain = emailParts[1] ? emailParts[1].split('.')[0] : 'retailer';
      
      let derivedName = domain
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      if (['gmail', 'yahoo', 'outlook', 'hotmail', 'protonmail'].includes(derivedName.toLowerCase())) {
        derivedName = prefix.charAt(0).toUpperCase() + prefix.slice(1) + ' Retail';
      }

      const lat = 41.8781 + (Math.random() - 0.5) * 2;
      const lng = -87.6298 + (Math.random() - 0.5) * 2;

      buyer = new Buyer({
        companyName: derivedName,
        email: emailLower,
        acceptsShortDated: true,
        minShelfLife: 5,
        categories: ['Dairy', 'Produce', 'Meat', 'Dry Goods', 'Beverages'],
        transportRadius: 150,
        warehouseLocations: [{ lat, lng }]
      });
      await buyer.save();
      console.log(`Auto-registered new buyer: ${derivedName} (${emailLower})`);
    }
  } else if (buyerId) {
    buyer = await Buyer.findById(buyerId);
  }

  if (!buyer) {
    throw new Error('Buyer identification (email or ID) is required.');
  }

  const offerQty = quantity !== undefined ? quantity : lot.availableQty;
  const offerPrice = price !== undefined ? price : lot.costPerCase;

  // Create Offer with initial chat message
  const offer = new Offer({
    listingId: listing._id,
    buyerId: buyer._id,
    quantity: offerQty,
    price: offerPrice,
    status: directPurchase ? 'fully_accepted' : 'pending',
    messages: [{
      sender: 'buyer',
      content: `Placed a bid of $${offerPrice.toFixed(2)}/cs for ${offerQty} cases.`,
      timestamp: new Date(),
      proposedPrice: offerPrice,
      proposedQuantity: offerQty
    }]
  });
  await offer.save();

  // Dispatch bid submission notification to supplier Lot Operations Hub
  try {
    const Activity = (await import('../models/Activity')).default;
    await Activity.create({
      lotId: lot._id,
      type: 'bid_submission',
      subject: `New Marketplace Bid: ${buyer.companyName}`,
      content: `Buyer ${buyer.companyName} (${buyer.email}) submitted a bid of $${offerPrice.toFixed(2)}/cs for ${offerQty} cases.`,
      sender: buyer.email,
      recipient: 'Supplier Lot Operations Hub',
      timestamp: new Date(),
      metadata: {
        offerId: offer._id,
        listingId: listing._id,
        buyerId: buyer._id,
        quantity: offerQty,
        price: offerPrice
      }
    });
  } catch (actErr) {
    console.error('Failed to log activity for Lot Operations Hub:', actErr);
  }

  if (!directPurchase) {
    const { checkBidAgainstActiveWorkflows } = require('./agendaService');
    await checkBidAgainstActiveWorkflows(lot, offer, listing);
  }

  if (directPurchase) {
    // Create Award
    const award = new Award({
      listingId: listing._id,
      offerId: offer._id,
      buyerId: buyer._id,
      awardedQty: offerQty,
      price: offerPrice
    });
    await award.save();

    // Find DC address
    const dc = await DistributionCenter.findById(lot.distributionCenterId);
    const pickupLocation = dc ? dc.address : 'Supplier Distribution Center';

    // Create Shipment
    const shipment = new Shipment({
      awardId: award._id,
      carrier: 'IndSpoiler Alert Logistics Partner',
      pickupLocation,
      deliveryLocation: `${buyer.companyName} Warehouse`,
      status: 'scheduled',
      temperature: dc?.coldStorage ? 'Refrigerated (35-40°F)' : 'Ambient'
    });
    await shipment.save();

    // Update InventoryLot status and qty
    lot.status = 'sold';
    lot.availableQty = Math.max(0, lot.availableQty - offerQty);
    lot.latestSalesDate = new Date();
    await lot.save();

    // Log direct purchase system message
    offer.messages.push({
      sender: 'system',
      content: `Direct purchase completed successfully. Inventory status updated to SOLD. Award and shipment scheduled.`,
      timestamp: new Date()
    });
    await offer.save();

    return {
      offer,
      award,
      shipment,
      lotStatus: lot.status
    };
  }

  return offer;
}

export async function projectToMarketplaceListing(lotId: string) {
  const lot = await InventoryLot.findById(lotId).populate('productId').populate('complianceDocs');
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  const product = lot.productId as any;
  const docs = (lot.complianceDocs || []) as any[];

  const coaVerified = docs.some(d => d.verified === true || d.status === 'verified');

  // Return sanitized projection stripping COGS, comments, and internal margins
  return {
    lotId: lot._id,
    supplierId: lot.supplierId,
    publicTitle: product?.description || `Lot #${lot.lotNumber}`,
    category: product?.category || 'General Surplus',
    remainingShelfLife: lot.remainingShelfLife,
    availableQuantity: lot.availableQty,
    publicPrice: lot.standardSellPrice,
    coaVerified,
    sanitized: true
  };
}

export async function publishLotToMarketplace(lotId: string) {
  const lot = await InventoryLot.findById(lotId).populate('productId').populate('complianceDocs');
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  const docs = (lot.complianceDocs || []) as any[];
  const coaVerified = docs.some(d => d.verified === true || d.status === 'verified');

  // Publication Invariant Enforcement (0084)
  if (lot.fdaRegulated || (docs && docs.length > 0)) {
    if (!coaVerified) {
      throw new Error('Compliance verification required: COA or Batch Record must be verified prior to marketplace publication.');
    }
  }

  const projection = await projectToMarketplaceListing(lotId);

  const listing = await MarketplaceListing.findOneAndUpdate(
    { lotId: lot._id },
    {
      lotId: lot._id,
      supplierId: lot.supplierId,
      sellerId: lot.supplierId,
      publicTitle: projection.publicTitle,
      category: projection.category,
      remainingShelfLife: projection.remainingShelfLife,
      availableQuantity: projection.availableQuantity,
      publicPrice: projection.publicPrice,
      startingPrice: projection.publicPrice,
      minimumPrice: projection.publicPrice,
      coaVerified: projection.coaVerified,
      sanitized: true,
      status: 'published'
    },
    { upsert: true, new: true }
  );

  return listing;
}

export async function getMarketplaceListings(filters: {
  search?: string;
  category?: string;
  region?: string;
  discountTier?: string;
} = {}) {
  const query: any = {
    status: { $in: ['published', 'active'] },
    availableQuantity: { $gt: 0 }
  };

  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [
      { publicTitle: searchRegex },
      { category: searchRegex },
      { description: searchRegex }
    ];
  }

  if (filters.category && filters.category !== 'All') {
    query.category = filters.category;
  }

  if (filters.region && filters.region !== 'All') {
    query.warehouseRegion = filters.region;
  }

  if (filters.discountTier && filters.discountTier !== 'All') {
    query.discountTier = filters.discountTier;
  }

  const listings = await MarketplaceListing.find(query).sort({ createdAt: -1 });
  return listings;
}


