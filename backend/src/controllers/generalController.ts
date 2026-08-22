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

export async function getCurrentSupplier(req: Request, res: Response) {
  try {
    const authReq = req as any;
    const emailParam = (req.query.email as string) || req.body?.email || authReq.user?.email;
    const userId = authReq.user?.uid;

    if (!emailParam) {
      return res.status(400).json({ error: 'User email or authentication token is required to resolve current supplier.' });
    }

    const email = String(emailParam).trim().toLowerCase();
    let supplier = await Supplier.findOne({ email });

    if (!supplier) {
      // Format friendly supplier name from email
      const localPart = email.split('@')[0] || 'Supplier';
      const cleanName = localPart
        .replace(/[._-]+/g, ' ')
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const name = cleanName || 'Supplier';

      // Generate a unique company code
      const prefix = localPart.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'SUP';
      let companyCode = `SUP-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await Supplier.findOne({ companyCode });
        if (!existing) {
          isUnique = true;
        } else {
          companyCode = `SUP-${prefix}-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
          attempts++;
        }
      }

      supplier = new Supplier({
        name,
        companyCode,
        preferredDisposition: 'sell',
        active: true,
        email,
        userId: userId || undefined
      });

      await supplier.save();
    }

    return res.status(200).json(supplier);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getSuppliers(req: Request, res: Response) {
  try {
    console.log("--------------------------------Getting Suppliers In Method")
    const authReq = req as any;
    const emailParam = (req.query.email as string) || authReq.user?.email;

    let userSupplier = null;
    if (emailParam) {
      const email = String(emailParam).trim().toLowerCase();
      userSupplier = await Supplier.findOne({ email });
      if (!userSupplier) {
        const localPart = email.split('@')[0] || 'Supplier';
        const cleanName = localPart
          .replace(/[._-]+/g, ' ')
          .split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        const name = cleanName || 'Supplier';
        const prefix = localPart.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'SUP';
        const companyCode = `SUP-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

        userSupplier = new Supplier({
          name,
          companyCode,
          preferredDisposition: 'sell',
          active: true,
          email,
          userId: authReq.user?.uid || undefined
        });
        await userSupplier.save();
      }
    }

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

    if (userSupplier) {
      const existsIndex = suppliers.findIndex(s => s._id.toString() === userSupplier!._id.toString());
      if (existsIndex > -1) {
        suppliers.splice(existsIndex, 1);
      }
      suppliers.unshift(userSupplier);
    }

    console.log("-------- ------- -------- -------Found Suppliers ", suppliers && suppliers.length ? suppliers.length : 0);
    return res.json(suppliers);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getBuyers(req: Request, res: Response) {
  try {
    const authReq = req as any;
    let supplierId = req.query.supplierId as string;

    if (!supplierId && (authReq.user?.email || req.query.email)) {
      const email = String(authReq.user?.email || req.query.email).trim().toLowerCase();
      const userSupplier = await Supplier.findOne({ email });
      if (userSupplier) {
        supplierId = userSupplier._id.toString();
      } else {
        // If user is authenticated but has no supplier provisioned yet, return empty list
        return res.json([]);
      }
    }

    const showAll = req.query.all === 'true';
    const query: any = showAll ? {} : { isActive: { $ne: false } };
    if (supplierId) {
      query.supplierId = supplierId;
    }
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
    const authReq = req as any;
    let supplierId = req.body.supplierId || req.query.supplierId;
    if (!supplierId && (authReq.user?.email || req.query.email)) {
      const email = String(authReq.user?.email || req.query.email).trim().toLowerCase();
      const userSupplier = await Supplier.findOne({ email });
      if (userSupplier) {
        supplierId = userSupplier._id.toString();
      }
    }

    const {
      companyName, email, tier, acceptsShortDated, minShelfLife,
      categories, transportRadius, warehouseLocations, excludedAllergens,
      phone, address, notes, optInBidding, optInSales
    } = req.body;

    if (!companyName || !email) {
      return res.status(400).json({ error: 'companyName and email are required.' });
    }
    const newBuyer = new Buyer({
      companyName,
      email: email.trim().toLowerCase(),
      tier: tier || 'tier1',
      isVerified: true,
      acceptsShortDated: acceptsShortDated !== undefined ? acceptsShortDated : true,
      minShelfLife: minShelfLife || 7,
      categories: categories || ['Dairy', 'Produce', 'Dry Goods'],
      transportRadius: transportRadius || 100,
      warehouseLocations: warehouseLocations || [{ lat: 40.7128, lng: -74.0060 }],
      excludedAllergens: excludedAllergens || [],
      phone,
      address,
      notes,
      optInBidding: optInBidding !== undefined ? optInBidding : true,
      optInSales: optInSales !== undefined ? optInSales : true,
      ...(supplierId ? { supplierId } : {})
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
