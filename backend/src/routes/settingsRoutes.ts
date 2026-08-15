import { Router, Request, Response } from 'express';
import SupplierSmtpConfig from '../models/SupplierSmtpConfig';
import EmailThread from '../models/EmailThread';
import EmailDispatchLog from '../models/EmailDispatchLog';
import { encryptText } from '../utils/crypto';
import nodemailer from 'nodemailer';
import { decryptText } from '../utils/crypto';
import { sendEmailHelper } from '../services/emailService';

const router = Router();

// GET /api/settings/smtp?supplierId=xyz
router.get('/smtp', async (req: Request, res: Response) => {
  try {
    const supplierId = (req.query.supplierId as string) || 'default';
    const config = await SupplierSmtpConfig.findOne({ supplierId });
    if (!config) {
      return res.status(200).json({
        configured: false,
        host: process.env.SMTP_HOST || '',
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        passMasked: process.env.SMTP_PASS ? '********' : '',
        senderName: 'IndSpoiler Alert Platform',
        senderEmail: process.env.SMTP_USER || 'noreply@spoileralert.com',
        isDefault: true
      });
    }

    return res.status(200).json({
      configured: true,
      supplierId: config.supplierId,
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      passMasked: '********',
      senderName: config.senderName,
      senderEmail: config.senderEmail,
      isVerified: config.isVerified,
      updatedAt: config.updatedAt
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/smtp
router.post('/smtp', async (req: Request, res: Response) => {
  try {
    const {
      supplierId = 'default',
      host,
      port = 587,
      secure = false,
      user,
      pass,
      senderName = 'IndSpoiler Alert Operations',
      senderEmail
    } = req.body;

    if (!host || !user || !pass || !senderEmail) {
      return res.status(400).json({ error: 'host, user, pass, and senderEmail are required.' });
    }

    const encryptedPass = encryptText(pass);

    const updated = await SupplierSmtpConfig.findOneAndUpdate(
      { supplierId },
      {
        supplierId,
        host,
        port,
        secure,
        user,
        encryptedPass,
        senderName,
        senderEmail,
        isVerified: false
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      config: {
        supplierId: updated.supplierId,
        host: updated.host,
        port: updated.port,
        secure: updated.secure,
        user: updated.user,
        senderName: updated.senderName,
        senderEmail: updated.senderEmail,
        isVerified: updated.isVerified
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/smtp/test
router.post('/smtp/test', async (req: Request, res: Response) => {
  try {
    const { supplierId = 'default' } = req.body;
    const config = await SupplierSmtpConfig.findOne({ supplierId });

    if (!config) {
      // No config stored — verify using env variables
      if (!process.env.SMTP_HOST) {
        return res.status(200).json({
          success: true,
          message: 'System default SMTP transport is active (no custom configuration saved yet).'
        });
      }

      // Attempt env-based verification
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        await transporter.verify();
        return res.status(200).json({
          success: true,
          message: 'System default SMTP connection verified successfully.'
        });
      } catch (verifyErr: any) {
        return res.status(200).json({
          success: false,
          error: `SMTP verification failed: ${verifyErr.message}`
        });
      }
    }

    // Decrypt stored password and attempt real Nodemailer verification
    try {
      const decryptedPass = decryptText(config.encryptedPass);
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: decryptedPass
        }
      });

      await transporter.verify();

      // Mark verified in DB
      config.isVerified = true;
      await config.save();

      return res.status(200).json({
        success: true,
        message: `SMTP connection to ${config.host}:${config.port} verified successfully. Transport is ready.`
      });
    } catch (verifyErr: any) {
      // Mark unverified if connection fails
      config.isVerified = false;
      await config.save();

      return res.status(200).json({
        success: false,
        error: `SMTP connection to ${config.host}:${config.port} failed: ${verifyErr.message}`
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/settings/send-email
router.post('/send-email', async (req: Request, res: Response) => {
  try {
    const { to, subject, body, supplierId = 'default' } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'Recipient (to), subject, and body are required.'
      });
    }

    const smtpConfig = await SupplierSmtpConfig.findOne({ supplierId });
    const fromEmail = smtpConfig?.senderEmail || process.env.SMTP_USER || 'noreply@spoileralert.com';
    const fromName = smtpConfig?.senderName || 'IndSpoiler Alert Platform';

    const result = await sendEmailHelper(to, subject, body, fromEmail, fromName);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send email.'
      });
    }

    const cleanTo = to.trim().toLowerCase();
    const cleanSubject = subject.trim();
    const normalizedSubj = cleanSubject.replace(/^(re|fwd):\s*/i, '');
    const subjRegex = new RegExp(`^(re|fwd:\\s*)*${normalizedSubj.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i');

    const validSupplierIds = new Set<string>([
      supplierId,
      'default',
      'supplier-unilever-123'
    ]);

    // Find existing active thread for this supplier, recipient & matching subject, or create a new thread
    let thread = await EmailThread.findOne({
      supplierId: { $in: Array.from(validSupplierIds) },
      buyerEmail: cleanTo,
      subject: { $regex: subjRegex }
    });

    if (!thread) {
      const threadId = `th-direct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      thread = new EmailThread({
        threadId,
        supplierId,
        buyerEmail: cleanTo,
        subject: cleanSubject,
        status: 'active',
        openCount: 0,
        messages: []
      });
    } else {
      thread.subject = cleanSubject;
    }

    const newMessage = {
      messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderType: 'supplier' as const,
      senderEmail: fromEmail,
      body: body.trim(),
      sentAt: new Date(),
      messageIdHeader: result.messageId
    };

    thread.messages.push(newMessage);
    thread.updatedAt = new Date();
    await thread.save();

    const dispatchId = `disp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await EmailDispatchLog.create({
      dispatchId,
      threadId: thread.threadId,
      supplierId,
      buyerEmail: cleanTo,
      openCount: 0,
      status: 'sent',
      dispatchedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      previewUrl: result.previewUrl,
      threadId: thread.threadId,
      message: 'Email sent successfully!'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred while sending email.'
    });
  }
});

export default router;


