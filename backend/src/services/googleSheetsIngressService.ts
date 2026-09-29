import mongoose from 'mongoose';
import crypto from 'crypto';
import GoogleSheetsSyncConfig, { IGoogleSheetsSyncConfig } from '../models/GoogleSheetsSyncConfig';
import Supplier from '../models/Supplier';
import SupplierTemplate from '../models/SupplierTemplate';
import DistributionCenter from '../models/DistributionCenter';
import ProductMaster from '../models/ProductMaster';
import InventoryLot from '../models/InventoryLot';
import { suggestMappings } from '../utils/mapper';

export interface IngressPayload {
  spreadsheetId?: string;
  sheetName?: string;
  headers?: string[];
  rows?: string[][];
}

export interface IngressResult {
  success: boolean;
  syncStatus: 'success' | 'error';
  lastSyncedAt: Date;
  metrics: {
    totalRows: number;
    inserted: number;
    updated: number;
    depleted: number;
    errors: string[];
  };
}

export async function validateIngressKey(ingressKey?: string): Promise<IGoogleSheetsSyncConfig | null> {
  if (!ingressKey || typeof ingressKey !== 'string' || ingressKey.trim().length === 0) {
    return null;
  }
  return GoogleSheetsSyncConfig.findOne({ ingressKey: ingressKey.trim() });
}

function parseDate(rawDate?: string): Date | undefined {
  if (!rawDate) return undefined;
  let parsed = new Date(rawDate);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  // Try MM/DD/YYYY or DD-MM-YYYY
  const parts = rawDate.split(/[\/\-]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    const candidate = new Date(p2 < 100 ? 2000 + p2 : p2, p0 - 1, p1);
    if (!isNaN(candidate.getTime())) {
      return candidate;
    }
  }
  return undefined;
}

export async function processGoogleSheetsWebhook(
  config: IGoogleSheetsSyncConfig,
  payload: IngressPayload
): Promise<IngressResult> {
  const now = new Date();
  const rawHeaders = payload.headers || [];
  const rawRows = payload.rows || [];

  const metrics = {
    totalRows: rawRows.length,
    inserted: 0,
    updated: 0,
    depleted: 0,
    errors: [] as string[]
  };

  const supplierId = config.supplierId;

  // Resolve Template column mappings or fallback to canonical suggestMappings
  let columnMappings: Record<string, string> = {};
  if (config.supplierTemplateId) {
    const template = await SupplierTemplate.findById(config.supplierTemplateId);
    if (template && template.columnMappings) {
      columnMappings = template.columnMappings instanceof Map
        ? Object.fromEntries(template.columnMappings)
        : (template.columnMappings as any);
    }
  }

  if (Object.keys(columnMappings).length === 0) {
    const template = await SupplierTemplate.findOne({ supplierId });
    if (template && template.columnMappings) {
      columnMappings = template.columnMappings instanceof Map
        ? Object.fromEntries(template.columnMappings)
        : (template.columnMappings as any);
    }
  }

  if (Object.keys(columnMappings).length === 0 || Object.values(columnMappings).every(v => !v)) {
    columnMappings = suggestMappings(rawHeaders);
  }

  // Build header-to-index lookup
  const cleanHeaders = rawHeaders.map(h => (h ? h.trim().toLowerCase() : ''));
  const getColIndex = (mappedHeaderOrKey?: string, fallbacks: string[] = []): number => {
    if (mappedHeaderOrKey) {
      const idx = cleanHeaders.indexOf(mappedHeaderOrKey.trim().toLowerCase());
      if (idx !== -1) return idx;
    }
    for (const fb of fallbacks) {
      const idx = cleanHeaders.indexOf(fb.toLowerCase());
      if (idx !== -1) return idx;
      const fuzzyIdx = cleanHeaders.findIndex(h => h.includes(fb.toLowerCase()));
      if (fuzzyIdx !== -1) return fuzzyIdx;
    }
    return -1;
  };

  const skuIdx = getColIndex(columnMappings.sku, ['sku', 'sku code', 'product id', 'item code']);
  const descIdx = getColIndex(columnMappings.description, ['description', 'item description', 'product name', 'item name']);
  const lotIdx = getColIndex(columnMappings.lotNumber, ['lot', 'lot number', 'lot no', 'batch', 'batch number']);
  const qtyIdx = getColIndex(columnMappings.quantityCases || columnMappings.quantity, ['quantity cases', 'quantity', 'qty', 'cases', 'volume']);
  const priceIdx = getColIndex(columnMappings.standardSellPrice || columnMappings.originalPrice, ['unit price', 'price', 'cost', 'sell price', 'standard price']);
  const expIdx = getColIndex(columnMappings.expirationDate, ['expiry date', 'exp date', 'expiration', 'expiration date', 'expiry']);
  const catIdx = getColIndex(columnMappings.category, ['category', 'cat', 'department']);
  const subCatIdx = getColIndex(columnMappings.subCategory, ['sub category', 'subcategory', 'subcat']);
  const mfgIdx = getColIndex(columnMappings.productionDate, ['mfg date', 'production date', 'manufacture date']);

  // Resolve supplier Distribution Center
  let dc = await DistributionCenter.findOne({ supplierId });
  if (!dc) {
    const supplier = await Supplier.findById(supplierId);
    const supplierName = supplier?.name || 'Supplier';
    const companyCode = supplier?.companyCode || 'SUP';
    dc = await DistributionCenter.create({
      supplierId,
      name: `${supplierName} Primary DC`,
      code: `${companyCode}-MAIN-DC`,
      address: '100 Logistics Way, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });
  }

  const categoryDefaults: Record<string, number> = {
    'Dairy': 45,
    'Produce': 30,
    'Meat': 90,
    'Meat & Poultry': 90,
    'Beverages': 120,
    'Dry Goods': 180,
    'Frozen Foods': 180
  };

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !Array.isArray(row) || row.every(cell => !cell || !cell.trim())) {
      continue;
    }

    const rawSku = skuIdx !== -1 ? row[skuIdx]?.trim() : '';
    const rawDesc = descIdx !== -1 ? row[descIdx]?.trim() : '';
    const rawLotNumber = lotIdx !== -1 ? row[lotIdx]?.trim() : '';
    const rawQty = qtyIdx !== -1 ? row[qtyIdx]?.trim() : '';
    const rawPrice = priceIdx !== -1 ? row[priceIdx]?.trim() : '';
    const rawExp = expIdx !== -1 ? row[expIdx]?.trim() : '';
    const rawCategory = catIdx !== -1 ? row[catIdx]?.trim() : '';
    const rawSubCategory = subCatIdx !== -1 ? row[subCatIdx]?.trim() : '';
    const rawMfg = mfgIdx !== -1 ? row[mfgIdx]?.trim() : '';

    let finalSku = rawSku;
    if (!finalSku && rawDesc) {
      finalSku = rawDesc
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    if (!finalSku && !rawDesc) {
      metrics.errors.push(`Row ${i + 1}: Missing SKU and Description.`);
      continue;
    }

    const parsedQty = parseInt((rawQty || '0').replace(/,/g, ''), 10) || 0;
    const parsedPrice = parseFloat((rawPrice || '0').replace(/[$,]/g, '')) || 0;
    let expirationDate = parseDate(rawExp);
    if (!expirationDate) {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
    }
    const productionDate = parseDate(rawMfg);

    const category = rawCategory || 'Dry Goods';
    const defaultShelfLife = categoryDefaults[category] || 90;

    // Find or create ProductMaster
    let product = await ProductMaster.findOne({ supplierId, sku: finalSku });
    if (!product) {
      product = await ProductMaster.create({
        supplierId,
        sku: finalSku,
        category,
        subCategory: rawSubCategory || undefined,
        description: rawDesc || finalSku,
        shelfLifeDays: defaultShelfLife
      });
    } else {
      if (rawDesc && rawDesc !== product.description) {
        product.description = rawDesc;
      }
      if (rawCategory && rawCategory !== product.category) {
        product.category = rawCategory;
      }
      await product.save();
    }

    const finalLotNumber = rawLotNumber || `LOT-${finalSku}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Calculate remaining shelf life
    const diffTime = expirationDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    let totalShelfDays = product.shelfLifeDays || defaultShelfLife;
    if (productionDate) {
      const totalDiff = expirationDate.getTime() - productionDate.getTime();
      const calcDays = Math.ceil(totalDiff / (1000 * 60 * 60 * 24));
      if (calcDays > 0) totalShelfDays = calcDays;
    }
    const remainingShelfLife = Math.min(1.0, Math.max(0.0, Number((daysRemaining / totalShelfDays).toFixed(4))));

    // Composite natural key matching: sku + lotNumber
    const existingLot = await InventoryLot.findOne({
      supplierId,
      productId: product._id,
      lotNumber: finalLotNumber
    });

    if (!existingLot) {
      const isDepleted = parsedQty <= 0;
      await InventoryLot.create({
        supplierId,
        distributionCenterId: dc._id,
        productId: product._id,
        lotNumber: finalLotNumber,
        productionDate,
        expirationDate,
        remainingShelfLife,
        quantityCases: Math.max(0, parsedQty),
        availableQty: Math.max(0, parsedQty),
        costPerCase: parsedPrice,
        standardSellPrice: parsedPrice,
        status: isDepleted ? 'depleted' : 'active'
      });
      metrics.inserted++;
      if (isDepleted) {
        metrics.depleted++;
      }
    } else {
      existingLot.costPerCase = parsedPrice;
      existingLot.standardSellPrice = parsedPrice;
      existingLot.expirationDate = expirationDate;
      existingLot.remainingShelfLife = remainingShelfLife;
      if (productionDate) {
        existingLot.productionDate = productionDate;
      }

      if (parsedQty <= 0) {
        existingLot.quantityCases = 0;
        existingLot.availableQty = 0;
        existingLot.status = 'depleted';
        metrics.depleted++;
      } else {
        existingLot.quantityCases = parsedQty;
        existingLot.availableQty = parsedQty;
        if (existingLot.status === 'depleted') {
          existingLot.status = 'active';
        }
        metrics.updated++;
      }
      await existingLot.save();
    }
  }

  config.syncStatus = 'success';
  config.lastSyncedAt = now;
  config.lastSyncMetrics = metrics;
  await config.save();

  return {
    success: true,
    syncStatus: 'success',
    lastSyncedAt: now,
    metrics
  };
}
