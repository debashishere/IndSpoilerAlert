import mongoose from 'mongoose';
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import DocumentImport from '../models/DocumentImport';
import Supplier from '../models/Supplier';
import SupplierTemplate from '../models/SupplierTemplate';
import DistributionCenter from '../models/DistributionCenter';
import ProductMaster from '../models/ProductMaster';
import InventoryLot from '../models/InventoryLot';
import Buyer from '../models/Buyer';
import BuyerList from '../models/BuyerList';
import Sale from '../models/Sale';
import { suggestMappings } from '../utils/mapper';
import { uploadToS3, sendSQSMessage } from '../utils/aws';
import { translateAttributes } from './translatorService';

const SIDECAR_URL = process.env.SIDECAR_URL || 'http://localhost:8000';

export async function ensureValidSupplierId(supplierId?: string): Promise<string> {
  if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
    return supplierId;
  }

  let supplier = await Supplier.findOne({
    $or: [
      { companyCode: 'ULVR' },
      { name: /unilever/i }
    ]
  });

  if (!supplier) {
    supplier = await Supplier.findOne({});
  }

  if (!supplier) {
    supplier = await Supplier.create({
      name: 'Unilever',
      companyCode: 'ULVR',
      preferredDisposition: 'sell',
      active: true
    });
  }

  return supplier._id.toString();
}

export async function findDocumentImport(id?: string) {
  let docImport = null;
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    docImport = await DocumentImport.findById(id);
  }
  if (!docImport && id) {
    docImport = await DocumentImport.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { fileName: id }
      ]
    });
  }
  if (!docImport) {
    docImport = await DocumentImport.findOne({
      rawGrid: { $exists: true, $not: { $size: 0 } }
    }).sort({ createdAt: -1 });
  }
  return docImport;
}


export async function queueUploadAndParseFile(
  filePath: string,
  originalName: string,
  mimetype: string,
  supplierId?: string
) {
  let checksum = '';
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    checksum = hash.digest('hex');
  } catch (err) {
    console.error('Error calculating checksum:', err);
  }

  const s3Bucket = 'spoiler-alert-surplus';
  const s3Key = `uploads/${Date.now()}-${originalName}`;

  const docImport = new DocumentImport({
    fileName: originalName,
    checksum,
    status: 'queued',
    supplierId: supplierId || undefined,
    s3Bucket,
    s3Key,
    importErrors: []
  });

  await docImport.save();

  try {
    await uploadToS3(filePath, s3Bucket, s3Key);

    const payload = {
      ingestionJobId: docImport._id.toString(),
      s3Bucket,
      s3Key,
      fileName: originalName,
      mimetype,
      supplierId: supplierId || undefined
    };
    await sendSQSMessage('spoiler-alert-ingestion-jobs', payload);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      ingestionJobId: docImport._id.toString()
    };
  } catch (err: any) {
    console.error('Error in queueUploadAndParseFile:', err.message || err);
    docImport.status = 'error';
    docImport.importErrors = [err.message || 'Failed during upload queuing'];
    await docImport.save();

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw err;
  }
}

export async function getIngestionJobStatus(id: string) {
  const docImport = await findDocumentImport(id);
  if (!docImport) {
    throw new Error('Ingestion job not found.');
  }
  const obj = docImport.toObject();
  return {
    ...obj,
    documentId: docImport._id.toString()
  };
}

export async function handleIngestCallback(payload: {
  ingestionJobId: string;
  status: 'parsing' | 'parsed' | 'error';
  rawGrid?: string[][];
  importErrors?: string[];
}) {
  const { ingestionJobId, status, rawGrid, importErrors } = payload;
  const docImport = await findDocumentImport(ingestionJobId);
  if (!docImport) {
    throw new Error('Document import job not found.');
  }

  docImport.status = status;
  if (status === 'parsed' && rawGrid) {
    docImport.rawGrid = rawGrid;

    const headers = rawGrid.length > 0 ? rawGrid[0] : [];
    const isSales = headers.some((h: string) =>
      h && typeof h === 'string' && /invoice|brand|revenue|sold|buyer|customer|receipt|sale|order|per_case|unit_price/i.test(h)
    );

    // Fuzzy mapping guess or template match
    let suggestedMapping: Record<string, string> = {};
    const supplierId = docImport.supplierId;
    if (supplierId && !isSales) {
      const template = await SupplierTemplate.findOne({ supplierId });
      if (template && template.columnMappings) {
        const savedMappings = template.columnMappings instanceof Map
          ? Object.fromEntries(template.columnMappings)
          : template.columnMappings;
        suggestedMapping = { ...savedMappings };
      }
    }
    
    if (Object.keys(suggestedMapping).length === 0 || Object.values(suggestedMapping).every(v => !v)) {
      suggestedMapping = suggestMappings(headers);
    }
    docImport.suggestedMapping = suggestedMapping;
  } else if (status === 'error') {
    docImport.importErrors = importErrors || ['Extraction failed'];
  }

  await docImport.save();
  return docImport;
}



export function parseCsvToGrid(fileContent: string): string[][] {
  const lines = fileContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.map((line) => {
    const row: string[] = [];
    let insideQuotes = false;
    let currentToken = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        row.push(currentToken.trim().replace(/^"|"$/g, ''));
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    row.push(currentToken.trim().replace(/^"|"$/g, ''));
    return row;
  });
}

export async function uploadAndParseFile(
  filePath: string,
  originalName: string,
  mimetype: string,
  supplierId?: string
) {
  // Calculate file checksum
  let checksum = '';
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    checksum = hash.digest('hex');
  } catch (err) {
    console.error('Error calculating checksum:', err);
  }

  // Create DocumentImport record
  const docImport = new DocumentImport({
    fileName: originalName,
    checksum,
    status: 'uploaded',
    supplierId: supplierId || undefined,
    importErrors: []
  });

  await docImport.save();

  try {
    let rawGrid: string[][] = [];
    const isCsv = originalName.toLowerCase().endsWith('.csv') || (mimetype && mimetype.includes('csv'));

    if (isCsv) {
      try {
        const fileText = fs.readFileSync(filePath, 'utf-8');
        rawGrid = parseCsvToGrid(fileText);
      } catch (csvErr: any) {
        console.warn('Native CSV parse error, falling back to sidecar:', csvErr.message);
      }
    }

    if (rawGrid.length === 0) {
      // Send file to Python sidecar
      console.log(`Forwarding file to Python sidecar at: ${SIDECAR_URL}/parse-document`);
      const fileBuffer = fs.readFileSync(filePath);
      const fileBlob = new Blob([fileBuffer], { type: mimetype });
      
      const formData = new FormData();
      formData.append('file', fileBlob, originalName);

      const sidecarRes = await axios.post(`${SIDECAR_URL}/parse-document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const sidecarData = sidecarRes.data;
      if (!sidecarData.tables || sidecarData.tables.length === 0) {
        throw new Error('No tables extracted from the document by Python sidecar.');
      }

      // Process the first table
      const table = sidecarData.tables[0];
      rawGrid = [table.headers, ...table.rows];
    }

    const headers = rawGrid.length > 0 ? rawGrid[0] : [];
    const isSales = headers.some((h: string) =>
      h && typeof h === 'string' && /invoice|brand|revenue|sold|buyer|customer|receipt|sale|order|per_case|unit_price/i.test(h)
    );

    // Fuzzy mapping guess or template match
    let suggestedMapping: Record<string, string> = {};
    if (supplierId && !isSales) {
      const template = await SupplierTemplate.findOne({ supplierId });
      if (template && template.columnMappings) {
        const savedMappings = template.columnMappings instanceof Map
          ? Object.fromEntries(template.columnMappings)
          : template.columnMappings;
        suggestedMapping = { ...savedMappings };
      }
    }
    
    // Fallback to fuzzy mapper
    if (Object.keys(suggestedMapping).length === 0 || Object.values(suggestedMapping).every(v => !v)) {
      suggestedMapping = suggestMappings(headers);
    }

    // Update document status to parsed
    docImport.status = 'parsed';
    docImport.rawGrid = rawGrid;
    docImport.suggestedMapping = suggestedMapping;
    if (supplierId) {
      docImport.supplierId = supplierId;
    }
    await docImport.save();

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      documentId: docImport._id,
      fileName: docImport.fileName,
      rawGrid,
      suggestedMapping
    };

  } catch (error: any) {
    console.error('Error parsing document:', error.message || error);
    
    docImport.status = 'error';
    docImport.importErrors = [error.message || 'Unknown error occurred during parsing'];
    await docImport.save();

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    throw error;
  }
}

export async function confirmIngestion(
  documentId: string,
  supplierId: string,
  mappings: any,
  saveTemplate: boolean,
  templateName?: string,
  semanticRulesInput?: any[]
) {
  supplierId = await ensureValidSupplierId(supplierId);
  const docImport = await findDocumentImport(documentId);
  if (!docImport) {
    throw new Error('Document import not found.');
  }

  if (!docImport.rawGrid || docImport.rawGrid.length < 2) {
    throw new Error('Document does not contain any data rows.');
  }

  const headers = docImport.rawGrid[0];
  const skuHeader = mappings.sku;
  const descHeader = mappings.description;
  const qtyHeader = mappings.quantityCases || mappings.quantity;
  const expHeader = mappings.expirationDate;
  const priceHeader = mappings.originalPrice;
  const lotNumberHeader = mappings.lotNumber;
  const productionDateHeader = mappings.productionDate;
  const categoryHeader = mappings.category;
  const standardSellPriceHeader = mappings.standardSellPrice;
  const warehouseHeader = mappings.warehouse;
  const commentHeader = mappings.comment;

  const skuIdx = skuHeader ? headers.indexOf(skuHeader) : -1;
  const descIdx = descHeader ? headers.indexOf(descHeader) : -1;
  const qtyIdx = qtyHeader ? headers.indexOf(qtyHeader) : -1;
  const expIdx = expHeader ? headers.indexOf(expHeader) : -1;
  const priceIdx = priceHeader ? headers.indexOf(priceHeader) : -1;
  const lotNumberIdx = lotNumberHeader ? headers.indexOf(lotNumberHeader) : -1;
  const productionDateIdx = productionDateHeader ? headers.indexOf(productionDateHeader) : -1;
  const categoryIdx = categoryHeader ? headers.indexOf(categoryHeader) : -1;
  const standardSellPriceIdx = standardSellPriceHeader ? headers.indexOf(standardSellPriceHeader) : -1;
  const warehouseIdx = warehouseHeader ? headers.indexOf(warehouseHeader) : -1;
  const commentIdx = commentHeader ? headers.indexOf(commentHeader) : -1;

  // Determine unmapped headers list
  const mappedHeadersList = Object.values(mappings).filter(Boolean) as string[];
  const unmappedColumnIndices: { header: string; idx: number }[] = [];
  headers.forEach((header, idx) => {
    if (!mappedHeadersList.includes(header)) {
      unmappedColumnIndices.push({ header, idx });
    }
  });

  // Save column layout template if requested
  if (saveTemplate) {
    const nameOfTemplate = templateName || `Template_${Date.now()}`;
    const updatePayload: Record<string, any> = {
      supplierId,
      templateName: nameOfTemplate,
      columnMappings: mappings
    };
    if (Array.isArray(semanticRulesInput)) {
      updatePayload.semanticRules = semanticRulesInput;
    }
    await SupplierTemplate.findOneAndUpdate(
      { supplierId },
      updatePayload,
      { upsert: true, new: true }
    );
  }


  // Find supplier distribution center (DC)
  let dc = await DistributionCenter.findOne({ supplierId });
  if (!dc) {
    const supplier = await Supplier.findById(supplierId);
    const supplierName = supplier?.name || 'Unknown';
    const companyCode = supplier?.companyCode || 'SUP';
    
    dc = new DistributionCenter({
      supplierId,
      name: `${supplierName} Default DC`,
      code: `${companyCode}-DEFAULT-DC`,
      address: '100 Logistics Way, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });
    await dc.save();
  }
  const distributionCenterId = dc._id;

  const lotIds: string[] = [];
  const rows = docImport.rawGrid.slice(1);
  const importErrors: string[] = [];

  const existingTemplate = await SupplierTemplate.findOne({ supplierId });
  const semanticRules = Array.isArray(semanticRulesInput) ? semanticRulesInput : (existingTemplate?.semanticRules || []);


  for (let i = 0; i < rows.length; i++) {

    const row = rows[i];
    const rawSku = skuIdx !== -1 ? row[skuIdx]?.trim() : '';
    const rawDesc = descIdx !== -1 ? row[descIdx]?.trim() : '';
    const rawQty = qtyIdx !== -1 ? row[qtyIdx]?.trim() : '';
    const rawExp = expIdx !== -1 ? row[expIdx]?.trim() : '';
    const rawPrice = priceIdx !== -1 ? row[priceIdx]?.trim() : '';
    const rawLotNumber = lotNumberIdx !== -1 ? row[lotNumberIdx]?.trim() : '';
    const rawProductionDate = productionDateIdx !== -1 ? row[productionDateIdx]?.trim() : '';
    const rawCategory = categoryIdx !== -1 ? row[categoryIdx]?.trim() : '';
    const rawListPrice = standardSellPriceIdx !== -1 ? row[standardSellPriceIdx]?.trim() : '';
    const rawWarehouse = warehouseIdx !== -1 ? row[warehouseIdx]?.trim() : '';
    const rawComment = commentIdx !== -1 ? row[commentIdx]?.trim() : '';

    if (!rawSku && !rawDesc) {
      // Skip entirely empty row
      continue;
    }

    let finalSku = rawSku;
    if (!finalSku && rawDesc) {
      // Fallback: generate unique reproducible SKU from description
      finalSku = rawDesc
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (!finalSku) {
        finalSku = 'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      }
    }

    if (!finalSku || !rawDesc) {
      importErrors.push(`Row ${i + 1}: Missing SKU or Description.`);
      continue;
    }

    // Parse quantity and price
    const quantityCases = parseInt(rawQty ? rawQty.replace(/,/g, '') : '0', 10) || 0;
    const costPerCase = parseFloat(rawPrice ? rawPrice.replace(/[$,]/g, '') : '0') || 0;
    const listPrice = parseFloat(rawListPrice ? rawListPrice.replace(/[$,]/g, '') : '0') || costPerCase;

    // Parse expiration date
    let expirationDate = new Date(rawExp);
    if (isNaN(expirationDate.getTime()) && rawExp) {
      // Try common formats (e.g., MM/DD/YYYY or DD-MM-YYYY)
      const dateParts = rawExp.split(/[\/\-]/);
      if (dateParts.length === 3) {
        const part0 = parseInt(dateParts[0], 10);
        const part1 = parseInt(dateParts[1], 10);
        const part2 = parseInt(dateParts[2], 10);
        const candidate = new Date(part2 < 100 ? 2000 + part2 : part2, part0 - 1, part1);
        if (!isNaN(candidate.getTime())) {
          expirationDate = candidate;
        }
      }
    }

    if (isNaN(expirationDate.getTime())) {
      // Default to 30 days out if invalid/empty
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
    }

    // Parse production date
    let productionDate: Date | undefined = undefined;
    if (rawProductionDate) {
      const parsedMfg = new Date(rawProductionDate);
      if (!isNaN(parsedMfg.getTime())) {
        productionDate = parsedMfg;
      } else {
        // Try common formats (e.g. YYYY-MM-DD, MM/DD/YYYY)
        const dateParts = rawProductionDate.split(/[\/\-]/);
        if (dateParts.length === 3) {
          const part0 = parseInt(dateParts[0], 10);
          const part1 = parseInt(dateParts[1], 10);
          const part2 = parseInt(dateParts[2], 10);
          const candidate = new Date(part2 < 100 ? 2000 + part2 : part2, part0 - 1, part1);
          if (!isNaN(candidate.getTime())) {
            productionDate = candidate;
          }
        }
      }
    }

    // Resolve warehouse / distribution center dynamically
    let rowDistributionCenterId = distributionCenterId;
    if (rawWarehouse) {
      let rowDc = await DistributionCenter.findOne({ supplierId, name: rawWarehouse });
      if (!rowDc) {
        rowDc = new DistributionCenter({
          supplierId,
          name: rawWarehouse,
          code: `${dc.code.split('-')[0]}-${rawWarehouse.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-DC`,
          address: `${rawWarehouse}, United States`,
          coordinates: { lat: 39.8283, lng: -98.5795 }, // Midpoint USA
          coldStorage: true
        });
        await rowDc.save();
      }
      rowDistributionCenterId = rowDc._id;
    }

    // Call sidecar to normalize name and category
    let clean_name = rawDesc;
    let category = rawCategory || 'Dry Goods';
    if (!rawCategory) {
      try {
        const sidecarRes = await axios.post(`${SIDECAR_URL}/normalize-product-name`, {
          name: rawDesc
        });
        if (sidecarRes.data) {
          clean_name = sidecarRes.data.clean_name || rawDesc;
          category = sidecarRes.data.category || 'Dry Goods';
        }
      } catch (err: any) {
        console.error(`Error calling sidecar for row ${i + 1} normalization:`, err.message);
      }
    } else {
      try {
        const sidecarRes = await axios.post(`${SIDECAR_URL}/normalize-product-name`, {
          name: rawDesc
        });
        if (sidecarRes.data) {
          clean_name = sidecarRes.data.clean_name || rawDesc;
        }
      } catch (err: any) {
        console.error(`Error calling sidecar for name cleaning on row ${i + 1}:`, err.message);
      }
    }

    // Find or create ProductMaster
    let product = await ProductMaster.findOne({ supplierId, sku: finalSku });
    if (!product) {
      product = new ProductMaster({
        supplierId,
        sku: finalSku,
        category,
        description: clean_name,
        shelfLifeDays: 30
      });
      await product.save();
    } else {
      // update description/category if they have changed or to make sure it's up to date
      product.description = clean_name;
      product.category = category;
      await product.save();
    }

    // Calculate remaining shelf life proportion
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const shelfLifeDays = product.shelfLifeDays || 30;
    const remainingShelfLife = Math.min(1.0, Math.max(0.0, daysRemaining / shelfLifeDays));

    // Determine lot number (custom or generated)
    const lotNumber = rawLotNumber || `LOT-${finalSku}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Populate dynamic attributes via Dynamic Data Translator
    const rawUnmappedObject: Record<string, any> = {};

    for (const col of unmappedColumnIndices) {
      rawUnmappedObject[col.header] = row[col.idx]?.trim() || '';
    }
    const translated = translateAttributes(rawUnmappedObject, semanticRules as any);

    const attributes = new Map<string, any>(Object.entries(translated.attributes));
    const rawAttributes = new Map<string, any>(Object.entries(translated.rawAttributes));

    // Create InventoryLot
    const inventoryLot = new InventoryLot({
      supplierId,
      distributionCenterId: rowDistributionCenterId,
      productId: product._id,
      lotNumber,
      productionDate,
      expirationDate,
      remainingShelfLife,
      quantityCases,
      availableQty: quantityCases,
      costPerCase,
      standardSellPrice: listPrice,
      status: 'pending',
      comment: rawComment || '',
      attributes,
      rawAttributes
    });


    await inventoryLot.save();
    lotIds.push(inventoryLot._id.toString());
  }

  docImport.status = 'imported';
  docImport.supplierId = supplierId;
  docImport.recordsParsed = lotIds.length;
  docImport.importErrors = importErrors;
  await docImport.save();

  return {
    countImported: lotIds.length,
    lotIds,
    errors: importErrors
  };
}

export async function confirmSalesIngestion(
  documentId: string,
  supplierId: string,
  mappings: any,
  saveTemplate: boolean,
  templateName?: string
) {
  supplierId = await ensureValidSupplierId(supplierId);
  const docImport = await findDocumentImport(documentId);
  if (!docImport) {
    throw new Error('Document import not found.');
  }

  if (docImport.status === 'imported') {
    throw new Error('Document has already been imported.');
  }

  if (!docImport.rawGrid || docImport.rawGrid.length < 2) {
    throw new Error('Document does not contain any data rows.');
  }

  const headers = docImport.rawGrid[0];
  const skuHeader = mappings.sku;
  const lotNumberHeader = mappings.lotNumber;
  const buyerEmailHeader = mappings.buyerEmail || mappings.buyerName || mappings.buyer;
  const quantityHeader = mappings.quantity || mappings.quantityCases || mappings.cases;
  const priceHeader = mappings.price || mappings.salePrice || mappings.unitPrice || mappings.cost;
  const saleDateHeader = mappings.saleDate || mappings.soldDate || mappings.date;
  const invoiceNumberHeader = mappings.invoiceNumber || mappings.invoice;
  const productNameHeader = mappings.productName || mappings.description || mappings.product;
  const warehouseHeader = mappings.warehouse || mappings.dc || mappings.location;
  const revenueHeader = mappings.revenue || mappings.totalRevenue || mappings.totalValue;
  const brandHeader = mappings.brand || mappings.manufacturer;

  const skuIdx = skuHeader ? headers.indexOf(skuHeader) : -1;
  const lotNumberIdx = lotNumberHeader ? headers.indexOf(lotNumberHeader) : -1;
  const buyerEmailIdx = buyerEmailHeader ? headers.indexOf(buyerEmailHeader) : -1;
  const qtyIdx = quantityHeader ? headers.indexOf(quantityHeader) : -1;
  const priceIdx = priceHeader ? headers.indexOf(priceHeader) : -1;
  const saleDateIdx = saleDateHeader ? headers.indexOf(saleDateHeader) : -1;
  const invoiceNumberIdx = invoiceNumberHeader ? headers.indexOf(invoiceNumberHeader) : -1;
  const productNameIdx = productNameHeader ? headers.indexOf(productNameHeader) : -1;
  const warehouseIdx = warehouseHeader ? headers.indexOf(warehouseHeader) : -1;
  const revenueIdx = revenueHeader ? headers.indexOf(revenueHeader) : -1;
  const brandIdx = brandHeader ? headers.indexOf(brandHeader) : -1;

  // Save column layout template if requested
  if (saveTemplate) {
    const nameOfTemplate = templateName || `SalesTemplate_${Date.now()}`;
    await SupplierTemplate.findOneAndUpdate(
      { supplierId },
      {
        supplierId,
        templateName: nameOfTemplate,
        columnMappings: mappings
      },
      { upsert: true, new: true }
    );
  }

  const salesIds: string[] = [];
  const warnings: string[] = [];
  const importErrors: string[] = [];
  const rows = docImport.rawGrid.slice(1);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawSku = skuIdx !== -1 ? row[skuIdx]?.trim() : '';
    const rawLotNumber = lotNumberIdx !== -1 ? row[lotNumberIdx]?.trim() : '';
    const rawBuyerEmail = buyerEmailIdx !== -1 ? row[buyerEmailIdx]?.trim() : '';
    const rawQty = qtyIdx !== -1 ? row[qtyIdx]?.trim() : '';
    const rawPrice = priceIdx !== -1 ? row[priceIdx]?.trim() : '';
    const rawSaleDate = saleDateIdx !== -1 ? row[saleDateIdx]?.trim() : '';
    const rawInvoiceNumber = invoiceNumberIdx !== -1 ? row[invoiceNumberIdx]?.trim() : '';
    const rawProductName = productNameIdx !== -1 ? row[productNameIdx]?.trim() : '';
    const rawWarehouse = warehouseIdx !== -1 ? row[warehouseIdx]?.trim() : '';
    const rawRevenue = revenueIdx !== -1 ? row[revenueIdx]?.trim() : '';
    const rawBrand = brandIdx !== -1 ? row[brandIdx]?.trim() : '';

    if (!rawSku && !rawLotNumber) {
      continue; // Skip entirely empty row
    }

    const lotNumber = rawLotNumber ? rawLotNumber.trim() : '';
    if (!lotNumber) {
      warnings.push(`Row ${i + 1}: Lot Number not provided. Record will not be reconciled with inventory.`);
    }

    const quantityCases = parseInt(rawQty ? rawQty.replace(/,/g, '') : '0', 10) || 0;
    const pricePerCase = parseFloat(rawPrice ? rawPrice.replace(/[$,]/g, '') : '0') || 0;
    const parsedRevenue = parseFloat(rawRevenue ? rawRevenue.replace(/[$,]/g, '') : '0') || 0;
    const totalValue = parsedRevenue > 0 ? parsedRevenue : quantityCases * pricePerCase;

    let saleDate = new Date(rawSaleDate);
    if (isNaN(saleDate.getTime())) {
      saleDate = new Date();
    }

    // 1. Resolve or Auto-register Buyer
    let buyerId = null;
    let finalBuyerEmail = rawBuyerEmail || 'eveline94@ethereal.email';
    const emailLower = finalBuyerEmail.trim().toLowerCase();
    const isEmailFormat = emailLower.includes('@');

    const safeBuyerQuery = isEmailFormat
      ? { email: emailLower }
      : {
          $or: [
            { email: emailLower },
            { companyName: new RegExp('^' + finalBuyerEmail.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
          ]
        };

    let buyer = await Buyer.findOne(safeBuyerQuery);
    if (!buyer) {
      let emailToSave = emailLower;
      let derivedName = '';

      if (isEmailFormat) {
        const emailParts = emailLower.split('@');
        const prefix = emailParts[0];
        const domain = emailParts[1] ? emailParts[1].split('.')[0] : 'retailer';
        derivedName = domain
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        if (['gmail', 'yahoo', 'outlook', 'hotmail', 'protonmail'].includes(derivedName.toLowerCase())) {
          derivedName = prefix.charAt(0).toUpperCase() + prefix.slice(1) + ' Retail';
        }
      } else {
        derivedName = finalBuyerEmail;
        const cleanPrefix = finalBuyerEmail.toLowerCase().replace(/[^a-z0-9]/g, '');
        emailToSave = `${cleanPrefix || 'buyer'}@retailer.com`;
      }

      buyer = await Buyer.findOne({ email: emailToSave });
      if (!buyer) {
        buyer = new Buyer({
          companyName: derivedName,
          email: emailToSave,
          acceptsShortDated: true,
          minShelfLife: 5,
          categories: ['Dairy', 'Produce', 'Meat', 'Dry Goods', 'Beverages'],
          transportRadius: 150,
          warehouseLocations: [{ lat: 41.8781, lng: -87.6298 }]
        });
        await buyer.save();
      }
    }
    buyerId = buyer._id;

    // Row-level duplicate sale record prevention
    const dupQuery: any = {
      supplierId,
      sku: rawSku || 'UNKNOWN',
      quantityCases,
      totalValue,
      saleDate
    };
    if (rawInvoiceNumber) {
      dupQuery.invoiceNumber = rawInvoiceNumber;
    } else {
      dupQuery.lotNumber = lotNumber || 'UNKNOWN';
      dupQuery.buyerEmail = buyer.email;
    }

    const existingSale = await Sale.findOne(dupQuery);
    if (existingSale) {
      warnings.push(`Row ${i + 1}: Skipped duplicate sale record (Invoice: ${rawInvoiceNumber || 'N/A'}, SKU: ${dupQuery.sku}).`);
      continue;
    }

    // 2. Reconcile with Inventory Lot
    let lotId = null;
    let lot = null;
    let reconciliationWarning = '';

    // First try to locate DistributionCenter if rawWarehouse is provided
    let dcId = null;
    if (rawWarehouse) {
      const safeWarehouse = rawWarehouse.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const dc = await DistributionCenter.findOne({
        supplierId,
        $or: [
          { name: { $regex: new RegExp('^' + safeWarehouse + '$', 'i') } },
          { code: { $regex: new RegExp('^' + safeWarehouse + '$', 'i') } }
        ]
      });
      if (dc) {
        dcId = dc._id;
      }
    }

    if (lotNumber && lotNumber !== 'UNKNOWN') {
      // Find matching lot by lotNumber, supplierId and optionally dcId
      const lotQuery: any = { lotNumber, supplierId };
      if (dcId) {
        lotQuery.distributionCenterId = dcId;
      }
      lot = await InventoryLot.findOne(lotQuery);
      if (lot) {
        lotId = lot._id;
        const newAvailableQty = Math.max(0, lot.availableQty - quantityCases);
        const allocated = lot.availableQty - newAvailableQty;
        lot.availableQty = newAvailableQty;
        if (newAvailableQty === 0) {
          lot.status = 'sold';
        } else if (lot.status === 'pending') {
          lot.status = 'active';
        }
        lot.latestSalesDate = saleDate;
        await lot.save();

        if (allocated < quantityCases) {
          reconciliationWarning = `Partial reconciliation. Demanded ${quantityCases} cases, but only ${allocated} were available in lot ${lotNumber}.`;
          warnings.push(`Row ${i + 1}: ${reconciliationWarning}`);
        }
      } else {
        const anyLot = await InventoryLot.findOne({ lotNumber, supplierId });
        if (anyLot) {
          reconciliationWarning = `Lot ${lotNumber} found, but in a different warehouse than specified: ${rawWarehouse}. No stock deducted.`;
        } else {
          reconciliationWarning = `Lot ${lotNumber} not found in inventory.`;
        }
        warnings.push(`Row ${i + 1}: ${reconciliationWarning}`);
      }
    } else {
      // FEFO FALLBACK MATCHING STRATEGY
      const product = await ProductMaster.findOne({ sku: rawSku, supplierId });
      if (product) {
        const lotQuery: any = {
          productId: product._id,
          supplierId,
          status: { $in: ['active', 'pending'] },
          availableQty: { $gt: 0 }
        };
        if (dcId) {
          lotQuery.distributionCenterId = dcId;
        }

        const activeLots = await InventoryLot.find(lotQuery).sort({ expirationDate: 1 });
        
        if (activeLots.length > 0) {
          let remainingQtyToAllocate = quantityCases;
          let firstLotId = null;

          for (const activeLot of activeLots) {
            if (remainingQtyToAllocate <= 0) break;
            if (!firstLotId) firstLotId = activeLot._id;

            const allocated = Math.min(activeLot.availableQty, remainingQtyToAllocate);
            activeLot.availableQty -= allocated;
            remainingQtyToAllocate -= allocated;

            if (activeLot.availableQty === 0) {
              activeLot.status = 'sold';
            } else if (activeLot.status === 'pending') {
              activeLot.status = 'active';
            }
            activeLot.latestSalesDate = saleDate;
            await activeLot.save();
          }

          lotId = firstLotId;

          if (remainingQtyToAllocate > 0) {
            reconciliationWarning = `FEFO allocation incomplete: SKU ${rawSku} had only ${quantityCases - remainingQtyToAllocate} cases available out of ${quantityCases} requested.`;
            warnings.push(`Row ${i + 1}: ${reconciliationWarning}`);
          }
        } else {
          reconciliationWarning = `No active inventory lots found for SKU ${rawSku} to apply FEFO reconciliation.`;
          warnings.push(`Row ${i + 1}: ${reconciliationWarning}`);
        }
      } else {
        reconciliationWarning = `SKU ${rawSku} not found in product catalog.`;
        warnings.push(`Row ${i + 1}: ${reconciliationWarning}`);
      }
    }

    // 3. Gather unmapped columns dynamically as metadata
    const mappedValues = Object.values(mappings).filter(Boolean) as string[];
    const metadata: Record<string, string> = {};
    headers.forEach((header, colIdx) => {
      if (header && !mappedValues.includes(header) && colIdx < row.length && row[colIdx] !== undefined) {
        const val = row[colIdx]?.trim();
        if (val) {
          metadata[header] = val;
        }
      }
    });

    // 4. Create Sale record
    let description = rawProductName || 'Ingested Closeout Lot';
    if (!rawProductName && lot) {
      const pm = await ProductMaster.findById(lot.productId);
      if (pm && pm.description) {
        description = pm.description;
      }
    }

    const sale = new Sale({
      supplierId,
      buyerId,
      lotId,
      lotNumber: lotNumber || 'UNKNOWN',
      sku: rawSku || (lot ? (await ProductMaster.findById(lot.productId))?.sku : 'UNKNOWN'),
      description,
      quantityCases,
      pricePerCase,
      totalValue,
      saleDate,
      status: 'scheduled',
      buyerEmail: buyer.email,
      invoiceNumber: rawInvoiceNumber,
      brand: rawBrand,
      warehouse: rawWarehouse,
      revenue: parsedRevenue,
      reconciliationWarning: reconciliationWarning || undefined,
      metadata
    });

    await sale.save();
    salesIds.push(sale._id.toString());
  }

  docImport.status = 'imported';
  docImport.supplierId = supplierId;
  docImport.recordsParsed = salesIds.length;
  docImport.importErrors = importErrors;
  await docImport.save();

  return {
    countImported: salesIds.length,
    salesIds,
    warnings,
    errors: importErrors
  };
}

export async function confirmBuyerIngestion(
  documentId: string,
  mappings: Record<string, string>,
  buyerListId?: string
) {
  const docImport = await findDocumentImport(documentId);
  if (!docImport) {
    throw new Error('Document import job not found.');
  }
  if (docImport.status === 'imported') {
    throw new Error('Document has already been imported.');
  }

  const grid = docImport.rawGrid || [];
  if (grid.length < 2) {
    throw new Error('Document grid contains no data rows.');
  }

  const headers = grid[0];
  const rows = grid.slice(1);

  const getColIndex = (targetKey: string, aliasKey?: string): number => {
    const colName = mappings[targetKey] || (aliasKey ? mappings[aliasKey] : undefined);
    if (!colName) return -1;
    return headers.findIndex((h: string) => h && h.trim().toLowerCase() === colName.trim().toLowerCase());
  };

  const companyIdx = getColIndex('companyName', 'name');
  const emailIdx = getColIndex('email');
  const tierIdx = getColIndex('tier');
  const isVerifiedIdx = getColIndex('isVerified');
  const acceptsShortDatedIdx = getColIndex('acceptsShortDated');
  const minShelfLifeIdx = getColIndex('minShelfLife');
  const categoriesIdx = getColIndex('categories');
  const transportRadiusIdx = getColIndex('transportRadius');
  const excludedAllergensIdx = getColIndex('excludedAllergens');

  let createdCount = 0;
  let updatedCount = 0;
  const buyerIds: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawEmail = emailIdx >= 0 && row[emailIdx] ? row[emailIdx].trim() : '';
    const rawCompany = companyIdx >= 0 && row[companyIdx] ? row[companyIdx].trim() : '';

    if (!rawEmail || !rawEmail.includes('@')) {
      errors.push(`Row ${i + 2}: Invalid or missing email '${rawEmail}'`);
      continue;
    }

    const email = rawEmail.toLowerCase();
    const companyName = rawCompany || email.split('@')[0];

    let acceptsShortDated = true;
    if (acceptsShortDatedIdx >= 0 && row[acceptsShortDatedIdx] !== undefined) {
      const val = row[acceptsShortDatedIdx].toString().trim().toLowerCase();
      acceptsShortDated = val === 'true' || val === 'yes' || val === '1';
    }

    let minShelfLife = 7;
    if (minShelfLifeIdx >= 0 && row[minShelfLifeIdx] !== undefined) {
      const parsed = parseInt(row[minShelfLifeIdx], 10);
      if (!isNaN(parsed)) minShelfLife = parsed;
    }

    let categories: string[] = [];
    if (categoriesIdx >= 0 && row[categoriesIdx]) {
      categories = row[categoriesIdx].split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    let transportRadius = 100;
    if (transportRadiusIdx >= 0 && row[transportRadiusIdx] !== undefined) {
      const parsed = parseInt(row[transportRadiusIdx], 10);
      if (!isNaN(parsed)) transportRadius = parsed;
    }

    let excludedAllergens: string[] = [];
    if (excludedAllergensIdx >= 0 && row[excludedAllergensIdx]) {
      excludedAllergens = row[excludedAllergensIdx].split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const tier = (tierIdx >= 0 && row[tierIdx] ? row[tierIdx].trim() : 'tier1');

    let isVerified = false;
    if (isVerifiedIdx >= 0 && row[isVerifiedIdx] !== undefined) {
      const val = row[isVerifiedIdx].toString().trim().toLowerCase();
      isVerified = val === 'true' || val === 'yes' || val === '1';
    }

    let buyer = await Buyer.findOne({ email });
    if (buyer) {
      if (companyName) buyer.companyName = companyName;
      if (tier) buyer.tier = tier;
      if (acceptsShortDatedIdx >= 0) buyer.acceptsShortDated = acceptsShortDated;
      if (minShelfLifeIdx >= 0) buyer.minShelfLife = minShelfLife;
      if (categories.length > 0) buyer.categories = categories;
      if (transportRadiusIdx >= 0) buyer.transportRadius = transportRadius;
      if (excludedAllergens.length > 0) buyer.excludedAllergens = excludedAllergens;
      if (isVerifiedIdx >= 0) buyer.isVerified = isVerified;

      await buyer.save();
      updatedCount++;
      buyerIds.push(buyer._id.toString());
    } else {
      buyer = await Buyer.create({
        companyName,
        email,
        tier,
        isVerified,
        acceptsShortDated,
        minShelfLife,
        categories,
        transportRadius,
        excludedAllergens,
        warehouseLocations: []
      });
      createdCount++;
      buyerIds.push(buyer._id.toString());
    }
  }

  if (buyerListId && mongoose.Types.ObjectId.isValid(buyerListId)) {
    const buyerList = await BuyerList.findById(buyerListId);
    if (buyerList) {
      const existingIds = new Set(buyerList.buyerIds.map(id => id.toString()));
      buyerIds.forEach(id => {
        if (!existingIds.has(id)) {
          buyerList.buyerIds.push(new mongoose.Types.ObjectId(id));
        }
      });
      await buyerList.save();
    }
  }

  docImport.status = 'imported';
  docImport.recordsParsed = buyerIds.length;
  await docImport.save();

  return {
    countImported: buyerIds.length,
    createdCount,
    updatedCount,
    buyerIds,
    errors
  };
}


