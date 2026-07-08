const fs = require('fs');
const path = require('path');

const companyTemplates = [
  // Tier 1 — Primary Retailers (25)
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
  { name: "WinCo Foods Distribution", tier: "tier1", categories: ["Dry Goods", "Dairy", "Produce", "Frozen"], minShelfLife: 14, radius: 350 },
  { name: "Aldi USA National Supply", tier: "tier1", categories: ["Dairy", "Dry Goods", "Beverages", "Produce"], minShelfLife: 14, radius: 400 },
  { name: "Lidl US East Hub", tier: "tier1", categories: ["Dairy", "Produce", "Bakery", "Dry Goods"], minShelfLife: 12, radius: 250 },
  { name: "Harris Teeter Carolinas", tier: "tier1", categories: ["Dairy", "Produce", "Deli", "Meat"], minShelfLife: 10, radius: 160 },
  { name: "Hannaford Supermarkets North", tier: "tier1", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 12, radius: 150 },
  { name: "Brookshire Grocery Co", tier: "tier1", categories: ["Dairy", "Produce", "Meat", "Dry Goods"], minShelfLife: 10, radius: 200 },
  { name: "Weis Markets Central PA", tier: "tier1", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 10, radius: 120 },
  { name: "Woodman's Food Market Wisconsin", tier: "tier1", categories: ["Dairy", "Produce", "Beverages", "Dry Goods"], minShelfLife: 12, radius: 180 },
  { name: "Market Basket New England", tier: "tier1", categories: ["Dairy", "Produce", "Meat", "Dry Goods"], minShelfLife: 10, radius: 110 },
  { name: "Rouses Markets Gulf Coast", tier: "tier1", categories: ["Dairy", "Produce", "Deli", "Seafood"], minShelfLife: 10, radius: 170 },

  // Tier 2 — Regional Retailers & Co-ops (25)
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
  { name: "Chesapeake Bay Regional Grocers", tier: "tier2", categories: ["Produce", "Dairy", "Seafood"], minShelfLife: 7, radius: 110 },
  { name: "Dixie Regional Supermarkets", tier: "tier2", categories: ["Dairy", "Produce", "Meat"], minShelfLife: 8, radius: 160 },
  { name: "Badger State Food Outlets", tier: "tier2", categories: ["Dairy", "Produce", "Beverages"], minShelfLife: 7, radius: 140 },
  { name: "Lone Star Regional Grocers", tier: "tier2", categories: ["Produce", "Dairy", "Dry Goods"], minShelfLife: 8, radius: 250 },
  { name: "Bayshore Fresh Markets", tier: "tier2", categories: ["Produce", "Dairy", "Deli"], minShelfLife: 6, radius: 90 },
  { name: "Piedmont Grocers Alliance", tier: "tier2", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 7, radius: 130 },
  { name: "Allegheny Valley Stores", tier: "tier2", categories: ["Dairy", "Produce", "Frozen"], minShelfLife: 8, radius: 120 },
  { name: "Mohawk Valley Food Co-op", tier: "tier2", categories: ["Dairy", "Produce", "Bakery"], minShelfLife: 6, radius: 85 },
  { name: "San Joaquin Valley Grocers", tier: "tier2", categories: ["Produce", "Dairy", "Beverages"], minShelfLife: 5, radius: 160 },
  { name: "Wasatch Front Markets", tier: "tier2", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 8, radius: 140 },

  // Liquidators / Secondary Market (35)
  { name: "Apex Food Liquidation", tier: "liquidator", categories: ["Dairy", "Produce", "Dry Goods", "Beverages"], minShelfLife: 4, radius: 300 },
  { name: "Bargain Hunt Wholesale", tier: "liquidator", categories: ["Dry Goods", "Beverages", "Frozen"], minShelfLife: 5, radius: 400 },
  { name: "Ollie's Bargain Outlet Food Div", tier: "liquidator", categories: ["Dry Goods", "Beverages", "Snacks"], minShelfLife: 7, radius: 450 },
  { name: "Ocean State Job Lot Grocery", tier: "liquidator", categories: ["Dry Goods", "Beverages", "Canned Goods"], minShelfLife: 7, radius: 250 },
  { name: "Grocery Outlet Bargain Market", tier: "liquidator", categories: ["Dairy", "Produce", "Frozen", "Dry Goods"], minShelfLife: 5, radius: 350 },
  { name: "Marden's Surplus & Salvage", tier: "liquidator", categories: ["Dry Goods", "Beverages"], minShelfLife: 6, radius: 200 },
  { name: "Big Lots Food Disposals", tier: "liquidator", categories: ["Dry Goods", "Beverages", "Snacks"], minShelfLife: 7, radius: 500 },
  { name: "Excess Provisions Liquidation", tier: "liquidator", categories: ["Dairy", "Produce", "Meat", "Dry Goods"], minShelfLife: 3, radius: 300 },
  { name: "Metro Salvage Provisions", tier: "liquidator", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 4, radius: 200 },
  { name: "Urban Market Closeouts", tier: "liquidator", categories: ["Dairy", "Produce", "Bakery"], minShelfLife: 3, radius: 150 },
  { name: "Great Lakes Wholesalers", tier: "liquidator", categories: ["Dry Goods", "Beverages", "Frozen"], minShelfLife: 5, radius: 350 },
  { name: "Windy City Liquidators", tier: "liquidator", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 4, radius: 220 },
  { name: "Midwest Regional Salvage", tier: "liquidator", categories: ["Dairy", "Produce", "Meat"], minShelfLife: 4, radius: 280 },
  { name: "Tri-State Food Outlet", tier: "liquidator", categories: ["Dry Goods", "Beverages", "Frozen"], minShelfLife: 5, radius: 250 },
  { name: "First Chance Closeout Distributors", tier: "liquidator", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 3, radius: 300 },
  { name: "National Surplus Food Buyers", tier: "liquidator", categories: ["Dry Goods", "Beverages", "Canned Goods"], minShelfLife: 6, radius: 500 },
  { name: "Discount Cargo Liquidators", tier: "liquidator", categories: ["Dry Goods", "Frozen", "Beverages"], minShelfLife: 5, radius: 400 },
  { name: "Second Harvest Commercial Liquidation", tier: "liquidator", categories: ["Dairy", "Produce", "Meat"], minShelfLife: 3, radius: 250 },
  { name: "Sunbelt Salvage Merchants", tier: "liquidator", categories: ["Produce", "Dairy", "Dry Goods"], minShelfLife: 4, radius: 300 },
  { name: "Palmetto Discount Provisions", tier: "liquidator", categories: ["Dry Goods", "Beverages"], minShelfLife: 5, radius: 200 },
  { name: "Keystone State Liquidators", tier: "liquidator", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 4, radius: 180 },
  { name: "Empire Salvage Grocers", tier: "liquidator", categories: ["Dairy", "Dry Goods", "Beverages"], minShelfLife: 4, radius: 160 },
  { name: "Pacific Rim Food Closeouts", tier: "liquidator", categories: ["Produce", "Dry Goods", "Beverages"], minShelfLife: 4, radius: 350 },
  { name: "Gulf Coast Surplus Traders", tier: "liquidator", categories: ["Dairy", "Produce", "Seafood"], minShelfLife: 3, radius: 280 },
  { name: "Intermountain Liquidators", tier: "liquidator", categories: ["Dry Goods", "Frozen"], minShelfLife: 5, radius: 320 },
  { name: "Bay Area Food Salvage", tier: "liquidator", categories: ["Produce", "Dairy", "Bakery"], minShelfLife: 3, radius: 150 },
  { name: "Northwoods Discount Grocers", tier: "liquidator", categories: ["Dairy", "Dry Goods"], minShelfLife: 5, radius: 220 },
  { name: "High Plains Salvage Network", tier: "liquidator", categories: ["Dry Goods", "Beverages"], minShelfLife: 5, radius: 380 },
  { name: "Delta Provisions Salvage", tier: "liquidator", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 4, radius: 240 },
  { name: "Cactus State Closeouts", tier: "liquidator", categories: ["Dry Goods", "Beverages"], minShelfLife: 5, radius: 300 },
  { name: "Blue Ridge Salvage Hub", tier: "liquidator", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 4, radius: 190 },
  { name: "Cornhusker Commercial Liquidators", tier: "liquidator", categories: ["Dry Goods", "Frozen"], minShelfLife: 5, radius: 310 },
  { name: "Sooner Surplus Grocery", tier: "liquidator", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 4, radius: 260 },
  { name: "Volunteer State Salvage", tier: "liquidator", categories: ["Dry Goods", "Beverages"], minShelfLife: 5, radius: 230 },
  { name: "Old Dominion Closeout Corp", tier: "liquidator", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 4, radius: 210 },

  // Custom — Food Rescue & Non-Profits (15)
  { name: "City Harvest Logistics NY", tier: "custom", categories: ["Produce", "Dairy", "Bakery", "Prepared Foods"], minShelfLife: 2, radius: 80 },
  { name: "Greater Chicago Food Depository", tier: "custom", categories: ["Dairy", "Produce", "Meat", "Dry Goods"], minShelfLife: 2, radius: 100 },
  { name: "Atlanta Community Food Bank", tier: "custom", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 2, radius: 120 },
  { name: "Houston Food Bank Network", tier: "custom", categories: ["Produce", "Dairy", "Meat", "Dry Goods"], minShelfLife: 2, radius: 150 },
  { name: "Capital Area Food Bank DC", tier: "custom", categories: ["Produce", "Dairy", "Bakery"], minShelfLife: 2, radius: 90 },
  { name: "Feeding South Florida", tier: "custom", categories: ["Produce", "Dairy", "Beverages"], minShelfLife: 2, radius: 110 },
  { name: "North Texas Food Bank", tier: "custom", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 2, radius: 140 },
  { name: "St. Mary's Food Bank Phoenix", tier: "custom", categories: ["Produce", "Dairy", "Dry Goods"], minShelfLife: 2, radius: 130 },
  { name: "Oregon Food Bank Portland", tier: "custom", categories: ["Produce", "Dairy", "Bakery"], minShelfLife: 2, radius: 100 },
  { name: "Second Harvest Inland Empire", tier: "custom", categories: ["Produce", "Dairy", "Dry Goods"], minShelfLife: 2, radius: 120 },
  { name: "Mid-Ohio Food Collective", tier: "custom", categories: ["Produce", "Dairy", "Meat"], minShelfLife: 2, radius: 95 },
  { name: "Philabundance Philadelphia", tier: "custom", categories: ["Dairy", "Produce", "Bakery"], minShelfLife: 2, radius: 75 },
  { name: "Starlight Relief Network", tier: "custom", categories: ["Produce", "Dairy", "Dry Goods"], minShelfLife: 2, radius: 200 },
  { name: "Aurora Food Rescue", tier: "custom", categories: ["Produce", "Dairy", "Bakery"], minShelfLife: 2, radius: 110 },
  { name: "Delta Rescue Provisions", tier: "custom", categories: ["Dairy", "Produce", "Dry Goods"], minShelfLife: 2, radius: 160 },
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
  { lat: 35.1495, lng: -90.0490, city: "Memphis, TN" },
  { lat: 36.1627, lng: -86.7816, city: "Nashville, TN" },
  { lat: 29.7604, lng: -95.3698, city: "Houston, TX" },
  { lat: 39.9612, lng: -82.9988, city: "Columbus, OH" },
  { lat: 35.2271, lng: -80.8431, city: "Charlotte, NC" },
  { lat: 42.3601, lng: -71.0589, city: "Boston, MA" }
];

const allergenOptions = [
  [], [], [], [], // Most have none
  ["peanuts", "tree_nuts"],
  ["dairy"],
  ["gluten"],
  ["soy"],
  ["shellfish"],
  ["peanuts"]
];

const buyers = companyTemplates.map((item, idx) => {
  const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
  const email = `${cleanName}@ethereal.email`;
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
    excludedAllergens: allergenOptions[idx % allergenOptions.length]
  };
});

// Write to JSON
const targetJson = path.join(__dirname, '../../../test_files/buyers_100_seed.json');
fs.writeFileSync(targetJson, JSON.stringify(buyers, null, 2));

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

const targetCsv = path.join(__dirname, '../../../test_files/buyers_100_seed.csv');
fs.writeFileSync(targetCsv, csvRows.join('\n'));

console.log(`Successfully generated ${buyers.length} buyers into:`);
console.log(`- ${targetJson}`);
console.log(`- ${targetCsv}`);
