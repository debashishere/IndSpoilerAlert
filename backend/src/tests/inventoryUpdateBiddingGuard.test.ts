import { updateLot } from '../services/inventoryService';
import InventoryLot from '../models/InventoryLot';
import MarketplaceListing from '../models/MarketplaceListing';

jest.mock('../models/InventoryLot');
jest.mock('../models/MarketplaceListing');

describe('inventoryService.updateLot - Bidding Lockout Guard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects updates when lot has isListedInBidding flag set to true', async () => {
    const mockLotId = 'lot-123';
    const mockLot = {
      _id: mockLotId,
      status: 'Available',
      isListedInBidding: true,
      save: jest.fn(),
    };

    (InventoryLot.findById as jest.Mock).mockResolvedValue(mockLot);
    (MarketplaceListing.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      updateLot(mockLotId, { quantityCases: 100 })
    ).rejects.toThrow('Cannot edit inventory: Lot is currently listed in bidding.');
  });

  it('rejects updates when MarketplaceListing has active bidding listing', async () => {
    const mockLotId = 'lot-456';
    const mockLot = {
      _id: mockLotId,
      status: 'Available',
      save: jest.fn(),
    };

    (InventoryLot.findById as jest.Mock).mockResolvedValue(mockLot);
    (MarketplaceListing.findOne as jest.Mock).mockResolvedValue({
      _id: 'listing-1',
      allowBidding: true,
      status: 'active',
    });

    await expect(
      updateLot(mockLotId, { quantityCases: 200 })
    ).rejects.toThrow('Cannot edit inventory: Lot is currently listed in bidding.');
  });

  it('updates lot fields successfully when lot is NOT in bidding', async () => {
    const mockLotId = 'lot-789';
    const mockLot: any = {
      _id: mockLotId,
      status: 'Available',
      quantityCases: 50,
      availableQty: 50,
      save: jest.fn().mockResolvedValue(true),
    };

    const populatedQuery = {
      populate: jest.fn().mockReturnThis(),
    };
    (populatedQuery.populate as jest.Mock).mockReturnValue(populatedQuery);

    (InventoryLot.findById as jest.Mock)
      .mockResolvedValueOnce(mockLot) // first findById
      .mockReturnValueOnce(populatedQuery); // second findById with .populate chain

    (MarketplaceListing.findOne as jest.Mock).mockResolvedValue(null);

    await updateLot(mockLotId, {
      quantityCases: 150,
      costPerCase: 12.5,
      standardSellPrice: 18.0,
      lotNumber: 'LOT-NEW-789',
    });

    expect(mockLot.quantityCases).toBe(150);
    expect(mockLot.costPerCase).toBe(12.5);
    expect(mockLot.standardSellPrice).toBe(18.0);
    expect(mockLot.lotNumber).toBe('LOT-NEW-789');
    expect(mockLot.save).toHaveBeenCalledTimes(1);
  });
});

describe('inventoryController.updateLot - HTTP Controller Seam', () => {
  it('returns HTTP 400 when service throws bidding lockout error', async () => {
    const { updateLot: controllerUpdateLot } = await import('../controllers/inventoryController');
    const inventoryService = await import('../services/inventoryService');
    const spy = jest.spyOn(inventoryService, 'updateLot').mockRejectedValueOnce(
      new Error('Cannot edit inventory: Lot is currently listed in bidding.')
    );

    const req: any = {
      params: { id: 'lot-bid-1' },
      body: { quantityCases: 50 },
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controllerUpdateLot(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Cannot edit inventory: Lot is currently listed in bidding.',
    });

    spy.mockRestore();
  });

  it('returns HTTP 200 with result when service succeeds', async () => {
    const { updateLot: controllerUpdateLot } = await import('../controllers/inventoryController');
    const inventoryService = await import('../services/inventoryService');
    const mockResult = { _id: 'lot-1', quantityCases: 200 };
    const spy = jest.spyOn(inventoryService, 'updateLot').mockResolvedValueOnce(mockResult as any);

    const req: any = {
      params: { id: 'lot-1' },
      body: { quantityCases: 200 },
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controllerUpdateLot(req, res);

    expect(res.json).toHaveBeenCalledWith(mockResult);

    spy.mockRestore();
  });
});


