const fs = require('fs');
const path = require('path');

const TEST_FILES_DIR = __dirname;

// Real email bases for testing email delivery & notification features
const REAL_EMAILS = [
  'debashishere007@gmail.com',
  'edebashise@gmail.com',
  'debashisroe1996@gmail.com'
];

function getBuyerEmail(index, companyName) {
  const baseEmail = REAL_EMAILS[index % REAL_EMAILS.length];
  const tag = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const [local, domain] = baseEmail.split('@');
  return `${local}+${tag}@${domain}`;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

const NOW = new Date('2026-09-26T14:30:00Z');

// ============================================================================
// 1. BUYERS DATA (buyers.csv & scenario_3_buyer_segmentation_and_allergens.csv)
// ============================================================================
const companyTemplates = [
  // Tier 1 — Primary National Retailers (15)
  { name: "Whole Foods Market Regional", tier: "tier1", categories: ["Dairy", "Produce", "Meat", "Dry Goods", "Beverages", "Bakery"], minShelfLife: 10, radius: 150 },
  { name: "Kroger Mid-Atlantic Hub", tier: "tier1", categories: ["Dairy", "Produce", "Meat", "Dry Goods", "Beverages", "Frozen"], minShelfLife: 12, radius: 200 },
  { name: "Target Grocery Logistics East", tier: "tier1", categories: ["Dairy", "Dry Goods", "Beverages", "Snacks"], minShelfLife: 14, radius: 250 },
  { name: "Trader Joe's Northeast Distribution", tier: "tier1", categories: ["Dairy", "Produce", "Bakery", "Dry Goods"], minShelfLife: 10, radius: 120 },
  { name: "Publix Super Markets South", tier: "tier1", categories: ["Dairy", "Produce", "Meat", "Deli", "Beverages"], minShelfLife: 12, radius: 180 },
  { name: "HEB Texas Central Supply", tier: "tier1", categories: ["Dairy", "Produce", "Meat", "Dry Goods", "Frozen"], minShelfLife: 10, radius: 300 },
  { name: "Meijer Great Lakes Retail", tier: "tier1", categories: ["Dairy", "Produce", "Dry Goods", "Beverages"], minShelfLife: 14, radius: 200 },
  { name: "Albertsons Pacific Northwest", tier: "tier1", categories: ["Dairy", "Meat", "Dry Goods", "Beverages"], minShelfLife: 10, radius: 220 },
  { name: "Wegmans Food Markets North", tier: "tier1", categories: ["Dairy", "Produce", "Deli", "Bakery", "Beverages"], minShelfLife: 12, radius: 150 },
  { name: "Sprouts Farmers Market West", tier: "tier1", categories: ["Produce", "Dairy", "Dry Goods", "Bakery"], minShelfLife: 8, radius: 160 },
  { name: "Hy-Vee Midwest Operations", tier: "tier1", categories: ["Dairy", "Produce", "Meat", "Dry Goods"], minShelfLife: 10, radius: 250 },
  { name: "Giant Eagle Tri-State", tier: "tier1", categories: ["Dairy", "Produce", "Dry Goods", "Frozen"], minShelfLife: 12, radius: 180 },
  { name: "Food Lion Mid-Atlantic", tier: "tier1", categories: ["Dairy", "Produce", "Meat", "Dry Goods"], minShelfLife: 10, radius: 200 },
  { name: "Stop & Shop New England", tier: "tier1", categories: ["Dairy", "Produce", "Dry Goods", "Beverages"], minShelfLife: 12, radius: 140 },
  { name: "ShopRite Retail Logistics", tier: "tier1", categories: ["Dairy", "Produce", "Meat", "Dry Goods"], minShelfLife: 10, radius: 130 },

  // Tier 2 — Regional Grocers & Co-ops (15)
  { name: "Cascade Regional Grocers", tier: "tier2", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 7, radius: 150 },
  { name: "Sun Valley Co-op Markets", tier: "tier2", categories: ["Produce", "Dairy", "Bakery"], minShelfLife: 6, radius: 100 },
  { name: "Prairie State Grocers", tier: "tier2", categories: ["Dairy", "Dry Goods", "Beverages"], minShelfLife: 8, radius: 180 },
  { name: "Appalachian Fresh Outlets", tier: "tier2", categories: ["Produce", "Dairy", "Meat"], minShelfLife: 7, radius: 120 },
  { name: "Ozark Mountain Markets", tier: "tier2", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 8, radius: 160 },
  { name: "Sonora Valley Produce Merchants", tier: "tier2", categories: ["Produce", "Beverages"], minShelfLife: 5, radius: 140 },
  { name: "Bluegrass Food Co-op", tier: "tier2", categories: ["Dairy", "Produce", "Bakery"], minShelfLife: 6, radius: 90 },
  { name: "Pine Tree State Grocers", tier: "tier2", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 8, radius: 110 },
  { name: "Green Mountain Market Alliance", tier: "tier2", categories: ["Dairy", "Produce", "Beverages"], minShelfLife: 7, radius: 100 },
  { name: "Coastal Plain Regional Stores", tier: "tier2", categories: ["Dairy", "Produce", "Meat"], minShelfLife: 8, radius: 150 },
  { name: "Tri-County Fresh Markets", tier: "tier2", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 6, radius: 80 },
  { name: "Heartland Grocers Network", tier: "tier2", categories: ["Dairy", "Dry Goods", "Frozen"], minShelfLife: 8, radius: 200 },
  { name: "Red River Regional Outlets", tier: "tier2", categories: ["Produce", "Dairy", "Meat"], minShelfLife: 7, radius: 170 },
  { name: "Evergreen State Markets", tier: "tier2", categories: ["Dairy", "Produce", "Bakery"], minShelfLife: 6, radius: 130 },
  { name: "Great Plains Food Stores", tier: "tier2", categories: ["Dairy", "Dry Goods", "Beverages"], minShelfLife: 8, radius: 220 },

  // Liquidators / Secondary Market Clearance (12)
  { name: "Grocery Outlet Bargain Market", tier: "liquidator", categories: ["Dairy", "Produce", "Frozen", "Dry Goods"], minShelfLife: 5, radius: 350 },
  { name: "Ollie's Bargain Outlet Food Div", tier: "liquidator", categories: ["Dry Goods", "Beverages", "Snacks"], minShelfLife: 7, radius: 450 },
  { name: "Ocean State Job Lot Grocery", tier: "liquidator", categories: ["Dry Goods", "Beverages", "Canned Goods"], minShelfLife: 7, radius: 250 },
  { name: "Big Lots Food Disposals", tier: "liquidator", categories: ["Dry Goods", "Beverages", "Snacks"], minShelfLife: 7, radius: 500 },
  { name: "Excess Provisions Liquidation", tier: "liquidator", categories: ["Dairy", "Produce", "Meat", "Dry Goods"], minShelfLife: 3, radius: 300 },
  { name: "Metro Salvage Provisions", tier: "liquidator", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 4, radius: 200 },
  { name: "Urban Market Closeouts", tier: "liquidator", categories: ["Dairy", "Produce", "Bakery"], minShelfLife: 3, radius: 150 },
  { name: "Great Lakes Wholesalers", tier: "liquidator", categories: ["Dry Goods", "Beverages", "Frozen"], minShelfLife: 5, radius: 350 },
  { name: "Windy City Liquidators", tier: "liquidator", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 4, radius: 220 },
  { name: "Midwest Regional Salvage", tier: "liquidator", categories: ["Dairy", "Produce", "Meat"], minShelfLife: 4, radius: 280 },
  { name: "Tri-State Food Outlet", tier: "liquidator", categories: ["Dry Goods", "Beverages", "Frozen"], minShelfLife: 5, radius: 250 },
  { name: "First Chance Closeout Distributors", tier: "liquidator", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 3, radius: 300 },

  // Custom — Food Rescue & Non-Profits (8)
  { name: "City Harvest Logistics NY", tier: "custom", categories: ["Produce", "Dairy", "Bakery", "Prepared Foods"], minShelfLife: 2, radius: 80 },
  { name: "Greater Chicago Food Depository", tier: "custom", categories: ["Dairy", "Produce", "Meat", "Dry Goods"], minShelfLife: 2, radius: 100 },
  { name: "Atlanta Community Food Bank", tier: "custom", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 2, radius: 120 },
  { name: "Houston Food Bank Network", tier: "custom", categories: ["Produce", "Dairy", "Meat", "Dry Goods"], minShelfLife: 2, radius: 150 },
  { name: "Capital Area Food Bank DC", tier: "custom", categories: ["Produce", "Dairy", "Bakery"], minShelfLife: 2, radius: 90 },
  { name: "Feeding South Florida", tier: "custom", categories: ["Produce", "Dairy", "Beverages"], minShelfLife: 2, radius: 110 },
  { name: "North Texas Food Bank", tier: "custom", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 2, radius: 140 },
  { name: "St. Mary's Food Bank Phoenix", tier: "custom", categories: ["Produce", "Dairy", "Dry Goods"], minShelfLife: 2, radius: 130 }
];

const locations = [
  { lat: 41.8781, lng: -87.6298, city: "Chicago, IL" },
  { lat: 40.7128, lng: -74.0060, city: "New York, NY" },
  { lat: 34.0522, lng: -118.2437, city: "Los Angeles, CA" },
  { lat: 32.7767, lng: -96.7970, city: "Dallas, TX" },
  { lat: 33.7490, lng: -84.3880, city: "Atlanta, GA" },
  { lat: 47.6062, lng: -122.3321, city: "Seattle, WA" },
  { lat: 39.7392, lng: -104.9903, city: "Denver, CO" },
  { lat: 39.0997, lng: -94.5786, city: "Kansas City, MO" },
  { lat: 44.9778, lng: -93.2650, city: "Minneapolis, MN" },
  { lat: 25.7617, lng: -80.1918, city: "Miami, FL" },
  { lat: 39.9526, lng: -75.1652, city: "Philadelphia, PA" },
  { lat: 33.4484, lng: -112.0740, city: "Phoenix, AZ" },
  { lat: 42.3314, lng: -83.0458, city: "Detroit, MI" },
  { lat: 39.7684, lng: -86.1581, city: "Indianapolis, IN" },
  { lat: 35.1495, lng: -90.0490, city: "Memphis, TN" }
];

const allergenOptions = [[], [], [], [], ["peanuts", "tree_nuts"], ["dairy"], ["gluten"], ["soy"]];

function generateBuyers() {
  const buyerHeader = ['companyName', 'email', 'tier', 'isVerified', 'acceptsShortDated', 'minShelfLife', 'categories', 'transportRadius', 'latitude', 'longitude', 'excludedAllergens', 'phone', 'address'].join(',');
  const rows = [buyerHeader];
  const list = [];

  companyTemplates.forEach((item, idx) => {
    const email = getBuyerEmail(idx, item.name);
    const loc = locations[idx % locations.length];
    const latOffset = (Math.sin(idx) * 0.05).toFixed(4);
    const lngOffset = (Math.cos(idx) * 0.05).toFixed(4);
    const lat = parseFloat((loc.lat + parseFloat(latOffset)).toFixed(4));
    const lng = parseFloat((loc.lng + parseFloat(lngOffset)).toFixed(4));
    const phone = `+1 (312) 555-${String(1000 + idx).padStart(4, '0')}`;
    const address = `${100 + idx * 5} Logistics Parkway, ${loc.city}`;

    const row = [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${email}"`,
      `"${item.tier}"`,
      true,
      item.tier !== "tier1" ? true : idx % 2 === 0,
      item.minShelfLife,
      `"${item.categories.join(';')}"`,
      item.radius,
      lat,
      lng,
      `"${allergenOptions[idx % allergenOptions.length].join(';')}"`,
      `"${phone}"`,
      `"${address}"`
    ];
    rows.push(row.join(','));
    list.push({ companyName: item.name, email, tier: item.tier });
  });

  return { csvContent: rows.join('\n'), list };
}

// ============================================================================
// 2. INVENTORY DATA (inventory.csv)
// ============================================================================
const brands = [
  { brand: "Breyers", category: "Dairy", subCategory: "Yogurt", prefix: "ULVR-YOG" },
  { brand: "Country Crock", category: "Dairy", subCategory: "Butter", prefix: "ULVR-BUT" },
  { brand: "Pure Leaf", category: "Beverages", subCategory: "Tea", prefix: "ULVR-TEA" },
  { brand: "Heinz", category: "Dry Goods", subCategory: "Condiments", prefix: "KHC-KET" },
  { brand: "Kraft", category: "Dry Goods", subCategory: "Dressings", prefix: "KHC-DRS" },
  { brand: "Oscar Mayer", category: "Meat", subCategory: "Deli Meat", prefix: "KHC-MEAT" },
  { brand: "Triscuit", category: "Dry Goods", subCategory: "Snacks", prefix: "MDLZ-CRK" },
  { brand: "Cadbury", category: "Dry Goods", subCategory: "Confectionery", prefix: "MDLZ-CHO" },
  { brand: "Oreo", category: "Dry Goods", subCategory: "Cookies", prefix: "MDLZ-COOK" },
  { brand: "Oikos", category: "Dairy", subCategory: "Yogurt", prefix: "DANN-YOG" },
  { brand: "Silk", category: "Beverages", subCategory: "Plant Milk", prefix: "DANN-MLK" },
  { brand: "Activia", category: "Dairy", subCategory: "Probiotic Yogurt", prefix: "DANN-ACT" },
  { brand: "Banquet", category: "Meat", subCategory: "Frozen Poultry", prefix: "CAG-POUL" },
  { brand: "Healthy Choice", category: "Frozen", subCategory: "Frozen Meals", prefix: "CAG-MEAL" },
  { brand: "Chef Boyardee", category: "Dry Goods", subCategory: "Canned Goods", prefix: "CAG-CAN" }
];

const warehouses = [
  "Midwest Distribution Center, Chicago, IL",
  "Northeast Logistics Hub, Newark, NJ",
  "Southern Gateway DC, Atlanta, GA",
  "Texas Central Facility, Dallas, TX",
  "Pacific Northwest Hub, Seattle, WA"
];

function generateInventory() {
  const header = ['lotNumber', 'sku', 'brand', 'category', 'subCategory', 'description', 'productionDate', 'expirationDate', 'quantityCases', 'availableQty', 'costPerCase', 'standardSellPrice', 'status', 'fdaRegulated', 'temperatureMin', 'temperatureMax', 'warehouse'].join(',');
  const rows = [header];
  const list = [];

  for (let i = 1; i <= 100; i++) {
    const lotNum = `LOT-2026-${String(i).padStart(3, '0')}`;
    const brandObj = brands[(i - 1) % brands.length];
    const sku = `${brandObj.prefix}-${String(i).padStart(3, '0')}`;
    const desc = `${brandObj.brand} Premium Surplus Item #${i} (${brandObj.subCategory})`;
    
    let totalQty = 1000 + (i * 20);
    let availableQty = totalQty;
    let status = 'active';

    if (i === 1) {
      totalQty = 1200;
      availableQty = 0;
      status = 'sold';
    } else if (i === 2) {
      totalQty = 2500;
      availableQty = 1500;
      status = 'active';
    } else if (i === 3) {
      totalQty = 3000;
      availableQty = 3000;
      status = 'active';
    } else if (i % 5 === 0) {
      availableQty = 0;
      status = 'sold';
    } else if (i % 3 === 0) {
      availableQty = Math.floor(totalQty * 0.4);
      status = 'active';
    }

    const cost = 10 + (i % 25);
    const listPrice = Math.round(cost * 1.6);
    const mfgDaysAgo = 30 + (i % 60);
    const expDaysLeft = i === 1 ? -10 : (i === 2 ? 45 : (i === 3 ? 14 : 5 + (i * 3)));
    
    const mfgDate = formatDate(new Date(NOW.getTime() - mfgDaysAgo * 86400000));
    const expDate = formatDate(new Date(NOW.getTime() + expDaysLeft * 86400000));
    const fda = brandObj.category === 'Dairy' || brandObj.category === 'Meat' || brandObj.category === 'Beverages';
    const tempMin = brandObj.category === 'Dairy' ? 34 : (brandObj.category === 'Frozen' ? 0 : 50);
    const tempMax = brandObj.category === 'Dairy' ? 38 : (brandObj.category === 'Frozen' ? 10 : 72);
    const warehouse = warehouses[i % warehouses.length];

    const row = [
      `"${lotNum}"`,
      `"${sku}"`,
      `"${brandObj.brand}"`,
      `"${brandObj.category}"`,
      `"${brandObj.subCategory}"`,
      `"${desc.replace(/"/g, '""')}"`,
      `"${mfgDate}"`,
      `"${expDate}"`,
      totalQty,
      availableQty,
      cost.toFixed(2),
      listPrice.toFixed(2),
      `"${status}"`,
      fda,
      tempMin,
      tempMax,
      `"${warehouse}"`
    ];
    rows.push(row.join(','));

    list.push({
      lotNumber: lotNum,
      sku,
      brand: brandObj.brand,
      description: desc,
      totalQty,
      availableQty,
      cost,
      listPrice,
      warehouse,
      expDate
    });
  }

  return { csvContent: rows.join('\n'), list };
}

// ============================================================================
// 3. SALES DATA (sales.csv)
// ============================================================================
function generateSales(buyersList, inventoryList) {
  const header = ['invoiceNumber', 'saleDate', 'lotNumber', 'sku', 'brand', 'description', 'buyerCompany', 'buyerEmail', 'quantityCases', 'pricePerCase', 'totalValue', 'status', 'warehouse'].join(',');
  const rows = [header];
  let invoiceCounter = 1001;

  function addSale(lotObj, buyerIdx, qty, price, status = 'delivered', dateOffsetDays = 2) {
    const buyer = buyersList[buyerIdx % buyersList.length];
    const invNum = `INV-2026-${invoiceCounter++}`;
    const totalVal = qty * price;
    const saleDate = formatDate(new Date(NOW.getTime() - dateOffsetDays * 86400000));

    const row = [
      `"${invNum}"`,
      `"${saleDate}"`,
      `"${lotObj.lotNumber}"`,
      `"${lotObj.sku}"`,
      `"${lotObj.brand}"`,
      `"${lotObj.description.replace(/"/g, '""')}"`,
      `"${buyer.companyName.replace(/"/g, '""')}"`,
      `"${buyer.email}"`,
      qty,
      price.toFixed(2),
      totalVal.toFixed(2),
      `"${status}"`,
      `"${lotObj.warehouse}"`
    ];
    rows.push(row.join(','));
  }

  // Mandatory specific requirements for Lots 1, 2, 3
  addSale(inventoryList[0], 0, 800, 17.50, 'delivered', 5);
  addSale(inventoryList[0], 30, 400, 18.00, 'delivered', 4);
  addSale(inventoryList[1], 33, 1000, 14.00, 'in_transit', 3);

  // Generate sales for remaining inventory lots
  for (let i = 3; i < inventoryList.length; i++) {
    const lot = inventoryList[i];
    const soldQty = lot.totalQty - lot.availableQty;
    if (soldQty > 0) {
      const p1 = Math.round(lot.listPrice * 0.95 * 100) / 100;
      const p2 = Math.round(lot.listPrice * 0.90 * 100) / 100;

      if (soldQty > 800) {
        const half = Math.floor(soldQty / 2);
        addSale(lot, i % buyersList.length, half, p1, 'delivered', (i % 10) + 1);
        addSale(lot, (i + 15) % buyersList.length, soldQty - half, p2, (i % 2 === 0 ? 'confirmed' : 'delivered'), (i % 8) + 1);
      } else {
        addSale(lot, i % buyersList.length, soldQty, p1, 'delivered', (i % 12) + 1);
      }
    }
  }

  return rows.join('\n');
}

// ============================================================================
// 4. DEDICATED FEATURE SCENARIO CSVs
// ============================================================================

// Scenario 1: Emergency Short-Dated Excess Inventory
function generateScenario1ShortDated() {
  const header = ['lotNumber', 'sku', 'brand', 'category', 'subCategory', 'description', 'productionDate', 'expirationDate', 'quantityCases', 'availableQty', 'costPerCase', 'standardSellPrice', 'status', 'fdaRegulated', 'temperatureMin', 'temperatureMax', 'warehouse'].join(',');
  const rows = [header];

  const emergencyLots = [
    { lot: "LOT-EMERG-001", sku: "ULVR-EMG-01", brand: "Breyers", cat: "Dairy", sub: "Gourmet Gelato", desc: "Short-Dated Organic Vanilla Bean Gelato (Urgent Clearance Required)", mfgDays: 45, expDays: 4, qty: 1800, avail: 1800, cost: 14.50, sell: 24.00, fda: true, tMin: 0, tMax: 10, wh: "Northeast Logistics Hub, Newark, NJ" },
    { lot: "LOT-EMERG-002", sku: "DANN-EMG-02", brand: "Silk", cat: "Beverages", sub: "Almond Milk", desc: "Short-Dated Organic Unsweetened Almond Milk (RSL 8%)", mfgDays: 40, expDays: 5, qty: 2200, avail: 2200, cost: 11.00, sell: 18.50, fda: true, tMin: 34, tMax: 38, wh: "Midwest Distribution Center, Chicago, IL" },
    { lot: "LOT-EMERG-003", sku: "CAG-EMG-03", brand: "Healthy Choice", cat: "Frozen", sub: "Meals", desc: "Ultra-Short Frozen Power Bowls (Donation Cascade Target)", mfgDays: 60, expDays: 3, qty: 1500, avail: 1500, cost: 16.00, sell: 28.00, fda: true, tMin: -5, tMax: 5, wh: "Southern Gateway DC, Atlanta, GA" },
    { lot: "LOT-EMERG-004", sku: "KHC-EMG-04", brand: "Oscar Mayer", cat: "Meat", sub: "Bacon", desc: "Hardwood Smoked Bacon (FSMA 204 Audited Cold Chain)", mfgDays: 30, expDays: 6, qty: 3000, avail: 3000, cost: 18.00, sell: 32.00, fda: true, tMin: 32, tMax: 36, wh: "Texas Central Facility, Dallas, TX" },
    { lot: "LOT-EMERG-005", sku: "MDLZ-EMG-05", brand: "Oreo", cat: "Dry Goods", sub: "Cookies", desc: "Limited Edition Birthday Cake Oreos (Short BBD Window)", mfgDays: 90, expDays: 7, qty: 4500, avail: 4500, cost: 8.50, sell: 15.00, fda: false, tMin: 50, tMax: 72, wh: "Pacific Northwest Hub, Seattle, WA" }
  ];

  emergencyLots.forEach(item => {
    const mfgDate = formatDate(new Date(NOW.getTime() - item.mfgDays * 86400000));
    const expDate = formatDate(new Date(NOW.getTime() + item.expDays * 86400000));
    const row = [
      `"${item.lot}"`,
      `"${item.sku}"`,
      `"${item.brand}"`,
      `"${item.cat}"`,
      `"${item.sub}"`,
      `"${item.desc}"`,
      `"${mfgDate}"`,
      `"${expDate}"`,
      item.qty,
      item.avail,
      item.cost.toFixed(2),
      item.sell.toFixed(2),
      `"active"`,
      item.fda,
      item.tMin,
      item.tMax,
      `"${item.wh}"`
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

// Scenario 2: Non-Canonical SAP / Oracle ERP Export (Tests Ingestion Mapping Window & Column Translation)
function generateScenario2NonCanonicalERP() {
  const header = ['Material_SKU', 'Batch_Number', 'Brand_Name', 'Product_Category', 'Item_Description', 'Mfg_Timestamp', 'Best_Before_Date', 'Stock_Cases', 'Unit_Cost_USD', 'Market_Price_USD', 'Dist_Center', 'FDA_Flag', 'Temp_Min_F', 'Temp_Max_F'].join(',');
  const rows = [header];

  const erpItems = [
    { sku: "SAP-9981-YOG", batch: "BATCH-2026-X1", brand: "Breyers", cat: "Dairy", desc: "SAP Export - Greek Yogurt Honey Crunch 12x150g", mfgDays: 20, expDays: 25, qty: 1600, cost: 12.50, sell: 21.00, wh: "Northeast Logistics Hub, Newark, NJ", fda: "Y", tMin: 34, tMax: 38 },
    { sku: "ORC-4412-TEA", batch: "BATCH-2026-X2", brand: "Pure Leaf", cat: "Beverages", desc: "Oracle Fusion - Sweetened Black Tea 12x500ml", mfgDays: 15, expDays: 40, qty: 3200, cost: 9.80, sell: 16.50, wh: "Texas Central Facility, Dallas, TX", fda: "Y", tMin: 50, tMax: 70 },
    { sku: "SAP-7731-KET", batch: "BATCH-2026-X3", brand: "Heinz", cat: "Dry Goods", desc: "SAP ERP - Tomato Ketchup Squeeze Bottle 16oz", mfgDays: 50, expDays: 90, qty: 5000, cost: 11.20, sell: 19.00, wh: "Midwest Distribution Center, Chicago, IL", fda: "N", tMin: 50, tMax: 75 }
  ];

  erpItems.forEach(item => {
    const mfgDate = formatDate(new Date(NOW.getTime() - item.mfgDays * 86400000));
    const expDate = formatDate(new Date(NOW.getTime() + item.expDays * 86400000));
    const row = [
      `"${item.sku}"`,
      `"${item.batch}"`,
      `"${item.brand}"`,
      `"${item.cat}"`,
      `"${item.desc}"`,
      `"${mfgDate}"`,
      `"${expDate}"`,
      item.qty,
      item.cost.toFixed(2),
      item.sell.toFixed(2),
      `"${item.wh}"`,
      `"${item.fda}"`,
      item.tMin,
      item.tMax
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

// Scenario 3: Buyer Segmentation, Allergen Exclusions & Distance Matrix
function generateScenario3BuyerAllergens() {
  const header = ['companyName', 'email', 'tier', 'isVerified', 'acceptsShortDated', 'minShelfLife', 'categories', 'transportRadius', 'latitude', 'longitude', 'excludedAllergens', 'phone', 'address'].join(',');
  const rows = [header];

  const buyers = [
    { name: "Peanut-Free Kids School District Network", email: "debashishere007+peanutfree@gmail.com", tier: "custom", verified: true, short: true, minShelf: 3, cat: "Dairy;Produce;Bakery", radius: 50, lat: 41.8818, lng: -87.6231, allergens: "peanuts;tree_nuts", phone: "+1 (312) 555-8801", addr: "500 Education Way, Chicago, IL" },
    { name: "Gluten-Free Specialty Outlet", email: "edebashise+glutenfree@gmail.com", tier: "tier2", verified: true, short: true, minShelf: 5, cat: "Dry Goods;Snacks;Bakery", radius: 150, lat: 40.7128, lng: -74.0060, allergens: "gluten", phone: "+1 (212) 555-8802", addr: "120 Health Blvd, New York, NY" },
    { name: "Dairy-Free Vegan Co-op Alliance", email: "debashisroe1996+dairyfree@gmail.com", tier: "tier2", verified: true, short: true, minShelf: 4, cat: "Produce;Beverages;Dry Goods", radius: 100, lat: 34.0522, lng: -118.2437, allergens: "dairy", phone: "+1 (213) 555-8803", addr: "350 Eco Lane, Los Angeles, CA" },
    { name: "Strict Tier 1 Supercenter Network", email: "debashishere007+tier1strict@gmail.com", tier: "tier1", verified: true, short: false, minShelf: 14, cat: "Dairy;Produce;Meat;Dry Goods;Beverages;Frozen", radius: 500, lat: 32.7767, lng: -96.7970, allergens: "", phone: "+1 (214) 555-8804", addr: "1000 Retail Expressway, Dallas, TX" },
    { name: "Metro Emergency Surplus Liquidators", email: "edebashise+emergencyliquidators@gmail.com", tier: "liquidator", verified: true, short: true, minShelf: 1, cat: "Dairy;Produce;Meat;Dry Goods;Beverages;Frozen", radius: 1000, lat: 33.7490, lng: -84.3880, allergens: "", phone: "+1 (404) 555-8805", addr: "800 Clearance Highway, Atlanta, GA" }
  ];

  buyers.forEach(b => {
    const row = [
      `"${b.name}"`,
      `"${b.email}"`,
      `"${b.tier}"`,
      b.verified,
      b.short,
      b.minShelf,
      `"${b.cat}"`,
      b.radius,
      b.lat,
      b.lng,
      `"${b.allergens}"`,
      `"${b.phone}"`,
      `"${b.addr}"`
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

// Scenario 4: Edge Cases, Anomalies & Special Characters
function generateScenario4EdgeCases() {
  const header = ['lotNumber', 'sku', 'brand', 'category', 'subCategory', 'description', 'productionDate', 'expirationDate', 'quantityCases', 'availableQty', 'costPerCase', 'standardSellPrice', 'status', 'fdaRegulated', 'temperatureMin', 'temperatureMax', 'warehouse'].join(',');
  const rows = [header];

  const edgeLots = [
    { lot: "LOT-EDGE-001", sku: "SKU-SPECIAL-CHARS", brand: "Ben & Jerry's", cat: "Frozen", sub: "Ice Cream", desc: 'Special "Double Fudge" Crunch, 100% Organic & Non-GMO (Contains: Milk, Eggs)', mfgDays: 10, expDays: 60, qty: 1000, avail: 1000, cost: 15.00, sell: 25.00, fda: true, tMin: -10, tMax: 0, wh: "Midwest Distribution Center, Chicago, IL" },
    { lot: "LOT-EDGE-002", sku: "SKU-ZERO-STOCK", brand: "Lipton", cat: "Beverages", sub: "Iced Tea", desc: "Completely Sold-Out Lot for Ingestion System Zero Balance Test", mfgDays: 20, expDays: 30, qty: 500, avail: 0, cost: 5.00, sell: 10.00, fda: false, tMin: 50, tMax: 70, wh: "Northeast Logistics Hub, Newark, NJ" },
    { lot: "LOT-EDGE-003", sku: "SKU-HIGH-VALUATION", brand: "Knorr", cat: "Dry Goods", sub: "Bouillon", desc: "Bulk Industrial Food Service Seasoning Drums (High Unit Value $250/cs)", mfgDays: 5, expDays: 180, qty: 50, avail: 50, cost: 150.00, sell: 250.00, fda: false, tMin: 45, tMax: 80, wh: "Southern Gateway DC, Atlanta, GA" }
  ];

  edgeLots.forEach(item => {
    const mfgDate = formatDate(new Date(NOW.getTime() - item.mfgDays * 86400000));
    const expDate = formatDate(new Date(NOW.getTime() + item.expDays * 86400000));
    const row = [
      `"${item.lot}"`,
      `"${item.sku}"`,
      `"${item.brand}"`,
      `"${item.cat}"`,
      `"${item.sub}"`,
      `"${item.desc.replace(/"/g, '""')}"`,
      `"${mfgDate}"`,
      `"${expDate}"`,
      item.qty,
      item.avail,
      item.cost.toFixed(2),
      item.sell.toFixed(2),
      `"${item.avail === 0 ? 'sold' : 'active'}"`,
      item.fda,
      item.tMin,
      item.tMax,
      `"${item.wh}"`
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

// Execute Generation
console.log('Generating SpoilerAlert Test Suite Files...');

const { csvContent: buyersCsv, list: buyersList } = generateBuyers();
const { csvContent: inventoryCsv, list: inventoryList } = generateInventory();
const salesCsv = generateSales(buyersList, inventoryList);

fs.writeFileSync(path.join(TEST_FILES_DIR, 'buyers.csv'), buyersCsv);
console.log('✔ Updated test_files/buyers.csv (50 records)');

fs.writeFileSync(path.join(TEST_FILES_DIR, 'inventory.csv'), inventoryCsv);
console.log('✔ Updated test_files/inventory.csv (100 records)');

fs.writeFileSync(path.join(TEST_FILES_DIR, 'sales.csv'), salesCsv);
console.log('✔ Updated test_files/sales.csv (93 records)');

// Scenario files
const scen1 = generateScenario1ShortDated();
fs.writeFileSync(path.join(TEST_FILES_DIR, 'scenario_1_emergency_short_dated_inventory.csv'), scen1);
console.log('✔ Created test_files/scenario_1_emergency_short_dated_inventory.csv');

const scen2 = generateScenario2NonCanonicalERP();
fs.writeFileSync(path.join(TEST_FILES_DIR, 'scenario_2_non_canonical_erp_export.csv'), scen2);
console.log('✔ Created test_files/scenario_2_non_canonical_erp_export.csv');

const scen3 = generateScenario3BuyerAllergens();
fs.writeFileSync(path.join(TEST_FILES_DIR, 'scenario_3_buyer_segmentation_and_allergens.csv'), scen3);
console.log('✔ Created test_files/scenario_3_buyer_segmentation_and_allergens.csv');

const scen4 = generateScenario4EdgeCases();
fs.writeFileSync(path.join(TEST_FILES_DIR, 'scenario_4_edge_cases_and_anomalies.csv'), scen4);
console.log('✔ Created test_files/scenario_4_edge_cases_and_anomalies.csv');

console.log('All test files successfully generated!');
