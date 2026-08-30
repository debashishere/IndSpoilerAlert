import { Router, Request, Response } from 'express';
import QuickBidToken from '../models/QuickBidToken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { areBuyerEmailsMatching } from '../utils/emailValidation';

const router = Router();

export async function generateQuickBidToken({
  buyerEmail,
  listingId,
  lotId,
  runId,
  stageIndex,
  supplierId,
  defaultAmount = 15.00,
  expiresAt
}: {
  buyerEmail: string;
  listingId: string;
  lotId?: string | mongoose.Types.ObjectId;
  runId?: string | mongoose.Types.ObjectId;
  stageIndex?: number;
  supplierId?: string | mongoose.Types.ObjectId;
  defaultAmount?: number;
  expiresAt: Date;
}) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hmacSecret = process.env.ENCRYPTION_SECRET || 'ind-spoiler-alert-secret-key-2026!';
  const sig = crypto
    .createHmac('sha256', hmacSecret)
    .update(`${rawToken}:${buyerEmail}:${listingId}`)
    .digest('hex');
  const token = `${rawToken}.${sig}`;

  await QuickBidToken.create({
    token,
    buyerEmail,
    listingId,
    lotId,
    runId,
    stageIndex,
    supplierId,
    defaultAmount,
    expiresAt,
    isUsed: false
  });

  return token;
}

// POST /api/bids/quick-bid-token  — Generate a signed quick-bid token
router.post('/quick-bid-token', async (req: Request, res: Response) => {
  try {
    const { buyerEmail, listingId, defaultAmount = 15.00, expiresInHours = 48, runId, stageIndex, lotId, supplierId } = req.body;

    if (!buyerEmail || !listingId) {
      return res.status(400).json({ error: 'buyerEmail and listingId are required.' });
    }

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const token = await generateQuickBidToken({
      buyerEmail,
      listingId,
      lotId,
      runId,
      stageIndex,
      supplierId,
      defaultAmount,
      expiresAt
    });

    const quickBidUrl = `${process.env.FRONTEND_URL || 'https://indspoileralert.com'}/bid?token=${encodeURIComponent(token)}`;

    return res.status(201).json({
      success: true,
      token,
      quickBidUrl,
      expiresAt
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/bids/quick-bid-info?token=...
router.get('/quick-bid-info', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).json({ error: 'Token query parameter is required.' });
    }

    const tokenDoc = await QuickBidToken.findOne({ token });
    if (!tokenDoc) {
      return res.status(404).json({ error: 'Invalid or expired quick bid token.' });
    }

    if (tokenDoc.isUsed) {
      return res.status(400).json({ error: 'This quick bid token has already been used.' });
    }

    if (tokenDoc.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This quick bid link has expired.' });
    }

    let lotData: any = null;
    try {
      const InventoryLot = (await import('../models/InventoryLot')).default;
      const targetLotId = tokenDoc.lotId || (mongoose.Types.ObjectId.isValid(tokenDoc.listingId) ? tokenDoc.listingId : null);
      if (targetLotId) {
        lotData = await InventoryLot.findById(targetLotId)
          .populate('productId')
          .populate('distributionCenterId')
          .populate('supplierId');
      }
    } catch (e) {}

    let supplierName = 'IndSpoiler Alert Operations';
    if (lotData?.supplierId?.name) {
      supplierName = lotData.supplierId.name;
    } else if (tokenDoc.supplierId && mongoose.Types.ObjectId.isValid(tokenDoc.supplierId)) {
      try {
        const Supplier = (await import('../models/Supplier')).default;
        const sup = await Supplier.findById(tokenDoc.supplierId);
        if (sup) supplierName = sup.name;
      } catch (e) {}
    }

    return res.status(200).json({
      buyerEmail: tokenDoc.buyerEmail,
      listingId: tokenDoc.listingId,
      lotId: tokenDoc.lotId,
      runId: tokenDoc.runId ? tokenDoc.runId.toString() : undefined,
      stageIndex: tokenDoc.stageIndex,
      supplierId: tokenDoc.supplierId ? tokenDoc.supplierId.toString() : undefined,
      supplierName,
      defaultAmount: tokenDoc.defaultAmount || (lotData ? lotData.standardSellPrice || 15.00 : 15.00),
      expiresAt: tokenDoc.expiresAt,
      lot: lotData ? {
        _id: lotData._id,
        lotNumber: lotData.lotNumber,
        availableQty: lotData.availableQty ?? lotData.quantityCases,
        totalCases: lotData.quantityCases,
        costPerCase: lotData.costPerCase,
        standardSellPrice: lotData.standardSellPrice,
        expirationDate: lotData.expirationDate,
        remainingShelfLife: lotData.remainingShelfLife,
        status: lotData.status,
        product: lotData.productId ? {
          description: lotData.productId.description || lotData.productId.name,
          sku: lotData.productId.sku,
          brand: lotData.productId.brand,
          category: lotData.productId.category,
          imageUrl: lotData.productId.imageUrl,
          allergens: lotData.productId.allergens,
          certifications: lotData.productId.certifications
        } : null,
        warehouse: lotData.distributionCenterId?.name || lotData.location || 'Distribution Center'
      } : null
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

import { optionalAuthToken, AuthenticatedRequest } from '../middleware/authMiddleware';

// POST /api/bids/quick-submit
router.post('/quick-submit', optionalAuthToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token, amount, cases = 100 } = req.body;
    if (!token || !amount) {
      return res.status(400).json({ error: 'token and amount are required.' });
    }

    // 1. Validate payload
    const bidAmount = Number(amount);
    const bidCases = Number(cases);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number.' });
    }
    if (isNaN(bidCases) || bidCases <= 0) {
      return res.status(400).json({ error: 'cases must be a positive number.' });
    }

    const tokenDoc = await QuickBidToken.findOne({ token });
    if (!tokenDoc) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    if (tokenDoc.isUsed) {
      return res.status(400).json({ error: 'This token has already been used.' });
    }

    if (tokenDoc.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This quick bid link has expired.' });
    }

    // Verify authenticated user matches token buyer email (if session is present, supports base email & sub-emails)
    const activeEmail = req.user?.email || (req.headers['x-buyer-email'] as string) || req.body.activeBuyerEmail;
    if (activeEmail && !areBuyerEmailsMatching(activeEmail, tokenDoc.buyerEmail)) {
      return res.status(403).json({
        error: `Account mismatch: You are currently signed in as ${activeEmail}, but this private bid offer was issued exclusively to ${tokenDoc.buyerEmail}. Please switch accounts to place this bid.`
      });
    }

    // Resolve the target lot
    const InventoryLot = (await import('../models/InventoryLot')).default;
    const targetLotId = tokenDoc.lotId || tokenDoc.listingId;
    const lot = targetLotId ? await InventoryLot.findById(targetLotId) : null;

    // Validate cases against available quantity
    if (lot && bidCases > (lot.availableQty ?? lot.quantityCases ?? Infinity)) {
      return res.status(400).json({ error: `cases (${bidCases}) exceeds available lot quantity (${lot.availableQty ?? lot.quantityCases}).` });
    }

    // 2. Ensure the linked AutomationRun is still active (if present)
    let run: any = null;
    if (tokenDoc.runId) {
      const AutomationRun = (await import('../models/AutomationRun')).default;
      run = await AutomationRun.findById(tokenDoc.runId);
      if (run) {
        const terminalStatuses = ['awarded', 'fallback_executed', 'failed', 'error'];
        if (terminalStatuses.includes(run.status)) {
          return res.status(409).json({
            error: `This liquidation run has already concluded (status: ${run.status}). No further bids can be accepted.`
          });
        }
      }
    }

    // 3. Resolve or upsert a Buyer document for tokenDoc.buyerEmail
    const Buyer = (await import('../models/Buyer')).default;
    let buyer = await Buyer.findOne({ email: tokenDoc.buyerEmail.toLowerCase() });
    if (!buyer) {
      buyer = await Buyer.create({
        email: tokenDoc.buyerEmail.toLowerCase(),
        companyName: tokenDoc.buyerEmail.split('@')[0],
        supplierId: tokenDoc.supplierId || undefined,
        isVerified: false,
        acceptsShortDated: true,
        minShelfLife: 7,
        categories: [],
        transportRadius: 100,
        warehouseLocations: [],
        isActive: true,
        optInBidding: true,
        optInSales: true
      });
    }

    // 4. Create an Offer record routed through the standard evaluation pipeline
    const Offer = (await import('../models/Offer')).default;
    const offer = await Offer.create({
      listingId: tokenDoc.listingId && mongoose.Types.ObjectId.isValid(tokenDoc.listingId)
        ? new mongoose.Types.ObjectId(tokenDoc.listingId)
        : undefined,
      lotId: tokenDoc.lotId ? new mongoose.Types.ObjectId(tokenDoc.lotId as string) : undefined,
      runId: tokenDoc.runId ? new mongoose.Types.ObjectId(tokenDoc.runId as string) : undefined,
      buyerId: buyer._id,
      quantity: bidCases,
      price: bidAmount,
      status: 'pending',
      submittedAt: new Date()
    });

    // Mark token as used
    tokenDoc.isUsed = true;
    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    // 5. Push to run.buyerOffers and call run.markModified('buyerOffers')
    if (run) {
      if (!run.buyerOffers) run.buyerOffers = [];
      run.buyerOffers.push({
        buyerEmail: tokenDoc.buyerEmail,
        stageIndex: tokenDoc.stageIndex ?? 0,
        lotId: tokenDoc.lotId || tokenDoc.listingId,
        offeredPrice: bidAmount,
        offeredCases: bidCases,
        offerId: offer._id,
        submittedAt: new Date()
      });
      run.markModified('buyerOffers');
      await run.save();

      // 6. Trigger the evaluation pipeline (floor price, yield recovery, auto-award logic)
      if (lot) {
        try {
          const { checkBidAgainstActiveWorkflows } = await import('../services/agendaService');
          // Resolve listing for pipeline hook (optional — may be null for unlisted lots)
          const MarketplaceListing = (await import('../models/MarketplaceListing')).default;
          const listing = await MarketplaceListing.findOne({
            $or: [
              ...(tokenDoc.listingId ? [{ _id: tokenDoc.listingId }] : []),
              { lotId: lot._id }
            ]
          });
          await checkBidAgainstActiveWorkflows(lot, offer, listing);
        } catch (evalErr: any) {
          console.error('Quick-bid evaluation pipeline error:', evalErr.message || evalErr);
        }
      }
    }

    // 7. Log an Activity record for the supplier
    try {
      const Activity = (await import('../models/Activity')).default;
      await Activity.create({
        lotId: lot?._id,
        type: 'quick_bid',
        subject: `Quick Bid Received — ${bidCases} cases @ $${bidAmount.toFixed(2)}/case`,
        content: `Buyer ${tokenDoc.buyerEmail} submitted a quick bid of $${bidAmount.toFixed(2)}/case for ${bidCases} cases via signed email token.`,
        recipient: tokenDoc.buyerEmail,
        sender: process.env.SMTP_USER || 'noreply@spoileralert.com',
        metadata: {
          offerId: offer._id,
          runId: tokenDoc.runId,
          stageIndex: tokenDoc.stageIndex,
          buyerId: buyer._id,
          bidAmount,
          bidCases,
          totalValue: bidAmount * bidCases
        },
        timestamp: new Date()
      });
    } catch (actErr: any) {
      console.error('Failed to log quick-bid activity:', actErr.message || actErr);
    }

    return res.status(200).json({
      success: true,
      bid: {
        offerId: offer._id,
        listingId: tokenDoc.listingId,
        lotId: tokenDoc.lotId,
        runId: tokenDoc.runId ? tokenDoc.runId.toString() : undefined,
        stageIndex: tokenDoc.stageIndex,
        buyerEmail: tokenDoc.buyerEmail,
        amount: bidAmount,
        cases: bidCases,
        submittedAt: new Date()
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
