export interface SemanticRule {
  sourceKey: string;
  targetKey: string;
  transform?: 'celsiusToFahrenheit' | 'toBoolean' | 'toNumber' | 'toStringList';
}

export interface TranslatedAttributes {
  attributes: Record<string, any>;
  rawAttributes: Record<string, any>;
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
  rules: SemanticRule[] = []
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
        const num = parseFloat(String(rawVal).replace(/[^0-9.-]+/g, ''));
        attributes[rule.targetKey] = isNaN(num) ? rawVal : num;
      } else if (rule.transform === 'toStringList') {
        attributes[rule.targetKey] = String(rawVal)
          .split(/[,;]/)
          .map(s => s.trim())
          .filter(Boolean);
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
