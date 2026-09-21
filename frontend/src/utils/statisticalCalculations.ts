export type StatisticalOperation = 'percentage' | 'mean' | 'median' | 'mode';

export interface MetricResult {
  numericValue: number;
  formatted: string;
  details?: string;
}

export interface ColumnStatistics {
  count: number;
  sum: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  mode: number | null;
}

/**
 * Parses raw cell value into a clean number, stripping currency symbols, commas, percent signs.
 */
export function parseNumericValue(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  const cleanStr = String(val).replace(/[$€£,%\s]/g, '').trim();
  if (cleanStr === '') return null;
  const num = parseFloat(cleanStr);
  return isNaN(num) ? null : num;
}

/**
 * Extracts numeric values for a specific header column from a rawGrid table.
 */
export function extractColumnNumbers(
  rawGrid: string[][],
  columnHeader: string
): { values: number[]; columnIndex: number } | null {
  if (!rawGrid || rawGrid.length < 2) return null;

  const headers = rawGrid[0] || [];
  const colIdx = headers.indexOf(columnHeader);
  if (colIdx === -1) return null;

  const values: number[] = [];
  for (let i = 1; i < rawGrid.length; i++) {
    const row = rawGrid[i];
    if (row && row[colIdx] !== undefined) {
      const parsed = parseNumericValue(row[colIdx]);
      if (parsed !== null) {
        values.push(parsed);
      }
    }
  }

  if (values.length === 0) return null;
  return { values, columnIndex: colIdx };
}

/**
 * Computes a specific statistical metric for a given column.
 */
export function computeMetricForColumn(
  rawGrid: string[][],
  columnHeader: string,
  operation: StatisticalOperation
): MetricResult | null {
  const extracted = extractColumnNumbers(rawGrid, columnHeader);
  if (!extracted || extracted.values.length === 0) return null;

  const { values } = extracted;
  const count = values.length;
  const sum = values.reduce((acc, v) => acc + v, 0);

  switch (operation) {
    case 'mean': {
      const meanVal = sum / count;
      return {
        numericValue: Number(meanVal.toFixed(4)),
        formatted: meanVal.toFixed(2),
        details: `Mean of ${count} rows`,
      };
    }
    case 'median': {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(count / 2);
      const medianVal =
        count % 2 !== 0
          ? sorted[mid]
          : (sorted[mid - 1] + sorted[mid]) / 2;
      return {
        numericValue: Number(medianVal.toFixed(4)),
        formatted: medianVal.toFixed(2),
        details: `Median across ${count} rows`,
      };
    }
    case 'mode': {
      const freqMap: Record<number, number> = {};
      let maxFreq = 0;
      let modeVal = values[0];

      for (const val of values) {
        freqMap[val] = (freqMap[val] || 0) + 1;
        if (freqMap[val] > maxFreq) {
          maxFreq = freqMap[val];
          modeVal = val;
        }
      }

      return {
        numericValue: modeVal,
        formatted: `${modeVal.toFixed(2)} (${maxFreq}x)`,
        details: `Mode occurring ${maxFreq} times in ${count} rows`,
      };
    }
    case 'percentage': {
      return {
        numericValue: sum,
        formatted: `Sum: ${sum.toFixed(2)} (100% basis)`,
        details: `Sum total ${sum.toFixed(2)} across ${count} rows`,
      };
    }
    default:
      return null;
  }
}

/**
 * Calculates full statistical summary for a column.
 */
export function calculateColumnStatistics(
  rawGrid: string[][],
  columnHeader: string
): ColumnStatistics | null {
  const extracted = extractColumnNumbers(rawGrid, columnHeader);
  if (!extracted || extracted.values.length === 0) return null;

  const { values } = extracted;
  const count = values.length;
  const sum = values.reduce((acc, v) => acc + v, 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = Number((sum / count).toFixed(4));

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(count / 2);
  const median =
    count % 2 !== 0
      ? sorted[mid]
      : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(4));

  const freqMap: Record<number, number> = {};
  let maxFreq = 0;
  let mode: number | null = null;
  for (const v of values) {
    freqMap[v] = (freqMap[v] || 0) + 1;
    if (freqMap[v] > maxFreq) {
      maxFreq = freqMap[v];
      mode = v;
    }
  }

  return {
    count,
    sum,
    min,
    max,
    mean,
    median,
    mode,
  };
}
