import Offer from '../models/Offer';
import MarketplaceListing from '../models/MarketplaceListing';
import Opportunity from '../models/Opportunity';
import InventoryLot from '../models/InventoryLot';

export async function sendMessage(
  offerId: string, 
  sender: 'buyer' | 'system' | 'supplier', 
  content: string,
  proposedPrice?: number,
  proposedQuantity?: number
) {
  const offer = await Offer.findById(offerId).populate('buyerId');
  if (!offer) {
    throw new Error('Offer not found.');
  }

  const listing = await MarketplaceListing.findById(offer.listingId);
  if (!listing) {
    throw new Error('Marketplace Listing not found for this offer.');
  }

  const opportunity = await Opportunity.findById(listing.opportunityId);
  if (!opportunity) {
    throw new Error('Opportunity not found for this offer.');
  }

  const lot = await InventoryLot.findById(opportunity.lotId);
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  // 1. Add supplier message
  const supplierMsg = {
    sender: sender || 'supplier',
    content: content || '',
    timestamp: new Date(),
    proposedPrice: proposedPrice !== undefined ? proposedPrice : undefined,
    proposedQuantity: proposedQuantity !== undefined ? proposedQuantity : undefined
  };
  offer.messages.push(supplierMsg);

  // 2. Parse any counter-offer price in the message (e.g. "$12.50" or "12.5" or "12")
  let parsedPrice: number | null = proposedPrice !== undefined && proposedPrice !== null ? proposedPrice : null;
  if (parsedPrice === null) {
    const priceRegex = /\$?(\d+(?:\.\d{1,2})?)/;
    const match = content.match(priceRegex);
    if (match) {
      parsedPrice = parseFloat(match[1]);
    }
  }

  const parsedQuantity: number | null = proposedQuantity !== undefined && proposedQuantity !== null ? proposedQuantity : null;

  // 3. Determine simulated buyer response
  let buyerReply = '';
  let updatedPrice = offer.price;
  let updatedQuantity = offer.quantity;
  let updatedStatus: 'pending' | 'countered' | 'rejected' | 'partially_accepted' | 'fully_accepted' = 'countered';

  if (parsedPrice !== null) {
    // Supplier proposed a counter-price
    if (parsedPrice <= offer.price) {
      buyerReply = `We've already bid $${offer.price.toFixed(2)}/cs, which is higher than or equal to your suggestion. Please award us the listing at our current bid!`;
    } else if (parsedPrice > lot.standardSellPrice) {
      // Way too high (exceeds standard sell price)
      buyerReply = `Our budget doesn't allow for prices higher than the standard selling price of $${lot.standardSellPrice.toFixed(2)}/cs. We have to reject this pricing.`;
      updatedStatus = 'rejected';
    } else {
      // Price is between current bid and standard sell price.
      const priceIncreaseRatio = (parsedPrice - offer.price) / offer.price;
      if (priceIncreaseRatio <= 0.12) {
        // Less than 12% increase: Accept counter-offer!
        buyerReply = `That is a fair counter-offer. We agree to pay your requested price of $${parsedPrice.toFixed(2)}/cs. Please award us the batch.`;
        updatedPrice = parsedPrice;
        offer.messages.push({
          sender: 'system',
          content: `Bid price updated from $${offer.price.toFixed(2)} to $${parsedPrice.toFixed(2)} based on supplier counter-offer.`,
          timestamp: new Date()
        });
      } else {
        // Propose a midway counter-offer
        const midwayPrice = Math.round(((offer.price + parsedPrice) / 2) * 100) / 100;
        buyerReply = `We can't pay $${parsedPrice.toFixed(2)}/cs, but we can increase our bid to $${midwayPrice.toFixed(2)}/cs. Let us know if this works for you.`;
        updatedPrice = midwayPrice;
        offer.messages.push({
          sender: 'system',
          content: `Bid price updated from $${offer.price.toFixed(2)} to $${midwayPrice.toFixed(2)} based on negotiation.`,
          timestamp: new Date()
        });
      }
    }
  } else {
    // General text message without numbers
    const lowerMsg = content.toLowerCase();
    if (lowerMsg.includes('accept') || lowerMsg.includes('agree') || lowerMsg.includes('ok') || lowerMsg.includes('deal')) {
      buyerReply = `Great! We are ready to finalize the transaction. Please accept and award this bid!`;
    } else if (lowerMsg.includes('lowest') || lowerMsg.includes('negotiate') || lowerMsg.includes('better')) {
      const midwayPrice = Math.round(((offer.price + lot.standardSellPrice) / 2) * 100) / 100;
      buyerReply = `We are open to negotiating. We can increase our bid to $${midwayPrice.toFixed(2)}/cs. How does that work?`;
      updatedPrice = midwayPrice;
    } else {
      buyerReply = `Thank you for your message. We are interested in this lot. Can you provide a specific counter-offer price if our current bid of $${offer.price.toFixed(2)}/cs is not acceptable?`;
    }
  }

  // Update quantity if proposed
  if (parsedQuantity !== null) {
    updatedQuantity = parsedQuantity;
    offer.messages.push({
      sender: 'system',
      content: `Bid quantity updated from ${offer.quantity} to ${parsedQuantity} based on supplier counter-offer.`,
      timestamp: new Date()
    });
  }

  offer.price = updatedPrice;
  offer.quantity = updatedQuantity;
  offer.status = updatedStatus;

  // Append buyer reply
  offer.messages.push({
    sender: 'buyer',
    content: buyerReply,
    timestamp: new Date(),
    proposedPrice: updatedPrice,
    proposedQuantity: offer.quantity
  });

  await offer.save();
  return offer;
}

export async function rejectBid(offerId: string) {
  const offer = await Offer.findById(offerId);
  if (!offer) {
    throw new Error('Offer not found.');
  }

  offer.status = 'rejected';
  offer.messages.push({
    sender: 'system',
    content: 'Bid has been explicitly rejected by the supplier.',
    timestamp: new Date()
  });

  await offer.save();
  return offer;
}

export async function getAllOffers() {
  return await Offer.find()
    .populate('buyerId')
    .populate({
      path: 'listingId',
      populate: {
        path: 'opportunityId',
        populate: {
          path: 'lotId',
          populate: ['productId', 'supplierId']
        }
      }
    })
    .sort({ submittedAt: -1 });
}

