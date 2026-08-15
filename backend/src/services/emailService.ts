import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import SupplierSmtpConfig from '../models/SupplierSmtpConfig';
import SupplierOAuthMailbox from '../models/SupplierOAuthMailbox';
import EmailThread from '../models/EmailThread';
import { decryptText } from '../utils/crypto';
import { compileTemplate, compileSubject } from './emailTemplateService';

let defaultCachedTransporter: any = null;

const getDefaultMailTransporter = async () => {
  if (defaultCachedTransporter) {
    return defaultCachedTransporter;
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    defaultCachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return defaultCachedTransporter;
  }

  return null;
};

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  statusCode?: number;
  error?: string;
}

/**
 * Send an email via SendGrid API with optional EU Data Residency support.
 */
export async function sendSendGridEmail(params: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  fromEmail?: string;
  fromName?: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY environment variable is not configured');
  }

  sgMail.setApiKey(apiKey);
  if (process.env.SENDGRID_DATA_RESIDENCY?.toLowerCase() === 'eu') {
    if (typeof (sgMail as any).setDataResidency === 'function') {
      (sgMail as any).setDataResidency('eu');
    } else if (typeof (sgMail as any).setHost === 'function') {
      (sgMail as any).setHost('https://api.eu.sendgrid.com');
    }
  }

  const senderEmail = params.fromEmail || process.env.SENDGRID_FROM_EMAIL || 'debashishere007@gmail.com';
  const senderName = params.fromName || 'IndSpoiler Alert Platform';

  const msg = {
    to: params.to,
    from: {
      email: senderEmail,
      name: senderName,
    },
    subject: params.subject,
    text: params.text || '',
    html: params.html || params.text || '',
  };

  const [response] = await sgMail.send(msg);
  const messageId = (response.headers && response.headers['x-message-id']) || `sg-${Date.now()}`;
  return {
    success: true,
    messageId,
    statusCode: response.statusCode,
  };
}

/**
 * Get a Nodemailer transporter for a given supplier.
 * Falls back to the platform default transporter if no config exists.
 */
export const getSupplierTransporter = async (supplierId: string = 'default') => {
  try {
    const mailbox = await SupplierOAuthMailbox.findOne({ supplierId, status: 'connected' });
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (mailbox && clientId && clientSecret && mailbox.accessToken && mailbox.refreshToken) {
      const fromAddress = mailbox.userEmail || mailbox.accountId || 'supplier@company.com';
      return {
        transporter: nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: fromAddress,
            clientId,
            clientSecret,
            refreshToken: mailbox.refreshToken,
            accessToken: mailbox.accessToken,
          }
        }),
        fromAddress: `"${fromAddress}" <${fromAddress}>`
      };
    }

    let config = await SupplierSmtpConfig.findOne({
      supplierId,
      host: { $not: /unilever-test\.com/i }
    });
    
    if (!config) {
      config = await SupplierSmtpConfig.findOne({ isVerified: true, host: { $not: /unilever-test\.com/i } }) ||
               await SupplierSmtpConfig.findOne({ host: { $not: /unilever-test\.com/i } });
    }

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
        fromAddress: `"${config.senderName || 'IndSpoiler Alert Platform'}" <${config.senderEmail || config.user}>`
      };
    }
  } catch (err) {
    console.warn('Could not load supplier OAuth/SMTP config, falling back to default:', err);
  }

  const defaultTransporter = await getDefaultMailTransporter();
  const defaultEmail = process.env.SMTP_USER || 'noreply@spoileralert.com';
  return {
    transporter: defaultTransporter,
    fromAddress: `"IndSpoiler Alert Platform" <${defaultEmail}>`
  };
};

/**
 * Send an email using SendGrid API (if SENDGRID_API_KEY is configured) or platform Nodemailer fallback.
 * Accepts optional fromEmail/fromName overrides.
 */
export async function sendEmailHelper(
  to: string,
  subject: string,
  text: string,
  fromEmail?: string,
  fromName?: string,
  supplierId: string = 'default'
): Promise<SendEmailResult> {
  if (process.env.SENDGRID_API_KEY) {
    try {
      const sgRes = await sendSendGridEmail({
        to,
        subject,
        text,
        fromEmail,
        fromName,
      });
      console.log('Email sent successfully via SendGrid API:', sgRes.messageId);
      return sgRes;
    } catch (error: any) {
      console.error('SendGrid API send failed, trying fallback:', error.message);
      if (process.env.NODE_ENV === 'test' && !process.env.REAL_SMTP) {
        return {
          success: true,
          messageId: `mock-msg-${Date.now()}`
        };
      }
    }
  }

  if (process.env.NODE_ENV === 'test' && !process.env.REAL_SMTP) {
    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`
    };
  }

  try {
    const { transporter, fromAddress } = await getSupplierTransporter(supplierId);

    if (!transporter) {
      console.warn('[EmailService] No active Gmail/SMTP configuration found in database or environment. Save your Gmail SMTP settings under Settings -> SMTP in the web app to enable live email dispatch.');
      return {
        success: false,
        error: 'No active SMTP configuration found. Please save your Gmail SMTP credentials in Settings or set environment SMTP_USER.'
      };
    }

    const fromIdentity = fromEmail
      ? `"${fromName || 'IndSpoiler Alert'}" <${fromEmail}>`
      : fromAddress;

    let info: any;
    try {
      info = await transporter.sendMail({
        from: fromIdentity,
        to,
        subject,
        text,
      });
      console.log('Email sent successfully via Nodemailer:', info.messageId);
      return {
        messageId: info.messageId,
        success: true
      };
    } catch (sendErr: any) {
      console.warn('Initial mail dispatch encountered an error, checking for SMTP fallback:', sendErr.message || sendErr);
      
      const isAuthOrTimeout = sendErr.code === 'EAUTH' || 
                              sendErr.message?.includes('invalid_grant') || 
                              sendErr.message?.includes('XOAUTH2') ||
                              sendErr.message?.includes('ETIMEDOUT') ||
                              sendErr.message?.includes('ENETUNREACH');

      if (isAuthOrTimeout) {
        // Mark stale OAuth mailbox as expired
        try {
          await SupplierOAuthMailbox.updateMany({ supplierId }, { status: 'expired' });
        } catch (e) {}

        // Fallback to configured SMTP / default SMTP transporter
        let smtpConfig = await SupplierSmtpConfig.findOne({
          supplierId,
          host: { $not: /unilever-test\.com/i }
        });
        if (!smtpConfig) {
          smtpConfig = await SupplierSmtpConfig.findOne({ isVerified: true, host: { $not: /unilever-test\.com/i } }) ||
                       await SupplierSmtpConfig.findOne({ host: { $not: /unilever-test\.com/i } });
        }

        let fallbackTransporter: any = null;
        let fallbackFrom = fromIdentity;

        if (smtpConfig && smtpConfig.encryptedPass) {
          fallbackTransporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            auth: {
              user: smtpConfig.user,
              pass: decryptText(smtpConfig.encryptedPass)
            }
          });
          fallbackFrom = `"${smtpConfig.senderName || 'IndSpoiler Alert Platform'}" <${smtpConfig.senderEmail || smtpConfig.user}>`;
        } else {
          fallbackTransporter = await getDefaultMailTransporter();
          const defaultEmail = process.env.SMTP_USER || 'noreply@spoileralert.com';
          fallbackFrom = `"${fromName || 'IndSpoiler Alert'}" <${process.env.SMTP_USER || defaultEmail}>`;
        }

        if (fallbackTransporter) {
          console.log('[EmailService] Retrying mail dispatch via standard SMTP credentials...');
          const fallbackInfo = await fallbackTransporter.sendMail({
            from: fromEmail ? `"${fromName || 'IndSpoiler Alert'}" <${fromEmail}>` : fallbackFrom,
            to,
            subject,
            text,
          });
          console.log('Email sent successfully via Nodemailer SMTP fallback:', fallbackInfo.messageId);
          return {
            messageId: fallbackInfo.messageId,
            success: true
          };
        }
      }

      throw sendErr;
    }
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      messageId: undefined,
      error: error.message
    };
  }
}

export async function sendCampaignEmail(
  supplierId: string,
  to: string,
  subject: string,
  html: string,
  context?: Record<string, any>
) {
  const finalSubject = compileSubject(subject, context || {});
  const finalHtml = compileTemplate(html, context || {});

  // If SendGrid API Key is configured, use SendGrid API dispatch directly
  if (process.env.SENDGRID_API_KEY) {
    try {
      const sgRes = await sendSendGridEmail({
        to,
        subject: finalSubject,
        html: finalHtml,
      });
      console.log('Campaign email sent via SendGrid API successfully:', sgRes.messageId);
      return { success: true, messageId: sgRes.messageId, compiledSubject: finalSubject, compiledHtml: finalHtml };
    } catch (err: any) {
      console.error('Failed to send campaign email via SendGrid API:', err.message);
      // fallback to OAuth if available
    }
  }

  const mailbox = await SupplierOAuthMailbox.findOne({ supplierId, status: 'connected' });
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (mailbox && clientId && clientSecret && mailbox.accessToken && mailbox.refreshToken) {
    const fromAddress = mailbox.userEmail || mailbox.accountId || process.env.SMTP_USER || 'noreply@spoileralert.com';
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
      console.error('Failed to send campaign email via OAuth2, falling back to SMTP:', err);
      if (err.code === 'EAUTH' || err.message?.includes('invalid_grant') || err.message?.includes('token')) {
        mailbox.status = 'expired';
        await mailbox.save();
      }
    }
  }

  // Fallback to configured SMTP or environment default SMTP
  const { transporter: smtpTransporter, fromAddress: smtpFromAddress } = await getSupplierTransporter(supplierId);
  if (smtpTransporter) {
    const info = await smtpTransporter.sendMail({
      from: smtpFromAddress,
      to,
      subject: finalSubject,
      html: finalHtml,
      text: finalHtml.replace(/<[^>]*>?/gm, '')
    });
    console.log('Campaign email sent via SMTP successfully:', info.messageId);
    return { success: true, messageId: info.messageId, compiledSubject: finalSubject, compiledHtml: finalHtml };
  }

  if (process.env.NODE_ENV === 'test' && !process.env.REAL_OAUTH && !process.env.REAL_SMTP) {
    return { success: true, messageId: `test-campaign-msg-${Date.now()}`, compiledSubject: finalSubject, compiledHtml: finalHtml };
  }

  throw new Error('No valid email transport (OAuth or SMTP) found to send campaign email');
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
      senderEmail = process.env.SMTP_USER || 'noreply@spoileralert.com',
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

