import nodemailer from 'nodemailer';
import SupplierSmtpConfig from '../models/SupplierSmtpConfig';
import SupplierOAuthMailbox from '../models/SupplierOAuthMailbox';
import EmailThread from '../models/EmailThread';
import { decryptText } from '../utils/crypto';

let defaultCachedTransporter: any = null;

const getDefaultMailTransporter = async () => {
  if (defaultCachedTransporter) {
    return defaultCachedTransporter;
  }

  defaultCachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'eveline94@ethereal.email',
      pass: process.env.SMTP_PASS || 'Ft8PtZQQHCT9AMdE7A',
    },
  });
  return defaultCachedTransporter;
};

/**
 * Get a Nodemailer transporter for a given supplier.
 * Falls back to the platform default transporter if no config exists.
 */
export const getSupplierTransporter = async (supplierId: string = 'default') => {
  try {
    const config = await SupplierSmtpConfig.findOne({ supplierId, isVerified: true });
    if (config && config.encryptedPass) {
      const decryptedPass = decryptText(config.encryptedPass);
      return {
        transporter: nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: config.user,
            pass: decryptedPass
          }
        }),
        fromAddress: `"${config.senderName}" <${config.senderEmail}>`
      };
    }
  } catch (err) {
    console.warn('Could not load supplier SMTP config, falling back to default:', err);
  }

  return {
    transporter: await getDefaultMailTransporter(),
    fromAddress: `"IndSpoiler Alert Platform" <eveline94@ethereal.email>`
  };
};

/**
 * Send an email using the platform default transporter.
 * Accepts optional fromEmail/fromName overrides.
 */
export async function sendEmailHelper(
  to: string,
  subject: string,
  text: string,
  fromEmail?: string,
  fromName?: string
) {
  if (process.env.NODE_ENV === 'test' && !process.env.REAL_SMTP) {
    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
      previewUrl: 'https://ethereal.email/message/test'
    };
  }

  try {
    const transporter = await getDefaultMailTransporter();

    const fromIdentity = fromEmail
      ? `"${fromName || 'IndSpoiler Alert'}" <${fromEmail}>`
      : '"IndSpoiler Alert Platform" <eveline94@ethereal.email>';

    const info = await transporter.sendMail({
      from: fromIdentity,
      to,
      subject,
      text,
    });
    console.log('Email sent successfully:', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    return {
      messageId: info.messageId,
      previewUrl: previewUrl || undefined,
      success: true
    };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      messageId: undefined,
      previewUrl: undefined,
      error: error.message
    };
  }
}

import { compileTemplate, compileSubject } from './emailTemplateService';

export async function sendCampaignEmail(
  supplierId: string,
  to: string,
  subject: string,
  html: string,
  context?: Record<string, any>
) {
  const mailbox = await SupplierOAuthMailbox.findOne({ supplierId });
  
  if (!mailbox || mailbox.status !== 'connected') {
    throw new Error('OAuth Mailbox not connected for supplier');
  }

  if (process.env.NODE_ENV === 'test' && !process.env.REAL_OAUTH) {
    const finalSubject = compileSubject(subject, context || {});
    const finalHtml = compileTemplate(html, context || {});
    return { success: true, messageId: `test-campaign-msg-${Date.now()}`, compiledSubject: finalSubject, compiledHtml: finalHtml };
  }

  const finalSubject = compileSubject(subject, context || {});
  const finalHtml = compileTemplate(html, context || {});

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (clientId && clientSecret && mailbox.accessToken && mailbox.refreshToken) {
    const fromAddress = mailbox.userEmail || mailbox.accountId || 'eveline94@ethereal.email';
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: fromAddress,
        clientId,
        clientSecret,
        refreshToken: mailbox.refreshToken,
        accessToken: mailbox.accessToken,
      }
    });

    try {
      const info = await transporter.sendMail({
        from: `"${fromAddress}" <${fromAddress}>`,
        to,
        subject: finalSubject,
        html: finalHtml,
      });
      console.log('Campaign email sent via OAuth2 successfully:', info.messageId);
      return { success: true, messageId: info.messageId, compiledSubject: finalSubject, compiledHtml: finalHtml };
    } catch (err: any) {
      console.error('Failed to send campaign email via OAuth2:', err);
      if (err.code === 'EAUTH' || err.message?.includes('invalid_grant') || err.message?.includes('token')) {
        mailbox.status = 'expired';
        await mailbox.save();
      }
      throw err;
    }
  }

  throw new Error('OAuth Mailbox credentials or tokens missing for supplier');
}

export async function syncEmailToThread(params: {
  supplierId: string;
  buyerEmail: string;
  subject: string;
  body: string;
  senderType?: 'supplier' | 'buyer' | 'system';
  senderEmail?: string;
  listingId?: string;
  messageIdHeader?: string;
}) {
  try {
    const {
      supplierId = 'default',
      buyerEmail,
      subject,
      body,
      senderType = 'supplier',
      senderEmail = 'eveline94@ethereal.email',
      listingId,
      messageIdHeader
    } = params;

    const cleanTo = buyerEmail.trim().toLowerCase();
    const cleanSubject = subject ? subject.trim() : 'Direct Email Communication';
    const normalizedSubj = cleanSubject.replace(/^(re|fwd):\s*/i, '');
    const subjRegex = new RegExp(`^(re|fwd:\\s*)*${normalizedSubj.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i');

    const validSupplierIds = new Set<string>([
      supplierId,
      'default',
      'supplier-unilever-123'
    ]);

    const query: any = {
      supplierId: { $in: Array.from(validSupplierIds) },
      buyerEmail: cleanTo
    };
    if (listingId) {
      query.listingId = listingId;
    } else {
      query.subject = { $regex: subjRegex };
    }

    let thread = await EmailThread.findOne(query);

    if (!thread) {
      const threadId = `th-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      thread = new EmailThread({
        threadId,
        supplierId,
        buyerEmail: cleanTo,
        subject: cleanSubject,
        listingId,
        status: 'active',
        openCount: 0,
        messages: []
      });
    } else {
      if (subject) thread.subject = cleanSubject;
      if (listingId && !thread.listingId) thread.listingId = listingId;
    }

    thread.messages.push({
      messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderType,
      senderEmail,
      body: body.trim(),
      sentAt: new Date(),
      messageIdHeader
    });

    thread.updatedAt = new Date();
    await thread.save();
    return thread;
  } catch (err) {
    console.error('Error syncing email to thread:', err);
  }
}
