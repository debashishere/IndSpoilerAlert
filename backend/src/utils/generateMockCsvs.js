const fs = require('fs');
const path = require('path');

// Real emails provided by the user
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

// ----------------------------------------------------
// 1. GENERATE EXACTLY 50 BUYERS (buyers.csv)
// ----------------------------------------------------
const companyTemplates = [
  // Tier 1 — Primary Retailers (15)
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

  // Tier 2 — Regional Retailers & Co-ops (15)
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

  // Liquidators / Secondary Market (12)
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

const buyerRows = [
  ['companyName', 'email', 'tier', 'isVerified', 'acceptsShortDated', 'minShelfLife', 'categories', 'transportRadius', 'latitude', 'longitude', 'excludedAllergens', 'phone', 'address'].join(',')
];

const buyersList = companyTemplates.map((item, idx) => {
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
  buyerRows.push(row.join(','));

  return { companyName: item.name, email, tier: item.tier };
});

// ----------------------------------------------------
// 2. GENERATE EXACTLY 100 INVENTORY LOTS (inventory.csv)
// (NO "companyName" or "supplier" column - only standard inventory ingest columns)
// ----------------------------------------------------
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

const inventoryRows = [
  ['lotNumber', 'sku', 'brand', 'category', 'subCategory', 'description', 'productionDate', 'expirationDate', 'quantityCases', 'availableQty', 'costPerCase', 'standardSellPrice', 'status', 'fdaRegulated', 'temperatureMin', 'temperatureMax', 'warehouse'].join(',')
];

const inventoryList = [];

for (let i = 1; i <= 100; i++) {
  const lotNum = `LOT-2026-${String(i).padStart(3, '0')}`;
  const brandObj = brands[(i - 1) % brands.length];
  const sku = `${brandObj.prefix}-${String(i).padStart(3, '0')}`;
  const desc = `${brandObj.brand} Premium Surplus Item #${i} (${brandObj.subCategory})`;
  
  // Specific Lot Setup for Sales Requirements:
  // Lot 1: FULLY SOLD (Initial: 1,200, Available: 0)
  // Lot 2: PARTIALLY SOLD (Initial: 2,500, Available: 1,500)
  // Lot 3: NO SALES / UNSOLD (Initial: 3,000, Available: 3,000)
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
  const expDaysLeft = i === 1 ? 10 : (i === 2 ? 45 : (i === 3 ? 14 : 5 + (i * 3)));
  
  const mfgDate = new Date(Date.now() - mfgDaysAgo * 86400000).toISOString().split('T')[0];
  const expDate = new Date(Date.now() + expDaysLeft * 86400000).toISOString().split('T')[0];
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
  inventoryRows.push(row.join(','));

  inventoryList.push({
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

// ----------------------------------------------------
// 3. GENERATE SALES DATA (sales.csv)
// ----------------------------------------------------
const salesRows = [
  ['invoiceNumber', 'saleDate', 'lotNumber', 'sku', 'brand', 'description', 'buyerCompany', 'buyerEmail', 'quantityCases', 'pricePerCase', 'totalValue', 'status', 'warehouse'].join(',')
];

let invoiceCounter = 1001;

function addSaleRecord(lotObj, buyerIdx, qty, price, status = 'delivered', dateOffsetDays = 2) {
  const buyer = buyersList[buyerIdx % buyersList.length];
  const invNum = `INV-2026-${invoiceCounter++}`;
  const totalVal = qty * price;
  const saleDate = new Date(Date.now() - dateOffsetDays * 86400000).toISOString().split('T')[0];

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
  salesRows.push(row.join(','));
}

// Requirement 1: Lot #1 (LOT-2026-001) -> FULLY SOLD (1,200 cases)
addSaleRecord(inventoryList[0], 0, 800, 17.50, 'delivered', 5);  // Sale 1: 800 cases to Whole Foods
addSaleRecord(inventoryList[0], 30, 400, 18.00, 'delivered', 4); // Sale 2: 400 cases to Grocery Outlet

// Requirement 2: Lot #2 (LOT-2026-002) -> PARTIALLY SOLD (1,000 cases sold out of 2,500)
addSaleRecord(inventoryList[1], 33, 1000, 14.00, 'in_transit', 3); // Sale 3: 1,000 cases to Big Lots

// Requirement 3: Lot #3 (LOT-2026-003) -> NO SALES / UNSOLD (0 sales records)
// (Intentionally omitted)

// Sales for remaining lots in inventory with sales
for (let i = 3; i < 100; i++) {
  const lot = inventoryList[i];
  const soldQty = lot.totalQty - lot.availableQty;
  if (soldQty > 0) {
    if (soldQty > 800) {
      const part1 = Math.floor(soldQty / 2);
      const part2 = soldQty - part1;
      addSaleRecord(lot, i, part1, lot.cost * 1.25, 'delivered', (i % 10) + 1);
      addSaleRecord(lot, i + 5, part2, lot.cost * 1.20, 'confirmed', (i % 10) + 1);
    } else {
      addSaleRecord(lot, i, soldQty, lot.cost * 1.30, 'delivered', (i % 10) + 1);
    }
  }
}

// Write to files in test_files/
const testFilesDir = path.join(__dirname, '../../../test_files');
if (!fs.existsSync(testFilesDir)) {
  fs.mkdirSync(testFilesDir, { recursive: true });
}

// Clean up old redundant files if they exist
const filesToClean = ['buyers_50_seed.json', 'buyers_50_seed.csv', 'buyers_100_seed.json', 'buyers_100_seed.csv'];
filesToClean.forEach(f => {
  const p = path.join(testFilesDir, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

// Write exact clean CSV files
const buyersCsvPath = path.join(testFilesDir, 'buyers.csv');
const inventoryCsvPath = path.join(testFilesDir, 'inventory.csv');
const salesCsvPath = path.join(testFilesDir, 'sales.csv');

fs.writeFileSync(buyersCsvPath, buyerRows.join('\n'));
fs.writeFileSync(inventoryCsvPath, inventoryRows.join('\n'));
fs.writeFileSync(salesCsvPath, salesRows.join('\n'));

console.log('Successfully re-generated clean CSV files without supplier/companyName in inventory:');
console.log(`1. Buyers CSV (50 Buyers): ${buyersCsvPath}`);
console.log(`2. Inventory CSV (100 Inventory Lots): ${inventoryCsvPath}`);
console.log(`3. Sales CSV (Sales Respective to Inventory): ${salesCsvPath}`);
