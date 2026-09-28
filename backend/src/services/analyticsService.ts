import mongoose from 'mongoose';
import InventoryLot from '../models/InventoryLot';
import Award from '../models/Award';
import Donation from '../models/Donation';
import Disposal from '../models/Disposal';
import Sale from '../models/Sale';
import Supplier from '../models/Supplier';
import ProductMaster from '../models/ProductMaster';
import { getRedisClient } from '../utils/redis';

export async function getAnalyticsSummary() {
  // Issue with dynamic multiple Supplier Data
  const cacheKey = 'analytics:summary';

  // 1. Try to read from Redis
  try {
    const redis = await getRedisClient();
    if (redis && redis.isOpen) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (err: any) {
    console.warn('Redis read error, falling back to MongoDB:', err.message || err);
  }

  // 2. Run dynamic MongoDB aggregation queries
  const lotStats = await InventoryLot.aggregate([
    {
      $group: {
        _id: "$status",
        totalCases: { $sum: "$quantityCases" },
        totalCOGS: { $sum: { $multiply: ["$quantityCases", "$costPerCase"] } }
      }
    }
  ]);

  const categoryStats = await InventoryLot.aggregate([
    {
      $lookup: {
        from: "productmasters",
        localField: "productId",
        foreignField: "_id",
        as: "product"
      }
    },
    {
      $unwind: "$product"
    },
    {
      $group: {
        _id: "$product.category",
        volume: { $sum: "$quantityCases" }
      }
    },
    {
      $project: {
        category: "$_id",
        volume: 1,
        _id: 0
      }
    }
  ]);

  const awardStats = await Award.aggregate([
    {
      $group: {
        _id: null,
        totalRecovered: { $sum: { $multiply: ["$awardedQty", "$price"] } }
      }
    }
  ]);

  const salesStats = await Sale.aggregate([
    {
      $group: {
        _id: null,
        totalSalesRevenue: { $sum: "$totalValue" },
        totalSalesCases: { $sum: "$quantityCases" }
      }
    }
  ]);

  const donationStats = await Donation.aggregate([
    {
      $group: {
        _id: null,
        totalDonationTons: { $sum: "$landfillAvoided" },
        totalTaxBenefit: { $sum: "$taxBenefit" },
        totalCO2Saved: { $sum: "$co2Saved" }
      }
    }
  ]);

  const disposalStats = await Disposal.aggregate([
    {
      $group: {
        _id: "$method",
        totalLandfillFee: { $sum: "$landfillFee" },
        totalRecyclingFee: { $sum: "$recyclingFee" }
      }
    }
  ]);

  // 3. Compute metrics in JS
  let totalCOGS = 0;
  let totalSoldCOGS = 0;
  let totalCases = 0;
  let soldCases = 0;
  let donatedCases = 0;
  let recycledCases = 0;
  let expiredCases = 0;

  lotStats.forEach(stat => {
    totalCOGS += stat.totalCOGS;
    totalCases += stat.totalCases;
    if (stat._id === 'sold') {
      totalSoldCOGS += stat.totalCOGS;
      soldCases = stat.totalCases;
    } else if (stat._id === 'donated') {
      donatedCases = stat.totalCases;
    } else if (stat._id === 'recycled') {
      recycledCases = stat.totalCases;
    } else if (stat._id === 'expired') {
      expiredCases = stat.totalCases;
    }
  });

  const saleRevenue = salesStats[0]?.totalSalesRevenue || 0;
  const awardRevenue = awardStats[0]?.totalRecovered || 0;
  const totalRecovered = saleRevenue > 0 ? saleRevenue : awardRevenue;

  if (salesStats[0]?.totalSalesCases && salesStats[0].totalSalesCases > soldCases) {
    soldCases = salesStats[0].totalSalesCases;
  }

  const dynamicDonationTons = donationStats[0]?.totalDonationTons || 0;
  const dynamicTaxBenefit = donationStats[0]?.totalTaxBenefit || 0;
  const dynamicCO2SavedDonation = donationStats[0]?.totalCO2Saved || 0;
  const dynamicLandfillSavingsDonation = dynamicDonationTons * 100;

  let dynamicRecyclingTons = 0;
  let dynamicLandfillSavingsDisposal = 0;
  let dynamicCO2SavedDisposal = 0;

  disposalStats.forEach(stat => {
    if (stat._id === 'recycle') {
      const tons = (stat.totalLandfillFee / 1.50) * 0.0075;
      dynamicRecyclingTons = tons;
      dynamicLandfillSavingsDisposal = stat.totalLandfillFee - stat.totalRecyclingFee;
      dynamicCO2SavedDisposal = tons * 1.8;
    }
  });

  const cogsRecoveryRate = totalSoldCOGS > 0 ? (totalRecovered / totalSoldCOGS) * 100 : 0;
  const totalDivertedTons = dynamicDonationTons + dynamicRecyclingTons;
  const dynamicLandfillSavings = dynamicLandfillSavingsDonation + dynamicLandfillSavingsDisposal;
  const dynamicCO2Saved = dynamicCO2SavedDonation + dynamicCO2SavedDisposal;

  // 4. Compute dynamic 6-month historical trends from real BE transactions
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    monthlyDonations,
    monthlyDisposals,
    monthlySales,
    monthlyAwards,
    monthlySoldLots
  ] = await Promise.all([
    Donation.aggregate([
      {
        $addFields: {
          eventDate: { $ifNull: ["$pickupDate", "$createdAt"] }
        }
      },
      {
        $match: {
          eventDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$eventDate" },
            month: { $month: "$eventDate" }
          },
          donatedTons: { $sum: "$landfillAvoided" }
        }
      }
    ]),
    Disposal.aggregate([
      {
        $match: {
          method: "recycle"
        }
      },
      {
        $addFields: {
          eventDate: { $ifNull: ["$completedDate", "$createdAt"] }
        }
      },
      {
        $match: {
          eventDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$eventDate" },
            month: { $month: "$eventDate" }
          },
          totalLandfillFee: { $sum: "$landfillFee" }
        }
      }
    ]),
    Sale.aggregate([
      {
        $addFields: {
          eventDate: { $ifNull: ["$saleDate", "$createdAt"] }
        }
      },
      {
        $match: {
          eventDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $lookup: {
          from: "inventorylots",
          localField: "lotId",
          foreignField: "_id",
          as: "lot"
        }
      },
      {
        $unwind: { path: "$lot", preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: {
            year: { $year: "$eventDate" },
            month: { $month: "$eventDate" }
          },
          revenue: { $sum: { $ifNull: ["$revenue", "$totalValue"] } },
          cogs: {
            $sum: {
              $multiply: [
                "$quantityCases",
                { $ifNull: ["$lot.costPerCase", "$pricePerCase"] }
              ]
            }
          }
        }
      }
    ]),
    Award.aggregate([
      {
        $addFields: {
          eventDate: { $ifNull: ["$approvedDate", "$createdAt"] }
        }
      },
      {
        $match: {
          eventDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $lookup: {
          from: "inventorylots",
          localField: "lotId",
          foreignField: "_id",
          as: "lot"
        }
      },
      {
        $unwind: { path: "$lot", preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: {
            year: { $year: "$eventDate" },
            month: { $month: "$eventDate" }
          },
          revenue: {
            $sum: {
              $cond: [
                { $gt: ["$totalAmount", 0] },
                "$totalAmount",
                { $multiply: ["$awardedQty", "$price"] }
              ]
            }
          },
          cogs: {
            $sum: {
              $multiply: [
                "$awardedQty",
                { $ifNull: ["$lot.costPerCase", "$price"] }
              ]
            }
          }
        }
      }
    ]),
    InventoryLot.aggregate([
      {
        $match: { status: "sold" }
      },
      {
        $addFields: {
          eventDate: { $ifNull: ["$latestSalesDate", "$updatedAt", "$createdAt"] }
        }
      },
      {
        $match: {
          eventDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$eventDate" },
            month: { $month: "$eventDate" }
          },
          soldCOGS: { $sum: { $multiply: ["$quantityCases", "$costPerCase"] } }
        }
      }
    ])
  ]);

  const donationMap = new Map<string, number>();
  monthlyDonations.forEach(d => {
    donationMap.set(`${d._id.year}-${d._id.month}`, d.donatedTons);
  });

  const recyclingMap = new Map<string, number>();
  monthlyDisposals.forEach(d => {
    const tons = (d.totalLandfillFee / 1.50) * 0.0075;
    recyclingMap.set(`${d._id.year}-${d._id.month}`, tons);
  });

  const salesMap = new Map<string, { revenue: number; cogs: number }>();
  monthlySales.forEach(s => {
    salesMap.set(`${s._id.year}-${s._id.month}`, { revenue: s.revenue, cogs: s.cogs });
  });

  const awardsMap = new Map<string, { revenue: number; cogs: number }>();
  monthlyAwards.forEach(a => {
    awardsMap.set(`${a._id.year}-${a._id.month}`, { revenue: a.revenue, cogs: a.cogs });
  });

  const soldLotsMap = new Map<string, number>();
  monthlySoldLots.forEach(l => {
    soldLotsMap.set(`${l._id.year}-${l._id.month}`, l.soldCOGS);
  });

  const historicalTrends = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const month = d.toLocaleString('en-US', { month: 'short' });

    const donTons = donationMap.get(key) || 0;
    const recTons = recyclingMap.get(key) || 0;
    const divertedTons = Math.round((donTons + recTons) * 10) / 10;

    const saleData = salesMap.get(key);
    const awardData = awardsMap.get(key);

    const monthRevenue = (saleData && saleData.revenue > 0)
      ? saleData.revenue
      : (awardData?.revenue || 0);

    let monthCOGS = (saleData && saleData.cogs > 0)
      ? saleData.cogs
      : (soldLotsMap.get(key) || awardData?.cogs || 0);

    const recoveryRate = monthCOGS > 0 ? Math.round((monthRevenue / monthCOGS) * 100) : 0;

    historicalTrends.push({
      month,
      recoveryRate,
      divertedTons,
      donatedTons: Math.round(donTons * 10) / 10,
      recycledTons: Math.round(recTons * 10) / 10
    });
  }

  let categoryBreakdown = categoryStats;
  if (categoryBreakdown.length === 0) {
    categoryBreakdown = [
      { category: 'Dry Goods', volume: 1200 },
      { category: 'Dairy', volume: 850 },
      { category: 'Produce', volume: 600 },
      { category: 'Beverages', volume: 450 }
    ];
  }

  const result = {
    summary: {
      cogsRecoveryRate: Math.round(cogsRecoveryRate * 10) / 10,
      totalCOGS: Math.round(totalCOGS * 100) / 100,
      totalRecoveredValue: Math.round(totalRecovered * 100) / 100,
      totalSoldCOGS: Math.round(totalSoldCOGS * 100) / 100,
      wasteDivertedTons: Math.round(totalDivertedTons * 100) / 100,
      landfillFeesSaved: Math.round((dynamicLandfillSavings + dynamicTaxBenefit) * 100) / 100,
      co2SavedTons: Math.round(dynamicCO2Saved * 100) / 100,
      caseStats: {
        total: totalCases,
        sold: soldCases,
        donated: donatedCases,
        recycled: recycledCases,
        expired: expiredCases,
        leftoverRate: totalCases > 0 ? Math.round((expiredCases / totalCases) * 100) : 0
      }
    },
    trends: historicalTrends,
    categoryBreakdown
  };

  // 4. Save to Redis cache
  try {
    const redis = await getRedisClient();
    if (redis && redis.isOpen) {
      await redis.set(cacheKey, JSON.stringify(result), {
        EX: 300 // 5 minutes TTL
      });
    }
  } catch (err: any) {
    console.warn('Redis write error:', err.message || err);
  }

  return result;
}

export interface SalesAnalyticsParams {
  supplierId?: string;
  timeframe?: string;
  category?: string;
  warehouse?: string;
  user?: any;
}

export async function getSalesAnalytics(params: SalesAnalyticsParams = {}) {
  // 1. Resolve Supplier Scope
  let targetSupplierId = params.supplierId;
  if (!targetSupplierId && params.user?.email) {
    const userEmail = params.user.email;
    const supplier = await Supplier.findOne({
      name: { $regex: new RegExp(`^${userEmail.split('@')[0]}`, 'i') }
    });
    if (supplier) {
      targetSupplierId = supplier._id.toString();
    }
  }

  const timeframe = params.timeframe || '30d';
  const category = params.category || 'all';
  const warehouse = params.warehouse || 'all';

  const cacheKey = `analytics:sales:${targetSupplierId || 'all'}:${timeframe}:${category}:${warehouse}`;

  // 2. Try Redis Cache
  try {
    const redis = await getRedisClient();
    if (redis && redis.isOpen) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (err: any) {
    console.warn('Redis read error for sales analytics, falling back to MongoDB:', err.message || err);
  }

  // 3. Compute Time Boundaries for Current and Prior Windows
  const now = new Date();
  let currentStart: Date | null = null;
  let priorStart: Date | null = null;
  let priorEnd: Date | null = null;

  if (timeframe === '7d') {
    currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    priorStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    priorEnd = currentStart;
  } else if (timeframe === '90d') {
    currentStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    priorStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    priorEnd = currentStart;
  } else if (timeframe === 'ytd') {
    currentStart = new Date(now.getFullYear(), 0, 1);
    const duration = now.getTime() - currentStart.getTime();
    priorStart = new Date(currentStart.getTime() - duration);
    priorEnd = currentStart;
  } else {
    currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    priorStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    priorEnd = currentStart;
  }

  // 4. Construct Base Filters
  const baseFilter: any = {};
  if (targetSupplierId && mongoose.Types.ObjectId.isValid(targetSupplierId)) {
    baseFilter.supplierId = new mongoose.Types.ObjectId(targetSupplierId);
  }
  if (warehouse && warehouse !== 'all') {
    baseFilter.warehouse = warehouse;
  }
  if (category && category !== 'all') {
    const products = await ProductMaster.find({
      category,
      ...(baseFilter.supplierId ? { supplierId: baseFilter.supplierId } : {})
    }).select('sku');
    const skus = products.map(p => p.sku);
    baseFilter.sku = { $in: skus };
  }

  const currentFilter: any = { ...baseFilter };
  if (currentStart) {
    currentFilter.saleDate = { $gte: currentStart, $lte: now };
  }

  const priorFilter: any = { ...baseFilter };
  if (priorStart && priorEnd) {
    priorFilter.saleDate = { $gte: priorStart, $lt: priorEnd };
  }

  const supplierMatch = baseFilter.supplierId ? { supplierId: baseFilter.supplierId } : {};

  // 5. Aggregate Current & Prior Data + Dynamic Filter Options + Trajectory Sales + Category Recovery + Channel Share
  const [
    currentStats,
    priorStats,
    rawWarehouses,
    rawCategories,
    currentSales,
    rawCategoryRecovery,
    rawChannelDistribution,
    rawRecentCloseouts
  ] = await Promise.all([
    Sale.aggregate([
      { $match: currentFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ["$revenue", "$totalValue"] } },
          totalVolume: { $sum: "$quantityCases" },
          reconciledCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $ifNull: ["$lotId", false] },
                    { $eq: ["$status", "reconciled"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalCount: { $sum: 1 }
        }
      }
    ]),
    priorStart ? Sale.aggregate([
      { $match: priorFilter },
      {
        $group: {
          _id: null,
          priorRevenue: { $sum: { $ifNull: ["$revenue", "$totalValue"] } }
        }
      }
    ]) : Promise.resolve([]),
    Sale.distinct('warehouse', supplierMatch),
    ProductMaster.distinct('category', supplierMatch),
    Sale.aggregate([
      { $match: currentFilter },
      {
        $project: {
          saleDate: { $ifNull: ["$saleDate", "$createdAt"] },
          revenue: { $ifNull: ["$revenue", "$totalValue"] },
          volume: { $ifNull: ["$quantityCases", 0] }
        }
      }
    ]),
    Sale.aggregate([
      { $match: currentFilter },
      {
        $lookup: {
          from: "inventorylots",
          localField: "lotId",
          foreignField: "_id",
          as: "lotFromId"
        }
      },
      {
        $lookup: {
          from: "inventorylots",
          localField: "lotNumber",
          foreignField: "lotNumber",
          as: "lotFromNumber"
        }
      },
      {
        $addFields: {
          lot: {
            $ifNull: [
              { $arrayElemAt: ["$lotFromId", 0] },
              { $arrayElemAt: ["$lotFromNumber", 0] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: "productmasters",
          localField: "lot.productId",
          foreignField: "_id",
          as: "productFromLot"
        }
      },
      {
        $lookup: {
          from: "productmasters",
          localField: "sku",
          foreignField: "sku",
          as: "productFromSku"
        }
      },
      {
        $addFields: {
          product: {
            $ifNull: [
              { $arrayElemAt: ["$productFromLot", 0] },
              { $arrayElemAt: ["$productFromSku", 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: { $ifNull: ["$product.category", "Uncategorized"] },
          revenue: { $sum: { $ifNull: ["$revenue", "$totalValue"] } },
          cogs: {
            $sum: {
              $multiply: [
                { $ifNull: ["$quantityCases", 0] },
                { $ifNull: ["$lot.costPerCase", "$pricePerCase", 0] }
              ]
            }
          }
        }
      },
      {
        $project: {
          category: "$_id",
          revenue: { $round: ["$revenue", 2] },
          cogs: { $round: ["$cogs", 2] },
          recoveryPct: {
            $cond: [
              { $gt: ["$cogs", 0] },
              { $round: [{ $multiply: [{ $divide: ["$revenue", "$cogs"] }, 100] }, 1] },
              0
            ]
          },
          _id: 0
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]),
    Sale.aggregate([
      { $match: currentFilter },
      {
        $lookup: {
          from: "buyers",
          localField: "buyerId",
          foreignField: "_id",
          as: "buyer"
        }
      },
      {
        $unwind: { path: "$buyer", preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: {
            $ifNull: [
              "$buyer.segment",
              { $ifNull: ["$buyer.buyerType", "Unassigned"] }
            ]
          },
          revenue: { $sum: { $ifNull: ["$revenue", "$totalValue"] } }
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]),
    Sale.aggregate([
      { $match: currentFilter },
      { $sort: { saleDate: -1, createdAt: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "inventorylots",
          localField: "lotId",
          foreignField: "_id",
          as: "lotFromId"
        }
      },
      {
        $lookup: {
          from: "inventorylots",
          localField: "lotNumber",
          foreignField: "lotNumber",
          as: "lotFromNumber"
        }
      },
      {
        $addFields: {
          lot: {
            $ifNull: [
              { $arrayElemAt: ["$lotFromId", 0] },
              { $arrayElemAt: ["$lotFromNumber", 0] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: "buyers",
          localField: "buyerId",
          foreignField: "_id",
          as: "buyerDoc"
        }
      },
      {
        $unwind: { path: "$buyerDoc", preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: "productmasters",
          localField: "lot.productId",
          foreignField: "_id",
          as: "productFromLot"
        }
      },
      {
        $lookup: {
          from: "productmasters",
          localField: "sku",
          foreignField: "sku",
          as: "productFromSku"
        }
      },
      {
        $addFields: {
          productDoc: {
            $ifNull: [
              { $arrayElemAt: ["$productFromLot", 0] },
              { $arrayElemAt: ["$productFromSku", 0] }
            ]
          }
        }
      },
      {
        $project: {
          id: "$_id",
          sku: "$sku",
          product: {
            $ifNull: [
              "$productDoc.description",
              { $ifNull: ["$description", "$sku"] }
            ]
          },
          buyer: {
            $ifNull: [
              "$buyerDoc.companyName",
              { $ifNull: ["$buyerEmail", "Direct Closeout"] }
            ]
          },
          price: {
            $round: [
              {
                $cond: [
                  { $gt: [{ $ifNull: ["$pricePerCase", 0] }, 0] },
                  "$pricePerCase",
                  {
                    $cond: [
                      { $gt: [{ $ifNull: ["$quantityCases", 0] }, 0] },
                      { $divide: [{ $ifNull: ["$revenue", "$totalValue"] }, "$quantityCases"] },
                      0
                    ]
                  }
                ]
              },
              2
            ]
          },
          cost: {
            $ifNull: ["$lot.costPerCase", 0]
          },
          lotExpirationDate: "$lot.expirationDate",
          saleDate: { $ifNull: ["$saleDate", "$createdAt"] }
        }
      }
    ])
  ]);

  const totalRevenue = Math.round((currentStats[0]?.totalRevenue || 0) * 100) / 100;
  const totalVolume = currentStats[0]?.totalVolume || 0;
  const totalCount = currentStats[0]?.totalCount || 0;
  const reconciledCount = currentStats[0]?.reconciledCount || 0;
  const avgPrice = totalVolume > 0 ? Math.round((totalRevenue / totalVolume) * 100) / 100 : 0;

  const priorRevenue = priorStats[0]?.priorRevenue || 0;
  let revenueGrowthPct = 0;
  if (priorRevenue > 0) {
    revenueGrowthPct = Math.round(((totalRevenue - priorRevenue) / priorRevenue) * 1000) / 10;
  } else if (totalRevenue > 0 && priorRevenue === 0) {
    revenueGrowthPct = 100;
  } else {
    revenueGrowthPct = 0;
  }

  const warehouses = (rawWarehouses || []).filter(Boolean);
  const categories = (rawCategories || []).filter(Boolean);

  const categoryRecovery = (rawCategoryRecovery || []).map((item: any) => ({
    category: item.category,
    revenue: Math.round(item.revenue * 100) / 100,
    cogs: Math.round(item.cogs * 100) / 100,
    recoveryPct: Math.round(item.recoveryPct * 10) / 10,
  }));

  const channelDistribution = (rawChannelDistribution || []).map((item: any) => {
    const rev = Math.round(item.revenue * 100) / 100;
    const pct = totalRevenue > 0 ? Math.round((rev / totalRevenue) * 1000) / 10 : 0;
    return {
      channel: item._id,
      revenue: rev,
      pct,
    };
  });

  // 6. Multi-Timeframe Trajectory Buckets Generation
  interface TrajectoryBucket {
    period: string;
    revenue: number;
    volume: number;
    start: Date;
    end: Date;
  }

  const trajectoryBuckets: TrajectoryBucket[] = [];

  if (timeframe === '7d') {
    // 7 daily buckets: Day 1 .. Day 7
    const bucketDuration = 24 * 60 * 60 * 1000;
    for (let i = 0; i < 7; i++) {
      const bStart = new Date(currentStart!.getTime() + i * bucketDuration);
      const bEnd = (i === 6) ? now : new Date(currentStart!.getTime() + (i + 1) * bucketDuration);
      trajectoryBuckets.push({
        period: `Day ${i + 1}`,
        revenue: 0,
        volume: 0,
        start: bStart,
        end: bEnd,
      });
    }
  } else if (timeframe === '90d') {
    // 3 monthly buckets: Month 1 .. Month 3
    const bucketDuration = 30 * 24 * 60 * 60 * 1000;
    for (let i = 0; i < 3; i++) {
      const bStart = new Date(currentStart!.getTime() + i * bucketDuration);
      const bEnd = (i === 2) ? now : new Date(currentStart!.getTime() + (i + 1) * bucketDuration);
      trajectoryBuckets.push({
        period: `Month ${i + 1}`,
        revenue: 0,
        volume: 0,
        start: bStart,
        end: bEnd,
      });
    }
  } else if (timeframe === 'ytd') {
    // Quarterly buckets: Q1.. up to current quarter
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    for (let q = 1; q <= currentQuarter; q++) {
      const bStart = new Date(now.getFullYear(), (q - 1) * 3, 1);
      const bEnd = (q === currentQuarter)
        ? now
        : new Date(now.getFullYear(), q * 3, 0, 23, 59, 59, 999);
      trajectoryBuckets.push({
        period: `Q${q}`,
        revenue: 0,
        volume: 0,
        start: bStart,
        end: bEnd,
      });
    }
  } else {
    // Default 30d (5 weekly buckets): Week 1 .. Week 5
    const totalDuration = now.getTime() - currentStart!.getTime();
    const bucketDuration = totalDuration / 5;
    for (let i = 0; i < 5; i++) {
      const bStart = new Date(currentStart!.getTime() + i * bucketDuration);
      const bEnd = (i === 4) ? now : new Date(currentStart!.getTime() + (i + 1) * bucketDuration);
      trajectoryBuckets.push({
        period: `Week ${i + 1}`,
        revenue: 0,
        volume: 0,
        start: bStart,
        end: bEnd,
      });
    }
  }

  // Aggregate sales into corresponding buckets
  (currentSales || []).forEach((sale: any) => {
    const sDate = new Date(sale.saleDate).getTime();
    const rev = typeof sale.revenue === 'number' ? sale.revenue : 0;
    const vol = typeof sale.volume === 'number' ? sale.volume : 0;

    for (let i = 0; i < trajectoryBuckets.length; i++) {
      const b = trajectoryBuckets[i];
      const startMs = b.start.getTime();
      const endMs = b.end.getTime();
      const isLast = (i === trajectoryBuckets.length - 1);
      const inBucket = isLast ? (sDate >= startMs && sDate <= endMs) : (sDate >= startMs && sDate < endMs);

      if (inBucket) {
        b.revenue = Math.round((b.revenue + rev) * 100) / 100;
        b.volume = b.volume + vol;
        break;
      }
    }
  });

  const trajectory = trajectoryBuckets.map(({ period, revenue, volume }) => ({
    period,
    revenue: Math.round(revenue * 100) / 100,
    volume,
  }));

  const recentCloseouts = (rawRecentCloseouts || []).map((sale: any) => {
    let rslDays = 0;
    if (sale.lotExpirationDate && sale.saleDate) {
      const expTime = new Date(sale.lotExpirationDate).getTime();
      const saleTime = new Date(sale.saleDate).getTime();
      rslDays = Math.max(0, Math.round((expTime - saleTime) / 86400000));
    }
    const price = typeof sale.price === 'number' ? sale.price : 0;
    const cost = typeof sale.cost === 'number' ? sale.cost : 0;
    const recoveryPct = cost > 0 ? Math.round((price / cost) * 100) : 0;

    return {
      id: sale.id ? sale.id.toString() : '',
      sku: sale.sku || '',
      product: sale.product || '',
      rslDays,
      price,
      recoveryPct,
      buyer: sale.buyer || 'Direct Closeout',
      saleDate: sale.saleDate,
    };
  });

  const result = {
    totalRevenue,
    revenueGrowthPct,
    totalVolume,
    avgPrice,
    reconciledCount,
    totalCount,
    categories,
    warehouses,
    trajectory,
    categoryRecovery,
    channelDistribution,
    recentCloseouts,
  };

  // 6. Save to Redis Cache (5 mins TTL)
  try {
    const redis = await getRedisClient();
    if (redis && redis.isOpen) {
      await redis.set(cacheKey, JSON.stringify(result), {
        EX: 300
      });
    }
  } catch (err: any) {
    console.warn('Redis write error for sales analytics:', err.message || err);
  }

  return result;
}

