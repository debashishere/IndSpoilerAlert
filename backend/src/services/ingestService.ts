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
import GoogleSheetsSyncConfig, { ISyncMetrics, IGoogleSheetsSyncConfig } from '../models/GoogleSheetsSyncConfig';
import { suggestMappings } from '../utils/mapper';
import { uploadToS3, sendSQSMessage } from '../utils/aws';
import { translateAttributes, computeGridAggregates } from './translatorService';
import {
  IngestionBatch,
  IngestionBatchResult,
  IngestionSource,
  parseIngestionDate,
  calculateRemainingShelfLife,
  generateFallbackSku,
  getCategoryShelfLifeDays,
  categoryDefaults
} from '../utils/ingestionNormalization';

export {
  IngestionBatch,
  IngestionBatchResult,
  IngestionSource,
  parseIngestionDate,
  calculateRemainingShelfLife,
  generateFallbackSku,
  getCategoryShelfLifeDays,
  categoryDefaults
};

export function toCellString(val: any): string {
  if (val === null || val === undefined) return '';
  return typeof val === 'string' ? val.trim() : String(val).trim();
}

export function getSidecarUrl(): string {
  return process.env.SIDE_CAR_URL || process.env.SIDECAR_URL || 'http://localhost:8000';
}

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
  filePathOrFile: string | any,
  originalName?: string,
  mimetype?: string,
  supplierId?: string
) {
  let checksum = '';
  let s3Bucket = process.env.AWS_S3_BUCKET || 'ind-spoiler-alert-surplus';
  let s3Key = '';
  let fileName = originalName || '';
  let mime = mimetype || '';
  let isFilePath = typeof filePathOrFile === 'string';

  if (!isFilePath && filePathOrFile) {
    const fileObj = filePathOrFile;
    fileName = fileObj.originalname || originalName || '';
    mime = fileObj.mimetype || mimetype || '';
    s3Bucket = fileObj.s3Bucket || fileObj.bucket || s3Bucket;
    s3Key = fileObj.s3Key || fileObj.key || `uploads/${Date.now()}-${fileName}`;

    if (fileObj.buffer) {
      try {
        const hash = crypto.createHash('sha256');
        hash.update(fileObj.buffer);
        checksum = hash.digest('hex');
      } catch (err) {
        console.error('Error calculating checksum from buffer:', err);
      }
    }
  } else if (isFilePath) {
    s3Key = `uploads/${Date.now()}-${fileName}`;
    try {
      const fileBuffer = fs.readFileSync(filePathOrFile);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      checksum = hash.digest('hex');
    } catch (err) {
      console.error('Error calculating checksum:', err);
    }
  }

  const docImport = new DocumentImport({
    fileName,
    checksum,
    status: 'queued',
    supplierId: supplierId || undefined,
    s3Bucket,
    s3Key,
    importErrors: []
  });

  await docImport.save();

  try {
    if (isFilePath) {
      await uploadToS3(filePathOrFile, s3Bucket, s3Key);
    }

    const payload = {
      ingestionJobId: docImport._id.toString(),
      s3Bucket,
      s3Key,
      fileName,
      mimetype: mime,
      supplierId: supplierId || undefined
    };
    await sendSQSMessage('ind-spoiler-alert-ingestion-jobs', payload);

    if (isFilePath && fs.existsSync(filePathOrFile)) {
      fs.unlinkSync(filePathOrFile);
    }

    return {
      ingestionJobId: docImport._id.toString()
    };
  } catch (err: any) {
    console.error('Error in queueUploadAndParseFile:', err.message || err);
    docImport.status = 'error';
    docImport.importErrors = [err.message || 'Failed during upload queuing'];
    await docImport.save();

    if (isFilePath && fs.existsSync(filePathOrFile)) {
      fs.unlinkSync(filePathOrFile);
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
  filePathOrFile: string | any,
  originalName?: string,
  mimetype?: string,
  supplierId?: string
) {
  let fileName = originalName || '';
  let mime = mimetype || '';
  let isFilePath = typeof filePathOrFile === 'string';
  let fileBuffer: Buffer | null = null;

  if (!isFilePath && filePathOrFile) {
    fileName = filePathOrFile.originalname || originalName || '';
    mime = filePathOrFile.mimetype || mimetype || '';
    fileBuffer = filePathOrFile.buffer || null;
  } else if (isFilePath) {
    try {
      fileBuffer = fs.readFileSync(filePathOrFile);
    } catch (err) {
      console.error('Error reading file path:', err);
    }
  }

  // Calculate file checksum
  let checksum = '';
  if (fileBuffer) {
    try {
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      checksum = hash.digest('hex');
    } catch (err) {
      console.error('Error calculating checksum:', err);
    }
  }

  // Create DocumentImport record
  const docImport = new DocumentImport({
    fileName,
    checksum,
    status: 'uploaded',
    supplierId: supplierId || undefined,
    importErrors: []
  });

  await docImport.save();

  try {
    let rawGrid: string[][] = [];
    const isCsv = fileName.toLowerCase().endsWith('.csv') || (mime && mime.includes('csv'));

    if (isCsv && fileBuffer) {
      try {
        const fileText = fileBuffer.toString('utf-8');
        rawGrid = parseCsvToGrid(fileText);
      } catch (csvErr: any) {
        console.warn('Native CSV parse error, falling back to sidecar:', csvErr.message);
      }
    }

    if (rawGrid.length === 0 && fileBuffer) {
      // Send file to Python sidecar
      const sidecarUrl = getSidecarUrl();
      console.log(`Forwarding file to Python sidecar at: ${sidecarUrl}/parse-document`);
      const fileBlob = new Blob([fileBuffer], { type: mime });
      
      const formData = new FormData();
      formData.append('file', fileBlob, fileName);

      const sidecarRes = await axios.post(`${sidecarUrl}/parse-document`, formData, {
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

    // Clean up uploaded file if local
    if (isFilePath && fs.existsSync(filePathOrFile)) {
      fs.unlinkSync(filePathOrFile);
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

    // Clean up uploaded file if local
    if (isFilePath && fs.existsSync(filePathOrFile)) {
      fs.unlinkSync(filePathOrFile);
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

  // Save column layout template if requested
  let savedTemplateId: string | undefined = undefined;
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
    const savedTemplate = await SupplierTemplate.findOneAndUpdate(
      { supplierId },
      updatePayload,
      { upsert: true, new: true }
    );
    if (savedTemplate) {
      savedTemplateId = savedTemplate._id.toString();
    }
  }

  const headers = docImport.rawGrid[0];
  const rows = docImport.rawGrid.slice(1);

  const batch: IngestionBatch = {
    supplierId,
    headers,
    rows,
    columnMappings: mappings,
    source: 'csv',
    metadata: {
      documentId: docImport._id.toString(),
      fileName: docImport.fileName,
      ...(Array.isArray(semanticRulesInput) ? { semanticRules: semanticRulesInput } : {})
    }
  };

  const batchResult: IngestionBatchResult = await processBatch(batch);

  docImport.status = 'imported';
  docImport.supplierId = supplierId;
  docImport.recordsParsed = batchResult.lotIds.length;
  docImport.importErrors = batchResult.errors;
  await docImport.save();

  return {
    countImported: batchResult.lotIds.length,
    lotIds: batchResult.lotIds,
    errors: batchResult.errors,
    aggregates: batchResult.aggregates,
    templateId: savedTemplateId,
    importedLotsCount: batchResult.lotIds.length,
    lots: batchResult.lotIds
  };
}

export async function confirmSalesIngestion(
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

  if (docImport.status === 'imported') {
    throw new Error('Document has already been imported.');
  }

  if (!docImport.rawGrid || docImport.rawGrid.length < 2) {
    throw new Error('Document does not contain any data rows.');
  }

  const headers = docImport.rawGrid[0];
  const skuHeader = mappings.sku;
  const descriptionHeader = mappings.description || mappings.productName || mappings.product;
  const brandHeader = mappings.brand || mappings.manufacturer;
  const lotNumberHeader = mappings.lotNumber;
  const buyerEmailHeader = mappings.buyerEmail || mappings.buyer;
  const buyerCompanyHeader = mappings.buyerCompany || mappings.buyerName || mappings.company;
  const quantityHeader = mappings.quantity || mappings.quantityCases || mappings.cases;
  const priceHeader = mappings.price || mappings.salePrice || mappings.unitPrice || mappings.cost;
  const totalValueHeader = mappings.totalValue || mappings.revenue || mappings.totalRevenue;
  const saleDateHeader = mappings.saleDate || mappings.soldDate || mappings.date;
  const invoiceNumberHeader = mappings.invoiceNumber || mappings.invoice;
  const productNameHeader = mappings.productName || mappings.description || mappings.product;
  const statusHeader = mappings.status || mappings.saleStatus || mappings.state;
  const warehouseHeader = mappings.warehouse || mappings.dc || mappings.location;
  const revenueHeader = mappings.revenue || mappings.totalRevenue || mappings.totalValue;

  const skuIdx = skuHeader ? headers.indexOf(skuHeader) : -1;
  const descriptionIdx = descriptionHeader ? headers.indexOf(descriptionHeader) : -1;
  const brandIdx = brandHeader ? headers.indexOf(brandHeader) : -1;
  const lotNumberIdx = lotNumberHeader ? headers.indexOf(lotNumberHeader) : -1;
  const buyerEmailIdx = buyerEmailHeader ? headers.indexOf(buyerEmailHeader) : -1;
  const buyerCompanyIdx = buyerCompanyHeader ? headers.indexOf(buyerCompanyHeader) : -1;
  const qtyIdx = quantityHeader ? headers.indexOf(quantityHeader) : -1;
  const priceIdx = priceHeader ? headers.indexOf(priceHeader) : -1;
  const totalValueIdx = totalValueHeader ? headers.indexOf(totalValueHeader) : -1;
  const saleDateIdx = saleDateHeader ? headers.indexOf(saleDateHeader) : -1;
  const invoiceNumberIdx = invoiceNumberHeader ? headers.indexOf(invoiceNumberHeader) : -1;
  const productNameIdx = productNameHeader ? headers.indexOf(productNameHeader) : -1;
  const statusIdx = statusHeader ? headers.indexOf(statusHeader) : -1;
  const warehouseIdx = warehouseHeader ? headers.indexOf(warehouseHeader) : -1;
  const revenueIdx = revenueHeader ? headers.indexOf(revenueHeader) : -1;

  // Save column layout template if requested
  if (saveTemplate) {
    const nameOfTemplate = templateName || `SalesTemplate_${Date.now()}`;
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

  const existingTemplate = await SupplierTemplate.findOne({ supplierId });
  const semanticRules = Array.isArray(semanticRulesInput) ? semanticRulesInput : (existingTemplate?.semanticRules || []);
  const aggregates = computeGridAggregates(docImport.rawGrid, semanticRules as any);

  const salesIds: string[] = [];
  const warnings: string[] = [];
  const importErrors: string[] = [];
  const rows = docImport.rawGrid.slice(1);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawSku = skuIdx !== -1 ? toCellString(row[skuIdx]) : '';
    const rawDescription = descriptionIdx !== -1 ? toCellString(row[descriptionIdx]) : '';
    const rawBrand = brandIdx !== -1 ? toCellString(row[brandIdx]) : '';
    const rawLotNumber = lotNumberIdx !== -1 ? toCellString(row[lotNumberIdx]) : '';
    const rawBuyerEmail = buyerEmailIdx !== -1 ? toCellString(row[buyerEmailIdx]) : '';
    const rawBuyerCompany = buyerCompanyIdx !== -1 ? toCellString(row[buyerCompanyIdx]) : '';
    const rawQty = qtyIdx !== -1 ? toCellString(row[qtyIdx]) : '';
    const rawPrice = priceIdx !== -1 ? toCellString(row[priceIdx]) : '';
    const rawTotalValue = totalValueIdx !== -1 ? toCellString(row[totalValueIdx]) : '';
    const rawSaleDate = saleDateIdx !== -1 ? toCellString(row[saleDateIdx]) : '';
    const rawInvoiceNumber = invoiceNumberIdx !== -1 ? toCellString(row[invoiceNumberIdx]) : '';
    const rawProductName = productNameIdx !== -1 ? toCellString(row[productNameIdx]) : '';
    const rawStatus = statusIdx !== -1 ? toCellString(row[statusIdx]) : '';
    const rawWarehouse = warehouseIdx !== -1 ? toCellString(row[warehouseIdx]) : '';
    const rawRevenue = revenueIdx !== -1 ? toCellString(row[revenueIdx]) : '';

    if (!rawSku && !rawLotNumber) {
      continue; // Skip entirely empty row
    }

    const lotNumber = rawLotNumber ? rawLotNumber.trim() : '';
    if (!lotNumber) {
      warnings.push(`Row ${i + 1}: Lot Number not provided. Record will not be reconciled with inventory.`);
    }

    const quantityCases = parseInt(rawQty ? rawQty.replace(/,/g, '') : '0', 10) || 0;
    const pricePerCase = parseFloat(rawPrice ? rawPrice.replace(/[$,]/g, '') : '0') || 0;
    const parsedTotalValue = parseFloat(rawTotalValue ? rawTotalValue.replace(/[$,]/g, '') : '0') || 0;
    const parsedRevenue = parseFloat(rawRevenue ? rawRevenue.replace(/[$,]/g, '') : '0') || 0;
    const totalValue = parsedTotalValue > 0 ? parsedTotalValue : (parsedRevenue > 0 ? parsedRevenue : quantityCases * pricePerCase);

    let saleDate = new Date(rawSaleDate);
    if (isNaN(saleDate.getTime())) {
      saleDate = new Date();
    }

    // 1. Resolve or Auto-register Buyer
    let buyerId = null;
    let finalBuyerEmail = rawBuyerEmail || (rawBuyerCompany ? `${rawBuyerCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}@retailer.com` : 'buyer@retailer.com');
    const emailLower = finalBuyerEmail.trim().toLowerCase();
    const isEmailFormat = emailLower.includes('@');

    const buyerSearchTerm = (rawBuyerCompany || finalBuyerEmail).trim();
    const safeBuyerQuery = isEmailFormat
      ? { email: emailLower }
      : {
          $or: [
            { email: emailLower },
            { companyName: new RegExp('^' + buyerSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
          ]
        };

    let buyer = await Buyer.findOne(safeBuyerQuery);
    if (!buyer && rawBuyerCompany) {
      buyer = await Buyer.findOne({ companyName: new RegExp('^' + rawBuyerCompany.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
    }

    if (!buyer) {
      let emailToSave = emailLower;
      let derivedName = rawBuyerCompany || '';

      if (!derivedName) {
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
          warehouseLocations: [{ lat: 41.8781, lng: -87.6298 }],
          isActive: true
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

    // 3. Gather unmapped columns dynamically as metadata & evaluate semantic rules
    const mappedValues = Object.values(mappings).filter(Boolean) as string[];
    const metadata: Record<string, string> = {};
    const rawRowObject: Record<string, any> = {};

    headers.forEach((header, colIdx) => {
      if (header && colIdx < row.length && row[colIdx] !== undefined) {
        const val = row[colIdx]?.trim();
        rawRowObject[header] = val || '';
        if (!mappedValues.includes(header) && val) {
          metadata[header] = val;
        }
      }
    });

    const translated = translateAttributes(rawRowObject, semanticRules as any, aggregates);
    const attributes = new Map<string, any>(Object.entries(translated.attributes));
    const rawAttributes = new Map<string, any>(Object.entries(translated.rawAttributes));

    // 4. Create Sale record
    let description = rawDescription || rawProductName || 'Ingested Closeout Lot';
    if (!rawDescription && !rawProductName && lot) {
      const pm = await ProductMaster.findById(lot.productId);
      if (pm && pm.description) {
        description = pm.description;
      }
    }

    let saleStatus: 'scheduled' | 'confirmed' | 'in_transit' | 'delivered' = 'scheduled';
    const validStatuses = ['scheduled', 'confirmed', 'in_transit', 'delivered'];
    if (rawStatus && validStatuses.includes(rawStatus.toLowerCase())) {
      saleStatus = rawStatus.toLowerCase() as any;
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
      status: saleStatus,
      buyerEmail: buyer.email,
      invoiceNumber: rawInvoiceNumber,
      brand: rawBrand,
      warehouse: rawWarehouse,
      revenue: parsedRevenue > 0 ? parsedRevenue : totalValue,
      reconciliationWarning: reconciliationWarning || undefined,
      metadata,
      attributes,
      rawAttributes
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
  buyerListId?: string,
  supplierIdParam?: string
) {
  const docImport = await findDocumentImport(documentId);
  if (!docImport) {
    throw new Error('Document import job not found.');
  }
  if (docImport.status === 'imported') {
    throw new Error('Document has already been imported.');
  }

  const supplierId = supplierIdParam || docImport.supplierId;

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
  const phoneIdx = getColIndex('phone');
  const addressIdx = getColIndex('address');

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

    const phone = phoneIdx >= 0 && row[phoneIdx] ? row[phoneIdx].trim() : undefined;
    const address = addressIdx >= 0 && row[addressIdx] ? row[addressIdx].trim() : undefined;

    const tier = (tierIdx >= 0 && row[tierIdx] ? row[tierIdx].trim() : 'tier1');

    let isVerified = false;
    if (isVerifiedIdx >= 0 && row[isVerifiedIdx] !== undefined) {
      const val = row[isVerifiedIdx].toString().trim().toLowerCase();
      isVerified = val === 'true' || val === 'yes' || val === '1';
    }

    const buyerQuery: any = { email };
    if (supplierId) {
      buyerQuery.supplierId = supplierId;
    }
    let buyer = await Buyer.findOne(buyerQuery);
    if (buyer) {
      if (companyName) buyer.companyName = companyName;
      if (tier) buyer.tier = tier;
      if (acceptsShortDatedIdx >= 0) buyer.acceptsShortDated = acceptsShortDated;
      if (minShelfLifeIdx >= 0) buyer.minShelfLife = minShelfLife;
      if (categories.length > 0) buyer.categories = categories;
      if (transportRadiusIdx >= 0) buyer.transportRadius = transportRadius;
      if (excludedAllergens.length > 0) buyer.excludedAllergens = excludedAllergens;
      if (isVerifiedIdx >= 0) buyer.isVerified = isVerified;
      if (phoneIdx >= 0 && phone !== undefined) buyer.phone = phone;
      if (addressIdx >= 0 && address !== undefined) buyer.address = address;
      if (supplierId && !buyer.supplierId) buyer.supplierId = supplierId as any;

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
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        warehouseLocations: [],
        ...(supplierId ? { supplierId } : {})
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

export async function processBatch(batch: IngestionBatch): Promise<IngestionBatchResult> {
  const supplierId = await ensureValidSupplierId(batch.supplierId);
  const headers = batch.headers || [];
  const rows = batch.rows || [];

  // Align mappings dynamically from batch.columnMappings or fallback to suggestMappings
  let mappings = batch.columnMappings || {};
  if (Object.keys(mappings).length === 0 || Object.values(mappings).every(v => !v)) {
    mappings = suggestMappings(headers);
  }

  const skuHeader = mappings.sku;
  const descHeader = mappings.description;
  const brandHeader = mappings.brand;
  const qtyHeader = mappings.quantityCases || mappings.quantity || mappings.availableQty || mappings.cases || mappings.qty;
  const availableQtyHeader = mappings.availableQty;
  const expHeader = mappings.expirationDate;
  const priceHeader = mappings.originalPrice || mappings.price || mappings.costPerCase;
  const lotNumberHeader = mappings.lotNumber;
  const productionDateHeader = mappings.productionDate;
  const categoryHeader = mappings.category;
  const subCategoryHeader = mappings.subCategory;
  const statusHeader = mappings.status;
  const tempMinHeader = mappings.temperatureMin;
  const tempMaxHeader = mappings.temperatureMax;
  const standardSellPriceHeader = mappings.standardSellPrice || mappings.listPrice;
  const warehouseHeader = mappings.warehouse || mappings.dc || mappings.location;
  const commentHeader = mappings.comment;
  const fdaRegulatedHeader = mappings.fdaRegulated;

  const skuIdx = skuHeader ? headers.indexOf(skuHeader) : -1;
  const descIdx = descHeader ? headers.indexOf(descHeader) : -1;
  const brandIdx = brandHeader ? headers.indexOf(brandHeader) : -1;
  const qtyIdx = qtyHeader ? headers.indexOf(qtyHeader) : -1;
  const availableQtyIdx = availableQtyHeader ? headers.indexOf(availableQtyHeader) : -1;
  const expIdx = expHeader ? headers.indexOf(expHeader) : -1;
  const priceIdx = priceHeader ? headers.indexOf(priceHeader) : -1;
  const lotNumberIdx = lotNumberHeader ? headers.indexOf(lotNumberHeader) : -1;
  const productionDateIdx = productionDateHeader ? headers.indexOf(productionDateHeader) : -1;
  const categoryIdx = categoryHeader ? headers.indexOf(categoryHeader) : -1;
  const subCategoryIdx = subCategoryHeader ? headers.indexOf(subCategoryHeader) : -1;
  const statusIdx = statusHeader ? headers.indexOf(statusHeader) : -1;
  const tempMinIdx = tempMinHeader ? headers.indexOf(tempMinHeader) : -1;
  const tempMaxIdx = tempMaxHeader ? headers.indexOf(tempMaxHeader) : -1;
  const standardSellPriceIdx = standardSellPriceHeader ? headers.indexOf(standardSellPriceHeader) : -1;
  const warehouseIdx = warehouseHeader ? headers.indexOf(warehouseHeader) : -1;
  const commentIdx = commentHeader ? headers.indexOf(commentHeader) : -1;
  const fdaRegulatedIdx = fdaRegulatedHeader ? headers.indexOf(fdaRegulatedHeader) : -1;

  // Determine unmapped headers list
  const mappedHeadersList = Object.values(mappings).filter(Boolean) as string[];
  const unmappedColumnIndices: { header: string; idx: number }[] = [];
  headers.forEach((header, idx) => {
    if (!mappedHeadersList.includes(header)) {
      unmappedColumnIndices.push({ header, idx });
    }
  });

  // Resolve semantic rules: batch metadata takes precedence, otherwise fallback to SupplierTemplate
  let semanticRules = Array.isArray(batch.metadata?.semanticRules) ? batch.metadata.semanticRules : undefined;
  if (!semanticRules) {
    const existingTemplate = await SupplierTemplate.findOne({ supplierId });
    semanticRules = existingTemplate?.semanticRules || [];
  }

  // Compute grid aggregates across headers and rows
  const aggregates = (headers.length > 0 && rows.length > 0)
    ? computeGridAggregates([headers, ...rows], semanticRules as any)
    : {};

  // Resolve or create primary DistributionCenter
  let primaryDc = await DistributionCenter.findOne({ supplierId });
  if (!primaryDc) {
    const supplier = await Supplier.findById(supplierId);
    const supplierName = supplier?.name || 'Unknown';
    const companyCode = supplier?.companyCode || 'SUP';

    primaryDc = new DistributionCenter({
      supplierId,
      name: `${supplierName} Default DC`,
      code: `${companyCode}-DEFAULT-DC`,
      address: '100 Logistics Way, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });
    await primaryDc.save();
  }
  const defaultDistributionCenterId = primaryDc._id.toString();

  let totalRows = 0;
  let inserted = 0;
  let updated = 0;
  let depleted = 0;
  const errors: string[] = [];
  const lotIds: string[] = [];

  // Pre-index ProductMaster across batch rows via single $in query
  const candidateSkus = new Set<string>();
  for (const row of rows) {
    const rawSku = skuIdx !== -1 ? toCellString(row[skuIdx]) : '';
    const rawDesc = descIdx !== -1 ? toCellString(row[descIdx]) : '';
    if (rawSku) {
      candidateSkus.add(rawSku);
    } else if (rawDesc) {
      candidateSkus.add(generateFallbackSku(rawDesc));
    }
  }

  const productMap = new Map<string, any>();
  if (candidateSkus.size > 0) {
    const existingProducts = await ProductMaster.find({
      supplierId,
      sku: { $in: Array.from(candidateSkus) }
    });
    for (const prod of existingProducts) {
      productMap.set(prod.sku, prod);
    }
  }

  const dcCache = new Map<string, string>();
  dcCache.set('', defaultDistributionCenterId);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawSku = skuIdx !== -1 ? toCellString(row[skuIdx]) : '';
    const rawDesc = descIdx !== -1 ? toCellString(row[descIdx]) : '';
    const rawBrand = brandIdx !== -1 ? toCellString(row[brandIdx]) : '';
    const rawQty = qtyIdx !== -1 ? toCellString(row[qtyIdx]) : '';
    const rawExp = expIdx !== -1 ? toCellString(row[expIdx]) : '';
    const rawPrice = priceIdx !== -1 ? toCellString(row[priceIdx]) : '';
    const rawLotNumber = lotNumberIdx !== -1 ? toCellString(row[lotNumberIdx]) : '';
    const rawProductionDate = productionDateIdx !== -1 ? toCellString(row[productionDateIdx]) : '';
    const rawCategory = categoryIdx !== -1 ? toCellString(row[categoryIdx]) : '';
    const rawSubCategory = subCategoryIdx !== -1 ? toCellString(row[subCategoryIdx]) : '';
    const rawListPrice = standardSellPriceIdx !== -1 ? toCellString(row[standardSellPriceIdx]) : '';
    const rawWarehouse = warehouseIdx !== -1 ? toCellString(row[warehouseIdx]) : '';
    const rawComment = commentIdx !== -1 ? toCellString(row[commentIdx]) : '';
    const rawStatus = statusIdx !== -1 ? toCellString(row[statusIdx]).toLowerCase() : '';
    const rawAvailableQtyStr = availableQtyIdx !== -1 ? toCellString(row[availableQtyIdx]) : '';
    const rawTempMinStr = tempMinIdx !== -1 ? toCellString(row[tempMinIdx]) : '';
    const rawTempMaxStr = tempMaxIdx !== -1 ? toCellString(row[tempMaxIdx]) : '';
    const rawFdaRegulated = fdaRegulatedIdx !== -1 ? toCellString(row[fdaRegulatedIdx]) : '';

    const isEntirelyEmpty = row.length === 0 || row.every(cell => !cell || !toCellString(cell));
    if (isEntirelyEmpty) {
      continue;
    }

    totalRows++;

    let finalSku = rawSku;
    if (!finalSku && rawDesc) {
      finalSku = generateFallbackSku(rawDesc);
    }

    if (!finalSku || !rawDesc) {
      errors.push(`Row ${i + 1}: Missing SKU or Description.`);
      continue;
    }

    const rawQtyToParse = rawQty || rawAvailableQtyStr;
    if (rawQtyToParse && isNaN(Number(rawQtyToParse.replace(/[$,\s]/g, '')))) {
      errors.push(`Row ${i + 1}: Malformed quantity "${rawQtyToParse}".`);
      continue;
    }

    const quantityCases = parseInt(rawQtyToParse ? rawQtyToParse.replace(/,/g, '') : '0', 10) || 0;
    const costPerCase = parseFloat(rawPrice ? rawPrice.replace(/[$,]/g, '') : '0') || 0;
    const listPrice = parseFloat(rawListPrice ? rawListPrice.replace(/[$,]/g, '') : '0') || costPerCase;

    let cleanName = rawDesc;
    let category = rawCategory || 'Dry Goods';
    if (!rawCategory) {
      try {
        const sidecarUrl = getSidecarUrl();
        const sidecarRes = await axios.post(
          `${sidecarUrl}/normalize-product-name`,
          { name: rawDesc },
          { timeout: 1000 }
        );
        if (sidecarRes.data) {
          cleanName = sidecarRes.data.clean_name || cleanName;
          category = sidecarRes.data.category || category;
        }
      } catch (err) {
        // Non-blocking sidecar fallback
      }
    }

    const shelfLifeDays = getCategoryShelfLifeDays(category);

    let expirationDate = parseIngestionDate(rawExp);
    if (!expirationDate) {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);
    }

    const productionDate = parseIngestionDate(rawProductionDate);

    let rowDistributionCenterId = defaultDistributionCenterId;
    if (rawWarehouse) {
      if (dcCache.has(rawWarehouse)) {
        rowDistributionCenterId = dcCache.get(rawWarehouse)!;
      } else {
        let rowDc = await DistributionCenter.findOne({ supplierId, name: rawWarehouse });
        if (!rowDc) {
          rowDc = new DistributionCenter({
            supplierId,
            name: rawWarehouse,
            code: `${primaryDc.code.split('-')[0]}-${rawWarehouse.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-DC`,
            address: `${rawWarehouse}, United States`,
            coordinates: { lat: 39.8283, lng: -98.5795 },
            coldStorage: true
          });
          await rowDc.save();
        }
        rowDistributionCenterId = rowDc._id.toString();
        dcCache.set(rawWarehouse, rowDistributionCenterId);
      }
    }

    let product = productMap.get(finalSku);
    if (!product) {
      product = new ProductMaster({
        supplierId,
        sku: finalSku,
        brand: rawBrand || undefined,
        category,
        subCategory: rawSubCategory || undefined,
        description: cleanName,
        shelfLifeDays
      });
      await product.save();
      productMap.set(finalSku, product);
    } else {
      let modified = false;
      if (product.description !== cleanName) {
        product.description = cleanName;
        modified = true;
      }
      if (product.category !== category) {
        product.category = category;
        modified = true;
      }
      if (rawBrand && product.brand !== rawBrand) {
        product.brand = rawBrand;
        modified = true;
      }
      if (rawSubCategory && product.subCategory !== rawSubCategory) {
        product.subCategory = rawSubCategory;
        modified = true;
      }
      if (!product.shelfLifeDays || product.shelfLifeDays === 30 || modified) {
        product.shelfLifeDays = shelfLifeDays;
        modified = true;
      }
      if (modified) {
        await product.save();
      }
    }

    const remainingShelfLife = calculateRemainingShelfLife({
      expirationDate,
      productionDate,
      category,
      shelfLifeDays: product.shelfLifeDays
    });

    const lotNumber = rawLotNumber || `LOT-${finalSku}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    let parsedTempMin: number | undefined = undefined;
    if (rawTempMinStr) {
      const num = parseFloat(rawTempMinStr.replace(/[^\d\.\-]/g, ''));
      if (!isNaN(num)) parsedTempMin = num;
    }

    let parsedTempMax: number | undefined = undefined;
    if (rawTempMaxStr) {
      const num = parseFloat(rawTempMaxStr.replace(/[^\d\.\-]/g, ''));
      if (!isNaN(num)) parsedTempMax = num;
    }

    let lotAvailableQty = quantityCases;
    if (rawAvailableQtyStr) {
      const parsedAvail = parseInt(rawAvailableQtyStr.replace(/,/g, ''), 10);
      if (!isNaN(parsedAvail)) lotAvailableQty = Math.max(0, parsedAvail);
    }

    const validStatuses = ['pending', 'active', 'sold', 'expired', 'donated', 'recycled', 'depleted', 'archived'];
    let lotStatus: any = (batch.source === 'google-sheets' ? 'active' : 'pending');
    if (validStatuses.includes(rawStatus)) {
      lotStatus = rawStatus;
    } else if (lotAvailableQty === 0) {
      lotStatus = 'sold';
    }

    let isFdaRegulated = false;
    if (rawFdaRegulated) {
      const lower = rawFdaRegulated.toLowerCase();
      isFdaRegulated = lower === 'true' || lower === 'yes' || lower === '1' || lower === 'y';
    }

    // Extract unmapped attributes and translate
    const rawUnmappedObject: Record<string, any> = {};
    for (const col of unmappedColumnIndices) {
      rawUnmappedObject[col.header] = row[col.idx]?.trim() || '';
    }
    const translated = translateAttributes(rawUnmappedObject, semanticRules as any, aggregates);
    const attributes = new Map<string, any>(Object.entries(translated.attributes));
    const rawAttributes = new Map<string, any>(Object.entries(translated.rawAttributes));

    if (batch.metadata?.spreadsheetId) {
      attributes.set('spreadsheetId', batch.metadata.spreadsheetId);
    }
    if (batch.metadata?.sheetName) {
      attributes.set('sheetName', batch.metadata.sheetName);
    }

    let existingLot = await InventoryLot.findOne({
      supplierId,
      productId: product._id,
      lotNumber
    });

    if (existingLot) {
      existingLot.distributionCenterId = rowDistributionCenterId;
      if (quantityCases === 0) {
        existingLot.quantityCases = 0;
        existingLot.availableQty = 0;
        existingLot.status = 'depleted';
        existingLot.attributes = attributes;
        existingLot.rawAttributes = rawAttributes;
        await existingLot.save();
        depleted++;
      } else {
        existingLot.quantityCases = quantityCases;
        existingLot.availableQty = lotAvailableQty;
        existingLot.costPerCase = costPerCase;
        existingLot.standardSellPrice = listPrice;
        existingLot.expirationDate = expirationDate;
        existingLot.productionDate = productionDate;
        existingLot.remainingShelfLife = remainingShelfLife;
        if (existingLot.status === 'depleted') {
          existingLot.status = lotStatus && lotStatus !== 'pending' ? lotStatus : 'active';
        } else if (lotStatus && lotStatus !== 'pending') {
          existingLot.status = lotStatus;
        }
        existingLot.attributes = attributes;
        existingLot.rawAttributes = rawAttributes;
        await existingLot.save();
        updated++;
      }
      lotIds.push(existingLot._id.toString());
    } else {
      const inventoryLot = new InventoryLot({
        supplierId,
        distributionCenterId: rowDistributionCenterId,
        productId: product._id,
        lotNumber,
        productionDate,
        expirationDate,
        remainingShelfLife,
        quantityCases,
        availableQty: lotAvailableQty,
        costPerCase,
        standardSellPrice: listPrice,
        status: quantityCases === 0 ? 'depleted' : lotStatus,
        fdaRegulated: isFdaRegulated,
        temperatureMin: parsedTempMin,
        temperatureMax: parsedTempMax,
        comment: rawComment || '',
        attributes,
        rawAttributes
      });
      await inventoryLot.save();
      if (quantityCases === 0) {
        depleted++;
      } else {
        inserted++;
      }
      lotIds.push(inventoryLot._id.toString());
    }
  }

  return {
    totalRows,
    inserted,
    updated,
    depleted,
    errors,
    lotIds,
    aggregates
  };
}

export interface ISheetSyncDetails {
  spreadsheetId: string;
  spreadsheetTitle?: string;
  sheetName: string;
  supplierTemplateId?: mongoose.Types.ObjectId;
}

export async function recordSyncCompletion(
  configId: string | mongoose.Types.ObjectId,
  metrics: ISyncMetrics,
  status?: 'success' | 'error',
  sheetDetails?: ISheetSyncDetails
): Promise<IGoogleSheetsSyncConfig | null> {
  let query: any = null;
  if (mongoose.Types.ObjectId.isValid(configId as any)) {
    query = {
      $or: [
        { _id: configId },
        { ingressKey: configId },
        { supplierId: configId }
      ]
    };
  } else if (typeof configId === 'string' && configId.trim().length > 0) {
    query = {
      $or: [
        { ingressKey: configId.trim() },
        { spreadsheetId: configId.trim() }
      ]
    };
  } else {
    return null;
  }

  const now = new Date();
  const syncStatus = status || (metrics.errors && metrics.errors.length > 0 && metrics.totalRows > 0 && (metrics.inserted + metrics.updated + metrics.depleted === 0) ? 'error' : 'success');

  const metricsPayload: ISyncMetrics = {
    totalRows: metrics.totalRows || 0,
    inserted: metrics.inserted || 0,
    updated: metrics.updated || 0,
    depleted: metrics.depleted || 0,
    errors: metrics.errors || []
  };

  if (!sheetDetails || !sheetDetails.spreadsheetId) {
    return GoogleSheetsSyncConfig.findOneAndUpdate(
      query,
      {
        $set: {
          syncStatus,
          lastSyncedAt: now,
          lastSyncMetrics: metricsPayload
        }
      },
      { new: true }
    );
  }

  const targetSheetName = sheetDetails.sheetName || 'Sheet1';

  // 1. Attempt atomic update of matching connectedSheets subdocument
  const updated = await GoogleSheetsSyncConfig.findOneAndUpdate(
    {
      ...query,
      'connectedSheets.spreadsheetId': sheetDetails.spreadsheetId,
      'connectedSheets.sheetName': targetSheetName
    },
    {
      $set: {
        syncStatus,
        lastSyncedAt: now,
        lastSyncMetrics: metricsPayload,
        'connectedSheets.$.syncStatus': syncStatus,
        'connectedSheets.$.lastSyncedAt': now,
        'connectedSheets.$.lastSyncMetrics': metricsPayload,
        ...(sheetDetails.spreadsheetTitle ? { 'connectedSheets.$.spreadsheetTitle': sheetDetails.spreadsheetTitle } : {}),
        ...(sheetDetails.supplierTemplateId ? { 'connectedSheets.$.supplierTemplateId': sheetDetails.supplierTemplateId } : {})
      }
    },
    { new: true }
  );

  if (updated) {
    return updated;
  }

  // 2. If subdocument was not found, atomically $push the new sheet subdocument
  return GoogleSheetsSyncConfig.findOneAndUpdate(
    query,
    {
      $set: {
        syncStatus,
        lastSyncedAt: now,
        lastSyncMetrics: metricsPayload
      },
      $push: {
        connectedSheets: {
          spreadsheetId: sheetDetails.spreadsheetId,
          spreadsheetTitle: sheetDetails.spreadsheetTitle,
          sheetName: targetSheetName,
          syncStatus,
          lastSyncedAt: now,
          lastSyncMetrics: metricsPayload,
          supplierTemplateId: sheetDetails.supplierTemplateId
        }
      }
    },
    { new: true }
  );
}

export async function getActiveLotCount(supplierId: string | mongoose.Types.ObjectId): Promise<number> {
  if (!supplierId) return 0;
  return InventoryLot.countDocuments({
    supplierId,
    status: { $ne: 'depleted' }
  });
}

export interface ISaveGoogleSheetsMappingParams {
  supplierId: string;
  spreadsheetId?: string;
  sheetName?: string;
  templateName?: string;
  columnMappings: Record<string, string>;
}

export async function saveGoogleSheetsMapping(params: ISaveGoogleSheetsMappingParams): Promise<{ supplierTemplateId: string }> {
  const { supplierId, spreadsheetId, sheetName, templateName, columnMappings } = params;
  if (!supplierId || !columnMappings || typeof columnMappings !== 'object' || Object.keys(columnMappings).length === 0) {
    throw new Error('supplierId and columnMappings are required.');
  }

  let template = await SupplierTemplate.findOne({
    supplierId,
    templateName: templateName || (spreadsheetId ? `Google Sheets: ${spreadsheetId}` : 'Google Sheets Template')
  });

  if (template) {
    template.columnMappings = columnMappings as any;
    await template.save();
  } else {
    template = await SupplierTemplate.create({
      supplierId,
      templateName: templateName || (spreadsheetId ? `Google Sheets: ${spreadsheetId}` : 'Google Sheets Template'),
      columnMappings,
      hasHeaderRow: true,
      dateFormat: 'YYYY-MM-DD',
      delimiter: ','
    });
  }

  const config = await GoogleSheetsSyncConfig.findOne({ supplierId });
  if (config) {
    config.supplierTemplateId = template._id as any;
    if (spreadsheetId) {
      config.spreadsheetId = spreadsheetId;
      if (sheetName) config.sheetName = sheetName;

      // Update or register in connectedSheets subdocument array
      if (config.connectedSheets && Array.isArray(config.connectedSheets)) {
        const matchingSheet = config.connectedSheets.find(
          s => s.spreadsheetId === spreadsheetId && (!sheetName || s.sheetName === sheetName)
        );
        if (matchingSheet) {
          matchingSheet.supplierTemplateId = template._id as any;
        } else {
          config.connectedSheets.push({
            spreadsheetId,
            sheetName: sheetName || 'Sheet1',
            syncStatus: 'idle',
            lastSyncMetrics: { totalRows: 0, inserted: 0, updated: 0, depleted: 0, errors: [] },
            supplierTemplateId: template._id as any
          });
        }
      }
    }
    await config.save();
  }

  return {
    supplierTemplateId: template._id.toString()
  };
}

export interface IGetGoogleSheetsSampleRowsParams {
  supplierId: string;
  spreadsheetId?: string;
  sheetName?: string;
}

export async function getGoogleSheetsSampleRows(params: IGetGoogleSheetsSampleRowsParams): Promise<{
  documentId: string;
  fileName: string;
  rawGrid: string[][];
  suggestedMapping: Record<string, string>;
}> {
  const { supplierId, spreadsheetId = 'spreadsheet', sheetName = 'Sheet1' } = params;
  if (!supplierId) {
    throw new Error('supplierId is required.');
  }

  // Check if a template is explicitly bound to this spreadsheet / sheetName
  let existingTemplate: any = null;
  const config = await GoogleSheetsSyncConfig.findOne({ supplierId });
  if (config && config.connectedSheets) {
    const matchingSheet = config.connectedSheets.find(
      s => s.spreadsheetId === spreadsheetId && (!sheetName || s.sheetName === sheetName)
    );
    if (matchingSheet?.supplierTemplateId) {
      existingTemplate = await SupplierTemplate.findById(matchingSheet.supplierTemplateId);
    }
  }

  if (!existingTemplate && config?.supplierTemplateId) {
    existingTemplate = await SupplierTemplate.findById(config.supplierTemplateId);
  }

  if (!existingTemplate) {
    existingTemplate = await SupplierTemplate.findOne({ supplierId });
  }

  // Baseline standard canonical headers
  const defaultHeaderMap: Record<string, string> = {
    sku: 'SKU / Item Code',
    description: 'Product Title',
    quantity: 'Cases Available',
    expirationDate: 'Expiry Date',
    originalPrice: 'Unit Price ($)',
    warehouse: 'Warehouse Location'
  };

  let suggestedMapping: Record<string, string> = { ...defaultHeaderMap };

  if (existingTemplate && existingTemplate.columnMappings) {
    const templateMappings: Record<string, string> = {};
    if (existingTemplate.columnMappings instanceof Map) {
      existingTemplate.columnMappings.forEach((val: string, key: string) => {
        templateMappings[key] = val;
      });
    } else {
      Object.assign(templateMappings, existingTemplate.columnMappings);
    }
    suggestedMapping = { ...suggestedMapping, ...templateMappings };
  }

  // Derive rawHeaders dynamically from the active mappings so the preview stays aligned with the schema
  const rawHeaders = Array.from(new Set(Object.values(suggestedMapping)));

  // Generate dynamic sample rows reflecting the mapped headers
  const sampleRow1 = rawHeaders.map((header) => {
    if (header === suggestedMapping.sku) return 'SKU-ORG-101';
    if (header === suggestedMapping.description) return 'Organic Almond Milk 1L';
    if (header === suggestedMapping.quantity) return '240';
    if (header === suggestedMapping.expirationDate) return '2026-11-30';
    if (header === suggestedMapping.originalPrice) return '3.85';
    if (header === suggestedMapping.warehouse) return 'Cold Facility A';
    return 'Sample Value';
  });

  const sampleRow2 = rawHeaders.map((header) => {
    if (header === suggestedMapping.sku) return 'SKU-ORG-102';
    if (header === suggestedMapping.description) return 'Organic Oat Barista 1L';
    if (header === suggestedMapping.quantity) return '180';
    if (header === suggestedMapping.expirationDate) return '2026-12-15';
    if (header === suggestedMapping.originalPrice) return '4.10';
    if (header === suggestedMapping.warehouse) return 'Ambient Bay 4';
    return 'Sample Value';
  });

  const sampleRow3 = rawHeaders.map((header) => {
    if (header === suggestedMapping.sku) return 'SKU-ORG-103';
    if (header === suggestedMapping.description) return 'Greek Yogurt Plain 500g';
    if (header === suggestedMapping.quantity) return '95';
    if (header === suggestedMapping.expirationDate) return '2026-10-18';
    if (header === suggestedMapping.originalPrice) return '2.40';
    if (header === suggestedMapping.warehouse) return 'Cold Facility B';
    return 'Sample Value';
  });

  return {
    documentId: `gsheet-handshake-${spreadsheetId.slice(0, 8)}`,
    fileName: `Google Sheets: ${sheetName}`,
    rawGrid: [rawHeaders, sampleRow1, sampleRow2, sampleRow3],
    suggestedMapping
  };
}

