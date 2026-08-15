const fs = require('fs');
const path = require('path');

// Real emails provided by the user
const REAL_EMAILS = [
  'debashishere007@gmail.com',
  'edebashise@gmail.com',
  'debashisroe1996@gmail.com'
];

// Helper to generate a realistic buyer email using real emails & Gmail subaddresses
function getBuyerEmail(index, companyName) {
  const baseEmail = REAL_EMAILS[index % REAL_EMAILS.length];
  const tag = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const [local, domain] = baseEmail.split('@');
  return `${local}+${tag}@${domain}`;
}

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

// Major logistics centers & coordinates
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

const allergenOptions = [
  [], [], [], [],
  ["peanuts", "tree_nuts"],
  ["dairy"],
  ["gluten"],
  ["soy"]
];

function generateBuyers() {
  const buyers = companyTemplates.map((item, idx) => {
    const email = getBuyerEmail(idx, item.name);
    const loc = locations[idx % locations.length];
    const latOffset = (Math.sin(idx) * 0.05).toFixed(4);
    const lngOffset = (Math.cos(idx) * 0.05).toFixed(4);

    return {
      companyName: item.name,
      email: email,
      tier: item.tier,
      isVerified: true,
      acceptsShortDated: item.tier !== "tier1" ? true : idx % 2 === 0,
      minShelfLife: item.minShelfLife,
      categories: item.categories,
      transportRadius: item.radius,
      warehouseLocations: [
        {
          lat: parseFloat((loc.lat + parseFloat(latOffset)).toFixed(4)),
          lng: parseFloat((loc.lng + parseFloat(lngOffset)).toFixed(4))
        }
      ],
      excludedAllergens: allergenOptions[idx % allergenOptions.length],
      isActive: true,
      optInBidding: true,
      optInSales: true,
      phone: `+1 (${312 + (idx % 800)}) 555-${String(1000 + idx).padStart(4, '0')}`,
      address: `${100 + idx * 5} Commerce Way, Suite ${10 + (idx % 20)}, ${loc.city}`,
      notes: `Verified ${item.tier.toUpperCase()} commercial partner for surplus liquidation.`
    };
  });

  return buyers;
}

const buyers = generateBuyers();

// Output directory
const testFilesDir = path.join(__dirname, '../../../test_files');
if (!fs.existsSync(testFilesDir)) {
  fs.mkdirSync(testFilesDir, { recursive: true });
}

// Write to JSON
const targetJson50 = path.join(testFilesDir, 'buyers_50_seed.json');
const targetJson100 = path.join(testFilesDir, 'buyers_100_seed.json');
fs.writeFileSync(targetJson50, JSON.stringify(buyers, null, 2));
fs.writeFileSync(targetJson100, JSON.stringify(buyers, null, 2));

// Write to CSV
const csvHeaders = ['companyName', 'email', 'tier', 'isVerified', 'acceptsShortDated', 'minShelfLife', 'categories', 'transportRadius', 'latitude', 'longitude', 'excludedAllergens'];
const csvRows = [csvHeaders.join(',')];

buyers.forEach(b => {
  const row = [
    `"${b.companyName.replace(/"/g, '""')}"`,
    `"${b.email}"`,
    `"${b.tier}"`,
    b.isVerified,
    b.acceptsShortDated,
    b.minShelfLife,
    `"${b.categories.join(';')}"`,
    b.transportRadius,
    b.warehouseLocations[0].lat,
    b.warehouseLocations[0].lng,
    `"${b.excludedAllergens.join(';')}"`
  ];
  csvRows.push(row.join(','));
});

const targetCsv50 = path.join(testFilesDir, 'buyers_50_seed.csv');
const targetCsv100 = path.join(testFilesDir, 'buyers_100_seed.csv');
fs.writeFileSync(targetCsv50, csvRows.join('\n'));
fs.writeFileSync(targetCsv100, csvRows.join('\n'));

console.log(`Successfully generated ${buyers.length} high-quality buyers using real email addresses:`);
console.log(`- ${targetJson50}`);
console.log(`- ${targetCsv50}`);

module.exports = { generateBuyers, REAL_EMAILS };
