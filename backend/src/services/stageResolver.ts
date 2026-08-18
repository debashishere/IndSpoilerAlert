import mongoose from 'mongoose';
import Buyer from '../models/Buyer';
import BuyerList from '../models/BuyerList';

export interface ResolvedStageBuyers {
  buyerEmails: string[];
  evaluatedBuyerIds: (mongoose.Types.ObjectId | string)[];
  resolvedBuyerMap: Map<string, any>;
}

/**
 * Resolves the target buyers for a specific workflow stage.
 *
 * @param stage - The stage configuration object
 * @param automationContext - Automation context containing supplierId or other metadata
 * @returns {Promise<ResolvedStageBuyers>} Resolved buyer emails, IDs, and buyer lookup map
 */
export async function resolveStageBuyers(
  stage: any,
  automationContext?: { supplierId?: any; donationConfig?: any; [key: string]: any }
): Promise<ResolvedStageBuyers> {
  const buyerEmails: string[] = [];
  const evaluatedBuyerIds: (mongoose.Types.ObjectId | string)[] = [];
  const resolvedBuyerMap = new Map<string, any>();

  if (!stage) {
    return { buyerEmails, evaluatedBuyerIds, resolvedBuyerMap };
  }

  const addBuyer = (rawEmail: string, buyerDocOrObj?: any) => {
    if (!rawEmail) return;
    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!cleanEmail) return;
    if (!buyerEmails.includes(cleanEmail)) {
      buyerEmails.push(cleanEmail);
      if (buyerDocOrObj) {
        const bId = buyerDocOrObj._id || buyerDocOrObj.id;
        if (bId && !evaluatedBuyerIds.some(id => id.toString() === bId.toString())) {
          evaluatedBuyerIds.push(bId);
        }
        resolvedBuyerMap.set(cleanEmail, buyerDocOrObj);
      }
    }
  };

  // Determine stage type to enforce opt-in checks
  const stageType: string = (stage.type || stage.stageType || '').toLowerCase();
  const isBiddingStage = stageType.includes('bid') || stageType === 'bidding';
  const isSalesStage = stageType.includes('sale') || stageType === 'sales' || stageType === 'direct_sale' || stageType === 'liquidation';

  // Automatically resolve donating entities if stage is donation and donationConfig is provided
  if (stageType === 'donation' && Array.isArray(automationContext?.donationConfig?.donatingEntities)) {
    for (const ent of automationContext.donationConfig.donatingEntities) {
      if (ent && ent.email) {
        addBuyer(ent.email, {
          _id: ent.id || ent._id,
          companyName: ent.name || 'Donation Partner',
          name: ent.name || 'Donation Partner',
          email: ent.email.trim().toLowerCase()
        });
      }
    }
  }

  const mode = stage.buyerMode || (
    Array.isArray(stage.customBuyers) && stage.customBuyers.length > 0
      ? 'custom'
      : ((stage.buyerListId || stage.buyerSegment) ? 'list' : 'all')
  );

  if (mode === 'custom') {
    // 1. Process inline customBuyers
    if (Array.isArray(stage.customBuyers) && stage.customBuyers.length > 0) {
      for (const b of stage.customBuyers) {
        if (!b || !b.email) continue;
        addBuyer(b.email, {
          _id: b.id || b._id,
          companyName: b.name || b.companyName,
          name: b.name || b.companyName,
          email: b.email.trim().toLowerCase()
        });
      }
    }

    // 2. Process customBuyerIds against DB
    if (Array.isArray(stage.customBuyerIds) && stage.customBuyerIds.length > 0 && mongoose.connection.readyState === 1) {
      try {
        const customBuyers = await Buyer.find({
          _id: { $in: stage.customBuyerIds },
          isActive: { $ne: false }
        });
        for (const b of customBuyers) {
          if (isBiddingStage && b.optInBidding === false) continue;
          if (isSalesStage && b.optInSales === false) continue;
          if (b.email) {
            addBuyer(b.email, b);
          }
        }
      } catch (e) {}
    }
  } else if (mode === 'list' || (mode === 'segment' && (stage.buyerListId || (stage.buyerSegment && stage.buyerSegment !== 'all' && stage.buyerSegment !== 'all_buyers')))) {
    const listRef = stage.buyerListId || stage.buyerSegment;
    let buyerListDoc: any = null;

    if (mongoose.connection.readyState === 1 && (listRef || stage.buyerListName)) {
      try {
        if (listRef && mongoose.Types.ObjectId.isValid(listRef)) {
          buyerListDoc = await BuyerList.findById(listRef);
        }
        if (!buyerListDoc && automationContext?.supplierId) {
          const conds: any[] = [];
          if (listRef) conds.push({ type: listRef }, { name: new RegExp(`^${listRef}$`, 'i') });
          if (stage.buyerListName) conds.push({ name: new RegExp(`^${stage.buyerListName}$`, 'i') });
          buyerListDoc = await BuyerList.findOne({
            supplierId: automationContext.supplierId,
            $or: conds
          });
        }
        if (!buyerListDoc) {
          const conds: any[] = [];
          if (listRef) conds.push({ type: listRef }, { name: new RegExp(`^${listRef}$`, 'i') });
          if (stage.buyerListName) conds.push({ name: new RegExp(`^${stage.buyerListName}$`, 'i') });
          if (conds.length > 0) {
            buyerListDoc = await BuyerList.findOne({
              $or: conds
            });
          }
        }
      } catch (e) {}
    }

    if (buyerListDoc && Array.isArray(buyerListDoc.buyerIds) && buyerListDoc.buyerIds.length > 0 && mongoose.connection.readyState === 1) {
      try {
        const listBuyers = await Buyer.find({
          _id: { $in: buyerListDoc.buyerIds },
          isActive: { $ne: false }
        });
        for (const b of listBuyers) {
          if (isBiddingStage && b.optInBidding === false) continue;
          if (isSalesStage && b.optInSales === false) continue;
          if (b.email) {
            addBuyer(b.email, b);
          }
        }
      } catch (e) {}
    } else if (stage.buyerSegment && mongoose.connection.readyState === 1) {
      // Fallback to direct segment/category attribute match on Buyer model if not found as BuyerList
      try {
        const segmentBuyers = await Buyer.find({
          $or: [{ segment: stage.buyerSegment }, { buyerType: stage.buyerSegment }],
          isActive: { $ne: false }
        });
        for (const b of segmentBuyers) {
          if (isBiddingStage && b.optInBidding === false) continue;
          if (isSalesStage && b.optInSales === false) continue;
          if (b.email) {
            addBuyer(b.email, b);
          }
        }
      } catch (e) {}
    }
  } else if (mode === 'all' || mode === 'all_buyers' || stage.buyerMode === 'all') {
    if (mongoose.connection.readyState === 1) {
      try {
        const allDbBuyers = await Buyer.find({ isActive: { $ne: false } });
        for (const b of allDbBuyers) {
          if (isBiddingStage && b.optInBidding === false) continue;
          if (isSalesStage && b.optInSales === false) continue;
          if (b.email) {
            addBuyer(b.email, b);
          }
        }
      } catch (e) {}
    }
  }

  return {
    buyerEmails,
    evaluatedBuyerIds,
    resolvedBuyerMap
  };
}
