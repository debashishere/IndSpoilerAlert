import crypto from 'crypto';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import EmailTemplate from '../models/EmailTemplate';
import Buyer from '../models/Buyer';
import BuyerList from '../models/BuyerList';
import InventoryLot from '../models/InventoryLot';
import SupplierOAuthMailbox from '../models/SupplierOAuthMailbox';
import QuickBidToken from '../models/QuickBidToken';
import EmailDispatchLog from '../models/EmailDispatchLog';
import { sendCampaignEmail, sendEmailHelper, syncEmailToThread } from '../services/emailService';
import { compileTemplate, compileSubject } from '../services/emailTemplateService';


export const DEFAULT_PLATFORM_TEMPLATES = [
  {
    templateId: 'default',
    name: 'Standard Liquidation Offer Sheet',
    category: 'clearance',
    subject: 'Distressed Stock Clearance: {{lot_title}}',
    bodyHtml: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
      <h2 style="color: #4f46e5; margin-top: 0;">Clearance Opportunity | {{supplier_name}}</h2>
      <p>Hello <strong>{{buyer_name}}</strong>,</p>
      <p>We have immediate surplus inventory available for liquidation. Please review the itemized offer sheet below:</p>
      <div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
      <br/>
      <p style="text-align: center;">
        <a href="{{quick_bid_link}}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Bid Now
        </a>
      </p>
    </div>`,
    availableTokens: ['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name'],
    isDefault: true
  },
  {
    templateId: 'short-dated-auction',
    name: 'Urgent Short-Dated Surplus Auction Alert',
    category: 'auction',
    subject: '🔥 Urgent Auction Notice: {{lot_title}}',
    bodyHtml: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #fecaca; border-radius: 8px; background: #fff5f5;">
      <div style="background-color: #dc2626; color: #ffffff; padding: 8px 12px; border-radius: 6px; font-weight: bold; font-size: 14px; text-align: center; margin-bottom: 16px;">
        ⚡ LIMITED TIME LIQUIDATION AUCTION
      </div>
      <p>Hi <strong>{{buyer_name}}</strong>,</p>
      <p>The following short-dated inventory has been scheduled for priority liquidation. Bidding closes soon:</p>
      <div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
      <div style="text-align: center; margin-top: 24px;">
        <a href="{{quick_bid_link}}" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Place Auction Bid Now
        </a>
      </div>
    </div>`,
    availableTokens: ['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name'],
    isDefault: true
  },
  {
    templateId: 'direct-donation-notice',
    name: 'Food Bank Direct Donation Transfer Notice',
    category: 'award',
    subject: 'Community Donation Dispatch Notice: {{lot_title}}',
    bodyHtml: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #bbf7d0; border-radius: 8px; background: #f0fdf4;">
      <h2 style="color: #166534; margin-top: 0;">🌱 Community Surplus Donation | {{supplier_name}}</h2>
      <p>Dear <strong>{{buyer_name}}</strong> partner,</p>
      <p>We are pleased to allocate the following fresh surplus products for zero-cost donation transfer:</p>
      <div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
      <p style="font-size: 13px; color: #15803d; text-align: center; margin-top: 20px; font-weight: 600;">
        Thank you for helping divert quality food from landfill to families in need.
      </p>
    </div>`,
    availableTokens: ['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name'],
    isDefault: true
  }
];

export async function getEmailTemplates(req: Request, res: Response) {
  try {
    const { supplierId } = req.query;
    if (!supplierId) {
      return res.status(400).json({ success: false, message: 'supplierId required' });
    }

    const templates = await EmailTemplate.find({ supplierId }).sort({ updatedAt: -1 });
    
    // If no custom templates exist, return baseline default templates
    if (templates.length === 0) {
      return res.json({
        success: true,
        templates: DEFAULT_PLATFORM_TEMPLATES
      });
    }

    return res.json({ success: true, templates });
  } catch (err: any) {
    console.error('Error fetching email templates:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function createEmailTemplate(req: Request, res: Response) {
  try {
    const { supplierId, name, templateId, subject, bodyHtml, category, availableTokens } = req.body;
    if (!supplierId || !name || !subject || !bodyHtml) {
      return res.status(400).json({ success: false, message: 'supplierId, name, subject, and bodyHtml are required' });
    }

    const finalTemplateId = templateId || `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const template = await EmailTemplate.findOneAndUpdate(
      { supplierId, templateId: finalTemplateId },
      {
        supplierId,
        name,
        templateId: finalTemplateId,
        subject,
        bodyHtml,
        category: category || 'clearance',
        availableTokens: availableTokens || ['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name']
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({ success: true, template });
  } catch (err: any) {
    console.error('Error creating email template:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
}

export async function updateEmailTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, subject, bodyHtml, category, availableTokens } = req.body;

    const updateFields: any = { name, subject, bodyHtml, category };
    if (availableTokens) {
      updateFields.availableTokens = availableTokens;
    }

    const template = await EmailTemplate.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    return res.json({ success: true, template });
  } catch (err: any) {
    console.error('Error updating email template:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function deleteEmailTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await EmailTemplate.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Template deleted' });
  } catch (err: any) {
    console.error('Error deleting email template:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function compileEmailTemplate(req: Request, res: Response) {
  try {
    const { subject, bodyHtml, context } = req.body;
    const compiledSubject = compileSubject(subject || '', context || {});
    const compiledHtml = compileTemplate(bodyHtml || '', context || {});
    return res.json({
      success: true,
      compiledSubject,
      compiledHtml
    });
  } catch (err: any) {
    console.error('Error compiling email template:', err);
    return res.status(500).json({ success: false, message: err.message || 'Compilation error' });
  }
}


export async function generateBroadcastPreview(req: Request, res: Response) {

  try {
    const { supplierId, buyerSegment, buyerListId, explicitBuyerIds, lotIds, templateId, emailSubject, emailBodyHtml } = req.body;

    let matchedBuyers: any[] = [];
    if (Array.isArray(explicitBuyerIds) && explicitBuyerIds.length > 0) {
      matchedBuyers = await Buyer.find({ _id: { $in: explicitBuyerIds }, isActive: { $ne: false } });
    }
    const targetListRef = buyerListId || (buyerSegment && buyerSegment !== 'all_buyers' ? buyerSegment : null);
    if (matchedBuyers.length === 0 && targetListRef) {
      let buyerListDoc: any = null;
      if (mongoose.Types.ObjectId.isValid(targetListRef)) {
        buyerListDoc = await BuyerList.findById(targetListRef);
      }
      if (!buyerListDoc && supplierId) {
        buyerListDoc = await BuyerList.findOne({
          supplierId,
          $or: [{ type: targetListRef }, { name: new RegExp(`^${targetListRef}$`, 'i') }]
        });
      }
      if (!buyerListDoc) {
        buyerListDoc = await BuyerList.findOne({
          $or: [{ type: targetListRef }, { name: new RegExp(`^${targetListRef}$`, 'i') }]
        });
      }
      if (buyerListDoc && Array.isArray(buyerListDoc.buyerIds) && buyerListDoc.buyerIds.length > 0) {
        matchedBuyers = await Buyer.find({ _id: { $in: buyerListDoc.buyerIds }, isActive: { $ne: false } });
      }
    }
    if (matchedBuyers.length === 0 && (buyerSegment === 'all_buyers' || (!buyerSegment && !buyerListId && (!explicitBuyerIds || explicitBuyerIds.length === 0)))) {
      const query: any = { isActive: { $ne: false } };
      matchedBuyers = await Buyer.find(query).limit(50);
    }

    let selectedLots: any[] = [];
    if (Array.isArray(lotIds) && lotIds.length > 0) {
      selectedLots = await InventoryLot.find({ _id: { $in: lotIds } });
    }
    if (selectedLots.length === 0) {
      selectedLots = await InventoryLot.find({ status: 'active' }).limit(10);
    }
    const totalCases = selectedLots.reduce((sum, lot) => sum + (lot.availableQty || lot.quantityCases || 0), 0);

    const sampleBuyer = matchedBuyers[0] || { companyName: 'Sample Wholesale Buyer', email: 'buyer@example.com' };
    const context = {
      buyer_name: sampleBuyer.companyName,
      supplier_name: 'Unilever Supply Operations',
      inventory_table: selectedLots
    };

    const previewSubject = compileSubject(emailSubject || 'Distressed Stock Offer: {{buyer_name}}', context);
    const previewBodyHtml = compileTemplate(emailBodyHtml || '<div>Hello {{buyer_name}}, {{inventory_table}}</div>', context);

    return res.json({
      success: true,
      recipientCount: matchedBuyers.length,
      matchedBuyers,
      selectedLots,
      totalCases,
      previewSubject,
      previewBodyHtml
    });
  } catch (err: any) {
    console.error('Error generating broadcast preview:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}

export async function dispatchBroadcast(req: Request, res: Response) {
  try {
    const { supplierId, buyerSegment, buyerListId, explicitBuyerIds, lotIds, templateId, emailSubject, emailBodyHtml } = req.body;

    if (!supplierId) {
      return res.status(400).json({ success: false, message: 'supplierId is required' });
    }

    // Optional: Supplier OAuth Mailbox connection status check (if connected, OAuth will be used; otherwise SMTP)
    const mailbox = await SupplierOAuthMailbox.findOne({ supplierId, status: 'connected' });

    // 2. Resolve targeted buyers
    let matchedBuyers: any[] = [];
    if (Array.isArray(explicitBuyerIds) && explicitBuyerIds.length > 0) {
      matchedBuyers = await Buyer.find({ _id: { $in: explicitBuyerIds }, isActive: { $ne: false } });
    }
    const targetListRef = buyerListId || (buyerSegment && buyerSegment !== 'all_buyers' ? buyerSegment : null);
    if (matchedBuyers.length === 0 && targetListRef) {
      let buyerListDoc: any = null;
      if (mongoose.Types.ObjectId.isValid(targetListRef)) {
        buyerListDoc = await BuyerList.findById(targetListRef);
      }
      if (!buyerListDoc && supplierId) {
        buyerListDoc = await BuyerList.findOne({
          supplierId,
          $or: [{ type: targetListRef }, { name: new RegExp(`^${targetListRef}$`, 'i') }]
        });
      }
      if (!buyerListDoc) {
        buyerListDoc = await BuyerList.findOne({
          $or: [{ type: targetListRef }, { name: new RegExp(`^${targetListRef}$`, 'i') }]
        });
      }
      if (buyerListDoc && Array.isArray(buyerListDoc.buyerIds) && buyerListDoc.buyerIds.length > 0) {
        matchedBuyers = await Buyer.find({ _id: { $in: buyerListDoc.buyerIds }, isActive: { $ne: false } });
      }
    }
    if (matchedBuyers.length === 0 && (buyerSegment === 'all_buyers' || (!buyerSegment && !buyerListId && (!explicitBuyerIds || explicitBuyerIds.length === 0)))) {
      const query: any = { isActive: { $ne: false } };
      matchedBuyers = await Buyer.find(query).limit(100);
    }

    // 3. Resolve selected inventory lots
    let selectedLots: any[] = [];
    if (Array.isArray(lotIds) && lotIds.length > 0) {
      selectedLots = await InventoryLot.find({ _id: { $in: lotIds } });
    }

    const primaryLotId = selectedLots.length > 0 ? selectedLots[0]._id.toString() : 'adhoc-broadcast-lot';
    const dispatchLogs: any[] = [];
    const createdTokens: any[] = [];

    // 4. Dispatch email to each target buyer
    for (const buyer of matchedBuyers) {
      if (!buyer.email) continue;

      // Generate personalized QuickBidToken
      const tokenString = `token-${crypto.randomBytes(16).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

      const tokenDoc = await QuickBidToken.create({
        token: tokenString,
        buyerEmail: buyer.email,
        listingId: primaryLotId,
        defaultAmount: 0,
        expiresAt,
        isUsed: false
      });
      createdTokens.push(tokenDoc);

      const quickBidLink = `https://indspoileralert.com/bid?token=${tokenString}`;

      const context = {
        buyer_name: buyer.companyName || 'Valued Buyer',
        supplier_name: 'IndSpoiler Alert Operations',
        lot_title: selectedLots.length > 0 ? selectedLots[0].description : 'Surplus Inventory Lot',
        quick_bid_link: quickBidLink,
        inventory_table: selectedLots.length > 0 ? selectedLots : undefined
      };

      // Send campaign email with fallback to sendEmailHelper
      const finalSubj = compileSubject(emailSubject || 'Distressed Stock Clearance', context);
      try {
        await sendCampaignEmail(
          supplierId,
          buyer.email,
          emailSubject || 'Distressed Stock Clearance',
          emailBodyHtml || '<div>Hello {{buyer_name}}, {{inventory_table}}</div>',
          context
        );
      } catch (e) {
        await sendEmailHelper(
          buyer.email,
          finalSubj,
          `Hello ${context.buyer_name},\n\nCheck out our latest surplus inventory lot: ${context.lot_title}.\nQuick Bid Link: ${quickBidLink}`
        );
      }

      // Sync sent email to EmailThread so it renders under sent filter in Inbox
      await syncEmailToThread({
        supplierId,
        buyerEmail: buyer.email,
        subject: finalSubj,
        body: `Broadcast Clearance Offer Dispatched: ${context.lot_title}.\nQuick Bid Link: ${quickBidLink}`,
        senderType: 'supplier',
        listingId: primaryLotId
      });

      // Log dispatch
      const dispatchId = `disp-${crypto.randomBytes(12).toString('hex')}`;
      const dispatchLog = await EmailDispatchLog.create({
        dispatchId,
        supplierId,
        buyerEmail: buyer.email,
        listingId: primaryLotId,
        openCount: 0
      });
      dispatchLogs.push(dispatchLog);
    }

    return res.status(200).json({
      success: true,
      dispatchedCount: matchedBuyers.length,
      dispatchLogs,
      message: `Successfully dispatched email broadcast to ${matchedBuyers.length} buyers.`
    });
  } catch (err: any) {
    console.error('Error dispatching ad-hoc broadcast:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
}


