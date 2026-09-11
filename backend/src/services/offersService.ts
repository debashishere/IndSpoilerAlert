import Offer from '../models/Offer';
import MarketplaceListing from '../models/MarketplaceListing';
import Opportunity from '../models/Opportunity';
import InventoryLot from '../models/InventoryLot';
import Activity from '../models/Activity';
import Award from '../models/Award';
import DistributionCenter from '../models/DistributionCenter';
import crypto from 'crypto';
import { compileTemplate, compileSubject } from './emailTemplateService';
import { sendCampaignEmail, sendEmailHelper, syncEmailToThread } from './emailService';

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

async function rollbackAcceptedAwardIfAny(offer: any) {
  const existingAward = await Award.findOne({ offerId: offer._id });
  const isOfferAccepted = ['fully_accepted', 'partially_accepted'].includes(offer.status);

  if (isOfferAccepted || existingAward) {
    const qtyToRestore = (offer.awardedQty && offer.awardedQty > 0)
      ? offer.awardedQty
      : (existingAward?.awardedQty || 0);

    let lotId = offer.lotId;
    if (!lotId && offer.listingId) {
      const listing = await MarketplaceListing.findById(offer.listingId);
      if (listing?.lotId) {
        lotId = listing.lotId;
      } else if (listing?.opportunityId) {
        const opp = await Opportunity.findById(listing.opportunityId);
        if (opp?.lotId) lotId = opp.lotId;
      }
    }
    if (lotId && qtyToRestore > 0) {
      const lot = await InventoryLot.findById(lotId);
      if (lot) {
        const newAvailable = (lot.availableQty !== undefined ? lot.availableQty : lot.quantityCases || 0) + qtyToRestore;
        lot.availableQty = newAvailable;
        if (lot.status === 'sold' && newAvailable > 0) {
          lot.status = 'active';
        }
        await lot.save();
      }
    }
    await Award.deleteMany({ offerId: offer._id });
    offer.awardedQty = 0;
  }
}

export async function declineBid(offerId: string, reason: string, rationale?: string) {
  const offer = await Offer.findById(offerId).populate('buyerId');
  if (!offer) {
    throw new Error('Offer not found.');
  }

  await rollbackAcceptedAwardIfAny(offer);

  offer.status = 'rejected';
  const declineContent = rationale
    ? `Bid declined. Reason: ${reason} — Rationale: ${rationale}`
    : `Bid declined. Reason: ${reason}`;

  offer.messages.push({
    sender: 'system',
    content: declineContent,
    timestamp: new Date()
  });

  await offer.save();

  // Find associated lotId
  let lotId = offer.lotId;
  if (!lotId && offer.listingId) {
    const listing = await MarketplaceListing.findById(offer.listingId);
    if (listing?.lotId) {
      lotId = listing.lotId;
    } else if (listing?.opportunityId) {
      const opportunity = await Opportunity.findById(listing.opportunityId);
      if (opportunity?.lotId) {
        lotId = opportunity.lotId;
      }
    }
  }

  if (lotId) {
    const buyerName = (offer.buyerId as any)?.companyName || (offer.buyerId as any)?.email || 'Buyer';
    await Activity.create({
      lotId,
      type: 'Note',
      subject: `Bid Declined: ${reason}`,
      content: `Offer of $${offer.price?.toFixed(2)}/cs (${offer.quantity} cases) from ${buyerName} was declined. Reason: ${reason}${rationale ? `. Rationale: ${rationale}` : ''}`,
      sender: 'Supplier',
      timestamp: new Date(),
      metadata: {
        offerId: offer._id,
        reason,
        rationale,
        action: 'decline'
      }
    });
  }

  return offer;
}

export async function resetBid(offerId: string) {
  const offer = await Offer.findById(offerId).populate('buyerId');
  if (!offer) {
    throw new Error('Offer not found.');
  }

  await rollbackAcceptedAwardIfAny(offer);

  offer.status = 'pending';
  offer.awardedQty = 0;
  offer.messages.push({
    sender: 'system',
    content: 'Bid lifecycle reset to pending status.',
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

export async function renegotiateBid(
  offerId: string,
  counterPrice: number,
  counterQuantity: number,
  messageText?: string,
  options?: {
    templateHtml?: string;
    emailSubject?: string;
  }
) {
  const offer = await Offer.findById(offerId).populate('buyerId');
  if (!offer) {
    throw new Error('Offer not found.');
  }

  offer.status = 'countered';
  const counterMessage = messageText || `Supplier counter-offer: $${counterPrice.toFixed(2)}/cs for ${counterQuantity} cases.`;
  offer.messages.push({
    sender: 'supplier',
    content: counterMessage,
    proposedPrice: counterPrice,
    proposedQuantity: counterQuantity,
    timestamp: new Date()
  });

  await offer.save();

  // Find associated lot and product
  let lot: any = null;
  if (offer.lotId) {
    lot = await InventoryLot.findById(offer.lotId).populate('productId');
  } else if (offer.listingId) {
    const listing = await MarketplaceListing.findById(offer.listingId);
    if (listing?.lotId) {
      lot = await InventoryLot.findById(listing.lotId).populate('productId');
    } else if (listing?.opportunityId) {
      const opp = await Opportunity.findById(listing.opportunityId);
      if (opp?.lotId) {
        lot = await InventoryLot.findById(opp.lotId).populate('productId');
      }
    }
  }

  const buyerObj: any = offer.buyerId || {};
  const buyerName = buyerObj.companyName || buyerObj.name || buyerObj.email || 'Valued Buyer';
  const buyerEmail = buyerObj.email;
  const productObj: any = lot?.productId || {};
  const productName = productObj.name || productObj.description || lot?.lotNumber || 'Surplus Inventory Lot';
  const supplierId = lot?.supplierId?.toString() || 'default';

  // Build template context
  const context: Record<string, any> = {
    buyer_name: buyerName,
    product_name: productName,
    lot_number: lot?.lotNumber || '',
    counter_price: `$${counterPrice.toFixed(2)}`,
    counter_quantity: `${counterQuantity}`,
    original_price: `$${offer.price?.toFixed(2)}`,
    original_quantity: `${offer.quantity}`,
    supplier_name: 'Supplier',
    offer_id: offer._id.toString(),
    lot_id: lot?._id?.toString() || ''
  };

  // Compile subject and HTML
  const rawSubject = options?.emailSubject || `Counter-Offer: {{product_name}} - {{counter_price}} ({{counter_quantity}} cases)`;
  const rawBody = options?.templateHtml || messageText || `<p>Dear {{buyer_name}},</p><p>We propose a counter-offer of <strong>{{counter_price}}</strong> for <strong>{{counter_quantity}} cases</strong> of {{product_name}} (original offer: {{original_quantity}} cases at {{original_price}}).</p>`;

  const compiledSubject = compileSubject(rawSubject, context);
  const compiledHtml = compileTemplate(rawBody, context);

  // 1. Automatically generate an Activity record (type: 'Email') in Lot CRM timeline
  if (lot?._id) {
    try {
      await Activity.create({
        lotId: lot._id,
        type: 'Email',
        subject: compiledSubject,
        content: compiledHtml || counterMessage,
        recipient: buyerEmail || 'Buyer',
        sender: 'Supplier',
        timestamp: new Date(),
        metadata: {
          offerId: offer._id,
          action: 'counter',
          counterPrice,
          counterQuantity,
          originalPrice: offer.price,
          originalQuantity: offer.quantity
        }
      });
    } catch (actErr) {
      console.warn('Failed to create Activity record for counter-offer:', actErr);
    }
  }

  // 2. Automatically sync sent email into Emails Hub thread
  if (buyerEmail) {
    try {
      await syncEmailToThread({
        supplierId,
        buyerEmail,
        subject: compiledSubject,
        body: compiledHtml || counterMessage,
        senderType: 'supplier',
        listingId: offer.listingId?.toString()
      });
    } catch (syncErr) {
      console.warn('Failed to sync counter email to thread:', syncErr);
    }
  }

  // 3. Outbound email dispatch via Google OAuth Mailbox (with automatic fallback to SMTP)
  let emailDispatch: { dispatched: boolean; messageId?: string; warning?: string } = {
    dispatched: false
  };

  if (buyerEmail) {
    try {
      const sendRes = await sendCampaignEmail(
        supplierId,
        buyerEmail,
        compiledSubject,
        compiledHtml,
        context
      );
      emailDispatch = {
        dispatched: true,
        messageId: sendRes.messageId
      };
    } catch (dispatchErr: any) {
      console.warn('[ResilientCounterDispatch] OAuth dispatch encountered error, attempting fallback:', dispatchErr?.message || dispatchErr);
      try {
        const helperRes = await sendEmailHelper(
          buyerEmail,
          compiledSubject,
          compiledHtml,
          undefined,
          'Supplier',
          supplierId
        );
        if (helperRes.success) {
          emailDispatch = {
            dispatched: true,
            messageId: helperRes.messageId
          };
        } else {
          emailDispatch = {
            dispatched: false,
            warning: helperRes.error || 'Mail transport disconnected or failed to deliver.'
          };
        }
      } catch (fallbackErr: any) {
        console.warn('[ResilientCounterDispatch] Mail transport failure:', fallbackErr?.message || fallbackErr);
        emailDispatch = {
          dispatched: false,
          warning: fallbackErr?.message || 'Mail transport disconnected or failed to deliver.'
        };
      }
    }
  } else {
    emailDispatch = {
      dispatched: false,
      warning: 'Buyer email address not found; email dispatch skipped.'
    };
  }

  return {
    success: true,
    ...offer.toObject(),
    emailDispatch
  };
}

export async function acceptBid(
  offerId: string,
  options?: {
    awardedQuantity?: number;
    pickupAddress?: string;
    pickupHours?: string;
    templateHtml?: string;
    emailSubject?: string;
  }
) {
  const offer = await Offer.findById(offerId).populate('buyerId');
  if (!offer) {
    throw new Error('Offer not found.');
  }

  // Guard: offer status lifecycle
  if (offer.status === 'fully_accepted' || offer.status === 'partially_accepted') {
    throw new Error('Offer has already been accepted.');
  }
  if (offer.status === 'rejected') {
    throw new Error('Cannot accept a rejected offer. Please reset the offer first.');
  }

  // Find associated lot and product
  let lot: any = null;
  if (offer.lotId) {
    lot = await InventoryLot.findById(offer.lotId).populate('productId');
  } else if (offer.listingId) {
    const listing = await MarketplaceListing.findById(offer.listingId);
    if (listing?.lotId) {
      lot = await InventoryLot.findById(listing.lotId).populate('productId');
    } else if (listing?.opportunityId) {
      const opp = await Opportunity.findById(listing.opportunityId);
      if (opp?.lotId) {
        lot = await InventoryLot.findById(opp.lotId).populate('productId');
      }
    }
  }

  // Distribution center details
  let dc: any = null;
  if (lot?.distributionCenterId) {
    dc = await DistributionCenter.findById(lot.distributionCenterId);
  }

  const pickupLocation = options?.pickupAddress || dc?.address || 'Supplier Warehouse Depot';
  const pickupHours = options?.pickupHours || (dc as any)?.operatingHours || '08:00 AM - 04:30 PM CST';

  // Determine awarded quantity
  const requestedAwardQty = options?.awardedQuantity !== undefined ? options.awardedQuantity : offer.quantity;
  const awardedQty = Math.max(1, requestedAwardQty);

  // Guard: awarded quantity cannot exceed offered quantity
  if (awardedQty > offer.quantity) {
    throw new Error(`Awarded quantity (${awardedQty}) cannot exceed offered quantity (${offer.quantity}).`);
  }

  // Check if an award already exists for this offer to ensure idempotency and prevent double-deduction
  const existingAward = await Award.findOne({ offerId: offer._id });
  const alreadyAwardedQty = existingAward?.awardedQty || 0;
  const deltaQty = awardedQty - alreadyAwardedQty;

  // Guard: Inventory availability check and atomic deduction/adjustment
  if (lot && deltaQty !== 0) {
    const currentAvailable = lot.availableQty !== undefined ? lot.availableQty : (lot.quantityCases || 0);
    if (deltaQty > 0 && deltaQty > currentAvailable) {
      throw new Error(`Insufficient inventory: cannot award ${awardedQty} cases (available: ${currentAvailable}).`);
    }

    const query: any = { _id: lot._id };
    if (deltaQty > 0) {
      query.availableQty = { $gte: deltaQty };
    }

    const updatedLot = await InventoryLot.findOneAndUpdate(
      query,
      {
        $inc: { availableQty: -deltaQty }
      },
      { new: true }
    ).populate('productId');

    if (!updatedLot) {
      throw new Error(`Insufficient inventory or concurrent modification detected. Cannot award ${awardedQty} cases.`);
    }

    // Auto-transition to 'sold' if inventory reaches 0, or back to 'active' if inventory is restored
    if (updatedLot.availableQty <= 0 && updatedLot.status !== 'sold') {
      updatedLot.status = 'sold';
      await updatedLot.save();
    } else if (updatedLot.availableQty > 0 && updatedLot.status === 'sold') {
      updatedLot.status = 'active';
      await updatedLot.save();
    }

    lot = updatedLot;
  }

  // Status transition: partially_accepted vs fully_accepted
  const isPartial = awardedQty < offer.quantity;
  const newStatus = isPartial ? 'partially_accepted' : 'fully_accepted';

  offer.status = newStatus;
  offer.awardedQty = awardedQty;

  // Generate Deal Settlement Token
  const rawToken = crypto.randomBytes(16).toString('hex');
  const hmacSecret = process.env.QUICK_BID_SECRET || 'spoileralert-quick-bid-secret';
  const dealToken = `${rawToken}.${crypto.createHmac('sha256', hmacSecret).update(`${rawToken}:${offer._id}`).digest('hex')}`;

  const buyerObj: any = offer.buyerId || {};
  const buyerName = buyerObj.companyName || buyerObj.name || buyerObj.email || 'Valued Buyer';
  const buyerEmail = buyerObj.email;
  const productObj: any = lot?.productId || {};
  const productName = productObj.name || productObj.description || lot?.lotNumber || 'Surplus Inventory Lot';
  const sku = productObj.sku || 'N/A';
  const supplierId = lot?.supplierId?.toString() || 'default';

  const pricePerCase = offer.price || 0;
  const totalAmountNum = Math.round(awardedQty * pricePerCase * 100) / 100;
  const totalAmountFormatted = `$${totalAmountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Create or Update Award record (idempotent upsert to prevent E11000 duplicate key error)
  const award = await Award.findOneAndUpdate(
    { offerId: offer._id },
    {
      $set: {
        listingId: offer.listingId,
        lotId: lot?._id,
        runId: offer.runId,
        buyerId: buyerObj._id || buyerObj,
        awardedQty,
        price: pricePerCase,
        totalAmount: totalAmountNum,
        dealToken,
        pickupLocation,
        pickupHours,
        paymentStatus: existingAward?.paymentStatus || 'pending',
        signatureStatus: existingAward?.signatureStatus || 'pending',
        approvedDate: existingAward?.approvedDate || new Date()
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const dealIdStr = award._id.toString();
  const baseUrl = (process.env.FRONTEND_URL || 'https://indspoileralert.com').replace(/\/$/, '');
  const paymentLink = `${baseUrl}/deal/${dealIdStr}?token=${dealToken}#payment`;
  const dealDocumentLink = `${baseUrl}/deal/${dealIdStr}?token=${dealToken}`;

  // Record acceptance message on offer
  const acceptMessage = `Offer accepted for ${awardedQty} cases at $${pricePerCase.toFixed(2)}/cs. Total deal value: ${totalAmountFormatted}. Settlement portal link dispatched to buyer.`;
  offer.messages.push({
    sender: 'system',
    content: acceptMessage,
    proposedPrice: pricePerCase,
    proposedQuantity: awardedQty,
    timestamp: new Date()
  });

  await offer.save();

  // Template context
  const context: Record<string, any> = {
    buyer_name: buyerName,
    product_name: productName,
    sku,
    awarded_quantity: `${awardedQty} cases`,
    awardedQty: `${awardedQty}`,
    price_per_case: `$${pricePerCase.toFixed(2)}`,
    unit_price: `$${pricePerCase.toFixed(2)}`,
    total_amount: totalAmountFormatted,
    pickup_location: pickupLocation,
    pickup_hours: pickupHours,
    payment_link: paymentLink,
    deal_document_link: dealDocumentLink,
    deal_id: dealIdStr,
    deal_token: dealToken,
    supplier_name: 'Supplier',
    lot_number: lot?.lotNumber || '',
    offer_id: offer._id.toString()
  };

  const rawSubject = options?.emailSubject || `Offer Accepted: {{product_name}} - Deal Settlement Memo`;
  const rawBody = options?.templateHtml || `<p>Dear {{buyer_name}},</p><p>We are pleased to accept your offer for <strong>{{awarded_quantity}}</strong> of {{product_name}} (SKU: {{sku}}) at <strong>{{price_per_case}}</strong>/case. Total amount: <strong>{{total_amount}}</strong>.</p><p><strong>Pickup Location:</strong> {{pickup_location}}<br/><strong>Pickup Hours:</strong> {{pickup_hours}}</p><p>Please review and execute your purchase agreement at: <a href="{{deal_document_link}}">{{deal_document_link}}</a></p><p>Complete payment at: <a href="{{payment_link}}">{{payment_link}}</a></p>`;

  const compiledSubject = compileSubject(rawSubject, context);
  const compiledHtml = compileTemplate(rawBody, context);

  // 1. Log Activity in Lot CRM Timeline
  if (lot?._id) {
    try {
      await Activity.create({
        lotId: lot._id,
        type: 'Email',
        subject: compiledSubject,
        content: compiledHtml || acceptMessage,
        recipient: buyerEmail || 'Buyer',
        sender: 'Supplier',
        timestamp: new Date(),
        metadata: {
          offerId: offer._id,
          awardId: award._id,
          action: 'accept',
          awardedQuantity: awardedQty,
          pricePerCase,
          totalAmount: totalAmountNum,
          dealToken,
          pickupLocation,
          pickupHours
        }
      });
    } catch (actErr) {
      console.warn('Failed to create Activity record for acceptance:', actErr);
    }
  }

  // 2. Sync to Emails Hub Thread
  if (buyerEmail) {
    try {
      await syncEmailToThread({
        supplierId,
        buyerEmail,
        subject: compiledSubject,
        body: compiledHtml || acceptMessage,
        senderType: 'supplier',
        listingId: offer.listingId?.toString()
      });
    } catch (syncErr) {
      console.warn('Failed to sync acceptance email to thread:', syncErr);
    }
  }

  // 3. Resilient email dispatch via Google OAuth Mailbox (with automatic fallback to SMTP)
  let emailDispatch: { dispatched: boolean; messageId?: string; warning?: string } = {
    dispatched: false
  };

  if (buyerEmail) {
    try {
      const sendRes = await sendCampaignEmail(
        supplierId,
        buyerEmail,
        compiledSubject,
        compiledHtml,
        context
      );
      emailDispatch = {
        dispatched: true,
        messageId: sendRes.messageId
      };
    } catch (dispatchErr: any) {
      console.warn('[ResilientAcceptDispatch] OAuth dispatch encountered error, attempting fallback:', dispatchErr?.message || dispatchErr);
      try {
        const helperRes = await sendEmailHelper(
          buyerEmail,
          compiledSubject,
          compiledHtml,
          undefined,
          'Supplier',
          supplierId
        );
        if (helperRes.success) {
          emailDispatch = {
            dispatched: true,
            messageId: helperRes.messageId
          };
        } else {
          emailDispatch = {
            dispatched: false,
            warning: helperRes.error || 'Mail transport disconnected or failed to deliver.'
          };
        }
      } catch (fallbackErr: any) {
        console.warn('[ResilientAcceptDispatch] Mail transport failure:', fallbackErr?.message || fallbackErr);
        emailDispatch = {
          dispatched: false,
          warning: fallbackErr?.message || 'Mail transport disconnected or failed to deliver.'
        };
      }
    }
  } else {
    emailDispatch = {
      dispatched: false,
      warning: 'Buyer email address not found; email dispatch skipped.'
    };
  }

  return {
    success: true,
    status: offer.status,
    awardedQty,
    dealToken,
    dealId: award._id.toString(),
    emailDispatch,
    award
  };
}

export async function resendSettlementEmail(offerId: string) {
  const offer = await Offer.findById(offerId).populate('buyerId');
  if (!offer) {
    throw new Error('Offer not found.');
  }

  const award = await Award.findOne({ offerId: offer._id });
  if (!award) {
    throw new Error('No award settlement found for this offer.');
  }

  const buyerObj: any = offer.buyerId || {};
  const buyerName = buyerObj.companyName || buyerObj.name || buyerObj.email || 'Valued Buyer';
  const buyerEmail = buyerObj.email;
  if (!buyerEmail) {
    throw new Error('Buyer email is missing.');
  }

  let lot: any = null;
  if (offer.lotId) {
    lot = await InventoryLot.findById(offer.lotId).populate('productId');
  } else if (offer.listingId) {
    const listing = await MarketplaceListing.findById(offer.listingId);
    if (listing?.lotId) {
      lot = await InventoryLot.findById(listing.lotId).populate('productId');
    } else if (listing?.opportunityId) {
      const opp = await Opportunity.findById(listing.opportunityId);
      if (opp?.lotId) {
        lot = await InventoryLot.findById(opp.lotId).populate('productId');
      }
    }
  }

  const productObj: any = lot?.productId || {};
  const productName = productObj.name || productObj.description || lot?.lotNumber || 'Surplus Inventory Lot';
  const sku = productObj.sku || 'N/A';
  const supplierId = lot?.supplierId?.toString() || 'default';

  const baseUrl = (process.env.FRONTEND_URL || 'https://indspoileralert.com').replace(/\/$/, '');
  const dealIdStr = award._id.toString();
  const dealToken = award.dealToken || '';
  const paymentLink = `${baseUrl}/deal/${dealIdStr}?token=${dealToken}#payment`;
  const dealDocumentLink = `${baseUrl}/deal/${dealIdStr}?token=${dealToken}`;

  const pricePerCase = award.price || offer.price || 0;
  const awardedQty = award.awardedQty || offer.awardedQty || offer.quantity;
  const totalAmountNum = award.totalAmount || Math.round(awardedQty * pricePerCase * 100) / 100;
  const totalAmountFormatted = `$${totalAmountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const context: Record<string, any> = {
    buyer_name: buyerName,
    product_name: productName,
    sku,
    awarded_quantity: `${awardedQty} cases`,
    awardedQty: `${awardedQty}`,
    price_per_case: `$${pricePerCase.toFixed(2)}`,
    unit_price: `$${pricePerCase.toFixed(2)}`,
    total_amount: totalAmountFormatted,
    pickup_location: award.pickupLocation || 'Supplier Warehouse Depot',
    pickup_hours: award.pickupHours || '08:00 AM - 04:30 PM CST',
    payment_link: paymentLink,
    deal_document_link: dealDocumentLink,
    deal_id: dealIdStr,
    deal_token: dealToken,
    supplier_name: 'Supplier',
    lot_number: lot?.lotNumber || '',
    offer_id: offer._id.toString()
  };

  const rawSubject = `Offer Accepted: {{product_name}} - Deal Settlement Memo (Resend)`;
  const rawBody = `<p>Dear {{buyer_name}},</p><p>We are pleased to accept your offer for <strong>{{awarded_quantity}}</strong> of {{product_name}} (SKU: {{sku}}) at <strong>{{price_per_case}}</strong>/case. Total amount: <strong>{{total_amount}}</strong>.</p><p><strong>Pickup Location:</strong> {{pickup_location}}<br/><strong>Pickup Hours:</strong> {{pickup_hours}}</p><p>Please review and execute your purchase agreement at: <a href="{{deal_document_link}}">{{deal_document_link}}</a></p><p>Complete payment at: <a href="{{payment_link}}">{{payment_link}}</a></p>`;

  const compiledSubject = compileSubject(rawSubject, context);
  const compiledHtml = compileTemplate(rawBody, context);

  let emailDispatch: { dispatched: boolean; messageId?: string; warning?: string } = { dispatched: false };

  try {
    const sendRes = await sendCampaignEmail(
      supplierId,
      buyerEmail,
      compiledSubject,
      compiledHtml,
      context
    );
    emailDispatch = {
      dispatched: true,
      messageId: sendRes.messageId
    };
  } catch (mailErr: any) {
    try {
      const helperRes = await sendEmailHelper(
        buyerEmail,
        compiledSubject,
        compiledHtml,
        undefined,
        'Supplier',
        supplierId
      );
      if (helperRes.success) {
        emailDispatch = { dispatched: true, messageId: helperRes.messageId };
      } else {
        emailDispatch = { dispatched: false, warning: helperRes.error || 'Resend failed.' };
      }
    } catch (fallbackErr: any) {
      emailDispatch = { dispatched: false, warning: fallbackErr?.message || 'Resend failed.' };
    }
  }

  if (lot?._id) {
    try {
      await Activity.create({
        lotId: lot._id,
        type: 'Email',
        subject: compiledSubject,
        content: compiledHtml,
        recipient: buyerEmail,
        sender: 'Supplier',
        timestamp: new Date(),
        metadata: {
          offerId: offer._id,
          awardId: award._id,
          action: 'resend_settlement',
          awardedQuantity: awardedQty,
          pricePerCase,
          totalAmount: totalAmountNum,
          dealToken
        }
      });
    } catch (actErr) {
      console.warn('Failed to log Activity for resend:', actErr);
    }
  }

  return {
    success: true,
    emailDispatch,
    dealId: dealIdStr,
    dealToken
  };
}


