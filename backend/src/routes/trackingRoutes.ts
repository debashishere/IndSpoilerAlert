import { Router, Request, Response } from 'express';
import EmailDispatchLog from '../models/EmailDispatchLog';
import EmailThread from '../models/EmailThread';

const router = Router();

// Transparent 1x1 PNG Buffer
const TRANSPARENT_PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

// GET /api/tracking/pixel.png?dispatchId=...&threadId=...&buyerEmail=...&listingId=...
router.get('/pixel.png', async (req: Request, res: Response) => {
  try {
    const dispatchId = (req.query.dispatchId as string) || `disp-${Date.now()}`;
    const buyerEmail = req.query.buyerEmail as string;
    const listingId = req.query.listingId as string;
    const threadId = req.query.threadId as string;

    const now = new Date();
    const existing = await EmailDispatchLog.findOne({ dispatchId });

    if (!existing) {
      await EmailDispatchLog.create({
        dispatchId,
        buyerEmail,
        listingId,
        threadId,
        firstOpenedAt: now,
        lastOpenedAt: now,
        openCount: 1,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });
    } else {
      existing.openCount += 1;
      existing.lastOpenedAt = now;
      if (!existing.firstOpenedAt) {
        existing.firstOpenedAt = now;
      }
      await existing.save();
    }

    // Sync open count back to the parent EmailThread
    if (threadId) {
      const thread = await EmailThread.findOne({ threadId });
      if (thread) {
        // Re-aggregate total opens from all dispatch logs for this thread
        const logs = await EmailDispatchLog.find({ threadId });
        const totalOpens = logs.reduce((sum, l) => sum + (l.openCount || 0), 0);
        thread.openCount = totalOpens;
        thread.lastOpenedAt = now;
        if (!thread.firstOpenedAt) {
          thread.firstOpenedAt = now;
        }
        await thread.save();
      }
    }
  } catch (err) {
    console.error('Error logging pixel open:', err);
  }

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  return res.status(200).send(TRANSPARENT_PNG_1X1);
});

// GET /api/tracking/dispatches?supplierId=...
router.get('/dispatches', async (req: Request, res: Response) => {
  try {
    const supplierId = req.query.supplierId as string;
    const query: any = {};
    if (supplierId) query.supplierId = supplierId;

    const logs = await EmailDispatchLog.find(query).sort({ createdAt: -1 }).limit(200);
    return res.status(200).json(logs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
