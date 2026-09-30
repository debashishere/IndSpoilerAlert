import crypto from 'crypto';

/**
 * Ingestion Normalization Core Utilities & Domain Contracts
 */

export type IngestionSource = 'csv' | 'google-sheets' | 'manual';

export interface IngestionBatch {
  supplierId: string;
  headers: string[];
  rows: string[][];
  columnMappings: Record<string, string>;
  source: IngestionSource;
  metadata?: Record<string, any>;
}

export interface IngestionBatchResult {
  totalRows: number;
  inserted: number;
  updated: number;
  depleted: number;
  errors: string[];
  lotIds: string[];
  aggregates?: Record<string, any>;
}

export const DEFAULT_SHELF_LIFE_DAYS = 90;

/**
 * Standard shelf-life fallback defaults by primary category (in days).
 */
export const categoryDefaults: Record<string, number> = {
  'Dairy': 45,
  'Produce': 30,
  'Meat': 90,
  'Meat & Poultry': 90,
  'Beverages': 120,
  'Dry Goods': 180,
  'Frozen Foods': 180
};

/**
 * Resolves shelf-life days by category name with case-insensitivity and default fallback.
 */
export function getCategoryShelfLifeDays(category?: string): number {
  if (!category || typeof category !== 'string') {
    return DEFAULT_SHELF_LIFE_DAYS;
  }
  const trimmed = category.trim();
  if (categoryDefaults[trimmed] !== undefined) {
    return categoryDefaults[trimmed];
  }
  const lower = trimmed.toLowerCase();
  for (const [key, days] of Object.entries(categoryDefaults)) {
    if (key.toLowerCase() === lower) {
      return days;
    }
  }
  return DEFAULT_SHELF_LIFE_DAYS;
}

export interface RemainingShelfLifeOptions {
  expirationDate: Date;
  productionDate?: Date;
  category?: string;
  shelfLifeDays?: number;
  referenceDate?: Date;
}

/**
 * Calculates remaining shelf-life fraction bounded between 0.0 and 1.0.
 */
export function calculateRemainingShelfLife(options: RemainingShelfLifeOptions): number {
  const { expirationDate, productionDate, category, shelfLifeDays, referenceDate } = options;
  const today = referenceDate || new Date();
  const diffTime = expirationDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  let totalShelfDays = shelfLifeDays || getCategoryShelfLifeDays(category);
  if (productionDate) {
    const totalDiff = expirationDate.getTime() - productionDate.getTime();
    const calcDays = Math.ceil(totalDiff / (1000 * 60 * 60 * 24));
    if (calcDays > 0) {
      totalShelfDays = calcDays;
    }
  }

  if (totalShelfDays <= 0) {
    return 0.0;
  }

  return Math.min(1.0, Math.max(0.0, Number((daysRemaining / totalShelfDays).toFixed(4))));
}

/**
 * Generates a reproducible fallback SKU from an item description.
 * Sanitizes alphanumeric characters into uppercase hyphen-separated tokens,
 * or generates a deterministic hash SKU if no alphanumeric characters exist.
 */
export function generateFallbackSku(description?: string): string {
  if (!description || typeof description !== 'string') {
    return 'SKU-UNKNOWN';
  }

  const clean = description
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (clean.length > 0) {
    return clean;
  }

  const hash = crypto.createHash('sha256').update(description).digest('hex').substring(0, 8).toUpperCase();
  return `SKU-${hash}`;
}


/**
 * Resiliently parses a raw date string into a Date object or undefined.
 * Supports ISO-8601, MM/DD/YYYY, MM/DD/YY, DD-MM-YYYY, and YYYY-MM-DD.
 */
export function parseIngestionDate(rawDate?: string): Date | undefined {
  if (!rawDate || typeof rawDate !== 'string') {
    return undefined;
  }

  const trimmed = rawDate.trim();
  if (!trimmed || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'null') {
    return undefined;
  }

  // 1. Try ISO / standard Date parse first
  const isoParsed = new Date(trimmed);
  if (!isNaN(isoParsed.getTime())) {
    // If it looks like a slash or hyphen date, ensure standard month/day parsing didn't flip unexpectedly
    if (!trimmed.includes('/') && !trimmed.includes('-')) {
      return isoParsed;
    }
    // If it is standard ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return isoParsed;
    }
  }

  // 2. Delimited heuristics (slash or hyphen)
  const isHyphen = trimmed.includes('-');
  const isSlash = trimmed.includes('/');
  const parts = trimmed.split(/[\/\-]/);
  if (parts.length === 3) {
    const firstNum = parseInt(parts[0], 10);
    const secondNum = parseInt(parts[1], 10);
    const thirdNum = parseInt(parts[2], 10);

    if (isNaN(firstNum) || isNaN(secondNum) || isNaN(thirdNum)) {
      return undefined;
    }

    // Case A: YYYY-MM-DD or YYYY/MM/DD
    if (firstNum >= 1000) {
      const year = firstNum;
      const month = secondNum;
      const day = thirdNum;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const candidate = new Date(year, month - 1, day);
        if (!isNaN(candidate.getTime())) return candidate;
      }
      return undefined;
    }

    // Case B: thirdNum is year (YYYY or YY)
    const fullYear = thirdNum < 100 ? (thirdNum < 70 ? 2000 + thirdNum : 1900 + thirdNum) : thirdNum;
    if (fullYear < 1900 || fullYear > 2200) {
      return undefined;
    }

    // If firstNum > 12, it must be DD-MM-YYYY (day first)
    if (firstNum > 12 && firstNum <= 31 && secondNum >= 1 && secondNum <= 12) {
      const candidate = new Date(fullYear, secondNum - 1, firstNum);
      if (!isNaN(candidate.getTime())) return candidate;
    }

    // If secondNum > 12, it must be MM/DD/YYYY (month first)
    if (secondNum > 12 && secondNum <= 31 && firstNum >= 1 && firstNum <= 12) {
      const candidate = new Date(fullYear, firstNum - 1, secondNum);
      if (!isNaN(candidate.getTime())) return candidate;
    }

    // Disambiguation when both firstNum <= 12 and secondNum <= 12:
    // Hyphenated format convention: DD-MM-YYYY
    if (isHyphen && firstNum >= 1 && firstNum <= 31 && secondNum >= 1 && secondNum <= 12) {
      const candidate = new Date(fullYear, secondNum - 1, firstNum);
      if (!isNaN(candidate.getTime())) return candidate;
    }

    // Slash format convention: MM/DD/YYYY
    if (isSlash && firstNum >= 1 && firstNum <= 12 && secondNum >= 1 && secondNum <= 31) {
      const candidate = new Date(fullYear, firstNum - 1, secondNum);
      if (!isNaN(candidate.getTime())) return candidate;
    }
  }

  if (!isNaN(isoParsed.getTime())) {
    return isoParsed;
  }

  return undefined;
}
