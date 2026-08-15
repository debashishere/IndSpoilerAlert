import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Supplier from '../models/Supplier';
import Buyer from '../models/Buyer';
import BuyerList from '../models/BuyerList';
import DistributionCenter from '../models/DistributionCenter';
import ProductMaster from '../models/ProductMaster';
import LiquidationCycle from '../models/LiquidationCycle';
import InventoryLot from '../models/InventoryLot';
import Sale from '../models/Sale';
import InventoryRisk from '../models/InventoryRisk';
import Opportunity from '../models/Opportunity';
import PricingRecommendation from '../models/PricingRecommendation';
import MarketplaceListing from '../models/MarketplaceListing';
import Offer from '../models/Offer';
import Award from '../models/Award';
import Shipment from '../models/Shipment';
import Donation from '../models/Donation';
import Disposal from '../models/Disposal';
import DocumentImport from '../models/DocumentImport';
import SupplierTemplate from '../models/SupplierTemplate';
import LiquidationAutomation from '../models/LiquidationAutomation';
import AutomationRun from '../models/AutomationRun';
import Activity from '../models/Activity';
import EmailThread from '../models/EmailThread';
import EmailDispatchLog from '../models/EmailDispatchLog';
import EmailTemplate from '../models/EmailTemplate';

// Specified real emails for all mock email generation
export const REAL_USER_EMAILS = [
  'debashishere007@gmail.com',
  'edebashise@gmail.com',
  'debashisroe1996@gmail.com'
];

export async function seedDatabase(forceClean: boolean = false) {
  try {
    const lotCount = await InventoryLot.countDocuments();
    const saleCount = await Sale.countDocuments();
    const buyerCount = await Buyer.countDocuments();

    if (!forceClean && (lotCount > 0 || saleCount > 0 || buyerCount > 0)) {
      console.log('Database already populated. Skipping database seeding to preserve existing data.');
      return;
    }

    console.log('Clearing database collections for fresh clean seed...');
    await Supplier.deleteMany({});
    await Buyer.deleteMany({});
    await BuyerList.deleteMany({});
    await DistributionCenter.deleteMany({});
    await ProductMaster.deleteMany({});
    await LiquidationCycle.deleteMany({});
    await InventoryLot.deleteMany({});
    await Sale.deleteMany({});
    await InventoryRisk.deleteMany({});
    await Opportunity.deleteMany({});
    await PricingRecommendation.deleteMany({});
    await MarketplaceListing.deleteMany({});
    await Offer.deleteMany({});
    await Award.deleteMany({});
    await Shipment.deleteMany({});
    await Donation.deleteMany({});
    await Disposal.deleteMany({});
    await DocumentImport.deleteMany({});
    await SupplierTemplate.deleteMany({});
    await LiquidationAutomation.deleteMany({});
    await AutomationRun.deleteMany({});
    await Activity.deleteMany({});
    await EmailTemplate.deleteMany({});
    if (forceClean) {
      await EmailThread.deleteMany({});
      await EmailDispatchLog.deleteMany({});
    }

    console.log('Seeding database with high-quality 50-buyer demo dataset and real email integration...');

    // 1. Create Suppliers
    const suppliersData = [
      { name: 'Unilever', companyCode: 'ULVR', preferredDisposition: 'sell', email: REAL_USER_EMAILS[0] },
      { name: 'Kraft Heinz', companyCode: 'KHC', preferredDisposition: 'sell', email: REAL_USER_EMAILS[1] },
      { name: 'Mondelez International', companyCode: 'MDLZ', preferredDisposition: 'sell', email: REAL_USER_EMAILS[2] },
      { name: 'Danone North America', companyCode: 'DANN', preferredDisposition: 'donate', email: REAL_USER_EMAILS[0] },
      { name: 'Conagra Brands', companyCode: 'CAG', preferredDisposition: 'recycle', email: REAL_USER_EMAILS[1] }
    ];

    const suppliers: any[] = [];
    const dcs: any[] = [];
    for (const s of suppliersData) {
      const supplier = await Supplier.create(s);
      suppliers.push(supplier);

      const dc = await DistributionCenter.create({
        supplierId: supplier._id,
        name: `${supplier.name} Midwest DC`,
        code: `${supplier.companyCode}-MW-DC`,
        address: '100 Logistics Way, Chicago, IL 60607',
        coordinates: { lat: 41.8781, lng: -87.6298 },
        coldStorage: true
      });
      dcs.push(dc);
    }

    const unilever = suppliers[0];
    const kraftHeinz = suppliers[1];
    const mondelez = suppliers[2];
    const danone = suppliers[3];
    const conagra = suppliers[4];

    // 2. Create Product Masters
    const productsData = [
      { supplierId: unilever._id, sku: 'ULVR-YOG-01', brand: 'Breyers', category: 'Dairy', subCategory: 'Yogurt', description: 'Creamery Organic Vanilla Yogurt 32oz', shelfLifeDays: 45, allergens: ['Milk'] },
      { supplierId: unilever._id, sku: 'ULVR-BUT-02', brand: 'Country Crock', category: 'Dairy', subCategory: 'Butter', description: 'Plant-Based Butter with Olive Oil 16oz', shelfLifeDays: 60, allergens: [] },
      { supplierId: kraftHeinz._id, sku: 'KHC-KET-01', brand: 'Heinz', category: 'Dry Goods', subCategory: 'Condiments', description: 'Tomato Ketchup Squeeze Bottle 64oz', shelfLifeDays: 180, allergens: [] },
      { supplierId: kraftHeinz._id, sku: 'KHC-DRS-02', brand: 'Kraft', category: 'Dry Goods', subCategory: 'Dressings', description: 'Zesty Italian Salad Dressing 16oz', shelfLifeDays: 120, allergens: [] },
      { supplierId: mondelez._id, sku: 'MDLZ-CRK-01', brand: 'Triscuit', category: 'Dry Goods', subCategory: 'Snacks', description: 'Whole Wheat Original Crackers 12oz', shelfLifeDays: 90, allergens: ['Gluten'] },
      { supplierId: mondelez._id, sku: 'MDLZ-CHO-02', brand: 'Cadbury', category: 'Dry Goods', subCategory: 'Confectionery', description: 'Royal Dark Chocolate Bar 3.5oz', shelfLifeDays: 120, allergens: ['Milk', 'Soy'] },
      { supplierId: danone._id, sku: 'DANN-YOG-01', brand: 'Oikos', category: 'Dairy', subCategory: 'Yogurt', description: 'Greek Yogurt Variety 6-Pack', shelfLifeDays: 30, allergens: ['Milk'] },
      { supplierId: danone._id, sku: 'DANN-MLK-02', brand: 'Silk', category: 'Beverages', subCategory: 'Plant Milk', description: 'Oat Milk Barista Blend 32oz', shelfLifeDays: 60, allergens: [] },
      { supplierId: conagra._id, sku: 'CAG-MEAT-01', brand: 'Banquet', category: 'Meat', subCategory: 'Frozen Poultry', description: 'Frozen Boneless Poultry Breasts 5lb', shelfLifeDays: 90, allergens: [] },
      { supplierId: unilever._id, sku: 'ULVR-MLK-03', brand: 'Pure Leaf', category: 'Beverages', subCategory: 'Tea', description: 'Almond Milk Vanilla Infusion 64oz', shelfLifeDays: 45, allergens: ['Tree Nuts'] }
    ];

    const products: any[] = [];
    for (const p of productsData) {
      const prod = await ProductMaster.create(p);
      products.push(prod);
    }

    // 3. Create 50 High Quality Buyers using Real User Emails
    // Generate buyers or read from test_files
    const { generateBuyers } = require('./generate50Buyers');
    const buyerSeedData = generateBuyers();

    const buyers: any[] = [];
    for (const bData of buyerSeedData) {
      const buyer = await Buyer.create(bData);
      buyers.push(buyer);
    }

    // Categorize buyers into lists
    const tier1BuyerIds = buyers.filter(b => b.tier === 'tier1').map(b => b._id);
    const tier2BuyerIds = buyers.filter(b => b.tier === 'tier2').map(b => b._id);
    const liquidatorBuyerIds = buyers.filter(b => b.tier === 'liquidator').map(b => b._id);
    const customBuyerIds = buyers.filter(b => b.tier === 'custom').map(b => b._id);
    const allBuyerIds = buyers.map(b => b._id);

    // Save Buyer Lists for Workflow Setup
    const listPrimary = await BuyerList.create({
      name: 'Primary Retailers (Tier 1)',
      type: 'primary',
      supplierId: unilever._id,
      buyerIds: tier1BuyerIds,
      description: 'Top-tier supermarket chains and national grocery retailers (15 buyers)',
    });

    const listSecondary = await BuyerList.create({
      name: 'Regional & Co-op Grocers (Tier 2)',
      type: 'secondary',
      supplierId: unilever._id,
      buyerIds: tier2BuyerIds,
      description: 'Regional grocery chains, co-ops, and local retail outlets (15 buyers)',
    });

    const listLiquidators = await BuyerList.create({
      name: 'Secondary Market Liquidators',
      type: 'secondary',
      supplierId: unilever._id,
      buyerIds: liquidatorBuyerIds,
      description: 'Closeout merchants, salvage buyers, and bargain outlets (12 buyers)',
    });

    const listFoodRescue = await BuyerList.create({
      name: 'Food Rescue & Non-Profits',
      type: 'custom',
      supplierId: unilever._id,
      buyerIds: customBuyerIds,
      description: 'Non-profit food banks and charitable rescue organizations (8 buyers)',
    });

    await BuyerList.create({
      name: 'All 50 Verified Liquidation Buyers',
      type: 'custom',
      supplierId: unilever._id,
      buyerIds: allBuyerIds,
      description: 'Master list of all 50 verified buyer partners across all tiers and categories',
    });

    // 4. Create Liquidation Cycles
    const cycle1 = await LiquidationCycle.create({
      supplierId: unilever._id,
      name: 'LC-2026-Q3-DAIRY (Q3 Surplus Liquidation)',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-09-30'),
      status: 'active'
    });

    const cycle2 = await LiquidationCycle.create({
      supplierId: kraftHeinz._id,
      name: 'LC-2026-Q3-CONDIMENTS (Summer Excess Batch)',
      startDate: new Date('2026-07-10'),
      endDate: new Date('2026-08-31'),
      status: 'active'
    });

    // 5. Create Inventory Lots
    // Requirement: Sales data will have FULLY, PARTIALLY, and NO SALES against at least 3 inventory data lots.
    const lotsData = [
      // LOT 1: FULLY SOLD (Initial: 1,200 cases, Sold: 1,200 cases, Available: 0 cases, Status: 'sold')
      {
        supplierId: unilever._id,
        distributionCenterId: dcs[0]._id,
        productId: products[0]._id, // ULVR-YOG-01 (Breyers Organic Vanilla Yogurt)
        liquidationCycleId: cycle1._id,
        lotNumber: 'LOT-ULVR-2026-001',
        productionDate: new Date('2026-07-15'),
        expirationDate: new Date('2026-09-02'),
        remainingShelfLife: 0.35,
        quantityCases: 1200,
        availableQty: 0, // Fully sold out!
        costPerCase: 18.00,
        standardSellPrice: 32.00,
        status: 'sold',
        comment: 'Organic Yogurt lot near expiration. Fully sold via 2 liquidation sales.',
        fdaRegulated: true,
        temperatureMin: 34,
        temperatureMax: 38,
        attributes: new Map([['PalletHi', '5'], ['PalletTi', '10'], ['StorageTemp', 'Cold (34-38F)']])
      },
      // LOT 2: PARTIALLY SOLD (Initial: 2,500 cases, Sold: 1,000 cases, Available: 1,500 cases, Status: 'active')
      {
        supplierId: kraftHeinz._id,
        distributionCenterId: dcs[1]._id,
        productId: products[2]._id, // KHC-KET-01 (Heinz Tomato Ketchup)
        liquidationCycleId: cycle2._id,
        lotNumber: 'LOT-KHC-2026-003',
        productionDate: new Date('2026-04-01'),
        expirationDate: new Date('2026-10-05'),
        remainingShelfLife: 0.55,
        quantityCases: 2500,
        availableQty: 1500, // Partially sold! (1,000 sold, 1,500 remaining)
        costPerCase: 12.00,
        standardSellPrice: 24.00,
        status: 'active',
        comment: 'Tomato Ketchup excess seasonal inventory. Partially sold to Big Lots.',
        fdaRegulated: false,
        attributes: new Map([['BrixScore', '33.5'], ['Container', 'Squeeze Bottle']])
      },
      // LOT 3: NO SALES (UNSOLD / 0 SALES) (Initial: 3,000 cases, Sold: 0 cases, Available: 3,000 cases, Status: 'active')
      {
        supplierId: mondelez._id,
        distributionCenterId: dcs[2]._id,
        productId: products[4]._id, // MDLZ-CRK-01 (Triscuit Whole Wheat Crackers)
        lotNumber: 'LOT-MDLZ-2026-004',
        productionDate: new Date('2026-06-10'),
        expirationDate: new Date('2026-09-20'),
        remainingShelfLife: 0.40,
        quantityCases: 3000,
        availableQty: 3000, // No sales yet! 100% available
        costPerCase: 8.00,
        standardSellPrice: 16.00,
        status: 'active',
        comment: 'Whole Wheat Crackers short-dated lot requiring rapid markdown bidding. Zero sales so far.',
        fdaRegulated: false,
        attributes: new Map([['Packaging', '12x12oz Box'], ['PalletCount', '50']])
      },
      // LOT 4: DONATED LOT (Greek Yogurt, 500 cases)
      {
        supplierId: danone._id,
        distributionCenterId: dcs[3]._id,
        productId: products[6]._id, // DANN-YOG-01 (Oikos Greek Yogurt)
        lotNumber: 'LOT-DANN-2026-005',
        productionDate: new Date('2026-07-01'),
        expirationDate: new Date('2026-08-26'),
        remainingShelfLife: 0.15,
        quantityCases: 500,
        availableQty: 0,
        costPerCase: 15.00,
        standardSellPrice: 30.00,
        status: 'donated',
        comment: 'Greek Yogurt short-dated lot donated to Greater Chicago Food Depository.',
        fdaRegulated: true,
        temperatureMin: 34,
        temperatureMax: 38
      },
      // LOT 5: FULLY SOLD LOT (Frozen Poultry, 1,500 cases)
      {
        supplierId: conagra._id,
        distributionCenterId: dcs[4]._id,
        productId: products[8]._id, // CAG-MEAT-01 (Banquet Frozen Poultry)
        lotNumber: 'LOT-CAG-2026-006',
        productionDate: new Date('2026-06-01'),
        expirationDate: new Date('2026-09-20'),
        remainingShelfLife: 0.45,
        quantityCases: 1500,
        availableQty: 0,
        costPerCase: 35.00,
        standardSellPrice: 60.00,
        status: 'sold',
        comment: 'Frozen Poultry Breasts excess lot fully sold to Big Lots.',
        fdaRegulated: true,
        temperatureMin: 0,
        temperatureMax: 10
      },
      // LOT 6: ACTIVE WORKFLOW LOT (Pure Leaf Tea, 1,000 cases)
      {
        supplierId: unilever._id,
        distributionCenterId: dcs[0]._id,
        productId: products[9]._id, // ULVR-MLK-03 (Pure Leaf Almond Milk)
        liquidationCycleId: cycle1._id,
        lotNumber: 'LOT-ULVR-2026-007',
        productionDate: new Date('2026-07-01'),
        expirationDate: new Date('2026-09-28'),
        remainingShelfLife: 0.50,
        quantityCases: 1000,
        availableQty: 1000,
        costPerCase: 14.00,
        standardSellPrice: 28.00,
        status: 'active',
        comment: 'Almond Milk active in stage-gate automated liquidation.',
        fdaRegulated: true,
        temperatureMin: 34,
        temperatureMax: 40
      },
      // LOT 7: RECYCLED LOT (Kraft Dressing, 300 cases)
      {
        supplierId: kraftHeinz._id,
        distributionCenterId: dcs[1]._id,
        productId: products[3]._id, // KHC-DRS-02 (Kraft Italian Dressing)
        lotNumber: 'LOT-KHC-2026-008',
        productionDate: new Date('2026-04-20'),
        expirationDate: new Date('2026-08-24'),
        remainingShelfLife: 0.10,
        quantityCases: 300,
        availableQty: 0,
        costPerCase: 10.00,
        standardSellPrice: 20.00,
        status: 'recycled',
        comment: 'Expired lot sent to organic composting facility.',
        fdaRegulated: false
      },
      // LOT 8: PARTIALLY SOLD LOT (Cadbury Dark Chocolate, 600 cases)
      {
        supplierId: mondelez._id,
        distributionCenterId: dcs[2]._id,
        productId: products[5]._id, // MDLZ-CHO-02 (Cadbury Dark Chocolate)
        lotNumber: 'LOT-MDLZ-2026-009',
        productionDate: new Date('2026-06-15'),
        expirationDate: new Date('2026-09-30'),
        remainingShelfLife: 0.45,
        quantityCases: 600,
        availableQty: 400, // 200 cases sold
        costPerCase: 12.00,
        standardSellPrice: 22.00,
        status: 'active',
        comment: 'Dark Chocolate Bar short-dated lot. Partially sold 200 cases.',
        fdaRegulated: false
      },
      // LOT 9: ACTIVE MARKETPLACE LOT (Silk Oat Milk, 1,200 cases)
      {
        supplierId: danone._id,
        distributionCenterId: dcs[3]._id,
        productId: products[7]._id, // DANN-MLK-02 (Silk Oat Milk)
        lotNumber: 'LOT-DANN-2026-010',
        productionDate: new Date('2026-07-01'),
        expirationDate: new Date('2026-10-15'),
        remainingShelfLife: 0.70,
        quantityCases: 1200,
        availableQty: 1200,
        costPerCase: 16.00,
        standardSellPrice: 32.00,
        status: 'active',
        comment: 'Oat Milk Barista Blend surplus lot on active Marketplace.',
        fdaRegulated: false
      },
      // LOT 10: ACTIVE LOT (Country Crock Butter, 800 cases)
      {
        supplierId: unilever._id,
        distributionCenterId: dcs[0]._id,
        productId: products[1]._id, // ULVR-BUT-02 (Country Crock Butter)
        liquidationCycleId: cycle1._id,
        lotNumber: 'LOT-ULVR-2026-002',
        productionDate: new Date('2026-07-01'),
        expirationDate: new Date('2026-09-25'),
        remainingShelfLife: 0.45,
        quantityCases: 800,
        availableQty: 800,
        costPerCase: 22.00,
        standardSellPrice: 45.00,
        status: 'active',
        comment: 'Plant-Based Butter closeout lot ready for bidding.',
        fdaRegulated: false,
        temperatureMin: 34,
        temperatureMax: 40,
        attributes: new Map([['PalletHi', '6'], ['PalletTi', '8']])
      }
    ];

    const lots: any[] = [];
    for (const l of lotsData) {
      const lot = await InventoryLot.create(l);
      lots.push(lot);
    }

    // 6. Create Sales Data
    // Fulfilling the requirement:
    // Lot 0 (LOT-ULVR-2026-001): FULLY SOLD (1,200 cases total sold via 2 sales)
    // Lot 1 (LOT-KHC-2026-003): PARTIALLY SOLD (1,000 cases sold out of 2,500)
    // Lot 2 (LOT-MDLZ-2026-004): NO SALES (0 sales)
    const salesData = [
      // --- Sales against LOT 1 (LOT-ULVR-2026-001) -> FULLY SOLD ---
      {
        supplierId: unilever._id,
        buyerId: buyers[0]._id, // Whole Foods Market Regional
        lotId: lots[0]._id,
        liquidationCycleId: cycle1._id,
        lotNumber: 'LOT-ULVR-2026-001',
        sku: 'ULVR-YOG-01',
        description: 'Creamery Organic Vanilla Yogurt 32oz',
        quantityCases: 800,
        pricePerCase: 17.50,
        totalValue: 14000.00,
        saleDate: new Date('2026-07-20'),
        status: 'delivered',
        buyerEmail: buyers[0].email, // uses REAL_USER_EMAILS
        invoiceNumber: 'INV-2026-1001',
        brand: 'Breyers',
        warehouse: 'Unilever Midwest DC',
        revenue: 14000.00
      },
      {
        supplierId: unilever._id,
        buyerId: buyers[30]._id, // Grocery Outlet Bargain Market
        lotId: lots[0]._id,
        liquidationCycleId: cycle1._id,
        lotNumber: 'LOT-ULVR-2026-001',
        sku: 'ULVR-YOG-01',
        description: 'Creamery Organic Vanilla Yogurt 32oz',
        quantityCases: 400,
        pricePerCase: 18.00,
        totalValue: 7200.00,
        saleDate: new Date('2026-07-21'),
        status: 'delivered',
        buyerEmail: buyers[30].email, // uses REAL_USER_EMAILS
        invoiceNumber: 'INV-2026-1002',
        brand: 'Breyers',
        warehouse: 'Unilever Midwest DC',
        revenue: 7200.00
      },

      // --- Sale against LOT 2 (LOT-KHC-2026-003) -> PARTIALLY SOLD ---
      {
        supplierId: kraftHeinz._id,
        buyerId: buyers[33]._id, // Big Lots Food Disposals
        lotId: lots[1]._id,
        liquidationCycleId: cycle2._id,
        lotNumber: 'LOT-KHC-2026-003',
        sku: 'KHC-KET-01',
        description: 'Tomato Ketchup Squeeze Bottle 64oz',
        quantityCases: 1000,
        pricePerCase: 14.00,
        totalValue: 14000.00,
        saleDate: new Date('2026-07-21'),
        status: 'in_transit',
        buyerEmail: buyers[33].email, // uses REAL_USER_EMAILS
        invoiceNumber: 'INV-2026-1003',
        brand: 'Heinz',
        warehouse: 'Kraft Heinz Midwest DC',
        revenue: 14000.00
      },

      // --- NO SALES recorded against LOT 3 (LOT-MDLZ-2026-004) -> NO SALES / UNSOLD ---

      // --- Additional Sales for complete analytics coverage ---
      {
        supplierId: conagra._id,
        buyerId: buyers[33]._id, // Big Lots Food Disposals
        lotId: lots[4]._id, // LOT-CAG-2026-006 (Banquet Frozen Poultry)
        lotNumber: 'LOT-CAG-2026-006',
        sku: 'CAG-MEAT-01',
        description: 'Frozen Boneless Poultry Breasts 5lb',
        quantityCases: 1500,
        pricePerCase: 38.00,
        totalValue: 57000.00,
        saleDate: new Date('2026-07-18'),
        status: 'delivered',
        buyerEmail: buyers[33].email,
        invoiceNumber: 'INV-2026-1004',
        brand: 'Banquet',
        warehouse: 'Conagra Midwest DC',
        revenue: 57000.00
      },
      {
        supplierId: mondelez._id,
        buyerId: buyers[31]._id, // Ollie's Bargain Outlet
        lotId: lots[7]._id, // LOT-MDLZ-2026-009 (Cadbury Dark Chocolate)
        lotNumber: 'LOT-MDLZ-2026-009',
        sku: 'MDLZ-CHO-02',
        description: 'Royal Dark Chocolate Bar 3.5oz',
        quantityCases: 200,
        pricePerCase: 12.50,
        totalValue: 2500.00,
        saleDate: new Date('2026-07-22'),
        status: 'confirmed',
        buyerEmail: buyers[31].email,
        invoiceNumber: 'INV-2026-1005',
        brand: 'Cadbury',
        warehouse: 'Mondelez Midwest DC',
        revenue: 2500.00
      }
    ];

    for (const s of salesData) {
      await Sale.create(s);
    }

    // 7. Create Opportunities & Marketplace Listings & Bids/Offers
    const opp1 = await Opportunity.create({
      lotId: lots[0]._id,
      opportunityType: 'sell',
      priority: 'high',
      recommendedAction: 'Initiate 45% Markdown Bidding Batch to Retail Clearance Buyers',
      status: 'completed'
    });

    const listing1 = await MarketplaceListing.create({
      opportunityId: opp1._id,
      sellerId: unilever._id,
      allowBidding: true,
      startingPrice: 20.00,
      minimumPrice: 15.00,
      status: 'closed',
      expiresAt: new Date()
    });

    const offer1 = await Offer.create({
      listingId: listing1._id,
      buyerId: buyers[30]._id, // Grocery Outlet
      quantity: 400,
      price: 18.00,
      status: 'fully_accepted',
      awardedQty: 400,
      submittedAt: new Date('2026-07-21'),
      messages: [
        { sender: 'buyer', content: 'We offer $18.00/case for 400 cases with immediate dock pickup.', timestamp: new Date('2026-07-21'), proposedPrice: 18.00, proposedQuantity: 400 },
        { sender: 'supplier', content: 'Offer accepted! Invoice INV-2026-1002 issued.', timestamp: new Date('2026-07-21'), proposedPrice: 18.00, proposedQuantity: 400 }
      ]
    });

    const opp2 = await Opportunity.create({
      lotId: lots[2]._id, // LOT-MDLZ-2026-004 (No sales lot)
      opportunityType: 'sell',
      priority: 'high',
      recommendedAction: 'Stage-Gate Bidding Auction to 50 Buyer Network',
      status: 'approved'
    });

    const listing2 = await MarketplaceListing.create({
      opportunityId: opp2._id,
      sellerId: mondelez._id,
      allowBidding: true,
      startingPrice: 12.00,
      minimumPrice: 8.00,
      status: 'active',
      expiresAt: new Date(Date.now() + 7 * 86400000)
    });

    await Offer.create({
      listingId: listing2._id,
      buyerId: buyers[1]._id, // Kroger
      quantity: 500,
      price: 9.50,
      status: 'pending',
      awardedQty: 0,
      submittedAt: new Date(),
      messages: [
        { sender: 'buyer', content: 'Submitting initial bid of $9.50/case for 500 cases of Triscuit.', timestamp: new Date(), proposedPrice: 9.50, proposedQuantity: 500 }
      ]
    });

    // 8. Create Award & Shipment for CAG-MEAT-01 (Sold lot)
    const opp3 = await Opportunity.create({
      lotId: lots[4]._id,
      opportunityType: 'sell',
      priority: 'medium',
      recommendedAction: 'Direct Closeout Award to Big Lots',
      status: 'completed'
    });

    const listing3 = await MarketplaceListing.create({
      opportunityId: opp3._id,
      sellerId: conagra._id,
      allowBidding: true,
      startingPrice: 40.00,
      minimumPrice: 35.00,
      status: 'closed',
      expiresAt: new Date()
    });

    const offer3 = await Offer.create({
      listingId: listing3._id,
      buyerId: buyers[33]._id, // Big Lots
      quantity: 1500,
      price: 38.00,
      status: 'fully_accepted',
      awardedQty: 1500,
      submittedAt: new Date('2026-07-17'),
      messages: [
        { sender: 'buyer', content: 'Accepting complete lot of 1,500 cases at $38.00/case.', timestamp: new Date('2026-07-17') }
      ]
    });

    const award1 = await Award.create({
      listingId: listing3._id,
      offerId: offer3._id,
      buyerId: buyers[33]._id,
      awardedQty: 1500,
      price: 38.00,
      emailSent: `Award Notice: PO #PO-CAG-9912 generated for Big Lots. Contact: ${REAL_USER_EMAILS[2]}`,
      approvedDate: new Date('2026-07-18')
    });

    await Shipment.create({
      awardId: award1._id,
      carrier: 'C.H. Robinson Cold Logistics',
      pickupLocation: 'Conagra Midwest DC, Chicago, IL',
      deliveryLocation: 'Big Lots Distribution Center, Columbus, OH',
      status: 'delivered',
      temperature: '34.5°F',
      bolNumber: 'BOL-CAG-2026-9901',
      carrierName: 'C.H. Robinson',
      carrierDotNumber: 'DOT-8849201',
      pickupWindowStart: new Date('2026-07-19T08:00:00Z'),
      pickupWindowEnd: new Date('2026-07-19T12:00:00Z'),
      temperatureLogs: [
        { timestamp: new Date('2026-07-19T09:00:00Z'), temperature: 34.5 },
        { timestamp: new Date('2026-07-19T11:00:00Z'), temperature: 35.1 },
        { timestamp: new Date('2026-07-19T14:00:00Z'), temperature: 34.8 }
      ]
    });

    // 9. Create Donation & Recycling Records
    await Donation.create({
      lotId: lots[3]._id, // DANN-YOG-01
      foodBankName: 'Greater Chicago Food Depository',
      quantity: 500,
      taxBenefit: 7500.00,
      landfillAvoided: 0.45,
      co2Saved: 1.12,
      pickupDate: new Date('2026-07-22')
    });

    await Disposal.create({
      lotId: lots[6]._id, // KHC-DRS-02
      method: 'recycle',
      facility: 'Midwest Biogas Composting Facility',
      landfillFee: 0,
      recyclingFee: 150.00,
      completedDate: new Date('2026-07-23')
    });

    // 10. Create Email Templates & Liquidation Automation Workflows
    const emailTmpl1 = await EmailTemplate.create({
      supplierId: unilever._id,
      name: 'Surplus Dairy Liquidation Offer Sheet',
      subject: 'Surplus Dairy Liquidation Opportunity: {{inventory_count}} Lots Available',
      body: `<p>Dear {{buyer_name}},</p>
<p>We are offering surplus dairy inventory at special closeout pricing:</p>
{{inventory_table}}
<p>Please review and submit your bids before expiration.</p>
<p><a href="{{deal_url}}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Submit Bid via QuickBid</a></p>`,
      isDefault: true
    });

    const auto1 = await LiquidationAutomation.create({
      supplierId: unilever._id,
      liquidationCycleId: cycle1._id,
      name: 'Short-Dated Dairy Stage-Gate Automated Liquidation',
      templateName: 'smart_bidding_auction',
      inventoryFilters: {
        category: 'Dairy',
        maxDaysUntilExpiration: 25
      },
      targetBuyerSelection: 'buyer_list',
      buyerListId: listPrimary._id,
      schedule: {
        type: 'immediate'
      },
      emailTemplate: {
        subject: emailTmpl1.subject,
        body: emailTmpl1.body,
        targetBuyers: 'matched_only'
      },
      rules: {
        evaluationWindowHours: 24,
        onSuccess: 'auto_award',
        onFallback: 'auto_donate',
        minimumBidFloorPrice: 12.00,
        minimumYieldRecoveryPercent: 40,
        minimumMatchScore: 70
      },
      isActive: true,
      stats: {
        totalRuns: 2,
        totalAwarded: 1,
        totalDonated: 0
      }
    });

    const auto2 = await LiquidationAutomation.create({
      supplierId: mondelez._id,
      name: 'Dry Goods & Seasonal Surplus Quick-Bid Auction',
      templateName: 'linear_stage_gate',
      inventoryFilters: {
        category: 'Dry Goods',
        maxDaysUntilExpiration: 30
      },
      targetBuyerSelection: 'buyer_list',
      buyerListId: listLiquidators._id,
      schedule: {
        type: 'immediate'
      },
      emailTemplate: {
        subject: 'Clearance Snacks & Dry Goods: {{inventory_count}} Lots Open for Bidding',
        body: '<p>Hi {{buyer_name}},</p><p>Check out our latest surplus inventory lot table:</p>{{inventory_table}}<p>Submit your offer now!</p>',
        targetBuyers: 'matched_only'
      },
      rules: {
        evaluationWindowHours: 48,
        onSuccess: 'auto_award',
        onFallback: 'auto_donate',
        minimumBidFloorPrice: 8.00,
        minimumYieldRecoveryPercent: 35,
        minimumMatchScore: 65
      },
      isActive: true,
      stats: {
        totalRuns: 1,
        totalAwarded: 0,
        totalDonated: 0
      }
    });

    await AutomationRun.create({
      automationId: auto1._id,
      runType: 'manual',
      status: 'awarded',
      snapshotInventoryIds: [lots[0]._id, lots[9]._id],
      evaluatedBuyerIds: [buyers[0]._id, buyers[1]._id, buyers[30]._id],
      dispatchedAt: new Date('2026-07-21T10:00:00Z'),
      evaluationEndsAt: new Date('2026-07-22T10:00:00Z'),
      resolution: {
        action: 'auto_award',
        targetBuyerId: buyers[30]._id,
        winningOfferId: offer1._id,
        resolvedAt: new Date('2026-07-21T16:00:00Z')
      }
    });

    await AutomationRun.create({
      automationId: auto2._id,
      runType: 'manual',
      status: 'in_progress',
      snapshotInventoryIds: [lots[2]._id], // Triscuit unsold lot
      evaluatedBuyerIds: allBuyerIds.slice(0, 15),
      dispatchedAt: new Date('2026-07-23T08:00:00Z'),
      evaluationEndsAt: new Date('2026-07-25T08:00:00Z')
    });

    // 11. Create Activity Logs
    await Activity.create({
      lotId: lots[0]._id,
      type: 'note',
      subject: 'Ingested via PDF Invoice',
      content: 'Ingested 1,200 cases of Organic Vanilla Yogurt via PDF Invoice Ingestion.',
      sender: 'System Ingest AI',
      timestamp: new Date('2026-07-20T08:00:00Z')
    });

    await Activity.create({
      lotId: lots[0]._id,
      type: 'email',
      subject: 'Fully Liquidated & Delivered',
      content: 'Lot 1,200 cases fully sold via 2 sales (INV-2026-1001 & INV-2026-1002). Available Qty: 0.',
      sender: `Sales Rep (${REAL_USER_EMAILS[0]})`,
      timestamp: new Date('2026-07-21T17:00:00Z')
    });

    await Activity.create({
      lotId: lots[1]._id,
      type: 'note',
      subject: 'Partially Sold (1,000 / 2,500 Cases)',
      content: '1,000 cases sold to Big Lots. 1,500 cases remain active in inventory.',
      sender: `Sales Rep (${REAL_USER_EMAILS[1]})`,
      timestamp: new Date('2026-07-21T14:00:00Z')
    });

    await Activity.create({
      lotId: lots[2]._id,
      type: 'email',
      subject: 'Stage-Gate Bidding Broadcast Dispatched',
      content: 'Dispatched bidding email broadcast for 3,000 cases of Triscuit Whole Wheat Crackers to 50 buyers.',
      sender: `Sales Rep (${REAL_USER_EMAILS[2]})`,
      timestamp: new Date('2026-07-23T08:30:00Z')
    });

    // 12. Create Email Threads with Real User Emails
    await EmailThread.create({
      threadId: 'th-demo-501',
      supplierId: unilever._id.toString(),
      buyerEmail: REAL_USER_EMAILS[0],
      listingId: listing1._id.toString(),
      subject: 'Surplus Dairy Liquidation Offer Sheet - Breyers Organic Vanilla Yogurt',
      status: 'active',
      openCount: 4,
      firstOpenedAt: new Date('2026-07-20T14:30:00Z'),
      lastOpenedAt: new Date('2026-07-21T09:15:00Z'),
      messages: [
        {
          messageId: 'msg-501-1',
          senderType: 'supplier',
          senderEmail: REAL_USER_EMAILS[0],
          body: `Hello Whole Foods team,\n\nWe have 1,200 cases of Breyers Organic Vanilla Yogurt (SKU: ULVR-YOG-01) with 18 days shelf life remaining. Closeout pricing: $17.50/case (45% markdown).\n\nPlease let us know if you want to lock in your order.`,
          sentAt: new Date('2026-07-20T14:00:00Z')
        },
        {
          messageId: 'msg-501-2',
          senderType: 'buyer',
          senderEmail: REAL_USER_EMAILS[0],
          body: `Hi Unilever team,\n\nWe are accepting 800 cases at $17.50/case. Please confirm FOB Chicago DC pickup appointment.`,
          sentAt: new Date('2026-07-20T15:20:00Z')
        },
        {
          messageId: 'msg-501-3',
          senderType: 'supplier',
          senderEmail: REAL_USER_EMAILS[0],
          body: `Confirmed! 800 cases reserved under INV-2026-1001. Dock appointment set for tomorrow morning.`,
          sentAt: new Date('2026-07-20T16:05:00Z')
        }
      ]
    });

    await EmailThread.create({
      threadId: 'th-demo-502',
      supplierId: kraftHeinz._id.toString(),
      buyerEmail: REAL_USER_EMAILS[1],
      listingId: 'lst-ketchup-502',
      subject: 'Heinz Tomato Ketchup 64oz Seasonal Excess Offer',
      status: 'active',
      openCount: 2,
      firstOpenedAt: new Date('2026-07-21T11:00:00Z'),
      lastOpenedAt: new Date('2026-07-21T11:30:00Z'),
      messages: [
        {
          messageId: 'msg-502-1',
          senderType: 'supplier',
          senderEmail: REAL_USER_EMAILS[1],
          body: `Greetings Big Lots Purchasing,\n\nWe have 2,500 cases of Heinz Tomato Ketchup (SKU: KHC-KET-01) available. Offering 1,000 cases at $14.00/case.`,
          sentAt: new Date('2026-07-21T10:30:00Z')
        },
        {
          messageId: 'msg-502-2',
          senderType: 'buyer',
          senderEmail: REAL_USER_EMAILS[1],
          body: `Offer accepted for 1,000 cases! Invoice INV-2026-1003 confirmed.`,
          sentAt: new Date('2026-07-21T11:15:00Z')
        }
      ]
    });

    await EmailThread.create({
      threadId: 'th-demo-503',
      supplierId: mondelez._id.toString(),
      buyerEmail: REAL_USER_EMAILS[2],
      listingId: listing2._id.toString(),
      subject: 'Triscuit Whole Wheat Original Crackers Bidding Auction',
      status: 'active',
      openCount: 1,
      firstOpenedAt: new Date('2026-07-23T09:00:00Z'),
      lastOpenedAt: new Date('2026-07-23T09:00:00Z'),
      messages: [
        {
          messageId: 'msg-503-1',
          senderType: 'supplier',
          senderEmail: REAL_USER_EMAILS[2],
          body: `Hi Buyers,\n\n3,000 cases of Triscuit Whole Wheat Crackers (SKU: MDLZ-CRK-01) are open for stage-gate bidding auction. Floor price: $8.00/case. Standard sell: $16.00/case. Submit bids now!`,
          sentAt: new Date('2026-07-23T08:30:00Z')
        }
      ]
    });

    // 13. Create Email Dispatch Logs using Real User Emails
    await EmailDispatchLog.create({
      supplierId: unilever._id.toString(),
      recipientEmail: REAL_USER_EMAILS[0],
      buyerId: buyers[0]._id,
      subject: 'Surplus Dairy Liquidation Opportunity: 2 Lots Available',
      bodyContent: 'Dear Whole Foods Market Regional,\n\nWe have surplus dairy inventory available for bidding...',
      status: 'sent',
      sentAt: new Date('2026-07-21T10:00:00Z')
    });

    await EmailDispatchLog.create({
      supplierId: kraftHeinz._id.toString(),
      recipientEmail: REAL_USER_EMAILS[1],
      buyerId: buyers[33]._id,
      subject: 'Heinz Ketchup Partial Sale Confirmation - Invoice #INV-2026-1003',
      bodyContent: 'Dear Big Lots Food Disposals,\n\nYour order for 1,000 cases of Heinz Tomato Ketchup has been confirmed...',
      status: 'sent',
      sentAt: new Date('2026-07-21T11:15:00Z')
    });

    await EmailDispatchLog.create({
      supplierId: mondelez._id.toString(),
      recipientEmail: REAL_USER_EMAILS[2],
      buyerId: buyers[1]._id,
      subject: 'Triscuit Crackers Stage-Gate Auction Broadcast',
      bodyContent: 'Dear Kroger Mid-Atlantic Hub,\n\n3,000 cases of Triscuit Whole Wheat Crackers are now open for bidding...',
      status: 'sent',
      sentAt: new Date('2026-07-23T08:30:00Z')
    });

    console.log('Database seeding completed successfully with high-quality 50-buyer dataset, 3 explicit inventory sales states, and real email integration!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
