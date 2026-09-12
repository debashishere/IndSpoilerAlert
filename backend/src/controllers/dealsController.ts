import { Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Award from '../models/Award';
import Activity from '../models/Activity';
import Shipment from '../models/Shipment';
import Offer from '../models/Offer';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { areBuyerEmailsMatching } from '../utils/emailValidation';

function verifyDealAuthorization(req: AuthenticatedRequest, award: any): boolean {
  // 1. Cryptographic Guest Token Access
  const suppliedToken = (req.query.token as string) || (req.query.dealToken as string);
  let isAuthorized = false;

  if (suppliedToken) {
    const hmacSecret = process.env.QUICK_BID_SECRET || 'spoileralert-quick-bid-secret';
    const parts = suppliedToken.split('.');
    if (parts.length === 2) {
      const [rawToken, sig] = parts;
      const offerIdStr = award.offerId ? (award.offerId._id || award.offerId).toString() : '';
      const expectedSig = crypto.createHmac('sha256', hmacSecret).update(`${rawToken}:${offerIdStr}`).digest('hex');
      if (sig === expectedSig || suppliedToken === award.dealToken) {
        isAuthorized = true;
      }
    } else if (suppliedToken === award.dealToken) {
      isAuthorized = true;
    }
  }

  // 2. Authenticated Session Access
  if (!isAuthorized && req.user) {
    // Supplier admin preview access
    if (req.user.supplierProfile) {
      isAuthorized = true;
    } else {
      // Buyer session access
      const buyerObj: any = award.buyerId;
      const buyerEmail = buyerObj?.email;
      const buyerIdStr = buyerObj?._id ? buyerObj._id.toString() : buyerObj?.toString();

      if (
        (buyerIdStr && buyerIdStr === req.user.uid) ||
        (buyerEmail && areBuyerEmailsMatching(req.user.email, buyerEmail))
      ) {
        isAuthorized = true;
      }
    }
  }

  return isAuthorized;
}

export const getDealById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return res.status(404).json({ error: 'Invalid or missing deal ID.' });
    }

    const award = await Award.findById(dealId)
      .populate({
        path: 'lotId',
        populate: [
          { path: 'productId' },
          { path: 'distributionCenterId' }
        ]
      })
      .populate('buyerId')
      .populate('offerId');

    if (!award) {
      return res.status(404).json({ error: 'Deal not found.' });
    }

    if (!verifyDealAuthorization(req, award)) {
      return res.status(403).json({
        error: 'Unauthorized deal access. A valid HMAC dealToken or matching authorized session is required.'
      });
    }

    const lot: any = award.lotId;
    const product: any = lot?.productId;
    const buyer: any = award.buyerId;

    return res.status(200).json({
      deal: {
        _id: award._id.toString(),
        awardedQty: award.awardedQty,
        price: award.price,
        totalAmount: award.totalAmount,
        pickupLocation: award.pickupLocation,
        pickupHours: award.pickupHours,
        paymentStatus: award.paymentStatus,
        signatureStatus: award.signatureStatus,
        executionAudit: award.executionAudit,
        approvedDate: award.approvedDate,
        product: {
          name: product?.name || product?.description || 'Surplus Inventory Lot',
          sku: product?.sku || 'N/A',
          brand: product?.brand,
          category: product?.category,
          imageUrl: product?.imageUrl
        },
        lot: lot ? {
          _id: lot._id.toString(),
          lotNumber: lot.lotNumber,
          quantityCases: lot.quantityCases,
          availableQty: lot.availableQty
        } : null,
        buyer: buyer ? {
          _id: buyer._id.toString(),
          companyName: buyer.companyName,
          email: buyer.email
        } : null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const confirmPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return res.status(404).json({ error: 'Invalid or missing deal ID.' });
    }

    const award = await Award.findById(dealId)
      .populate('buyerId')
      .populate('offerId');

    if (!award) {
      return res.status(404).json({ error: 'Deal not found.' });
    }

    if (!verifyDealAuthorization(req, award)) {
      return res.status(403).json({
        error: 'Unauthorized deal access. A valid HMAC dealToken or matching authorized session is required.'
      });
    }

    // Persist paymentStatus = 'confirmed'
    award.paymentStatus = 'confirmed';
    await award.save();

    // Append Payment Received event in the Lot CRM timeline if not already logged
    if (award.lotId) {
      const lotId = (award.lotId as any)._id || award.lotId;
      const existingActivity = await Activity.findOne({
        lotId,
        'metadata.dealId': award._id.toString(),
        'metadata.status': 'confirmed'
      });

      if (!existingActivity) {
        const buyerObj: any = award.buyerId;
        const buyerName = buyerObj?.companyName || 'Buyer';
        const formattedAmount = (award.totalAmount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

        await Activity.create({
          lotId,
          type: 'Payment',
          subject: `Payment Received — Deal #${award._id.toString().slice(-6).toUpperCase()} (${formattedAmount})`,
          content: `Payment of ${formattedAmount} received and confirmed for buyer ${buyerName}. Deal settlement cleared to unlock agreement execution.`,
          recipient: buyerObj?.email || 'Buyer',
          sender: 'Settlement Portal',
          timestamp: new Date(),
          metadata: {
            dealId: award._id.toString(),
            offerId: award.offerId ? ((award.offerId as any)._id || award.offerId).toString() : undefined,
            totalAmount: award.totalAmount,
            status: 'confirmed'
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully.',
      deal: {
        _id: award._id.toString(),
        awardedQty: award.awardedQty,
        price: award.price,
        totalAmount: award.totalAmount,
        pickupLocation: award.pickupLocation,
        pickupHours: award.pickupHours,
        paymentStatus: award.paymentStatus,
        signatureStatus: award.signatureStatus,
        approvedDate: award.approvedDate
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const signDeal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return res.status(404).json({ error: 'Invalid or missing deal ID.' });
    }

    const award = await Award.findById(dealId)
      .populate('buyerId')
      .populate('offerId');

    if (!award) {
      return res.status(404).json({ error: 'Deal not found.' });
    }

    if (!verifyDealAuthorization(req, award)) {
      return res.status(403).json({
        error: 'Unauthorized deal access. A valid HMAC dealToken or matching authorized session is required.'
      });
    }

    // Enforce Payment Gate
    if (award.paymentStatus !== 'confirmed') {
      return res.status(400).json({
        error: 'Payment must be confirmed before executing the agreement.'
      });
    }

    // Validate mandatory legal execution attributes
    const { signerName, signerTitle, authorized, signatureData, signatureType } = req.body;

    if (!signerName || typeof signerName !== 'string' || !signerName.trim()) {
      return res.status(400).json({ error: 'signerName is required.' });
    }
    if (!signerTitle || typeof signerTitle !== 'string' || !signerTitle.trim()) {
      return res.status(400).json({ error: 'signerTitle is required.' });
    }
    if (authorized !== true) {
      return res.status(400).json({ error: 'Authorization confirmation is required.' });
    }
    if (!signatureData || typeof signatureData !== 'string' || !signatureData.trim()) {
      return res.status(400).json({ error: 'signatureData is required.' });
    }

    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    const userAgent = (req.headers['user-agent'] as string) || '';
    const signedAt = new Date();

    const verificationHash = crypto
      .createHash('sha256')
      .update(`${award._id}:${signerName.trim()}:${signerTitle.trim()}:${signedAt.toISOString()}:${signatureData}`)
      .digest('hex');

    // 1. Update Award with execution audit and poPdfUrl
    award.signatureStatus = 'executed';
    award.poPdfUrl = `/api/deals/${award._id}/pdf`;
    award.executionAudit = {
      signerName: signerName.trim(),
      signerTitle: signerTitle.trim(),
      signatureType: signatureType === 'type' ? 'type' : 'draw',
      signatureData: signatureData.trim(),
      signedAt,
      ipAddress: String(ipAddress || ''),
      userAgent: String(userAgent || ''),
      verificationHash
    };
    await award.save();

    // 2. Downstream Fulfillment Provisioning: Auto-instantiate linked Shipment
    let shipment = await Shipment.findOne({ awardId: award._id });
    if (!shipment) {
      const buyerObj: any = award.buyerId;
      shipment = await Shipment.create({
        awardId: award._id,
        carrier: 'Buyer Arranged Freight (FOB Origin)',
        pickupLocation: award.pickupLocation || 'Warehouse DC Location',
        deliveryLocation: buyerObj?.companyName || 'Buyer Receiving Dock',
        status: 'scheduled',
        createdAt: new Date()
      });
    }

    // 3. Log Agreement Executed event to Lot CRM timeline
    if (award.lotId) {
      const lotId = (award.lotId as any)._id || award.lotId;
      const existingActivity = await Activity.findOne({
        lotId,
        'metadata.dealId': award._id.toString(),
        'metadata.status': 'executed'
      });

      if (!existingActivity) {
        const buyerObj: any = award.buyerId;
        const buyerName = buyerObj?.companyName || 'Buyer';

        await Activity.create({
          lotId,
          type: 'Agreement',
          subject: `Agreement Executed — Deal #${award._id.toString().slice(-6).toUpperCase()}`,
          content: `B2B Surplus Asset Purchase Agreement legally executed by ${signerName.trim()} (${signerTitle.trim()}) for buyer ${buyerName}. Downstream fulfillment shipment scheduled with carrier "Buyer Arranged Freight (FOB Origin)".`,
          recipient: buyerObj?.email || 'Buyer',
          sender: 'Settlement Portal',
          timestamp: new Date(),
          metadata: {
            dealId: award._id.toString(),
            offerId: award.offerId ? ((award.offerId as any)._id || award.offerId).toString() : undefined,
            shipmentId: shipment?._id ? shipment._id.toString() : undefined,
            status: 'executed',
            signerName: signerName.trim(),
            signerTitle: signerTitle.trim()
          }
        });
      }
    }

    // 4. Append confirmation message to Offer.messages
    if (award.offerId) {
      const offerId = (award.offerId as any)._id || award.offerId;
      const offer = await Offer.findById(offerId);
      if (offer) {
        offer.messages.push({
          sender: 'system',
          content: `Agreement Executed: B2B Surplus Asset Purchase Agreement digitally signed by ${signerName.trim()} (${signerTitle.trim()}). Downstream freight scheduled (FOB Origin).`,
          timestamp: new Date()
        });
        await offer.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Agreement executed successfully.',
      deal: {
        _id: award._id.toString(),
        awardedQty: award.awardedQty,
        price: award.price,
        totalAmount: award.totalAmount,
        pickupLocation: award.pickupLocation,
        pickupHours: award.pickupHours,
        paymentStatus: award.paymentStatus,
        signatureStatus: award.signatureStatus,
        executionAudit: award.executionAudit,
        approvedDate: award.approvedDate
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const streamDealPdf = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return res.status(404).json({ error: 'Deal not found.' });
    }

    const award = await Award.findById(dealId)
      .populate({
        path: 'lotId',
        populate: [
          { path: 'productId' },
          { path: 'distributionCenterId' }
        ]
      })
      .populate('buyerId')
      .populate('offerId');

    if (!award) {
      return res.status(404).json({ error: 'Deal not found.' });
    }

    if (!verifyDealAuthorization(req, award)) {
      return res.status(403).json({
        error: 'Unauthorized deal access. A valid HMAC dealToken or matching authorized session is required.'
      });
    }

    // Persist contract URL to Award.poPdfUrl if not already populated
    const contractUrl = `/api/deals/${award._id}/pdf`;
    if (award.poPdfUrl !== contractUrl) {
      award.poPdfUrl = contractUrl;
      await award.save();
    }

    const lot: any = award.lotId;
    const product: any = lot?.productId;
    const buyer: any = award.buyerId;
    const productName = product?.name || product?.description || 'Surplus Inventory Lot';
    const sku = product?.sku || 'N/A';
    const buyerName = buyer?.companyName || 'Authorized Commercial Buyer';
    const buyerEmail = buyer?.email || '';
    const formattedUnitPrice = `$${award.price.toFixed(2)}`;
    const formattedTotal = `$${(award.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const pickupLocation = award.pickupLocation || 'Warehouse DC Location';
    const pickupHours = award.pickupHours || 'Standard Operating Hours (Mon-Fri)';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="agreement-deal-${award._id}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: 'LETTER', compress: false });
    doc.pipe(res);

    // 1. Header Banner
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('B2B Surplus Asset Purchase Agreement', { align: 'center' });
    doc.moveDown(0.3);
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#4b5563')
      .text(
        `Deal Reference: #${award._id.toString()}   |   Status: ${(award.signatureStatus || 'pending').toUpperCase()}   |   Date: ${award.approvedDate ? new Date(award.approvedDate).toLocaleDateString() : new Date().toLocaleDateString()}`,
        { align: 'center' }
      );
    doc.moveDown(0.8);

    // Divider
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(40, doc.y)
      .lineTo(572, doc.y)
      .stroke();
    doc.moveDown(0.8);

    // 2. Commercial Terms & Itemized Lot Breakdown
    doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text('1. Commercial Terms & Itemized Inventory Lot');
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica').fillColor('#374151');
    doc.text(`Buyer Organization: ${buyerName} ${buyerEmail ? `(${buyerEmail})` : ''}`);
    doc.text(`Product Description: ${productName}`);
    doc.text(`Master SKU: ${sku}`);
    if (lot?.lotNumber) {
      doc.text(`Inventory Lot #: ${lot.lotNumber}`);
    }
    doc.text(`Awarded Quantity: ${award.awardedQty} Cases`);
    doc.text(`Unit Purchase Price: ${formattedUnitPrice} / case`);
    doc.text(`Total Settlement Value: ${formattedTotal} (Net 0, FOB Origin)`);
    doc.moveDown(0.8);

    // 3. Distribution Center Logistics & Dock Receiving
    doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text('2. Warehouse Distribution Center Logistics');
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica').fillColor('#374151');
    doc.text(`Depot Dock Location: ${pickupLocation}`);
    doc.text(`Warehouse Receiving Hours: ${pickupHours}`);
    doc.text('Freight Carrier Provision: Buyer Arranged Freight (FOB Origin)');
    doc.text('Logistics Instructions: Carrier must present authorized Deal ID reference upon check-in at distribution dock.');
    doc.moveDown(0.8);

    // 4. Legal Provisions & Salvage Clauses
    doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text('3. Legal Terms & Non-Returnable Salvage Clauses');
    doc.moveDown(0.3);

    doc.fontSize(8.5).font('Helvetica').fillColor('#4b5563');
    doc.text(
      `Commercial Title Transfer: This B2B Surplus Asset Purchase Agreement constitutes a binding contract between Seller and Buyer (${buyerName}). Title and risk of loss pass to Buyer FOB Origin upon dock pickup receipt at Seller's designated distribution center.`,
      { align: 'justify' }
    );
    doc.moveDown(0.4);
    doc.text(
      'As-Is, Where-Is & Non-Returnable Salvage Terms: All inventory covered under this agreement is sold strictly on an "As-Is, Where-Is" basis. Buyer acknowledges and agrees that goods transferred represent surplus, closeout, or non-returnable salvage inventory. Seller makes no representations or warranties, express or implied, regarding merchantability, shelf life, or fitness for a particular purpose. All sales are final; no post-delivery returns, adjustments, or chargebacks shall be permitted.',
      { align: 'justify' }
    );
    doc.moveDown(0.8);

    // 5. Digital Signature & Audit Certificate Block
    doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text('4. Digital Signature & Tamper-Evident Audit Certificate');
    doc.moveDown(0.3);

    if (award.executionAudit) {
      const audit = award.executionAudit;
      doc.fontSize(9).font('Helvetica').fillColor('#374151');
      doc.text(`Authorized Signer: ${audit.signerName}`);
      doc.text(`Corporate Title: ${audit.signerTitle}`);
      doc.text(`Executed Timestamp: ${audit.signedAt ? new Date(audit.signedAt).toISOString() : new Date().toISOString()}`);
      doc.text(`Signer IP Address: ${audit.ipAddress || '127.0.0.1'}`);
      doc.text(`Verification Hash: ${audit.verificationHash || 'N/A'}`);
      doc.moveDown(0.5);

      if (audit.signatureType === 'draw' && audit.signatureData?.startsWith('data:image')) {
        try {
          const base64Data = audit.signatureData.replace(/^data:image\/\w+;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          doc.text('Signature Mark:');
          doc.image(imgBuffer, { width: 120, height: 40 });
        } catch {
          doc.font('Helvetica-Oblique').text(`[Digital Signature Image: ${audit.signerName}]`);
        }
      } else {
        doc.font('Helvetica-Oblique').fontSize(12).text(`Signed: ${audit.signerName}`);
      }
    } else {
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#6b7280').text('Pending Legal Signature Execution.');
    }

    doc.end();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

