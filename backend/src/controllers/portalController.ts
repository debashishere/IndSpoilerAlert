import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Offer from '../models/Offer';
import InventoryLot from '../models/InventoryLot';
import MarketplaceListing from '../models/MarketplaceListing';
import Opportunity from '../models/Opportunity';
import Activity from '../models/Activity';
import Award from '../models/Award';
import EmailThread from '../models/EmailThread';
import { syncEmailToThread, sendCampaignEmail, sendEmailHelper } from '../services/emailService';
import { acceptBid, resolveLotForOffer } from '../services/offersService';

export function verifyNegotiationToken(suppliedToken: string | undefined, offer: any): boolean {
  if (!suppliedToken || typeof suppliedToken !== 'string') return false;
  const hmacSecret = process.env.QUICK_BID_SECRET || 'spoileralert-quick-bid-secret';
  const parts = suppliedToken.split('.');
  if (parts.length === 2) {
    const [rawToken, sig] = parts;
    const offerIdStr = (offer._id || offer).toString();
    const expectedSig = crypto.createHmac('sha256', hmacSecret).update(`${rawToken}:${offerIdStr}`).digest('hex');
    
    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');
    const isSigValid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (isSigValid && (!offer.negotiationToken || suppliedToken === offer.negotiationToken)) {
      return true;
    }
  } else if (offer.negotiationToken && suppliedToken === offer.negotiationToken) {
    return true;
  }
  return false;
}

export async function getNegotiationPortal(req: Request, res: Response) {
  try {
    const { offerId } = req.params;
    const token = (req.query.token as string) || (req.headers['x-negotiation-token'] as string);

    if (!offerId || !mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(404).json({ error: 'Invalid or missing offer ID.' });
    }

    const offer = await Offer.findById(offerId).populate('buyerId');
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    if (!verifyNegotiationToken(token, offer)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired negotiation token.' });
    }

    const lot = await resolveLotForOffer(offer, true);
    const product = lot?.productId || null;

    const supplierMessages = (offer.messages || []).filter(
      (m: any) => m.sender === 'supplier' && (m.proposedPrice !== undefined || m.proposedQuantity !== undefined)
    );
    const latestSupplierProposal = supplierMessages.length > 0 ? supplierMessages[supplierMessages.length - 1] : null;

    return res.json({
      offer,
      lot,
      product,
      distributionCenter: lot?.distributionCenterId || null,
      latestSupplierProposal,
      messages: offer.messages || []
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function submitRebid(req: Request, res: Response) {
  try {
    const { offerId } = req.params;
    const token = (req.query.token as string) || (req.headers['x-negotiation-token'] as string);
    const { proposedPrice, proposedQuantity, message } = req.body;

    if (!offerId || !mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(404).json({ error: 'Invalid or missing offer ID.' });
    }

    const offer = await Offer.findById(offerId).populate('buyerId');
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    if (!verifyNegotiationToken(token, offer)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired negotiation token.' });
    }

    // State machine guards
    if (offer.status === 'fully_accepted' || offer.status === 'partially_accepted' || offer.status === 'rejected') {
      return res.status(400).json({ error: `Cannot submit a counter-bid on an offer with status '${offer.status}'.` });
    }

    if (offer.status === 'pending') {
      return res.status(409).json({ error: 'A revised proposal is already pending supplier review.' });
    }

    if (offer.status !== 'countered') {
      return res.status(400).json({ error: `Cannot submit a counter-bid on an offer with status '${offer.status}'.` });
    }

    if (proposedPrice === undefined || typeof proposedPrice !== 'number' || proposedPrice <= 0 || isNaN(proposedPrice)) {
      return res.status(400).json({ error: 'proposedPrice must be a positive number.' });
    }
    if (proposedQuantity === undefined || typeof proposedQuantity !== 'number' || proposedQuantity <= 0 || !Number.isInteger(proposedQuantity)) {
      return res.status(400).json({ error: 'proposedQuantity must be a positive integer.' });
    }

    offer.status = 'pending';
    const messageContent = message || `Buyer revised proposal: $${proposedPrice.toFixed(2)}/cs for ${proposedQuantity} cases.`;
    offer.messages.push({
      sender: 'buyer',
      content: messageContent,
      proposedPrice,
      proposedQuantity,
      timestamp: new Date()
    });

    await offer.save();

    const lot = await resolveLotForOffer(offer, false);

    const buyerObj: any = offer.buyerId || {};
    const buyerName = buyerObj.companyName || buyerObj.name || buyerObj.email || 'Buyer';
    const buyerEmail = buyerObj.email;
    const supplierId = lot?.supplierId?.toString() || 'default';

    if (lot?._id) {
      try {
        await Activity.create({
          lotId: lot._id,
          type: 'Note',
          subject: `Buyer Countered: $${proposedPrice.toFixed(2)}/cs (${proposedQuantity} cases)`,
          content: `${buyerName} submitted a revised counter-bid of $${proposedPrice.toFixed(2)}/cs for ${proposedQuantity} cases.${message ? ` Note: "${message}"` : ''}`,
          sender: buyerName,
          timestamp: new Date(),
          metadata: {
            offerId: offer._id,
            action: 'buyer_rebid',
            proposedPrice,
            proposedQuantity
          }
        });
      } catch (actErr) {
        console.warn('Failed to log buyer rebid CRM activity:', actErr);
      }
    }

    if (buyerEmail) {
      try {
        const cleanBuyerEmail = buyerEmail.trim().toLowerCase();
        const existingThread = await EmailThread.findOne({ buyerEmail: cleanBuyerEmail }).sort({ updatedAt: -1 });
        const threadSubject = existingThread?.subject || `Buyer Countered: $${proposedPrice.toFixed(2)}/cs (${proposedQuantity} cases)`;

        await syncEmailToThread({
          supplierId,
          buyerEmail,
          subject: threadSubject,
          body: messageContent,
          senderType: 'buyer',
          senderEmail: buyerEmail,
          listingId: offer.listingId?.toString()
        });
      } catch (syncErr) {
        console.warn('Failed to sync buyer rebid to thread:', syncErr);
      }
    }

    return res.json({
      success: true,
      offer
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function acceptCounterProposal(req: Request, res: Response) {
  try {
    const { offerId } = req.params;
    const token = (req.query.token as string) || (req.headers['x-negotiation-token'] as string);

    if (!offerId || !mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(404).json({ error: 'Invalid or missing offer ID.' });
    }

    const offer = await Offer.findById(offerId).populate('buyerId');
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    if (!verifyNegotiationToken(token, offer)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired negotiation token.' });
    }

    // State machine check: Buyer can only accept when in 'countered' status
    if (offer.status !== 'countered') {
      return res.status(400).json({ error: `Cannot accept counter-offer when offer status is '${offer.status}'.` });
    }

    // Find latest supplier proposal
    const supplierMessages = (offer.messages || []).filter(
      (m: any) => m.sender === 'supplier' && (m.proposedPrice !== undefined || m.proposedQuantity !== undefined)
    );
    const latestProposal = supplierMessages.length > 0 ? supplierMessages[supplierMessages.length - 1] : null;

    if (!latestProposal) {
      return res.status(400).json({ error: 'No active supplier counter-offer proposal found to accept.' });
    }

    // Ensure latest message in thread is not a superseded proposal (e.g. buyer rebid that reverted status)
    const messages = offer.messages || [];
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'buyer') {
      return res.status(400).json({ error: 'Supplier counter-offer has been superseded by a newer proposal.' });
    }

    const pricePerCase = latestProposal.proposedPrice ?? offer.price;
    const awardedQuantity = latestProposal.proposedQuantity ?? offer.quantity;

    // NOTE: Baseline Bid Preservation: offer.quantity remains immutable throughout negotiations!
    const result = await acceptBid(offerId, {
      pricePerCase,
      awardedQuantity
    });

    const lot = await resolveLotForOffer(offer, false);

    const buyerObj: any = offer.buyerId || {};
    const buyerName = buyerObj.companyName || buyerObj.name || buyerObj.email || 'Buyer';

    if (lot?._id) {
      try {
        await Activity.create({
          lotId: lot._id,
          type: 'Note',
          subject: `Buyer Accepted Counter-Offer: $${pricePerCase.toFixed(2)}/cs (${awardedQuantity} cases)`,
          content: `${buyerName} accepted the supplier's counter-offer via the Guest Negotiation Portal. Deal awarded and settlement portal token issued.`,
          sender: buyerName,
          timestamp: new Date(),
          metadata: {
            offerId: offer._id,
            action: 'buyer_accept_counter',
            pricePerCase,
            awardedQuantity,
            dealId: result.dealId
          }
        });
      } catch (actErr) {
        console.warn('Failed to log buyer acceptance CRM activity:', actErr);
      }
    }

    return res.json({
      success: true,
      dealId: result.dealId,
      dealToken: result.dealToken,
      offer: await Offer.findById(offerId),
      award: result.award
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
