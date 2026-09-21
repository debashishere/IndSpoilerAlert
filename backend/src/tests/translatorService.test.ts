import { translateAttributes, SemanticRule, computeGridAggregates } from '../services/translatorService';

describe('translatorService - Dynamic Data Translator Engine', () => {
  it('should translate unmapped CPG supplier attributes into normalized semantic attributes and preserve rawAttributes', () => {
    const rawInput = {
      'StorageTemp_C': '-18',
      'Kosher Status': 'YES',
      'Pallet TI/HI': '10x5',
      'Custom QA Note': 'Passed sensory check'
    };

    const result = translateAttributes(rawInput);

    expect(result.attributes).toBeDefined();
    expect(result.rawAttributes).toEqual(rawInput);
    expect(result.attributes.tempMinF).toBeCloseTo(-0.4, 1);
    expect(result.attributes.certifications).toEqual(expect.arrayContaining(['kosher']));
    expect(result.attributes.palletTiHi).toBe('10x5');
    expect(result.attributes['Custom QA Note']).toBe('Passed sensory check');
  });

  it('should apply explicit declarative SemanticRule transformations without any many-to-many connections', () => {
    const rawInput = {
      'Storage_Temperature': '-10',
      'Is_FDA_Compliant': 'true',
      'Case_Pack_Weight': '25.50 lbs',
      'Allergen_List': 'dairy, soy, wheat'
    };

    const rules: SemanticRule[] = [
      { sourceKey: 'Storage_Temperature', targetKey: 'minStorageTempF', transform: 'celsiusToFahrenheit' },
      { sourceKey: 'Is_FDA_Compliant', targetKey: 'fdaCompliant', transform: 'toBoolean' },
      { sourceKey: 'Case_Pack_Weight', targetKey: 'packWeightLbs', transform: 'toNumber' },
      { sourceKey: 'Allergen_List', targetKey: 'allergens', transform: 'toStringList' }
    ];

    const result = translateAttributes(rawInput, rules);

    expect(result.attributes.minStorageTempF).toBe(14);
    expect(result.attributes.fdaCompliant).toBe(true);
    expect(result.attributes.packWeightLbs).toBe(25.5);
    expect(result.attributes.allergens).toEqual(['dairy', 'soy', 'wheat']);
    expect(result.rawAttributes).toEqual(rawInput);
  });

  it('should compute grid statistical aggregations and apply mean, median, mode, and percentage transforms', () => {
    const rawGrid = [
      ['Item', 'GrossRevenue', 'Cases'],
      ['Apples', '$100.00', '10'],
      ['Bananas', '$200.00', '20'],
      ['Cherries', '$100.00', '30'],
      ['Dates', '$400.00', '40']
    ];

    const rules: SemanticRule[] = [
      { sourceKey: 'GrossRevenue', targetKey: 'revenueMean', transform: 'mean' },
      { sourceKey: 'GrossRevenue', targetKey: 'revenueMedian', transform: 'median' },
      { sourceKey: 'GrossRevenue', targetKey: 'revenueMode', transform: 'mode' },
      { sourceKey: 'GrossRevenue', targetKey: 'revenueSharePct', transform: 'percentage' }
    ];

    const aggregates = computeGridAggregates(rawGrid, rules);

    // Verify raw aggregate stats: sum=800, mean=200, median=150, mode=100
    expect(aggregates['GrossRevenue']).toBeDefined();
    expect(aggregates['GrossRevenue'].sum).toBe(800);
    expect(aggregates['GrossRevenue'].mean).toBe(200);
    expect(aggregates['GrossRevenue'].median).toBe(150);
    expect(aggregates['GrossRevenue'].mode).toBe(100);

    // Apply for row 1: $100.00 -> 12.5% of total
    const row1Input = { Item: 'Apples', GrossRevenue: '$100.00', Cases: '10' };
    const row1Result = translateAttributes(row1Input, rules, aggregates);

    expect(row1Result.attributes.revenueMean).toBe(200);
    expect(row1Result.attributes.revenueMedian).toBe(150);
    expect(row1Result.attributes.revenueMode).toBe(100);
    expect(row1Result.attributes.revenueSharePct).toBe(12.5);
    expect(row1Result.rawAttributes).toEqual(row1Input);
  });
});


