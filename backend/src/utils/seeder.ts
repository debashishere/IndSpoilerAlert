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

export async function seedDatabase(forceClean: boolean = false) {
  try {
    const lotCount = await InventoryLot.countDocuments();
    const saleCount = await Sale.countDocuments();
    const buyerCount = await Buyer.countDocuments();

    if (!forceClean && lotCount > 0 && saleCount > 0 && buyerCount >= 100) {
      console.log('Database already populated with complete demo dataset.');
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
    if (forceClean) {
      await EmailThread.deleteMany({});
      await EmailDispatchLog.deleteMany({});
    }

    console.log('Seeding database with comprehensive demo dataset...');

    // 1. Create Suppliers
    const suppliersData = [
      { name: 'Unilever', companyCode: 'ULVR', preferredDisposition: 'sell' },
      { name: 'Kraft Heinz', companyCode: 'KHC', preferredDisposition: 'sell' },
      { name: 'Mondelez International', companyCode: 'MDLZ', preferredDisposition: 'sell' },
      { name: 'Danone North America', companyCode: 'DANN', preferredDisposition: 'donate' },
      { name: 'Conagra Brands', companyCode: 'CAG', preferredDisposition: 'recycle' }
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

    // 3. Create Buyers (100 high quality buyers from test_files)
    const buyersJsonPath = path.join(__dirname, '../../../test_files/buyers_100_seed.json');
    let buyerSeedData: any[] = [];
    if (fs.existsSync(buyersJsonPath)) {
      buyerSeedData = JSON.parse(fs.readFileSync(buyersJsonPath, 'utf8'));
    }

    const buyers: any[] = [];
    for (const bData of buyerSeedData) {
      const buyer = await Buyer.create(bData);
      buyers.push(buyer);
    }

    const primaryBuyerIds = buyers.filter(b => b.tier === 'tier1' || b.tier === 'tier2').slice(0, 25).map(b => b._id);
    const secondaryBuyerIds = buyers.filter(b => b.tier === 'liquidator' || b.tier === 'custom').slice(0, 50).map(b => b._id);

    await BuyerList.create({
      name: 'Primary Buyers',
      type: 'primary',
      supplierId: unilever._id,
      buyerIds: primaryBuyerIds,
      description: 'Default list for top-tier primary buyers and direct retail outlets',
    });

    await BuyerList.create({
      name: 'Secondary Buyers',
      type: 'secondary',
      supplierId: unilever._id,
      buyerIds: secondaryBuyerIds,
      description: 'Default list for secondary market liquidators and salvage outlets',
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
    const now = new Date('2026-07-23T11:00:00Z');
    const lotsData = [
      {
        supplierId: unilever._id,
        distributionCenterId: dcs[0]._id,
        productId: products[0]._id, // ULVR-YOG-01
        liquidationCycleId: cycle1._id,
        lotNumber: 'LOT-ULVR-2026-001',
        productionDate: new Date('2026-06-15'),
        expirationDate: new Date('2026-08-02'), // 10 days left
        remainingShelfLife: 0.15,
        quantityCases: 1200,
        availableQty: 1200,
        costPerCase: 18.00,
        standardSellPrice: 32.00,
        status: 'active',
        comment: 'Organic Yogurt lot near expiration. Recommended 45% markdown.',
        fdaRegulated: true,
        temperatureMin: 34,
        temperatureMax: 38,
        attributes: new Map([['PalletHi', '5'], ['PalletTi', '10'], ['StorageTemp', 'Cold (34-38F)']])
      },
      {
        supplierId: unilever._id,
        distributionCenterId: dcs[0]._id,
        productId: products[1]._id, // ULVR-BUT-02
        liquidationCycleId: cycle1._id,
        lotNumber: 'LOT-ULVR-2026-002',
        productionDate: new Date('2026-06-01'),
        expirationDate: new Date('2026-08-10'), // 18 days left
        remainingShelfLife: 0.18,
        quantityCases: 800,
        availableQty: 800,
        costPerCase: 22.00,
        standardSellPrice: 45.00,
        status: 'active',
        comment: 'Plant-Based Butter closeout lot ready for stage-gate bidding.',
        fdaRegulated: false,
        temperatureMin: 34,
        temperatureMax: 40,
        attributes: new Map([['PalletHi', '6'], ['PalletTi', '8']])
      },
      {
        supplierId: kraftHeinz._id,
        distributionCenterId: dcs[1]._id,
        productId: products[2]._id, // KHC-KET-01
        liquidationCycleId: cycle2._id,
        lotNumber: 'LOT-KHC-2026-003',
        productionDate: new Date('2026-03-01'),
        expirationDate: new Date('2026-09-05'), // 44 days left
        remainingShelfLife: 0.49,
        quantityCases: 2500,
        availableQty: 1500,
        costPerCase: 12.00,
        standardSellPrice: 24.00,
        status: 'active',
        comment: 'Tomato Ketchup excess seasonal inventory. Partially awarded.',
        fdaRegulated: false,
        attributes: new Map([['BrixScore', '33.5'], ['Container', 'Squeeze Bottle']])
      },
      {
        supplierId: mondelez._id,
        distributionCenterId: dcs[2]._id,
        productId: products[4]._id, // MDLZ-CRK-01
        lotNumber: 'LOT-MDLZ-2026-004',
        productionDate: new Date('2026-05-10'),
        expirationDate: new Date('2026-08-06'), // 14 days left
        remainingShelfLife: 0.20,
        quantityCases: 3000,
        availableQty: 3000,
        costPerCase: 8.00,
        standardSellPrice: 16.00,
        status: 'active',
        comment: 'Whole Wheat Crackers short-dated lot requiring rapid markdown.',
        fdaRegulated: false,
        attributes: new Map([['Packaging', '12x12oz Box'], ['PalletCount', '50']])
      },
      {
        supplierId: danone._id,
        distributionCenterId: dcs[3]._id,
        productId: products[6]._id, // DANN-YOG-01
        lotNumber: 'LOT-DANN-2026-005',
        productionDate: new Date('2026-06-25'),
        expirationDate: new Date('2026-07-26'), // 3 days left
        remainingShelfLife: 0.08,
        quantityCases: 500,
        availableQty: 500,
        costPerCase: 15.00,
        standardSellPrice: 30.00,
        status: 'active',
        comment: 'Greek Yogurt short-dated lot needing urgent liquidation or rescue.',
        fdaRegulated: true,
        temperatureMin: 34,
        temperatureMax: 38
      },
      {
        supplierId: conagra._id,
        distributionCenterId: dcs[4]._id,
        productId: products[8]._id, // CAG-MEAT-01
        lotNumber: 'LOT-CAG-2026-006',
        productionDate: new Date('2026-05-01'),
        expirationDate: new Date('2026-08-20'), // 28 days left
        remainingShelfLife: 0.35,
        quantityCases: 1500,
        availableQty: 1500,
        costPerCase: 35.00,
        standardSellPrice: 60.00,
        status: 'active',
        comment: 'Frozen Boneless Poultry Breasts excess lot.',
        fdaRegulated: true,
        temperatureMin: 0,
        temperatureMax: 10
      },
      {
        supplierId: unilever._id,
        distributionCenterId: dcs[0]._id,
        productId: products[9]._id, // ULVR-MLK-03
        liquidationCycleId: cycle1._id,
        lotNumber: 'LOT-ULVR-2026-007',
        productionDate: new Date('2026-06-10'),
        expirationDate: new Date('2026-08-04'), // 12 days left
        remainingShelfLife: 0.12,
        quantityCases: 1000,
        availableQty: 1000,
        costPerCase: 14.00,
        standardSellPrice: 28.00,
        status: 'active',
        comment: 'Almond Milk with Tree Nut allergen tag.',
        fdaRegulated: true,
        temperatureMin: 34,
        temperatureMax: 40
      },
      {
        supplierId: kraftHeinz._id,
        distributionCenterId: dcs[1]._id,
        productId: products[3]._id, // KHC-DRS-02
        lotNumber: 'LOT-KHC-2026-008',
        productionDate: new Date('2026-03-20'),
        expirationDate: new Date('2026-07-24'), // 1 day left
        remainingShelfLife: 0.01,
        quantityCases: 300,
        availableQty: 0,
        costPerCase: 10.00,
        standardSellPrice: 20.00,
        status: 'recycled',
        comment: 'Expired lot sent to organic composting facility.',
        fdaRegulated: false
      },
      {
        supplierId: mondelez._id,
        distributionCenterId: dcs[2]._id,
        productId: products[5]._id, // MDLZ-CHO-02
        lotNumber: 'LOT-MDLZ-2026-009',
        productionDate: new Date('2026-05-15'),
        expirationDate: new Date('2026-08-12'),
        remainingShelfLife: 0.10,
        quantityCases: 600,
        availableQty: 600,
        costPerCase: 12.00,
        standardSellPrice: 22.00,
        status: 'active',
        comment: 'Dark Chocolate Bar short-dated lot.',
        fdaRegulated: false
      },
      {
        supplierId: danone._id,
        distributionCenterId: dcs[3]._id,
        productId: products[7]._id, // DANN-MLK-02
        lotNumber: 'LOT-DANN-2026-010',
        productionDate: new Date('2026-06-20'),
        expirationDate: new Date('2026-09-15'),
        remainingShelfLife: 0.65,
        quantityCases: 1200,
        availableQty: 1200,
        costPerCase: 16.00,
        standardSellPrice: 32.00,
        status: 'active',
        comment: 'Oat Milk Barista Blend surplus lot.',
        fdaRegulated: false
      }
    ];

    const lots: any[] = [];
    for (const l of lotsData) {
      const lot = await InventoryLot.create(l);
      lots.push(lot);
    }

    // 6. Create Sales Records (5 Sales transactions for analytics & reconciliation)
    const salesData = [
      {
        supplierId: unilever._id,
        buyerId: buyers[0]._id, // Grocery Outlet
        lotId: lots[0]._id,
        liquidationCycleId: cycle1._id,
        lotNumber: 'LOT-ULVR-2026-001',
        sku: 'ULVR-YOG-01',
        description: 'Creamery Organic Vanilla Yogurt 32oz',
        quantityCases: 400,
        pricePerCase: 17.50,
        totalValue: 7000.00,
        saleDate: new Date('2026-07-20'),
        status: 'delivered',
        buyerEmail: buyers[0].email,
        invoiceNumber: 'INV-2026-8801',
        brand: 'Breyers',
        warehouse: 'Unilever Midwest DC',
        revenue: 7000.00
      },
      {
        supplierId: kraftHeinz._id,
        buyerId: buyers[1]._id, // Big Lots
        lotId: lots[2]._id,
        liquidationCycleId: cycle2._id,
        lotNumber: 'LOT-KHC-2026-003',
        sku: 'KHC-KET-01',
        description: 'Tomato Ketchup Squeeze Bottle 64oz',
        quantityCases: 1000,
        pricePerCase: 14.00,
        totalValue: 14000.00,
        saleDate: new Date('2026-07-21'),
        status: 'in_transit',
        buyerEmail: buyers[1].email,
        invoiceNumber: 'INV-2026-8802',
        brand: 'Heinz',
        warehouse: 'Kraft Heinz Midwest DC',
        revenue: 14000.00
      },
      {
        supplierId: conagra._id,
        buyerId: buyers[1]._id, // Big Lots
        lotId: lots[5]._id,
        lotNumber: 'LOT-CAG-2026-006',
        sku: 'CAG-MEAT-01',
        description: 'Frozen Boneless Poultry Breasts 5lb',
        quantityCases: 1500,
        pricePerCase: 38.00,
        totalValue: 57000.00,
        saleDate: new Date('2026-07-18'),
        status: 'delivered',
        buyerEmail: buyers[1].email,
        invoiceNumber: 'INV-2026-8803',
        brand: 'Banquet',
        warehouse: 'Conagra Midwest DC',
        revenue: 57000.00
      },
      {
        supplierId: mondelez._id,
        buyerId: buyers[4]._id, // Dollar General Surplus
        lotId: lots[3]._id,
        lotNumber: 'LOT-MDLZ-2026-004',
        sku: 'MDLZ-CRK-01',
        description: 'Whole Wheat Original Crackers 12oz',
        quantityCases: 1000,
        pricePerCase: 9.50,
        totalValue: 9500.00,
        saleDate: new Date('2026-07-22'),
        status: 'confirmed',
        buyerEmail: buyers[4].email,
        invoiceNumber: 'INV-2026-8804',
        brand: 'Triscuit',
        warehouse: 'Mondelez Midwest DC',
        revenue: 9500.00
      },
      {
        supplierId: unilever._id,
        buyerId: buyers[2]._id, // Misfits Market
        lotId: lots[0]._id,
        liquidationCycleId: cycle1._id,
        lotNumber: 'LOT-ULVR-2026-001',
        sku: 'ULVR-YOG-01',
        description: 'Creamery Organic Vanilla Yogurt 32oz',
        quantityCases: 300,
        pricePerCase: 16.00,
        totalValue: 4800.00,
        saleDate: new Date('2026-07-22'),
        status: 'scheduled',
        buyerEmail: buyers[2].email,
        invoiceNumber: 'INV-2026-8805',
        brand: 'Breyers',
        warehouse: 'Unilever Midwest DC',
        revenue: 4800.00
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
      status: 'approved'
    });

    const listing1 = await MarketplaceListing.create({
      opportunityId: opp1._id,
      sellerId: unilever._id,
      allowBidding: true,
      startingPrice: 20.00,
      minimumPrice: 15.00,
      status: 'active',
      expiresAt: new Date(Date.now() + 5 * 86400000)
    });

    const offer1 = await Offer.create({
      listingId: listing1._id,
      buyerId: buyers[0]._id, // Grocery Outlet
      quantity: 500,
      price: 17.50,
      status: 'pending',
      awardedQty: 0,
      submittedAt: new Date(),
      messages: [
        { sender: 'buyer', content: 'We can purchase 500 cases at $17.50/case with immediate pickup.', timestamp: new Date(), proposedPrice: 17.50, proposedQuantity: 500 },
        { sender: 'supplier', content: 'Counter offer: $18.00/case for 500 cases.', timestamp: new Date(), proposedPrice: 18.00, proposedQuantity: 500 }
      ]
    });

    const offer2 = await Offer.create({
      listingId: listing1._id,
      buyerId: buyers[2]._id, // Misfits Market
      quantity: 300,
      price: 16.00,
      status: 'pending',
      awardedQty: 0,
      submittedAt: new Date(),
      messages: [
        { sender: 'buyer', content: 'Submitting bid for 300 cases at $16.00/case.', timestamp: new Date(), proposedPrice: 16.00, proposedQuantity: 300 }
      ]
    });

    // 8. Create Award & Shipment for CAG-MEAT-01 (Sold lot)
    const opp2 = await Opportunity.create({
      lotId: lots[5]._id,
      opportunityType: 'sell',
      priority: 'medium',
      recommendedAction: 'Direct Closeout Award to Big Lots',
      status: 'completed'
    });

    const listing2 = await MarketplaceListing.create({
      opportunityId: opp2._id,
      sellerId: conagra._id,
      allowBidding: true,
      startingPrice: 40.00,
      minimumPrice: 35.00,
      status: 'closed',
      expiresAt: new Date()
    });

    const offer3 = await Offer.create({
      listingId: listing2._id,
      buyerId: buyers[1]._id, // Big Lots
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
      listingId: listing2._id,
      offerId: offer3._id,
      buyerId: buyers[1]._id,
      awardedQty: 1500,
      price: 38.00,
      emailSent: 'Award Notice: PO #PO-CAG-9912 generated for Big Lots.',
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
      lotId: lots[4]._id, // DANN-YOG-01
      foodBankName: 'Greater Chicago Food Depository',
      quantity: 500,
      taxBenefit: 7500.00, // 500 * $15 cost
      landfillAvoided: 0.45, // 0.45 tons
      co2Saved: 1.12, // 1.12 tons CO2
      pickupDate: new Date('2026-07-22')
    });

    await Disposal.create({
      lotId: lots[7]._id, // KHC-DRS-02
      method: 'recycle',
      facility: 'Midwest Biogas Composting Facility',
      landfillFee: 0,
      recyclingFee: 150.00,
      completedDate: new Date('2026-07-23')
    });

    // 10. Create Liquidation Automation & Run Audit
    const auto1 = await LiquidationAutomation.create({
      supplierId: unilever._id,
      liquidationCycleId: cycle1._id,
      name: 'Short-Dated Dairy Stage-Gate Automated Liquidation',
      templateName: 'smart_bidding_auction',
      inventoryFilters: {
        category: 'Dairy',
        maxDaysUntilExpiration: 15
      },
      targetBuyerSelection: 'all_matched',
      schedule: {
        type: 'immediate'
      },
      emailTemplate: {
        subject: 'Surplus Dairy Liquidation Opportunity: {{inventory_count}} Lots Available',
        body: 'Dear Partner,\n\nWe have surplus dairy inventory available for bidding:\n\n{{inventory_table}}\n\nPlease submit your bids prior to expiration.',
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

    await AutomationRun.create({
      automationId: auto1._id,
      runType: 'manual',
      status: 'awarded',
      snapshotInventoryIds: [lots[0]._id, lots[1]._id],
      evaluatedBuyerIds: [buyers[0]._id, buyers[2]._id, buyers[3]._id],
      dispatchedAt: new Date('2026-07-22T10:00:00Z'),
      evaluationEndsAt: new Date('2026-07-23T10:00:00Z'),
      resolution: {
        action: 'auto_award',
        targetBuyerId: buyers[0]._id,
        winningOfferId: offer1._id,
        resolvedAt: new Date('2026-07-23T09:00:00Z')
      }
    });

    // 11. Create Activity Logs for Inventory Lot
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
      type: 'note',
      subject: 'Yield Risk Assessed',
      content: 'Yield Optimization Engine flagged high risk (RSL 0.22). Recommended 45% discount markdown.',
      sender: 'Yield Optimizer AI',
      timestamp: new Date('2026-07-20T08:05:00Z')
    });

    await Activity.create({
      lotId: lots[0]._id,
      type: 'email',
      subject: 'Bidding Enabled & Marketplace Listing Live',
      content: 'Promoted to active Marketplace Listing. Smart Buyer Matching notified 12 qualified buyers.',
      sender: 'Sales Rep John Doe',
      timestamp: new Date('2026-07-20T09:00:00Z')
    });

    // 12. Create Demo Email Threads & Dispatch Logs (only if collection is empty)
    if ((await EmailThread.countDocuments()) === 0) {
      await EmailThread.create({
      threadId: 'th-demo-101',
      supplierId: unilever._id.toString(),
      buyerEmail: 'eveline94@ethereal.email',
      listingId: 'lst-101',
      subject: 'Surplus Dairy Liquidation Offer Sheet - Breyers & Country Crock',
      status: 'active',
      openCount: 3,
      firstOpenedAt: new Date('2026-07-28T14:30:00Z'),
      lastOpenedAt: new Date('2026-07-29T09:15:00Z'),
      messages: [
        {
          messageId: 'msg-101-1',
          senderType: 'supplier',
          senderEmail: 'eveline94@ethereal.email',
          body: 'Hello Grocery Outlet team,\n\nWe have 1,200 cases of Breyers Organic Vanilla Yogurt (SKU: ULVR-YOG-01) with 25 days shelf life remaining. Special clearance price: $18.50/case (45% discount).\n\nPlease let us know if you would like to submit a bid or lock in this order.',
          sentAt: new Date('2026-07-28T14:00:00Z')
        },
        {
          messageId: 'msg-101-2',
          senderType: 'buyer',
          senderEmail: 'eveline94@ethereal.email',
          body: 'Hi Unilever team,\n\nWe are interested in taking 200 cases at $18.50/case. Please confirm FOB Chicago warehouse availability.',
          sentAt: new Date('2026-07-28T15:20:00Z')
        },
        {
          messageId: 'msg-101-3',
          senderType: 'supplier',
          senderEmail: 'eveline94@ethereal.email',
          body: 'Bid received and logged! 200 cases allocated for pickup at Chicago DC. Logistics paperwork dispatched.',
          sentAt: new Date('2026-07-28T16:05:00Z')
        }
      ]
    });

    await EmailThread.create({
      threadId: 'th-demo-102',
      supplierId: unilever._id.toString(),
      buyerEmail: 'buyer@misfitsmarket.com',
      listingId: 'lst-102',
      subject: 'Short-Dated Pure Leaf & Silk Plant Milk Clearance',
      status: 'active',
      openCount: 1,
      firstOpenedAt: new Date('2026-07-30T11:00:00Z'),
      lastOpenedAt: new Date('2026-07-30T11:00:00Z'),
      messages: [
        {
          messageId: 'msg-102-1',
          senderType: 'supplier',
          senderEmail: 'eveline94@ethereal.email',
          body: 'Greetings Misfits Market,\n\nWe are releasing a short-dated batch of Pure Leaf Almond Milk (450 cases). RSL: 18 days remaining. Bidding is open until tomorrow 5:00 PM.',
          sentAt: new Date('2026-07-30T10:30:00Z')
        }
      ]
    });

    await EmailThread.create({
      threadId: 'th-demo-103',
      supplierId: unilever._id.toString(),
      buyerEmail: 'buyer@biglots.com',
      listingId: 'lst-103',
      subject: 'Award Notification: Triscuit & Cadbury Dry Goods Lot #402',
      status: 'awarded',
      openCount: 5,
      firstOpenedAt: new Date('2026-07-25T08:00:00Z'),
      lastOpenedAt: new Date('2026-07-26T16:45:00Z'),
      messages: [
        {
          messageId: 'msg-103-1',
          senderType: 'supplier',
          senderEmail: 'eveline94@ethereal.email',
          body: 'Congratulations! Your bid of $14.20/case for 800 cases of Triscuit Crackers has been awarded.',
          sentAt: new Date('2026-07-25T07:50:00Z')
        },
        {
          messageId: `msg-103-2`,
          senderType: 'buyer',
          senderEmail: 'buyer@biglots.com',
          body: 'Thank you. Dock appointment scheduled for pickup on July 27th.',
          sentAt: new Date('2026-07-25T09:10:00Z')
        }
      ]
      });
    }

    console.log('Database seeding completed successfully with full demo dataset.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

