import mongoose from 'mongoose';
import InventoryLot from '../models/InventoryLot';
import InventoryRisk from '../models/InventoryRisk';
import Opportunity from '../models/Opportunity';
import PricingRecommendation from '../models/PricingRecommendation';
import MarketplaceListing from '../models/MarketplaceListing';
import Buyer from '../models/Buyer';
import Offer from '../models/Offer';
import Award from '../models/Award';
import Shipment from '../models/Shipment';
import DistributionCenter from '../models/DistributionCenter';
import ProductMaster from '../models/ProductMaster';
import Activity from '../models/Activity';
import Donation from '../models/Donation';
import Disposal from '../models/Disposal';
import ComplianceDocument from '../models/ComplianceDocument';
import Sale from '../models/Sale';
import { uploadToS3 } from '../utils/aws';
import fs from 'fs';
import { sendEmailHelper } from './emailService';
import PDFDocument from 'pdfkit';
import path from 'path';
import os from 'os';



export async function getInventoryLots(filters: any = {}) {
  const query: any = {};
  if (filters.liquidationCycleId) {
    query.liquidationCycleId = filters.liquidationCycleId;
  }
  if (filters.supplierId) {
    query.supplierId = filters.supplierId;
  }

  const lots = await InventoryLot.find(query)
    .populate('supplierId')
    .populate('distributionCenterId')
    .populate('productId')
    .populate('complianceDocs');

  const results = [];
  for (const lot of lots) {
    const risk = await InventoryRisk.findOne({ lotId: lot._id });
    const opportunity = await Opportunity.findOne({ lotId: lot._id });
    const pricing = await PricingRecommendation.findOne({ lotId: lot._id });
    const listing = opportunity ? await MarketplaceListing.findOne({ opportunityId: opportunity._id }) : null;

    const lotObj = lot.toObject();
    results.push({
      ...lotObj,
      createdAt: lotObj.createdAt || new Date(),
      updatedAt: lotObj.updatedAt || lotObj.createdAt || new Date(),
      risk,
      opportunity,
      pricing,
      listing
    });
  }
  return results;
}

async function validateComplianceForActivation(lot: any) {
  if (lot.fdaRegulated) {
    const docs = await ComplianceDocument.find({ lotId: lot._id });
    const hasCOA = docs.some(d => d.docType === 'COA');
    const hasBatchRecord = docs.some(d => d.docType === 'BATCH_RECORD');
    if (!hasCOA || !hasBatchRecord) {
      throw new Error('FDA regulated lots require both a Certificate of Analysis (COA) and a Batch Record before activation.');
    }
  }
}

export async function assessRisk(lotId: string) {
  const lot = await InventoryLot.findById(lotId).populate('supplierId').populate('productId');
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  const today = new Date();
  const diffTime = lot.expirationDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  // Risk score: scale based on remaining shelf life proportion
  const riskScore = Math.max(0, Math.min(100, Math.round(100 * (1 - lot.remainingShelfLife))));
  
  // Velocity score: hypothetical sales rate
  const velocityScore = Math.max(10, Math.min(99, Math.round(100 - (daysRemaining * 2))));

  // Risk category
  let riskCategory: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (daysRemaining < 10) {
    riskCategory = 'critical';
  } else if (daysRemaining < 20) {
    riskCategory = 'high';
  } else if (daysRemaining < 30) {
    riskCategory = 'medium';
  }

  // Predicted waste: higher risk -> higher predicted waste
  const predictedWaste = Math.round(lot.quantityCases * (riskScore / 100));

  // Upsert InventoryRisk
  const risk = await InventoryRisk.findOneAndUpdate(
    { lotId: lot._id },
    {
      lotId: lot._id,
      riskScore,
      daysRemaining,
      velocityScore,
      riskCategory,
      predictedWaste,
      lastEvaluated: new Date()
    },
    { upsert: true, new: true }
  );

  // Upsert Opportunity
  const preferredDisp = (lot.supplierId as any)?.preferredDisposition || 'sell';
  const opportunity = await Opportunity.findOneAndUpdate(
    { lotId: lot._id },
    {
      lotId: lot._id,
      opportunityType: preferredDisp,
      priority: (riskCategory === 'critical' || riskCategory === 'high') ? 'high' : 'medium',
      recommendedAction: `Liquidate surplus inventory via closeout sale before expiration in ${daysRemaining} days.`,
      status: 'draft'
    },
    { upsert: true, new: true }
  );

  // Upsert MarketplaceListing
  const listing = await MarketplaceListing.findOneAndUpdate(
    { opportunityId: opportunity._id },
    {
      opportunityId: opportunity._id,
      sellerId: lot.supplierId,
      allowBidding: true,
      startingPrice: lot.costPerCase,
      minimumPrice: Math.round(lot.costPerCase * 0.5 * 100) / 100,
      status: 'active',
      expiresAt: lot.expirationDate
    },
    { upsert: true, new: true }
  );

  // Update lot status to active
  if (lot.status === 'pending') {
    await validateComplianceForActivation(lot);
    lot.status = 'active';
    await lot.save();
  }

  return {
    risk,
    opportunity,
    listing,
    lotStatus: lot.status
  };
}

export async function enableBidding(lotId: string) {
  const lot = await InventoryLot.findById(lotId);
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  const opportunity = await Opportunity.findOne({ lotId: lot._id });
  if (!opportunity) {
    throw new Error('Opportunity not found for this lot.');
  }

  let listing = await MarketplaceListing.findOne({ opportunityId: opportunity._id });
  if (!listing) {
    listing = new MarketplaceListing({
      opportunityId: opportunity._id,
      sellerId: lot.supplierId,
      allowBidding: true,
      startingPrice: lot.costPerCase,
      minimumPrice: Math.round(lot.costPerCase * 0.5 * 100) / 100,
      status: 'active',
      expiresAt: lot.expirationDate
    });
  } else {
    listing.allowBidding = true;
    listing.status = 'active';
  }
  await listing.save();

  if (lot.status === 'pending') {
    await validateComplianceForActivation(lot);
    lot.status = 'active';
    await lot.save();
  }


  // Helper to seed 3 simulated bids
  const seedSimulatedBids = async () => {
    try {
      if (mongoose.connection.readyState !== 1) return;
      const buyers = await Buyer.find({});
      if (buyers.length > 0) {
        const shuffled = buyers.sort(() => 0.5 - Math.random());
        const selectedBuyers = shuffled.slice(0, Math.min(3, shuffled.length));

        for (let i = 0; i < selectedBuyers.length; i++) {
          const buyer = selectedBuyers[i];
          const pct = 0.2 + Math.random() * 0.8;
          const quantity = Math.max(1, Math.round(lot.availableQty * pct));
          const pricePct = 0.6 + Math.random() * 0.35;
          const price = Math.round(lot.standardSellPrice * pricePct * 100) / 100;

          const offer = new Offer({
            listingId: listing?._id,
            buyerId: buyer._id,
            quantity,
            price,
            status: 'pending',
            messages: [{
              sender: 'buyer',
              content: `Placed a simulated bid of $${price.toFixed(2)}/cs for ${quantity} cases.`,
              timestamp: new Date(),
              proposedPrice: price,
              proposedQuantity: quantity
            }]
          });
          await offer.save();
        }
        console.log(`Successfully seeded 3 simulated bids for listing ${listing?._id}`);
      }
    } catch (err) {
      console.error('Error seeding simulated bids:', err);
    }
  };

  if (process.env.NODE_ENV === 'test') {
    await seedSimulatedBids();
  } else {
    setTimeout(seedSimulatedBids, 5000);
  }

  return listing;
}

export async function getBids(lotId: string) {
  const opportunity = await Opportunity.findOne({ lotId });
  if (!opportunity) {
    throw new Error('Opportunity not found for this lot.');
  }

  const listing = await MarketplaceListing.findOne({ opportunityId: opportunity._id });
  if (!listing) {
    throw new Error('Marketplace Listing not found for this lot.');
  }

  const bids = await Offer.find({ listingId: listing._id }).populate('buyerId');
  const bidsWithPO = [];
  for (const bid of bids) {
    const award = await Award.findOne({ offerId: bid._id });
    const bidObj = bid.toObject();
    if (award) {
      (bidObj as any).poPdfUrl = award.poPdfUrl;
    }
    bidsWithPO.push(bidObj);
  }
  return bidsWithPO;
}

async function generatePOPDFBuffer(award: any, buyer: any, lot: any, product: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    doc.fontSize(20).text('PURCHASE ORDER', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`PO Number: PO-${award._id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`Buyer: ${buyer.companyName}`);
    doc.text(`Email: ${buyer.email}`);
    doc.moveDown();
    doc.text(`Product SKU: ${product ? product.sku : 'N/A'}`);
    doc.text(`Description: ${product ? product.description : 'N/A'}`);
    doc.text(`Awarded Quantity: ${award.awardedQty} cases`);
    doc.text(`Price per Case: $${award.price.toFixed(2)}`);
    doc.text(`Total Amount: $${(award.awardedQty * award.price).toFixed(2)}`);
    doc.end();
  });
}

async function generateBOLPDFBuffer(shipment: any, buyer: any, lot: any, product: any, award: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    doc.fontSize(20).text('BILL OF LADING (BOL)', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`BOL Number: BOL-${shipment.bolNumber}`);
    doc.text(`Carrier: ${shipment.carrierName || 'TBD'}`);
    doc.text(`Shipper Address: ${shipment.pickupLocation}`);
    doc.text(`Consignee Address: ${shipment.deliveryLocation}`);
    doc.moveDown();
    doc.text(`Item Details:`);
    doc.text(`- SKU: ${product ? product.sku : 'N/A'}`);
    doc.text(`- Description: ${product ? product.description : 'N/A'}`);
    doc.text(`- Quantity: ${award.awardedQty} cases`);
    doc.text(`- Temperature Requirement: ${shipment.temperature || 'Ambient'}`);
    doc.end();
  });
}

export async function awardBid(
  lotId: string,
  bidId: string,
  emailSent?: string,
  emailSubject?: string,
  awardedQty?: number
) {
  const lot = await InventoryLot.findById(lotId);
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  const offer = await Offer.findById(bidId);
  if (!offer) {
    throw new Error('Bid (Offer) not found.');
  }

  const buyer = await Buyer.findById(offer.buyerId);
  if (!buyer) {
    throw new Error('Buyer not found.');
  }

  const opportunity = await Opportunity.findOne({ lotId: lot._id });
  if (!opportunity) {
    throw new Error('Opportunity not found.');
  }

  const listing = await MarketplaceListing.findOne({ opportunityId: opportunity._id });
  if (!listing) {
    throw new Error('Listing not found.');
  }

  const product = await ProductMaster.findById(lot.productId);

  // Enforce One-Shot Decision rule
  if (offer.status === 'partially_accepted' || offer.status === 'fully_accepted') {
    throw new Error('This bid has already been decided and cannot be awarded again.');
  }

  const finalAwardedQty = awardedQty !== undefined ? awardedQty : offer.quantity;
  if (finalAwardedQty > lot.availableQty) {
    throw new Error('Awarded quantity exceeds available lot quantity.');
  }
  if (finalAwardedQty > offer.quantity) {
    throw new Error('Awarded quantity cannot exceed bid quantity.');
  }

  // Update offer status
  if (finalAwardedQty === offer.quantity) {
    offer.status = 'fully_accepted';
  } else {
    offer.status = 'partially_accepted';
  }
  offer.awardedQty = finalAwardedQty;
  await offer.save();

  const award = new Award({
    listingId: listing._id,
    offerId: offer._id,
    buyerId: buyer._id,
    awardedQty: finalAwardedQty,
    price: offer.price,
    emailSent: emailSent || ''
  });
  await award.save();

  // Generate and upload PO PDF
  const poFilename = `po-${award._id}.pdf`;
  const tempPoPath = path.join(os.tmpdir(), poFilename);
  try {
    const poBuffer = await generatePOPDFBuffer(award, buyer, lot, product);
    fs.writeFileSync(tempPoPath, poBuffer);
    await uploadToS3(tempPoPath, 'ind-spoiler-alert-surplus', `purchase-orders/${poFilename}`);
    award.poPdfUrl = `https://ind-spoiler-alert-surplus.s3.amazonaws.com/purchase-orders/${poFilename}`;
    await award.save();
  } catch (err: any) {
    console.error('Failed to generate/upload PO PDF:', err.message || err);
  } finally {
    if (fs.existsSync(tempPoPath)) {
      fs.unlinkSync(tempPoPath);
    }
  }

  const dc = await DistributionCenter.findById(lot.distributionCenterId);
  const pickupLocation = dc ? dc.address : 'Supplier Distribution Center';

  const bolNumber = `BOL-${Math.floor(100000 + Math.random() * 900000)}`;

  const shipment = new Shipment({
    awardId: award._id,
    carrier: 'IndSpoiler Alert Logistics Partner',
    pickupLocation,
    deliveryLocation: `${buyer.companyName} Warehouse`,
    status: 'scheduled',
    temperature: dc?.coldStorage ? 'Refrigerated (35-40°F)' : 'Ambient',
    bolNumber,
    carrierName: 'IndSpoiler Alert Logistics Partner',
    carrierDotNumber: 'DOT-123456',
    pickupWindowStart: new Date(),
    pickupWindowEnd: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
  await shipment.save();

  // Generate and upload BOL PDF
  const bolFilename = `bol-${shipment._id}.pdf`;
  const tempBolPath = path.join(os.tmpdir(), bolFilename);
  try {
    const bolBuffer = await generateBOLPDFBuffer(shipment, buyer, lot, product, award);
    fs.writeFileSync(tempBolPath, bolBuffer);
    await uploadToS3(tempBolPath, 'ind-spoiler-alert-surplus', `bills-of-lading/${bolFilename}`);
    shipment.bolPdfUrl = `https://ind-spoiler-alert-surplus.s3.amazonaws.com/bills-of-lading/${bolFilename}`;
    await shipment.save();
  } catch (err: any) {
    console.error('Failed to generate/upload BOL PDF:', err.message || err);
  } finally {
    if (fs.existsSync(tempBolPath)) {
      fs.unlinkSync(tempBolPath);
    }
  }

  // Send real email via nodemailer
  const targetSubject = emailSubject || `Bid Accepted: ${finalAwardedQty} cases of ${lot.lotNumber}`;
  const emailResult = await sendEmailHelper(buyer.email, targetSubject, emailSent || '');

  // Log this email as an activity in our database
  const activity = new Activity({
    lotId: lot._id,
    type: 'email',
    subject: targetSubject,
    content: emailSent || 'Bid awarded automatically.',
    recipient: buyer.email,
    sender: 'eveline94@ethereal.email',
    metadata: {
      messageId: emailResult.messageId,
      previewUrl: emailResult.previewUrl,
      success: emailResult.success,
      error: emailResult.error,
      awardId: award._id,
      buyerCompanyName: buyer.companyName
    },
    timestamp: new Date()
  });
  await activity.save();

  // Determine quantity remaining
  const remainingQty = Math.max(0, lot.availableQty - finalAwardedQty);
  lot.availableQty = remainingQty;
  lot.latestSalesDate = new Date();
  listing.availableQuantity = remainingQty;

  if (remainingQty <= 0) {
    lot.status = 'sold';
    listing.status = 'closed';
    opportunity.status = 'completed';

    // Reject all other pending bids
    await Offer.updateMany(
      { listingId: listing._id, _id: { $ne: offer._id }, status: 'pending' },
      { status: 'rejected' }
    );
  } else {
    // Listing remains active and published, reject only other bids that ask for more than the remaining quantity
    lot.status = 'active';
    listing.status = 'published';

    await Offer.updateMany(
      { listingId: listing._id, status: 'pending', quantity: { $gt: remainingQty } },
      { status: 'rejected' }
    );
  }

  await lot.save();
  await listing.save();
  await opportunity.save();

  return {
    offer,
    award,
    shipment,
    lotStatus: lot.status,
    availableQty: lot.availableQty,
    emailSentResult: emailResult
  };
}

export async function awardBidByOfferId(
  offerId: string,
  emailSent?: string,
  emailSubject?: string,
  awardedQty?: number
) {
  const offer = await Offer.findById(offerId);
  if (!offer) {
    throw new Error('Bid (Offer) not found.');
  }
  const listing = await MarketplaceListing.findById(offer.listingId);
  let lotId: string | null = null;
  if (listing && listing.lotId) {
    lotId = listing.lotId.toString();
  } else if (listing && listing.opportunityId) {
    const opp = await Opportunity.findById(listing.opportunityId);
    if (opp) lotId = opp.lotId.toString();
  }
  if (!lotId) {
    throw new Error('Associated inventory lot not found for this offer.');
  }
  return awardBid(lotId, offerId, emailSent, emailSubject, awardedQty);
}

export async function donateInventory(lotId: string, targetEntity?: { name?: string; email?: string }) {
  const lot = await InventoryLot.findById(lotId).populate('productId');
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  const availableQty = lot.availableQty;
  if (availableQty <= 0) {
    throw new Error('No available quantity left in this lot.');
  }

  const foodBanks = [
    'Feeding America Midwest',
    'Greater Chicago Food Depository',
    'Second Harvest Food Bank',
    'St. Mary Food Pantry'
  ];
  const foodBankName = targetEntity?.name || foodBanks[Math.floor(Math.random() * foodBanks.length)];
  const entityEmail = targetEntity?.email || 'donations@feedingamerica.org';

  const taxBenefit = Math.round(availableQty * lot.costPerCase * 0.5 * 100) / 100;
  const landfillAvoided = parseFloat((availableQty * 0.0075).toFixed(3));
  const co2Saved = parseFloat((landfillAvoided * 2.5).toFixed(3));
  
  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 2);

  const donation = new Donation({
    lotId: lot._id,
    foodBankName,
    entityEmail,
    quantity: availableQty,
    taxBenefit,
    landfillAvoided,
    co2Saved,
    pickupDate
  });
  await donation.save();

  lot.status = 'donated';
  lot.availableQty = 0;
  await lot.save();

  // Send automated email alert to the Donating Entity
  try {
    const subject = `[Action Required] Food Rescue Donation Transfer Advice - Lot #${lot.lotNumber || lot._id} (${availableQty} Cases)`;
    const textBody = `
Dear ${foodBankName} Operations Team,

We are pleased to inform you that a surplus inventory donation transfer has been allocated to your organization from our distribution platform.

Donation Transfer Manifest:
--------------------------------------------------
- Product SKU: ${(lot.productId as any)?.sku || 'N/A'}
- Description: ${(lot.productId as any)?.description || 'Surplus Food Inventory'}
- Category: ${(lot.productId as any)?.category || 'General'}
- Quantity Allocated: ${availableQty} Cases
- Estimated Tax Benefit: $${taxBenefit.toFixed(2)}
- Landfill Avoided: ${landfillAvoided} Tons
- CO2 Emissions Avoided: ${co2Saved} Tons
- Scheduled Dock Pickup Date: ${pickupDate.toLocaleDateString()}

Dock & Pickup Instructions:
Please arrange logistics pickup within 48 hours of scheduled pickup date.
Reply to this notification or contact our logistics desk to confirm dock door appointment and receive 501(c)(3) tax attestation documentation.

Sincerely,
IndSpoiler Alert Surplus Recovery Division
`;

    await sendEmailHelper(entityEmail, subject, textBody);
  } catch (err: any) {
    console.warn(`Failed to dispatch donation alert email to ${entityEmail}:`, err.message || err);
  }

  const opportunity = await Opportunity.findOne({ lotId: lot._id });
  if (opportunity) {
    opportunity.status = 'completed';
    opportunity.opportunityType = 'donate';
    await opportunity.save();
  }

  if (opportunity) {
    await MarketplaceListing.findOneAndUpdate(
      { opportunityId: opportunity._id },
      { status: 'closed' }
    );
  }

  const logs = [
    `Food bank notified: ${foodBankName}`,
    'Dispatcher matched: Express Freight Logistics',
    'Freight route locked: Chicago Hub to Food Bank Depot',
    `Pickup scheduled: ${pickupDate.toLocaleDateString()}`
  ];

  return {
    lotStatus: lot.status,
    donation,
    logs
  };
}

export async function recycleInventory(lotId: string) {
  const lot = await InventoryLot.findById(lotId);
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  const availableQty = lot.availableQty;
  if (availableQty <= 0) {
    throw new Error('No available quantity left in this lot.');
  }

  const facilities = [
    'GreenEarth Bio-Digestion Center',
    'Midwest Organic Composting Inc.',
    'EcoFeed animal feed processing',
    'PureEnergy Bio-Fuel Facility'
  ];
  const facility = facilities[Math.floor(Math.random() * facilities.length)];

  const landfillFee = Math.round(availableQty * 1.50 * 100) / 100;
  const recyclingFee = Math.round(availableQty * 0.30 * 100) / 100;
  
  const completedDate = new Date();
  completedDate.setDate(completedDate.getDate() + 1);

  const disposal = new Disposal({
    lotId: lot._id,
    method: 'recycle',
    facility,
    landfillFee,
    recyclingFee,
    completedDate
  });
  await disposal.save();

  lot.status = 'recycled';
  lot.availableQty = 0;
  await lot.save();

  const opportunity = await Opportunity.findOne({ lotId: lot._id });
  if (opportunity) {
    opportunity.status = 'completed';
    opportunity.opportunityType = 'recycle';
    await opportunity.save();
  }

  if (opportunity) {
    await MarketplaceListing.findOneAndUpdate(
      { opportunityId: opportunity._id },
      { status: 'closed' }
    );
  }

  const logs = [
    `Recycler matched: ${facility}`,
    'Transport route assigned: Driver #402',
    'Compost/Bio-fuel bin reserved',
    `Disposal scheduled: ${completedDate.toLocaleDateString()}`
  ];

  return {
    lotStatus: lot.status,
    disposal,
    logs
  };
}

export async function getActivities(lotId: string) {
  return Activity.find({ lotId }).sort({ timestamp: -1 });
}

export async function createActivity(lotId: string, activityData: any) {
  const { type, subject, content, recipient, sender, metadata } = activityData;
  const activity = new Activity({
    lotId,
    type,
    subject,
    content,
    recipient,
    sender,
    metadata: metadata || {},
    timestamp: new Date()
  });
  await activity.save();
  return activity;
}

export async function uploadComplianceDoc(lotId: string, docType: string, filePath: string, originalName: string) {
  const lot = await InventoryLot.findById(lotId);
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  const s3Bucket = 'ind-spoiler-alert-surplus';
  const s3Key = `compliance/${lotId}-${docType}-${Date.now()}-${originalName}`;

  // 1. Upload to S3
  await uploadToS3(filePath, s3Bucket, s3Key);

  const s3Url = `https://${s3Bucket}.s3.amazonaws.com/${s3Key}`;

  // 2. Create ComplianceDocument
  const doc = new ComplianceDocument({
    lotId: lot._id,
    docType,
    s3Url,
    verified: true
  });
  await doc.save();

  // 3. Add to complianceDocs
  if (!lot.complianceDocs) {
    lot.complianceDocs = [];
  }
  lot.complianceDocs.push(doc._id as any);
  await lot.save();

  // Clean up local temp file
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return doc;
}

export async function confirmAppointment(
  shipmentId: string,
  pickupWindowStart: Date | string,
  pickupWindowEnd: Date | string,
  carrierName?: string,
  carrierDotNumber?: string
) {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw new Error('Shipment not found.');
  }

  if (shipment.status !== 'scheduled') {
    throw new Error(`Cannot confirm appointment. Shipment must be scheduled. Current status: ${shipment.status}`);
  }

  shipment.pickupWindowStart = new Date(pickupWindowStart);
  shipment.pickupWindowEnd = new Date(pickupWindowEnd);
  if (carrierName) shipment.carrierName = carrierName;
  if (carrierDotNumber) shipment.carrierDotNumber = carrierDotNumber;

  shipment.status = 'confirmed';
  await shipment.save();

  return shipment;
}

export async function updateShipmentStatus(
  shipmentId: string,
  newStatus: 'scheduled' | 'confirmed' | 'in_transit' | 'delivered'
) {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw new Error('Shipment not found.');
  }

  const validTransitions: Record<string, string> = {
    'scheduled': 'confirmed',
    'confirmed': 'in_transit',
    'in_transit': 'delivered'
  };

  if (validTransitions[shipment.status] !== newStatus) {
    throw new Error(`Invalid status transition from ${shipment.status} to ${newStatus}`);
  }

  shipment.status = newStatus;
  await shipment.save();
  return shipment;
}

export async function addShipmentTemperatureLog(shipmentId: string, temperature: number) {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw new Error('Shipment not found.');
  }

  if (!shipment.temperatureLogs) {
    shipment.temperatureLogs = [];
  }
  shipment.temperatureLogs.push({ timestamp: new Date(), temperature });
  await shipment.save();
  return shipment;
}

export async function updateLot(lotId: string, updates: { fdaRegulated?: boolean; temperatureMin?: number; temperatureMax?: number; comment?: string }) {
  const lot = await InventoryLot.findById(lotId);
  if (!lot) {
    throw new Error('Inventory Lot not found.');
  }

  if (updates.fdaRegulated !== undefined) {
    lot.fdaRegulated = updates.fdaRegulated;
  }
  if (updates.temperatureMin !== undefined) {
    lot.temperatureMin = updates.temperatureMin;
  }
  if (updates.temperatureMax !== undefined) {
    lot.temperatureMax = updates.temperatureMax;
  }
  if (updates.comment !== undefined) {
    lot.comment = updates.comment;
  }

  await lot.save();
  return await InventoryLot.findById(lotId)
    .populate('supplierId')
    .populate('distributionCenterId')
    .populate('productId')
    .populate('complianceDocs');
}

export async function getShipments() {
  return await Shipment.find()
    .populate({
      path: 'awardId',
      populate: [
        { path: 'buyerId' },
        { 
          path: 'listingId',
          populate: {
            path: 'opportunityId',
            populate: {
              path: 'lotId',
              populate: { path: 'productId' }
            }
          }
        }
      ]
    })
    .sort({ createdAt: -1 });
}

export async function getShipmentById(shipmentId: string) {
  return await Shipment.findById(shipmentId)
    .populate({
      path: 'awardId',
      populate: [
        { path: 'buyerId' },
        { 
          path: 'listingId',
          populate: {
            path: 'opportunityId',
            populate: {
              path: 'lotId',
              populate: { path: 'productId' }
            }
          }
        }
      ]
    });
}

export async function getInventoryFacets(filter: any = {}): Promise<Array<{ attribute: string; values: Array<{ value: any; count: number }> }>> {
  const matchStage: any = { status: 'active', ...filter };

  const facets = await InventoryLot.aggregate([
    { $match: matchStage },
    {
      $project: {
        attrsArray: { $objectToArray: { $ifNull: ["$attributes", {}] } }
      }
    },
    { $unwind: "$attrsArray" },
    {
      $project: {
        key: "$attrsArray.k",
        values: {
          $cond: {
            if: { $isArray: "$attrsArray.v" },
            then: "$attrsArray.v",
            else: ["$attrsArray.v"]
          }
        }
      }
    },
    { $unwind: "$values" },
    {
      $match: {
        values: { $ne: null }
      }
    },
    {
      $group: {
        _id: { attribute: "$key", value: "$values" },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: "$_id.attribute",
        values: {
          $push: {
            value: "$_id.value",
            count: "$count"
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        attribute: "$_id",
        values: 1
      }
    },
    { $sort: { attribute: 1 } }
  ]);

  return facets;
}

export async function getSales() {
  return await Sale.find()
    .populate('supplierId')
    .populate('buyerId')
    .populate('lotId')
    .sort({ saleDate: -1 });
}





