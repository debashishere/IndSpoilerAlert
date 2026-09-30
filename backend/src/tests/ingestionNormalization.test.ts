import {
  parseIngestionDate,
  categoryDefaults,
  getCategoryShelfLifeDays,
  calculateRemainingShelfLife,
  generateFallbackSku,
  IngestionBatch,
  IngestionBatchResult,
  IngestionSource
} from '../utils/ingestionNormalization';

describe('Ingestion Normalization Core - Date Parsing', () => {
  it('returns undefined for empty, null, undefined, or unparseable date strings', () => {
    expect(parseIngestionDate(undefined)).toBeUndefined();
    expect(parseIngestionDate('')).toBeUndefined();
    expect(parseIngestionDate('   ')).toBeUndefined();
    expect(parseIngestionDate('N/A')).toBeUndefined();
    expect(parseIngestionDate('invalid-date')).toBeUndefined();
    expect(parseIngestionDate('99/99/9999')).toBeUndefined();
  });

  it('correctly parses ISO 8601 date strings', () => {
    const result = parseIngestionDate('2026-10-15');
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toContain('2026-10-15');

    const resultWithTime = parseIngestionDate('2026-10-15T14:30:00.000Z');
    expect(resultWithTime?.toISOString()).toBe('2026-10-15T14:30:00.000Z');
  });

  it('correctly parses slash-separated dates (MM/DD/YYYY and MM/DD/YY)', () => {
    const res1 = parseIngestionDate('10/15/2026');
    expect(res1).toBeInstanceOf(Date);
    expect(res1?.getFullYear()).toBe(2026);
    expect(res1?.getMonth()).toBe(9); // 0-indexed October
    expect(res1?.getDate()).toBe(15);

    const res2 = parseIngestionDate('04/05/26');
    expect(res2?.getFullYear()).toBe(2026);
    expect(res2?.getMonth()).toBe(3); // April
    expect(res2?.getDate()).toBe(5);
  });

  it('correctly parses hyphen-separated dates (DD-MM-YYYY)', () => {
    const res = parseIngestionDate('25-12-2026');
    expect(res).toBeInstanceOf(Date);
    expect(res?.getFullYear()).toBe(2026);
    expect(res?.getMonth()).toBe(11); // December
    expect(res?.getDate()).toBe(25);

    // Day <= 12 must still parse as DD-MM-YYYY for hyphenated format
    const res2 = parseIngestionDate('05-11-2026');
    expect(res2?.getFullYear()).toBe(2026);
    expect(res2?.getMonth()).toBe(10); // November
    expect(res2?.getDate()).toBe(5);
  });
});

describe('Ingestion Normalization Core - Category Shelf Life Defaults', () => {
  it('exposes standard categoryDefaults lookup table', () => {
    expect(categoryDefaults['Dairy']).toBe(45);
    expect(categoryDefaults['Produce']).toBe(30);
    expect(categoryDefaults['Meat']).toBe(90);
    expect(categoryDefaults['Meat & Poultry']).toBe(90);
    expect(categoryDefaults['Beverages']).toBe(120);
    expect(categoryDefaults['Dry Goods']).toBe(180);
    expect(categoryDefaults['Frozen Foods']).toBe(180);
  });

  it('returns mapped shelf-life days for exact and case-insensitive categories', () => {
    expect(getCategoryShelfLifeDays('Dairy')).toBe(45);
    expect(getCategoryShelfLifeDays('dairy')).toBe(45);
    expect(getCategoryShelfLifeDays('PRODUCE')).toBe(30);
    expect(getCategoryShelfLifeDays('Dry Goods')).toBe(180);
  });

  it('falls back to 90 days for missing, empty, or unrecognized categories', () => {
    expect(getCategoryShelfLifeDays(undefined)).toBe(90);
    expect(getCategoryShelfLifeDays('')).toBe(90);
    expect(getCategoryShelfLifeDays('Unknown Mystery Item')).toBe(90);
  });
});

describe('Ingestion Normalization Core - Remaining Shelf Life Calculation', () => {
  const refDate = new Date('2026-10-01T00:00:00.000Z');

  it('returns 0.0 when expiration date is in the past', () => {
    const expired = new Date('2026-09-20T00:00:00.000Z');
    const rsl = calculateRemainingShelfLife({
      expirationDate: expired,
      referenceDate: refDate
    });
    expect(rsl).toBe(0.0);
  });

  it('calculates remaining shelf life using productionDate when available', () => {
    const mfg = new Date('2026-09-01T00:00:00.000Z');
    const exp = new Date('2026-11-01T00:00:00.000Z');
    // Total lifespan: ~61 days. Days remaining from Oct 1: 31 days.
    // Ratio ~ 31 / 61 = 0.5082
    const rsl = calculateRemainingShelfLife({
      expirationDate: exp,
      productionDate: mfg,
      referenceDate: refDate
    });
    expect(rsl).toBeGreaterThan(0.5);
    expect(rsl).toBeLessThan(0.52);
  });

  it('falls back to category shelfLifeDays when productionDate is missing', () => {
    // Dairy default is 45 days.
    // Expiration is 15 days out from reference date.
    const exp = new Date(refDate.getTime() + 15 * 24 * 60 * 60 * 1000);
    const rsl = calculateRemainingShelfLife({
      expirationDate: exp,
      category: 'Dairy',
      referenceDate: refDate
    });
    // 15 / 45 = 0.3333
    expect(rsl).toBeCloseTo(0.3333, 2);
  });

  it('bounds remaining shelf life between 0.0 and 1.0 even if daysRemaining exceeds totalShelfDays', () => {
    const farFuture = new Date(refDate.getTime() + 500 * 24 * 60 * 60 * 1000);
    const rsl = calculateRemainingShelfLife({
      expirationDate: farFuture,
      category: 'Produce', // 30 days
      referenceDate: refDate
    });
    expect(rsl).toBe(1.0);
  });
});

describe('Ingestion Normalization Core - Fallback SKU Generation', () => {
  it('generates uppercase hyphenated alphanumeric SKU from valid description', () => {
    expect(generateFallbackSku('Greek Yogurt 32oz')).toBe('GREEK-YOGURT-32OZ');
    expect(generateFallbackSku('Organic Whole Milk (1 Gallon) #44')).toBe('ORGANIC-WHOLE-MILK-1-GALLON-44');
    expect(generateFallbackSku('---Special Item---')).toBe('SPECIAL-ITEM');
  });

  it('generates deterministic reproducible SKU when description lacks alphanumeric characters', () => {
    const sku1 = generateFallbackSku('$$$ @@@ !!!');
    const sku2 = generateFallbackSku('$$$ @@@ !!!');
    expect(sku1).toBe(sku2);
    expect(sku1.startsWith('SKU-')).toBe(true);
    expect(/^[A-Z0-9\-]+$/.test(sku1)).toBe(true);
  });

  it('generates deterministic fallback SKU when description is empty or undefined', () => {
    const skuEmpty = generateFallbackSku('');
    const skuUndef = generateFallbackSku(undefined);
    expect(skuEmpty.startsWith('SKU-')).toBe(true);
    expect(skuUndef.startsWith('SKU-')).toBe(true);
  });
});

describe('Ingestion Normalization Core - Contracts & Types', () => {
  it('correctly models IngestionBatch data structure across sources', () => {
    const batchCsv: IngestionBatch = {
      supplierId: '60c72b2f9b1d8b001c8e4c1a',
      headers: ['SKU', 'Description', 'Quantity'],
      rows: [['SKU-01', 'Test Item', '10']],
      columnMappings: { sku: 'SKU', description: 'Description', quantity: 'Quantity' },
      source: 'csv',
      metadata: { fileName: 'test.csv' }
    };

    const batchSheets: IngestionBatch = {
      supplierId: '60c72b2f9b1d8b001c8e4c1a',
      headers: ['Item Code', 'Title'],
      rows: [['SKU-02', 'Sheet Item']],
      columnMappings: { sku: 'Item Code', description: 'Title' },
      source: 'google-sheets'
    };

    expect(batchCsv.source).toBe('csv');
    expect(batchSheets.source).toBe('google-sheets');
    expect(batchCsv.metadata?.fileName).toBe('test.csv');
  });

  it('correctly models IngestionBatchResult metric reporting', () => {
    const result: IngestionBatchResult = {
      totalRows: 10,
      inserted: 7,
      updated: 2,
      depleted: 1,
      errors: ['Row 5: Missing SKU or Description'],
      lotIds: ['lot-1', 'lot-2']
    };

    expect(result.totalRows).toBe(10);
    expect(result.inserted + result.updated + result.depleted).toBe(10);
    expect(result.errors.length).toBe(1);
    expect(result.lotIds.length).toBe(2);
  });

  it('exports IngestionBatch contract and utilities from ingestService', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ingestService = require('../services/ingestService');
    expect(typeof ingestService.parseIngestionDate).toBe('function');
    expect(typeof ingestService.calculateRemainingShelfLife).toBe('function');
    expect(typeof ingestService.generateFallbackSku).toBe('function');
    expect(typeof ingestService.getCategoryShelfLifeDays).toBe('function');
    expect(ingestService.categoryDefaults).toBeDefined();
  });
});





