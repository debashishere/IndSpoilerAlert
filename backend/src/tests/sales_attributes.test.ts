import mongoose from 'mongoose';
import Sale from '../models/Sale';

describe('Sale Model Attributes Parity', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }
  });

  afterAll(async () => {
    await Sale.deleteMany({ lotNumber: 'TEST-ATTR-LOT' });
  });

  it('should persist and retrieve custom semantic attributes and rawAttributes on Sale document', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const sale = new Sale({
      supplierId,
      lotNumber: 'TEST-ATTR-LOT',
      sku: 'SKU-ATTR-1',
      description: 'Attribute Test Item',
      quantityCases: 50,
      pricePerCase: 10,
      totalValue: 500,
      attributes: new Map<string, any>([
        ['revenueMean', 250],
        ['revenueSharePct', 15.5],
        ['customTag', 'Surplus Batch']
      ]),
      rawAttributes: new Map<string, any>([
        ['Raw_Gross', '$500.00']
      ])
    });

    const saved = await sale.save();
    const fetched = await Sale.findById(saved._id);

    expect(fetched).toBeDefined();
    expect(fetched!.attributes).toBeDefined();
    expect(fetched!.attributes?.get('revenueMean')).toBe(250);
    expect(fetched!.attributes?.get('revenueSharePct')).toBe(15.5);
    expect(fetched!.attributes?.get('customTag')).toBe('Surplus Batch');
    expect(fetched!.rawAttributes?.get('Raw_Gross')).toBe('$500.00');
  });
});
