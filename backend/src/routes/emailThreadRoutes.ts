import { Router, Request, Response } from 'express';
import EmailThread from '../models/EmailThread';
import EmailDispatchLog from '../models/EmailDispatchLog';
import SupplierSmtpConfig from '../models/SupplierSmtpConfig';
import Supplier from '../models/Supplier';
import { sendEmailHelper } from '../services/emailService';

const router = Router();

// GET /api/email-threads?supplierId=...
router.get('/', async (req: Request, res: Response) => {
  try {
    const supplierId = (req.query.supplierId as string) || 'default';
    const validSupplierIds = new Set<string>([
      supplierId,
      'default',
      'supplier-unilever-123'
    ]);

    const unileverSupplier = await Supplier.findOne({ companyCode: 'ULVR' });
    if (unileverSupplier) {
      validSupplierIds.add(unileverSupplier._id.toString());
    }

    const targetSupplierList = Array.from(validSupplierIds);

    // Reconcile any orphan historical EmailDispatchLog entries into EmailThreads
    const dispatchLogs = await EmailDispatchLog.find({
      $or: [
        { supplierId: { $in: targetSupplierList } },
        { supplierId: { $exists: false } },
        { supplierId: null }
      ]
    });

    for (const log of dispatchLogs) {
      if (!log.buyerEmail) continue;

      const existingThread = await EmailThread.findOne({
        $or: [
          ...(log.threadId ? [{ threadId: log.threadId }] : []),
          {
            supplierId: { $in: targetSupplierList },
            buyerEmail: log.buyerEmail,
            ...(log.listingId ? { listingId: log.listingId } : {})
          }
        ]
      });

      if (!existingThread) {
        const threadId = log.threadId || `th-hist-${log.dispatchId}`;
        const subj = log.listingId ? `Direct Email / Listing #${log.listingId}` : 'Direct Outbound Dispatch';
        await EmailThread.create({
          threadId,
          supplierId: log.supplierId || supplierId,
          buyerEmail: log.buyerEmail,
          listingId: log.listingId,
          subject: subj,
          status: 'active',
          openCount: log.openCount || 0,
          firstOpenedAt: log.firstOpenedAt,
          lastOpenedAt: log.lastOpenedAt,
          messages: [
            {
              messageId: `msg-hist-${log.dispatchId}`,
              senderType: 'supplier',
              senderEmail: 'eveline94@ethereal.email',
              body: `Outbound email dispatched to ${log.compiledBuyerName || log.buyerEmail}.`,
              sentAt: log.dispatchedAt || log.createdAt || new Date()
            }
          ]
        });
      } else {
        const msgId = `msg-hist-${log.dispatchId}`;
        const hasMsg = existingThread.messages?.some(
          (m: any) => m.messageId === msgId || m.messageIdHeader === log.dispatchId
        );
        if (!hasMsg) {
          existingThread.messages.push({
            messageId: msgId,
            senderType: 'supplier',
            senderEmail: 'eveline94@ethereal.email',
            body: `Outbound email dispatched to ${log.compiledBuyerName || log.buyerEmail}.`,
            sentAt: log.dispatchedAt || log.createdAt || new Date()
          });
          existingThread.updatedAt = new Date();
          await existingThread.save();
        }
      }
    }

    const threads = await EmailThread.find({
      supplierId: { $in: targetSupplierList }
    }).sort({ updatedAt: -1 });

    return res.status(200).json(threads);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/email-threads/:threadId
router.get('/:threadId', async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const thread = await EmailThread.findOne({ threadId });
    if (!thread) {
      return res.status(404).json({ error: 'Email thread not found.' });
    }
    return res.status(200).json(thread);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/email-threads/:threadId/reply
router.post('/:threadId/reply', async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { supplierId = 'default', message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message body is required.' });
    }

    const thread = await EmailThread.findOne({ threadId });
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found.' });
    }

    // Look up supplier SMTP config to get sender identity
    const smtpConfig = await SupplierSmtpConfig.findOne({ supplierId });
    const fromEmail = smtpConfig?.senderEmail || 'eveline94@ethereal.email';
    const fromName = smtpConfig?.senderName || 'IndSpoiler Alert Platform';

    // Send email via Nodemailer
    const mailRes = await sendEmailHelper(
      thread.buyerEmail,
      `Re: ${thread.subject}`,
      message,
      fromEmail,
      fromName
    );

    const newMessage = {
      messageId: `msg-${Date.now()}`,
      senderType: 'supplier' as const,
      senderEmail: fromEmail,
      body: message,
      sentAt: new Date(),
      messageIdHeader: mailRes.messageId
    };

    thread.messages.push(newMessage);
    thread.updatedAt = new Date();
    await thread.save();

    // Create dispatch log entry for the outbound reply
    const dispatchId = `disp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await EmailDispatchLog.create({
      dispatchId,
      threadId,
      supplierId,
      buyerEmail: thread.buyerEmail,
      listingId: thread.listingId,
      openCount: 0
    });

    return res.status(200).json({
      success: true,
      message: newMessage,
      previewUrl: mailRes.previewUrl
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/email-threads/:threadId/messages — Receive an inbound buyer message or webhook
router.post('/:threadId/messages', async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { buyerEmail, message, senderType = 'buyer' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message body is required.' });
    }

    const thread = await EmailThread.findOne({ threadId });
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found.' });
    }

    const newMessage = {
      messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderType: senderType as 'buyer' | 'supplier' | 'system',
      senderEmail: buyerEmail || thread.buyerEmail,
      body: message,
      sentAt: new Date()
    };

    thread.messages.push(newMessage);
    thread.updatedAt = new Date();
    await thread.save();

    return res.status(200).json({
      success: true,
      message: newMessage,
      thread
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
