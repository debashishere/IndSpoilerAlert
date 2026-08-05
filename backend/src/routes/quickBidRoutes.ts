import { Router, Request, Response } from 'express';
import QuickBidToken from '../models/QuickBidToken';
import crypto from 'crypto';

const router = Router();

// POST /api/bids/quick-bid-token  — Generate a signed quick-bid token
router.post('/quick-bid-token', async (req: Request, res: Response) => {
  try {
    const { buyerEmail, listingId, defaultAmount = 15.00, expiresInHours = 48 } = req.body;

    if (!buyerEmail || !listingId) {
      return res.status(400).json({ error: 'buyerEmail and listingId are required.' });
    }

    // Cryptographically signed token (32 random bytes + HMAC)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hmacSecret = process.env.ENCRYPTION_SECRET || 'ind-spoiler-alert-secret-key-2026!';
    const sig = crypto
      .createHmac('sha256', hmacSecret)
      .update(`${rawToken}:${buyerEmail}:${listingId}`)
      .digest('hex');
    const token = `${rawToken}.${sig}`;

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    await QuickBidToken.create({
      token,
      buyerEmail,
      listingId,
      defaultAmount,
      expiresAt,
      isUsed: false
    });

    const quickBidUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?tab=dashboard&token=${encodeURIComponent(token)}`;

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

    return res.status(200).json({
      buyerEmail: tokenDoc.buyerEmail,
      listingId: tokenDoc.listingId,
      defaultAmount: tokenDoc.defaultAmount,
      expiresAt: tokenDoc.expiresAt
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/bids/quick-submit
router.post('/quick-submit', async (req: Request, res: Response) => {
  try {
    const { token, amount, cases = 100 } = req.body;
    if (!token || !amount) {
      return res.status(400).json({ error: 'token and amount are required.' });
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

    tokenDoc.isUsed = true;
    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    return res.status(200).json({
      success: true,
      bid: {
        listingId: tokenDoc.listingId,
        buyerEmail: tokenDoc.buyerEmail,
        amount: Number(amount),
        cases: Number(cases),
        submittedAt: new Date()
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
