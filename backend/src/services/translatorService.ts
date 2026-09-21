export interface SemanticRule {
  sourceKey: string;
  targetKey: string;
  transform?:
    | 'celsiusToFahrenheit'
    | 'toBoolean'
    | 'toNumber'
    | 'toStringList'
    | 'percentage'
    | 'mean'
    | 'median'
    | 'mode';
}

export interface TranslatedAttributes {
  attributes: Record<string, any>;
  rawAttributes: Record<string, any>;
}

export interface ColumnStats {
  sum: number;
  mean: number;
  median: number;
  mode: number;
  count: number;
}

export function parseNumericValue(val: any): number | undefined {
  if (typeof val === 'number') return isNaN(val) ? undefined : val;
  if (val === null || val === undefined) return undefined;
  const match = String(val).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const num = parseFloat(match[0]);
  return isNaN(num) ? undefined : num;
}

export function computeGridAggregates(
  rawGrid: string[][] = [],
  rules: SemanticRule[] = []
): Record<string, ColumnStats> {
  const result: Record<string, ColumnStats> = {};
  if (!Array.isArray(rawGrid) || rawGrid.length < 2) return result;

  const headers = (rawGrid[0] || []).map(h => String(h || '').trim());
  const statRules = (rules || []).filter(r =>
    ['percentage', 'mean', 'median', 'mode'].includes(r.transform || '')
  );

  if (statRules.length === 0) return result;

  const neededColumns = new Set(statRules.map(r => r.sourceKey));

  for (const colName of neededColumns) {
    const colIdx = headers.indexOf(colName);
    if (colIdx === -1) continue;

    const values: number[] = [];
    for (let r = 1; r < rawGrid.length; r++) {
      const row = rawGrid[r];
      if (!row) continue;
      const cellVal = row[colIdx];
      const parsed = parseNumericValue(cellVal);
      if (parsed !== undefined) {
        values.push(parsed);
      }
    }

    if (values.length === 0) {
      result[colName] = { sum: 0, mean: 0, median: 0, mode: 0, count: 0 };
      continue;
    }

    const count = values.length;
    const sum = Number(values.reduce((acc, v) => acc + v, 0).toFixed(4));
    const mean = Number((sum / count).toFixed(4));

    // Median
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
      ? sorted[mid]
      : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(4));

    // Mode (most frequent)
    const freqMap = new Map<number, number>();
    let maxFreq = 0;
    let modeVal = sorted[0];
    for (const v of sorted) {
      const f = (freqMap.get(v) || 0) + 1;
      freqMap.set(v, f);
      if (f > maxFreq) {
        maxFreq = f;
        modeVal = v;
      }
    }

    result[colName] = {
      sum,
      mean,
      median,
      mode: modeVal,
      count
    };
  }

  return result;
}

function normalizeHeaderKey(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function convertCelsiusToFahrenheit(celsiusStr: string | number): number | undefined {
  const num = typeof celsiusStr === 'number' ? celsiusStr : parseFloat(String(celsiusStr));
  if (isNaN(num)) return undefined;
  return Number(((num * 9) / 5 + 32).toFixed(2));
}

function parseBooleanValue(val: any): boolean {
  if (typeof val === 'boolean') return val;
  const str = String(val).trim().toLowerCase();
  return str === 'yes' || str === 'true' || str === '1' || str === 'y';
}

/**
 * Deep module: transforms heterogeneous raw supplier attributes into canonical semantic attributes
 * while preserving pristine rawAttributes for auditability.
 * Zero many-to-many join overhead.
 */
export function translateAttributes(
  rawInput: Record<string, any> = {},
  rules: SemanticRule[] = [],
  aggregates?: Record<string, ColumnStats>
): TranslatedAttributes {
  const safeInput = rawInput || {};
  const safeRules = Array.isArray(rules) ? rules : [];
  const attributes: Record<string, any> = {};
  const rawAttributes: Record<string, any> = { ...safeInput };

  // Track processed source keys to avoid duplicate insertion
  const processedKeys = new Set<string>();

  // 1. First evaluate explicit supplier SemanticTransformationRules
  for (const rule of safeRules) {
    if (safeInput[rule.sourceKey] !== undefined) {
      const rawVal = safeInput[rule.sourceKey];
      processedKeys.add(rule.sourceKey);

      if (rule.transform === 'celsiusToFahrenheit') {
        const converted = convertCelsiusToFahrenheit(rawVal);
        if (converted !== undefined) attributes[rule.targetKey] = converted;
      } else if (rule.transform === 'toBoolean') {
        attributes[rule.targetKey] = parseBooleanValue(rawVal);
      } else if (rule.transform === 'toNumber') {
        const num = parseNumericValue(rawVal);
        attributes[rule.targetKey] = num !== undefined ? num : rawVal;
      } else if (rule.transform === 'toStringList') {
        attributes[rule.targetKey] = String(rawVal)
          .split(/[,;]/)
          .map(s => s.trim())
          .filter(Boolean);
      } else if (rule.transform === 'mean') {
        attributes[rule.targetKey] = aggregates?.[rule.sourceKey]?.mean ?? 0;
      } else if (rule.transform === 'median') {
        attributes[rule.targetKey] = aggregates?.[rule.sourceKey]?.median ?? 0;
      } else if (rule.transform === 'mode') {
        attributes[rule.targetKey] = aggregates?.[rule.sourceKey]?.mode ?? 0;
      } else if (rule.transform === 'percentage') {
        const totalSum = aggregates?.[rule.sourceKey]?.sum;
        const num = parseNumericValue(rawVal);
        if (totalSum && totalSum > 0 && num !== undefined) {
          attributes[rule.targetKey] = Number(((num / totalSum) * 100).toFixed(4).replace(/\.?0+$/, ''));
        } else {
          attributes[rule.targetKey] = 0;
        }
      } else {
        attributes[rule.targetKey] = rawVal;
      }
    }
  }

  // 2. Next apply CPG Domain Ontology alias normalizer for remaining unmapped keys
  const certificationsSet = new Set<string>();

  for (const [key, rawVal] of Object.entries(safeInput)) {

    if (processedKeys.has(key)) continue;

    const normKey = normalizeHeaderKey(key);

    if (normKey.includes('storagetempc') || normKey.includes('tempc') || normKey.includes('mintempc')) {
      const converted = convertCelsiusToFahrenheit(rawVal);
      if (converted !== undefined) {
        attributes.tempMinF = converted;
        processedKeys.add(key);
      }
    } else if (normKey.includes('kosher')) {
      if (parseBooleanValue(rawVal)) {
        certificationsSet.add('kosher');
      }
      processedKeys.add(key);
    } else if (normKey.includes('organic')) {
      if (parseBooleanValue(rawVal)) {
        certificationsSet.add('organic');
      }
      processedKeys.add(key);
    } else if (normKey.includes('halal')) {
      if (parseBooleanValue(rawVal)) {
        certificationsSet.add('halal');
      }
      processedKeys.add(key);
    } else if (normKey === 'pallettihi' || normKey === 'tihi') {
      attributes.palletTiHi = String(rawVal).trim();
      processedKeys.add(key);
    } else {
      // Retain custom unmapped attribute
      attributes[key] = rawVal;
    }
  }

  if (certificationsSet.size > 0) {
    const existingCerts = Array.isArray(attributes.certifications) ? attributes.certifications : [];
    attributes.certifications = Array.from(new Set([...existingCerts, ...certificationsSet]));
  }

  return {
    attributes,
    rawAttributes
  };
}
