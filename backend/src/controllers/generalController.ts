import { Request, Response } from 'express';
import Supplier from '../models/Supplier';
import Buyer from '../models/Buyer';
import DocumentImport from '../models/DocumentImport';
import ProductMaster from '../models/ProductMaster';

export async function getHealth(req: Request, res: Response) {
  try {
    return res.status(200).json({ status: 'OK', message: 'Express backend is healthy.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getSuppliers(req: Request, res: Response) {
  try {
    let suppliers = await Supplier.find({ active: true });
    if (!suppliers || suppliers.length === 0) {
      suppliers = await Supplier.find({});
    }
    if (!suppliers || suppliers.length === 0) {
      const defaultData = [
        { name: 'Unilever', companyCode: 'ULVR', preferredDisposition: 'sell' as const, active: true },
        { name: 'Danone North America', companyCode: 'DANONE', preferredDisposition: 'sell' as const, active: true },
        { name: 'Kraft Heinz', companyCode: 'KRAFT', preferredDisposition: 'sell' as const, active: true },
        { name: 'General Mills', companyCode: 'GIS', preferredDisposition: 'sell' as const, active: true },
        { name: 'Nestlé USA', companyCode: 'NESTLE', preferredDisposition: 'sell' as const, active: true },
      ];
      suppliers = await Supplier.insertMany(defaultData);
    }
    console.log("-------- ------- -------- -------Found Suppliers ", suppliers && suppliers.length ? suppliers.length : 0);
    return res.json(suppliers);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getBuyers(req: Request, res: Response) {
  try {
    const showAll = req.query.all === 'true';
    const query = showAll ? {} : { isActive: { $ne: false } };
    const buyers = await Buyer.find(query);
    return res.json(buyers);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getBuyerById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const buyer = await Buyer.findById(id);
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found.' });
    }
    // Attach email thread count via dynamic import to avoid circular deps
    let emailThreadCount = 0;
    try {
      const EmailThread = (await import('../models/EmailThread')).default;
      emailThreadCount = await (EmailThread as any).countDocuments({ buyerEmail: buyer.email });
    } catch (_) {}
    return res.json({ ...buyer.toObject(), emailThreadCount });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateBuyer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      companyName, email, tier, phone, address, notes,
      acceptsShortDated, minShelfLife, categories,
      transportRadius, optInBidding, optInSales
    } = req.body;

    const updateFields: Record<string, any> = {};
    if (companyName !== undefined) updateFields.companyName = companyName;
    if (email !== undefined) updateFields.email = email;
    if (tier !== undefined) updateFields.tier = tier;
    if (phone !== undefined) updateFields.phone = phone;
    if (address !== undefined) updateFields.address = address;
    if (notes !== undefined) updateFields.notes = notes;
    if (acceptsShortDated !== undefined) updateFields.acceptsShortDated = acceptsShortDated;
    if (minShelfLife !== undefined) updateFields.minShelfLife = minShelfLife;
    if (categories !== undefined) updateFields.categories = categories;
    if (transportRadius !== undefined) updateFields.transportRadius = transportRadius;
    if (optInBidding !== undefined) updateFields.optInBidding = optInBidding;
    if (optInSales !== undefined) updateFields.optInSales = optInSales;

    const buyer = await Buyer.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found.' });
    }
    return res.json(buyer);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A buyer with this email already exists.' });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function deactivateBuyer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const buyer = await Buyer.findByIdAndUpdate(
      id,
      {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedReason: reason || null
      },
      { new: true }
    );
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found.' });
    }
    return res.json(buyer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function reactivateBuyer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const buyer = await Buyer.findByIdAndUpdate(
      id,
      {
        isActive: true,
        $unset: { deactivatedAt: '', deactivatedReason: '' }
      },
      { new: true }
    );
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found.' });
    }
    return res.json(buyer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createBuyer(req: Request, res: Response) {
  try {
    const { companyName, email, tier, acceptsShortDated, minShelfLife, categories, transportRadius, warehouseLocations, excludedAllergens } = req.body;
    if (!companyName || !email) {
      return res.status(400).json({ error: 'companyName and email are required.' });
    }
    const newBuyer = new Buyer({
      companyName,
      email,
      tier: tier || 'tier1',
      isVerified: true,
      acceptsShortDated: acceptsShortDated !== undefined ? acceptsShortDated : true,
      minShelfLife: minShelfLife || 7,
      categories: categories || ['Dairy', 'Produce', 'Dry Goods'],
      transportRadius: transportRadius || 100,
      warehouseLocations: warehouseLocations || [{ lat: 40.7128, lng: -74.0060 }],
      excludedAllergens: excludedAllergens || []
    });
    await newBuyer.save();
    return res.status(201).json(newBuyer);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A buyer with this email already exists.' });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function getImports(req: Request, res: Response) {
  try {
    const imports = await DocumentImport.find().sort({ createdAt: -1 });
    return res.json(imports);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateProductAllergens(req: Request, res: Response) {
  const { id } = req.params;
  const { allergens } = req.body;
  try {
    const product = await ProductMaster.findByIdAndUpdate(
      id,
      { allergens: allergens || [] },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateBuyerExclusions(req: Request, res: Response) {
  const { id } = req.params;
  const { excludedAllergens } = req.body;
  try {
    const buyer = await Buyer.findByIdAndUpdate(
      id,
      { excludedAllergens: excludedAllergens || [] },
      { new: true }
    );
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found.' });
    }
    return res.json(buyer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function seedDataController(req: Request, res: Response) {
  try {
    const { seedDatabase } = await import('../utils/seeder');
    const force = req.body?.force === true || req.query?.force === 'true';
    await seedDatabase(force);
    return res.status(200).json({ status: 'OK', message: 'Database seeded successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
