import InventoryLot from '../models/InventoryLot';
import Award from '../models/Award';
import Donation from '../models/Donation';
import Disposal from '../models/Disposal';
import Sale from '../models/Sale';
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

