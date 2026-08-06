import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMemo, useState } from 'react';

// Sample 10 Inventory Lots dataset matching production schema
const mockInventoryLots = [
  { id: '1', sku: 'ULVR-YOG-01', description: 'Organic Vanilla Yogurt 32oz', cases: 1200, expDate: '2026-08-02', rslDays: 5, category: 'Dairy' },
  { id: '2', sku: 'ULVR-BUT-02', description: 'Plant-Based Butter 16oz', cases: 800, expDate: '2026-08-10', rslDays: 13, category: 'Dairy' },
  { id: '3', sku: 'KHC-KET-01', description: 'Tomato Ketchup Squeeze 64oz', cases: 2500, expDate: '2026-09-05', rslDays: 39, category: 'Dry Goods' },
  { id: '4', sku: 'MDLZ-CRK-01', description: 'Whole Wheat Crackers 12oz', cases: 3000, expDate: '2026-08-06', rslDays: 9, category: 'Dry Goods' },
  { id: '5', sku: 'DANN-YOG-01', description: 'Greek Yogurt Variety 6-Pk', cases: 500, expDate: '2026-07-26', rslDays: 2, category: 'Dairy' },
  { id: '6', sku: 'CAG-MEAT-01', description: 'Frozen Poultry Breasts 5lb', cases: 1500, expDate: '2026-08-20', rslDays: 23, category: 'Meat' },
  { id: '7', sku: 'ULVR-MLK-03', description: 'Almond Milk Vanilla 64oz', cases: 1000, expDate: '2026-08-04', rslDays: 7, category: 'Beverages' },
  { id: '8', sku: 'KHC-DRS-02', description: 'Zesty Italian Dressing 16oz', cases: 300, expDate: '2026-07-24', rslDays: 1, category: 'Dry Goods' },
  { id: '9', sku: 'MDLZ-CHOC-02', description: 'Dark Chocolate Bars 3.5oz', cases: 1800, expDate: '2026-08-28', rslDays: 31, category: 'Dry Goods' },
  { id: '10', sku: 'DANN-MILK-02', description: 'Whole Organic Milk 1Gal', cases: 900, expDate: '2026-08-15', rslDays: 18, category: 'Dairy' }
];

// Sample 10 Historical Sales Data
const mockSalesHistory = [
  { invoiceId: 'INV-8801', lotId: '1', buyer: 'Grocery Outlet', buyerEmail: 'procurement@groceryoutlet.com', category: 'Dairy', casesSold: 400 },
  { invoiceId: 'INV-8802', lotId: '3', buyer: 'Big Lots', buyerEmail: 'salvage@biglots.com', category: 'Dry Goods', casesSold: 1000 },
  { invoiceId: 'INV-8803', lotId: '6', buyer: 'Big Lots', buyerEmail: 'salvage@biglots.com', category: 'Meat', casesSold: 1500 },
  { invoiceId: 'INV-8804', lotId: '4', buyer: 'Dollar General Surplus', buyerEmail: 'closeouts@dollargeneral.com', category: 'Dry Goods', casesSold: 1000 },
  { invoiceId: 'INV-8805', lotId: '1', buyer: 'Misfits Market', buyerEmail: 'surplus@misfitsmarket.com', category: 'Dairy', casesSold: 300 },
  { invoiceId: 'INV-8806', lotId: '2', buyer: 'Grocery Outlet', buyerEmail: 'procurement@groceryoutlet.com', category: 'Dairy', casesSold: 500 },
  { invoiceId: 'INV-8807', lotId: '7', buyer: 'Imperfection Foods', buyerEmail: 'buying@imperfectionfoods.com', category: 'Beverages', casesSold: 600 },
  { invoiceId: 'INV-8808', lotId: '9', buyer: 'Ollies Bargain Outlet', buyerEmail: 'deals@ollies.com', category: 'Dry Goods', casesSold: 1200 },
  { invoiceId: 'INV-8809', lotId: '10', buyer: 'Cheetah Wholesalers', buyerEmail: 'orders@cheetahwholesale.com', category: 'Dairy', casesSold: 450 },
  { invoiceId: 'INV-8810', lotId: '5', buyer: 'Second Harvest Food Bank', buyerEmail: 'intake@secondharvest.org', category: 'Dairy', casesSold: 500 }
];

/**
 * Custom React Hook simulating RSL filtering & workflow evaluation over cached inventory
 */
function useInventoryRslWorkflow(initialLots = mockInventoryLots, initialSales = mockSalesHistory) {
  const [maxRsl, setMaxRsl] = useState<number>(30);
  const [lots] = useState(initialLots);
  const [sales] = useState(initialSales);

  // 1. In-memory RSL filtering (No API calls)
  const filteredLots = useMemo(() => {
    return lots.filter((lot) => lot.rslDays <= maxRsl);
  }, [lots, maxRsl]);

  // 2. Workflow 1: Dynamic Markdown Stage Calculation
  const evaluateWorkflow1Markdown = (lot: typeof mockInventoryLots[0]) => {
    if (lot.rslDays < 10) {
      return { stage: 'Stage 3: Donation', discount: 100, targetAudience: 'Food Banks' };
    } else if (lot.rslDays <= 20) {
      return { stage: 'Stage 2: Open Marketplace', discount: 35, targetAudience: 'All Closeout Buyers' };
    } else if (lot.rslDays <= 30) {
      return { stage: 'Stage 1: Preferred Discount', discount: 15, targetAudience: 'Tier-1 Buyers' };
    }
    return { stage: 'Standard Retail', discount: 0, targetAudience: 'Regular Wholesale' };
  };

  // 3. Workflow 2: Re-engagement matching past sales buyers
  const findReengagementBuyersForLot = (lotId: string) => {
    const targetLot = lots.find((l) => l.id === lotId);
    if (!targetLot) return [];
    const categoryBuyers = sales
      .filter((s) => s.category === targetLot.category)
      .map((s) => s.buyerEmail);
    return Array.from(new Set(categoryBuyers));
  };

  // 4. Workflow 3: FSMA Safety Lock & Recycling Gate
  const evaluateWorkflow3SafetyGate = (lot: typeof mockInventoryLots[0]) => {
    if (lot.rslDays <= 2) {
      return { status: 'recycled', action: 'Route to Organics Composting', commercialListingAllowed: false };
    } else if (lot.rslDays <= 5) {
      return { status: 'donated', action: 'Issue Tax-Deductible Donation Receipt', commercialListingAllowed: false };
    }
    return { status: 'active', action: 'Commercial Marketplace Active', commercialListingAllowed: true };
  };

  return {
    maxRsl,
    setMaxRsl,
    filteredLots,
    evaluateWorkflow1Markdown,
    findReengagementBuyersForLot,
    evaluateWorkflow3SafetyGate
  };
}

describe('Liquidation Workflows & Client-Side Cached RSL Filter Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('Test 1: Updating RSL max threshold filters cached data without invoking any network API call', () => {
    const { result } = renderHook(() => useInventoryRslWorkflow());

    // Initially maxRsl = 30
    expect(result.current.filteredLots.length).toBe(8); // All except Lot 3 (rsl 39) & Lot 9 (rsl 31)
    expect(global.fetch).toHaveBeenCalledTimes(0);

    // Change RSL slider to 10 days
    act(() => {
      result.current.setMaxRsl(10);
    });

    // Should filter in-memory instantly
    expect(result.current.maxRsl).toBe(10);
    expect(result.current.filteredLots.length).toBe(5); // Lots with rsl <= 10 (lots 1, 2, 4, 5, 7, 8)
    
    // VERIFY ZERO API CALLS MADE ON RSL CHANGE
    expect(global.fetch).toHaveBeenCalledTimes(0);
  });

  it('Test 2: Workflow 1 (Time-to-Expire Markdown) correctly assigns stages and discounts based on RSL', () => {
    const { result } = renderHook(() => useInventoryRslWorkflow());

    // Lot 5 (rsl 2 days) -> Stage 3 (100% discount / donation)
    const lot5Result = result.current.evaluateWorkflow1Markdown(mockInventoryLots[4]);
    expect(lot5Result.stage).toBe('Stage 3: Donation');
    expect(lot5Result.discount).toBe(100);

    // Lot 2 (rsl 13 days) -> Stage 2 (35% markdown)
    const lot2Result = result.current.evaluateWorkflow1Markdown(mockInventoryLots[1]);
    expect(lot2Result.stage).toBe('Stage 2: Open Marketplace');
    expect(lot2Result.discount).toBe(35);

    // Lot 6 (rsl 23 days) -> Stage 1 (15% markdown)
    const lot6Result = result.current.evaluateWorkflow1Markdown(mockInventoryLots[5]);
    expect(lot6Result.stage).toBe('Stage 1: Preferred Discount');
    expect(lot6Result.discount).toBe(15);
  });

  it('Test 3: Workflow 2 (Buyer Re-engagement) matches remaining lot balance with historical sales buyers', () => {
    const { result } = renderHook(() => useInventoryRslWorkflow());

    // Find warm buyers for Dairy lot (Lot 1) based on past sales history
    const dairyBuyers = result.current.findReengagementBuyersForLot('1');
    expect(dairyBuyers).toContain('procurement@groceryoutlet.com');
    expect(dairyBuyers).toContain('surplus@misfitsmarket.com');
    expect(dairyBuyers).toContain('orders@cheetahwholesale.com');
    expect(dairyBuyers.length).toBeGreaterThanOrEqual(3);
  });

  it('Test 4: Workflow 3 (FSMA Safety & Recycling Gate) locks commercial listing for critical RSL lots', () => {
    const { result } = renderHook(() => useInventoryRslWorkflow());

    // Lot 8 (rsl 1 day) -> Critical -> Composting / Recycled, Commercial listing blocked
    const criticalLotResult = result.current.evaluateWorkflow3SafetyGate(mockInventoryLots[7]);
    expect(criticalLotResult.status).toBe('recycled');
    expect(criticalLotResult.commercialListingAllowed).toBe(false);

    // Lot 1 (rsl 5 days) -> Donated, Commercial listing blocked
    const donationLotResult = result.current.evaluateWorkflow3SafetyGate(mockInventoryLots[0]);
    expect(donationLotResult.status).toBe('donated');
    expect(donationLotResult.commercialListingAllowed).toBe(false);

    // Lot 3 (rsl 39 days) -> Active, Commercial listing allowed
    const activeLotResult = result.current.evaluateWorkflow3SafetyGate(mockInventoryLots[2]);
    expect(activeLotResult.status).toBe('active');
    expect(activeLotResult.commercialListingAllowed).toBe(true);
  });

  it('Test 5: displayLots re-renders on Max RSL filter change while deselecting retains item rendering', () => {
    const activeLots = [
      { id: '1', lotNumber: 'LOT-1', remainingShelfLife: 0.10, category: 'Dairy' },
      { id: '2', lotNumber: 'LOT-2', remainingShelfLife: 0.40, category: 'Dairy' },
      { id: '3', lotNumber: 'LOT-3', remainingShelfLife: 0.80, category: 'Dry Goods' }
    ];

    const matchesAutoFilters = (lot: any, maxRslFilter: number) => lot.remainingShelfLife <= maxRslFilter;

    // 1. Max RSL = 0.20 -> displayLots shows 1 lot
    let maxRslFilter = 0.20;
    let excludedLotIds: string[] = [];
    let explicitLotIds: string[] = [];

    let displayLots = activeLots.filter(l => matchesAutoFilters(l, maxRslFilter) || explicitLotIds.includes(l.id));
    let matchedLots = activeLots.filter(l => !excludedLotIds.includes(l.id) && matchesAutoFilters(l, maxRslFilter));

    expect(displayLots.length).toBe(1);
    expect(matchedLots.length).toBe(1);

    // 2. Change Max RSL to 0.50 -> displayLots re-renders to 2 lots
    maxRslFilter = 0.50;
    displayLots = activeLots.filter(l => matchesAutoFilters(l, maxRslFilter) || explicitLotIds.includes(l.id));
    matchedLots = activeLots.filter(l => !excludedLotIds.includes(l.id) && matchesAutoFilters(l, maxRslFilter));

    expect(displayLots.length).toBe(2);
    expect(matchedLots.length).toBe(2);

    // 3. User clicks "Deselect All" -> excludedLotIds gets all displayed lot IDs
    excludedLotIds = displayLots.map(l => l.id);
    matchedLots = activeLots.filter(l => !excludedLotIds.includes(l.id) && (explicitLotIds.includes(l.id) || matchesAutoFilters(l, maxRslFilter)));
    displayLots = activeLots.filter(l => matchesAutoFilters(l, maxRslFilter) || explicitLotIds.includes(l.id));

    // Deselected items must remain in displayLots (with checkbox unchecked), matchedLots becomes 0
    expect(displayLots.length).toBe(2);
    expect(matchedLots.length).toBe(0);
  });
});


